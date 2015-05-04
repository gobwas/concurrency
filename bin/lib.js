var Executable = require("../lib").Executable,
    Promise    = require("bluebird"),
    vm         = require("vm"),
    _          = require("lodash"),
    exec, tpl;

exec = new Executable();

tpl = _.template("var <%= name %> = <%= code %>; <%= name %>.apply(null, <%= args %>);");

exec.setHandler('func', function(code, args) {
    var script, match, name;

    match = code.match(/function\s?([^\(\)]*)\s?/i);
    if (!(name = match[1])) {
        name = "f";
    }

    script = new vm.Script(tpl({
        name: name,
        code: code,
        args: JSON.stringify(args)
    }));

    return Promise.resolve(script.runInNewContext());
});