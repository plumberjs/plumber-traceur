# plumber-traceur

A plumber plugin to compile ecmascript 6 code using traceur.

## Usage

```javascript
var all       = require('plumber-all')
var glob      = require('plumber-glob')
var traceur   = require('plumber-traceur')
var concat    = require('plumber-concat')
var write     = require('plumber-write')

module.exports = function(pipelines) {
  var sources = glob.within('app')
  var writeToDist = write('dist')

  pipelines['compile:js'] = [
    sources('**/*.js'),
    traceur.toAmd({
      // this is optional
      getModulePath: function(path) {
        // this would change the path "app/app.js" to "yourAppName/app.js" etc.
        return path.replace(/[^/]+/, 'yourAppName');
      }
    }),
    concat('app'),
    write('dist/assets')
  ]
}
```
