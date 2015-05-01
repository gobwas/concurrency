var inherits = require("inherits-js"),
    _        = require("lodash"),
    handler  = require('./trait/handler'),
    Pool;

/**
 * @abstract
 * @class Pool
 * @constructor
 */
Pool = function(length, options) {
    assert(_.isNumber(length), "Length is expected to be a number");

    this.length = length;
    this.options = _.extend({}, this.constructor.DEFAULTS, options || {});
};

Pool.prototype = _.extend({}, handler, {
    constructor: Pool,

    /**
     * @abstract
     */
    call: function(method, params) {
        throw new TypeError("Method 'call' must be implemented");
    }
});

Pool.extend = function(prots, statics) {
    return inherits(this, prots, statics);
};

Pool.DEFAULTS = {};

module.exports = Pool;