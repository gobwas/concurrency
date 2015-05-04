var Executable = require("./Executable"),
    Promise    = require("bluebird"),
    uuid       = require("uuid"),
    _          = require("lodash"),
    communication = require("./trait/communication"),
    StandardExecutable;

/**
 * StandardExecutable
 *
 * @class
 * @extends Executable
 */
StandardExecutable = Executable.extend(
    /**
     * @lends StandardExecutable.prototype
     */
    {
        initialize: function() {
            var self = this;

            [ 'SIGINT', 'SIGUSR2', 'SIGTERM' ]
                .forEach(function(signal) {
                    process.on(signal, function() {
                        self.perish();
                    });
                });

            communication.listen(process, function(method, params, done, fail) {
                switch (method) {
                    case ".memory": {
                        done(process.memoryUsage()['rss']);
                        break;
                    }

                    case ".ping": {
                        done();
                        break;
                    }

                    case ".kill": {
                        self.perish().then(done, fail);
                        break;
                    }

                    default: {
                        self.handle(method, params).then(done, fail);
                        break;
                    }
                }
            });

            return this.call(".ready");
        },

        call: function(method, params) {
            return communication.call(process, method, params);
        },

        /**
         * @private
         * @param {number} [signal]
         */
        perish: function(signal) {
            var self = this,
                perishing;

            signal = signal || 0;

            perishing = [];

            function perish(pending) {
                perishing.push(pending);
            }

            this.addListener("perish", perish);
            this.emit("kill");

            return new Promise(function(resolve, reject) {
                process.nextTick(function() {
                    self.removeListener("perish", perish);

                    Promise
                        .all(perishing)
                        .then(resolve)
                        .catch(reject)
                        .finally(function() {
                            process.nextTick(function() {
                                process.exit(signal);
                            });

                            return self.call(".dead", [ signal ]);
                        });
                });
            });
        }
    }
);

module.exports = StandardExecutable;