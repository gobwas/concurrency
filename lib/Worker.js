var inherits = require("inherits-js"),
    EventEmitter = require("events").EventEmitter,
    handler = require('./trait/handler'),
    _        = require("lodash"),
    Worker;

/**
 * @abstract
 * @class Worker
 * @constructor
 */
Worker = inherits(EventEmitter, _.extend({}, handler, {
    constructor: function(id) {
        EventEmitter.prototype.constructor.call(this);
        this.id = id;
    },

    /**
     * @abstract
     */
    call: function(method, params) {
        throw new TypeError("Method 'call' must be implemented");
    },

    /**
     * @abstract
     */
    ping: function() {
        throw new TypeError("Method 'ping' must be implemented");
    },

    /**
     * @abstract
     */
    kill: function(signal, timeout) {
        throw new TypeError("Method 'kill' must be implemented");
    },

    /**
     * @abstract
     */
    getMemoryUsage: function() {
        throw new TypeError("Method 'getMemoryUsage' must be implemented");
    },

    /**
     *
     * @returns {boolean}
     */
    isFree: function() {
        return this.getLoad() === 0;
    },

    /**
     *
     * @returns {number}
     */
    getLoad: function() {
        return this.pending.length;
    }
}));

Worker.extend = function(prots, statics) {
    return inherits(this, prots, statics);
};

module.exports = Worker;