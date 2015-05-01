var Promise = require("bluebird"),
    uuid    = require("uuid");

module.exports = {
    listen: function(process, handler) {
        process.on("message", function(message) {
            var id, method, params;

            id     = message.id;
            method = message.method;
            params = message.params;

            function done(data) {
                process.send({
                    id:     id,
                    result: data
                });
            }

            function failed(err) {
                process.send({
                    id: id,
                    error: {
                        code:    err.code || -1,
                        message: err.message || "Unknown error"
                    }
                });
            }

            handler(method, params, done, failed);
        });
    },

    call: function(process, method, params) {
        params = params || [];

        return new Promise(function(resolve, reject) {
            var id;

            id = uuid();

            function listener(message) {
                var err;

                if (message.id === id) {
                    try {
                        process.removeListener("message", listener);
                    } catch (err) {
                        console.log(err.stack);
                    }

                    if (message.error) {
                        err = new Error(message.error.message);
                        err.code = message.error.code;
                        reject(err);
                    } else {
                        resolve(message.result);
                    }
                }
            }

            process.addListener("message", listener);

            process.send({
                id:     id,
                method: method,
                params: params
            });
        });
    }
};