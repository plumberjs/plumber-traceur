var operation = require('plumber').operation;
var Report    = require('plumber').Report;
var Rx        = require('plumber').Rx;
var SourceMap = require('mercator').SourceMap;

var extend = require('extend');

var traceur = require('traceur');

function transpile(resource, options) {
    return Rx.Observable.create(function(observer) {
        var output;
	try {
            var config = {file: resource.filename()};
	    output = traceur.compile(resource.data(), extend(options || {}, {
                filename: resource.filename(),
                sourceMap: true
            }));

	    if (output.errors.length === 0) {
                // Successful!
                observer.onNext(output);
            } else {
                var errors = output.errors.map(function(err) {
                    // Annoyingly, error is provided as a string
                    var details = err.match(/^(.+):(\d+):(\d+): (.*)/);
                    return {
                        filename: details[1],
                        line:     Number(details[2]),
                        column:   Number(details[3]),
                        message:  details[4]
                    };
                });
                observer.onError(errors);
            }
	} catch (err) {
            // FIXME: map to error structure?
            observer.onError([err]);
	} finally {
            observer.onCompleted();
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
                }).catch(function(errors) {
                    var errorReports = errors.map(function(error) {
                        return new Report({
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
                    });
                    return Rx.Observable.fromArray(errorReports);
                });
            });
        });
    };
};

module.exports = {
    toAmd:      traceurOp({modules: 'amd', moduleName: true}),
    toCommonJs: traceurOp({modules: 'commonjs'})
};
