var Pool = require("../../lib").Pool,
    concurrency = require("../../lib").concurrency,
    pool;


pool = new Pool(4);

concurrency
    .map(Array.apply(null, new Array(10)), pool, function() {
        return Math.floor(Math.random() * (10 + 1));
    })
    .then(function(result) {
        console.log('result', result);
    });