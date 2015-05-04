var _ = require("lodash"),
    assert = require("assert"),
    Promise = require("bluebird");

module.exports = {
    setHandler: function(method, handler) {
        this.setupDictionary();

        assert(_.isString(method), "Method is expected to be a string");
        assert(_.isFunction(handler), "Handler is expected");
        assert(_.isUndefined(this._handler[method]), "Handler for method '" + method + "' is already set");

        this._handler[method] = handler;

        return this;
    },

    unsetHandler: function(method) {
        this.setupDictionary();

        delete this._handler[method];

        return this;
    },

    /**
     * @private
     * @param method
     * @param params
     * @returns {*}
     */
    handle: function(method, params) {
        var handler, err;

        this.setupDictionary();

        if (!_.isFunction(handler = this._handler[method])) {
            err = new Error("Method not found");
            err.code = -32601;

            return Promise.reject(err)
        }

        try {
            return Promise.resolve(handler.apply(null, params))
        } catch (err) {
            return Promise.reject(err);
        }
    },

    setupDictionary: function() {
        this._handler = this._handler || {};
    }
};