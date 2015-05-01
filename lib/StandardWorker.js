var Worker = require("./Worker"),
    cp     = require("child_process"),
    _      = require("lodash"),
    Promise = require('bluebird'),
    communication = require("./trait/communication"),
    StandardWorker;

/**
 * StandardWorker
 *
 * @class
 * @extends Worker
 */
StandardWorker = Worker.extend(
    /**
     * @lends StandardWorker.prototype
     */
    {
        constructor: function() {
            var self = this;

            Worker.prototype.constructor.apply(this, arguments);

            // pending calls
            this.pending = [];
            this.dead = false;

            this.child = cp.fork(path);
            this.child.setMaxListeners(9999);

            communication.listen(this.child, function(method, params, done, fail) {
                switch (method) {
                    case ".ready": {
                        self.ready = true;
                        self.emit('ready');
                        done();
                        break;
                    }

                    case ".dead": {
                        self.dead = true;
                        self.emit('dead');
                        done();
                        break;
                    }

                    default: {
                        self.handle(method, params)
                            .then(done, fail);
                    }
                }
            });
        },

        call: function(method, params) {
            var self = this,
                id;

            self.pending.push({
                id: (id = _.uniqueId('call')),
                method: method
            });

            return communication.call(self.child, method, params)
                .then(function(result) {
                    _.remove(self.pending, function(def) {
                        return def.id === id;
                    });

                    return result;
                });
        },

        ping: function() {
            return communication.call(this.child, ".ping");
        },

        kill: function(timeout) {
            var self = this;

            timeout = timeout || 5000;

            if (this.dead) {
                return Promise.resolve();
            }

            return new Promise(function(resolve) {
                var kill, timeoutID;

                kill = _.once(function() {
                    clearTimeout(timeoutID);
                    self.worker.kill();
                    self.worker.emit("died");
                    self.dead = true;
                    resolve();
                });

                timeoutID = setTimeout(kill, timeout);

                communication.call(self.child, ".kill").then(kill, kill);
            });
        },

        getMemoryUsage: function() {
            return communication.call(this.child, ".memory");
        }
    }
);

module.exports = StandardWorker;