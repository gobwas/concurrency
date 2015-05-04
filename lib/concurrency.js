var Promise = require("bluebird"),
    uuid    = require("uuid");

module.exports = {
    map: function(list, pool, iterator) {
        var mapping;

        mapping = list.map(function(item, index) {
            return pool.call('func', [ iterator.toString(), [ item, index, list ] ]);
        });

        return Promise.all(mapping);
    }
};