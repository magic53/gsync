var should = require('should'),
    debug = require('debug'),
    _ = require('lodash'),
    gsync = require('../lib/gsync');

describe('gsync', function() {
  
  function asyncFunc(param, callback) {
    setTimeout(function() { callback(param.error, param.value); }, param.delay);
  }
  function syncFunc(param, callback) {
    callback(param.error, param.value);
  }

  describe('constructor', function() {

    it('gsync() should process generator and return multiple values to callback', function(done) {
      var values = ['1a', ['1b', '1c']];
      var validate = [];
      gsync(function*(next) {
        var result = yield syncFunc({ error: null, value: values[0] }, next);
        validate.push(result);

        result = yield syncFunc({ error: null, value: values[1] }, next);
        validate.push(result);

        next(null, 'last value', 'after last value');
      }, function (err, result, result2) {
        should(result).be.ok.and.be.equal('last value');
        should(result2).be.ok.and.be.equal('after last value');
        should(err).not.be.ok;
        validate.should.be.eql(values);
        done();
      });
    });

    it('gsync() should process generator and automatically return the last yielded value', function(done) {
      var values = ['1a', '1b-yielded'];
      var validate = [];
      gsync(function*(next) {
        var result = yield syncFunc({ error: null, value: values[0] }, next);
        validate.push(result);

        result = yield syncFunc({ error: null, value: values[1] }, next);
        validate.push(result);
      }, function (err, result) {
        should(result).be.ok.and.be.equal(values[1]);
        should(err).not.be.ok;
        validate.should.be.eql(values);
        done();
      });
    });

    it('gsync() should process generator and throw error', function(done) {
      var values = ['1a', '1b'];
      var validate = [];
      gsync(function*(next) {
        var result = yield syncFunc({ error: 'oops', value: values[0] }, next);
        validate.push(result);
        validate.should.be.empty;

        result = yield syncFunc({ error: null, value: values[1] }, next);
        validate.push(result);
      }, function (err) {
        should(err).be.ok.and.be.equal('oops');
        validate.should.be.empty;
        done();
      });
    });

    it('gsync() should process function', function(done) {
      var values = ['1a'];
      var validate = [];
      gsync(function(next) {
        syncFunc({ error: null, value: values[0] }, function(err, result) {
          validate.push(result);
          next(err, result);
        });
      }, function (err, result) {
        should(err).not.be.ok;
        should(result).be.ok.and.be.equal('1a');
        validate.should.be.eql(values);
        done();
      });
    });

    it('gsync() should process function and throw error', function(done) {
      gsync(function(next) {
        syncFunc({ error: 'oops', value: '1a' }, function(err, result) {
          next(err, result);
        });
      }, function (err, result) {
        should(result).be.ok.and.be.equal('1a');
        should(err).be.ok.and.be.equal('oops');
        done();
      });
    });

    it('gsync() should process nested gsync() calls', function(done) {
      var tdata = {a: '1',b: '2',c: '3',d: '4',e: '5',f: '6'};
      gsync(function*(next) {
        var ab = yield (function(nextCb) {
          setTimeout(function() { nextCb(null, {a:'1',b:'2'}); }, 20);
        })(next);
        var cdef = yield gsync(function*(done){
          var c = yield (function(nextCb) {
            setTimeout(function() { nextCb(null, {c:'3'}); }, 20);
          })(done);
          var de = yield (function(nextCb) {
            setTimeout(function() { nextCb(null, {d:'4',e:'5'}); }, 20);
          })(done);
          var f = yield gsync(function*(callback){
            yield (function(nextCb) {
              setTimeout(function() { nextCb(null, {f:'6'}); }, 20);
            })(callback);
          }, done);
          done(null, _.assign(c, de, f));
        }, next);
        next(null,_.assign(cdef, ab));
      }, function(err, results) {
        should(err).not.be.ok;
        results.should.be.eql(tdata);
        done();
      });
    });

  });

  describe('series', function() {

    it('gsync.series should process synchronous generators', function(done) {
      var values = ['1a', '1b', '2', '3a', '3b'];
      var validate = [];
      gsync.series([
        function*(next) {
          var result = yield syncFunc({ error: null, value: values[0] }, next);
          validate.push(result);

          result = yield syncFunc({ error: null, value: values[1] }, next);
          validate.push(result);
        },
        function*(next) {
          var result = yield syncFunc({ error: null, value: values[2] }, next);
          validate.push(result);
        },
        function*(next) {
          var result = yield syncFunc({ error: null, value: values[3] }, next);
          validate.push(result);

          result = yield syncFunc({ error: null, value: values[4] }, next);
          validate.push(result);
        }
      ], function (err, result) {
        should(err).not.be.ok;
        should(result).be.ok.and.be.equal(values[4]);
        validate.should.be.eql(values);
        done();
      });
    });

    it('gsync.series should process asynchronous generators', function(done) {
      var values = ['11a', '11b', '12', '13a', '13b'];
      var validate = [];
      gsync.series([
        function*(next) {
          var result = yield asyncFunc({ error: null, value: values[0], delay: Math.random() * 30 }, next);
          validate.push(result);

          result = yield asyncFunc({ error: null, value: values[1], delay: Math.random() * 30 }, next);
          validate.push(result);
        },
        function*(next) {
          var result = yield asyncFunc({ error: null, value: values[2], delay: Math.random() * 30 }, next);
          validate.push(result);
        },
        function*(next) {
          var result = yield asyncFunc({ error: null, value: values[3], delay: Math.random() * 30 }, next);
          validate.push(result);

          result = yield asyncFunc({ error: null, value: values[4], delay: Math.random() * 30 }, next);
          validate.push(result);
        }
      ], function (err, result) {
        should(err).not.be.ok;
        should(result).be.ok.and.be.equal(values[4]);
        validate.should.be.eql(values);
        done();
      });
    });

    it('gsync.series should be able to mix asynchronous generators and functions', function(done) {
      var values = ['21a', '21b', '22', '23a', '23b'];
      var validate = [];
      gsync.series([
        function*(next) {
          var result = yield asyncFunc({ error: null, value: values[0], delay: Math.random() * 30 }, next);
          validate.push(result);

          result = yield asyncFunc({ error: null, value: values[1], delay: Math.random() * 30 }, next);
          validate.push(result);
        },
        function(next) {
          asyncFunc({ error: null, value: values[2], delay: Math.random() * 30 }, function(err, val) {
            validate.push(val);
            next(err);
          });
        },
        function*(next) {
          var result = yield asyncFunc({ error: null, value: values[3], delay: Math.random() * 30 }, next);
          validate.push(result);

          result = yield asyncFunc({ error: null, value: values[4], delay: Math.random() * 30 }, next);
          validate.push(result);
        }
      ], function (err, result) {
        should(err).not.be.ok;
        should(result).be.ok.and.be.equal(values[4]);
        validate.should.be.eql(values);
        done();
      });
    });

    it('gsync.series should be able to mix synchronous generators and functions', function(done) {
      var values = ['31a', '31b', '32', '33a', '33b', '34'];
      var validate = [];
      gsync.series([
        function*(next) {
          var result = yield syncFunc({ error: null, value: values[0] }, next);
          validate.push(result);

          result = yield syncFunc({ error: null, value: values[1], delay: Math.random() * 30 }, next);
          validate.push(result);
        },
        function(next) {
          asyncFunc({ error: null, value: values[2], delay: Math.random() * 30 }, function(err, val) {
            validate.push(val);
            next(err);
          });
        },
        function*(next) {
          var result = yield syncFunc({ error: null, value: values[3] }, next);
          validate.push(result);

          result = yield syncFunc({ error: null, value: values[4] }, next);
          validate.push(result);
        },
        function(next) {
          asyncFunc({ error: null, value: values[5], delay: Math.random() * 30 }, function(err, val) {
            validate.push(val);
            next(err, val);
          });
        }
      ], function (err, result) {
        should(err).not.be.ok;
        should(result).be.ok.and.be.equal(values[5]);
        validate.should.be.eql(values);
        done();
      });
    });

    it('gsync.series should be able to process all functions', function(done) {
      var values = ['41', '42', '43', '44'];
      var validate = [];
      gsync.series([
        function(next) {
          asyncFunc({ error: null, value: values[0], delay: Math.random() * 30 }, function(err, val) {
            validate.push(val);
            next(err);
          });
        },
        function(next) {
          asyncFunc({ error: null, value: values[1], delay: Math.random() * 30 }, function(err, val) {
            validate.push(val);
            next(err);
          });
        },
        function(next) {
          asyncFunc({ error: null, value: values[2], delay: Math.random() * 30 }, function(err, val) {
            validate.push(val);
            next(err);
          });
        },
        function(next) {
          asyncFunc({ error: null, value: values[3], delay: Math.random() * 30 }, function(err, val) {
            validate.push(val);
            next(err, val);
          });
        }
      ], function (err, result) {
        should(err).not.be.ok;
        should(result).be.ok.and.be.equal(values[3]);
        validate.should.be.eql(values);
        done();
      });
    });

  });

  describe('parallel', function() {

    it('gsync.parallel should process synchronous generators', function(done) {
      var values = ['1a', '1b', '2', '3a', '3b'];
      var validate = [];
      gsync.parallel([
        function*(next) {
          var result = yield syncFunc({ error: null, value: values[0] }, next);
          validate.push(result);

          result = yield syncFunc({ error: null, value: values[1] }, next);
          validate.push(result);
        },
        function*(next) {
          var result = yield syncFunc({ error: null, value: values[2] }, next);
          validate.push(result);
        },
        function*(next) {
          var result = yield syncFunc({ error: null, value: values[3] }, next);
          validate.push(result);

          result = yield syncFunc({ error: null, value: values[4] }, next);
          validate.push(result);
        }
      ], function (err) {
        should(err).not.be.ok;
        validate.should.be.an.instanceOf(Array).and.have.lengthOf(values.length);
        validate.should.not.be.eql(values);
        done();
      });
    });

    it('gsync.parallel should process asynchronous generators', function(done) {
      var values = ['11a', '11b', '12', '13a', '13b'];
      var validate = [];
      gsync.parallel([
        function*(next) {
          var result = yield asyncFunc({ error: null, value: values[0], delay: 500 }, next);
          validate.push(result);

          result = yield asyncFunc({ error: null, value: values[1], delay: Math.random() * 30 }, next);
          validate.push(result);
        },
        function*(next) {
          var result = yield asyncFunc({ error: null, value: values[2], delay: Math.random() * 300 }, next);
          validate.push(result);
        },
        function*(next) {
          var result = yield asyncFunc({ error: null, value: values[3], delay: Math.random() * 30 }, next);
          validate.push(result);

          result = yield asyncFunc({ error: null, value: values[4], delay: 500 }, next);
          validate.push(result);
        }
      ], function (err) {
        should(err).not.be.ok;
        validate.should.be.an.instanceOf(Array).and.have.lengthOf(values.length);
        validate.should.not.be.eql(values);
        done();
      });
    });

    it('gsync.parallel should be able to mix asynchronous generators and functions', function(done) {
      var values = ['21a', '21b', '22', '23a', '23b'];
      var validate = [];
      gsync.parallel([
        function*(next) {
          var result = yield asyncFunc({ error: null, value: values[0], delay: 500 }, next);
          validate.push(result);

          result = yield asyncFunc({ error: null, value: values[1], delay: Math.random() * 30 }, next);
          validate.push(result);
        },
        function(next) {
          asyncFunc({ error: null, value: values[2], delay: Math.random() * 30 }, function(err, val) {
            validate.push(val);
            next(err);
          });
        },
        function*(next) {
          var result = yield asyncFunc({ error: null, value: values[3], delay: Math.random() * 30 }, next);
          validate.push(result);

          result = yield asyncFunc({ error: null, value: values[4], delay: 500 }, next);
          validate.push(result);
        }
      ], function (err) {
        should(err).not.be.ok;
        validate.should.be.an.instanceOf(Array).and.have.lengthOf(values.length);
        validate.should.not.be.eql(values);
        done();
      });
    });

    it('gsync.parallel should be able to mix synchronous generators and functions', function(done) {
      var values = ['31a', '31b', '32', '33a', '33b', '34'];
      var validate = [];
      gsync.parallel([
        function*(next) {
          var result = yield syncFunc({ error: null, value: values[0] }, next);
          validate.push(result);

          result = yield syncFunc({ error: null, value: values[1], delay: Math.random() * 30 }, next);
          validate.push(result);
        },
        function(next) {
          asyncFunc({ error: null, value: values[2], delay: 30 }, function(err, val) {
            validate.push(val);
            next(err);
          });
        },
        function*(next) {
          var result = yield syncFunc({ error: null, value: values[3] }, next);
          validate.push(result);

          result = yield syncFunc({ error: null, value: values[4] }, next);
          validate.push(result);
        },
        function(next) {
          asyncFunc({ error: null, value: values[5], delay: 30 }, function(err, val) {
            validate.push(val);
            next(err);
          });
        }
      ], function (err) {
        should(err).not.be.ok;
        validate.should.be.an.instanceOf(Array).and.have.lengthOf(values.length);
        validate.should.not.be.eql(values);
        done();
      });
    });

    it('gsync.parallel should be able to process all functions', function(done) {
      var values = ['41', '42', '43', '44'];
      var validate = [];
      gsync.parallel([
        function(next) {
          asyncFunc({ error: null, value: values[0], delay: 500 }, function(err, val) {
            validate.push(val);
            next(err);
          });
        },
        function(next) {
          asyncFunc({ error: null, value: values[1], delay: 500 }, function(err, val) {
            validate.push(val);
            next(err);
          });
        },
        function(next) {
          asyncFunc({ error: null, value: values[2], delay: 30 }, function(err, val) {
            validate.push(val);
            next(err);
          });
        },
        function(next) {
          asyncFunc({ error: null, value: values[3], delay: 30 }, function(err, val) {
            validate.push(val);
            next(err);
          });
        }
      ], function (err) {
        should(err).not.be.ok;
        validate.should.be.an.instanceOf(Array).and.have.lengthOf(values.length);
        validate.should.not.be.eql(values);
        done();
      });
    });

  });

  it('gsync should work with promises', function(done) {
    gsync(function*(next) {
      var promise = loadAsyncData1();
      var result = yield promise.then(val => next(null, val))
        .catch(err => next(null, err));
      should(result).be.equal('loadAsyncData1 after 1/4 second delay');

      var promise2 = loadAsyncData2();
      var result2 = yield promise2.then(val => next(null, val))
        .catch(err => next(null, err));
      should(result2).be.equal('loadAsyncData2 after 1/3 second delay');

      var promise3 = loadAsyncData3();
      var result3 = yield promise3.then(val => next(null, val))
        .catch(err => next(null, err));
      should(result3).be.equal('loadAsyncData3 Error');

      done();
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
  });

  it('sample series', function(done) {

    gsync.series([
      // generator
      function*(next) {
        var json = yield doSomeAsyncWork({ url: 'example.com/series/?1a' }, next);
        debug(json);
        var moreJson = yield doSomeAsyncWork({ url: 'example.com/series/?1b' }, next);
        debug(moreJson);
      },
      // generator
      function*(next) {
        var json = yield doSomeAsyncWork({ url: 'example.com/series/?2a' }, next);
        debug(json);
        var moreJson = yield doSomeAsyncWork({ url: 'example.com/series/?2b' }, next);
        debug(moreJson);
      },
      // Mix non-generator callbacks
      function(next) {
        doSomeAsyncWork({ url: 'example.com/series/?3' }, function(err, result) {
          debug(result);
          next(err);
        });
      }
    ], function (err) {
      debug('gsync.series Done!');
      done();
    });

  });

  it('sample parallel', function(done) {

    gsync.parallel([
      // generator
      function*(next) {
        var json = yield doSomeAsyncWork({ url: 'example.com/parallel/?1a' }, next);
        debug(json);
        var moreJson = yield doSomeAsyncWork({ url: 'example.com/parallel/?1b' }, next);
        debug(moreJson);
      },
      // generator
      function*(next) {
        var json = yield doSomeAsyncWork({ url: 'example.com/parallel/?2a' }, next);
        debug(json);
        var moreJson = yield doSomeAsyncWork({ url: 'example.com/parallel/?2b' }, next);
        debug(moreJson);
      },
      // Mix non-generator callbacks
      function(next) {
        doSomeAsyncWork({ url: 'example.com/parallel/?3' }, function(err, result) {
          debug(result);
          next(err);
        });
      },
      // generator
      function*(next) {
        var json = yield doSomeAsyncWork({ url: 'example.com/parallel/?4' }, next);
        debug(json);
      }
    ], function (err) {
      debug('gsync.parallel Done!');
      done();
    });

  });

  function doSomeAsyncWork(param, callback) {
    setTimeout(function() { callback(null, param.url); }, Math.random() * 60);
  }

});