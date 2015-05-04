var EventEmitter = require("events").EventEmitter,
    handler  = require("./trait/handler"),
    inherits = require('inherits-js'),
    assert   = require("assert"),
    _        = require('lodash'),
    Executable;


/**
 * @class Executable
 * @constructor
 * @abstract
 *
 * @param {Object} [options]
 */
Executable = inherits(EventEmitter,
    _.extend({}, handler, {
        constructor: function(options) {
            EventEmitter.prototype.constructor.call(this);
            this.options = _.extend({}, this.constructor.DEFAULTS, options);

            this.initialize();
        },

        /**
         *
         */
        initialize: function() {
            //
        },

        /**
         * @abstract
         */
        call: function(method, params) {
            throw new TypeError("Method 'call' must be implemented");
        }
    }),

    {
        DEFAULTS: {}
    }
);


Executable.extend = function(proto, statics) {
    return inherits(this, proto, statics);
};

module.exports = Executable;