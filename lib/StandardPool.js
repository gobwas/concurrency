var Pool    = require("./Pool"),
    Promise = require('bluebird'),
    uuid    = require('uuid'),
    _       = require("lodash"),
    handler = require("./trait/handler"),
    async   = require("async"),

    StandardPool;

/**
 * StandardPool
 *
 * @class
 * @extends Pool
 */
StandardPool = Pool.extend(
    /**
     * @lends StandardPool.prototype
     */
    _.extend({}, {

        constructor: function() {
            Pool.prototype.constructor.apply(this, arguments);

            this.pool = [];
            this.handler = {};
        },

        initialize: function() {
            var self = this,
                creation;

            creation = Promise.all(_.map(Array.apply(null, new Array(this.length)), function(i) {
                return self.createWorker();
            }));

            [ 'SIGINT', 'SIGTERM' ]
                .forEach(function(signal) {
                    process.on(signal, function() {
                        self.stopped = true;

                        creation
                            .then(function() {
                                return Promise.all(self.pool.map(function(worker) {
                                    return new RSVP.Promise(function(resolve, reject) {
                                        if (worker.dead) {
                                            resolve();
                                        }

                                        worker.on('dead', resolve);

                                        setTimeout(reject, 5000);
                                    });
                                }));
                            })
                            .finally(function() {
                                return process.exit(130);
                            });
                    });
                });

            return creation;
        },

        call: function(method, params) {
            assert(_.isString(method));
            assert(_.isUndefined(params) || _.isArray(params));

            return this.getWorker()
                .then(function(worker) {
                    return worker.call(method, params);
                });
        },

        getWorker: function() {
            var self = this;

            return new Promise(function(resolve, reject) {
                var found, iteration;

                iteration = 0;

                async.whilst(
                    function() {
                        return !found && iteration < 256
                    },
                    function(done) {
                        async.detect(
                            self.pool,
                            function(worker, next) {
                                process.nextTick(function() {
                                    next(worker.isFree());
                                })
                            },
                            function(worker) {
                                iteration++;
                                found = worker;
                                setTimeout(done, 1000);
                            }
                        );
                    },
                    function(err) {
                        if (err) {
                            reject(err);
                            return;
                        }

                        if (found) {
                            resolve(found);
                            return;
                        }

                        reject(new Error("Could not get worker"));
                    }
                );
            });
        },

        createWorker: function(options) {
            var self = this;

            return new Promise(function(resolve, reject) {
                var worker;

                worker = new Worker(uuid("worker"), options);

                _.forEach(self.handler, function(handler, method) {
                    worker.setHandler(method, handler);
                });

                self.pool.push(worker);

                worker.on('ready', function() {
                    resolve(worker);
                    self.watch(worker);
                });

                worker.on('error', reject);
            });
        },

        watch: function(worker) {
            var self = this,
                alive;

            alive = true;

            // Infinite ping worker
            // If it will not respond for options.timeout - he will be killed, and new worker will created.
            async.whilst(
                function() {
                    return alive && !worker.dead;
                },
                function(next) {
                    var killTimeoutID,
                        kill;

                    next = _.once(next);

                    kill = _.once(function() {
                        worker.kill();
                        alive = false;
                        next();
                    });

                    killTimeoutID = setTimeout(kill, self.options.kill_timeout);

                    worker.ping()
                        .then(function() {
                            clearTimeout(killTimeoutID);
                            setTimeout(next, self.options.ping);
                        })
                        .catch(function() {
                            kill();
                        });
                },
                function() {
                    console.log('dead');
                    if (!self.stopped) {
                        console.log('restart');
                        self.createWorker();
                    }
                }
            );
        }
    }),

    {
        DEFAULTS: {
            ping:         10000,
            kill_timeout: 60000,
            kill_after:   3
        }
    }
);

module.exports = StandardPool;