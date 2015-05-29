/**
 * Asynchronous control flow with generators.
 * @author Michael Madgett <mike@madgett.io>
 */
(function() {
  var gbl = this;
  var previous_gsync = gbl.gsync;

  var gsync = {};

  /**
   * Executes generators and asynchronous functions in parallel.
   * @param o {Array}
   * @param callback {function(err=)=}
   */
  gsync.series = function (o, callback) {
    if (!gsync._isArray(o)) {
      throw new Error('First parameter must be type of Array');
    }
    try {
      var g = (function*() {
        var next = g.next.bind(g);
        var brk = false;
        for (var i = 0; i < o.length; i++) {
          if (brk)
            break;
          var gen = o[i];
          if (gen.constructor.name === 'GeneratorFunction') {
            yield *gen(function(err, val) {
              if (err) {
                brk = true;
                if (callback)
                  setImmediate(callback, err);
              }
              else
                setImmediate(next, val);
            });
          }
          else
            yield gen(function(err, val) {
              if (callback && err)
                setImmediate(callback, err);
              else
                setImmediate(next, val);
            });
        }
        if (!brk && callback) {
          yield callback();
        }
      })();
      g.next();
    }
    catch (e) {
      console.log(e);
    }
  };

  /**
   * Executes generators and asynchronous functions in parallel.
   * @param o {Array}
   * @param callback {function(err=)=}
   */
  gsync.parallel = function (o, callback) {
    if (!gsync._isArray(o)) {
      throw new Error('First parameter must be type of Array');
    }
    try {
      var cnt = o.length;
      var brk = false;
      for (var i = 0; i < o.length; i++) {
        if (brk)
          break;
        var gen = o[i];
        if (gen.constructor.name === 'GeneratorFunction') {
          var g = (function*() {
            var next = g.next.bind(g);
            yield *gen(function(err, val) {
              if (err) {
                brk = true;
                if (callback)
                  setImmediate(callback, err);
              }
              else
                setImmediate(next, val);
            });
            cnt--;
            if (callback && cnt <= 0)
              setImmediate(callback);
          })();
          g.next();
        }
        else {
          gen(function(err, val) {
            cnt--;
            if (callback && err)
              setImmediate(callback, err);
            else if (callback && cnt <= 0)
              setImmediate(callback);
          });
        }
      }
      if (callback && cnt <= 0)
        callback();
    }
    catch (e) {
      console.log(e);
    }
  };

  /**
   * isArray polyfill
   * @param arg
   * @returns {boolean}
   * @private
   */
  gsync._isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };

  /**
   * No conflict version of the module
   * @returns {Function}
   */
  gsync.noConflict = function() {
    gbl.gsync = previous_gsync;
    return gsync;
  };

  // Export to browser or node
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports)
      exports = module.exports = gsync;
    exports.gsync = gsync;
  }
  else
    gbl.gsync = gsync;

}).call(this);