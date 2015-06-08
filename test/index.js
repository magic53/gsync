var should = require('should'),
    debug = require('debug'),
    gsync = require('../lib/gsync');

describe('gsync', function() {
  
  function asyncFunc(param, callback) {
    setTimeout(function() { callback(param.error, param.value); }, param.delay);
  }
  function syncFunc(param, callback) {
    callback(param.error, param.value);
  }

  describe('constructor', function() {

    it('gsync() should process generator', function(done) {
      var values = ['1a', '1b'];
      var validate = [];
      gsync(function*(next) {
        var result = yield syncFunc({ error: null, value: values[0] }, next);
        validate.push(result);

        result = yield syncFunc({ error: null, value: values[1] }, next);
        validate.push(result);
      }, function (err) {
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
          next(err);
        });
      }, function (err) {
        should(err).not.be.ok;
        validate.should.be.eql(values);
        done();
      });
    });

    it('gsync() should process function and throw error', function(done) {
      gsync(function(next) {
        syncFunc({ error: 'oops', value: '1a' }, function(err, result) {
          next(err);
        });
      }, function (err) {
        should(err).be.ok.and.be.equal('oops');
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
      ], function (err) {
        should(err).not.be.ok;
        validate.should.be.eql(values);
        done();
      });
    });

    it('gsync.series should process asynchronous generators', function(done) {
      var values = ['11a', '11b', '12', '13a', '13b'];
      var validate = [];
      gsync.series([
        function*(next) {
          var result = yield asyncFunc({ error: null, value: values[0], delay: Math.random() * 300 }, next);
          validate.push(result);

          result = yield asyncFunc({ error: null, value: values[1], delay: Math.random() * 300 }, next);
          validate.push(result);
        },
        function*(next) {
          var result = yield asyncFunc({ error: null, value: values[2], delay: Math.random() * 300 }, next);
          validate.push(result);
        },
        function*(next) {
          var result = yield asyncFunc({ error: null, value: values[3], delay: Math.random() * 300 }, next);
          validate.push(result);

          result = yield asyncFunc({ error: null, value: values[4], delay: Math.random() * 300 }, next);
          validate.push(result);
        }
      ], function (err) {
        should(err).not.be.ok;
        validate.should.be.eql(values);
        done();
      });
    });

    it('gsync.series should be able to mix asynchronous generators and functions', function(done) {
      var values = ['21a', '21b', '22', '23a', '23b'];
      var validate = [];
      gsync.series([
        function*(next) {
          var result = yield asyncFunc({ error: null, value: values[0], delay: Math.random() * 300 }, next);
          validate.push(result);

          result = yield asyncFunc({ error: null, value: values[1], delay: Math.random() * 300 }, next);
          validate.push(result);
        },
        function(next) {
          asyncFunc({ error: null, value: values[2], delay: Math.random() * 300 }, function(err, val) {
            validate.push(val);
            next(err);
          });
        },
        function*(next) {
          var result = yield asyncFunc({ error: null, value: values[3], delay: Math.random() * 300 }, next);
          validate.push(result);

          result = yield asyncFunc({ error: null, value: values[4], delay: Math.random() * 300 }, next);
          validate.push(result);
        }
      ], function (err) {
        should(err).not.be.ok;
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

          result = yield syncFunc({ error: null, value: values[1], delay: Math.random() * 300 }, next);
          validate.push(result);
        },
        function(next) {
          asyncFunc({ error: null, value: values[2], delay: Math.random() * 300 }, function(err, val) {
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
          asyncFunc({ error: null, value: values[5], delay: Math.random() * 300 }, function(err, val) {
            validate.push(val);
            next(err);
          });
        }
      ], function (err) {
        should(err).not.be.ok;
        validate.should.be.eql(values);
        done();
      });
    });

    it('gsync.series should be able to process all functions', function(done) {
      var values = ['41', '42', '43', '44'];
      var validate = [];
      gsync.series([
        function(next) {
          asyncFunc({ error: null, value: values[0], delay: Math.random() * 300 }, function(err, val) {
            validate.push(val);
            next(err);
          });
        },
        function(next) {
          asyncFunc({ error: null, value: values[1], delay: Math.random() * 300 }, function(err, val) {
            validate.push(val);
            next(err);
          });
        },
        function(next) {
          asyncFunc({ error: null, value: values[2], delay: Math.random() * 300 }, function(err, val) {
            validate.push(val);
            next(err);
          });
        },
        function(next) {
          asyncFunc({ error: null, value: values[3], delay: Math.random() * 300 }, function(err, val) {
            validate.push(val);
            next(err);
          });
        }
      ], function (err) {
        should(err).not.be.ok;
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
          var result = yield asyncFunc({ error: null, value: values[0], delay: 1000 }, next);
          validate.push(result);

          result = yield asyncFunc({ error: null, value: values[1], delay: Math.random() * 300 }, next);
          validate.push(result);
        },
        function*(next) {
          var result = yield asyncFunc({ error: null, value: values[2], delay: Math.random() * 800 }, next);
          validate.push(result);
        },
        function*(next) {
          var result = yield asyncFunc({ error: null, value: values[3], delay: Math.random() * 300 }, next);
          validate.push(result);

          result = yield asyncFunc({ error: null, value: values[4], delay: 1000 }, next);
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
          var result = yield asyncFunc({ error: null, value: values[0], delay: 1000 }, next);
          validate.push(result);

          result = yield asyncFunc({ error: null, value: values[1], delay: Math.random() * 300 }, next);
          validate.push(result);
        },
        function(next) {
          asyncFunc({ error: null, value: values[2], delay: Math.random() * 300 }, function(err, val) {
            validate.push(val);
            next(err);
          });
        },
        function*(next) {
          var result = yield asyncFunc({ error: null, value: values[3], delay: Math.random() * 300 }, next);
          validate.push(result);

          result = yield asyncFunc({ error: null, value: values[4], delay: 1000 }, next);
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

          result = yield syncFunc({ error: null, value: values[1], delay: Math.random() * 300 }, next);
          validate.push(result);
        },
        function(next) {
          asyncFunc({ error: null, value: values[2], delay: 100 }, function(err, val) {
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
          asyncFunc({ error: null, value: values[5], delay: 100 }, function(err, val) {
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
          asyncFunc({ error: null, value: values[0], delay: 1000 }, function(err, val) {
            validate.push(val);
            next(err);
          });
        },
        function(next) {
          asyncFunc({ error: null, value: values[1], delay: 1000 }, function(err, val) {
            validate.push(val);
            next(err);
          });
        },
        function(next) {
          asyncFunc({ error: null, value: values[2], delay: 100 }, function(err, val) {
            validate.push(val);
            next(err);
          });
        },
        function(next) {
          asyncFunc({ error: null, value: values[3], delay: 100 }, function(err, val) {
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

    function doSomeWork(param, callback) {
      setTimeout(function() { callback(null, param.url); }, Math.random() * 500);
    }

    it('sample series', function(done) {

      gsync.series([
        // generator
        function*(next) {
          var json = yield doSomeWork({ url: 'example.com/series/?1a' }, next);
          debug(json);
          var moreJson = yield doSomeWork({ url: 'example.com/series/?1b' }, next);
          debug(moreJson);
        },
        // generator
        function*(next) {
          var json = yield doSomeWork({ url: 'example.com/series/?2a' }, next);
          debug(json);
          var moreJson = yield doSomeWork({ url: 'example.com/series/?2b' }, next);
          debug(moreJson);
        },
        // Mix non-generator callbacks
        function(next) {
          doSomeWork({ url: 'example.com/series/?3' }, function(err, result) {
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
          var json = yield doSomeWork({ url: 'example.com/parallel/?1a' }, next);
          debug(json);
          var moreJson = yield doSomeWork({ url: 'example.com/parallel/?1b' }, next);
          debug(moreJson);
        },
        // generator
        function*(next) {
          var json = yield doSomeWork({ url: 'example.com/parallel/?2a' }, next);
          debug(json);
          var moreJson = yield doSomeWork({ url: 'example.com/parallel/?2b' }, next);
          debug(moreJson);
        },
        // Mix non-generator callbacks
        function(next) {
          doSomeWork({ url: 'example.com/parallel/?3' }, function(err, result) {
            debug(result);
            next(err);
          });
        },
        // generator
        function*(next) {
          var json = yield doSomeWork({ url: 'example.com/parallel/?4' }, next);
          debug(json);
        }
      ], function (err) {
        debug('gsync.parallel Done!');
        done();
      });

    });

  });

});