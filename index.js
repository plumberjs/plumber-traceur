var operation = require('plumber').operation;
var Report    = require('plumber').Report;
var SourceMap = require('mercator').SourceMap;

var highland = require('highland');
var extend = require('extend');

var traceur = require('traceur');

function transpile(resource, options) {
    return highland(function(push, next) {
        var output;
	try {
            var config = {file: resource.filename()};
	    output = traceur.compile(resource.data(), extend(options || {}, {
                filename: resource.filename(),
                sourceMap: true
            }));

	    if (output.errors.length === 0) {
                // Successful!
                push(null, output);
            } else {
                output.errors.forEach(function(err) {
                    // Annoyingly, error is provided as a string
                    var details = err.match(/^(.+):(\d+):(\d+): (.*)/);
	            push({
                        filename: details[1],
                        line:     Number(details[2]),
                        column:   Number(details[3]),
                        message:  details[4]
                    }, null);
                });
            }
	} catch (err) {
	    push(err, null);
	} finally {
            push(null, highland.nil);
        }
    });
}

function traceurOp(options) {
    // FIXME: options?
    return function() {
        return operation(function(resources) {
            return resources.flatMap(function(resource) {
                return transpile(resource, options).map(function(output) {
                    // TODO: remap on input source map
                    var sourceMap = SourceMap.fromMapData(output.sourceMap);
                    return resource.withData(output.js, sourceMap);
                }).errors(function(error, push) {
                    var errorReport = new Report({
                        resource: resource,
                        type: 'error', // FIXME: ?
                        success: false,
                        errors: [{
                            column:  error.column,
                            line:    error.line,
                            message: error.message
                            // No context
                        }]
                    });
                    push(null, errorReport);
                });
            });
        });
    };
};

module.exports = {
    toAmd:      traceurOp({modules: 'amd', moduleName: true}),
    toCommonJs: traceurOp({modules: 'commonjs'})
};
