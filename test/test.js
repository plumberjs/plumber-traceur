var chai = require('chai');
chai.should();

var SourceMapConsumer = require('source-map').SourceMapConsumer;
var fs = require('fs');


var runOperation = require('plumber-util-test').runOperation;

var Resource = require('plumber').Resource;
var Report = require('plumber').Report;
var SourceMap = require('mercator').SourceMap;

var traceur = require('..');

function createResource(params) {
    return new Resource(params);
}


describe('traceur', function(){
    // var supervisor;

    // beforeEach(function() {
    //     supervisor = new Supervisor();
    //     supervisor.dependOn = sinon.spy();
    // });


    it('should be a function', function(){
        traceur.should.be.a('function');
    });

    it('should return a function', function(){
        traceur().should.be.a('function');
    });

    // TODO: test options

    describe('when passed a ES6 file', function() {
        var transformedResources;
        var mainData = fs.readFileSync('test/fixtures/main.js').toString();

        beforeEach(function() {
            transformedResources = runOperation(traceur(), [
                createResource({path: 'test/fixtures/main.js', type: 'javascript', data: mainData})
            ]).resources;
        });

        it('should return a single resource with the same filename', function(done){
            return transformedResources.toArray(function(resources) {
                resources.length.should.equal(1);
                resources[0].filename().should.equal('main.js');
                done();
            });
        });

        it('should return a resource with legacy JS data', function(done){
            var outputMain = fs.readFileSync('test/fixtures/main.compiled.js').toString();
            return transformedResources.toArray(function(resources) {
                resources[0].data().should.equal(outputMain);
                done();
            });
        });

        it.skip('should return a resource with a source map with correct properties', function(done){
            return transformedResources.toArray(function(resources) {
                var sourceMap = resources[0].sourceMap();
                sourceMap.file.should.equal('main.css');
                sourceMap.sources.should.deep.equal([
                    'test/fixtures/other.traceur',
                    'test/fixtures/sub/helper.traceur',
                    'test/fixtures/plain.css',
                    'test/fixtures/main.traceur'
                ]);
                sourceMap.sourcesContent.should.deep.equal([
                    "@w: 10px;\n\n.other {\n    float: left;\n\n    .nested {\n        padding: @w;\n    }\n}",
                    ".child {\n    .parent & {\n        font-size: 10px;\n    }\n}\n",
                    ".plain {\n    color: red;\n}\n",
                    "@import \"other\";\n@import \"sub/helper\";\n@import (traceur) \"plain.css\";\n\nbody {\n    margin: 0;\n}"
                ]);

                done();
            });
        });

        it.skip('should return a resource with a source map with correct mappings', function(done){
            return transformedResources.toArray(function(resources) {
                var map = new SourceMapConsumer(resources[0].sourceMap());

                /*
              1  .other {
              2    float: left;
              3  }
              4  .other .nested {
              5    padding: 10px;
              6  }
              7  .parent .child {
              8    font-size: 10px;
              9  }
             10  .plain {
             11    color: red;
             12  }
             13  body {
             14    margin: 0;
             15  }
                 */
                map.originalPositionFor({line: 1, column: 0}).should.deep.equal({
                    source: 'test/fixtures/other.traceur',
                    line: 3,
                    column: 0,
                    name: null
                });
                map.originalPositionFor({line: 2, column: 2}).should.deep.equal({
                    source: 'test/fixtures/other.traceur',
                    line: 4,
                    column: 4,
                    name: null
                });
                map.originalPositionFor({line: 5, column: 2}).should.deep.equal({
                    source: 'test/fixtures/other.traceur',
                    line: 7,
                    column: 8,
                    name: null
                });
                map.originalPositionFor({line: 8, column: 2}).should.deep.equal({
                    source: 'test/fixtures/sub/helper.traceur',
                    line: 3,
                    column: 8,
                    name: null
                });
                map.originalPositionFor({line: 10, column: 0}).should.deep.equal({
                    source: 'test/fixtures/plain.css',
                    line: 1,
                    column: 0,
                    name: null
                });
                map.originalPositionFor({line: 11, column: 2}).should.deep.equal({
                    source: 'test/fixtures/plain.css',
                    line: 2,
                    column: 4,
                    name: null
                });
                map.originalPositionFor({line: 13, column: 0}).should.deep.equal({
                    source: 'test/fixtures/main.traceur',
                    line: 5,
                    column: 0,
                    name: null
                });
                map.originalPositionFor({line: 14, column: 2}).should.deep.equal({
                    source: 'test/fixtures/main.traceur',
                    line: 6,
                    column: 4,
                    name: null
                });

                done();
            });
        });
    });

    // describe('when passed a traceur file with a source map', function() {
    //     var transformedResources;
    //     var mainData = fs.readFileSync('test/fixtures/concatenated.less').toString();
    //     var mainMapData = SourceMap.fromMapData(fs.readFileSync('test/fixtures/concatenated.less.map').toString());

    //     beforeEach(function() {
    //         transformedResources = runOperation(less(), [
    //             createResource({path: 'test/fixtures/concatenated.less', type: 'less',
    //                             data: mainData, sourceMap: mainMapData})
    //         ]).resources;
    //     });

    //     it('should return a resource with a source map with correct properties from the input source map', function(done){
    //         return transformedResources.toArray(function(resources) {
    //             var sourceMap = resources[0].sourceMap();

    //             sourceMap.file.should.equal('concatenated.css');
    //             sourceMap.sources.should.deep.equal(mainMapData.sources);
    //             sourceMap.sourcesContent.should.deep.equal(mainMapData.sourcesContent);
    //             done();
    //         });
    //     });

    //     it('should remap mappings based on the input source map', function(done) {
    //         return transformedResources.toArray(function(resources) {
    //             var map = new SourceMapConsumer(resources[0].sourceMap());

    //             /*
    //            1 .one p {
    //            2   border: 1;
    //            3 }
    //            4 .two ul {
    //            5   margin: 2px;
    //            6 }
    //              */
    //             map.originalPositionFor({line: 1, column: 0}).should.deep.equal({
    //                 source: 'test/fixtures/1.less',
    //                 line: 1,
    //                 column: 0,
    //                 name: null
    //             });
    //             map.originalPositionFor({line: 2, column: 2}).should.deep.equal({
    //                 source: 'test/fixtures/1.less',
    //                 line: 3,
    //                 column: 0, // not really tracked, it seems
    //                 name: null
    //             });
    //             map.originalPositionFor({line: 4, column: 0}).should.deep.equal({
    //                 source: 'test/fixtures/2.less',
    //                 line: 1,
    //                 column: 0,
    //                 name: null
    //             });
    //             map.originalPositionFor({line: 5, column: 2}).should.deep.equal({
    //                 source: 'test/fixtures/2.less',
    //                 line: 3,
    //                 column: 0,
    //                 name: null
    //             });

    //             done();
    //         });
    //     });

    //     // FIXME: restore Supervisor?
    //     it.skip('should register no path in the supervisor', function(done){
    //         return transformedResources.toArray(function() {
    //             supervisor.dependOn.should.not.have.been.called;
    //             done();
    //         });
    //     });

    // });


    describe('when passed a resource with invalid ES6 syntax', function() {

        it('should return an error report if missing closing bracket', function(done){
            var missingClosingBracket = createResource({
                path: 'test/fixtures/unclosed.js',
                type: 'javascript',
                data: 'var f = (x) => {'
            });

            return runOperation(traceur(), [missingClosingBracket]).resources.toArray(function(reports) {
                reports.length.should.equal(1);
                reports[0].should.be.instanceof(Report);
                reports[0].writtenResource.should.equal(missingClosingBracket);
                reports[0].type.should.equal('error');
                reports[0].success.should.equal(false);
                reports[0].errors[0].line.should.equal(1);
                reports[0].errors[0].column.should.equal(17);
                reports[0].errors[0].message.should.equal("'}' expected");
                // reports[0].errors[0].context.should.equal('.foo {');
                done();
            });
        });


        it.skip('should return an error report if using undeclared var', function(done){
            var undeclaredVar = createResource({
                path: 'test/fixtures/undeclared.js',
                type: 'javascript',
                data: 'x = 42;'
            });

            return runOperation(traceur(), [undeclaredVar]).resources.toArray(function(reports) {
                reports.length.should.equal(1);
                reports[0].should.be.instanceof(Report);
                reports[0].writtenResource.should.equal(undeclaredVar);
                reports[0].type.should.equal('error');
                reports[0].success.should.equal(false);
                reports[0].errors[0].line.should.equal(2);
                reports[0].errors[0].column.should.equal(10);
                reports[0].errors[0].message.should.equal('[Name] variable @missing is undefined');
                reports[0].errors[0].context.should.equal('  border: @missing;');
                done();
            });
        });
    });
});
