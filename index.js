var operation = require('plumber').operation;
var Report    = require('plumber').Report;

var extend = require('extend');
var traceur = require('traceur');

function transpileResource(options, resource) {
    var config = {file: resource.filename()};

    try {
        output = traceur.compile(resource.data(), extend(options || {}, {
            filename: resource.filename(),
            sourceMap: true
        }), resource.path()._dirname + '/' + resource.filename());

        return resource.withData(output);
    }
    catch (e) {
        return new Report({
            resource: resource,
            type: 'error',
            success: false,
            errors: e.map(function (err) {
                var details = err.match(/^(.+):(\d+):(\d+): (.*)/);
                return {
                    // filename: details[1],
                    line:     Number(details[2]),
                    column:   Number(details[3]),
                    message:  details[4]
                };
            })
        });
    }
}

function traceurOp(options) {
    // FIXME: options?
    return operation(function(resources) {
        return resources.map(transpileResource.bind(this, options));
    });
};

module.exports = {
    toAmd:      traceurOp.bind(this, {modules: 'amd', moduleName: true}),
    toCommonJs: traceurOp.bind(this, {modules: 'commonjs'})
};
