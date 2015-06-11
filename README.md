# gsync
gsync is an asynchronous control flow framework for use with es6 generators in Node.js and the browser. The framework models existing Javascript callback methodology, resulting in easier adoption of es6 generators into existing projects.

## Control Flow Functions
* `gsync(function*, function(err, result))`
* `gsync.series([], function(err, result))`
* `gsync.parallel([], function(err))`

## Node.js
Requires `--harmony_generators` flag to be set.

## Installation
**Node**

`npm install gsync`

**Browser**

`bower install gsync`

# Examples

## **gsync(function\*, callback)**
Execute a single generator function (also accepts non-generator functions). The last yielded value will be passed to the final callback function as the result.
```
var results = [];
gsync(function*(next) {
  var result1 = yield doSomeWork({ error: null, value: '1' }, next);
  results.push(result1);
  var result2 = yield doSomeWork({ error: null, value: '2' }, next);
  results.push(result2);
  // Note* that explicitly executing the callback at the end of the generator will override the yielded result to the final callback.
  // next(null, 'result value'); // sends 'result value' to the callback
}, function (err, result) {
  console.log(result); // prints: 2
  console.log(results); // prints: [1, 2]
});

function doSomeWork(param, callback) {
  setTimeout(function() { callback(null, param.value); }, Math.random() * 500);
}
```

## **gsync.series([function\*], callback)**
Execute generators and functions in the order specified, including nested generators.
```
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
      next(err, result);
    });
  }
], function (err, result) {
  console.log('gsync.series done!', result); // prints: gsync.series done! example.com/series/?3
});

// sample async function
function doSomeWork(param, callback) {
  setTimeout(function() { callback(null, param.url); }, Math.random() * 500);
}
```

## **gsync.parallel([function\*], callback)**
Execute all generators and functions as fast as possible in parallel, including nested generators. Note that generators are inherently serial (iterators) and will internally execute their respective yields as such. However, generators specified in the top level array will continue executing in parallel.
```
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
});

// sample async function
function doSomeWork(param, callback) {
  setTimeout(function() { callback(null, param.url); }, Math.random() * 500);
}
```

# Advanced: Nesting generators with gsync()
The framework allows nesting gsync() calls for encapsulating nested generators. The gsync callback must be passed to each successive gsync() call. 
```
gsync(function*(next) {
  var ab = yield doSomeWork({a:'1',b:'2'}, next);
  
  var cdef = yield gsync(function*(done){
    var c = yield doSomeWork({c:'3'}, done);
    var de = yield doSomeWork({d:'4',e:'5'}, done);
    var f = yield gsync(function*(callback){
      yield doSomeWork({f:'6'}, callback);
    }, done);
    done(null, _.assign(c, de, f));
  }, next);
  
  next(null,_.assign(cdef, ab));
  
}, function(err, results) {
  console.log(results); // prints: {a:'1', b:'2', c:'3', d:'4', e:'5', f:'6'}
});

function doSomeWork(param, callback) {
  setTimeout(function() { callback(null, param); }, 20);  
};
```

# License
The MIT License (MIT)

Copyright (c) 2015 Michael Madgett

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.