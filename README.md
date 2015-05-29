# gsync
gsync is an asynchronous control flow framework for use with es6 generators in Node.js (browser support coming soon). The framework models existing Javascript callback methodology, resulting in easier adoption of es6 generators into existing projects.

## Control Flow Functions
* `gsync.series([], function(err, result))`
* `gsync.parallel([], function(err, result))`

## Examples

## **gsync.series**
Execute generators and functions in the order specified, including nested generators.
```
function doSomeWork(param, callback) {
  setTimeout(function() { callback(null, param.url); }, Math.random() * 500);
}

gsync.series([
  // generator
  function*(next) {
    var json = yield doSomeWork({ url: 'example.com/series/?1a' }, next);
    console.log(json);
    var moreJson = yield doSomeWork({ url: 'example.com/series/?1b' }, next);
    console.log(moreJson);
  },
  // generator
  function*(next) {
    var json = yield doSomeWork({ url: 'example.com/series/?2a' }, next);
    console.log(json);
    var moreJson = yield doSomeWork({ url: 'example.com/series/?2b' }, next);
    console.log(moreJson);
  },
  // Mix non-generator callbacks
  function(next) {
    doSomeWork({ url: 'example.com/series/?3' }, function(err, result) {
      console.log(result);
      next(err);
    });
  }
], function (err) {
  console.log('gsync.series done!');
  done();
});

```

## **gsync.parallel**
Execute all generators and functions as fast as possible in parallel, including nested generators. Note that generators are inherently serial (iterators) and will internally execute their respective yields as such. However, generators specified in the top level array will continue executing in parallel.
```
function doSomeWork(param, callback) {
  setTimeout(function() { callback(null, param.url); }, Math.random() * 500);
}

gsync.parallel([
  // generator
  function*(next) {
    var json = yield doSomeWork({ url: 'example.com/parallel/?1a' }, next);
    console.log(json);
    var moreJson = yield doSomeWork({ url: 'example.com/parallel/?1b' }, next);
    console.log(moreJson);
  },
  // generator
  function*(next) {
    var json = yield doSomeWork({ url: 'example.com/parallel/?2a' }, next);
    console.log(json);
    var moreJson = yield doSomeWork({ url: 'example.com/parallel/?2b' }, next);
    console.log(moreJson);
  },
  // Mix non-generator callbacks
  function(next) {
    doSomeWork({ url: 'example.com/parallel/?3' }, function(err, result) {
      console.log(result);
      next(err);
    });
  },
  // generator
  function*(next) {
    var json = yield doSomeWork({ url: 'example.com/parallel/?4' }, next);
    console.log(json);
  }
], function (err) {
  console.log('gsync.parallel done!');
  done();
});

```

# License
**MIT**