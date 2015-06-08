/**
 * Asynchronous control flow with generators.
 * Copyright (c) 2015 Michael Madgett, released under
 * the MIT license.
 * @author Michael Madgett <mike@madgett.io>
 */
(function (global, undefined) {
  var previous_gsync = global.gsync;
  var gsync = function(gen, callback) {
    gsync.series([gen], callback);
  };

  var _setImmediate = typeof module !== 'undefined' && module.exports ?
    setImmediate : (setImmediate || global.setImmediate || window.setImmediate);

  /**
   * Executes generators and asynchronous functions in series, including nested generators.
   * @param o {Array}
   * @param callback {function(err=, result=)=}
   */
  gsync.series = function (o, callback) {
    if (!gsync._isArray(o)) {
      throw new Error('First parameter must be type of Array');
    }
    try {
      var g = (function*() {
        var next = g.next.bind(g);
        var brk = false;
        var rval = null;
        for (var i = 0; i < o.length; i++) {
          if (brk)
            break;
          var gen = o[i];
          if (gen.constructor.name === 'GeneratorFunction') {
            yield *gen(function(err, val) {
              rval = val;
              if (err) {
                brk = true;
                if (callback)
                  _setImmediate(callback, err, rval);
              }
              else
                _setImmediate(next, val);
            });
          }
          else
            yield gen(function(err, val) {
              rval = val;
              if (callback && err)
                _setImmediate(callback, err, rval);
              else
                _setImmediate(next, val);
            });
        }
        if (!brk && callback) {
          yield callback(null, rval);
        }
      })();
      g.next();
    }
    catch (e) {
      if (callback)
        callback(e);
    }
  };

  /**
   * Execute all generators and functions as fast as possible in parallel, including nested generators.
   * Note that generators are inherently serial (iterators) and will internally execute their respective
   * yields as such. However, generators specified in the top level array will continue executing in
   * parallel.
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
                  _setImmediate(callback, err);
              }
              else
                _setImmediate(next, val);
            });
            cnt--;
            if (callback && cnt <= 0)
              _setImmediate(callback);
          })();
          g.next();
        }
        else {
          gen(function(err, val) {
            cnt--;
            if (callback && err)
              _setImmediate(callback, err);
            else if (callback && cnt <= 0)
              _setImmediate(callback);
          });
        }
      }
      if (callback && cnt <= 0)
        callback();
    }
    catch (e) {
      if (callback)
        callback(e);
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
    global.gsync = previous_gsync;
    return gsync;
  };

  // Export to browser or node
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports)
      module.exports = gsync;
    exports.gsync = gsync;
  }
  else if (typeof define !== 'undefined' && define.amd) {
    define([], function () { return gsync; });
  }
  else
    global.gsync = gsync;

}(new Function("return this")()));