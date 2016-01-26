# gsync
gsync is an asynchronous control flow framework for use with es6 generators in Node.js and the browser. The framework models existing Javascript callback methodology, resulting in easier adoption of es6 generators into existing projects.

gsync works with Promises and can be used to yield a result directly from a resolve or reject handler. No need for nested Promise implementations. The code below appears to be synchronous, however is executed asynchronously.
http://codepen.io/anon/pen/dGmRoV
```
gsync(function*(next) {
  var promise = new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve("1/4 second delay");
      // reject("Error!");
    }, 250);
  });
  var result = yield promise.then(val => next(null, val))
    .catch(err => next(null, err));
  // console.log called after promise is fulfilled and value is assigned directly to `result`
  console.log(result); // prints 1/4 second delay

  var promise2 = new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve("1/3 second delay");
      // reject("Error!");
    }, 333);
  });
  var result2 = yield promise2.then(val => next(null, val))
    .catch(err => next(null, err));
  console.log(result2); // prints 1/3 second delay
});
```

## Control Flow Functions
* `gsync(function*, function(err, result))`
* `gsync.series([], function(err, result))`
* `gsync.parallel([], function(err))`

## Node.js
Requires `--harmony_generators` flag to be set for older versions of node

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
  var result1 = yield doSomeAsyncWork({ error: null, value: '1' }, next);
  results.push(result1);
  var result2 = yield doSomeAsyncWork({ error: null, value: '2' }, next);
  results.push(result2);
  // Note* that explicitly executing the callback at the end of the generator will override the yielded result to the final callback.
  // next(null, result1, result2); // sends '1' & '2' to the callback
}, function (err, r1, r2) {
  console.log(r1, r2); // prints: 1, 2
  console.log(results); // prints: [1, 2]
});

function doSomeAsyncWork(param, callback) {
  setTimeout(function() { callback(null, param.value); }, Math.random() * 500);
}
```

## **gsync.series([function\*], callback)**
Execute generators and functions in the order specified, including nested generators.
```
gsync.series([
  // generator
  function*(next) {
    var json = yield doSomeAsyncWork({ url: 'example.com/series/?1a' }, next);
    console.log(json);
    var moreJson = yield doSomeAsyncWork({ url: 'example.com/series/?1b' }, next);
    console.log(moreJson);
  },
  // generator
  function*(next) {
    var json = yield doSomeAsyncWork({ url: 'example.com/series/?2a' }, next);
    console.log(json);
    var moreJson = yield doSomeAsyncWork({ url: 'example.com/series/?2b' }, next);
    console.log(moreJson);
  },
  // Mix non-generator callbacks
  function(next) {
    doSomeAsyncWork({ url: 'example.com/series/?3' }, function(err, result) {
      console.log(result);
      next(err, result);
    });
  }
], function (err, result) {
  console.log('gsync.series done!', result); // prints: gsync.series done! example.com/series/?3
});

// sample async function
function doSomeAsyncWork(param, callback) {
  setTimeout(function() { callback(null, param.url); }, Math.random() * 500);
}
```

## **gsync.parallel([function\*], callback)**
Execute all generators and functions as fast as possible in parallel, including nested generators. Note that generators are inherently serial (iterators) and will internally execute their respective yields as such. However, generators specified in the top level array will continue executing in parallel.
```
gsync.parallel([
  // generator
  function*(next) {
    var json = yield doSomeAsyncWork({ url: 'example.com/parallel/?1a' }, next);
    console.log(json);
    var moreJson = yield doSomeAsyncWork({ url: 'example.com/parallel/?1b' }, next);
    console.log(moreJson);
  },
  // generator
  function*(next) {
    var json = yield doSomeAsyncWork({ url: 'example.com/parallel/?2a' }, next);
    console.log(json);
    var moreJson = yield doSomeAsyncWork({ url: 'example.com/parallel/?2b' }, next);
    console.log(moreJson);
  },
  // Mix non-generator callbacks
  function(next) {
    doSomeAsyncWork({ url: 'example.com/parallel/?3' }, function(err, result) {
      console.log(result);
      next(err);
    });
  },
  // generator
  function*(next) {
    var json = yield doSomeAsyncWork({ url: 'example.com/parallel/?4' }, next);
    console.log(json);
  }
], function (err) {
  console.log('gsync.parallel done!');
});

// sample async function
function doSomeAsyncWork(param, callback) {
  setTimeout(function() { callback(null, param.url); }, Math.random() * 500);
}
```

# Promises: Using promises with gsync()
The framework works with promises. It's possible to yield a value directly from a promise resolve or reject handler.
http://codepen.io/anon/pen/Qympgv
```
gsync(function*(next) {
  var promise = loadAsyncData1();
  var result = yield promise.then(val => next(null, val))
    .catch(err => next(null, err));
  console.log(result);

  var promise2 = loadAsyncData2();
  var result2 = yield promise2.then(val => next(null, val))
    .catch(err => next(null, err));
  console.log(result2);

  var promise3 = loadAsyncData3();
  var result3 = yield promise3.then(val => next(null, val))
    .catch(err => next(null, err));
  console.log(result3);
});

function loadAsyncData1() {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve("loadAsyncData1 after 1/4 second delay");
      // reject("Error!");
    }, 250);
  });
}

function loadAsyncData2() {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve("loadAsyncData2 after 1/3 second delay");
      // reject("Error!");
    }, 333);
  });
}

function loadAsyncData3() {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      reject("loadAsyncData3 Error");
    }, 200);
  });
}
```

# Advanced: Nesting generators with gsync()
The framework allows nesting gsync() calls for encapsulating nested generators. The gsync callback must be passed to each successive gsync() call.
```
gsync(function*(next) {
  var ab = yield doSomeAsyncWork({a:'1',b:'2'}, next);

  var cdef = yield gsync(function*(done){
    var c = yield doSomeAsyncWork({c:'3'}, done);
    var de = yield doSomeAsyncWork({d:'4',e:'5'}, done);
    var f = yield gsync(function*(callback){
      yield doSomeAsyncWork({f:'6'}, callback);
    }, done);
    done(null, _.assign(c, de, f));
  }, next);

  next(null,_.assign(cdef, ab));

}, function(err, results) {
  console.log(results); // prints: {a:'1', b:'2', c:'3', d:'4', e:'5', f:'6'}
});

function doSomeAsyncWork(param, callback) {
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