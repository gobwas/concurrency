var _ = require("lodash"),
    assert = require("assert"),
    Promise = require("bluebird");

module.exports = {
    setHandler: function(method, handler) {
        assert(_.isString(method), "Method is expected to be a string");
        assert(_.isFunction(handler), "Handler is expected");
        assert(_.isUndefined(this.handler[method]), "Handler for method '" + method + "' is already set");

        this.handler[method] = handler;

        return this;
    },

    unsetHandler: function(method) {
        delete this.handler[method];
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

        if (!_.isFunction(handler = this.handler[method])) {
            err = new Error("Method not found");
            err.code = -32601;

            return Promise.reject(err)
        }

        try {
            return Promise.resolve(handler.apply(null, params))
        } catch (err) {
            return Promise.reject(err);
        }
    }
};