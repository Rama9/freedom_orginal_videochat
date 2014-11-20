(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var Promise = require("./promise/promise").Promise;
var polyfill = require("./promise/polyfill").polyfill;
exports.Promise = Promise;
exports.polyfill = polyfill;
},{"./promise/polyfill":5,"./promise/promise":6}],2:[function(require,module,exports){
"use strict";
/* global toString */

var isArray = require("./utils").isArray;
var isFunction = require("./utils").isFunction;

/**
  Returns a promise that is fulfilled when all the given promises have been
  fulfilled, or rejected if any of them become rejected. The return promise
  is fulfilled with an array that gives all the values in the order they were
  passed in the `promises` array argument.

  Example:

  ```javascript
  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.resolve(2);
  var promise3 = RSVP.resolve(3);
  var promises = [ promise1, promise2, promise3 ];

  RSVP.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `RSVP.all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.reject(new Error("2"));
  var promise3 = RSVP.reject(new Error("3"));
  var promises = [ promise1, promise2, promise3 ];

  RSVP.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @for RSVP
  @param {Array} promises
  @param {String} label
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
*/
function all(promises) {
  /*jshint validthis:true */
  var Promise = this;

  if (!isArray(promises)) {
    throw new TypeError('You must pass an array to all.');
  }

  return new Promise(function(resolve, reject) {
    var results = [], remaining = promises.length,
    promise;

    if (remaining === 0) {
      resolve([]);
    }

    function resolver(index) {
      return function(value) {
        resolveAll(index, value);
      };
    }

    function resolveAll(index, value) {
      results[index] = value;
      if (--remaining === 0) {
        resolve(results);
      }
    }

    for (var i = 0; i < promises.length; i++) {
      promise = promises[i];

      if (promise && isFunction(promise.then)) {
        promise.then(resolver(i), reject);
      } else {
        resolveAll(i, promise);
      }
    }
  });
}

exports.all = all;
},{"./utils":10}],3:[function(require,module,exports){
(function (process,global){
"use strict";
var browserGlobal = (typeof window !== 'undefined') ? window : {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var local = (typeof global !== 'undefined') ? global : (this === undefined? window:this);

// node
function useNextTick() {
  return function() {
    process.nextTick(flush);
  };
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function() {
    node.data = (iterations = ++iterations % 2);
  };
}

function useSetTimeout() {
  return function() {
    local.setTimeout(flush, 1);
  };
}

var queue = [];
function flush() {
  for (var i = 0; i < queue.length; i++) {
    var tuple = queue[i];
    var callback = tuple[0], arg = tuple[1];
    callback(arg);
  }
  queue = [];
}

var scheduleFlush;

// Decide what async method to use to triggering processing of queued callbacks:
if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else {
  scheduleFlush = useSetTimeout();
}

function asap(callback, arg) {
  var length = queue.push([callback, arg]);
  if (length === 1) {
    // If length is 1, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    scheduleFlush();
  }
}

exports.asap = asap;
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":12}],4:[function(require,module,exports){
"use strict";
var config = {
  instrument: false
};

function configure(name, value) {
  if (arguments.length === 2) {
    config[name] = value;
  } else {
    return config[name];
  }
}

exports.config = config;
exports.configure = configure;
},{}],5:[function(require,module,exports){
(function (global){
"use strict";
/*global self*/
var RSVPPromise = require("./promise").Promise;
var isFunction = require("./utils").isFunction;

function polyfill() {
  var local;

  if (typeof global !== 'undefined') {
    local = global;
  } else if (typeof window !== 'undefined' && window.document) {
    local = window;
  } else {
    local = self;
  }

  var es6PromiseSupport = 
    "Promise" in local &&
    // Some of these methods are missing from
    // Firefox/Chrome experimental implementations
    "resolve" in local.Promise &&
    "reject" in local.Promise &&
    "all" in local.Promise &&
    "race" in local.Promise &&
    // Older version of the spec had a resolver object
    // as the arg rather than a function
    (function() {
      var resolve;
      new local.Promise(function(r) { resolve = r; });
      return isFunction(resolve);
    }());

  if (!es6PromiseSupport) {
    local.Promise = RSVPPromise;
  }
}

exports.polyfill = polyfill;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./promise":6,"./utils":10}],6:[function(require,module,exports){
"use strict";
var config = require("./config").config;
var configure = require("./config").configure;
var objectOrFunction = require("./utils").objectOrFunction;
var isFunction = require("./utils").isFunction;
var now = require("./utils").now;
var all = require("./all").all;
var race = require("./race").race;
var staticResolve = require("./resolve").resolve;
var staticReject = require("./reject").reject;
var asap = require("./asap").asap;

var counter = 0;

config.async = asap; // default async is asap;

function Promise(resolver) {
  if (!isFunction(resolver)) {
    throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
  }

  if (!(this instanceof Promise)) {
    throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
  }

  this._subscribers = [];

  invokeResolver(resolver, this);
}

function invokeResolver(resolver, promise) {
  function resolvePromise(value) {
    resolve(promise, value);
  }

  function rejectPromise(reason) {
    reject(promise, reason);
  }

  try {
    resolver(resolvePromise, rejectPromise);
  } catch(e) {
    rejectPromise(e);
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value, error, succeeded, failed;

  if (hasCallback) {
    try {
      value = callback(detail);
      succeeded = true;
    } catch(e) {
      failed = true;
      error = e;
    }
  } else {
    value = detail;
    succeeded = true;
  }

  if (handleThenable(promise, value)) {
    return;
  } else if (hasCallback && succeeded) {
    resolve(promise, value);
  } else if (failed) {
    reject(promise, error);
  } else if (settled === FULFILLED) {
    resolve(promise, value);
  } else if (settled === REJECTED) {
    reject(promise, value);
  }
}

var PENDING   = void 0;
var SEALED    = 0;
var FULFILLED = 1;
var REJECTED  = 2;

function subscribe(parent, child, onFulfillment, onRejection) {
  var subscribers = parent._subscribers;
  var length = subscribers.length;

  subscribers[length] = child;
  subscribers[length + FULFILLED] = onFulfillment;
  subscribers[length + REJECTED]  = onRejection;
}

function publish(promise, settled) {
  var child, callback, subscribers = promise._subscribers, detail = promise._detail;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    invokeCallback(settled, child, callback, detail);
  }

  promise._subscribers = null;
}

Promise.prototype = {
  constructor: Promise,

  _state: undefined,
  _detail: undefined,
  _subscribers: undefined,

  then: function(onFulfillment, onRejection) {
    var promise = this;

    var thenPromise = new this.constructor(function() {});

    if (this._state) {
      var callbacks = arguments;
      config.async(function invokePromiseCallback() {
        invokeCallback(promise._state, thenPromise, callbacks[promise._state - 1], promise._detail);
      });
    } else {
      subscribe(this, thenPromise, onFulfillment, onRejection);
    }

    return thenPromise;
  },

  'catch': function(onRejection) {
    return this.then(null, onRejection);
  }
};

Promise.all = all;
Promise.race = race;
Promise.resolve = staticResolve;
Promise.reject = staticReject;

function handleThenable(promise, value) {
  var then = null,
  resolved;

  try {
    if (promise === value) {
      throw new TypeError("A promises callback cannot return that same promise.");
    }

    if (objectOrFunction(value)) {
      then = value.then;

      if (isFunction(then)) {
        then.call(value, function(val) {
          if (resolved) { return true; }
          resolved = true;

          if (value !== val) {
            resolve(promise, val);
          } else {
            fulfill(promise, val);
          }
        }, function(val) {
          if (resolved) { return true; }
          resolved = true;

          reject(promise, val);
        });

        return true;
      }
    }
  } catch (error) {
    if (resolved) { return true; }
    reject(promise, error);
    return true;
  }

  return false;
}

function resolve(promise, value) {
  if (promise === value) {
    fulfill(promise, value);
  } else if (!handleThenable(promise, value)) {
    fulfill(promise, value);
  }
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) { return; }
  promise._state = SEALED;
  promise._detail = value;

  config.async(publishFulfillment, promise);
}

function reject(promise, reason) {
  if (promise._state !== PENDING) { return; }
  promise._state = SEALED;
  promise._detail = reason;

  config.async(publishRejection, promise);
}

function publishFulfillment(promise) {
  publish(promise, promise._state = FULFILLED);
}

function publishRejection(promise) {
  publish(promise, promise._state = REJECTED);
}

exports.Promise = Promise;
},{"./all":2,"./asap":3,"./config":4,"./race":7,"./reject":8,"./resolve":9,"./utils":10}],7:[function(require,module,exports){
"use strict";
/* global toString */
var isArray = require("./utils").isArray;

/**
  `RSVP.race` allows you to watch a series of promises and act as soon as the
  first promise given to the `promises` argument fulfills or rejects.

  Example:

  ```javascript
  var promise1 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 1");
    }, 200);
  });

  var promise2 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 2");
    }, 100);
  });

  RSVP.race([promise1, promise2]).then(function(result){
    // result === "promise 2" because it was resolved before promise1
    // was resolved.
  });
  ```

  `RSVP.race` is deterministic in that only the state of the first completed
  promise matters. For example, even if other promises given to the `promises`
  array argument are resolved, but the first completed promise has become
  rejected before the other promises became fulfilled, the returned promise
  will become rejected:

  ```javascript
  var promise1 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 1");
    }, 200);
  });

  var promise2 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error("promise 2"));
    }, 100);
  });

  RSVP.race([promise1, promise2]).then(function(result){
    // Code here never runs because there are rejected promises!
  }, function(reason){
    // reason.message === "promise2" because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  @method race
  @for RSVP
  @param {Array} promises array of promises to observe
  @param {String} label optional string for describing the promise returned.
  Useful for tooling.
  @return {Promise} a promise that becomes fulfilled with the value the first
  completed promises is resolved with if the first completed promise was
  fulfilled, or rejected with the reason that the first completed promise
  was rejected with.
*/
function race(promises) {
  /*jshint validthis:true */
  var Promise = this;

  if (!isArray(promises)) {
    throw new TypeError('You must pass an array to race.');
  }
  return new Promise(function(resolve, reject) {
    var results = [], promise;

    for (var i = 0; i < promises.length; i++) {
      promise = promises[i];

      if (promise && typeof promise.then === 'function') {
        promise.then(resolve, reject);
      } else {
        resolve(promise);
      }
    }
  });
}

exports.race = race;
},{"./utils":10}],8:[function(require,module,exports){
"use strict";
/**
  `RSVP.reject` returns a promise that will become rejected with the passed
  `reason`. `RSVP.reject` is essentially shorthand for the following:

  ```javascript
  var promise = new RSVP.Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  var promise = RSVP.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @for RSVP
  @param {Any} reason value that the returned promise will be rejected with.
  @param {String} label optional string for identifying the returned promise.
  Useful for tooling.
  @return {Promise} a promise that will become rejected with the given
  `reason`.
*/
function reject(reason) {
  /*jshint validthis:true */
  var Promise = this;

  return new Promise(function (resolve, reject) {
    reject(reason);
  });
}

exports.reject = reject;
},{}],9:[function(require,module,exports){
"use strict";
function resolve(value) {
  /*jshint validthis:true */
  if (value && typeof value === 'object' && value.constructor === this) {
    return value;
  }

  var Promise = this;

  return new Promise(function(resolve) {
    resolve(value);
  });
}

exports.resolve = resolve;
},{}],10:[function(require,module,exports){
"use strict";
function objectOrFunction(x) {
  return isFunction(x) || (typeof x === "object" && x !== null);
}

function isFunction(x) {
  return typeof x === "function";
}

function isArray(x) {
  return Object.prototype.toString.call(x) === "[object Array]";
}

// Date.now is not available in browsers < IE9
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now#Compatibility
var now = Date.now || function() { return new Date().getTime(); };


exports.objectOrFunction = objectOrFunction;
exports.isFunction = isFunction;
exports.isArray = isArray;
exports.now = now;
},{}],11:[function(require,module,exports){

},{}],12:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],13:[function(require,module,exports){
/*! JSON.minify()
	v0.1.3-a (c) Kyle Simpson
	MIT License
*/

module.exports = function(json) {
	
	var tokenizer = /"|(\/\*)|(\*\/)|(\/\/)|\n|\r/g,
		in_string = false,
		in_multiline_comment = false,
		in_singleline_comment = false,
		tmp, tmp2, new_str = [], ns = 0, from = 0, lc, rc
	;
	
	tokenizer.lastIndex = 0;
	
	while (tmp = tokenizer.exec(json)) {
		lc = RegExp.leftContext;
		rc = RegExp.rightContext;
		if (!in_multiline_comment && !in_singleline_comment) {
			tmp2 = lc.substring(from);
			if (!in_string) {
				tmp2 = tmp2.replace(/(\n|\r|\s)*/g,"");
			}
			new_str[ns++] = tmp2;
		}
		from = tokenizer.lastIndex;
		
		if (tmp[0] == "\"" && !in_multiline_comment && !in_singleline_comment) {
			tmp2 = lc.match(/(\\)*$/);
			if (!in_string || !tmp2 || (tmp2[0].length % 2) == 0) {	// start of string with ", or unescaped " character found to end string
				in_string = !in_string;
			}
			from--; // include " character in next catch
			rc = json.substring(from);
		}
		else if (tmp[0] == "/*" && !in_string && !in_multiline_comment && !in_singleline_comment) {
			in_multiline_comment = true;
		}
		else if (tmp[0] == "*/" && !in_string && in_multiline_comment && !in_singleline_comment) {
			in_multiline_comment = false;
		}
		else if (tmp[0] == "//" && !in_string && !in_multiline_comment && !in_singleline_comment) {
			in_singleline_comment = true;
		}
		else if ((tmp[0] == "\n" || tmp[0] == "\r") && !in_string && !in_multiline_comment && in_singleline_comment) {
			in_singleline_comment = false;
		}
		else if (!in_multiline_comment && !in_singleline_comment && !(/\n|\r|\s/.test(tmp[0]))) {
			new_str[ns++] = tmp[0];
		}
	}
	new_str[ns++] = rc;
	return new_str.join("");
};


},{}],14:[function(require,module,exports){
(function (process){
/*globals process, console */
/*jslint indent:2,sloppy:true, node:true */
var util = require('../../src/util');

/**
 * A freedom.js logging provider that logs to chrome, firefox, and node consoles.
 * @Class Logger_console
 * @constructor
 * @private
 * @param {App} app The application creating this provider, in practice unset.
 */
var Logger_console = function (app) {
  this.level = (app.config && app.config.debug) || 'log';
  this.console = (app.config && app.config.global.console);
  util.handleEvents(this);
};


/**
 * Logging levels, for filtering output.
 * @private
 * @static
 */
Logger_console.level = {
  "debug": 0,
  "info": 1,
  "log": 2,
  "warn": 3,
  "error": 4
};

/**
 * Print a message with appropriate formatting.
 * @method print
 */
Logger_console.prototype.print = function (severity, source, msg) {
  var arr = msg;
  if (typeof this.console === 'undefined' ||
      this.console.freedom === true) {
    return;
  }
  if (typeof arr === 'string') {
    arr = [arr];
  }
  
  if (Logger_console.level[this.level] !== undefined &&
      Logger_console.level[severity] < Logger_console.level[this.level]) {
    return;
  }
  
  if (typeof process !== 'undefined' &&
      {}.toString.call(process) === '[object process]' && source) {
    arr.unshift('\x1B[39m');
    arr.unshift('\x1B[31m' + source);
    /*jslint nomen: true*/
  } else if (this.console.__mozillaConsole__ && source) {
    arr.unshift(source.toUpperCase());
    /*jslint nomen: false*/
  } else if (source) {
    arr.unshift('color: red');
    arr.unshift('%c ' + source);
  }
  if (!this.console[severity] && this.console.log) {
    severity = 'log';
  }
  this.console[severity].apply(this.console, arr);
};

/**
 * Log a message to the console.
 * @param {String} source The source of the message.
 * @param {String} msg The message to log.
 * @method log
 */
Logger_console.prototype.log = function (source, msg, continuation) {
  this.print('log', source, msg);
  continuation();
};

/**
 * Log a message to the console with debug priority.
 * @param {String} source The source of the message.
 * @param {String} msg The message to log.
 * @method log
 */
Logger_console.prototype.debug = function (source, msg, continuation) {
  this.print('debug', source, msg);
  continuation();
};

/**
 * Log a message to the console with info priority.
 * @param {String} source The source of the message.
 * @param {String} msg The message to log.
 * @method log
 */
Logger_console.prototype.info = function (source, msg, continuation) {
  this.print('info', source, msg);
  continuation();
};

/**
 * Log a message to the console with warn priority.
 * @param {String} source The source of the message.
 * @param {String} msg The message to log.
 * @method log
 */
Logger_console.prototype.warn = function (source, msg, continuation) {
  this.print('warn', source, msg);
  continuation();
};

/**
 * Log a message to the console with error priority.
 * @param {String} source The source of the message.
 * @param {String} msg The message to log.
 * @method log
 */
Logger_console.prototype.error = function (source, msg, continuation) {
  this.print('error', source, msg);
  continuation();
};

/** REGISTER PROVIDER **/
exports.provider = Logger_console;
exports.name = 'core.console';

}).call(this,require('_process'))
},{"../../src/util":73,"_process":12}],15:[function(require,module,exports){
/*globals console */
/*jslint indent:2,white:true,sloppy:true,node:true */

/**
 * An oAuth meta-provider allowing multiple platform-dependant
 * oAuth implementations to serve as the redirectURL for an oAuth flow.
 * The core implementations are provided in providers/oauth, and are
 * supplemented in platform-dependent repositories.
 *
 */
var OAuth = function (handlers, mod, dispatchEvent) {
  this.handlers = handlers;
  this.mod = mod;
  this.dispatchEvent = dispatchEvent;
  this.ongoing = {};
};

/**
 * Register oAuth handlers.
 * This method should be called before provider is used, and binds the current
 * oAuth provider to be associated with registered handlers. This is used so
 * that handlers which are registered by the user apply only the the freedom()
 * setup call they are associated with, while still being registered across
 * multiple instances of OAuth providers.
 *
 * @method register
 * @param {[constructor]} handlers
 * @private
 */
OAuth.register = function (handlers) {
  var i,
      boundHandlers = [];
  if (!handlers || !handlers.length) {
    return OAuth.reset();
  }

  for (i = 0; i < handlers.length; i += 1) {
    boundHandlers.push(new handlers[i]());
  }
  exports.provider = OAuth.bind(this, boundHandlers);
};

/**
 * Reset the oAuth provider registrations.
 * @method reset
 * @private
 */
OAuth.reset = function () {
  exports.provider = OAuth.bind(this, []);
};

/**
 * Indicate the intention to initiate an oAuth flow, allowing an appropriate
 * oAuth provider to begin monitoring for redirection.
 *
 * @method initiateOAuth
 * @param {string[]} redirectURIs - oAuth redirection URIs registered with the
 *     provider.
 * @param {Function} continuation - Function to call when complete
 *    Expected to see a value of schema: {{redirect:String, state:String}}
 *    where 'redirect' is the chosen redirect URI
 *    and 'state' is the state to pass to the URI on completion of oAuth
 */
OAuth.prototype.initiateOAuth = function (redirectURIs, continuation) {
  var promise, i;
  var successCallback = function(result) {
    this.ongoing[result.state] = this.handlers[i];
    continuation(result);
  }.bind(this);

  for (i = 0; i < this.handlers.length; i += 1) {
    if (this.handlers[i].initiateOAuth(redirectURIs, successCallback)) {
      return;
    }
  }
  //If here, we have no compatible providers
  continuation(null, {
    'errcode': 'UNKNOWN',
    'message': 'No requested redirects can be handled.'
  });
  return;
};

/**
 * oAuth client-side flow - launch the provided URL
 * This must be called after initiateOAuth with the returned state object
 *
 * @method launchAuthFlow
 * @param {String} authUrl - The URL that initiates the auth flow.
 * @param {Object.<string, string>} stateObj - The return value from initiateOAuth
 * @param {Function} continuation - Function to call when complete
 *    Expected to see a String value that is the response Url containing the access token
 */
OAuth.prototype.launchAuthFlow = function(authUrl, stateObj, continuation) {
  if (!this.ongoing.hasOwnProperty(stateObj.state)) {
    continuation(undefined, {
      'errcode': 'UNKNOWN',
      'message': 'You must begin the oAuth flow with initiateOAuth first'
    });
    return;
  }

  this.ongoing[stateObj.state].launchAuthFlow(authUrl, stateObj, continuation);
  delete this.ongoing[stateObj.state];
};

exports.register = OAuth.register;
exports.reset = OAuth.reset;
exports.provider = OAuth.bind(this, []);
exports.name = 'core.oauth';

},{}],16:[function(require,module,exports){
/*jslint indent:2,white:true,sloppy:true,node:true */
var EventInterface = require('../../src/proxy/eventInterface');
var Consumer = require('../../src/consumer');
var util = require('../../src/util');

/**
 * Core freedom services available to all modules.
 * Created by the environment helper in response to a 'core' request.
 * @Class Core_unprivileged
 * @constructor
 * @param {Manager} manager The manager this core is connected with.
 * @private
 */
var Core_unprivileged = function(manager, postMessage) {
  this.manager = manager;
  this.debug = this.manager.debug;
};

Core_unprivileged.unboundChannels = {};

Core_unprivileged.contextId = undefined;

/**
 * Create a custom channel.
 * Returns the structure {channel: Proxy, identifier: Object},
 * where the identifier can be 'redeemed' by another module or provider using
 * bind channel, at which point the deferred object will resolve with a channel
 * between the two endpoints.
 * @method createChannel
 * @params {Function} continuation Method to call with the cosntructed structure.
 */
Core_unprivileged.prototype.createChannel = function(continuation) {
  var proxy = new Consumer(EventInterface, this.manager.debug),
      id = util.getId(),
      chan = this.getChannel(proxy);
  this.manager.setup(proxy);

  if (this.manager.delegate && this.manager.toDelegate.core) {
    this.manager.emit(this.manager.delegate, {
      type: 'Delegation',
      request: 'handle',
      flow: 'core',
      message: {
        type: 'register',
        id: id
      }
    });
  }
  Core_unprivileged.unboundChannels[id] = {
    local: true,
    proxy: proxy
  };

  proxy.once('start', this.getChannel.bind(this, proxy));

  continuation({
    channel: chan,
    identifier: id
  });
};

Core_unprivileged.prototype.getChannel = function(proxy) {
  var iface = proxy.getProxyInterface(),
      chan = iface();
  chan.close = iface.close;
  chan.onClose = iface.onClose;
  iface.onClose(chan, function() {
    proxy.doClose();
  });
  return chan;
};

/**
 * Receive a message from another core instance.
 * Note: Core_unprivileged is not registered on the hub. it is a provider,
 *     as it's location and name would indicate. This function is called by
 *     port-app to relay messages up to higher levels.  More generally, the
 *     messages emitted by the core to 'this.manager.emit(this.mananage.delegate'
 *     Should be onMessaged to the controlling core.
 * @param {String} source The source of the message.
 * @param {Object} msg The messsage from an isolated core provider.
 */
Core_unprivileged.prototype.onMessage = function(source, msg) {
  if (msg.type === 'register') {
    Core_unprivileged.unboundChannels[msg.id] = {
      remote: true,
      resolve: msg.reply,
      source: source
    };
  } else if (msg.type === 'clear') {
    delete Core_unprivileged.unboundChannels[msg.id];
  } else if (msg.type === 'bind') {
    if (Core_unprivileged.unboundChannels[msg.id]) {
      this.bindChannel(msg.id, function() {}, source);
    }
  }
};

/**
 * Bind a custom channel.
 * Creates a proxy interface to the custom channel, which will be bound to
 * the proxy obtained through an earlier createChannel call.
 * channel to a proxy.
 * @method bindChannel
 * @param {Object} identifier An identifier obtained through createChannel.
 * @param {Function} continuation A function to be called with the proxy.
 */
Core_unprivileged.prototype.bindChannel = function(identifier, continuation, source) {
  var toBind = Core_unprivileged.unboundChannels[identifier],
      newSource = !source;

  // when bindChannel is called directly, source will be undefined.
  // When it is propogated by onMessage, a source for binding will already exist.
  if (newSource) {
    this.debug.debug('making local proxy for core binding');
    source = new Consumer(EventInterface, this.debug);
    this.manager.setup(source);
  }

  // If this is a known identifier and is in the same context, binding is easy.
  if (toBind && toBind.local) {
    this.debug.debug('Binding a channel to port on this hub:' + source);
    this.manager.createLink(source, identifier, toBind.proxy, 'default');
    delete Core_unprivileged.unboundChannels[identifier];
    if (this.manager.delegate && this.manager.toDelegate.core) {
      this.manager.emit(this.manager.delegate, {
        type: 'Delegation',
        request: 'handle',
        flow: 'core',
        message: {
          type: 'clear',
          id: identifier
        }
      });
    }
  } else if (toBind && toBind.remote) {
    this.debug.debug('Binding a channel into a module.');
    this.manager.createLink(
        source,
        newSource ? 'default' : identifier,
        toBind.source,
        identifier);
    toBind.resolve({
      type: 'Bind Channel',
      request:'core',
      flow: 'core',
      message: {
        type: 'bind',
        id: identifier
      }
    });
    delete Core_unprivileged.unboundChannels[identifier];
  } else if (this.manager.delegate && this.manager.toDelegate.core) {
    this.debug.info('delegating channel bind for an unknown ID:' + identifier);
    this.manager.emit(this.manager.delegate, {
      type: 'Delegation',
      request: 'handle',
      flow: 'core',
      message: {
        type: 'bind',
        id: identifier
      }
    });
    source.once('start', function(p, cb) {
      cb(this.getChannel(p));
    }.bind(this, source, continuation));
    this.manager.createLink(source,
        'default',
        this.manager.hub.getDestination(this.manager.delegate),
        identifier);
    delete Core_unprivileged.unboundChannels[identifier];
    return;
  } else {
    this.debug.warn('Asked to bind unknown channel: ' + identifier);
    this.debug.log(Core_unprivileged.unboundChannels);
    continuation();
    return;
  }

  if (source.getInterface) {
    continuation(this.getChannel(source));
  } else {
    continuation();
  }
};

/**
 * Get the ID of the current freedom.js context.  Provides an
 * array of module URLs, the lineage of the current context.
 * When not in an application context, the ID is the lineage
 * of the current View.
 * @method getId
 * @param {Function} callback The function called with ID information.
 */
Core_unprivileged.prototype.getId = function(callback) {
  // TODO: make sure contextID is properly frozen.
  callback(Core_unprivileged.contextId);
};

/**
 * Get a logger for logging to the freedom.js logger. Provides a
 * log object with an interface similar to the standard javascript console,
 * which logs via debug.
 * @method getLogger
 * @param {String} name The name of the logger, used as its 'source'
 * @param {Function} callback The function to call with the logger.
 */
Core_unprivileged.prototype.getLogger = function(name, callback) {
  callback(this.manager.debug.getLogger(name));
};

/**
 * Set the ID of the current freedom.js context.
 * @method setId
 * @private
 * @param {String[]} id The lineage of the current context.
 */
Core_unprivileged.prototype.setId = function(id) {
  Core_unprivileged.contextId = id;
};

exports.provider = Core_unprivileged;
exports.name = "core";

},{"../../src/consumer":57,"../../src/proxy/eventInterface":70,"../../src/util":73}],17:[function(require,module,exports){
/*globals document */
/*jslint indent:2,sloppy:true,node:true */
var util = require('../../src/util');
var PromiseCompat = require('es6-promise').Promise;

/**
 * A freedom.js view is the interface for user interaction.
 * A view exists as an iFrame, which is shown to the user in some way.
 * communication between the view and the freedom.js module is performed
 * through the HTML5 postMessage mechanism, which this provider translates
 * to freedom.js message events.
 * @Class View_unprivileged
 * @constructor
 * @private
 * @param {View Provider} provider
 * @param {port.Module} caller The module creating this provider.
 * @param {Function} dispatchEvent Function to call to emit events.
 */
var Core_View = function (provider, caller, dispatchEvent) {
  this.provider = provider;
  this.dispatchEvent = dispatchEvent;
  this.module = caller;
  this.module.once('close', this.close.bind(this, function () {}));
  util.handleEvents(this);
};

/**
 * The is the default provider for core.view, unless overridden by context or
 * a user supplied provider. The interface is documented at:
 * https://github.com/freedomjs/freedom/wiki/freedom.js-Views
 *
 * Generally, a view provider consists of 3 methods:
 * onOpen is called when a view should be shown.
 *     id - is a unique identifier for this view, used on subsequent calls
 *          for communication and to eventually close the view.
 *     name - is the name of the view (as defined in the manifest),
 *            in order to place it appropriately.
 *     page - is the resolved URL to open.
 *     resources - is an array of resolved URLs which are referenced.
 *     postMessage - is a function to call when messages are emitted
 *                   by the window in which the view is opened.
 * onOpen returns a promise that completes when the view is loaded.
 * onMessage is called to send a message to an open view.
 *     id - is the unique identifier for the open view.
 *     message - is the message to postMessage to the view's window.
 * onClose is called to close a view.
 *     id - is the unique identifier for the view.
 */
Core_View.provider = {
  listener: undefined,
  active: {},
  onOpen: function (id, name, page, resources, postMessage) {
    var container = document.body,
      root,
      frame;
    
    if (!this.listener) {
      this.listener = function (msg) {
        var i;
        for (i in this.active) {
          if (this.active.hasOwnProperty(i) &&
              this.active[i].source === msg.source) {
            this.active[i].postMessage(msg.data);
          }
        }
      }.bind(this);
      window.addEventListener('message', this.listener, true);
    }

    // Views open by default in an element with their ID, or fill the page
    // otherwise.
    if (document.getElementById(name)) {
      container = document.getElementById(name);
    }

    root = document.createElement("div");
    root.style.width = "100%";
    root.style.height = "100%";
    root.style.display = "relative";

    container.appendChild(root);
    
    return new PromiseCompat(function (resolve, reject) {
      frame = document.createElement("iframe");
      frame.setAttribute("sandbox", "allow-scripts allow-forms");
      frame.style.width = "100%";
      frame.style.height = "100%";
      frame.style.border = "0";
      frame.style.background = "transparent";
      frame.src = page;
      frame.addEventListener('load', resolve, true);
      frame.addEventListener('error', reject, true);

      root.appendChild(frame);

      this.active[id] = {
        postMessage: postMessage,
        container: container,
        root: root,
        source: frame.contentWindow
      };
    }.bind(this));
  },
  onMessage: function (id, message) {
    this.active[id].source.postMessage(message, '*');
  },
  onClose: function (id) {
    this.active[id].container.removeChild(this.active[id].root);
    delete this.active[id];
    
    if (Object.keys(this.active).length === 0) {
      window.removeEventListener('message', this.listener, true);
      this.listener = undefined;
    }
  }
};

/**
 * Ask for this view to open a specific location, either a File relative to
 * the loader, or an explicit code location.
 * @method show
 * @param {String} name The identifier of the view.
 * @param {Function} continuation Function to call when view is loaded.
 */
Core_View.prototype.show = function (name, continuation) {
  if (this.id) {
    return continuation(undefined, {
      errcode: 'ALREADY_OPEN',
      message: 'Cannot show multiple views through one instance.'
    });
  }
  this.id = util.getId();

  var config = this.module.manifest.views,
    toResolve = [];
  if (!config || !config[name]) {
    return continuation(undefined, {
      errcode: 'NON_EXISTANT',
      message: 'View not found: ' + name
    });
  }

  if (config[name].main && config[name].files) {
    toResolve = config[name].files.concat(config[name].main);
    PromiseCompat.all(toResolve.map(function (fname) {
      return this.module.resource.get(this.module.manifestId, fname);
    }.bind(this))).then(function (files) {
      this.provider.onOpen(this.id,
          name,
          files[files.length - 1],
          files,
          this.dispatchEvent.bind(this, 'message')).then(
        continuation,
        continuation.bind({}, undefined)
      );
    }.bind(this), function (err) {
      this.module.debug.error('Unable to open view ' + name + ': ', err);
      continuation(undefined, {
        errcode: 'VIEW_MALFORMED',
        message: 'Malformed View Declaration: ' + err
      });
    });
  } else {
    continuation(undefined, {
      errcode: 'NON_EXISTANT',
      message: 'View not found: ' + name
    });
  }
};

/**
 * isSecure determines whether the module can have confidence that its
 * communication with its view cannot be intercepted by an untrusted 3rd party.
 * In practice, this means that its okay for the runtime to have access to the
 * messages, and if the context is a web server or a browser extension then
 * that context is trusted. However, if a provider wants to allow their e.g.
 * social provider to be used on arbitrary websites, this mechanism means that
 * if the website uses a trusted version of the freedom.js library, then the
 * module can be used.
 * @method isSecure
 * @returns {Boolean} if the channel to the view is secure.
 */
Core_View.prototype.isSecure = function (continuation) {
  continuation(false);
};

/**
 * Send a message to an open view.
 * @method postMessage
 */
Core_View.prototype.postMessage = function (msg, continuation) {
  if (!this.id) {
    return continuation(undefined, {
      errcode: 'NOT_OPEN',
      message: 'Cannot post message to uninitialized view.'
    });
  }
  this.provider.onMessage(this.id, msg);
  continuation();
};

/**
 * Close an active view.
 * @method close
 */
Core_View.prototype.close = function (continuation) {
  if (!this.id) {
    return continuation(undefined, {
      errcode: 'NOT_OPEN',
      message: 'Cannot close uninitialized view.'
    });
  }
  this.provider.onClose(this.id);
  delete this.id;

  continuation();
};


/**
 * Allow a web page to redefine behavior for how views are shown.
 * @method register
 * @static
 * @param {Function} PageProvider The custom view behavior.
 */
Core_View.register = function (PageProvider) {
  var provider = PageProvider ? new PageProvider() : Core_View.provider;
  exports.provider = Core_View.bind(this, provider);
};

exports.provider = Core_View.bind(this, Core_View.provider);
exports.name = 'core.view';
exports.register = Core_View.register;

},{"../../src/util":73,"es6-promise":1}],18:[function(require,module,exports){
/*globals console */
/*jslint indent:2,white:true,sloppy:true, node:true */
var util = require('../../src/util');

/**
 * A minimal provider implementing the core.echo interface for interaction with
 * custom channels.  Primarily used for testing the robustness of the custom
 * channel implementation.
 * @Class Echo_unprivileged
 * @constructor
 * @param {Module} mod The module creating this provider.
 */
var Echo_unprivileged = function(mod, dispatchEvent) {
  this.mod = mod;
  this.dispatchEvent = dispatchEvent;
  util.handleEvents(this);

  // The Core object for managing channels.
  this.mod.once('core', function(Core) {
    this.core = new Core();
  }.bind(this));
  this.mod.emit(this.mod.controlChannel, {
    type: 'core request delegated to echo',
    request: 'core'
  });
};

/**
 * Setup the provider to echo on a specific proxy. Subsequent messages
 * From the custom channel bound here will be re-emitted as a message
 * from the provider.  Subsequent messages to the provider will be
 * emitted on the bound channel.
 * @param {Object} proxy The identifier for the custom channel to bind.
 * @param {Function} continuation Function to call when setup is complete.
 * @method setup
 */
Echo_unprivileged.prototype.setup = function(proxy, continuation) {
  continuation();
  if (!this.core) {
    this.dispatchEvent('message', 'no core available to setup proxy with at echo');
    return;
  }

  this.core.bindChannel(proxy, function(chan) {
    if (this.chan) {
      this.chan.close();
    }
    this.chan = chan;
    this.chan.onClose(function() {
      delete this.chan;
    }.bind(this));
    this.dispatchEvent('message', 'channel bound to echo');
    this.chan.on('message', function(m) {
      this.dispatchEvent('message', 'from custom channel: ' + m);
    }.bind(this));
  }.bind(this));
};

/**
 * Send a message to the bound custom channel.
 * @param {String} str The string to send.
 * @param {Function} continuation Function to call when sending is complete.
 * @method send
 */
Echo_unprivileged.prototype.send = function(str, continuation) {
  continuation();
  if (this.chan) {
    this.chan.emit('message', str);
  } else {
    this.dispatchEvent('message', 'no channel available');
  }
};

exports.provider = Echo_unprivileged;
exports.name = "core.echo";

},{"../../src/util":73}],19:[function(require,module,exports){
/*globals console, RTCPeerConnection, webkitRTCPeerConnection */
/*globals mozRTCPeerConnection, RTCSessionDescription, RTCIceCandidate */
/*globals mozRTCSessionDescription, mozRTCIceCandidate */
/*globals ArrayBuffer, Blob */
/*jslint indent:2,sloppy:true,node:true */
/**
 * DataPeer - a class that wraps peer connections and data channels.
 */
// TODO: check that Handling of pranswer is treated appropriately.
var SimpleDataPeerState = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED'
};

function SimpleDataPeer(peerName, stunServers, dataChannelCallbacks, mocks) {
  var constraints,
    config,
    i;
  this.peerName = peerName;
  this.channels = {};
  this.dataChannelCallbacks = dataChannelCallbacks;
  this.onConnectedQueue = [];

  if (typeof mocks.RTCPeerConnection !== "undefined") {
    this.RTCPeerConnection = mocks.RTCPeerConnection;
  } else if (typeof webkitRTCPeerConnection !== "undefined") {
    this.RTCPeerConnection = webkitRTCPeerConnection;
  } else if (typeof mozRTCPeerConnection !== "undefined") {
    this.RTCPeerConnection = mozRTCPeerConnection;
  } else {
    throw new Error("This environment does not appear to support RTCPeerConnection");
  }

  if (typeof mocks.RTCSessionDescription !== "undefined") {
    this.RTCSessionDescription = mocks.RTCSessionDescription;
  } else if (typeof RTCSessionDescription !== "undefined") {
    this.RTCSessionDescription = RTCSessionDescription;
  } else if (typeof mozRTCSessionDescription !== "undefined") {
    this.RTCSessionDescription = mozRTCSessionDescription;
  } else {
    throw new Error("This environment does not appear to support RTCSessionDescription");
  }

  if (typeof mocks.RTCIceCandidate !== "undefined") {
    this.RTCIceCandidate = mocks.RTCIceCandidate;
  } else if (typeof RTCIceCandidate !== "undefined") {
    this.RTCIceCandidate = RTCIceCandidate;
  } else if (typeof mozRTCIceCandidate !== "undefined") {
    this.RTCIceCandidate = mozRTCIceCandidate;
  } else {
    throw new Error("This environment does not appear to support RTCIceCandidate");
  }


  constraints = {
    optional: [{DtlsSrtpKeyAgreement: true}]
  };
  // A way to speak to the peer to send SDP headers etc.
  this.sendSignalMessage = null;

  this.pc = null;  // The peer connection.
  // Get TURN servers for the peer connection.
  config = {iceServers: []};
  for (i = 0; i < stunServers.length; i += 1) {
    config.iceServers.push({
      'url' : stunServers[i]
    });
  }
  this.pc = new this.RTCPeerConnection(config, constraints);
  // Add basic event handlers.
  this.pc.addEventListener("icecandidate",
                            this.onIceCallback.bind(this));
  this.pc.addEventListener("negotiationneeded",
                            this.onNegotiationNeeded.bind(this));
  this.pc.addEventListener("datachannel",
                            this.onDataChannel.bind(this));
  this.pc.addEventListener("signalingstatechange", function () {
    // TODO: come up with a better way to detect connection.  We start out
    // as "stable" even before we are connected.
    // TODO: this is not fired for connections closed by the other side.
    // This will be fixed in m37, at that point we should dispatch an onClose
    // event here for freedom.transport to pick up.
    if (this.pc.signalingState === "stable") {
      this.pcState = SimpleDataPeerState.CONNECTED;
      this.onConnectedQueue.map(function (callback) { callback(); });
    }
  }.bind(this));
  // This state variable is used to fake offer/answer when they are wrongly
  // requested and we really just need to reuse what we already have.
  this.pcState = SimpleDataPeerState.DISCONNECTED;

  // Note: to actually do something with data channels opened by a peer, we
  // need someone to manage "datachannel" event.
}

SimpleDataPeer.prototype.createOffer = function (constaints, continuation) {
  this.pc.createOffer(continuation, function () {
    console.error('core.peerconnection createOffer failed.');
  }, constaints);
};

SimpleDataPeer.prototype.runWhenConnected = function (func) {
  if (this.pcState === SimpleDataPeerState.CONNECTED) {
    func();
  } else {
    this.onConnectedQueue.push(func);
  }
};

SimpleDataPeer.prototype.send = function (channelId, message, continuation) {
  this.channels[channelId].send(message);
  continuation();
};

SimpleDataPeer.prototype.openDataChannel = function (channelId, continuation) {
  var dataChannel = this.pc.createDataChannel(channelId, {});
  dataChannel.onopen = function () {
    this.addDataChannel(channelId, dataChannel);
    continuation();
  }.bind(this);
  dataChannel.onerror = function (err) {
    //@(ryscheng) todo - replace with errors that work across the interface
    console.error(err);
    continuation(undefined, err);
  };
  // Firefox does not fire "negotiationneeded", so we need to
  // negotate here if we are not connected.
  // See https://bugzilla.mozilla.org/show_bug.cgi?id=840728
  if (typeof mozRTCPeerConnection !== "undefined" &&
      this.pcState === SimpleDataPeerState.DISCONNECTED) {
    this.negotiateConnection();
  }
};

SimpleDataPeer.prototype.closeChannel = function (channelId) {
  if (this.channels[channelId] !== undefined) {
    this.channels[channelId].close();
    delete this.channels[channelId];
  }
};

SimpleDataPeer.prototype.getBufferedAmount = function (channelId,
                                                       continuation) {
  if (this.channels[channelId] !== undefined) {
    var dataChannel = this.channels[channelId];
    return dataChannel.bufferedAmount;
  }
  throw new Error("No channel with id: " + channelId);
};

SimpleDataPeer.prototype.setSendSignalMessage = function (sendSignalMessageFn) {
  this.sendSignalMessage = sendSignalMessageFn;
};

// Handle a message send on the signalling channel to this peer.
SimpleDataPeer.prototype.handleSignalMessage = function (messageText) {
  //console.log(this.peerName + ": " + "handleSignalMessage: \n" + messageText);
  var json = JSON.parse(messageText),
    ice_candidate;

  // TODO: If we are offering and they are also offerring at the same time,
  // pick the one who has the lower randomId?
  // (this.pc.signalingState == "have-local-offer" && json.sdp &&
  //    json.sdp.type == "offer" && json.sdp.randomId < this.localRandomId)
  if (json.sdp) {
    // Set the remote description.
    this.pc.setRemoteDescription(
      new this.RTCSessionDescription(json.sdp),
      // Success
      function () {
        //console.log(this.peerName + ": setRemoteDescription succeeded");
        if (this.pc.remoteDescription.type === "offer") {
          this.pc.createAnswer(this.onDescription.bind(this),
                               console.error);
        }
      }.bind(this),
      // Failure
      function (e) {
        console.error(this.peerName + ": " +
            "setRemoteDescription failed:", e);
      }.bind(this)
    );
  } else if (json.candidate) {
    // Add remote ice candidate.
    //console.log(this.peerName + ": Adding ice candidate: " + JSON.stringify(json.candidate));
    ice_candidate = new this.RTCIceCandidate(json.candidate);
    this.pc.addIceCandidate(ice_candidate);
  } else {
    console.warn(this.peerName + ": " +
        "handleSignalMessage got unexpected message: ", messageText);
  }
};

// Connect to the peer by the signalling channel.
SimpleDataPeer.prototype.negotiateConnection = function () {
  this.pcState = SimpleDataPeerState.CONNECTING;
  this.pc.createOffer(
    this.onDescription.bind(this),
    function (e) {
      console.error(this.peerName + ": " +
          "createOffer failed: ", e.toString());
      this.pcState = SimpleDataPeerState.DISCONNECTED;
    }.bind(this)
  );
};

SimpleDataPeer.prototype.isClosed = function () {
  return !this.pc || this.pc.signalingState === "closed";
};

SimpleDataPeer.prototype.close = function () {
  if (!this.isClosed()) {
    this.pc.close();
  }
  //console.log(this.peerName + ": " + "Closed peer connection.");
};

SimpleDataPeer.prototype.addDataChannel = function (channelId, channel) {
  var callbacks = this.dataChannelCallbacks;
  this.channels[channelId] = channel;

  if (channel.readyState === "connecting") {
    channel.onopen = callbacks.onOpenFn.bind(this, channel, {label: channelId});
  }

  channel.onclose = callbacks.onCloseFn.bind(this, channel, {label: channelId});

  channel.onmessage = callbacks.onMessageFn.bind(this, channel,
                                                 {label: channelId});

  channel.onerror = callbacks.onErrorFn.bind(this, channel, {label: channel});
};

// When we get our description, we set it to be our local description and
// send it to the peer.
SimpleDataPeer.prototype.onDescription = function (description) {
  if (this.sendSignalMessage) {
    this.pc.setLocalDescription(
      description,
      function () {
        //console.log(this.peerName + ": setLocalDescription succeeded");
        this.sendSignalMessage(JSON.stringify({'sdp': description}));
      }.bind(this),
      function (e) {
        console.error(this.peerName + ": " +
            "setLocalDescription failed:", e);
      }.bind(this)
    );
  } else {
    console.error(this.peerName + ": " +
        "_onDescription: _sendSignalMessage is not set, so we did not " +
            "set the local description. ");
  }
};

SimpleDataPeer.prototype.onNegotiationNeeded = function (e) {
  //console.log(this.peerName + ": " + "onNegotiationNeeded",
  //            JSON.stringify(this._pc), e);
  if (this.pcState !== SimpleDataPeerState.DISCONNECTED) {
    // Negotiation messages are falsely requested for new data channels.
    //   https://code.google.com/p/webrtc/issues/detail?id=2431
    // This code is a hack to simply reset the same local and remote
    // description which will trigger the appropriate data channel open event.
    // TODO: fix/remove this when Chrome issue is fixed.
    var logSuccess = function (op) {
      return function () {
        //console.log(this.peerName + ": " + op + " succeeded ");
      }.bind(this);
    }.bind(this),
      logFail = function (op) {
        return function (e) {
          //console.log(this.peerName + ": " + op + " failed: " + e);
        }.bind(this);
      }.bind(this);
    if (this.pc.localDescription && this.pc.remoteDescription &&
        this.pc.localDescription.type === "offer") {
      this.pc.setLocalDescription(this.pc.localDescription,
                                   logSuccess("setLocalDescription"),
                                   logFail("setLocalDescription"));
      this.pc.setRemoteDescription(this.pc.remoteDescription,
                                    logSuccess("setRemoteDescription"),
                                    logFail("setRemoteDescription"));
    } else if (this.pc.localDescription && this.pc.remoteDescription &&
        this.pc.localDescription.type === "answer") {
      this.pc.setRemoteDescription(this.pc.remoteDescription,
                                    logSuccess("setRemoteDescription"),
                                    logFail("setRemoteDescription"));
      this.pc.setLocalDescription(this.pc.localDescription,
                                   logSuccess("setLocalDescription"),
                                   logFail("setLocalDescription"));
    } else {
      console.error(this.peerName + ', onNegotiationNeeded failed');
    }
    return;
  }
  this.negotiateConnection();
};

SimpleDataPeer.prototype.onIceCallback = function (event) {
  if (event.candidate) {
    // Send IceCandidate to peer.
    //console.log(this.peerName + ": " + "ice callback with candidate", event);
    if (this.sendSignalMessage) {
      this.sendSignalMessage(JSON.stringify({'candidate': event.candidate}));
    } else {
      console.warn(this.peerName + ": " + "_onDescription: _sendSignalMessage is not set.");
    }
  }
};

SimpleDataPeer.prototype.onSignalingStateChange = function () {
  //console.log(this.peerName + ": " + "onSignalingStateChange: ", this._pc.signalingState);
  if (this.pc.signalingState === "stable") {
    this.pcState = SimpleDataPeerState.CONNECTED;
    this.onConnectedQueue.map(function (callback) { callback(); });
  }
};

SimpleDataPeer.prototype.onDataChannel = function (event) {
  this.addDataChannel(event.channel.label, event.channel);
  // RTCDataChannels created by a RTCDataChannelEvent have an initial
  // state of open, so the onopen event for the channel will not
  // fire. We need to fire the onOpenDataChannel event here
  // http://www.w3.org/TR/webrtc/#idl-def-RTCDataChannelState

  // Firefox channels do not have an initial state of "open"
  // See https://bugzilla.mozilla.org/show_bug.cgi?id=1000478
  if (event.channel.readyState === "open") {
    this.dataChannelCallbacks.onOpenFn(event.channel,
                                       {label: event.channel.label});
  }
};

// _signallingChannel is a channel for emitting events back to the freedom Hub.
function PeerConnection(portModule, dispatchEvent,
                        RTCPeerConnection, RTCSessionDescription,
                        RTCIceCandidate) {
  // Channel for emitting events to consumer.
  this.dispatchEvent = dispatchEvent;

  // a (hopefully unique) ID for debugging.
  this.peerName = "p" + Math.random();

  // This is the portApp (defined in freedom/src/port-app.js). A way to speak
  // to freedom.
  this.freedomModule = portModule;

  // For tests we may mock out the PeerConnection and
  // SessionDescription implementations
  this.RTCPeerConnection = RTCPeerConnection;
  this.RTCSessionDescription = RTCSessionDescription;
  this.RTCIceCandidate = RTCIceCandidate;

  // This is the a channel to send signalling messages.
  this.signallingChannel = null;

  // The DataPeer object for talking to the peer.
  this.peer = null;

  // The Core object for managing channels.
  this.freedomModule.once('core', function (Core) {
    this.core = new Core();
  }.bind(this));
  this.freedomModule.emit(this.freedomModule.controlChannel, {
    type: 'core request delegated to peerconnection',
    request: 'core'
  });
}

// Start a peer connection using the given freedomChannelId as the way to
// communicate with the peer. The argument |freedomChannelId| is a way to speak
// to an identity provide to send them SDP headers negotiate the address/port to
// setup the peer to peerConnection.
//
// options: {
//   peerName: string,   // For pretty printing messages about this peer.
//   debug: boolean           // should we add extra
// }
PeerConnection.prototype.setup = function (signallingChannelId, peerName,
                                           stunServers, initiateConnection,
                                           continuation) {
  this.peerName = peerName;
  var mocks = {RTCPeerConnection: this.RTCPeerConnection,
               RTCSessionDescription: this.RTCSessionDescription,
               RTCIceCandidate: this.RTCIceCandidate},
    self = this,
    dataChannelCallbacks = {
      // onOpenFn is called at the point messages will actually get through.
      onOpenFn: function (dataChannel, info) {
        self.dispatchEvent("onOpenDataChannel",
                         { channelId: info.label});
      },
      onCloseFn: function (dataChannel, info) {
        self.dispatchEvent("onCloseDataChannel",
                         { channelId: info.label});
      },
      // Default on real message prints it to console.
      onMessageFn: function (dataChannel, info, event) {
        if (event.data instanceof ArrayBuffer) {
          self.dispatchEvent('onReceived', {
            'channelLabel': info.label,
            'buffer': event.data
          });
        } else if (event.data instanceof Blob) {
          self.dispatchEvent('onReceived', {
            'channelLabel': info.label,
            'binary': event.data
          });
        } else if (typeof (event.data) === 'string') {
          self.dispatchEvent('onReceived', {
            'channelLabel': info.label,
            'text': event.data
          });
        }
      },
      // Default on error, prints it.
      onErrorFn: function (dataChannel, info, err) {
        console.error(dataChannel.peerName + ": dataChannel(" +
                      dataChannel.dataChannel.label + "): error: ", err);
      }
    },
    channelId,
    openDataChannelContinuation;

  this.peer = new SimpleDataPeer(this.peerName, stunServers,
                                 dataChannelCallbacks, mocks);

  // Setup link between Freedom messaging and _peer's signalling.
  // Note: the signalling channel should only be sending receiveing strings.
  this.core.bindChannel(signallingChannelId, function (channel) {
    this.signallingChannel = channel;
    this.peer.setSendSignalMessage(function (msg) {
      this.signallingChannel.emit('message', msg);
    }.bind(this));
    this.signallingChannel.on('message',
        this.peer.handleSignalMessage.bind(this.peer));
    this.signallingChannel.emit('ready');
    if (!initiateConnection) {
      this.peer.runWhenConnected(continuation);
    }
  }.bind(this));

  if (initiateConnection) {
    // Setup a connection right away, then invoke continuation.
    console.log(this.peerName + ' initiating connection');
    channelId = 'hello' + Math.random().toString();
    openDataChannelContinuation = function (success, error) {
      if (error) {
        continuation(undefined, error);
      } else {
        this.closeDataChannel(channelId, continuation);
      }
    }.bind(this);
    this.openDataChannel(channelId, openDataChannelContinuation);
  }
};

PeerConnection.prototype.createOffer = function (constraints, continuation) {
  this.peer.createOffer(constraints, continuation);
};

// TODO: delay continuation until the open callback from _peer is called.
PeerConnection.prototype.openDataChannel = function (channelId, continuation) {
  this.peer.openDataChannel(channelId, continuation);
};

PeerConnection.prototype.closeDataChannel = function (channelId, continuation) {
  this.peer.closeChannel(channelId);
  continuation();
};

// Called to send a message over the given datachannel to a peer. If the data
// channel doesn't already exist, the DataPeer creates it.
PeerConnection.prototype.send = function (sendInfo, continuation) {
  var objToSend = sendInfo.text || sendInfo.buffer || sendInfo.binary;
  if (typeof objToSend === 'undefined') {
    console.error("No valid data to send has been provided.", sendInfo);
    return;
  }
  //DEBUG
  // objToSend = new ArrayBuffer(4);
  //DEBUG
  this.peer.send(sendInfo.channelLabel, objToSend, continuation);
};

PeerConnection.prototype.getBufferedAmount = function (channelId, continuation) {
  continuation(this.peer.getBufferedAmount(channelId));
};

PeerConnection.prototype.close = function (continuation) {
  if (this.peer.isClosed()) {
    // Peer already closed, run continuation without dispatching event.
    continuation();
    return;
  }
  this.peer.close();
  this.dispatchEvent("onClose");
  continuation();
};

exports.provider = PeerConnection;
exports.name = 'core.peerconnection';

},{}],20:[function(require,module,exports){
/*globals localStorage */
/*jslint indent:2,sloppy:true,node:true */
var util = require('../../src/util');

/**
 * A FreeDOM core.storage provider that depends on localStorage
 * Thus, this only works in the context of a webpage and has
 * some size limitations.
 * Note that this can conflict with other scripts using localStorage
 * as keys are raw
 * @Class Storage_unprivileged
 * @constructor
 * @private
 * @param {App} app The application creating this provider.
 */
var Storage_unprivileged = function (app, dispatchEvent) {
  this.app = app;
  util.handleEvents(this);
};

/**
 * Lists keys in the storage repository
 * @method keys
 */
Storage_unprivileged.prototype.keys = function (continuation) {
  var result = [],
    i;
  for (i = 0; i < localStorage.length; i += 1) {
    result.push(localStorage.key(i));
  }
  continuation(result);
};

/**
 * Get a key from the storage repository.
 * @param {String} key The item to get from storage.
 * @method get
 */
Storage_unprivileged.prototype.get = function (key, continuation) {
  try {
    var val = localStorage.getItem(key);
    continuation(val);
  } catch (e) {
    continuation(null);
  }
};

/**
 * Set a key in the storage repository.
 * @param {String} key The item to save in storage.
 * @param {String} value The value to save in storage.
 * @method set
 */
Storage_unprivileged.prototype.set = function (key, value, continuation) {
  var ret = localStorage.getItem(key);
  localStorage.setItem(key, value);
  continuation(ret);
};

/**
 * Remove a key from the storage repository.
 * @param {String} key The item to remove from storage;
 * @method remove
 */
Storage_unprivileged.prototype.remove = function (key, continuation) {
  var ret = localStorage.getItem(key);
  localStorage.removeItem(key);
  continuation(ret);
};

/**
 * Reset the contents of the storage repository.
 * @method clear
 */
Storage_unprivileged.prototype.clear = function (continuation) {
  localStorage.clear();
  continuation();
};

exports.provider = Storage_unprivileged;
exports.name = 'core.storage';

},{"../../src/util":73}],21:[function(require,module,exports){
/*globals WebSocket, ArrayBuffer, Blob, Uint8Array, console */
/*jslint sloppy:true, node:true */

var WSHandle = null;
var nodeStyle = false;

/**
 * A WebSocket core provider
 *
 * @param {port.Module} module The Module requesting this provider
 * @param {Function} dispatchEvent Function to dispatch events.
 * @param {String} url The Remote URL to connect with.
 * @param {String[]} protocols SubProtocols to open.
 * @param {WebSocket?} socket An alternative socket class to use.
 */
var WS = function (module, dispatchEvent, url, protocols, socket) {
  var WSImplementation = null,
    error;
  this.isNode = nodeStyle;
  if (typeof socket !== 'undefined') {
    WSImplementation = socket;
  } else if (WSHandle !== null) {
    WSImplementation = WSHandle;
  } else if (typeof WebSocket !== 'undefined') {
    WSImplementation = WebSocket;
  } else {
    console.error('Platform does not support WebSocket');
  }

  this.dispatchEvent = dispatchEvent;
  try {
    if (protocols) {
      this.websocket = new WSImplementation(url, protocols);
    } else {
      this.websocket = new WSImplementation(url);
    }
    this.websocket.binaryType = 'arraybuffer';
  } catch (e) {
    error = {};
    if (e instanceof SyntaxError) {
      error.errcode = 'SYNTAX';
    } else {
      error.errcode = e.name;
    }
    error.message = e.message;
    dispatchEvent('onError', error);
    return;
  }

  if (this.isNode) {
    this.websocket.on('message', this.onMessage.bind(this));
    this.websocket.on('open', this.onOpen.bind(this));
    // node.js websocket implementation not compliant
    this.websocket.on('close', this.onClose.bind(this, {
      code: 0,
      reason: 'UNKNOWN',
      wasClean: true
    }));
    this.websocket.on('error', this.onError.bind(this));
  } else {
    this.websocket.onopen = this.onOpen.bind(this);
    this.websocket.onclose = this.onClose.bind(this);
    this.websocket.onmessage = this.onMessage.bind(this);
    this.websocket.onerror = this.onError.bind(this);
  }
};

WS.prototype.send = function (data, continuation) {
  var toSend = data.text || data.binary || data.buffer,
    errcode,
    message;

  if (toSend) {
    try {
      // For node.js, we have to do weird buffer stuff
      if (this.isNode && toSend instanceof ArrayBuffer) {
        this.websocket.send(
          new Uint8Array(toSend),
          { binary: true },
          this.onError.bind(this)
        );
      } else {
        this.websocket.send(toSend);
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        errcode = "SYNTAX";
      } else {
        errcode = "INVALID_STATE";
      }
      message = e.message;
    }
  } else {
    errcode = "BAD_SEND";
    message = "No text, binary, or buffer data found.";
  }

  if (errcode) {
    continuation(undefined, {
      errcode: errcode,
      message: message
    });
  } else {
    continuation();
  }
};

WS.prototype.getReadyState = function (continuation) {
  continuation(this.websocket.readyState);
};

WS.prototype.getBufferedAmount = function (continuation) {
  continuation(this.websocket.bufferedAmount);
};

WS.prototype.close = function (code, reason, continuation) {
  try {
    if (code && reason) {
      this.websocket.close(code, reason);
    } else {
      this.websocket.close();
    }
    continuation();
  } catch (e) {
    var errorCode;
    if (e instanceof SyntaxError) {
      errorCode = "SYNTAX";
    } else {
      errorCode = "INVALID_ACCESS";
    }
    continuation(undefined, {
      errcode: errorCode,
      message: e.message
    });
  }
};

WS.prototype.onOpen = function (event) {
  this.dispatchEvent('onOpen');
};

WS.prototype.onMessage = function (event, flags) {
  var data = {};
  if (this.isNode && flags && flags.binary) {
    data.buffer = new Uint8Array(event).buffer;
  } else if (this.isNode) {
    data.text = event;
  } else if (typeof ArrayBuffer !== 'undefined' && event.data instanceof ArrayBuffer) {
    data.buffer = event.data;
  } else if (typeof Blob !== 'undefined' && event.data instanceof Blob) {
    data.binary = event.data;
  } else if (typeof event.data === 'string') {
    data.text = event.data;
  }
  this.dispatchEvent('onMessage', data);
};

WS.prototype.onError = function (event) {
  // Nothing to pass on
  // See: http://stackoverflow.com/a/18804298/300539
  this.dispatchEvent('onError');
};

WS.prototype.onClose = function (event) {
  this.dispatchEvent('onClose',
                     {code: event.code,
                      reason: event.reason,
                      wasClean: event.wasClean});
};

exports.provider = WS;
exports.name = 'core.websocket';
exports.setSocket = function(impl, isNode) {
  WSHandle = impl;
  nodeStyle = isNode;
};

},{}],22:[function(require,module,exports){
/*globals freedom:true, exports */
/*jslint indent:2, white:true, sloppy:true, browser:true */

/**
 * Implementation of a Social provider with a fake buddylist
 * 'Other User' echos everything you send to it back to you
 * This is particularly useful when you're debugging UIs with multi-user interactions
 *
 * The provider offers
 * - a buddylist of fake users
 * - no reliability of message delivery
 * - in-order delivery
 * - clients are statically defined in the class
 * - 'Other User' is a special buddy that echos what you say back to you
 **/

function LoopbackSocialProvider(dispatchEvent) {
  this.dispatchEvent = dispatchEvent;

  //Constants
  this.time = (new Date()).getTime();
  this.userId = 'Test User';      //My userId
  this.clientId = 'Test User.0';  //My clientId
  this.social = freedom();

  //Populate a fake roster
  this.users = {
    "Test User": this.makeUserEntry(this.userId),
    "Other User": this.makeUserEntry("Other User"),
    'Johnny Appleseed': this.makeUserEntry('Johnny Appleseed'),
    'Betty Boop': this.makeUserEntry('Betty Boop'),
    'Big Bird': this.makeUserEntry('Big Bird'),
    'Bugs Bunny': this.makeUserEntry('Bugs Bunny'),
    'Daffy Duck': this.makeUserEntry('Daffy Duck'),
    'Kermit the Frog': this.makeUserEntry('Kermit the Frog'),
    'Minnie Mouse': this.makeUserEntry('Minnie Mouse'),
    'Porky Pig': this.makeUserEntry('Porky Pig'),
    'Swedish Chef': this.makeUserEntry('Swedish Chef'),
    'Yosemite Sam': this.makeUserEntry('Yosemite Sam')
  };
  this.clients = {};
}

// Autocreates fake rosters with variable numbers of clients
// and random statuses
LoopbackSocialProvider.prototype.makeUserEntry = function(userId) {
  return {
    userId: userId,
    name: userId,
    lastUpdated: this.time
  };
};

LoopbackSocialProvider.prototype.fillClients = function() {
  var STATUSES = ['ONLINE', 'OFFLINE', 'ONLINE_WITH_OTHER_APP'],
      userId, nClients, clientId, i;
  this.clients = {
    "Test User.0": {
      'userId': this.userId,
      'clientId': this.clientId,
      'status': "ONLINE",
      'lastUpdated': this.time,
      'lastSeen': this.time
    },
    "Other User.0": {
      'userId': "Other User",
      'clientId': "Other User.0", 
      'status': "ONLINE",
      'lastUpdated': this.time,
      'lastSeen': this.time
    }
  };

  for (userId in this.users) {
    if (this.users.hasOwnProperty(userId)) {
      nClients = userId.charCodeAt(0) % 3;
      for (i = 0; i < nClients; i += 1) {
        clientId = userId + '/-client' + (i + 1);
        this.clients[clientId] = {
          userId: userId,
          clientId: clientId,
          status: STATUSES[i],
          lastUpdated: this.time,
          lastSeen: this.time
        };
      }
    }
  }
  return;
};

// Log in. Options are ignored
// Roster is only emitted to caller after log in
LoopbackSocialProvider.prototype.login = function(opts, continuation) {
  var userId, clientId;

  if (this.clients.hasOwnProperty(this.clientId)) {
    continuation(undefined, this.err("LOGIN_ALREADYONLINE"));
    return;
  }
  this.fillClients();
  for (userId in this.users) {
    if (this.users.hasOwnProperty(userId)) {
      this.dispatchEvent('onUserProfile', this.users[userId]);
    }
  }
  for (clientId in this.clients) {
    if (this.clients.hasOwnProperty(clientId)) {
      this.dispatchEvent('onClientState', this.clients[clientId]);
    }
  }
  continuation(this.clients[this.clientId]);
};

// Clear credentials (there are none)
LoopbackSocialProvider.prototype.clearCachedCredentials = function(continuation) {
  return;
};

// Return the user profiles
LoopbackSocialProvider.prototype.getUsers = function(continuation) {
  if (!this.clients.hasOwnProperty(this.clientId)) {
    continuation(undefined, this.err("OFFLINE"));
    return;
  }
  continuation(this.users);
};

// Return the clients
LoopbackSocialProvider.prototype.getClients = function(continuation) {
  if (!this.clients.hasOwnProperty(this.clientId)) {
    continuation(undefined, this.err("OFFLINE"));
    return;
  }
  continuation(this.clients);
};

// Send a message to someone.
// All messages not sent to this.userId will be echoed back to self as if
// sent by 'Other User'
LoopbackSocialProvider.prototype.sendMessage = function(to, msg, continuation) {
  if (!this.clients.hasOwnProperty(this.clientId)) {
    continuation(undefined, this.err("OFFLINE"));
    return;
  } else if (!this.clients.hasOwnProperty(to) && !this.users.hasOwnProperty(to)) {
    continuation(undefined, this.err("SEND_INVALIDDESTINATION"));
    return;
  }

  if (to === this.userId || to === this.clientId) {
    this.dispatchEvent('onMessage', {
      from: this.clients[this.clientId],
      message: msg
    });
  } else {
    this.dispatchEvent('onMessage', {
      from: this.clients["Other User.0"],
      message: msg
    });
  }
  continuation();
};

// Log out. All users in the roster will go offline
// Options are ignored
LoopbackSocialProvider.prototype.logout = function(continuation) {
  var clientId;
  if (!this.clients.hasOwnProperty(this.clientId)) {
    continuation(undefined, this.err("OFFLINE"));
    return;
  }

  for (clientId in this.clients) {
    if (this.clients.hasOwnProperty(clientId)) {
      this.clients[clientId].status = 'OFFLINE';
      this.dispatchEvent('onClientState', this.clients[clientId]);
    }
  }

  this.clients = {};
  continuation();
};

LoopbackSocialProvider.prototype.err = function(code) {
  var err = {
    errcode: code,
    message: this.social.ERRCODE[code]
  };
  return err;
};

/** REGISTER PROVIDER **/
if (typeof freedom !== 'undefined') {
  freedom().provideAsynchronous(LoopbackSocialProvider);
}

if (typeof exports !== 'undefined') {
  exports.provider = LoopbackSocialProvider;
  exports.name = 'social';
}

},{}],23:[function(require,module,exports){
/*globals freedom:true, WebSocket, DEBUG */
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */

/**
 * Implementation of a Social provider that depends on
 * the WebSockets server code in server/router.py
 * The current implementation uses a public facing common server
 * hosted on p2pbr.com
 *
 * The provider offers
 * - A single global buddylist that everyone is on
 * - no reliability
 * - out of order delivery
 * - ephemeral userIds and clientIds
 * @class WSSocialProvider
 * @constructor
 * @param {Function} dispatchEvent callback to signal events
 * @param {WebSocket} webSocket Alternative webSocket implementation for tests
 **/
function WSSocialProvider(dispatchEvent, webSocket) {
  this.dispatchEvent = dispatchEvent;

  this.websocket = freedom["core.websocket"] || webSocket;
  if (typeof DEBUG !== 'undefined' && DEBUG) {
    this.WS_URL = 'ws://p2pbr.com:8082/route/';
  } else {
    this.WS_URL = 'wss://p2pbr.com/route/';
  }
  this.social = freedom();

  this.conn = null;   // Web Socket
  this.id = null;     // userId of this user
  
  //Note that in this.websocket, there is a 1-1 relationship between user and client
  this.users = {};    // List of seen users (<user_profile>)
  this.clients = {};  // List of seen clients (<client_state>)

}

/**
 * Connect to the Web Socket rendezvous server
 * e.g. social.login(Object options)
 * The only login option needed is 'agent', used to determine which group to join in the server
 *
 * @method login
 * @param {Object} loginOptions
 * @return {Object} status - Same schema as 'onStatus' events
 **/
WSSocialProvider.prototype.login = function(loginOpts, continuation) {
  // Wrap the continuation so that it will only be called once by
  // onmessage in the case of success.
  var finishLogin = {
    continuation: continuation,
    finish: function(msg, err) {
      if (this.continuation) {
        this.continuation(msg, err);
        delete this.continuation;
      }
    }
  };

  if (this.conn !== null) {
    finishLogin.finish(undefined, this.err("LOGIN_ALREADYONLINE"));
    return;
  }
  this.conn = this.websocket(this.WS_URL + loginOpts.agent);
  // Save the continuation until we get a status message for
  // successful login.
  this.conn.on("onMessage", this.onMessage.bind(this, finishLogin));
  this.conn.on("onError", function (cont, error) {
    this.conn = null;
    cont.finish(undefined, this.err('ERR_CONNECTION'));
  }.bind(this, finishLogin));
  this.conn.on("onClose", function (cont, msg) {
    this.conn = null;
    this.changeRoster(this.id, false);
  }.bind(this, finishLogin));

};

/**
 * Returns all the <user_profile>s that we've seen so far (from 'onUserProfile' events)
 * Note: the user's own <user_profile> will be somewhere in this list. 
 * Use the userId returned from social.login() to extract your element
 * NOTE: This does not guarantee to be entire roster, just users we're currently aware of at the moment
 * e.g. social.getUsers();
 *
 * @method getUsers
 * @return {Object} { 
 *    'userId1': <user_profile>,
 *    'userId2': <user_profile>,
 *     ...
 * } List of <user_profile>s indexed by userId
 *   On failure, rejects with an error code (see above)
 **/
WSSocialProvider.prototype.getUsers = function(continuation) {
  if (this.conn === null) {
    continuation(undefined, this.err("OFFLINE"));
    return;
  }
  continuation(this.users);
};

/**
 * Returns all the <client_state>s that we've seen so far (from any 'onClientState' event)
 * Note: this instance's own <client_state> will be somewhere in this list
 * Use the clientId returned from social.login() to extract your element
 * NOTE: This does not guarantee to be entire roster, just clients we're currently aware of at the moment
 * e.g. social.getClients()
 * 
 * @method getClients
 * @return {Object} { 
 *    'clientId1': <client_state>,
 *    'clientId2': <client_state>,
 *     ...
 * } List of <client_state>s indexed by clientId
 *   On failure, rejects with an error code (see above)
 **/
WSSocialProvider.prototype.getClients = function(continuation) {
  if (this.conn === null) {
    continuation(undefined, this.err("OFFLINE"));
    return;
  }
  continuation(this.clients);
};

/** 
 * Send a message to user on your network
 * If the destination is not specified or invalid, the message is dropped
 * Note: userId and clientId are the same for this.websocket
 * e.g. sendMessage(String destination_id, String message)
 * 
 * @method sendMessage
 * @param {String} destination_id - target
 * @return nothing
 **/
WSSocialProvider.prototype.sendMessage = function(to, msg, continuation) {
  if (this.conn === null) {
    continuation(undefined, this.err("OFFLINE"));
    return;
  } else if (!this.clients.hasOwnProperty(to) && !this.users.hasOwnProperty(to)) {
    continuation(undefined, this.err("SEND_INVALIDDESTINATION"));
    return;
  }

  this.conn.send({text: JSON.stringify({to: to, msg: msg})});
  continuation();
};

/**
   * Disconnects from the Web Socket server
   * e.g. logout(Object options)
   * No options needed
   * 
   * @method logout
   * @return {Object} status - same schema as 'onStatus' events
   **/
WSSocialProvider.prototype.logout = function(continuation) {
  if (this.conn === null) { // We may not have been logged in
    this.changeRoster(this.id, false);
    continuation(undefined, this.err("OFFLINE"));
    return;
  }
  this.conn.on("onClose", function(continuation) {
    this.conn = null;
    this.changeRoster(this.id, false);
    continuation();
  }.bind(this, continuation));
  this.conn.close();
};

/**
 * INTERNAL METHODS
 **/

/**
 * Dispatch an 'onClientState' event with the following status and return the <client_card>
 * Modify entries in this.users and this.clients if necessary
 * Note, because this provider has a global buddylist of ephemeral clients, we trim all OFFLINE users
 *
 * @method changeRoster
 * @private
 * @param {String} id - userId and clientId are the same in this provider
 * @param {Boolean} stat - true if "ONLINE", false if "OFFLINE".
 *                          "ONLINE_WITH_OTHER_APP"
 * @return {Object} - same schema as 'onStatus' event
 **/
WSSocialProvider.prototype.changeRoster = function(id, stat) {
  var newStatus, result = {
    userId: id,
    clientId: id,
    lastUpdated: (this.clients.hasOwnProperty(id)) ? this.clients[id].lastUpdated: (new Date()).getTime(),
    lastSeen: (new Date()).getTime()
  };
  if (stat) {
    newStatus = "ONLINE";
  } else {
    newStatus = "OFFLINE";
  }
  result.status = newStatus;
  if (!this.clients.hasOwnProperty(id) || 
      (this.clients[id] && this.clients[id].status !== newStatus)) {
    this.dispatchEvent('onClientState', result);
  }

  if (stat) {
    this.clients[id] = result;
    if (!this.users.hasOwnProperty(id)) {
      this.users[id] = {
        userId: id,
        name: id,
        lastUpdated: (new Date()).getTime()
      };
      this.dispatchEvent('onUserProfile', this.users[id]);
    }
  } else {
    delete this.users[id];
    delete this.clients[id];
  }
  return result;
};

/**
 * Interpret messages from the server
 * There are 3 types of messages
 * - Directed messages from friends
 * - State information from the server on initialization
 * - Roster change events (users go online/offline)
 *
 * @method onMessage
 * @private
 * @param {Object} finishLogin Function to call upon successful login
 * @param {String} msg Message from the server (see server/router.py for schema)
 * @return nothing
 **/
WSSocialProvider.prototype.onMessage = function(finishLogin, msg) {
  var i;
  msg = JSON.parse(msg.text);

  // If state information from the server
  // Store my own ID and all known users at the time
  if (msg.cmd === 'state') {
    this.id = msg.id;
    for (i = 0; i < msg.msg.length; i += 1) {
      this.changeRoster(msg.msg[i], true);
    }
    finishLogin.finish(this.changeRoster(this.id, true));
  // If directed message, emit event
  } else if (msg.cmd === 'message') {
    this.dispatchEvent('onMessage', {
      from: this.changeRoster(msg.from, true),
      message: msg.msg
    });
  // Roster change event
  } else if (msg.cmd === 'roster') {
    this.changeRoster(msg.id, msg.online);
  // No idea what this message is, but let's keep track of who it's from
  } else if (msg.from) {
    this.changeRoster(msg.from, true);
  }
};

WSSocialProvider.prototype.err = function(code) {
  var err = {
    errcode: code,
    message: this.social.ERRCODE[code]
  };
  return err;
};

/** REGISTER PROVIDER **/
if (typeof freedom !== 'undefined') {
  freedom().provideAsynchronous(WSSocialProvider);
}

if (typeof exports !== 'undefined') {
  exports.provider = WSSocialProvider;
  exports.name = 'social';
}


},{}],24:[function(require,module,exports){
/*globals freedom:true, location */
/*jslint indent:2,white:true,node:true,sloppy:true */
/**
 *  Implementation of storage that isolates the namespace
 *  for each instantiation of this provider
 *  Behavior:
 *    e.g. Both modules A and B use this storage provider.
 *    They cannot access each other's keys
 **/
'use strict';

function IsolatedStorageProvider(dispatchEvent) {
  var i;
  this.core = freedom.core();
  this.store = freedom['core.storage']();
  this.magic = "";
  this.queue = [];

  this.core.getId().then(function (val) {
    for (i = 0; i < val.length; i += 1) {
      this.magic += val[i] + ";";
    }
    this._flushQueue();
  }.bind(this));
}

IsolatedStorageProvider.prototype.keys = function(continuation) {
  if (this.magic === "") {
    this._pushQueue("keys", null, null, continuation);
    return;
  }

  this.store.keys().then(function(val) {
    var result = [], i;
    //Check that our magic has been initialized
    //Only return keys in my partition
    for (i = 0; i < val.length; i += 1) {
      if (this._isMyKey(val[i])) {
        result.push(this._fromStoredKey(val[i]));
      }
    }
    continuation(result);
  }.bind(this));
};

IsolatedStorageProvider.prototype.get = function(key, continuation) {
  if (this.magic === "") {
    this._pushQueue("get", key, null, continuation);
    return;
  } 
  
  var promise = this.store.get(this._toStoredKey(key));
  promise.then(continuation);
};

IsolatedStorageProvider.prototype.set = function(key, value, continuation) {
  if (this.magic === "") {
    this._pushQueue("set", key, value, continuation);
    return;
  }

  var promise = this.store.set(this._toStoredKey(key), value);
  promise.then(continuation);
};

IsolatedStorageProvider.prototype.remove = function(key, continuation) {
  if (this.magic === "") {
    this._pushQueue("remove", key, null, continuation);
    return;
  }
  
  var promise = this.store.remove(this._toStoredKey(key));
  promise.then(continuation);
};

IsolatedStorageProvider.prototype.clear = function(continuation) {
  var promise = this.store.keys(), i;
  promise.then(function(keys) {
    //Only remove keys in my partition
    for (i = 0; i < keys.length; i += 1) {
      if (this._isMyKey(keys[i])) {
        this.store.remove(keys[i]);
      }
    }
    continuation();
  }.bind(this));
};

/** INTERNAL METHODS **/
//Insert call into queue
IsolatedStorageProvider.prototype._pushQueue = function(method, key, value, continuation) {
  this.queue.push({
    cmd: method,
    key: key,
    value: value,
    cont: continuation
  });
};

//Flush commands in queue
IsolatedStorageProvider.prototype._flushQueue = function() {
  var i, elt;
  for (i = 0; i < this.queue.length; i += 1) {
    elt = this.queue[i];
    if (elt.cmd === "keys") {
      this.keys(elt.cont);
    } else if (elt.cmd === "get") {
      this.get(elt.key, elt.cont);
    } else if (elt.cmd === "set") {
      this.set(elt.key, elt.value, elt.cont);
    } else if (elt.cmd === "remove") {
      this.remove(elt.key, elt.cont);
    } else if (elt.cmd === "clear") {
      this.clear(elt.cont);
    } else {
      console.error("Isolated Storage: unrecognized command " + JSON.stringify(elt));
    }
  }

  this.queue = [];
};

// From caller's key => stored key
// e.g. 'keyA' => 'partition1+keyA'
IsolatedStorageProvider.prototype._toStoredKey = function(key) {
  return (this.magic + key);
};

// From stored key => caller's key
// e.g. 'partition1+keyA' => 'keyA'
IsolatedStorageProvider.prototype._fromStoredKey = function(key) {
  return key.substr(this.magic.length);
};

// Check if this stored key is in my partition
IsolatedStorageProvider.prototype._isMyKey = function(storedKey) {
  return (storedKey.substr(0, this.magic.length) === this.magic);
};

/** REGISTER PROVIDER **/
if (typeof freedom !== 'undefined') {
  freedom().provideAsynchronous(IsolatedStorageProvider);
}

if (typeof exports !== 'undefined') {
  exports.provider = IsolatedStorageProvider;
  exports.name = 'storage';
}

},{}],25:[function(require,module,exports){
/*jslint sloppy:true*/
/*globals freedom,exports*/
/**
 * Implementation of the Storage provider that thin-wraps freedom['core.storage']();
 * Behavior:
 * - Namespace is shared with all instances of this provider.
 *   e.g. Both modules A and B use this storage provider. They'd be able to access the same keys
 **/

function SharedStorageProvider() {
  this.store = freedom['core.storage']();
  //console.log("Shared Storage Provider, running in worker " + self.location.href);
}

SharedStorageProvider.prototype.keys = function (continuation) {
  this.store.keys().then(continuation);
};

SharedStorageProvider.prototype.get = function (key, continuation) {
  this.store.get(key).then(continuation);
};

SharedStorageProvider.prototype.set = function (key, value, continuation) {
  this.store.set(key, value).then(continuation);
};

SharedStorageProvider.prototype.remove = function (key, continuation) {
  this.store.remove(key).then(continuation);
};

SharedStorageProvider.prototype.clear = function (continuation) {
  this.store.clear().then(continuation);
};

/** REGISTER PROVIDER **/
if (typeof freedom !== 'undefined') {
  freedom().provideAsynchronous(SharedStorageProvider);
}

if (typeof exports !== 'undefined') {
  exports.provider = SharedStorageProvider;
  exports.name = 'storage';
}

},{}],26:[function(require,module,exports){
/*jslint sloppy:true*/
/*globals freedom,console,FileReaderSync,exports*/
/*
 * Peer 2 Peer transport provider.
 *
 */
var WebRTCTransportProvider = function (dispatchEvent) {
  this.dispatchEvent = dispatchEvent;
  this.name = null;
  this._setup = false;
  this.pc = freedom['core.peerconnection']();
  this.pc.on('onReceived', this.onData.bind(this));
  this.pc.on('onClose', this.onClose.bind(this));
  this.pc.on('onOpenDataChannel', this.onNewTag.bind(this));
  this._tags = [];
  // Maps tags to booleans. The boolean corresponding to a given tag
  // is true if this WebRTCTransportProvider is currently sending out
  // chunks of a message for that tag.
  this._sending = {};
  // Maps tags to lists of whole outgoing messages that are waiting to
  // be sent over the wire. Messages must be sent one at a time to
  // prevent the interleaving of chunks from two or messages.
  this._queuedMessages = {};
  // Entries in this dictionary map tags to arrays containing chunks
  // of incoming messages. If there is no entry for a tag in the
  // dictionary, then we have not received the first chunk of the next
  // message.
  this._chunks = {};
  // Messages may be limited to a 16KB length
  // http://tools.ietf.org/html/draft-ietf-rtcweb-data-channel-07#section-6.6
  this._chunkSize = 15000;
  // The maximum amount of bytes we should allow to get queued up in
  // peerconnection, any more and we start queueing ourself.
  this._pcQueueLimit = 1024 * 250;
  // Javascript has trouble representing integers larger than 2^53 exactly
  this._maxMessageSize = Math.pow(2, 53);
};

WebRTCTransportProvider.stun_servers = [
  "stun:stun.l.google.com:19302",
  "stun:stun1.l.google.com:19302",
  "stun:stun2.l.google.com:19302",
  "stun:stun3.l.google.com:19302",
  "stun:stun4.l.google.com:19302"
];

// The argument |signallingChannelId| is a freedom communication channel id to
// use to open a peer connection. 
WebRTCTransportProvider.prototype.setup = function(name, signallingChannelId,
                                                   continuation) {
  this.name = name;
  var promise = this.pc.setup(signallingChannelId, name,
                              WebRTCTransportProvider.stun_servers, false);
  this._setup = true;
  promise.then(continuation).catch(function(err) {
    console.error('Error setting up peerconnection');
    
    continuation(undefined, {
      "errcode": "FAILED",
      "message": 'Error setting up peerconnection'
    });
  });
};

WebRTCTransportProvider.prototype.send = function(tag, data, continuation) {
  // console.log("TransportProvider.send." + this.name);
  if(!this._setup) {
    continuation(undefined, {
      "errcode": "NOTREADY",
      "message": "send called before setup"
    });
    throw new Error("send called before setup in WebRTCTransportProvider");
  }
  if (this._tags.indexOf(tag) >= 0) {
    if (this._sending[tag]) {
      // A message is currently being sent. Queue this message to
      // prevent message interleaving.
      this._queuedMessages[tag].push({tag: tag,
                                      data: data,
                                      continuation: continuation});
      return;
    }
    var buffers = this._chunk(data);
    this._sending[tag] = true;
    this._waitSend(tag, buffers).then(function afterSending() {
      this._sending[tag] = false;
      if ((typeof this._queuedMessages[tag] !== "undefined") &&
          this._queuedMessages[tag].length > 0) {
        var next = this._queuedMessages[tag].shift();
        this.send(next.tag, next.data, next.continuation);
      }
    }.bind(this)).then(continuation);
  } else {
    this.pc.openDataChannel(tag).then(function(){
      this._tags.push(tag);
      this._sending[tag] = false;
      this._queuedMessages[tag] = [];

      this.send(tag, data, continuation);
    }.bind(this));
  }
};



/**
 * Chunk a single ArrayBuffer into multiple ArrayBuffers of
 * this._chunkSize length.
 * @param {ArrayBuffer} data - Data to chunk.
 * @return {Array} - Array of ArrayBuffer objects such that the
 * concatenation of all array buffer objects equals the data
 * parameter.
 */
WebRTCTransportProvider.prototype._chunk = function(data) {
  // The first 8 bytes of the first chunk of a message encodes the
  // number of bytes in the message.
  var dataView = new Uint8Array(data);
  var buffers = [];
  var size = data.byteLength;
  var lowerBound = 0; // exclusive range
  var upperBound;

  // lowerBound points to the byte after the last byte to be chunked
  // from the original data buffer.  It should be the case that
  // lowerBound < upperBound.
  // Buffer: [------------------------------------------------]
  //          ^              ^              ^  
  //          lB_0           uB_0/lB_1      uB_1/lB_2 ...    ^uB_n
  
  var sizeBuffer = this._sizeToBuffer(size);
  var firstBuffer = new Uint8Array(Math.min(this._chunkSize,
                                             size + sizeBuffer.byteLength));

  firstBuffer.set(sizeBuffer, 0);
  upperBound = Math.min(this._chunkSize - sizeBuffer.byteLength,
                        firstBuffer.byteLength);
  firstBuffer.set(dataView.subarray(0, upperBound), sizeBuffer.byteLength);
  buffers.push(firstBuffer.buffer);
  lowerBound = upperBound;

  while (lowerBound < size) {
    upperBound = lowerBound + this._chunkSize;
    buffers.push(data.slice(lowerBound, upperBound));
    lowerBound = upperBound;
  }

  return buffers;
};

WebRTCTransportProvider.prototype._waitSend = function(tag, buffers) {
  var bufferBound = 0; // upper bound on the # of bytes buffered

  var sendBuffers = function() {
    var promises = [];
    while(bufferBound + this._chunkSize <= this._pcQueueLimit &&
          buffers.length > 0) {
      var nextBuffer = buffers.shift();
      promises.push(this.pc.send({"channelLabel": tag,
                                  "buffer": nextBuffer}));
      bufferBound += nextBuffer.byteLength;
    }

    var allSends = Promise.all(promises);
    if (buffers.length === 0) {
      return allSends;
    }
    return allSends.then(checkBufferedAmount);
  }.bind(this);

  var checkBufferedAmount = function() {
    return this.pc.getBufferedAmount(tag).then(function(bufferedAmount) {
      bufferBound = bufferedAmount;
      if (bufferedAmount + this._chunkSize > this._pcQueueLimit) {
        return new Promise(function(resolve) {
          setTimeout(function() {
            resolve(checkBufferedAmount());
          }, 100);
        });
      } else {
        return sendBuffers();
      }
    });
  }.bind(this);
  // Check first, in case there is data in the pc buffer from another message.
  return checkBufferedAmount();
};


WebRTCTransportProvider.prototype.close = function(continuation) {
  // TODO: Close data channels.
  this._tags = [];
  this._sending = {};
  this._queuedMessages = {};
  this._chunks = {};
  this.pc.close().then(continuation);
};

// Called when the peer-connection receives data, it then passes it here.
WebRTCTransportProvider.prototype.onData = function(msg) {
  //console.log("TransportProvider.prototype.message: Got Message:" + JSON.stringify(msg));
  if (msg.buffer) {
    this._handleData(msg.channelLabel, msg.buffer);
  } else if (msg.binary) {
    if (typeof FileReaderSync === 'undefined') {
      var fileReader = new FileReader();
      fileReader.onload = (function(handleData, channelLabel) {
        return function(e) {
          handleData(channelLabel, e.target.result);
        };
      }(this._handleData.bind(this), msg.channelLabel));
      fileReader.readAsArrayBuffer(msg.binary);
    } else {
      var fileReaderSync = new FileReaderSync();
      var arrayBuffer = fileReaderSync.readAsArrayBuffer(msg.binary);
      this._handleData(msg.channelLabel, arrayBuffer);
    }
  } else if (msg.text) {
    console.error("Strings not supported.");
  }  else {
    console.error('message called without a valid data field');
  }
};

WebRTCTransportProvider.prototype._handleData = function(tag, buffer) {
  var currentTag;
  if (tag in this._chunks) {
    currentTag = this._chunks[tag];
    currentTag.buffers.push(buffer);
    currentTag.currentByteCount += buffer.byteLength;
  } else {
    currentTag = {buffers: [],
                  currentByteCount: 0,
                  totalByteCount: 0};
    this._chunks[tag] = currentTag;
    var size = this._bufferToSize(buffer.slice(0, 8));
    if (size > this._maxMessageSize) {
      console.warn("Incomming message is larger than maximum message size");
    }
    currentTag.totalByteCount = size;
    currentTag.buffers.push(buffer.slice(8));
    currentTag.currentByteCount += buffer.byteLength - 8;
  }

  if(currentTag.currentByteCount === currentTag.totalByteCount) {
    var returnBuffer = this._assembleBuffers(tag);
    this.dispatchEvent('onData', {
      "tag": tag, 
      "data": returnBuffer
    });
    delete this._chunks[tag];
  } else if(currentTag.currentByteCount > currentTag.totalByteCount) {
    console.warn("Received more bytes for message than expected, something has gone seriously wrong");
    delete this._chunks[tag];
  }
  
};

WebRTCTransportProvider.prototype.onNewTag = function(event) {
  this._tags.push(event.channelId);
};

WebRTCTransportProvider.prototype.onClose = function() {
  this._tags = [];
  this._sending = {};
  this._queuedMessages = {};
  this._chunks = {};
  this.dispatchEvent('onClose', null);
};


WebRTCTransportProvider.prototype._sizeToBuffer = function(size) {
  // Bit shifts have overflow issues for any integers with more than
  // 32 bits, so use division.
  var buffer = new ArrayBuffer(8);
  var view = new Uint8Array(buffer);
  for (var index = 0; index < 8; index++) {
    /*jslint bitwise:true*/
    var currentByte = (size & 0xff);
    /*jslint bitwise:false*/
    view [ index ] = currentByte;
    size = (size - currentByte) / 256 ;
  }
  return view;
};

WebRTCTransportProvider.prototype._bufferToSize = function(buffer) {
  var view = new Uint8Array(buffer);
  var number = 0;
  for ( var i = view.byteLength - 1; i >= 0; i--) {
    number = (number * 256) + view[i];
  }

  return number;
};

/*
 * Reassemble the buffers for the given tag into a single ArrayBuffer object.
 * @param {String} 
 * @return {ArrayBuffer} Result of concatenating all buffers for tag
 */
WebRTCTransportProvider.prototype._assembleBuffers = function(tag) {
  var size = this._chunks[tag].totalByteCount;
  var bytesCopied = 0;
  var result = new ArrayBuffer(size);
  var view = new Uint8Array(result);
  this._chunks[tag].buffers.forEach(function(buffer) {

    view.set(new Uint8Array(buffer), bytesCopied);
    bytesCopied += buffer.byteLength;
  });
  return result;
};

/** REGISTER PROVIDER **/
if (typeof freedom !== 'undefined') {
  freedom().provideAsynchronous(WebRTCTransportProvider);
}

if (typeof exports !== 'undefined') {
  exports.provider = WebRTCTransportProvider;
  exports.name = 'transport';
}

},{}],27:[function(require,module,exports){
var testUtil = require('../../util');
var Console_unpriv = require('../../../providers/core/console.unprivileged');

describe("providers/core/Console_unprivileged", function() {
  var app, logger, console;

  beforeEach(function() {
    app = testUtil.createTestPort('test');
    app.config = {
      global: {
        console: {}
      }
    };
    console = app.config.global.console;
    
    app.controlChannel = 'control';
    logger = new Console_unpriv.provider(app);
  });

  it("Prints messages at correct levels", function() {
    logger.level = 'debug';
    Object.keys(Console_unpriv.provider.level).forEach(function(level) {
      console[level] = jasmine.createSpy(level);
      logger[level]('test', 'MyMsg', function() {});
      expect(console[level]).toHaveBeenCalled();
    });

    logger.level = 'warn';
    Object.keys(Console_unpriv.provider.level).forEach(function(level) {
      console[level] = jasmine.createSpy(level);
      logger[level]('test', 'MyMsg', function() {});
      if (level === 'warn' || level === 'error') {
        expect(console[level]).toHaveBeenCalled();
      } else {
        expect(console[level]).not.toHaveBeenCalled();
      }
    });
  
  });
});

},{"../../../providers/core/console.unprivileged":14,"../../util":54}],28:[function(require,module,exports){
var Debug = require('../../../src/debug');
var Hub = require('../../../src/hub');
var Resource = require('../../../src/resource');
var Api = require('../../../src/api');
var Bundle = require('../../../src/bundle');
var Manager = require('../../../src/manager');
var Core = require('../../../providers/core/core.unprivileged');
var testUtil = require('../../util');

describe("Core Provider Integration", function() {
  var freedom;
  beforeEach(function(done) {
    testUtil.setCoreProviders([
      Core
    ]);
    testUtil.setupModule('relative://spec/helper/channel.json').then(function(iface) {
      freedom = iface();
      done();
    });
  });
  
  afterEach(function() {
    testUtil.cleanupIframes();
  });

  it("Manages Channels Between Modules", function(done) {
    var cb = jasmine.createSpy('cb');
    freedom.once('message', function(msg) {
      // created.
      expect(msg).toEqual('creating custom channel 0');
      freedom.on('message', cb);
      freedom.on('message', function() {
        expect(cb).toHaveBeenCalledWith('sending message to 0');
        if (cb.calls.count() == 3) {
          expect(cb).toHaveBeenCalledWith('channel 0 replies Message to chan 0');
          done();
        }
      });
      freedom.emit('message', 0);
    });
    freedom.emit('create');
  });

  it("Manages Channels With providers", function(done) {
    var cb = jasmine.createSpy('cb');
    freedom.once('message', function(msg) {
      // created.
      freedom.on('message', cb);
      freedom.once('message', function() {
        expect(cb).toHaveBeenCalledWith('sending message to peer 0');
        done();
      });
      freedom.emit('message', 0);
    });
    freedom.emit('peer');
  });
});

describe("Core Provider Channels", function() {
  var manager, hub, global, source, core;
  
  beforeEach(function(done) {
    var debug = new Debug(),
      hub = new Hub(debug),
      resource = new Resource(debug),
      api = new Api(debug),
      manager = new Manager(hub, resource, api),
      source = testUtil.createTestPort('test');
    Bundle.register([{
      'name': 'core',
      'provider': Core.provider
    }], api);

    hub.emit('config', {
      global: {}
    });
    manager.setup(source);

    var chan = source.gotMessage('control').channel;
    hub.onMessage(chan, {
      type: 'Core Provider',
      request: 'core'
    });
    
    source.gotMessageAsync('control', {type: 'core'}, function(response) {
      core = response.core;
      done();
    });
  });

  it('Links Custom Channels', function() {
    expect(core).toBeDefined();

    var c = new core(), id, input;
    var call = c.createChannel(function(chan) {
      id = chan.identifier;
      input = chan.channel;
    });
    expect(input).toBeDefined();
    
    var inHandle = jasmine.createSpy('input');
    input.on(inHandle);
    expect(inHandle).not.toHaveBeenCalled();

    var output;
    c.bindChannel(id, function(chan) {
      output = chan;
    });
    expect(output).toBeDefined();
    
    expect(inHandle).not.toHaveBeenCalled();
    output.emit('message', 'whoo!');
    expect(inHandle).toHaveBeenCalled();
  });


  it('Supports Custom Channel Closing', function() {
    var c = new core(), id, input;
    var call = c.createChannel(function(chan) {
      id = chan.identifier;
      input = chan.channel;
    });
    expect(input).toBeDefined();
    
    var handle = jasmine.createSpy('message');

    var output;
    c.bindChannel(id, function(chan) {
      output = chan;
    });
    expect(output).toBeDefined();
    output.on(handle);

    var closer = jasmine.createSpy('close');
    input.onClose(closer);
    expect(handle).not.toHaveBeenCalled();
    input.emit('message', 'whoo!');
    expect(handle).toHaveBeenCalledWith('message', 'whoo!');
    expect(closer).not.toHaveBeenCalled();
    output.close();
    expect(closer).toHaveBeenCalled();
  });

  it('Manages Module Identifiers', function() {
    var c = new core();
    c.setId(['a','b','c']);
    
    var spy = jasmine.createSpy('id');
    c.getId(spy);
    expect(spy).toHaveBeenCalledWith(['a','b','c']);
  });
});

},{"../../../providers/core/core.unprivileged":16,"../../../src/api":55,"../../../src/bundle":56,"../../../src/debug":58,"../../../src/hub":60,"../../../src/manager":64,"../../../src/resource":72,"../../util":54}],29:[function(require,module,exports){
var testUtil = require('../../util');
var Util = require('../../../src/util');
var Echo = require('../../../providers/core/echo.unprivileged');

describe("providers/core/Echo_Unprivileged", function() {
  var app;
  var echo;

  beforeEach(function() {
    app = testUtil.createTestPort('test');
    app.controlChannel = 'control';
    echo = new Echo.provider(app, app.emit.bind(app));
  });

  it("Needs core", function() {
    var spy = jasmine.createSpy('msg');
    app.on('message', spy);
    echo.setup('test', function() {});
    expect(spy).toHaveBeenCalled();
  });
  
  it("Binds a custom channel", function() {
    var spy = jasmine.createSpy('msg');
    app.on('message', spy);

    var args;
    app.emit('core', function() {
      this.bindChannel = function(id, cb) {
        args = [id, cb];
      }
    });

    echo.setup('test', function() {});
    expect(spy).not.toHaveBeenCalled();
    expect(args[0]).toEqual('test');
    
    var chan = {};
    Util.handleEvents(chan);
    chan.onClose = function(c) {};
    
    args[1](chan);
    expect(spy).toHaveBeenCalled();

    chan.emit('message', 'test1');
    expect(spy).toHaveBeenCalledWith('from custom channel: test1');
  });

  it("Rebinds the channel", function() {
    var args;
    app.emit('core', function() {
      this.bindChannel = function(id, cb) {
        args = [id, cb];
      }
    });

    echo.setup('test', function() {});
    expect(args[0]).toEqual('test');
    
    var chan = {};
    Util.handleEvents(chan);
    chan.onClose = function(c) {};
    chan.close = jasmine.createSpy('close');
    
    args[1](chan);
    args[1](chan);
    expect(chan.close).toHaveBeenCalled();
  });
});

},{"../../../providers/core/echo.unprivileged":18,"../../../src/util":73,"../../util":54}],30:[function(require,module,exports){
var oAuth = require('../../../providers/core/core.oauth');
var setup = require('../../../src/entry');
var PromiseCompat = require('es6-promise').Promise;

function MockProvider() {
  // Empty Constructor.
};

MockProvider.prototype.initiateOAuth = function(redirectURIs, cont) {
  cont({
    redirect: "http://localhost/oAuthRedirect",
    state: Math.random()
  });
  return true;
};

MockProvider.prototype.launchAuthFlow = function(authUrl, stateObj, cont) {
  cont("Response Url");
  return true;
};

describe('oAuth', function () {
  it("oauth: Checks for a valid registered handler", function(done) {
    var de = jasmine.createSpy('de'),
      cb = jasmine.createSpy('cb');
    var authProvider = new oAuth.provider({}, de);
    authProvider.initiateOAuth(['http://localhost/oAuthRedirect'], cb);
    expect(cb).toHaveBeenCalledWith(null, jasmine.objectContaining({errcode: 'UNKNOWN'}));
    done();
  });

  it("oauth: Delegates to registered handlers", function (done) {
    var de = jasmine.createSpy('de'),
      cb = jasmine.createSpy('cb');
    oAuth.register([MockProvider]);
    var authProvider = new oAuth.provider({}, de);

    var callbackOne = function(stateObj) {
      expect(stateObj).toEqual(jasmine.objectContaining({
        redirect: "http://localhost/oAuthRedirect",
        state: jasmine.any(Number)
      }));
      authProvider.launchAuthFlow("AUTH URL", stateObj, callbackTwo);
    };

    var callbackTwo = function(respUrl) {
      expect(respUrl).toEqual(jasmine.any(String));
      done();
    };

    authProvider.initiateOAuth(['http://localhost/oAuthRedirect'], callbackOne);
  });

  it("Supports user-provided oAuth handlers", function (done) {
    var spy = jasmine.createSpy('oAuth CB');

    var freedom = setup({
      providers: [oAuth]
    }, '', {
      oauth: [MockProvider]
    });

    freedom.catch(function () {
      var de = jasmine.createSpy('de'),
        cb = jasmine.createSpy('cb');
      var authProvider = new oAuth.provider({}, de);
      authProvider.initiateOAuth(['http://localhost/oAuthRedirect'], function (ret, err) {
        expect(ret.redirect).toEqual("http://localhost/oAuthRedirect");
        done();
      });
    });
  });
  
  afterEach(function () {
    oAuth.reset();
  });
});

},{"../../../providers/core/core.oauth":15,"../../../src/entry":59,"es6-promise":1}],31:[function(require,module,exports){
var PeerConnection = require('../../../providers/core/peerconnection.unprivileged');

function MockRTCIceCandidate() {
}
function MockRTCPeerConnection(configuration, constraints) {
  MockRTCPeerConnection.mostRecent = this;
  this.configuration = configuration;
  this.constraints = constraints;
  this.listeners = {};
}

MockRTCPeerConnection.prototype.addEventListener = function(event, func) {
  // We only allow registering one listener for simplicity
  this.listeners[event] = func;
};

MockRTCPeerConnection.prototype.createDataChannel = function(label, dict) {
  var dataChannel = new RTCDataChannel(label, dict);
  return dataChannel;
};

MockRTCPeerConnection.prototype.close = function() {
  this.signalingState = 'closed';
};

function RTCDataChannel(label, dict) {
  RTCDataChannel.mostRecent = this;

  this.label = label;
  this.bufferedAmount = 0;
  this.readyState = "connecting";
  this._closed = false;
  setTimeout(function() {
    if (typeof this.onopen === 'function') {
      this.onopen();
    }
  }.bind(this), 0);
}

RTCDataChannel.prototype.send = function() {
};

RTCDataChannel.prototype.close = function() {
  this._closed = true;
};


function MockRTCSessionDescription(descriptionInitDict) {
  this.descriptionInitDict = descriptionInitDict;
  this.sdp = descriptionInitDict.sdp;
  this.type = descriptionInitDict.type;
}

describe("providers/core/peerconnection", function() {
  var portApp, signalChannel, emitted, listeningOn;
  var dispatchedEvents;
  var peerconnection;
  var turnServers = [];
  var PROXY = "PROXY";
  var TIMEOUT = 1000;
  

  function Core () {
  };

  Core.prototype.bindChannel = function(id, continuation) {
    continuation(signalChannel);
  };

  beforeEach(function beforeEach(done) {
    emitted = [];
    listeningOn = {};
    dispatchedEvents = {};

    // signalling channel events
    signalChannel = {
      emit: function(eventName, eventData) {
        emitted.push({eventName: eventName,
                      eventData: eventData});
      },
      on: function(event, func) {
        listeningOn[event] = func;
      }
    };
    
    portApp = {
      once: function(name, func) {
        expect(name).toEqual("core");
        func(Core);
      },
      emit: function() {
      }
    };
    peerconnection = new PeerConnection.provider(portApp,
                                        undefined,
                                        MockRTCPeerConnection,
                                        MockRTCSessionDescription,
                                        MockRTCIceCandidate);
    peerconnection.dispatchEvent = function(event, data) {
      if (dispatchedEvents[event] === undefined) {
        dispatchedEvents[event] = [];
      }
      dispatchedEvents[event].push(data);
    };

    function setupCalled() {
      expect(emitted).toContain({eventName: "ready", eventData: undefined});
      done();
    }

    peerconnection.setup(PROXY, "setup peer", turnServers, false,
                         setupCalled);
    // Modify the SimpleDataPeer's pc object to change the state to CONNECTED,
    // so that SimpleDataPeer.runWhenConnected callbacks will be run.
    peerconnection.peer.pc.signalingState = 'stable';
    peerconnection.peer.pc.listeners['signalingstatechange']();
  });

  it("Opens data channel", function(done) {
    var rtcpc = MockRTCPeerConnection.mostRecent;
    spyOn(rtcpc, "createDataChannel").and.callThrough();
    peerconnection.openDataChannel("openDC", openDataChannelContinuation);

    function openDataChannelContinuation() {
      var dataChannel;
      expect(rtcpc.createDataChannel).toHaveBeenCalledWith("openDC", {});
      dataChannel = RTCDataChannel.mostRecent;
      expect(dataChannel).toBeDefined();
      expect(dataChannel.label).toEqual("openDC");
      done();
    }
  });

  it("Fires onOpenDataChannel for peer created data channels.", function(done) {
    var rtcpc = MockRTCPeerConnection.mostRecent;
    var dataChannel = new RTCDataChannel("onOpenDC", {});
    dataChannel.readyState = "open";
    var event = {channel: dataChannel};
    
    rtcpc.listeners.datachannel(event);
    expect(dispatchedEvents.onOpenDataChannel[0]).toEqual({ channelId: "onOpenDC"});
    done();
  });

  it("Closes data channel", function(done) {
    var rtcpc = MockRTCPeerConnection.mostRecent;
    var dataChannel;
    peerconnection.openDataChannel("closeDC", openDataChannelContinuation);

    function openDataChannelContinuation() {
      dataChannel = RTCDataChannel.mostRecent;
      expect(dataChannel).toBeDefined();
      spyOn(dataChannel, "close").and.callThrough();
      peerconnection.closeDataChannel("closeDC", closeDataChannelContinuation);
    }
    function closeDataChannelContinuation() {
      expect(dataChannel.close).toHaveBeenCalled();
      done();
    }
  });

  it("Fires onClose when closed", function(done) {
    var rtcpc = MockRTCPeerConnection.mostRecent;
    var dataChannel;
    peerconnection.openDataChannel("oncloseDC", openDataChannelContinuation);
    function openDataChannelContinuation() {
      dataChannel = RTCDataChannel.mostRecent;
      expect(dataChannel.onclose).toEqual(jasmine.any(Function));
      dataChannel.onclose();
      
      expect(dispatchedEvents.onCloseDataChannel[0]).toBeDefined();
      done();
    }
  });

  it("Sends message", function(done) {
    var rtcpc = MockRTCPeerConnection.mostRecent;
    var dataChannel;
    var sendInfo = {channelLabel: "sendDC",
                   text: "Hello World"};
    peerconnection.openDataChannel("sendDC", openDataChannelContinuation);

    function openDataChannelContinuation() {
      dataChannel = RTCDataChannel.mostRecent;
      expect(dataChannel).toBeDefined();
      spyOn(dataChannel, "send");
      peerconnection.send(sendInfo, sendContinuation);
    }
    function sendContinuation() {
      expect(dataChannel.send).toHaveBeenCalledWith("Hello World");
      done();
    }
  });

  it("Receives messages", function(done) {
    var rtcpc = MockRTCPeerConnection.mostRecent;
    var dataChannel;

    peerconnection.openDataChannel("receiveDC", openDataChannelContinuation);
    function openDataChannelContinuation() {
      dataChannel = RTCDataChannel.mostRecent;
      expect(dataChannel.onmessage).toEqual(jasmine.any(Function));
      dataChannel.onmessage({data: "Hello World"});

      var message = dispatchedEvents.onReceived[0];
      expect(message).toBeDefined();
      expect(message.channelLabel).toEqual("receiveDC");
      expect(message.text).toEqual("Hello World");

      done();
    }
  });

  it("getBufferAmount", function(done) {
    peerconnection.openDataChannel("bufAmountDC", openDataChannelContinuation);
    function openDataChannelContinuation() {
      var dataChannel = RTCDataChannel.mostRecent;
      peerconnection.
        getBufferedAmount("bufAmountDC",
                           checkBufferedAmount.bind(undefined, 0));

      dataChannel.bufferedAmount = 1;
      peerconnection.
        getBufferedAmount("bufAmountDC",
                           checkBufferedAmount.bind(undefined, 1));

      dataChannel.bufferedAmount = 1337;
      peerconnection.
        getBufferedAmount("bufAmountDC",
                           checkBufferedAmount.bind(undefined, 1337));
      done();
    }
    function checkBufferedAmount(expected, valueReturned) {
      expect(valueReturned).toEqual(expected);
    }
  });

  it("Only fires onClose once", function(done) {
    expect(dispatchedEvents.onClose).not.toBeDefined();
    peerconnection.close(function() {
      expect(dispatchedEvents.onClose.length).toEqual(1);
    });
    peerconnection.close(function() {
      expect(dispatchedEvents.onClose.length).toEqual(1);
      done();
    });
  });

});

},{"../../../providers/core/peerconnection.unprivileged":19}],32:[function(require,module,exports){
var Provider = require('../../../providers/core/storage.localstorage');

describe("core.storage unprivileged", function() {
  var provider;
  var TIMEOUT = 1000;
  
  beforeEach(function(done) {
    provider = new Provider.provider({});
    provider.clear(done);
  });
  
  it("Deals with Keys appropriately", function(done) {
    var callbackOne = function(ret) {
      expect(ret).toEqual([]);
      provider.get('myKey', callbackTwo);
    };
    var callbackTwo = function(ret) {
      expect(ret).toEqual(null);
      provider.set('myKey', 'myVal', callbackThree);
    };
    var callbackThree = function(ret) {
      provider.get('myKey', callbackFour);
    }
    var callbackFour = function(ret) {
      expect(ret).toEqual('myVal');
      provider.keys(callbackFive);
    };
    var callbackFive = function(ret) {
      expect(ret).toEqual(['myKey']);
      provider.remove('myKey', callbackSix);
    }
    var callbackSix = function(ret) {
      provider.get('myKey', callbackSeven);
    };
    var callbackSeven = function(ret) {
      expect(ret).toEqual(null);
      done();
    };
    provider.keys(callbackOne);
  });

  it("Clears Items", function(done) {
    var callbackOne = function(ret) {
      provider.set('otherKey', 'otherValue', callbackTwo);
    };
    var callbackTwo = function(ret) {
      provider.clear(callbackThree);
    };
    var callbackThree = function(ret) {
      provider.get('myKey', callbackFour);
    };
    var callbackFour = function(ret) {
      expect(ret).toEqual(null);
      provider.get('otherKey', callbackFive);
    };
    var callbackFive = function(ret) {
      expect(ret).toEqual(null);
      done();
    }
    provider.set('myKey', 'myVal', callbackOne);
  });
});

},{"../../../providers/core/storage.localstorage":20}],33:[function(require,module,exports){
var View = require('../../../providers/core/core.view');
var PromiseCompat = require('es6-promise').Promise;
var testUtil = require('../../util');
var util = require('../../../src/util');

describe("core.view", function () {
  var provider, app, el, de;

  beforeEach(function () {
    app = {
      config: {
        global: window
      },
      
      resource: testUtil.setupResolvers(),
      manifestId: 'myApp',
      manifest: {
        views: {}
      }
    };
    de = jasmine.createSpy('dispatchEvents');
    util.handleEvents(app);
    provider = new View.provider(app, de);
 
    el = document.createElement('div');
    el.id = 'myview';
    document.body.appendChild(el);
  });

  afterEach(function () {
    document.body.removeChild(el);
    delete el;
  });

  it("Places objects and cleans up.", function (done) {
    app.manifest.views['myview'] = {
      main: "relative://spec/helper/view.html",
      files: []
    };

    var cb = jasmine.createSpy('cb');
    provider.show('myview', function () {
      expect(el.children.length).not.toBe(0);

      provider.close(cb);
      expect(el.innerHTML).toBe("");
      expect(cb).toHaveBeenCalled();
      done();
    });
  });

  it("Roundtrips messages", function (done) {
    app.manifest.views['myview'] = {
      main: "relative://spec/helper/view.html",
      files: []
    };
    
    var onPost = function (ret, err) {
      expect(err).toEqual(undefined);
    };
    
    var onMessage = function (type, data) {
      expect(type).toEqual('message');
      expect(data).toEqual('Echo: TEST');
      provider.close(done);
    };
    
    var onShow = function (ret, err) {
      expect(err).toEqual(undefined);
      de.and.callFake(onMessage);
      provider.postMessage('TEST', onPost);
    };

    provider.show('myview', onShow);
  });
});

},{"../../../providers/core/core.view":17,"../../../src/util":73,"../../util":54,"es6-promise":1}],34:[function(require,module,exports){
var WS = require('../../../providers/core/websocket.unprivileged');

function MockWebSocket(url, protocols) {
  MockWebSocket.currentInstance = this;

  this._name = Math.random();
  this.url = url;
  this.protocols = protocols;
  // this.readyState = MockWebSocket.readyStates["CONNECTING"];

  this.readyState = MockWebSocket.readyStates["CONNECTING"];
  setTimeout(this._open.bind(this), 0);

  // Record of dispatched events.
  this.dispatchedEvents = {};
}

MockWebSocket.readyStates = {
  "CONNECTING" : 0,
  "OPEN" : 1,
  "CLOSING" : 2,
  "CLOSED" : 3
};

MockWebSocket.prototype.dispatchEvent = function(event, data) {
  this.dispatchedEvents[event] = data;
  if (this.hasOwnProperty(event)) {
    this[event](data);
  }
};

MockWebSocket.prototype._open = function() {
  this.readyState = MockWebSocket.readyStates["OPEN"];
  this.dispatchEvent("onopen");
};

MockWebSocket.prototype.send = function(data) {
  this.sent = data;
};

MockWebSocket.prototype.close = function(code, reason) {
  this.readyState = MockWebSocket.readyStates["CLOSED"];
  this.dispatchEvent("onclose", {});
};

describe("core.websocket unprivileged", function() {
  var websocket;
  var WS_URL = "ws://p2pbr.com:8082/route/";
  var eventManager;

  function EventManager() {
    this.active = true;
    this.listeners = {};
    this.dispatchedEvents = {};
  }

  EventManager.prototype.dispatchEvent = function(event, data) {
    if (!this.active) {
      return;
    }
    this.dispatchedEvents[event] = data;
    if (this.listeners[event]) {
      this.listeners[event](data);
    }
  };

  EventManager.prototype.listenFor = function(event, listener) {
    this.listeners[event] = listener;
  };

  beforeEach(function() {
    eventManager = new EventManager();
    var dispatchEvent = eventManager.dispatchEvent.bind(eventManager);
    websocket = new WS.provider(undefined,dispatchEvent,
                       WS_URL, undefined,
                       MockWebSocket);
    spyOn(MockWebSocket.currentInstance, "send").and.callThrough();
    spyOn(MockWebSocket.currentInstance, "close").and.callThrough();
  });

  afterEach(function() {
    eventManager.active = false;
    eventManager = undefined;
    delete MockWebSocket.currentInstance;
    websocket = undefined;
  });

  it("fires onopen", function(done) {
    function onOpen() {
      done();
    }
    eventManager.listenFor("onOpen", onOpen);
  });

  it("closes", function(done) {

    function closeContinuation(noop, exception) {
      expect(noop).not.toBeDefined();
      expect(exception).not.toBeDefined();

      var mock = MockWebSocket.currentInstance;
      expect(mock.close.calls.count()).toEqual(1);
      done();
    }

    websocket.close(undefined, undefined, closeContinuation);
  });

  it("sends", function(done) {
    // We only test strings because phantomjs doesn't support Blobs or
    // ArrayBuffers. :(
    var message = {
      text: "Hello World"
    };
    function sendContinuation() {
      var mock = MockWebSocket.currentInstance;
      expect(mock.send.calls.count()).toEqual(1);
      expect(mock.sent).toEqual("Hello World");
      done();
    }
    websocket.send(message, sendContinuation);
  });

  it("send gives error with bad data", function(done) {
    var message = {
    };
    function sendContinuation(noop, error) {
      expect(error).toBeDefined();
      expect(error.errcode).toEqual("BAD_SEND");
      done();
    }
    websocket.send(message, sendContinuation);
  });

  it("gets ready state", function(done) {
    var mock = MockWebSocket.currentInstance;

    function readyStateContinuation(state) {
      expect(mock.readyState).toEqual(MockWebSocket.readyStates["OPEN"]);
      expect(state).toEqual(MockWebSocket.readyStates["OPEN"]);
      done();
    }
    function onOpen() {
      expect(mock.readyState).toEqual(MockWebSocket.readyStates["OPEN"]);
      websocket.getReadyState(readyStateContinuation);  
    }
    
    eventManager.listenFor("onOpen", onOpen);
  });
  
  it("receives messages", function(done) {
    eventManager.listenFor('onMessage', function(m) {
      expect(m).toEqual({text: 'mytext'});
      done();
    });
    MockWebSocket.currentInstance.onmessage({data: 'mytext'});
  });
});

},{"../../../providers/core/websocket.unprivileged":21}],35:[function(require,module,exports){
var testUtil = require('../../util');
var Provider = require('../../../providers/social/loopback/social.loopback');

describe("unit: social.loopback.json", function () {
  var provider;

  beforeEach(function() {
    // Comment for more debugging messages.
    spyOn(console, 'log');
    
    var social = testUtil.getApis().get("social").definition;

    freedom = function() {
      return testUtil.mockIface([], [
        ['STATUS', social.STATUS.value],
        ['ERRCODE', social.ERRCODE.value]
      ])
    };

    provider = new Provider.provider(jasmine.createSpy('dispatchEvent'));
  });
  
  afterEach(function() {
  });
 
  it("logs in", function() {
    var d = jasmine.createSpy("login");
    var expectedResult = {
      userId: "Test User",
      clientId: "Test User.0",
      status: "ONLINE",
      lastUpdated: jasmine.any(Number),
      lastSeen: jasmine.any(Number)
    };
    provider.login({}, d);
    expect(d).toHaveBeenCalled();
    expect(d).toHaveBeenCalledWith(expectedResult);
    expect(provider.dispatchEvent).toHaveBeenCalled();
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onClientState", expectedResult);
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onClientState", {
      userId: "Other User",
      clientId: "Other User.0",
      status: "ONLINE",
      lastUpdated: jasmine.any(Number),
      lastSeen: jasmine.any(Number)
    });
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onUserProfile", {
      userId: "Test User",
      name: "Test User",
      lastUpdated: jasmine.any(Number)
    });
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onUserProfile", {
      userId: "Other User",
      name: "Other User",
      lastUpdated: jasmine.any(Number)
    });
  });

  it("can getClients", function() {
    var d = jasmine.createSpy("getClients");
    provider.login({}, function() {});
    provider.getClients(d);
    expect(d.calls.count()).toEqual(1);
    expect(d.calls.mostRecent().args.length).toBeGreaterThan(0);
    expect(d.calls.mostRecent().args[0]["Test User.0"]).toBeDefined();
    expect(d.calls.mostRecent().args[0]["Test User.0"]).toEqual({
      userId: "Test User",
      clientId: "Test User.0",
      status: "ONLINE",
      lastUpdated: jasmine.any(Number),
      lastSeen: jasmine.any(Number)
    });
    expect(d.calls.mostRecent().args[0]["Other User.0"]).toBeDefined();
    expect(d.calls.mostRecent().args[0]["Other User.0"]).toEqual({
      userId: "Other User",
      clientId: "Other User.0",
      status: "ONLINE",
      lastUpdated: jasmine.any(Number),
      lastSeen: jasmine.any(Number)
    });
  });

  it("can getUsers", function() {
    var d = jasmine.createSpy("getUsers");
    provider.login({}, function() {});
    provider.getUsers(d);
    expect(d.calls.count()).toEqual(1);
    expect(d.calls.mostRecent().args.length).toBeGreaterThan(0);
    expect(d.calls.mostRecent().args[0]["Test User"]).toBeDefined();
    expect(d.calls.mostRecent().args[0]["Test User"]).toEqual({
      userId: "Test User",
      name: "Test User",
      lastUpdated: jasmine.any(Number)
    });
    expect(d.calls.mostRecent().args[0]["Other User"]).toBeDefined();
    expect(d.calls.mostRecent().args[0]["Other User"]).toEqual({
      userId: "Other User",
      name: "Other User",
      lastUpdated: jasmine.any(Number)
    });
  });

  it("logs out", function() {
    var d = jasmine.createSpy("logout");
    provider.login({}, function() {});
    provider.logout(d);
    expect(d).toHaveBeenCalled();
    expect(provider.dispatchEvent).toHaveBeenCalled();
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onClientState", {
      userId: "Test User",
      clientId: "Test User.0",
      status: "OFFLINE",
      lastUpdated: jasmine.any(Number),
      lastSeen: jasmine.any(Number)
    });
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onClientState", {
      userId: "Other User",
      clientId: "Other User.0",
      status: "OFFLINE",
      lastUpdated: jasmine.any(Number),
      lastSeen: jasmine.any(Number)
    });
  
  });

  it("echos messages", function() {
    var d = jasmine.createSpy("sendMessage");
    provider.login({}, function() {});
    provider.sendMessage("Other User", "Hello World", d);
    expect(d).toHaveBeenCalled();
    expect(provider.dispatchEvent).toHaveBeenCalled();
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onMessage", {
      from: {
        userId: "Other User",
        clientId: "Other User.0",
        status: "ONLINE",
        lastUpdated: jasmine.any(Number),
        lastSeen: jasmine.any(Number)
      },
      message: "Hello World"
    });
  });


});



},{"../../../providers/social/loopback/social.loopback":22,"../../util":54}],36:[function(require,module,exports){
var testUtil = require('../../util');
var Provider = require('../../../providers/social/websocket-server/social.ws');

describe("unit: social.ws.json", function () {
  var provider, de, ws;

  beforeEach(function() {
    // Comment for more debugging messages.
    spyOn(console, 'log');

    var social = testUtil.getApis().get("social").definition;

    freedom = function() {
      return testUtil.mockIface([], [
        ['STATUS', social.STATUS.value],
        ['ERRCODE', social.ERRCODE.value]
      ])
    };

    jasmine.clock().install();
    de = jasmine.createSpy('dispatchEvent');
    var wsprov = function(url, protocols) {
      ws = {
        url: url,
        protocols: protocols,
        close: jasmine.createSpy('close').and.callFake(function() {this.onClose();}),
        send: jasmine.createSpy('send'),
        on: jasmine.createSpy('on').and.callFake(function(event, callback) {
          this[event] = callback;
        })
      };
      return ws;
    };
    provider = new Provider.provider(de, wsprov);
  });
  
  afterEach(function() {
    jasmine.clock().uninstall();
  });

  function makeClientState(id, status) {
    return {
      userId: id,
      clientId: id,
      status: status,
      lastUpdated: jasmine.any(Number),
      lastSeen: jasmine.any(Number)
    };
  }
  
  it("logs in", function() {
    var d = jasmine.createSpy("login");
    provider.login({}, d);
    expect(d).not.toHaveBeenCalled();

    ws.onMessage({text: JSON.stringify({'cmd': 'state', 'id': 'yourId', 'msg':''})});
    
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onClientState", makeClientState("yourId", "ONLINE"));
    expect(d).toHaveBeenCalledWith(makeClientState("yourId", "ONLINE"), undefined);
  });

  it("can getClients", function() {
    var d = jasmine.createSpy("getRoster");
    provider.login({}, function() {});
    ws.onMessage({text: JSON.stringify({'cmd': 'state', 'id': 'yourId', 'msg':['tom', 'bill']})});
    provider.getClients(d);
    expect(d.calls.count()).toEqual(1);
    expect(d.calls.mostRecent().args.length).toBeGreaterThan(0);
    expect(d.calls.mostRecent().args[0]["tom"]).toEqual(makeClientState("tom", "ONLINE"));
    expect(d.calls.mostRecent().args[0]["bill"]).toEqual(makeClientState("bill", "ONLINE"));
  });

  it("can getUsers", function() {
    var d = jasmine.createSpy("getRoster");
    provider.login({}, function() {});
    ws.onMessage({text: JSON.stringify({'cmd': 'state', 'id': 'yourId', 'msg':['tom', 'bill']})});
    provider.getUsers(d);
    expect(d.calls.count()).toEqual(1);
    expect(d.calls.mostRecent().args.length).toBeGreaterThan(0);
    expect(d.calls.mostRecent().args[0]["tom"]).toBeDefined();
    expect(d.calls.mostRecent().args[0]["bill"]).toEqual({
      userId: "bill",
      name: "bill",
      lastUpdated: jasmine.any(Number)
    });
  });


  it("logs out", function() {
    var d = jasmine.createSpy("logout");
    provider.login({}, function() {});
    provider.logout(d);
    expect(d).toHaveBeenCalled();
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onClientState", jasmine.objectContaining({
      status: "OFFLINE"
    }));
    expect(ws.close).toHaveBeenCalled();
  });

  it("echos messages", function() {
    var d = jasmine.createSpy("sendMessage");
    provider.login({}, function() {});
    ws.onMessage({text: JSON.stringify({'cmd': 'state', 'id': 'yourId', 'msg':['tom', 'bill']})});
    provider.sendMessage("tom", "Hello World", d);
    expect(ws.send.calls.mostRecent().args[0])
      .toEqual({text: jasmine.any(String)});
    expect(d).toHaveBeenCalled();

    ws.onMessage({text: JSON.stringify({'cmd': 'message', 'from':'tom', 'msg':'hello'})});
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onMessage", {
      from: makeClientState("tom", "ONLINE"),
      message: "hello"
    });
  });
});



},{"../../../providers/social/websocket-server/social.ws":23,"../../util":54}],37:[function(require,module,exports){
var testUtil = require('../../util');
var Provider = require('../../../providers/storage/isolated/storage.isolated');
var PromiseCompat = require('es6-promise').Promise;

describe("unit: storage.isolated.json", function () {
  var provider, finishCore, promise;
  beforeEach(function() {
    // Comment for log messages.
    spyOn(console, "log");
    promise = new PromiseCompat(function(resolve) {
      finishCore = resolve;
    });

    freedom = {
      core: testUtil.mockIface([['getId', promise]]),
      'core.storage': testUtil.mockIface([
        ['keys', ['myId;Test', 'otherTest']],
        ['get', 'value'],
        ['set', undefined],
        ['remove', undefined]
      ])
    };
    provider = new Provider.provider(null);
  });

  it("returns owned keys", function(done) {
    finishCore(['myId']);
    promise.then(function() {
      var d = function(result) {
        expect(provider.store.keys).toHaveBeenCalled();
        expect(result).toEqual(['Test']);
        done();
      };
      provider.keys(d);
    });
  });

  it("gets saved items", function(done) {
    finishCore(['myId']);
    var d = function(result) {
      expect(provider.store.get).toHaveBeenCalledWith('myId;mykey');
      expect(result).toEqual('value');
      done();
    };
    provider.get('mykey', d);
  });

  it("sets items", function(done) {
    finishCore(['myId']);
    var d = function() {
      expect(provider.store.set).toHaveBeenCalledWith('myId;mykey', 'myval');
      done();
    };
    provider.set('mykey', 'myval', d);
  });

  it("Removes items", function(done) {
    finishCore(['myId']);
    var d = function() {
      expect(provider.store.remove).toHaveBeenCalledWith('myId;mykey');
      done();
    };
    provider.remove('mykey', d);
  });

  it("Clears storage", function(done) {
    finishCore(['myId']);
    var d = function() {
      expect(provider.store.remove).toHaveBeenCalled();
      done();
    };
    provider.clear(d);
  });

  it("Buffers until core is ready", function(done) {
    var cb = jasmine.createSpy('buffer');
    var d = function() {
      done();
    };
    provider.keys(cb);
    provider.set('mykey', 'myval', cb);
    provider.get('mykey', cb);
    provider.remove('mykey', d);
    setTimeout(function() {
      expect(cb).not.toHaveBeenCalled();
      finishCore(['myId']);
    }, 0);
  });
});

},{"../../../providers/storage/isolated/storage.isolated":24,"../../util":54,"es6-promise":1}],38:[function(require,module,exports){
var testUtil = require('../../util');
var Provider = require('../../../providers/storage/shared/storage.shared');

describe("unit: storage.shared.json", function () {
  var provider;
  beforeEach(function() {
    freedom = {
      core: testUtil.mockIface([['getId', ['myId']]]),
      'core.storage': testUtil.mockIface([
        ['keys', ['myId;Test', 'otherTest']],
        ['get', 'value'],
        ['set', undefined],
        ['remove', undefined],
        ['clear', undefined]
      ])
    };
    provider = new Provider.provider();
  });

  it("returns owned keys", function(done) {
    var d = jasmine.createSpy('keys');
    provider.keys(d);
    setTimeout(function() {
      expect(provider.store.keys).toHaveBeenCalled();
      expect(d).toHaveBeenCalledWith(['myId;Test', 'otherTest']);
      done();
    }, 0);
  });

  it("gets saved items", function(done) {
    var d = jasmine.createSpy('get');
    provider.get('mykey', d);
    setTimeout(function() {
      expect(d).toHaveBeenCalledWith('value');
      expect(provider.store.get).toHaveBeenCalledWith('mykey');
      done();
    }, 0);
  });

  it("sets items", function(done) {
    var d = jasmine.createSpy('set');
    provider.set('mykey', 'myval', d);
    setTimeout(function() {
      expect(d).toHaveBeenCalled();
      expect(provider.store.set).toHaveBeenCalledWith('mykey', 'myval');
      done();
    }, 0);
  });

  it("Removes items", function(done) {
    var d = jasmine.createSpy('remove');
    provider.remove('mykey', d);
    setTimeout(function() {
      expect(d).toHaveBeenCalled();
      expect(provider.store.remove).toHaveBeenCalledWith('mykey');
      done();
    });
  });

  it("Clears storage", function(done) {
    var d = jasmine.createSpy('clear');
    provider.clear(d);
    setTimeout(function() {
      expect(d).toHaveBeenCalled();
      expect(provider.store.clear).toHaveBeenCalled();
      done();
    });
  });

});


},{"../../../providers/storage/shared/storage.shared":25,"../../util":54}],39:[function(require,module,exports){
var testUtil = require('../../util');
var util = require('../../../src/util');
var Provider = require('../../../providers/transport/webrtc/transport.webrtc');

describe("unit: transport.webrtc.json", function () {
  var transport, peerconnection, dispatchedEvents;
  var sizeToBuffer = Provider.provider.prototype._sizeToBuffer;
  var bufferToSize = Provider.provider.prototype._bufferToSize;
  function defineSlice(arrayBuffer) {
    arrayBuffer.slice = function(begin, end) {
      begin = (begin|0) || 0;
      var num = this.byteLength;
      end = end === (void 0) ? num : (end|0);

      // Handle negative values.
      if (begin < 0) begin += num;
      if (end < 0) end += num;

      if (num === 0 || begin >= num || begin >= end) {
        return new ArrayBuffer(0);
      }

      var length = Math.min(num - begin, end - begin);
      var target = new ArrayBuffer(length);
      var targetArray = new Uint8Array(target);
      targetArray.set(new Uint8Array(this, begin, length));
      return target;
    };
  }


  // Adds "on" listener that can register event listeners, which can
  // later be fired through "fireEvent". It is expected that listeners
  // will be regstered before events are fired.
  function makeEventTarget(target) {
    var listeners = {};
    target.on = function(event, func) {
      if (listeners[event]) {
        listeners[event].push(func);
      } else {
        listeners[event] = [func];
      }
    };
    target.fireEvent = function(event, data) {
      expect(target.on).toHaveBeenCalledWith(event, jasmine.any(Function));
      listeners[event].forEach(function(listener) {
        listener(data);
      });
    };
    target.removeListeners = function() {
      listeners = {};
    };
    spyOn(target, "on").and.callThrough();
  }

  beforeEach(function(done) {
    dispatchedEvents = {};
    freedom = {
      core: testUtil.mockIface([["getId", ["myId"]]]),
      // We can't use mockIface alone, we need to make peerconnection
      // an event target.
      "core.peerconnection": function() {
        var iface = testUtil.mockIface([
          ["setup", undefined],
          ["send", undefined],
          ["openDataChannel", undefined],
          ["close", undefined],
          ["getBufferedAmount", 0]
        ]);
        peerconnection = iface();
        makeEventTarget(peerconnection);
        return peerconnection;
      }
    };
    transport = new Provider.provider();
    transport.dispatchEvent = function(event, data) {
      dispatchedEvents[event] = data;
    };

    transport.setup("unit-tests", undefined, postSetup);
    function postSetup() {
      expect(peerconnection.setup).toHaveBeenCalledWith(undefined,
                                                       "unit-tests",
                                                        Provider.provider.stun_servers,
                                                        false);
      done();
    }
  });

  it("Sends data", function(done) {
    var tag = "test tag";
    var firstMessage = util.str2ab("Hello World");
    var secondMessage = util.str2ab("Wello Horld");
    spyOn(transport, "send").and.callThrough();
    transport.send(tag, firstMessage, firstSendCallback);
    function firstSendCallback() {
      var expectedMessage = new ArrayBuffer(firstMessage.byteLength + 8);
      var view = new Uint8Array(expectedMessage);
      view.set(sizeToBuffer(firstMessage.byteLength));
      view.set(firstMessage, 8);
      expect(transport._tags).toContain(tag);
      expect(transport.send.calls.count()).toBe(2);
      expect(peerconnection.send).
        toHaveBeenCalledWith({channelLabel: tag, buffer: expectedMessage});
      // Call a second time, to check path that does not need to
      // create new tag.
      transport.send(tag, secondMessage, secondSendCallback);
    }

    function secondSendCallback() {
      var expectedMessage = new ArrayBuffer(secondMessage.byteLength + 8);
      var view = new Uint8Array(expectedMessage);
      view.set(sizeToBuffer(secondMessage.byteLength));
      view.set(secondMessage, 8);
      expect(transport.send.calls.count()).toBe(3);
      expect(peerconnection.send).
        toHaveBeenCalledWith({channelLabel: tag, buffer: expectedMessage});
      done();
    }
  });

  function printBuffer(buffer) {
    var test = new Uint8Array(buffer);
    for (var i = 0; i < buffer.byteLength; i++) {
      console.log(test[i]);
    }
  }

  xit("fires on data event", function() {
    var tag = "test";
    var data = util.str2ab("Hello World");
    var sizeAsBuffer = sizeToBuffer(data.byteLength);
    var toSend = new ArrayBuffer(data.byteLength + 8);
    defineSlice(toSend);
    var view = new Uint8Array(toSend);
    view.set(sizeAsBuffer);
    view.set(data, 8);
    var message = {channelLabel: "test",
                   buffer: toSend};
    transport.onData(message);
    console.info(dispatchedEvents.onData.data.byteLength);
    console.info(util.ab2str(dispatchedEvents.onData.data));
    expect(dispatchedEvents.onData).toEqual({tag: tag,
                                             data: data});
  });

  it("closes", function(done) {
    transport.close(closeCallback);
    function closeCallback() {
      expect(peerconnection.close).toHaveBeenCalled();
      done();
    }
  });

  it("fires onClose event", function() {
    peerconnection.fireEvent("onClose", undefined);
    expect(dispatchedEvents.onClose).toBeDefined();
  });
});

},{"../../../providers/transport/webrtc/transport.webrtc":26,"../../../src/util":73,"../../util":54}],40:[function(require,module,exports){
var Api = require('../../src/api');

describe("Api", function() {
  var api;

  beforeEach(function() {
    api = new Api();
  });

  it("should return registered providers", function() {
    var provider = {id: "test"};
    api.set('customName', provider);
    expect(api.get('customName').definition).toEqual(provider);
    expect(api.get('customName').name).toEqual('customName');
    expect(api.get('otherName')).toBeFalsy();
  });

  it("should not allow core providers without an API.", function(done) {
    var provider = function() {};

    api.register('customCore', provider);
    var channel = api.getCore('customCore', null);
    channel.then(function() {}, function() {
      done();
    });
  });

  it("should register core providers", function(done) {
    var provider = function(arg) { this.arg = arg };

    api.set('customCore', provider);
    api.register('customCore', provider);
    var channel = api.getCore('customCore', 12);
    channel.then(function(prov) {
      var obj = new prov();
      expect(obj.arg).toEqual(12);
      done();
    });
  });
  
  it("should register core providers in promise style", function(done) {
    var provider = function(arg) { this.arg = arg };

    api.set('customCore', provider);
    api.register('customCore', provider, 'providePromises');
    var channel = api.getCore('customCore', 12);
    channel.then(function(prov) {
      var obj = new prov();
      expect(api.getInterfaceStyle('customCore')).toEqual('providePromises');
      expect(obj.arg).toEqual(12);
      done();
    });
  });

  it("allows late registration of core providers", function(done) {
    var provider = function(arg) { this.arg = arg };

    api.set('customCore', provider);
    var channel = api.getCore('customCore', 12);

    var arg = 0;
    channel.then(function(prov) {
      var mine = new prov();
      arg = mine.arg;
      expect(arg).toEqual(12);
      done();
    });

    expect(arg).toEqual(0);
    
    api.register('customCore', provider);
  });
});

},{"../../src/api":55}],41:[function(require,module,exports){
var Consumer = require('../../src/consumer');
var EventInterface = require('../../src/proxy/eventInterface');

describe("Consumer", function() {
  var port;
  beforeEach(function() {
    port = new Consumer(EventInterface);
  });

  it("reports messages back to the port", function() {
    var iface = port.getInterface();
    expect(iface.on).toBeDefined();
    var spy = jasmine.createSpy('cb');
    port.on('message', spy);

    // setup.
    port.onMessage('default', {
      channel: 'message'
    });
    expect(spy).not.toHaveBeenCalled();

    // existing interfaces now work.
    iface.emit('hi', 'msg');
    expect(spy).toHaveBeenCalled();
    
    // New interfaces also will.
    iface = port.getInterface();
    iface.emit('hi', 'msg');
    expect(spy.calls.count()).toEqual(2);
  });

  it("reports messages to the interface", function() {
    // setup.
    port.onMessage('default', {
      channel: 'message'
    });
    var iface = port.getInterface();
    var spy = jasmine.createSpy('cb');
    iface.on('message', spy);
    
    port.onMessage('default', {type:'message', message:{type:'message', message: 'thing'}});
    expect(spy).toHaveBeenCalledWith('thing');
  });
  
  it("sends constructor arguments to appropriate interface", function() {
    var arg = undefined;
    var myInterface = function(onMsg, emit, debug, x) {
      arg = x;
    };
    // setup.
    port = new Consumer(myInterface);

    port.onMessage('default', {
      channel: 'message'
    });
    var iface = port.getInterface('arg1');
    expect(arg).toEqual('arg1');

    arg = undefined;
    var proxy = port.getProxyInterface();
    proxy('arg1');
    expect(arg).toEqual('arg1');
  });

  it("closes the interface when asked", function() {
    // setup.
    port.onMessage('control', {
      type: 'setup',
      channel: 'control'
    });
    port.onMessage('default', {
      channel: 'message'
    });
    var spy = jasmine.createSpy('cb');
    port.on('message', spy);
    var closeSpy = jasmine.createSpy('close');
    port.on('control', closeSpy);

    var publicProxy = port.getProxyInterface();
    var iface = publicProxy();
    iface.emit('hi', 'msg');

    expect(spy).toHaveBeenCalled();
    publicProxy.close();
    iface.emit('hi', 'msg');
    expect(spy.calls.count()).toEqual(1);
    expect(closeSpy).toHaveBeenCalled();
    expect(closeSpy.calls.argsFor(0)[0].request).toEqual('close');
  });

  it("reports errors when they occur", function() {
    // setup.
    port.onMessage('control', {
      type: 'setup',
      channel: 'control'
    });
    port.onMessage('default', {
      channel: 'message'
    });
    var spy = jasmine.createSpy('msg');
    var espy = jasmine.createSpy('cb');
    port.on('message', spy);

    var publicProxy = port.getProxyInterface();
    var iface = publicProxy();
    publicProxy.onError(espy);
    iface.emit('hi', 'msg');
    expect(spy).toHaveBeenCalled();

    expect(espy).not.toHaveBeenCalled();
    port.onMessage('default', {
      type: 'error',
      to: false,
      message: 'msg'
    });
    expect(espy).toHaveBeenCalled();
  });
});

},{"../../src/consumer":57,"../../src/proxy/eventInterface":70}],42:[function(require,module,exports){
var Debug = require('../../src/debug.js');

describe("Debug", function() {
  var debug, activeLogger, onLogger;
  var Logger = function() {
    activeLogger = this;
    this.spy = jasmine.createSpy('log');
    this.log = function() {
      this.spy(arguments[0], arguments[1]);
      onLogger();
    };
    this.warn = function() {
      this.spy(arguments[0], arguments[1]);
      onLogger();
    };
  };

  beforeEach(function() {
    debug = new Debug();
  });

  it("Relays Messages", function() {
    var spy = jasmine.createSpy('cb');
    debug.on('msg', spy);

    debug.log('test1');
    debug.warn('test2');
    debug.error('test3');
    debug.format('log', 'source', 'message');
    expect(spy).not.toHaveBeenCalled();

    debug.onMessage('control', {
      channel: 'msg',
      config: {
        debug: true,
        global: {}
      }
    });

    expect(spy).toHaveBeenCalled();
    expect(spy.calls.count()).toEqual(4);
  });

  it("Prints to a provider", function(done) {
    var log = new Logger();
    debug.setLogger(log);

    var msg = {
      severity: 'log',
      source: null,
      msg: JSON.stringify(["My Message"])
    }

    onLogger = function() {
      expect(activeLogger.log).toBeDefined();
      expect(activeLogger.spy).toHaveBeenCalledWith(null, ["My Message"]);
      done();
      onLogger = function() {};
    };

    debug.print(msg);
});
});

},{"../../src/debug.js":58}],43:[function(require,module,exports){
var testUtil = require('../util');

//Run jasmine tests with 10 second timeout.
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe("freedom", function() {
  var freedom;
  beforeEach(function() {
    testUtil.setCoreProviders([
      require('../../providers/core/core.unprivileged'),
      require('../../providers/core/console.unprivileged')
    ]);
    freedom = testUtil.setupModule("relative://spec/helper/manifest.json");
  });
  
  afterEach(function() {
    testUtil.cleanupIframes();
    freedom = null;
  });

  it("creates modules", function(done) {
    freedom.then(function(iface) {
      var app = iface();
      app.on('output', function(value) {
        expect(value).toEqual('roundtrip');
        done();
      });
      app.emit('input', 'roundtrip');
    });
  });

  it("Creates child modules", function(done) {
    freedom.then(function(iface) {
      var app = iface();
      app.on('child-output', function(value) {
        expect(value).toEqual('child-roundtrip');
        done();
      });
      app.emit('child-input', 'child-roundtrip');
    });
  });
  
  it("Handles manifest-defined APIs", function(done) {
    freedom.then(function(iface) {
      var app = iface();
      app.on('log', function(value) {
        var log = JSON.parse(value);
        if (log.length < 2) {
          app.emit('get-log');
          return;
        }
        expect(log[0][2]).toEqual('log Msg');
        expect(log[1][2]).toEqual('another Log');
        expect(log[1][0] - log[0][0]).toBeGreaterThan(-1);
        done();
      });
      app.emit('do-log', 'log Msg');
      app.emit('do-log', 'another Log');
      app.emit('get-log');
    });
  });
});

describe("freedom instances", function() {
  var freedom;
  beforeEach(function() {
    testUtil.setCoreProviders([
      require('../../providers/core/core.unprivileged'),
      require('../../providers/core/console.unprivileged')
    ]);
  });

  it("Supports custom loggers", function(done) {
    freedom = testUtil.setupModule("relative://spec/helper/manifest.json", {
      logger: "relative://spec/helper/logger.json"
    });
    freedom.then(function (iface) {
      var app = iface();
      app.on('log', function(value) {
        var log = JSON.parse(value);
        expect(log.length).toBeGreaterThan(0);
        done();
      });
      app.emit('get-log');
    });
  });
  
  afterEach(function() {
    testUtil.cleanupIframes();
    freedom = null;
  });
});
},{"../../providers/core/console.unprivileged":14,"../../providers/core/core.unprivileged":16,"../util":54}],44:[function(require,module,exports){
var entry = require('../../src/entry');
var testUtil = require('../util');
var direct = require('../../src/link/direct');

describe("FreedomModule", function() {
  var freedom, global, h = [];
  beforeEach(function() {
    global = {
      directLink: {
        emit: function(flow, msg) {
          h.push([flow, msg]);
        }
      }
    };

    var path = window.location.href,
        dir_idx = path.lastIndexOf('/'),
        dir = path.substr(0, dir_idx) + '/';
    freedom = entry({
      'portType': direct,
      'isModule': true,
      'providers': [],
      'global': global
    });
  });
  
  it("Initiates connection outwards.", function() {
    expect(h.length).toBeGreaterThan(0);
  });
});

},{"../../src/entry":59,"../../src/link/direct":62,"../util":54}],45:[function(require,module,exports){
var Hub = require('../../src/hub');
var Debug = require('../../src/debug');

describe("Hub", function() {
  var hub, debug;

  beforeEach(function() {
    debug = new Debug();
    hub = new Hub(debug);
  });

  it("routes messages", function() {
    var app = {
      id: 'testApp'
    };
    hub.register(app);
    app.onMessage = jasmine.createSpy('cb');
    var route = hub.install(app, 'testApp', 'test');
    
    var msg = {test: true};
    hub.onMessage(route, msg);

    expect(app.onMessage).toHaveBeenCalledWith('test', msg);
  });

  it("requires registration", function() {
    var app = {
      id: 'testApp'
    };
    spyOn(debug, 'warn');
    hub.install(app, null, 'magic');
    expect(debug.warn).toHaveBeenCalled();

    hub.register(app);
    hub.install(app, null, 'magic');
    expect(debug.warn.calls.count()).toEqual(2);
    expect(hub.register(app)).toEqual(false);

    expect(hub.deregister(app)).toEqual(true);
    expect(hub.deregister(app)).toEqual(false);
  });

  it("goes between apps", function() {
    var app1 = {
      id: 'testApp'
    };
    var app2 = {
      id: 'otherApp'
    };
    hub.register(app1);
    hub.register(app2);
    app2.onMessage = jasmine.createSpy('cb');
    var route = hub.install(app1, 'otherApp', 'testx');
    
    var msg = {test: true};
    hub.onMessage(route, msg);

    expect(app2.onMessage).toHaveBeenCalledWith('testx', msg);
  });

  it("alerts if messages are sent improperly", function() {
    var app = {
      id: 'testApp'
    };
    hub.register(app);
    app.onMessage = jasmine.createSpy('cb');

    spyOn(debug, 'warn');
    
    hub.onMessage('test', "testing");

    expect(app.onMessage).not.toHaveBeenCalled();
    expect(debug.warn).toHaveBeenCalled();
  });

  it("removes routes", function() {
    spyOn(debug, 'warn');
    var app1 = {
      id: 'testApp'
    };
    var app2 = {
      id: 'otherApp'
    };
    hub.register(app1);
    hub.register(app2);
    app2.onMessage = jasmine.createSpy('cb');
    var route = hub.install(app1, 'otherApp', 'testx');
    
    var msg = {test: true};
    hub.onMessage(route, msg);

    expect(app2.onMessage).toHaveBeenCalledWith('testx', msg);

    hub.uninstall(app1, route);

    expect(debug.warn).not.toHaveBeenCalled();

    hub.onMessage(route, msg);
    expect(debug.warn).toHaveBeenCalled();
  });

  it("Handles failures when removing routes", function() {
    spyOn(debug, 'warn');
    var app1 = {
      id: 'testApp'
    };
    var app2 = {
      id: 'otherApp'
    };
    hub.register(app1);
    hub.register(app2);
    app2.onMessage = jasmine.createSpy('cb');
    var route = hub.install(app1, 'otherApp', 'testx');
    
    hub.uninstall(app2, route);
    expect(debug.warn).toHaveBeenCalled();

    hub.uninstall({id: null}, route);
    expect(debug.warn.calls.count()).toEqual(2);

    expect(hub.uninstall(app1, route+'fake')).toEqual(false);

    hub.deregister(app2);
    expect(hub.getDestination(route)).toEqual(undefined);
    expect(hub.getDestination(route+'fake')).toEqual(null);

    hub.onMessage(route, {test: true});
    expect(debug.warn.calls.count()).toEqual(3);
  });
});


},{"../../src/debug":58,"../../src/hub":60}],46:[function(require,module,exports){
var Debug = require('../../src/debug');
var Hub = require('../../src/hub');
var Manager = require('../../src/manager');
var Resource = require('../../src/resource');
var Api = require('../../src/api');

var testUtil = require('../util');

describe("Manager", function() {
  var debug, hub, manager, port, resource, api;

  beforeEach(function() {
    debug = new Debug();
    hub = new Hub(debug);
    resource = new Resource(debug);
    api = new Api(debug);
    api.set('core',{});
    api.register('core',function() {});
    manager = new Manager(hub, resource, api);
    var global = {};

    hub.emit('config', {
      global: global,
      debug: true
    });
    port = testUtil.createTestPort('testing');
    manager.setup(port);
  });

  it("Handles Debug Messages", function() {
    spyOn(debug, 'print');
    manager.onMessage('testing', {
      request: 'debug'
    });
    expect(debug.print).toHaveBeenCalled();
    manager.onMessage('unregistered', {
      request: 'debug'
    });
    expect(debug.print.calls.count()).toEqual(1);
  });

  it("Creates Links", function() {
    var testPort = testUtil.createTestPort('dest');

    manager.onMessage('testing', {
      request: 'link',
      name: 'testLink',
      to: testPort
    });
    // Setup message.
    expect(testPort.gotMessage('control')).not.toEqual(false);
    // Notification of link.
    var notification = port.gotMessage('control', {type: 'createLink'});
    expect(notification).not.toEqual(false);

    // Forward link is 'default'.
    var msg = {contents: "hi!"};
    port.emit(notification.channel, msg);
    expect(testPort.gotMessage('default')).toEqual(msg);

    // Backwards link should be 'testLink'.
    testPort.emit(notification.reverse, msg);
    expect(port.gotMessage('testLink')).toEqual(msg);
  });

  it("Supports delegation of control", function() {
    var testPort = testUtil.createTestPort('dest');

    manager.setup(testPort);

    // Delegate messages from the new port to our port.
    manager.onMessage('testing', {
      request: 'delegate',
      flow: 'dest'
    });

    // Send a message from the new port.
    manager.onMessage('dest', {
      contents: 'hi!'
    });

    var notification = port.gotMessage('control', {type: 'Delegation'});
    expect(notification).not.toEqual(false);
    expect(notification.flow).toEqual('dest');
    expect(notification.message.contents).toEqual('hi!');
  });

  it("Registers resource resolvers", function() {
    manager.onMessage('testing', {
      request: 'resource',
      service: 'testing',
      args: ['retriever', 'resolver']
    });
    expect(resource.contentRetrievers['testing']).toEqual('resolver');
  });

  it("Provides singleton access to the Core API", function(done) {
    manager.onMessage('testing', {
      request: 'core'
    });
    port.gotMessageAsync('control', {type: 'core'}, function(response) {
      expect(response).not.toEqual(false);
      var core = response.core;

      var otherPort = testUtil.createTestPort('dest');
      manager.setup(otherPort);
      manager.onMessage('dest', {
        request: 'core'
      });
      
      otherPort.gotMessageAsync('control', {type: 'core'}, function(otherResponse) {
        expect(otherResponse.core).toEqual(core);
        done();
      });
    });
  });

  it("Tears down Ports", function() {
    manager.onMessage('testing', {
      request: 'close'
    });

    // Subsequent requests should fail / cause a warning.
    spyOn(debug, 'warn');
    manager.onMessage('testing', {
      request: 'core'
    });
    expect(debug.warn).toHaveBeenCalled();
    expect(port.gotMessage('control', {type: 'core'})).toEqual(false);
  });

  it("Retreives Ports by ID", function() {
    expect(manager.getPort(port.id)).toEqual(port);
  });
});

},{"../../src/api":55,"../../src/debug":58,"../../src/hub":60,"../../src/manager":64,"../../src/resource":72,"../util":54}],47:[function(require,module,exports){
var Module = require('../../src/module');
var testUtil = require('../util');

describe("Module", function() {
  var module, link, port, policy;
  beforeEach(function(done) {
    policy = testUtil.createMockPolicy();
    module = new Module("manifest://{}", {}, [], policy);
    port = testUtil.createTestPort('messager');
    module.on('control', port.onMessage.bind(port, 'control'));
    module.on('extport', port.onMessage.bind(port, 'extport'));
    link = testUtil.createTestPort('modulelink');
    var test = function() {
      this.addErrorHandler = function() {};
      this.onMessage = link.onMessage.bind(link);
      this.on = link.on.bind(link);
      this.off = link.off.bind(link);
    };
    module.onMessage("control", {
      type: 'setup',
      channel: 'control',
      config: {
        portType: test
      }
    });
    setTimeout(done, 0);
  });
  
  it("Attempts Module Startup", function() {
    expect(link.gotMessage('control', {request: 'environment'})).not.toBeFalsy();
  });

  it("Maps flows between inner and outer hub", function() {
    // Link the core
    var spy = jasmine.createSpy('coremsg');
    var core = function() {
      this.onMessage = spy;
    };
    module.onMessage('control', {
      core: core
    });
    
    // Pretend the module has started.
    link.emit('ModInternal', {
      type: 'ready'
    });

    // Request to register a port. via a 'core' api call.
    link.emit('control', {
      flow: 'core',
      message: {
        type: 'register',
        id: 'newport'
      }
    });
    expect(spy).toHaveBeenCalledWith(module, {
      type: 'register',
      id: 'newport',
      reply: jasmine.any(Function)
    });
    // Respond as if binding has occured
    module.onMessage('control', {
      type: 'createLink',
      channel: 'extport',
      name: 'newport'
    });
    // Internal Mapping
    link.emit('control', {
      type: 'createLink',
      channel: 'intport',
      name: 'newport'
    });
    // Make sure messages now translate both ways.
    module.onMessage('newport', 'ingoing msg');
    expect(link.gotMessage('intport', 'ingoing msg')).not.toBeFalsy();

    link.emit('newport', 'outgoing msg');
    expect(port.gotMessage('extport', 'outgoing msg')).not.toBeFalsy();

    // Tear Down.
    module.onMessage('control', {
      type: 'close',
      channel: 'extport'
    });
    expect(link.gotMessage('control', {type: 'close'})).not.toBeFalsy();
  });
});
},{"../../src/module":65,"../util":54}],48:[function(require,module,exports){
var Api = require('../../src/api');
var Debug = require('../../src/debug');
var Hub = require('../../src/hub');
var Manager = require('../../src/manager');
var ModuleInternal = require('../../src/moduleinternal');

var testUtil = require('../util');

describe('ModuleInternal', function() {
  var app, manager, hub, global, loc;
  beforeEach(function() {
    global = {freedom: {}};
    hub = new Hub(new Debug());
    var resource = testUtil.setupResolvers();
    var api = new Api();
    api.set('core', {});
    api.register('core', function () {});
    manager = new Manager(hub, resource, api);
    app = new ModuleInternal(manager);
    hub.emit('config', {
      global: global,
      location: 'relative://'
    });
    manager.setup(app);

    var path = window.location.href,
        dir_idx = path.lastIndexOf('/');
    loc = path.substr(0, dir_idx) + '/';
});

  it('configures an app environment', function() {
    var source = testUtil.createTestPort('test');
    manager.setup(source);
    manager.createLink(source, 'default', app, 'default');

    hub.onMessage(source.messages[1][1].channel, {
      channel: source.messages[1][1].reverse,
      appId: 'testApp',
      lineage: ['global', 'testApp'],
      manifest: {
        app: {
          script: 'helper/channel.js'
        },
        permissions: ['core.echo'],
        dependencies: ['helper/friend.json'],
        provides: ['identity']
      },
      id: 'relative://spec/helper/manifest.json',
    });

    expect(source.gotMessage('control', {'name': 'identity'})).toBeDefined();
    expect(source.gotMessage('control', {'name': 'core.echo'})).toBeDefined();
  });

  it('handles script loading and attachment', function(done) {
    global.document = document;
    
    var script = btoa('fileIncluded = true; callback();');

    window.callback = function() {
      expect(fileIncluded).toEqual(true);
      delete callback;
      done();
    } 
    
    app.loadScripts(loc, ['data:text/javascript;base64,' + script, 'non_existing_file']);
  });

  it('load scripts sequentially', function(done) {
    global.document = document;

    fileIncluded = false;
    fileIncluded0 = false;

    var script0 = btoa('fileIncluded0 = true; callback0();');
    window.callback0 = function() {
      expect(fileIncluded0).toEqual(true);
      expect(fileIncluded).toEqual(false);
      delete callback0;
    };

    var script = btoa('fileIncluded = true; callback();');
    window.callback = function() {
      expect(fileIncluded0).toEqual(true);
      expect(fileIncluded).toEqual(true);
      delete callback;
      done();
    };

    app.loadScripts(loc, ['data:text/javascript;base64,' + script0,
                          'data:text/javascript;base64,' + script,
                          'non_existing_file']);
  })

  it('exposes dependency apis', function(done) {
    var source = testUtil.createTestPort('test');
    manager.setup(source);
    manager.createLink(source, 'default', app, 'default');
    source.on('onMessage', function(msg) {
      // Dependencies will be requested via 'createLink' messages. resolve those.
      if (msg.channel && msg.type === 'createLink') {
        hub.onMessage(msg.channel, {
          type: 'channel announcement',
          channel: msg.reverse
        });
      } else if (msg.type === 'resolve') {
        hub.onMessage(source.messages[1][1].channel, {
          id: msg.id,
          data: 'spec/' + msg.data
        });
      }
    });

    global.document = document;

    hub.onMessage(source.messages[1][1].channel, {
      channel: source.messages[1][1].reverse,
      appId: 'testApp',
      lineage: ['global', 'testApp'],
      manifest: {
        name: 'My Module Name',
        app: {
          script: 'helper/beacon.js'
        },
        dependencies: {
          "test": {
            "url": "relative://spec/helper/friend.json",
            "api": "social"
          }
        }
      },
      id: 'relative://spec/helper/manifest.json',
    });
    hub.onMessage(source.messages[1][1].channel, {
      type: 'manifest',
      name: 'test',
      manifest: {name: 'test manifest'}
    });

    window.callback = function() {
      delete callback;
      expect(global.freedom.manifest.name).toEqual('My Module Name');
      expect(global.freedom.test.api).toEqual('social');
      expect(global.freedom.test.manifest.name).toEqual('test manifest');
      done();
    };
  });
});

},{"../../src/api":55,"../../src/debug":58,"../../src/hub":60,"../../src/manager":64,"../../src/moduleinternal":66,"../util":54}],49:[function(require,module,exports){
var Debug = require('../../src/debug');
var Policy = require('../../src/policy');
var Resource = require('../../src/resource');
var util = require('../../src/util');

describe('Policy', function() {
  var policy,
      manager;
  beforeEach(function() {
    manager = {debug: new Debug()};
    util.handleEvents(manager);
    manager.getPort = function(id) {
      return {
        id: id
      };
    };
    var rsrc = new Resource();
    policy = new Policy(manager, rsrc, {});
  });
  
  it('Generates new modules when needed', function(done) {
    var manifest = {
      constraints: {
        isolation: "never"
      }
    };
    var manifestURL = "manifest://" + JSON.stringify(manifest);
    policy.get([], manifestURL).then(function(mod) {
      manager.emit('moduleAdd', {lineage:[manifestURL], id:mod.id});
      policy.get([], manifestURL).then(function(mod2) {
        expect(mod2.id).toEqual(mod.id);
        done();
      });
    });
  });
  
  xit('Finds an appropriate runtime to place new modules', function() {
    //TODO: need to understand actual policy for multiple runtimes better.
  });
  
  it('Detects if a module is running in a runtime', function() {
    manager.emit('moduleAdd', {lineage:['test','a','b','c'], id:'test1'});
    manager.emit('moduleAdd', {lineage:['test','a','d1','e2'], id:'test2'});

    expect(policy.isRunning(policy.runtimes[0], 'test', [], false)).toEqual('test1');
    expect(policy.isRunning(policy.runtimes[0], 'test', ['a','b','c'], true)).toEqual('test1');
    expect(policy.isRunning(policy.runtimes[0], 'test', ['a','b','e'], true)).toEqual(false);
    expect(policy.isRunning(policy.runtimes[0], 'test', ['a','d','e'], true)).toEqual('test2');
  });
  
  it('Loads Manifests', function(done) {
    policy.loadManifest('manifest://{"x":"y"}').then(function(manifest) {
      expect(manifest.x).toEqual('y');
      done();
    });
  });

  it('Keeps track of running modules', function() {
    var port2 = {};
    util.handleEvents(port2);
    policy.add(port2, {});
    port2.emit('moduleAdd', {lineage:['test'], id:'test'});
    expect(policy.isRunning(policy.runtimes[1], 'test', [], false)).toEqual('test');
    port2.emit('moduleRemove', {lineage:['test'], id:'test'});
    expect(policy.isRunning(policy.runtimes[1], 'test', [], false)).toEqual(false);
  });

  it('Overlays policy / config', function() {
    var customPolicy = {
      background: true,
      interactive: false,
      custom: true
    };
    expect(policy.overlay(policy.defaultPolicy, customPolicy)).toEqual(customPolicy);

    var nullPolicy = {};
    expect(policy.overlay(policy.defaultPolicy, nullPolicy)).toEqual(policy.defaultPolicy);
  });
});
},{"../../src/debug":58,"../../src/policy":67,"../../src/resource":72,"../../src/util":73}],50:[function(require,module,exports){
var Provider = require('../../src/provider');
var Promise = require('es6-promise').Promise;

describe("Provider", function() {
  var port, o, constructspy;
  beforeEach(function() {
    var definition = {
      'm1': {type: 'method', value:['string'], ret:'string'},
      'm2': {type: 'method', value:[{'name':'string'}]},
      'e1': {type: 'event', value:'string'},
      'c1': {type: 'constant', value:"test_constant"}
    };
    port = new Provider(definition);

    constructspy = jasmine.createSpy('constructor');
    o = function() {
      constructspy(arguments);
    };
    o.prototype.m1 = function(str) {
      return "m1-called";
    };
    o.prototype.m2 = function(obj) {
      return obj.name;
    };
  });

  it("presents a public interface which can be provided.", function() {
    var iface = port.getInterface();
    expect(iface['provideSynchronous']).toBeDefined();
    expect(iface.c1).toEqual("test_constant");

    iface.provideSynchronous(o);
    // setup.
    port.onMessage('default', {
      channel: 'message'
    });
    expect(constructspy).not.toHaveBeenCalled();

    port.onMessage('default', {to: 'testInst', type:'message', message:{'type': 'construct'}});
    
    expect(constructspy).toHaveBeenCalled();
  });

  it("constructs interfaces with arguments in a reasonable way.", function() {
    var definition = {
      'constructor': {value: ['object']}
    };
    port = new Provider(definition);
    var iface = port.getInterface();
    expect(iface['provideSynchronous']).toBeDefined();

    o = function(dispatchEvent, arg) {
      constructspy(arg);
    };
    iface.provideSynchronous(o);
    // setup.
    port.onMessage('default', {
      channel: 'message'
    });
    expect(constructspy).not.toHaveBeenCalled();

    port.onMessage('default', {to: 'testInst', type:'message', message:{
      'type': 'construct',
      'text': [{'test':'hi'}],
      'binary': []
    }});

    expect(constructspy).toHaveBeenCalledWith({'test':'hi'});
  });

  it("allows promises to be used.", function(done) {
    var iface = port.getInterface();
    var o = function() {};
    var called = false, resp;
    o.prototype.m1 = function(str) {
      called = true;
      return Promise.resolve('resolved ' + str);
    };

    iface.providePromises(o);
    port.onMessage('default', {
      channel: 'message'
    });

    port.onMessage('default', {to: 'testInst', type:'message', message:{
      'type': 'construct',
    }});

    port.onMessage('default', {to: 'testInst', type:'message', message: {
      'action': 'method',
      'type': 'm1',
      'text': ['mystr'],
      'reqId': 1
    }});

    expect(called).toEqual(true);

    port.on('message', function(n) {
      expect(n.message.text).toEqual('resolved mystr');
      done();
    });
  });

  it("Allows closing", function() {
    var iface = port.getProxyInterface();
    var maker = iface();
    maker.provideSynchronous(o);

    var spy = jasmine.createSpy('cb');
    iface.onClose(spy);

    port.close();
    expect(spy).toHaveBeenCalled();
  });
});

},{"../../src/provider":68,"es6-promise":1}],51:[function(require,module,exports){
var ApiInterface = require('../../src/proxy/apiInterface');
var Consumer = require('../../src/consumer');

describe("proxy/APIInterface", function() {
  var emit, reg, api;
  beforeEach(function() {
        var iface = {
      'test': {'type': 'method', 'value': ['string'], 'ret': 'string'},
      'ev': {'type': 'event', 'value': 'string'},
      'co': {'type': 'constant', 'value': '12'}
    };
    emit = jasmine.createSpy('emit');
    var onMsg = function(obj, r) {
      reg = r;
    };
    api = new ApiInterface(iface, onMsg, emit);
  });

  it("Creates an object looking like an interface.", function(done) {
    expect(typeof(api.test)).toEqual('function');
    expect(typeof(api.on)).toEqual('function');
    expect(api.co).toEqual('12');

    expect(emit).toHaveBeenCalledWith({
      'type': 'construct',
      'text': [],
      'binary': []
    });
    var promise = api.test('hi');
    expect(emit).toHaveBeenCalledWith({
      action: 'method',
      type: 'test',
      reqId: 0,
      text: ['hi'],
      binary: []
    });

    var spy = jasmine.createSpy('ret');
    promise.then(function(response) {
      spy();
      expect(response).toEqual('boo!');;
      done();
    });
    expect(spy).not.toHaveBeenCalled();

    reg('message', {
      type: 'method',
      reqId: 0,
      text: 'boo!',
      binary: []
    });
  });

  it("Delivers constructor arguments.", function(done) {
    var iface = {
      'constructor': {value: ['string']}
    };
    var onMsg = function(obj, r) {
        reg = r;
      };
    var callback = function(msg) {
      expect(msg).toEqual({
        'type': 'construct',
        'text': ['my param'],
        'binary': []
      });
      done();
    };
    var debug = {};
    var apimaker = ApiInterface.bind({}, iface, onMsg, callback, debug);
    var api = new apimaker('my param');
  });

  it("Doesn't encapuslate constructor args as an array.", function(done) {
    var iface = {
      'constructor': {value: ['object']}
    };
    var onMsg = function(obj, r) {
        reg = r;
      };
    var callback = function(msg) {
      expect(msg).toEqual({
        'type': 'construct',
        'text': [{'test':'hi'}],
        'binary': []
      });
      done();
    };
    var debug = {};
    var apimaker = ApiInterface.bind({}, iface, onMsg, callback, debug);
    var api = new apimaker({'test':'hi'});
  });

  it("Rejects methods on failure.", function(done) {
    var promise = api.test('hi'),
        spy = jasmine.createSpy('fail');
    promise.catch(function (err) {
      expect(err).toEqual('Error Occured');
      done();
    });
    
    reg('message', {
      type: 'method',
      reqId: 0,
      text: 'errval',
      error: 'Error Occured'
    });
  });

  it("delivers events", function() {
    var cb = jasmine.createSpy('cb');
    api.on('ev', cb);
    expect(cb).not.toHaveBeenCalled();

    reg('message', {
      'type': 'event',
      'name': 'ev',
      'text': 'boo!',
      'binary': []
    });
    expect(cb).toHaveBeenCalledWith('boo!');
  });
});

afterEach(function() {
  var frames = document.getElementsByTagName('iframe');
  for (var i = 0; i < frames.length; i++) {
    frames[i].parentNode.removeChild(frames[i]);
  }
});

describe("Consumer.recursiveFreezeObject", function() {
  it("Freezes objects", function () {
    var obj = {
      a: 1,
      b: {
        c: 2
      }
    };
    var frozen = Consumer.recursiveFreezeObject(obj);
    frozen.a = 5;
    frozen.b = 5;
    frozen.c = 5;
    expect(frozen.a).toEqual(1);
    expect(frozen.b.c).toEqual(2);
  });
});

describe("Consumer.conform", function() {
  var debug = {
    error: function() {}
  };

  it("Conforms Simple values to templates", function() {
    var blob = null;
    if (typeof(Blob) === typeof(Function)) {
      blob = new Blob(['hi']);
    } else {
      var build = new WebKitBlobBuilder();
      build.append('hi');
      blob = build.getBlob();
    }
    var template = {
      'p1': 'string',
      'p2': 'number',
      'p3': 'boolean',
      'p4': 'object',
      'p5': 'blob',
      'p6': 'buffer',
      'p8': 'proxy',
      'p9': ['array', 'string'],
      'p10': ['string', 'number'],
      'p11': {'a': 'string', 'b': 'number'}
    };
    var correct = {
      'p1': 'hi',
      'p2': 12,
      'p3': true,
      'p4': {'x': 12, 'y': 43},
      'p5': 0,
      'p6': 1,
      'p8': ['app', 'flow', 'id'],
      'p9': ['string', 'string2', 'string3'],
      'p10': ['test', 12],
      'p11': {'a': 'hi', 'b': 12}
    };
    var conformed = Consumer.conform(template, correct,
                                       [blob, new ArrayBuffer(2)], false);
    correct['p5'] = conformed['p5'];
    correct['p6'] = conformed['p6'];
    expect(conformed).toEqual(correct);

    var incorrect = {
      'p0': 'test',
      'p1': 12,
      'p2': '12',
      'p3': 'hello',
      'p4': [1,2,3],
      'p6': 'str',
      'p8': function() {},
      'p9': [1, {}],
      'p10': [true, false, true],
      'p11': []
    };

    conformed = Consumer.conform(template, incorrect, [0, blob, blob], false);
    expect(conformed).toEqual({
      'p1': '12',
      'p2': 12,
      'p3': false,
      'p4': [1,2,3],
      'p6': conformed.p6,
      'p8': undefined,
      'p9': ['1', '[object Object]'],
      'p10': ['true', 0],
      'p11': {}
    });
  });

  it("conforms simple arguments", function() {
    expect(Consumer.conform("string", "mystring", [], false, debug)).toEqual("mystring");
    expect(Consumer.conform("number", "mystring", [], false, debug)).toEqual(jasmine.any(Number));
    expect(Consumer.conform("boolean", "mystring", [], false, debug)).toEqual(false);
    expect(Consumer.conform("", "mystring", [], false, debug)).toEqual(undefined);
    expect(Consumer.conform(["string", "number"], ["test", 0], [], false, debug))
      .toEqual(["test", 0]);
    expect(Consumer.conform("number", 0, [], false, debug)).toEqual(0);
  });

  it("conforms complex arguments", function() {
    expect(Consumer.conform({"key":"string"}, {"key":"good", "other":"bad"},[], false)).
        toEqual({"key":"good"});
    expect(Consumer.conform(["string"], ["test", 12],[], false)).toEqual(["test"]);
    expect(Consumer.conform(["array", "string"], ["test", 12],[], false)).toEqual(["test", "12"]);
    expect(Consumer.conform("object", {"simple":"string"},[], false)).toEqual({"simple": "string"});
    //expect(fdom.proxy.conform.bind({}, "object", function() {},[], false)).toThrow();
    expect(Consumer.conform("object", function() {},[], false)).not.toBeDefined();
  });

  it("conforms nulls", function() {
    expect(Consumer.conform({"key": "string"}, {"key": null}, [], false)).
      toEqual({"key": null});
    expect(Consumer.conform("object", null, [], false)).toEqual(null);
    expect(Consumer.conform({"key": "string"}, {"key": undefined}, [], false)).
      toEqual({});
    expect(Consumer.conform(["string", "string", "string", "string"], 
                              [null, undefined, null, 0], [], false)).
      toEqual([null, undefined, null, "0"]);
    expect(Consumer.conform("object", undefined, [], false)).toEqual(undefined);
  });

  it("conforms binary arguments", function() {
    // TODO: test Blob support (API is nonstandard between Node and Browsers)
    /*
     * var blob = new Blob(["test"]);
     * expect(conform("blob", blob)).toEqual(blob);
     * expect(conform("blob", "string")).toEqual(jasmine.any(Blob));
     */

    var buffer = new ArrayBuffer(4);
    var externals = [];
    expect(Consumer.conform("buffer", buffer, externals, true, debug)).toEqual(0);
    expect(externals.length).toEqual(1);
    expect(Consumer.conform("buffer", 0, ["string"], false, debug)).toEqual(jasmine.any(ArrayBuffer));
    expect(Consumer.conform("buffer", 0, externals, false, debug)).toEqual(buffer);
  });
});

},{"../../src/consumer":57,"../../src/proxy/apiInterface":69}],52:[function(require,module,exports){
var Debug = require('../../src/debug');
var Resource = require('../../src/resource');

describe("Resource", function() {
  var resources, debug;

  beforeEach(function() {
    debug = new Debug();
    resources = new Resource(debug);
  });

  it("should resolve URLs", function(done) {
    var promise = resources.get("http://localhost/folder/manifest.json",
                                 "file.js");
    var callback = function(response) {
      expect(response).toEqual('http://localhost/folder/file.js');
      done();
    };
    promise.then(callback);
  });

  it("should cache resolved URLs", function(done) {
    spyOn(resources, 'resolve').and.callThrough();
    var promise = resources.get("http://localhost/folder/manifest.json",
                                 "file.js");
    var callback = function() {
      promise = resources.get("http://localhost/folder/manifest.json",
                              "file.js");
      promise.then(function() {
        expect(resources.resolve.calls.count()).toEqual(1);
        done();
      });
    };
    promise.then(callback);
  });

  it("should fetch URLs", function(done) {
    var promise;
    promise = resources.getContents('manifest://{"name":"test"}');
    promise.then(function(response) {
      expect(JSON.parse(response).name).toEqual("test");
      done();
    });
  });
  
  it("should warn on degenerate URLs", function(done) {
    var promise = resources.getContents();
    var spy = jasmine.createSpy('r');
    promise.then(function() {}, function() {
      resources.resolve('test').then(function(){}, function() {
        done();
      });
    });
  });

  it("should handle custom resolvers", function(done) {
    var resolver = function(manifest, url, resolve) {
      if (manifest.indexOf('test') === 0) {
        resolve('resolved://' + url);
        return true;
      } else {
        return false;
      }
    };
    resources.addResolver(resolver);

    resources.get('test://manifest', 'myurl').then(function(url) {
      expect(url).toEqual('resolved://myurl');
      resources.get('otherprot://manifest', 'myurl').then(function(url2) {
        expect(url2).toEqual(undefined);
      });
      setTimeout(done,0);
    });
  });

  it("should handle custom retrievers", function(done) {
    var retriever = function(url, resolve) {
      expect(url).toContain("test://");
      resolve('Custom content!');
    };
    resources.addRetriever('test', retriever);

    resources.getContents('test://url').then(function(data) {
      expect(data).toEqual('Custom content!');
      resources.getContents('unknown://url').then(function(){}, function(){
        done();
      });
    });
  });

  it("should not allow replacing retrievers", function() {
    var retriever = function(url, deferred) {
      expect(url).toContain("test://");
      deferred.resolve('Custom content!');
    };
    spyOn(debug, 'warn');
    resources.addRetriever('http', retriever);
    expect(debug.warn).toHaveBeenCalled();
  });
});

describe('resources.httpResolver', function() {
  var r, f, spy, resources;

  beforeEach(function() {
    resources = new Resource();
    r = spy = jasmine.createSpy('resolvedURL');
    f = jasmine.createSpy('rejectURL');
  });

  it("should resolve relative URLs", function() {
    resources.httpResolver('http://www.example.com/path/manifest.json', 'test.html', r, f);
    expect(spy).toHaveBeenCalledWith('http://www.example.com/path/test.html');
  });

  it("should resolve path absolute URLs", function() {
    resources.httpResolver('http://www.example.com/path/manifest.json', '/test.html', r, f);
    expect(spy).toHaveBeenCalledWith('http://www.example.com/test.html');
  });

  it("should resolve absolute URLs", function() {
    resources.httpResolver('http://www.example.com/path/manifest.json', 'http://www.other.com/test.html', r, f);
    expect(spy).toHaveBeenCalledWith('http://www.other.com/test.html');
  });

  it("should not resolve URLs without manifest", function() {
    resources.httpResolver(undefined, 'test.html', r, f);
    expect(f).toHaveBeenCalled();
  });

  it("should remove relative paths", function() {
    var result = Resource.removeRelativePath('http:////www.example.com/./../test1/test2/../test3/')
    expect(result).toEqual('http://www.example.com/test1/test3/');
  });

  it("should resolve paths with relative paths", function() {
    resources.httpResolver('http://www.example.com/path/manifest.json', '../../test.html', r, f);
    expect(spy).toHaveBeenCalledWith('http://www.example.com/test.html');
  });

  it("should remove buggy cca URLs", function() {
    resources.httpResolver('chrome-extension:////extensionid/manifest.json', 'resource.js', r, f);
    expect(spy).toHaveBeenCalledWith('chrome-extension://extensionid/resource.js');
  });
});

},{"../../src/debug":58,"../../src/resource":72}],53:[function(require,module,exports){
var util = require('../../src/util');

describe("util", function() {
  it("iterates over an array", function() {
    var array = [1, 4, 9, 16];
    var sum = 0;
    var ids = [];
    util.eachReverse(array, function(el, idx) {
      sum += el;
      ids.push(idx);
    });

    expect(sum).toEqual(30);
    expect(ids).toEqual([3, 2, 1, 0]);

    util.eachReverse(false, function() {
      sum = 100;
    });
    expect(sum).toEqual(30);
  });

  it("stops iterating if needed", function() {
    var array = [1, 4, 9, 16];
    var sum = 0;
    util.eachReverse(array, function(el) {
      sum += el;
      return el % 2 != 0;
    });
    expect(sum).toEqual(25);
  });

  it("locates properties", function() {
    var obj = {};
    Object.defineProperty(obj, "testProp", {});

    expect(util.hasProp(obj, "testProp")).toBeTruthy();
  });

  it("iterates properties", function() {
    var obj = {
      a: 1,
      b: 2,
      c: 4
    };
    var sum = 0;
    var props = [];
    util.eachProp(obj, function(val, name) {
      sum += val;
      props.push(name);
    });

    expect(sum).toEqual(7);
    expect(props).toContain('a');
    expect(props).toContain('c');

    sum = 0;
    util.eachProp(obj, function(val, name) {
      sum += val;
      return name === 'b'
    });
    expect(sum).toEqual(3);
  });

  describe("mixin", function() {
    var base, other;

    beforeEach(function() {
      base = {value: 1};
      other = {value: 2, other:2};
    });

    it("mixes Objects together", function() {
      util.mixin(base, other);
      expect(base.value).toEqual(1);
      expect(base.other).toEqual(2);
    });

    it("forcably mixes Objects together", function() {
      util.mixin(base, other, true);
      expect(base.value).toEqual(2);
      expect(base.other).toEqual(2);
    });

    it("recursively mixes Objects together", function() {
      base.obj = {val: 1, mine: 3};
      other.obj = {val: 2};
      util.mixin(base, other, true);
      expect(base.obj.val).toEqual(2);
      expect(base.obj.mine).toBeUndefined();
    });

    it("handles degenerate mixins", function() {
      var result = util.mixin(base, null, true);
      expect(result).toEqual({value: 1});
    });
  });

  describe("getId", function() {
    it("creates unique IDs", function() {
      var id1 = util.getId();
      var id2 = util.getId();
      expect(id1).not.toEqual(id2);
    });
  });

  describe("handleEvents", function() {
    var object, cb;

    beforeEach(function() {
      object = {};
      cb = jasmine.createSpy('cb');
      util.handleEvents(object);
    });

    it("can execute events", function() {
      object.on('msg', cb);
      object.emit('msg', 'value');
      object.emit('msg', 'value2');
      expect(cb).toHaveBeenCalledWith('value2');
      expect(cb.calls.count()).toEqual(2);
    });

    it("can execute events 'Once'", function() {
      object.once('msg', cb);
      object.emit('msg', 'value');
      object.emit('msg', 'value2');
      expect(cb).toHaveBeenCalledWith('value');
      expect(cb.calls.count()).toEqual(1);
    });

    it("can execute events conditionally", function() {
      object.once(function(type, val) {
        return val == 'yes';
      }, cb);
      object.emit('msg', 'value');
      object.emit('msg', 'yes');
      object.emit('othermsg', 'yes');
      expect(cb).toHaveBeenCalledWith('yes');
      expect(cb.calls.count()).toEqual(1);
    });
    
    it("can requeue conditioanl events", function() {
      var f = function(m) {
        m == 'ok' ? cb() : object.once('msg', f);
      };
      object.once('msg', f);
      object.emit('msg', 'bad');
      expect(cb).not.toHaveBeenCalled();
      object.emit('msg', 'ok');
      expect(cb).toHaveBeenCalled();
    });

    it("can unregister events", function() {
      object.on('msg', cb);
      object.off('msg', cb);
      object.emit('msg', 'value');
      expect(cb).not.toHaveBeenCalled();
    });

    it("Can cleanup all events", function() {
      object.on('msg', cb);
      object.on('other', cb);
      object.off();
      object.emit('msg', 'value');
      expect(cb).not.toHaveBeenCalled();
    });

    it("can unregister conditional events", function() {
      var func = function(type, val) {
        return val == 'yes';
      };
      object.once(func, cb);
      object.off(func);
      object.emit('msg', 'yes');
      expect(cb).not.toHaveBeenCalled();
    })
  });
});

},{"../../src/util":73}],54:[function(require,module,exports){
(function (global){
var Api = require('../src/api');
var ApiInterface = require('../src/proxy/apiInterface');
var Bundle = require('../src/bundle');
var Consumer = require('../src/consumer');
var Debug = require('../src/debug');
var Provider = require('../src/provider');
var Resource = require('../src/resource');
var util = require('../src/util');
var Frame = require('../src/link/frame');
var PromiseCompat = require('es6-promise').Promise;

exports.createTestPort = function(id) {
  var port = {
    id: id,
    messages: [],
    gotMessageCalls: [],
    checkGotMessage: function() {
      var len = this.gotMessageCalls.length;
      for (var i=0; i<len; i++) {
        var call = this.gotMessageCalls.shift();
        var result = this.gotMessage(call.from, call.match);
        if (result !== false) {
          call.callback(result);
        } else {
          this.gotMessageCalls.push(call);
        }
      }
    },
    onMessage: function(from, msg) {
      this.messages.push([from, msg]);
      this.emit('onMessage', msg);
      this.checkGotMessage();
    },
    gotMessage: function(from, match) {
      var okay;
      for (var i = 0; i < this.messages.length; i++) {
        if (this.messages[i][0] === from) {
          okay = true;
          for (var j in match) {
            if (this.messages[i][1][j] !== match[j]) {
              okay = false;
            }
          }
          if (okay) {
            return this.messages[i][1];
          }
        }
      }
      return false;
    },
    gotMessageAsync: function(from, match, callback) {
      this.gotMessageCalls.push({
        from: from,
        match: match,
        callback: callback
      });
      this.checkGotMessage();
    }
    
  };

  util.handleEvents(port);

  return port;
};

exports.createMockPolicy = function() {
  return {
    api: new Api(),
    debug: new Debug()
  };
};

exports.mockIface = function(props, consts) {
  var iface = {};
  props.forEach(function(p) {
    if (p[1] && p[1].then) {
      iface[p[0]] = function(r) {
        return r;
      }.bind({}, p[1]);
    } else {
      iface[p[0]] = function(r) {
        return PromiseCompat.resolve(r);
      }.bind({}, p[1]);
    }
    spyOn(iface, p[0]).and.callThrough();
  });
  if (consts) {
    consts.forEach(function(c) {
      iface[c[0]] = c[1];
    });
  }
  return function() {
    return iface;
  };
};

exports.getApis = function() {
  var api = new Api();
  Bundle.register([], api);
  return api;
};

// Setup resource loading for the test environment, which uses file:// urls.
var specBase = null, extraResolve = function() {};
(function findDefaultBase() {
  if (typeof location === 'undefined') {
    return;
  }
  var loc = location.protocol + "//" + location.host + location.pathname;
  var dirname = loc.substr(0, loc.lastIndexOf('/'));
  specBase = dirname;
})();

/**
 * Define where the relative resolver used by generic integration tests
 * should map to, and provide a hook to register additional, implementation
 * specific resolvers.
 */
exports.setSpecBase = function(base, resolvers) {
  specBase = base;
  if (resolvers) {
    extraResolve = resolvers;
  }
}

exports.getResolvers = function() {
  var resolvers = [];
  resolvers.push({'resolver': function(manifest, url, resolve, reject) {
    if (url.indexOf('relative://') === 0) {
      resolve(specBase + '/' + url.substr(11));
      return true;
    }
    reject();
  }});
  resolvers.push({'resolver': function(manifest, url, resolve, reject) {
    if (manifest && manifest.indexOf('file://') === 0) {
      manifest = 'http' + manifest.substr(4);
      rsrc.resolve(manifest, url).then(function(addr) {
        addr = 'file' + addr.substr(4);
        resolve(addr);
      });
      return true;
    }
    reject();
  }});
  var rsrc = new Resource();
  resolvers.push({'proto':'file', 'retriever': rsrc.xhrRetriever});
  resolvers.push({'proto':'null', 'retriever': rsrc.xhrRetriever});
  extraResolve(resolvers);
  return resolvers;
}

exports.setupResolvers = function() { 
  var rsrc = new Resource();
  rsrc.register(exports.getResolvers());
  return rsrc;
}

var activeContexts = [];
exports.cleanupIframes = function() {
  activeContexts.forEach(function(f) {
    f.close();
  });
  activeContexts = [];
  if (typeof document === 'undefined') {
    return;
  }
  var frames = document.getElementsByTagName('iframe');
  // frames is a live HTMLCollection, so it is modified each time an
  // element is removed.
  while (frames.length > 0) {
    frames[0].parentNode.removeChild(frames[0]);
  }
}

var coreProviders;
exports.setCoreProviders = function(providers) {
  coreProviders = providers;
};
var testPort = Frame;
var testSource = "spec/helper/frame.js";
var testDebug = 'debug';
exports.setModuleStrategy = function(port, source, debug) {
  testPort = port;
  testSource = source;
  testDebug = debug;
};

exports.setupModule = function(manifest_url, options) {
  var myGlobal = global, dir = '';
  if (typeof document !== 'undefined') {
    myGlobal = {
      document: document
    };
  }
  if (!options) {
    options = {};
  }

  if (typeof window !== 'undefined') {  
    var path = window.location.href,
        dir_idx = path.lastIndexOf('/');
    dir = path.substr(0, dir_idx) + '/';
  }
  var freedom = require('../src/entry')({
      'global': myGlobal,
      'isModule': false,
      'providers': coreProviders,
      'resolvers': exports.getResolvers(),
      'portType': testPort,
      'source': dir + testSource,
      'inject': [
        dir + "node_modules/es5-shim/es5-shim.js",
        dir + "node_modules/es6-promise/dist/promise-1.0.0.js"
      ]
    }, manifest_url, options);
  freedom.then(function(c) {
    activeContexts.push(c);
  });
  return freedom;
}

exports.directProviderFor = function (mod, api) {
  var debug = new Debug();
  var provider = new Provider(api, debug);
  provider.getProxyInterface()().provideAsynchronous(mod);
  var iface = ApiInterface.bind(ApiInterface, api);
  var consumer = new Consumer(iface, debug);

  // Create a link between them.
  provider.on('default', consumer.onMessage.bind(consumer, 'default'));
  consumer.on('default', provider.onMessage.bind(provider, 'default'));
  provider.onMessage('control', {channel: 'default', reverse: 'default', name: 'default'});

  return consumer.getProxyInterface();
};

exports.providerFor = function(module, api) {
  var manifest = {
    name: 'providers',
    app: {script: 'relative://spec/helper/providers.js'},
    dependencies: {undertest: {url: 'relative://' + module, api: api}}
  };
  var freedom = exports.setupModule('manifest://' + JSON.stringify(manifest));
  return freedom.then(function(chan) {
    activeContexts.push(chan);
    var inst = chan();
    var provider = new ProviderHelper(inst);
    provider.create = function(name) {
      inst.emit("create", {name: name, provider: 'undertest'});
    };
    return provider;
  });
}

function ProviderHelper(inFreedom) {
  this.callId = 0;
  this.callbacks = {};
  this.errcallbacks = {};
  this.unboundChanCallbacks = [];
  this.chanCallbacks = {};
  this.freedom = inFreedom;
  this._eventListeners = {};
  this.freedom.on("eventFired", this._on.bind(this));
  this.freedom.on("return", this.ret.bind(this));
  this.freedom.on("error", this.err.bind(this));
  this.freedom.on("initChannel", this.onInitChannel.bind(this));
  this.freedom.on("inFromChannel", this.onInFromChannel.bind(this));
}

ProviderHelper.prototype.createProvider = function(name, provider,
                                                   constructorArguments) {
  this.freedom.emit('create', {
    name: name,
    provider: provider,
    constructorArguments: constructorArguments
  });
};

ProviderHelper.prototype.create = ProviderHelper.prototype.createProvider;

ProviderHelper.prototype.call = function(provider, method, args, cb, errcb) {
  this.callId += 1;
  this.callbacks[this.callId] = cb;
  this.errcallbacks[this.callId] = errcb;
  this.freedom.emit('call', {
    id: this.callId,
    provider: provider,
    method: method,
    args: args
  });
  return this.callId;
};

ProviderHelper.prototype.ret = function(obj) {
  if (this.callbacks[obj.id]) {
    this.callbacks[obj.id](obj.data);
    delete this.callbacks[obj.id];
  }
};

ProviderHelper.prototype.err = function(obj) {
  if (this.errcallbacks[obj.id]) {
    this.errcallbacks[obj.id](obj.data);
    delete this.errcallbacks[obj.id];
  }
}

ProviderHelper.prototype._on = function(eventInfo) {
  var provider = eventInfo.provider;
  var event = eventInfo.event;
  var eventPayload = eventInfo.eventPayload;
  var listeners = this._eventListeners[provider][event];
  if (listeners) {
    listeners.forEach(function (listener) {
      listener(eventPayload);
    });
  }
};

ProviderHelper.prototype.on = function(provider, event, listener) {
  if (typeof this._eventListeners[provider] === 'undefined') {
    this._eventListeners[provider] = {};
  }
  if (typeof this._eventListeners[provider][event] === 'undefined') {
    this._eventListeners[provider][event] = [];
  }
  this._eventListeners[provider][event].push(listener);
  this.freedom.emit("listenForEvent", {provider: provider,
                                 event: event});
};

/**
 * Remove all listeners registered through "on" for an event. If an event is not
 * specified, then all listeners for the provider are removed.
 */
ProviderHelper.prototype.removeListeners = function(provider, event) {
  if (typeof this._eventListeners[provider] !== 'undefined') {
    if (event) {
      this._eventListeners[provider][event] = [];
    } else {
      this._eventListeners[provider] = {};
    }
  }
};



ProviderHelper.prototype.createChannel = function(cb) {
  this.unboundChanCallbacks.push(cb);
  this.freedom.emit('createChannel');
};

ProviderHelper.prototype.onInitChannel = function(chanId) {
  var cb = this.unboundChanCallbacks.pop(); 
  cb(chanId);
};

ProviderHelper.prototype.setChannelCallback = function(chanId, cb) {
  this.chanCallbacks[chanId] = cb;
};
ProviderHelper.prototype.sendToChannel = function(chanId, msg) {
  this.freedom.emit("outToChannel", {
    chanId: chanId,
    message: msg
  });
};
ProviderHelper.prototype.onInFromChannel = function(data) {
  this.chanCallbacks[data.chanId](data.message);
};

exports.ProviderHelper = ProviderHelper;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../src/api":55,"../src/bundle":56,"../src/consumer":57,"../src/debug":58,"../src/entry":59,"../src/link/frame":63,"../src/provider":68,"../src/proxy/apiInterface":69,"../src/resource":72,"../src/util":73,"es6-promise":1}],55:[function(require,module,exports){
/*jslint indent:2,white:true,node:true,sloppy:true */
var PromiseCompat = require('es6-promise').Promise;

/**
 * The API registry for freedom.js.  Used to look up requested APIs,
 * and provides a bridge for core APIs to act like normal APIs.
 * @Class API
 * @param {Debug} debug The debugger to use for logging.
 * @constructor
 */
var Api = function(debug) {
  this.debug = debug;
  this.apis = {};
  this.providers = {};
  this.waiters = {};
};

/**
 * Get an API.
 * @method get
 * @param {String} api The API name to get.
 * @returns {{name:String, definition:API}} The API if registered.
 */
Api.prototype.get = function(api) {
  if (!this.apis[api]) {
    return false;
  }
  return {
    name: api,
    definition: this.apis[api]
  };
};

/**
 * Set an API to a definition.
 * @method set
 * @param {String} name The API name.
 * @param {API} definition The JSON object defining the API.
 */
Api.prototype.set = function(name, definition) {
  this.apis[name] = definition;
};

/**
 * Register a core API provider.
 * @method register
 * @param {String} name the API name.
 * @param {Function} constructor the function to create a provider for the API.
 * @param {String?} style The style the provider is written in. Valid styles
 *   are documented in fdom.port.Provider.prototype.getInterface. Defaults to
 *   provideAsynchronous
 */
Api.prototype.register = function(name, constructor, style) {
  var i;

  this.providers[name] = {
    constructor: constructor,
    style: style || 'provideAsynchronous'
  };

  if (this.waiters[name]) {
    for (i = 0; i < this.waiters[name].length; i += 1) {
      this.waiters[name][i].resolve(constructor.bind({},
          this.waiters[name][i].from));
    }
    delete this.waiters[name];
  }
};

/**
 * Get a core API connected to a given FreeDOM module.
 * @method getCore
 * @param {String} name the API to retrieve.
 * @param {port.App} from The instantiating App.
 * @returns {Promise} A promise of a fdom.App look-alike matching
 * a local API definition.
 */
Api.prototype.getCore = function(name, from) {
  return new PromiseCompat(function(resolve, reject) {
    if (this.apis[name]) {
      if (this.providers[name]) {
        resolve(this.providers[name].constructor.bind({}, from));
      } else {
        if (!this.waiters[name]) {
          this.waiters[name] = [];
        }
        this.waiters[name].push({
          resolve: resolve,
          reject: reject,
          from: from
        });
      }
    } else {
      this.debug.warn('Api.getCore asked for unknown core: ' + name);
      reject(null);
    }
  }.bind(this));
};

/**
 * Get the style in which a core API is written.
 * This method is guaranteed to know the style of a provider returned from
 * a previous getCore call, and so does not use promises.
 * @method getInterfaceStyle
 * @param {String} name The name of the provider.
 * @returns {String} The coding style, as used by
 *   fdom.port.Provider.prototype.getInterface.
 */
Api.prototype.getInterfaceStyle = function(name) {
  if (this.providers[name]) {
    return this.providers[name].style;
  } else {
    this.debug.warn('Api.getInterfaceStyle for unknown provider: ' + name);
    return undefined;
  }
};

/**
 * Defines the apis module and provider registry.
 */
module.exports = Api;

},{"es6-promise":1}],56:[function(require,module,exports){
/*jslint indent:2,node:true */
var includeFolder = undefined;
var minify = require('node-json-minify');

var util = require('./util');

var Bundle = function () {
  'use strict';
  var found;
  this.interfaces = [];
  /*jslint nomen: true */
  try {
    found = (function(){var self={},fs = require('fs');
self.console = "{\n  \"name\": \"console\",\n  \"api\": {\n    // Log(source, message)\n    \"log\": {\"type\": \"method\", \"value\": [\"string\", \"string\"]},\n    \"debug\": {\"type\": \"method\", \"value\": [\"string\", \"string\"]},\n    \"info\": {\"type\": \"method\", \"value\": [\"string\", \"string\"]},\n    \"warn\": {\"type\": \"method\", \"value\": [\"string\", \"string\"]},\n    \"error\": {\"type\": \"method\", \"value\": [\"string\", \"string\"]}\n  }\n}\n";
self.coreConsole = "{\n  \"name\": \"core.console\",\n  \"api\": {\n    // Log(source, message)\n    \"log\": {\"type\": \"method\", \"value\": [\"string\", \"string\"]},\n    \"debug\": {\"type\": \"method\", \"value\": [\"string\", \"string\"]},\n    \"info\": {\"type\": \"method\", \"value\": [\"string\", \"string\"]},\n    \"warn\": {\"type\": \"method\", \"value\": [\"string\", \"string\"]},\n    \"error\": {\"type\": \"method\", \"value\": [\"string\", \"string\"]}\n  }\n}\n";
self.coreEcho = "{\n  \"name\": \"core.echo\",\n  \"api\": {\n    \"setup\": {\"type\": \"method\", \"value\": [\"string\"]},\n    \"send\": {\"type\": \"method\", \"value\": [\"string\"]},\n    \"message\": {\"type\": \"event\", \"value\": \"string\"}\n  }\n}";
self.core = "{\n  \"name\": \"core\",\n  \"api\": {\n    \"createChannel\": {\"type\": \"method\", \"value\": [], \"ret\": {\n      \"channel\": \"proxy\",\n      \"identifier\": \"string\"\n    }},\n    \"bindChannel\": {\"type\": \"method\", \"value\": [\"string\"], \"ret\": \"proxy\"},\n    \"getId\": {\"type\": \"method\", \"value\": [], \"ret\": [\"array\", \"string\"]},\n    \"getLogger\": {\"type\": \"method\", \"value\": [\"string\"], \"ret\": \"proxy\"}\n  }\n}\n";
self.coreOauth = "{\n  \"name\": \"core.oauth\",\n  \"api\": {\n    /**\n     * Indicate the intention to initiate an oAuth flow, allowing an appropriate\n     * oAuth provider to begin monitoring for redirection.\n     * This will generate a token, which must be passed to the single subsequent call\n     * to launchAuthFlow. \n     * \n     * \n     * @method initiateOAuth\n     * @param {String[]} Valid oAuth redirect URIs for your application\n     * @return {{redirect: String, state: String}} A chosen redirect URI and\n     *   state which will be monitored for oAuth redirection if available\n     **/\n    \"initiateOAuth\": {\n      \"type\": \"method\",\n      \"value\": [[\"array\", \"string\"]],\n      \"ret\": {\n        \"redirect\": \"string\",\n        \"state\": \"string\"\n      },\n      \"err\": {\n        \"errcode\": \"string\",\n        \"message\": \"string\"\n      }\n    },\n  \n    /**\n     * oAuth client-side flow - launch the provided URL\n     * This must be called after initiateOAuth with the returned state object\n     *\n     * @method launchAuthFlow\n     * @param {String} The URL that initiates the auth flow.\n     * @param {Object.<string, string>} The return value from initiateOAuth\n     * @return {String} responseUrl - containing the access token\n     */\n    \"launchAuthFlow\": {\n      \"type\": \"method\",\n      \"value\": [\"string\", {\n        \"redirect\": \"string\",\n        \"state\": \"string\"\n      }],\n      \"ret\": \"string\",\n      \"err\": {\n        \"errcode\": \"string\",\n        \"message\": \"string\"\n      }\n    }\n  }\n}\n";
self.corePeerconnection = "{\n  \"name\": \"core.peerconnection\",\n  \"api\": {\n    // Setup the link to the peer and options for this peer connection.\n    \"setup\": {\n      \"type\": \"method\",\n      \"value\": [\n        // The freedom.js channel identifier used to setup a signalling chanel.\n        \"string\",\n        // The peerName, used debugging and console messages.\n        \"string\",\n        // The list of STUN servers to use.\n        // The format of a single entry is stun:HOST:PORT, where HOST\n        // and PORT are a stun server hostname and port, respectively.\n        [\"array\", \"string\"],\n        // Whether to immediately initiate a connection before fulfilling return\n        // promise.\n        \"boolean\"\n      ]\n    },\n  \n    // Send a message to the peer.\n    \"send\": {\"type\": \"method\", \"value\": [{\n      // Data channel id. If provided, will be used as the channel label.\n      // The behavior is undefined if the channel label doesn't exist.\n      \"channelLabel\": \"string\",\n      // One of the bellow should be defined; this is the data to send.\n      \"text\": \"string\",\n      \"binary\": \"blob\",\n      \"buffer\": \"buffer\"\n    }]},\n  \n    // Called when we get a message from the peer.\n    \"onReceived\": {\"type\": \"event\", \"value\": {\n      // The label/id of the data channel.\n      \"channelLabel\": \"string\",\n      // One the below will be specified.\n      \"text\": \"string\",\n      \"binary\": \"blob\",\n      \"buffer\": \"buffer\"\n    }},\n  \n    // Open the data channel with this label.\n    \"openDataChannel\": {\"type\": \"method\", \"value\": [\"string\"]},\n    // Close the data channel with this label.\n    \"closeDataChannel\": {\"type\": \"method\", \"value\": [\"string\"]},\n  \n    // A channel with this id has been opened.\n    \"onOpenDataChannel\": {\"type\": \"event\", \"value\": {\"channelId\": \"string\"}},\n    // The channale with this id has been closed.\n    \"onCloseDataChannel\": {\"type\": \"event\", \"value\": {\"channelId\": \"string\"}},\n  \n    // Returns the number of bytes that have queued using \"send\", but not\n    // yet sent out. Currently just exposes:\n    // http://www.w3.org/TR/webrtc/#widl-RTCDataChannel-bufferedAmount\n    \"getBufferedAmount\": {\"type\": \"method\",\n                          \"value\": [\"string\"],\n                          \"ret\": \"number\"},\n  \n    // Returns local SDP headers from createOffer.\n    \"getInfo\": {\"type\": \"method\", \"value\": [], \"ret\": \"string\"},\n  \n    \"createOffer\": {\n      \"type\": \"method\",\n      \"value\": [{\n        // Optional :RTCOfferOptions object.\n        \"offerToReceiveVideo\": \"number\",\n        \"offerToReceiveAudio\": \"number\",\n        \"voiceActivityDetection\": \"boolean\",\n        \"iceRestart\": \"boolean\"\n      }],\n      \"ret\": {\n        // Fulfills with a :RTCSessionDescription\n        \"type\": \"string\",  // Should always be \"offer\".\n        \"sdp\": \"string\"\n      }\n    },\n  \n    // Close the peer connection.\n    \"close\": {\"type\": \"method\", \"value\": []},\n    // The peer connection has been closed.\n    \"onClose\": {\"type\": \"event\", \"value\": {}}\n  }\n}\n";
self.coreRtcdatachannel = "{\n  \"name\": \"core.rtcdatachannel\",\n  // API follows http://w3c.github.io/webrtc-pc/\n  \"api\": {\n\n    \"constructor\": {\n      // Numeric ID retreaved from core.rtcpeerconnection.createDataChannel\n      // or from an ondatachannel event.\n      \"value\": [\"string\"]\n    },\n\n    \"getLabel\": {\"type\": \"method\", \"value\": [], \"ret\": \"string\"},\n    \"getOrdered\": {\"type\": \"method\", \"value\": [], \"ret\": \"boolean\"},\n    \"getMaxPacketLifeTime\": {\"type\": \"method\", \"value\": [], \"ret\": \"number\"},\n    \"getMaxRetransmits\": {\"type\": \"method\", \"value\": [], \"ret\": \"number\"},\n    \"getProtocol\": {\"type\": \"method\", \"value\": [], \"ret\": \"string\"},\n    \"getNegotiated\": {\"type\": \"method\", \"value\": [], \"ret\": \"boolean\"},\n    \"getId\": {\"type\": \"method\", \"value\": [], \"ret\": \"number\"},\n    \"getReadyState\": {\"type\": \"method\", \"value\": [], \"ret\": \"string\"},\n    \"getBufferedAmount\": {\"type\": \"method\", \"value\": [], \"ret\": \"number\"},\n\n    \"onopen\": {\"type\": \"event\", \"value\": []},\n    \"onerror\": {\"type\": \"event\", \"value\": []},\n    \"onclose\": {\"type\": \"event\", \"value\": []},\n    \"close\": {\"type\": \"method\", \"value\": []},\n    \"onmessage\": {\"type\": \"event\", \"value\": {\n      \"text\": \"string\",\n      \"binary\": \"buffer\"\n    }},\n    \"getBinaryType\": {\"type\": \"method\", \"value\": [], \"ret\": \"string\"},\n    \"setBinaryType\": {\"type\": \"method\", \"value\": [\"string\"]},\n    \"send\": {\"type\": \"method\", \"value\": [\"string\"]},\n    // Note: renamed from 'send' to handle the overloaded type.\n    \"sendBuffer\": {\"type\": \"method\", \"value\": [\"buffer\"]}\n  }\n}\n";
self.coreRtcpeerconnection = "{\n  \"name\": \"core.rtcpeerconnection\",\n  // API follows http://w3c.github.io/webrtc-pc/\n  \"api\": {\n    // Arguments: iceServers, iceTransports, peerIdentity\n    // Deviation from spec: iceServers, and iceServers.urls when specified must\n    // be an array, even if only 1 is specified.\n    \"constructor\": {\n      \"value\": [{\n        \"iceServers\": [\"array\", {\n          \"urls\": [\"array\", \"string\"],\n          \"username\": \"string\",\n          \"credential\": \"string\"\n        }],\n        \"iceTransports\": \"string\",\n        \"peerIdentity\": \"string\"\n      }]\n    },\n\n    // Per http://w3c.github.io/webrtc-pc/#idl-def-RTCOfferOptions\n    \"createOffer\": {\"type\": \"method\", \"value\": [{\n      \"offerToReceiveAudio\": \"number\",\n      \"offerToReceiveVideo\": \"number\",\n      \"iceRestart\": \"boolean\",\n      \"voiceActivityDetection\": \"boolean\"\n    }], \"ret\": {\n      \"type\": \"string\",\n      \"sdp\": \"string\"\n    }},\n    \"createAnswer\": {\"type\": \"method\", \"value\": [], \"ret\": {\n      \"type\": \"string\",\n      \"sdp\": \"string\"\n    }},\n\n    // Per http://w3c.github.io/webrtc-pc/#idl-def-RTCSessionDescription\n    \"setLocalDescription\": {\"type\": \"method\", \"value\": [{\n      \"type\": \"string\",\n      \"sdp\": \"string\"\n    }]},\n    \"getLocalDescription\": {\"type\": \"method\", \"value\": [], \"ret\": {\n      \"type\": \"string\",\n      \"sdp\": \"string\"\n    }},\n    \"setRemoteDescription\": {\"type\": \"method\", \"value\": [{\n      \"type\": \"string\",\n      \"sdp\": \"string\"\n    }], \"ret\": {}},\n    \"getRemoteDescription\": {\"type\": \"method\", \"value\": [], \"ret\": {\n      \"type\": \"string\",\n      \"sdp\": \"string\"\n    }},\n\n    // Per http://w3c.github.io/webrtc-pc/#idl-def-RTCSignalingState\n    \"getSignalingState\": {\"type\": \"method\", \"value\": [], \"ret\": \"string\"},\n\n    // Per http://w3c.github.io/webrtc-pc/#idl-def-RTCConfiguration\n    \"updateIce\": {\"type\": \"method\", \"value\": [{\n        \"iceServers\": [\"array\", {\n          \"urls\": [\"array\", \"string\"],\n          \"username\": \"string\",\n          \"credential\": \"string\"\n        }],\n        \"iceTransports\": \"string\",\n        \"peerIdentity\": \"string\"\n      }], \"ret\": {}},\n\n    // Per http://w3c.github.io/webrtc-pc/#idl-def-RTCIceCandidate\n    \"addIceCandidate\": {\"type\": \"method\", \"value\": [{\n      \"candidate\": \"string\",\n      \"sdpMid\": \"string\",\n      \"sdpMLineIndex\": \"number\"\n    }], \"ret\": {}},\n\n    \"getIceGatheringState\": {\"type\": \"method\", \"value\": [], \"ret\": \"string\"},\n    \"getIceConnectionState\": {\"type\": \"method\", \"value\": [], \"ret\": \"string\"},\n\n    \"getConfiguration\": {\"type\": \"method\", \"value\": [], \"ret\": {\n      \"iceServers\": [\"array\", {\n        \"urls\": [\"array\", \"string\"],\n        \"username\": \"string\",\n        \"credential\": \"string\"\n      }],\n      \"iceTransports\": \"string\",\n      \"peerIdentity\": \"string\"\n    }},\n\n    // Numbers for stream API are IDs with which to make core.mediastream.\n    \"getLocalStreams\": {\"type\": \"method\", \"value\": [], \"ret\": [\"array\", \"string\"]},\n    \"getRemoteStreams\": {\"type\": \"method\", \"value\": [], \"ret\": [\"array\", \"string\"]},\n    \"getStreamById\": {\"type\": \"method\", \"value\": [\"string\"], \"ret\": \"string\"},\n    \"addStream\": {\"type\": \"method\", \"value\": [\"string\"], \"ret\": {}},\n    \"removeStream\": {\"type\": \"method\", \"value\": [\"string\"], \"ret\": {}},\n\n    \"close\": {\"type\": \"method\", \"value\": [], \"ret\": {}},\n\n    // Per http://w3c.github.io/webrtc-pc/#idl-def-RTCDataChannelInit\n    // Note: Numbers are IDs used to create core.datachannel objects.\n    \"createDataChannel\": {\"type\": \"method\", \"value\": [\"string\", {\n      \"ordered\": \"boolean\",\n      \"maxPacketLifeTime\": \"number\",\n      \"maxRetransmits\": \"number\",\n      \"protocol\": \"string\",\n      \"negotiated\": \"boolean\",\n      \"id\": \"number\"\n    }], \"ret\": \"string\"},\n    //Note: only reports channels opened by the remote peer.\n    \"ondatachannel\": {\"type\": \"event\", \"value\": {\n      \"channel\": \"string\"\n    }},\n\n    //TODO: Support DTMF Extension.\n    //\"createDTMFSender\": {},\n\n    //per http://w3c.github.io/webrtc-pc/#idl-def-RTCStatsCallback\n    //Number if sepecified represents a core.mediastreamtrack.\n    //Returned object is a serialization of the RTCStatsReport.\n    \"getStats\": {\"type\": \"method\", \"value\": [\"string\"], \"ret\":\"object\"},\n\n    //TODO: Support Identity Extension.\n    /*\n    \"setIdentityProvider\": {},\n    \"getIdentityAssertion\": {},\n    \"getPeerIdentity\": {},\n    \"onidentityresult\": {\"type\": \"event\", \"value\": []},\n    \"onpeeridentity\":{\"type\": \"event\", \"value\": []},\n    \"onidpassertionerror\":{\"type\": \"event\", \"value\": []},\n    \"onidpvalidationerror\":{\"type\": \"event\", \"value\": []},\n    */\n\n    \"onnegotiationneeded\": {\"type\": \"event\", \"value\": []},\n    \"onicecandidate\": {\"type\": \"event\", \"value\": {\n      \"candidate\": {\n        \"candidate\": \"string\",\n        \"sdpMid\": \"string\",\n        \"sdpMLineIndex\": \"number\"\n      }\n    }},\n    \"onsignalingstatechange\": {\"type\": \"event\", \"value\": []},\n    \"onaddstream\": {\"type\": \"event\", \"value\": {\n      \"stream\": \"number\"\n    }},\n    \"onremovestream\": {\"type\": \"event\", \"value\": {\n      \"stream\": \"number\"\n    }},\n    \"oniceconnectionstatechange\": {\"type\": \"event\", \"value\": []}\n  }\n}\n";
self.coreStorage = "{\n  \"name\": \"core.storage\",\n  \"api\": {\n    \"keys\": {\"type\": \"method\", \"value\": [], \"ret\": [\"array\", \"string\"]},\n    \"get\": {\"type\": \"method\", \"value\": [\"string\"], \"ret\": \"string\"},\n    \"set\": {\"type\": \"method\", \"value\": [\"string\", \"string\"], \"ret\": \"string\"},\n    \"remove\": {\"type\": \"method\", \"value\": [\"string\"], \"ret\": \"string\"},\n    \"clear\": {\"type\": \"method\", \"value\": []}\n  }\n}";
self.coreTcpsocket = "{\n  \"name\": \"core.tcpsocket\",\n  \"api\": {\n    // Sockets may be constructed bound to a pre-existing id, as in the case of\n    // interacting with a socket accpeted by a server.  If no Id is specified, a\n    // new socket will be created, which can be either connect'ed or listen'ed.\n    \"constructor\": {\n      \"value\": [\"number\"]\n    },\n  \n    // Get info about a socket.  Tells you whether the socket is active and\n    // available host information.\n    \"getInfo\": {\n      \"type\": \"method\",\n      \"value\": [],\n      \"ret\": {\n        \"connected\": \"boolean\",\n        \"localAddress\": \"string\",\n        \"localPort\": \"number\",\n        \"peerAddress\": \"string\",\n        \"peerPort\": \"number\"\n      }\n    },\n  \n    /** \n     * error codes and default messages that may be returned on failures.\n     */\n    \"ERRCODE\": {\"type\": \"constant\", \"value\": {\n      /** GENERAL **/\n      \"SUCCESS\": \"Success!\",\n      // Unknown\n      \"UNKNOWN\": \"Unknown error\",\n      \n      // Socket is already connected\n      \"ALREADY_CONNECTED\": \"Socket already connected\",\n      // Invalid Argument, client error\n      \"INVALID_ARGUMENT\": \"Invalid argument\",\n      // Connection timed out.\n      \"TIMED_OUT\": \"Timed out\",\n      // Operation cannot complete because socket is not connected.\n      \"NOT_CONNECTED\": \"Socket not connected\",\n      // Socket reset because of change in network state.\n      \"NETWORK_CHANGED\": \"Network changed\",\n      // Connection closed\n      \"CONNECTION_CLOSED\": \"Connection closed gracefully\",\n      // Connection Reset\n      \"CONNECTION_RESET\": \"Connection reset\",\n      // Connection Refused\n      \"CONNECTION_REFUSED\": \"Connection refused\",\n      // Generic Failure\n      \"CONNECTION_FAILED\": \"Connection failed\"\n    }},\n    \n    // Close a socket. Will Fail if the socket is not connected or already\n    // closed.\n    \"close\": {\n      \"type\": \"method\",\n      \"value\": [],\n      \"err\": {\n        \"errcode\": \"string\",\n        \"message\": \"string\"\n      }\n    },\n  \n    // Receive notification that the socket has disconnected.\n    \"onDisconnect\": {\"type\": \"event\", \"value\": {\n      \"errcode\": \"string\",\n      \"message\": \"string\"\n    }},\n  \n    // Connect to a host and port.\n    // Fails with an error if connection fails.\n    \"connect\": {\n      \"type\": \"method\",\n      \"value\": [\"string\", \"number\"],\n      \"err\": {\n        \"errcode\": \"string\",\n        \"message\": \"string\"\n      }\n    },\n  \n    // Upgrades a socket to TLS, expected to be invoked after connect.\n    \"secure\": {\n      \"type\": \"method\",\n      \"value\": [],\n      \"err\": {\n        \"errcode\": \"string\",\n        \"message\": \"string\"\n      }\n    },\n  \n    // Prepares a socket for becoming secure after the next read event.\n    // See details at\n    // https://github.com/freedomjs/freedom/wiki/prepareSecure-API-Usage\n    // This should be called one read prior to calling .secure, e.g. in XMPP\n    // this should be called before sending \"starttls\", then after a \"proceed\"\n    // message is read .secure should be called.\n    \"prepareSecure\": {\n      \"type\": \"method\",\n      \"value\": [],\n      \"err\": {\n        \"errcode\": \"string\",\n        \"message\": \"string\"\n      }\n    },\n  \n    // Write buffer data to a socket.\n    // Fails with an error if write fails.\n    \"write\": {\n      \"type\": \"method\",\n      \"value\": [\"buffer\"],\n      \"err\": {\n        \"errcode\": \"string\",\n        \"message\": \"string\"\n      }\n    },\n  \n    // Receive data on a connected socket.\n    \"onData\": {\n      \"type\": \"event\",\n      \"value\": {\"data\": \"buffer\"}\n    },\n  \n    // Listen as a server at a specified host and port.\n    // After calling listen the client should listen for 'onConnection' events.\n    // Fails with an error if errors occur while binding or listening.\n    \"listen\": {\n      \"type\": \"method\",\n      \"value\": [\"string\", \"number\"],\n      \"err\": {\n        \"errcode\": \"string\",\n        \"message\": \"string\"\n      }\n    },\n  \n    // Receive a connection.\n    // The socket parameter may be used to construct a new socket.\n    // Host and port information provide information about the remote peer.\n    \"onConnection\": {\"type\": \"event\", \"value\": {\n      \"socket\": \"number\",\n      \"host\": \"string\",\n      \"port\": \"number\"\n    }}\n  }\n}\n";
self.coreUdpsocket = "// A UDP socket.\n// Generally, to use you just need to call bind() at which point onData\n// events will start to flow. Note that bind() should only be called\n// once per instance.\n{\n  \"name\": \"core.udpsocket\",\n  \"api\": {\n    /** \n     * error codes and default messages that may be returned on failures.\n     */\n    \"ERRCODE\": {\"type\": \"constant\", \"value\": {\n      /** GENERAL **/\n      \"SUCCESS\": \"Success!\",\n      // Unknown\n      \"UNKNOWN\": \"Unknown error\",\n      \n      // Socket is already bound\n      \"ALREADY_BOUND\": \"Socket already bound\",\n      // Invalid Argument, client error\n      \"INVALID_ARGUMENT\": \"Invalid argument\",\n      // Socket reset because of change in network state.\n      \"NETWORK_CHANGED\": \"Network changed\",\n      // Failure to send data\n      \"SNED_FAILED\": \"Send failed\"\n    }},\n  \n    // Creates a socket, binds it to an interface and port and listens for\n    // messages, dispatching each message as on onData event.\n    // Returns on success, or fails with an error on failure.\n    \"bind\": {\n      \"type\": \"method\",\n      \"value\": [\n        // Interface (address) on which to bind.\n        \"string\",\n        // Port on which to bind.\n        \"number\"\n      ],\n      \"ret\": [],\n      \"err\": {\n        \"errcode\": \"string\",\n        \"message\": \"string\"\n      }\n    },\n  \n    // Retrieves the state of the socket.\n    // Returns an object with the following properties:\n    //  - localAddress: the socket's local address, if bound\n    //  - localPort: the socket's local port, if bound\n    \"getInfo\": {\"type\": \"method\", \"value\": [], \"ret\": {\n      \"localAddress\": \"string\",\n      \"localPort\": \"number\"\n    }},\n  \n    // Sends data to a server.\n    // The socket must be bound.\n    // Returns an integer indicating the number of bytes written, with no\n    // guarantee that the remote side received the data.\n    \"sendTo\": {\n      \"type\": \"method\",\n      \"value\": [\n        // Data to send.\n        \"buffer\",\n        // Destination address.\n        \"string\",\n        // Destination port.\n        \"number\"\n      ],\n      \"ret\": \"number\",\n      \"err\": {\n        \"errcode\": \"string\",\n        \"message\": \"string\"\n      }\n    },\n  \n    // Releases all resources associated with this socket.\n    // No-op if the socket is not bound.\n    \"destroy\": {\"type\": \"method\", \"value\": []},\n  \n    // Called once for each message received on this socket, once it's\n    // been successfully bound.\n    \"onData\": {\n      \"type\": \"event\",\n      \"value\": {\n        // Zero means success, any other \"value\" is implementation-dependent.\n        \"resultCode\": \"number\",\n        // Address from which data was received.\n        \"address\": \"string\",\n        // Port from which data was received.\n        \"port\": \"number\",\n        // Data received.\n        \"data\": \"buffer\"\n      }\n    }\n  }\n}\n";
self.coreView = "{\n  \"name\": \"core.view\",\n  \"api\": {\n    \"show\": {\"type\": \"method\", \"value\": [\"string\"]},\n    \"isSecure\": {\"type\": \"method\", \"value\": [], \"ret\": \"boolean\" },\n    \"close\": {\"type\": \"method\", \"value\": []},\n    \"postMessage\": {\"type\": \"method\", \"value\": [\"object\"]},\n  \n    \"message\": {\"type\": \"event\", \"value\": \"object\"},\n    \"onClose\": {\"type\": \"event\", \"value\": []}\n  }\n}\n";
self.coreWebsocket = "{\n  \"name\": \"core.websocket\",\n  \"api\": {\n    // Constructs new websocket. Errors in construction are passed on\n    // through the onError event.\n    \"constructor\": {\"value\": [\n      // URL to connect through\n      \"string\",\n      // Protocols\n      [\"array\", \"string\"]\n    ]},\n    // Send the data to the other side of this connection. Only one of\n    // the entries in the dictionary that is passed will be sent.\n    \"send\": {\n      \"type\": \"method\",\n      \"value\": [{\n        \"text\": \"string\",\n        \"binary\": \"blob\",\n        \"buffer\": \"buffer\"\n      }],\n      \"err\": {\n        \"errcode\": \"string\",\n        \"message\": \"string\"\n      }\n    },\n    \"getReadyState\": {\n      \"type\": \"method\",\n      \"value\": [],\n      // 0 -> CONNECTING\n      // 1 -> OPEN\n      // 2 -> CLOSING\n      // 3 -> CLOSED\n      \"ret\": \"number\"\n    },\n    \"getBufferedAmount\": {\"type\": \"method\",\n                          \"value\": [\"string\"],\n                          \"ret\": \"number\"},\n    \"close\": {\n      \"type\": \"method\",\n      // The first argument is a status code from\n      // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent\n      \"value\": [\"number\", \"string\"],\n      \"err\": {\n        \"errcode\": \"string\",\n        \"message\": \"string\"\n      }\n    },\n    \"onMessage\": {\n      \"type\": \"event\",\n      // The data will be stored in one of the keys,\n      // corresponding with the \"type\" received\n      \"value\": {\n        \"text\": \"string\",\n        \"binary\": \"blob\",\n        \"buffer\": \"buffer\"\n      }\n    },\n    \"onOpen\": {\n      \"type\": \"event\",\n      \"value\": []\n    },\n    \"onError\": {\n      \"type\": \"event\",\n      \"value\": {\n        \"errcode\": \"string\",\n        \"message\": \"string\"\n      }\n    },\n    \"onClose\": {\n      \"type\": \"event\",\n      // \"value\"s given by WebSockets spec:\n      // http://www.w3.org/TR/websockets/#closeevent\n      \"value\": {\n        \"code\": \"number\",\n        \"reason\": \"string\",\n        \"wasClean\": \"boolean\"\n      }\n    }\n  }\n}\n";
self.social = "/**\n * SOCIAL API\n *\n * API for connecting to social networks and messaging of users.\n * An instance of a social provider encapsulates a single user logging into\n * a single network.\n *\n * This API distinguishes between a \"user\" and a \"client\". A client is a\n * user's point of access to the social provider. Thus, a user that has\n * multiple connections to a provider (e.g., on multiple devices or in multiple\n * browsers) has multiple clients.\n *\n * The semantics of some properties are defined by the specific provider, e.g.:\n * - Edges in the social network (who is on your roster)\n * - Reliable message passing (or unreliable)\n * - In-order message delivery (or out of order)\n * - Persistent clientId - Whether your clientId changes between logins when\n *    connecting from the same device\n *\n * A <client_state>, used in this API, is defined as:\n * - Information related to a specific client of a user\n * - Use cases: \n *   - Returned on changes for friends or my instance in 'onClientState'\n *   - Returned in a global list from 'getClients'\n * {\n *   // Mandatory\n *   'userId': 'string',      // Unique ID of user (e.g. alice@gmail.com)\n *   'clientId': 'string',    // Unique ID of client\n *                            // (e.g. alice@gmail.com/Android-23nadsv32f)\n *   'status': 'string',      // Status of the client. 'STATUS' member.\n *   'lastUpdated': 'number', // Timestamp of the last time client_state was updated\n *   'lastSeen': 'number'     // Timestamp of the last seen time of this device.\n *                            // Note: 'lastSeen' DOES NOT trigger an 'onClientState' event\n * }\n * \n * A <user_profile>, used in this API, is defined as:\n * - Information related to a specific user (profile information)\n * - Use cases:\n *   - Returned on changes for friends or myself in 'onUserProfile'\n *   - Returned in a global list from 'getUsers'\n * {\n *   // Mandatory\n *   \"userId\": \"string\",    // Unique ID of user (e.g. alice@gmail.com)\n *   \"lastUpdated\": \"number\"  // Timestamp of last change to the profile\n *   // Optional\n *   \"name\": \"string\",      // Name (e.g. Alice)\n *   \"url\": \"string\",       // Homepage URL\n *   \"imageData\": \"string\", // URI of a profile image.\n * }\n **/\n{\n  \"name\": \"social\",\n  \"api\": {\n    /** \n     * error codes and default messages that may be returned on failures.\n     */\n    \"ERRCODE\": {\"type\": \"constant\", \"value\": {\n      /** GENERAL **/\n      \"SUCCESS\": \"Success!\",\n      // Unknown\n      \"UNKNOWN\": \"Unknown error\",\n      // User is currently offline\n      \"OFFLINE\": \"User is currently offline\",\n      // Improper parameters\n      \"MALFORMEDPARAMETERS\": \"Parameters are malformed\",\n  \n      /** LOGIN **/\n      // Error authenticating to the server (e.g. invalid credentials)\n      \"LOGIN_BADCREDENTIALS\": \"Error authenticating with server\",\n      // Error with connecting to the server\n      \"LOGIN_FAILEDCONNECTION\": \"Error connecting to server\",\n      // User is already logged in\n      \"LOGIN_ALREADYONLINE\": \"User is already logged in\",\n      // OAuth Error\n      \"LOGIN_OAUTHERROR\": \"OAuth Error\",\n  \n      /** SENDMESSAGE **/\n      // Message sent to invalid destination (e.g. not in user's roster)\n      \"SEND_INVALIDDESTINATION\": \"Message sent to an invalid destination\"\n    }},\n    \n    /**\n     * List of possible statuses for <client_state>.status\n     **/\n    \"STATUS\": {\"type\": \"constant\", \"value\": {\n      // Not logged in\n      \"OFFLINE\": \"OFFLINE\",\n      // This client runs the same freedom.js app as you and is online\n      \"ONLINE\": \"ONLINE\",\n      // This client is online, but does not run the same app (chat client)\n      // (i.e. can be useful to invite others to your freedom.js app)\n      \"ONLINE_WITH_OTHER_APP\": \"ONLINE_WITH_OTHER_APP\"\n    }},\n  \n    /**\n     * Log into the network (See below for parameters)\n     * e.g. social.login(Object options)\n     *\n     * @method login\n     * @param {Object} loginOptions - See below\n     * @return {Object} <client_state>\n     **/\n    \"login\": {\n      \"type\": \"method\",\n      \"value\": [{\n        // Optional\n        \"agent\": \"string\",         // Name of the application\n        \"version\": \"string\",       // Version of application\n        \"url\": \"string\",           // URL of application\n        \"interactive\": \"boolean\",  // Allow user interaction from provider.\n                                   // If not set, interpreted as true.\n        \"rememberLogin\": \"boolean\" // Cache login credentials. If not set,\n                                   // interpreted as true.\n      }],\n      \"ret\": {                       // <client_state>, defined above.\n        \"userId\": \"string\",\n        \"clientId\": \"string\",\n        \"status\": \"string\",\n        \"lastUpdated\": \"number\",\n        \"lastSeen\": \"number\"\n      },\n      \"err\": {\n        \"errcode\": \"string\",\n        \"message\": \"string\"\n      }\n    },\n  \n    /**\n     * Clears cached credentials of the provider.\n     *\n     * @method clearCachedCredentials\n     * @return nothing\n     **/\n    \"clearCachedCredentials\": {\"type\": \"method\", \"value\": []},\n  \n    /**\n     * Get <client_state>s that have been observed.\n     * The provider implementation may act as a client, in which case its\n     * <client_state> will be in this list.\n     * getClients may not represent an entire roster, since it may not be\n     * enumerable.\n     * \n     * @method getClients\n     * @return {Object} { \n     *    \"clientId1\": <client_state>,\n     *    \"clientId2\": <client_state>,\n     *     ...\n     * } List of <client_state>s indexed by clientId\n     *   On failure, rejects with an error code.\n     **/\n    \"getClients\": {\n      \"type\": \"method\",\n      \"value\": [],\n      \"ret\": \"object\",\n      \"err\": {\n        \"errcode\": \"string\",\n        \"message\": \"string\"\n      }\n    },\n  \n    /**\n     * Get <user_profile>s that have been observed.\n     * The provider implementation may act as a client, in which case its\n     * <user_profile> will be in this list.\n     * getUsers may not represent an entire roster, since it may not be\n     * enumerable.\n     *\n     * @method getUsers\n     * @return {Object} { \n     *    \"userId1\": <user_profile>,\n     *    \"userId2\": <user_profile>,\n     *     ...\n     * } List of <user_profile>s indexed by userId\n     *   On failure, rejects with an error code.\n     **/\n    \"getUsers\": {\n      \"type\": \"method\",\n      \"value\": [],\n      \"ret\": \"object\",\n      \"err\": {\n        \"errcode\": \"string\",\n        \"message\": \"string\"\n      }\n    },\n  \n    /** \n     * Send a message.\n     * Destination may be a userId or a clientId. If it is a userId, all clients\n     * for that user should receive the message.\n     * \n     * @method sendMessage\n     * @param {String} destination_id The userId or clientId to send to\n     * @param {String} message The message to send.\n     * @return nothing\n     *  On failure, rejects with an error code\n     **/\n    \"sendMessage\": {\n      \"type\": \"method\",\n      \"value\": [\"string\", \"string\"],\n      \"err\": {\n        \"errcode\": \"string\",\n        \"message\": \"string\"\n      }\n    },\n  \n    /**\n     * Log out of the network.\n     * \n     * @method logout\n     * @return nothing\n     *  On failure, rejects with an error code\n     **/\n    \"logout\": {\n      \"type\": \"method\",\n      \"value\": [],\n      \"err\": {\n        \"errcode\": \"string\",\n        \"message\": \"string\"\n      }\n    },\n  \n    /**\n     * Receive an incoming message.\n     **/\n    \"onMessage\": {\"type\": \"event\", \"value\": {\n      \"from\": {               // <client_state>, defined above.\n        \"userId\": \"string\",\n        \"clientId\": \"string\",\n        \"status\": \"string\",\n        \"lastUpdated\": \"number\",\n        \"lastSeen\": \"number\"\n      },\n      \"message\": \"string\"     // message contents\n    }},\n  \n    /**\n     * Receive a change to a <user_profile>.\n     **/\n    \"onUserProfile\": {\"type\": \"event\", \"value\": { // <user_profile>, defined above.\n      \"userId\": \"string\",\n      \"lastUpdated\": \"number\",\n      \"name\": \"string\",\n      \"url\": \"string\",\n      \"imageData\": \"string\"\n    }},\n  \n    /**\n     * Receive a change to a <client_state>.\n     **/\n    \"onClientState\": {\"type\": \"event\", \"value\": { // <client_state>, defined above.\n      \"userId\": \"string\",\n      \"clientId\": \"string\",\n      \"status\": \"string\",\n      \"lastUpdated\": \"number\",\n      \"lastSeen\": \"number\"\n    }}\n  }\n}\n";
self.storage = "/**\r\n * STORAGE API\r\n *\r\n * API for Persistent Storage\r\n * Exposes a key-value get/put interface\r\n **/\r\n{\r\n  \"name\": \"storage\",\r\n  \"api\": {\r\n    /** \r\n     * List of scopes that can preferred when accessing storage.\r\n    **/\r\n    \"scope\": {\"type\": \"constant\", \"value\": {\r\n      // Storage should only last while the app is active.\r\n      \"SESSION\": 0,\r\n      // Storage should be limited to host the app is bound to.\r\n      \"DEVICE_LOCAL\": 1,\r\n      // Storage should be synchronized between user devices.\r\n      \"USER_LOCAL\": 2,\r\n      // Storage should be synchronized across users.\r\n      \"SHARED\": 3\r\n    }},\r\n  \r\n    /** \r\n     * error codes and default messages that may be returned on failures.\r\n     */\r\n    \"ERRCODE\": {\"type\": \"constant\", \"value\": {\r\n      /** GENERAL **/\r\n      \"SUCCESS\": \"Success!\",\r\n      // Unknown\r\n      \"UNKNOWN\": \"Unknown error\",\r\n      // Database not ready\r\n      \"OFFLINE\": \"Database not reachable\",\r\n      // Improper parameters\r\n      \"MALFORMEDPARAMETERS\": \"Parameters are malformed\"\r\n    }},\r\n  \r\n    /**\r\n     * Create a storage provider.\r\n     * @param {Object} options\r\n     *    scope {storage.scope} The preferred storage scope.\r\n     * @constructor\r\n     */\r\n    \"constructor\": { \"value\": [{\r\n      \"scope\": \"number\"\r\n    }]},\r\n  \r\n    /**\r\n     * Fetch an array of all keys\r\n     * e.g. storage.keys() => [string]\r\n     *\r\n     * @method keys\r\n     * @return an array with all keys in the store \r\n     **/\r\n    \"keys\": {\r\n      \"type\": \"method\",\r\n      \"value\": [],\r\n      \"ret\": [\"array\", \"string\"],\r\n      \"err\": {\r\n        \"errcode\": \"string\",\r\n        \"message\": \"string\"\r\n      }\r\n    },\r\n  \r\n    /**\r\n     * Fetch a value for a key\r\n     * e.g. storage.get(String key) => string\r\n     *\r\n     * @method get\r\n     * @param {String} key - key to fetch\r\n     * @return {String} Returns a string with the value, null if doesn't exist\r\n     **/\r\n    \"get\": {\r\n      \"type\": \"method\",\r\n      \"value\": [\"string\"],\r\n      \"ret\": \"string\",\r\n      \"err\": {\r\n        \"errcode\": \"string\",\r\n        \"message\": \"string\"\r\n      }\r\n    },\r\n  \r\n    /**\r\n     * Sets a value to a key\r\n     * e.g. storage.set(String key, String value)\r\n     *\r\n     * @method set\r\n     * @param {String} key - key of value to set\r\n     * @param {String} value - value\r\n     * @return {String} previous value of key if there was one.\r\n     **/\r\n    \"set\": {\r\n      \"type\": \"method\",\r\n      \"value\": [\"string\", \"string\"],\r\n      \"ret\": \"string\",\r\n      \"err\": {\r\n        \"errcode\": \"string\",\r\n        \"message\": \"string\"\r\n      }\r\n    },\r\n    \r\n    /**\r\n     * Removes a single key\r\n     * e.g. storage.remove(String key)\r\n     *\r\n     * @method remove\r\n     * @param {String} key - key to remove\r\n     * @return {String} previous value of key if there was one.\r\n     **/\r\n    \"remove\": {\r\n      \"type\": \"method\",\r\n      \"value\": [\"string\"],\r\n      \"ret\": \"string\",\r\n      \"err\": {\r\n        \"errcode\": \"string\",\r\n        \"message\": \"string\"\r\n      }\r\n    },\r\n    \r\n    /**\r\n     * Removes all data from storage\r\n     * e.g. storage.clear()\r\n     *\r\n     * @method clear\r\n     * @return nothing\r\n     **/\r\n    \"clear\": {\r\n      \"type\": \"method\",\r\n      \"value\": [],\r\n      \"ret\": [],\r\n      \"err\": {\r\n        \"errcode\": \"string\",\r\n        \"message\": \"string\"\r\n      }\r\n    }\r\n  }\r\n}\r\n";
self.storebuffer = "\r\n/**\r\n * STORAGE API\r\n *\r\n * API for Persistent Storage\r\n * Exposes a key-value get/put interface\r\n **/\r\n{\r\n  \"name\": \"storebuffer\",\r\n  \"api\": {\r\n    /** \r\n     * List of scopes that can preferred when accessing storage.\r\n    **/\r\n    \"scope\": {\"type\": \"constant\", \"value\": {\r\n      // Storage should only last while the app is active.\r\n      \"SESSION\": 0,\r\n      // Storage should be limited to host the app is bound to.\r\n      \"DEVICE_LOCAL\": 1,\r\n      // Storage should be synchronized between user devices.\r\n      \"USER_LOCAL\": 2,\r\n      // Storage should be synchronized across users.\r\n      \"SHARED\": 3\r\n    }},\r\n  \r\n    /** \r\n     * error codes and default messages that may be returned on failures.\r\n     */\r\n    \"ERRCODE\": {\"type\": \"constant\", \"value\": {\r\n      /** GENERAL **/\r\n      \"SUCCESS\": \"Success!\",\r\n      // Unknown\r\n      \"UNKNOWN\": \"Unknown error\",\r\n      // Database not ready\r\n      \"OFFLINE\": \"Database not reachable\",\r\n      // Improper parameters\r\n      \"MALFORMEDPARAMETERS\": \"Parameters are malformed\"\r\n    }},\r\n  \r\n    /**\r\n     * Create a storage provider.\r\n     * @param {Object} options\r\n     *    scope {storage.scope} The preferred storage scope.\r\n     * @constructor\r\n     */\r\n    \"constructor\": { \"value\": [{\r\n      \"scope\": \"number\"\r\n    }]},\r\n  \r\n    /**\r\n     * Fetch an array of all keys\r\n     * e.g. storage.keys() => [string]\r\n     *\r\n     * @method keys\r\n     * @return an array with all keys in the store \r\n     **/\r\n    \"keys\": {\r\n      \"type\": \"method\",\r\n      \"value\": [],\r\n      \"ret\": [\"array\", \"string\"],\r\n      \"err\": {\r\n        \"errcode\": \"string\",\r\n        \"message\": \"string\"\r\n      }\r\n    },\r\n  \r\n    /**\r\n     * Fetch a value for a key\r\n     * e.g. storage.get(String key) => string\r\n     *\r\n     * @method get\r\n     * @param {String} key - key to fetch\r\n     * @return {ArrayBuffer} Returns value, null if doesn't exist\r\n     **/\r\n    \"get\": {\r\n      \"type\": \"method\",\r\n      \"value\": [\"string\"],\r\n      \"ret\": \"buffer\",\r\n      \"err\": {\r\n        \"errcode\": \"string\",\r\n        \"message\": \"string\"\r\n      }\r\n    },\r\n  \r\n    /**\r\n     * Sets a value to a key\r\n     * e.g. storage.set(String key, String value)\r\n     *\r\n     * @method set\r\n     * @param {String} key - key of value to set\r\n     * @param {ArrayBuffer} value - value\r\n     * @return {String} previous value of key if there was one.\r\n     **/\r\n    \"set\": {\r\n      \"type\": \"method\",\r\n      \"value\": [\"string\", \"buffer\"],\r\n      \"ret\": \"buffer\",\r\n      \"err\": {\r\n        \"errcode\": \"string\",\r\n        \"message\": \"string\"\r\n      }\r\n    },\r\n    \r\n    /**\r\n     * Removes a single key\r\n     * e.g. storage.remove(String key)\r\n     *\r\n     * @method remove\r\n     * @param {String} key - key to remove\r\n     * @return {String} previous value of key if there was one.\r\n     **/\r\n    \"remove\": {\r\n      \"type\": \"method\",\r\n      \"value\": [\"string\"],\r\n      \"ret\": \"buffer\",\r\n      \"err\": {\r\n        \"errcode\": \"string\",\r\n        \"message\": \"string\"\r\n      }\r\n    },\r\n    \r\n    /**\r\n     * Removes all data from storage\r\n     * e.g. storage.clear()\r\n     *\r\n     * @method clear\r\n     * @return nothing\r\n     **/\r\n    \"clear\": {\r\n      \"type\": \"method\",\r\n      \"value\": [],\r\n      \"ret\": [],\r\n      \"err\": {\r\n        \"errcode\": \"string\",\r\n        \"message\": \"string\"\r\n      }\r\n    }\r\n  }\r\n}\r\n";
self.transport = "/**\n * TRANSPORT API\n *\n * API for peer-to-peer communication\n * Useful for sending large binary data between instances\n **/\n{\n  \"name\": \"transport\",\n  \"api\": {\n    /** \n     * error codes and default messages that may be returned on failures.\n     */\n    \"ERRCODE\": {\"type\": \"constant\", \"value\": {\n      /** GENERAL **/\n      \"SUCCESS\": \"Success!\",\n      // Unknown\n      \"UNKNOWN\": \"Unknown error\",\n      // Database not ready\n      \"OFFLINE\": \"Not reachable\",\n      // Improper parameters\n      \"MALFORMEDPARAMETERS\": \"Parameters are malformed\"\n    }},\n  \n    /**\n     * Prepare a P2P connection with initialization parameters\n     * Takes in a signalling pathway (freedom.js channel), which is used\n     * by the transport provider to send/receive signalling messages\n     * to the other side of the P2P connection for setup.\n     *\n     * @method setup\n     * @param {String} name - give this connection a name for logging\n     * @param {Proxy} channel - signalling channel\n     * @return nothing.\n     **/\n    \"setup\": {\n      \"type\": \"method\",\n      \"value\": [\"string\", \"proxy\"],\n      \"ret\": [],\n      \"err\": {\n        \"errcode\": \"string\",\n        \"message\": \"string\"\n      }\n    },\n  \n    /**\n     * Send binary data to the peer\n     * All data is labelled with a string tag\n     * Any data sent with the same tag is sent in order,\n     * but there is no guarantees between tags\n     *\n     * @method send\n     * @param {string} tag\n     * @param {buffer} data\n     * @return nothing\n     **/\n    \"send\": {\n      \"type\": \"method\",\n      \"value\": [\"string\", \"buffer\"],\n      \"ret\": [],\n      \"err\": {\n        \"errcode\": \"string\",\n        \"message\": \"string\"\n      }\n    },\n  \n    /**\n     * Close the connection. Any data queued for sending, or in the\n     * process of sending, may be dropped. If the state of the promse of\n     * the send method is \"pending\" then the data for that send call may\n     * be sending or queued.\n     * \n     * @method close\n     * @return nothing\n     **/\n    \"close\": {\n      \"type\": \"method\",\n      \"value\": [],\n      \"ret\": [],\n      \"err\": {\n        \"errcode\": \"string\",\n        \"message\": \"string\"\n      }\n    },\n  \n    /**\n     * Event on incoming data (ArrayBuffer)\n     **/\n    \"onData\": {\n      \"type\": \"event\",\n      \"value\": {\n        \"tag\": \"string\",\n        \"data\": \"buffer\"\n      }\n    },\n  \n    /**\n     * Event on successful closing of the connection\n     **/\n    \"onClose\": {\n      \"type\": \"event\",\n      \"value\": []\n    }\n  }\n}\n";
return self})();
  } catch (e) {
    // pass.
  }
  /*jslint nomen: false */
  util.eachProp(found, function (json) {
    this.interfaces.push(JSON.parse(minify(json)));
  }.bind(this));
};


/**
 * Populate an API registry with provided providers, and with known API
 * definitions.
 * @static
 * @method register
 * @param {{name: string, provider: Function, style?: string}[]} providers
 *   The core providers made available to this freedom.js instance.
 * @param {Api} registry The API registry to populate.
 */
exports.register = function (providers, registry) {
  'use strict';
  var bundle = new Bundle();
  bundle.interfaces.forEach(function (api) {
    if (api && api.name && api.api) {
      registry.set(api.name, api.api);
    }
  });

  providers.forEach(function (provider) {
    if (provider.name) {
      registry.register(provider.name, provider.provider, provider.style);
    }
  });
};

},{"./util":73,"fs":11,"node-json-minify":13}],57:[function(require,module,exports){
/*globals Blob, ArrayBuffer, DataView */
/*jslint indent:2, node:true, sloppy:true */
var util = require('./util');

/**
 * A freedom port for a user-accessable api.
 * @class Consumer
 * @implements Port
 * @uses handleEvents
 * @param {Object} interfaceCls The api interface exposed by this consumer.
 * @param {Debug} debug The debugger to use for logging.
 * @constructor
 */
var Consumer = function (interfaceCls, debug) {
  this.id = Consumer.nextId();
  this.interfaceCls = interfaceCls;
  this.debug = debug;
  util.handleEvents(this);
  
  this.ifaces = {};
  this.closeHandlers = {};
  this.errorHandlers = {};
  this.emits = {};
};

/**
 * Receive incoming messages for this consumer.
 * @method onMessage
 * @param {String} source The source of the message.
 * @param {Object} message The received message.
 */
Consumer.prototype.onMessage = function (source, message) {
  if (source === 'control' && message.reverse) {
    this.emitChannel = message.channel;
    this.emit(this.emitChannel, {
      type: 'channel announcement',
      channel: message.reverse
    });
    this.emit('start');
  } else if (source === 'control' && message.type === 'setup') {
    this.controlChannel = message.channel;
  } else if (source === 'control' && message.type === 'close') {
    delete this.controlChannel;
    this.doClose();
  } else {
    if (!this.emitChannel && message.channel) {
      this.emitChannel = message.channel;
      this.emit('start');
      return;
    }
    if (message.type === 'close' && message.to) {
      this.teardown(message.to);
      return;
    }
    if (message.type === 'error') {
      this.error(message.to, message.message);
      return;
    }
    if (message.to) {
      if (this.emits[message.to]) {
        this.emits[message.to]('message', message.message);
      } else {
        this.debug.warn('Could not deliver message, no such interface: ' + message.to);
      }
    } else {
      var msg = message.message;
      util.eachProp(this.emits, function (iface) {
        iface('message', message.message);
      });
    }
  }
};

/**
 * Create a consumer.Interface associated with this consumer.
 * An interface is returned, which is supplied with important control of the
 * api via constructor arguments: (bound below in getInterfaceConstructor)
 * 
 * onMsg: function(binder) sets the function to call when messages for this
 *    interface arrive on the channel,
 * emit: function(msg) allows this interface to emit messages,
 * id: string is the Identifier for this interface.
 * @method getInterface
 */
Consumer.prototype.getInterface = function () {
  var Iface = this.getInterfaceConstructor(),
    args = Array.prototype.slice.call(arguments, 0);
  if (args.length) {
    Iface = Iface.bind.apply(Iface, [Iface].concat(args));
  }
  return new Iface();
};

/**
 * Attach an 'onEvent' listener to an interface, allowing external consumers
 * to either listen to channel state, or register callbacks on lifetime events
 * of individual instances of the interface.
 * @method getListener
 * @parma {String} name The event to listen to.
 * @private
 */
Consumer.prototype.getListener = function (name) {
  return function (instance, handler) {
    // Listen to the channel directly.
    if (typeof instance === 'function' && handler === undefined) {
      this.once(name, instance);
      return;
    }

    // Listen to a specific instance.
    var handlers = name + 'Handlers';
    util.eachProp(this.ifaces, function (candidate, id) {
      if (candidate === instance) {
        if (this[handlers][id]) {
          this[handlers][id].push(handler);
        } else {
          this[handlers][id] = [handler];
        }
        return true;
      }
    }.bind(this));
  }.bind(this);
};

/**
 * Create a function that can be used to get interfaces from this api consumer
 * from a user-visible point.
 * @method getProxyInterface
 */
Consumer.prototype.getProxyInterface = function () {
  var func = function (p) {
    var args = Array.prototype.slice.call(arguments, 1);
    if (args.length > 0) {
      return p.getInterface.apply(p, args);
    } else {
      return p.getInterface();
    }
  }.bind({}, this);

  func.close = function (iface) {
    if (iface) {
      util.eachProp(this.ifaces, function (candidate, id) {
        if (candidate === iface) {
          this.teardown(id);
          this.emit(this.emitChannel, {
            type: 'close',
            to: id
          });
          return true;
        }
      }.bind(this));
    } else {
      // Close the channel.
      this.doClose();
    }
  }.bind(this);

  func.onClose = this.getListener('close');
  func.onError = this.getListener('error');

  return func;
};

/**
 * Provides a bound class for creating a consumer.Interface associated
 * with this api. This partial level of construction can be used
 * to allow the consumer to be used as a provider for another API.
 * @method getInterfaceConstructor
 * @private
 */
Consumer.prototype.getInterfaceConstructor = function () {
  var id = Consumer.nextId();
  return this.interfaceCls.bind(
    {},
    function (id, obj, binder) {
      this.ifaces[id] = obj;
      this.emits[id] = binder;
    }.bind(this, id),
    this.doEmit.bind(this, id),
    this.debug
  );
};

/**
 * Emit a message on the channel once setup is complete.
 * @method doEmit
 * @private
 * @param {String} to The ID of the flow sending the message.
 * @param {Object} msg The message to emit
 * @param {Boolean} all Send message to all recipients.
 */
Consumer.prototype.doEmit = function (to, msg, all) {
  if (all) {
    to = false;
  }
  if (this.emitChannel) {
    this.emit(this.emitChannel, {to: to, type: 'message', message: msg});
  } else {
    this.once('start', this.doEmit.bind(this, to, msg));
  }
};

/**
 * Teardown a single interface of this api.
 * @method teardown
 * @param {String} id The id of the interface to tear down.
 */
Consumer.prototype.teardown = function (id) {
  delete this.emits[id];
  if (this.closeHandlers[id]) {
    util.eachProp(this.closeHandlers[id], function (prop) {
      prop();
    });
  }
  delete this.ifaces[id];
  delete this.closeHandlers[id];
  delete this.errorHandlers[id];
};

/**
 * Handle a message error reported to this api.
 * @method error
 * @param {String?} id The id of the interface where the error occured.
 * @param {Object} message The message which failed, if relevant.
 */
Consumer.prototype.error = function (id, message) {
  if (id && this.errorHandlers[id]) {
    util.eachProp(this.errorHandlers[id], function (prop) {
      prop(message);
    });
  } else if (!id) {
    this.emit('error', message);
  }
};


/**
 * Close / teardown the flow this api terminates.
 * @method doClose
 */
Consumer.prototype.doClose = function () {
  if (this.controlChannel) {
    this.emit(this.controlChannel, {
      type: 'Channel Closing',
      request: 'close'
    });
  }

  util.eachProp(this.emits, function (emit, id) {
    this.teardown(id);
  }.bind(this));

  this.emit('close');
  this.off();

  this.emitChannel = null;
};

/**
 * Get the textual description of this port.
 * @method toString
 * @return The description of this port.
 */
Consumer.prototype.toString = function () {
  if (this.emitChannel) {
    return "[Consumer " + this.emitChannel + "]";
  } else {
    return "[unbound Consumer]";
  }
};

/**
 * Get the next ID for an api channel.
 * @method nextId
 * @static
 * @private
 */
Consumer.nextId = function () {
  if (!Consumer.id) {
    Consumer.id = 1;
  }
  return (Consumer.id += 1);
};

/**
 * Convert a structured data structure into a message stream conforming to
 * a template and an array of binary data elements.
 * @static
 * @method messageToPortable
 * @param {Object} template The template to conform to
 * @param {Object} value The instance of the data structure to confrom
 * @param {Debug} debug A debugger for errors.
 * @return {{text: Object, binary: Array}} Separated data streams.
 */
Consumer.messageToPortable = function (template, value, debug) {
  var externals = [],
    message = Consumer.conform(template, value, externals, true, debug);
  return {
    text: message,
    binary: externals
  };
};

/**
 * Convert Structured Data streams into a data structure conforming to a
 * template.
 * @static
 * @method portableToMessage
 * @param {Object} template The template to conform to
 * @param {{text: Object, binary: Array}} streams The streams to conform
 * @param {Debug} debug A debugger for errors.
 * @return {Object} The data structure matching the template.
 */
Consumer.portableToMessage = function (template, streams, debug) {
  return Consumer.conform(template, streams.text, streams.binary, false, debug);
};

/**
 * Force a collection of values to look like the types and length of an API
 * template.
 * @static
 * @method conform
 * @param {Object} template The template to conform to
 * @param {Object} from The value to conform
 * @param {Array} externals Listing of binary elements in the template
 * @param {Boolean} Whether to to separate or combine streams.
 * @aparam {Debug} debug A debugger for errors.
 */
Consumer.conform = function (template, from, externals, separate, debug) {
  /* jshint -W086 */
  if (typeof (from) === 'function') {
    //from = undefined;
    //throw "Trying to conform a function";
    return undefined;
  } else if (typeof (from) === 'undefined') {
    return undefined;
  } else if (from === null) {
    return null;
  } else if (template === undefined) {
    debug.error("Message discarded for not matching declared type!", from);
    return undefined;
  }

  switch (template) {
  case 'string':
    return String('') + from;
  case 'number':
    return Number(1) * from;
  case 'boolean':
    return Boolean(from === true);
  case 'object':
    // TODO(willscott): Allow removal if sandboxing enforces this.
    if (typeof from === 'undefined') {
      return undefined;
    } else {
      return JSON.parse(JSON.stringify(from));
    }
  case 'blob':
    if (separate) {
      if (from instanceof Blob) {
        externals.push(from);
        return externals.length - 1;
      } else {
        debug.error('conform expecting Blob, but saw ' + (typeof from));
        externals.push(new Blob([]));
        return externals.length - 1;
      }
    } else {
      return externals[from];
    }
  case 'buffer':
    if (separate) {
      externals.push(Consumer.makeArrayBuffer(from, debug));
      return externals.length - 1;
    } else {
      return Consumer.makeArrayBuffer(externals[from], debug);
    }
  case 'proxy':
    return from;
  }
  var val, i;
  if (Array.isArray(template) && from !== undefined) {
    val = [];
    i = 0;
    if (template.length === 2 && template[0] === 'array') {
      //console.log("template is array, value is " + JSON.stringify(value));
      for (i = 0; i < from.length; i += 1) {
        val.push(Consumer.conform(template[1], from[i], externals,
                                  separate, debug));
      }
    } else {
      for (i = 0; i < template.length; i += 1) {
        if (from[i] !== undefined) {
          val.push(Consumer.conform(template[i], from[i], externals,
                                    separate, debug));
        } else {
          val.push(undefined);
        }
      }
    }
    return val;
  } else if (typeof template === 'object' && from !== undefined) {
    val = {};
    util.eachProp(template, function (prop, name) {
      if (from[name] !== undefined) {
        val[name] = Consumer.conform(prop, from[name], externals, separate,
                                     debug);
      }
    });
    return val;
  }
  debug.error('Unknown template provided: ' + template);
};

/**
 * Make a thing into an Array Buffer
 * @static
 * @method makeArrayBuffer
 * @param {Object} thing
 * @param {Debug} debug A debugger in case of errors.
 * @return {ArrayBuffer} An Array Buffer
 */
Consumer.makeArrayBuffer = function (thing, debug) {
  if (!thing) {
    return new ArrayBuffer(0);
  }

  if (thing instanceof ArrayBuffer) {
    return thing;
  } else if (thing.constructor.name === "ArrayBuffer" &&
      typeof thing.prototype === "undefined") {
    // Workaround for webkit origin ownership issue.
    // https://github.com/UWNetworksLab/freedom/issues/28
    return new DataView(thing).buffer;
  } else {
    debug.error('expecting ArrayBuffer, but saw ' +
        (typeof thing) + ': ' + JSON.stringify(thing));
    return new ArrayBuffer(0);
  }
};

/**
 * Recursively traverse a [nested] object and freeze its keys from being
 * writable. Note, the result can have new keys added to it, but existing ones
 * cannot be  overwritten. Doesn't do anything for arrays or other collections.
 *
 * @method recursiveFreezeObject
 * @static
 * @param {Object} obj - object to be frozen
 * @return {Object} obj
 **/
Consumer.recursiveFreezeObject = function (obj) {
  var k, ret = {};
  if (typeof obj !== 'object') {
    return obj;
  }
  for (k in obj) {
    if (obj.hasOwnProperty(k)) {
      Object.defineProperty(ret, k, {
        value: Consumer.recursiveFreezeObject(obj[k]),
        writable: false,
        enumerable: true
      });
    }
  }
  return ret;
};

module.exports = Consumer;

},{"./util":73}],58:[function(require,module,exports){
/*jslint indent:2, node:true, sloppy:true */
var util = require('./util');

/**
 * A freedom entry point for debugging.
 * @uses handleEvents
 * @implements Port
 * @constructor
 */
var Debug = function (logger) {
  this.id = 'debug';
  this.emitChannel = false;
  this.config = false;
  util.handleEvents(this);
};

/**
 * Provide a textual description of this port.
 * @method toString
 * @return {String} the textual description.
 */
Debug.prototype.toString = function () {
  return '[Console]';
};

/**
 * Register a logger for outputting debugging messages.
 * @method setLogger
 * @param {Console} logger The logger to register
 */
Debug.prototype.setLogger = function (logger) {
  if (this.logger) {
    this.info('Replacing Logger.');
  }
  this.logger = logger;
  this.emit('logger');
};

/**
 * Handler for receiving messages sent to the debug port.
 * These messages are used to retreive config for exposing console.
 * @method onMessage
 * @param {String} source the source identifier for the message.
 * @param {Object} message the received message.
 */
Debug.prototype.onMessage = function (source, message) {
  if (source === 'control' && message.channel && !this.emitChannel) {
    this.emitChannel = message.channel;
    this.config = message.config;
    if (!this.config.global.console) {
      if (typeof console !== 'undefined') {
        this.config.global.console = console;
      } else {
        this.config.global.console = this.getLogger('Console');
      }
    }
    this.emit('ready');
  }
};

/**
 * Dispatch a debug message with arbitrary severity.
 * All debug messages are routed through the manager, to allow for delegation.
 * @method format
 * @param {String} severity the severity of the message.
 * @param {String} source The location of message.
 * @param {String[]} args The contents of the message.
 * @private
 */
Debug.prototype.format = function (severity, source, args) {
  var i, alist = [], argarr;
  if (typeof args === "string" && source) {
    try {
      argarr = JSON.parse(args);
      if (argarr instanceof Array) {
        args = argarr;
      }
    } catch (e) {
      // pass.
    }
  }

  if (typeof args === "string") {
    alist.push(args);
  } else {
    for (i = 0; i < args.length; i += 1) {
      alist.push(args[i]);
    }
  }
  if (!this.emitChannel) {
    this.on('ready', this.format.bind(this, severity, source, alist));
    return;
  }
  this.emit(this.emitChannel, {
    severity: severity,
    source: source,
    quiet: true,
    request: 'debug',
    msg: JSON.stringify(alist)
  });
};

/**
 * Print received messages on the console.
 * This is called by the manager in response to an emission from format.
 * @method print
 * @param {Object} message The message emitted by {@see format} to print.
 */
Debug.prototype.print = function (message) {
  if (!this.logger) {
    this.once('logger', this.print.bind(this, message));
    return;
  }

  var args, arr = [], i = 0;
  args = JSON.parse(message.msg);
  if (typeof args === "string") {
    arr.push(args);
  } else {
    while (args[i] !== undefined) {
      arr.push(args[i]);
      i += 1;
    }
  }
  this.logger[message.severity].call(this.logger, message.source, arr, function () {});
};

/**
 * Print a log message to the console.
 * @method log
 */
Debug.prototype.log = function () {
  this.format('log', undefined, arguments);
};

/**
 * Print an info message to the console.
 * @method log
 */
Debug.prototype.info = function () {
  this.format('info', undefined, arguments);
};

/**
 * Print a debug message to the console.
 * @method log
 */
Debug.prototype.debug = function () {
  this.format('debug', undefined, arguments);
};

/**
 * Print a warning message to the console.
 * @method warn
 */
Debug.prototype.warn = function () {
  this.format('warn', undefined, arguments);
};

/**
 * Print an error message to the console.
 * @method error
 */
Debug.prototype.error = function () {
  this.format('error', undefined, arguments);
};

/**
 * Get a logger that logs messages prefixed by a given name.
 * @method getLogger
 * @param {String} name The prefix for logged messages.
 * @returns {Console} A console-like object.
 */
Debug.prototype.getLogger = function (name) {
  var log = function (severity, source) {
    var args = Array.prototype.splice.call(arguments, 2);
    this.format(severity, source, args);
  },
    logger = {
      freedom: true,
      debug: log.bind(this, 'debug', name),
      info: log.bind(this, 'info', name),
      log: log.bind(this, 'log', name),
      warn: log.bind(this, 'warn', name),
      error: log.bind(this, 'error', name)
    };
  return logger;
};

module.exports = Debug;

},{"./util":73}],59:[function(require,module,exports){
(function (global){
/*jslint indent:2,node:true */
var PromiseCompat = require('es6-promise').Promise;

var Api = require('./api');
var Debug = require('./debug');
var Hub = require('./hub');
var Manager = require('./manager');
var Policy = require('./policy');
var ProxyBinder = require('./proxybinder');
var Resource = require('./resource');
var util = require('./util');
var Bundle = require('./bundle');

var freedomGlobal;
var getGlobal = function () {
  'use strict';
  
  // Node.js
  if (typeof global !== 'undefined' && global.prototype === undefined) {
    freedomGlobal = global;
  // Browsers
  } else {
    setTimeout(function () {
      freedomGlobal = this;
    }, 0);
  }
};
getGlobal();

/**
 * Create a new freedom context.
 * @param {Object} context Information about the local context.
 * @see {util/workerEntry.js}
 * @param {String} manifest The manifest to load.
 * @param {Object} config Configuration keys set by the user.
 * @returns {Promise} A promise for the module defined in the manifest.
 */
var setup = function (context, manifest, config) {
  'use strict';
  var debug = new Debug(),
    hub = new Hub(debug),
    resource = new Resource(debug),
    api = new Api(debug),
    manager = new Manager(hub, resource, api),
    binder = new ProxyBinder(manager),
    policy,
    site_cfg = {
      'debug': 'log',
      'manifest': manifest,
      'moduleContext': (!context || typeof (context.isModule) === "undefined") ?
          util.isModuleContext() :
          context.isModule
    },
    link,
    Port;

  if (config) {
    util.mixin(site_cfg, config, true);
  }
  site_cfg.global = freedomGlobal;
  if (context) {
    util.mixin(site_cfg, context, true);
  }

  // Register user-supplied extensions.
  // For example the 'core.oauth' provider defines a register function,
  // which enables site_cfg.oauth to be registered with it.
  context.providers.forEach(function (provider) {
    if (provider.name.indexOf('core.') === 0 &&
        typeof provider.register === 'function') {
      provider.register(
        (typeof site_cfg[provider.name.substr(5)] !== 'undefined') ?
            site_cfg[provider.name.substr(5)] :
            undefined
      );
    }
  });
  
  Bundle.register(context.providers, api);
  resource.register(context.resolvers || []);

  return new PromiseCompat(function (resolve, reject) {
    if (site_cfg.moduleContext) {
      Port = site_cfg.portType;
      link = new Port('Outbound', resource);
      manager.setup(link);

      // Delay debug messages until delegation to the parent context is setup.
      manager.once('delegate', manager.setup.bind(manager, debug));
    } else {
      manager.setup(debug);
      policy = new Policy(manager, resource, site_cfg);

      // Define how to load a root module.
      var fallbackLogger, getIface;
      fallbackLogger = function (message) {
        api.getCore('core.console', debug).then(function (Logger) {
          debug.setLogger(new Logger());
          if (message) {
            debug.error(message);
          }
        });
      };
      getIface = function (manifest) {
        return resource.get(site_cfg.location, manifest).then(
          function (canonical_manifest) {
            return policy.get([], canonical_manifest);
          }
        ).then(function (instance) {
          manager.setup(instance);
          return binder.bindDefault(instance, api, instance.manifest);
        });
      };

      // Load appropriate Logger.
      if (site_cfg.logger) {
        getIface(site_cfg.logger).then(function (iface) {
          if (iface.external.api !== 'console') {
            fallbackLogger("Unwilling to use logger with unknown API:",
              iface.external.api);
          } else {
            debug.setLogger(iface.external());
          }
        }, fallbackLogger);
      } else {
        fallbackLogger();
      }

      // Load root module.
      getIface(site_cfg.manifest).then(function (iface) {
        return iface.external;
      }, function (err) {
        debug.error('Failed to retrieve manifest: ' + err);
        throw err;
      }).then(resolve, reject);
    }

    hub.emit('config', site_cfg);
  });
};

module.exports = setup;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./api":55,"./bundle":56,"./debug":58,"./hub":60,"./manager":64,"./policy":67,"./proxybinder":71,"./resource":72,"./util":73,"es6-promise":1}],60:[function(require,module,exports){
/*jslint indent:2,sloppy:true,node:true */
var util = require('./util');

/**
 * Defines fdom.Hub, the core message hub between freedom modules.
 * Incomming messages from apps are sent to hub.onMessage()
 * @class Hub
 * @param {Debug} debug Logger for debugging.
 * @constructor
 */
var Hub = function (debug) {
  this.debug = debug;
  this.config = {};
  this.apps = {};
  this.routes = {};
  this.unbound = [];

  util.handleEvents(this);
  this.on('config', function (config) {
    util.mixin(this.config, config);
  }.bind(this));
};

/**
 * Handle an incoming message from a freedom app.
 * @method onMessage
 * @param {String} source The identifiying source of the message.
 * @param {Object} message The sent message.
 */
Hub.prototype.onMessage = function (source, message) {
  var destination = this.routes[source], type;
  if (!destination || !destination.app) {
    this.debug.warn("Message dropped from unregistered source " + source);
    return;
  }

  if (!this.apps[destination.app]) {
    this.debug.warn("Message dropped to destination " + destination.app);
    return;
  }

  // The firehose tracing all internal freedom.js messages.
  if (!message.quiet && !destination.quiet && this.config && this.config.trace) {
    type = message.type;
    if (message.type === 'message' && message.message &&
        message.message.action === 'method') {
      type = 'method.' + message.message.type;
    } else if (message.type === 'method' && message.message &&
        message.message.type === 'method') {
      type = 'return.' + message.message.name;
    } else if (message.type === 'message' && message.message &&
        message.message.type === 'event') {
      type = 'event.' + message.message.name;
    }
    this.debug.debug(this.apps[destination.source].toString() +
        " -" + type + "-> " +
        this.apps[destination.app].toString() + "." + destination.flow);
  }

  this.apps[destination.app].onMessage(destination.flow, message);
};

/**
 * Get the local destination port of a flow.
 * @method getDestination
 * @param {String} source The flow to retrieve.
 * @return {Port} The destination port.
 */
Hub.prototype.getDestination = function (source) {
  var destination = this.routes[source];
  if (!destination) {
    return null;
  }
  return this.apps[destination.app];
};

/**
 * Get the local source port of a flow.
 * @method getSource
 * @param {Port} source The flow identifier to retrieve.
 * @return {Port} The source port.
 */
Hub.prototype.getSource = function (source) {
  if (!source) {
    return false;
  }
  if (!this.apps[source.id]) {
    this.debug.warn("No registered source '" + source.id + "'");
    return false;
  }
  return this.apps[source.id];
};

/**
 * Register a destination for messages with this hub.
 * @method register
 * @param {Port} app The Port to register.
 * @param {Boolean} [force] Whether to override an existing port.
 * @return {Boolean} Whether the app was registered.
 */
Hub.prototype.register = function (app, force) {
  if (!this.apps[app.id] || force) {
    this.apps[app.id] = app;
    return true;
  } else {
    return false;
  }
};

/**
 * Deregister a destination for messages with the hub.
 * Note: does not remove associated routes. As such, deregistering will
 * prevent the installation of new routes, but will not distrupt existing
 * hub routes.
 * @method deregister
 * @param {Port} app The Port to deregister
 * @return {Boolean} Whether the app was deregistered.
 */
Hub.prototype.deregister = function (app) {
  if (!this.apps[app.id]) {
    return false;
  }
  delete this.apps[app.id];
  return true;
};

/**
 * Install a new route in the hub.
 * @method install
 * @param {Port} source The source of the route.
 * @param {Port} destination The destination of the route.
 * @param {String} flow The flow where the destination will receive messages.
 * @param {Boolean} quiet Whether messages on this route should be suppressed.
 * @return {String} A routing source identifier for sending messages.
 */
Hub.prototype.install = function (source, destination, flow, quiet) {
  source = this.getSource(source);
  if (!source) {
    return;
  }
  if (!destination) {
    this.debug.warn("Unwilling to generate blackhole flow from " + source.id);
    return;
  }

  var route = this.generateRoute();
  this.routes[route] = {
    app: destination,
    flow: flow,
    source: source.id,
    quiet: quiet
  };
  if (typeof source.on === 'function') {
    source.on(route, this.onMessage.bind(this, route));
  }

  return route;
};

/**
 * Uninstall a hub route.
 * @method uninstall
 * @param {Port} source The source of the route.
 * @param {String} flow The route to uninstall.
 * @return {Boolean} Whether the route was able to be uninstalled.
 */
Hub.prototype.uninstall = function (source, flow) {
  source = this.getSource(source);
  if (!source) {
    return;
  }

  var route = this.routes[flow];
  if (!route) {
    return false;
  } else if (route.source !== source.id) {
    this.debug.warn("Flow " + flow + " does not belong to port " + source.id);
    return false;
  }

  delete this.routes[flow];
  if (typeof source.off === 'function') {
    source.off(route);
  }
  return true;
};

/**
 * Generate a unique routing identifier.
 * @method generateRoute
 * @return {String} a routing source identifier.
 * @private
 */
Hub.prototype.generateRoute = function () {
  return util.getId();
};

module.exports = Hub;

},{"./util":73}],61:[function(require,module,exports){
/*jslint indent:2, node:true, sloppy:true */
var util = require('./util');

/**
 * A link connects two freedom hubs. This is an abstract class
 * providing common functionality of translating control channels,
 * and integrating config information.
 * @class Link
 * @implements Port
 * @constructor
 */
var Link = function (name, resource) {
  this.id = 'Link' + Math.random();
  this.name = name;
  this.resource = resource;
  this.config = {};
  this.src = null;

  util.handleEvents(this);
  util.mixin(this, Link.prototype);
};

/**
 * Receive messages from the hub to this port.
 * Manages startup, and passes others to 'deliverMessage' implemented
 * in derived classes.
 * @method onMessage
 * @param {String} flow the channel/flow of the message.
 * @param {Object} message The Message.
 */
Link.prototype.onMessage = function (flow, message) {
  if (flow === 'control' && !this.controlChannel) {
    if (!this.controlChannel && message.channel) {
      this.controlChannel = message.channel;
      util.mixin(this.config, message.config);
      this.start();
    }
  } else {
    this.deliverMessage(flow, message);
  }
};

/**
 * Register a handler to alert of errors on this port.
 * @method addErrorHandler
 * @param {Function} handler Method to call with errors.
 */
Link.prototype.addErrorHandler = function (handler) {
  this.onError = handler;
};

/**
 * Report an error on this link.
 * @method onerror
 * @param {Error} err The error that occurred.
 */
Link.prototype.onError = function (err) {
  //Filled in by addErrorHandler
};

/**
 * Emit messages to the the hub, mapping control channels.
 * @method emitMessage
 * @param {String} flow the flow to emit the message on.
 * @param {Object} messgae The message to emit.
 */
Link.prototype.emitMessage = function (flow, message) {
  if (flow === 'control' && this.controlChannel) {
    flow = this.controlChannel;
  }
  this.emit(flow, message);
};

module.exports = Link;

},{"./util":73}],62:[function(require,module,exports){
/*jslint indent:2, white:true, node:true, sloppy:true */
var Link = require('../link');
var entry = require('../entry');

/**
 * A port providing message transport between two freedom contexts in the same namespace.
 * Note that using a direct link does not provide the isolation that freedom.js
 * encourages. To that end it should be limited to a method for testing and not
 * used in production without some serious though about the implications of that decision.
 * @class Direct
 * @extends Link
 * @uses handleEvents
 * @constructor
 */
var Direct = function(id, resource) {
  Link.call(this, id, resource);
};

/**
 * Start this port.
 * @method start
 * @private
 */
Direct.prototype.start = function() {
  if (this.config.moduleContext) {
    this.config.global.directLink.other = this;
    this.other = this.config.global.directLink;
    this.other.emit('started');
  } else {
    this.config.global.directLink = this;

    // Keep fdom.debug connected to parent hub.
    var child = entry(undefined, {
      isModule: true,
      portType: 'Direct'
    });
  }
};

/**
 * Stop this port by deleting the frame.
 * @method stop
 * @private
 */
Direct.prototype.stop = function() {
  if (this === this.config.global.directLink) {
    delete this.config.global.directLink;
  }
  delete this.other;
};

/**
 * Get the textual description of this port.
 * @method toString
 * @return {String} the description of this port.
 */
Direct.prototype.toString = function() {
  return "[Direct" + this.id + "]";
};

/**
 * Receive messages from the hub to this port.
 * Received messages will be emitted from the other side of the port.
 * @method deliverMessage
 * @param {String} flow the channel/flow of the message.
 * @param {Object} message The Message.
 */
Direct.prototype.deliverMessage = function(flow, message) {
  if (this.other) {
    /* //- For Debugging Purposes -
    if (this === this.config.global.directLink) {
      console.warn('->[' + flow + '] ' + JSON.stringify(message));
    } else {
      console.warn('<-[' + flow + '] ' + JSON.stringify(message));
    }
    */
    if (flow === 'control') {
      flow = this.other.controlChannel;
    }
    setTimeout(this.other.emit.bind(this.other, flow, message), 0);
  } else {
    this.once('started', this.onMessage.bind(this, flow, message));
  }
};

module.exports = Direct;

},{"../entry":59,"../link":61}],63:[function(require,module,exports){
/*jslint indent:2, white:true, node:true, sloppy:true */
/*globals URL,webkitURL */
var Link = require('../link');
var util = require('../util');

/**
 * A port providing message transport between two freedom contexts via iFrames.
 * @class Frame
 * @extends Link
 * @uses handleEvents
 * @constructor
 */
var Frame = function(id, resource) {
  Link.call(this, id, resource);
};

/**
 * Get the document to use for the frame. This allows overrides in downstream
 * links that want to essentially make an iFrame, but need to do it in another
 * context.
 * @method getDocument
 * @protected
 */
Frame.prototype.getDocument = function () {
  this.document = document;
  if (!this.document.body) {
    this.document.appendChild(this.document.createElement("body"));
  }
  this.root = document.body;
};

/**
 * Start this port by listening or creating a frame.
 * @method start
 * @private
 */
Frame.prototype.start = function() {
  if (this.config.moduleContext) {
    this.config.global.DEBUG = true;
    this.setupListener();
    this.src = 'in';
  } else {
    this.setupFrame();
    this.src = 'out';
  }
};

/**
 * Stop this port by deleting the frame.
 * @method stop
 * @private
 */
Frame.prototype.stop = function() {
  // Function is determined by setupListener or setupFrame as appropriate.
};

/**
 * Get the textual description of this port.
 * @method toString
 * @return {String} the description of this port.
 */
Frame.prototype.toString = function() {
  return "[Frame" + this.id + "]";
};

/**
 * Set up a global listener to handle incoming messages to this
 * freedom.js context.
 * @method setupListener
 */
Frame.prototype.setupListener = function() {
  var onMsg = function(msg) {
    if (msg.data.src !== 'in') {
      this.emitMessage(msg.data.flow, msg.data.message);
    }
  }.bind(this);
  this.obj = this.config.global;
  this.obj.addEventListener('message', onMsg, true);
  this.stop = function() {
    this.obj.removeEventListener('message', onMsg, true);
    delete this.obj;
  };
  this.emit('started');
  this.obj.postMessage("Ready For Messages", "*");
};

/**
 * Get a URL of a blob object for inclusion in a frame.
 * Polyfills implementations which don't have a current URL object, like
 * phantomjs.
 * @method getURL
 */
Frame.prototype.getURL = function(blob) {
  if (typeof URL !== 'object' && typeof webkitURL !== 'undefined') {
    return webkitURL.createObjectURL(blob);
  } else {
    return URL.createObjectURL(blob);
  }
};

/**
 * Deallocate the URL of a blob object.
 * Polyfills implementations which don't have a current URL object, like
 * phantomjs.
 * @method getURL
 */
Frame.prototype.revokeURL = function(url) {
  if (typeof URL !== 'object' && typeof webkitURL !== 'undefined') {
    webkitURL.revokeObjectURL(url);
  } else {
    URL.revokeObjectURL(url);
  }
};

/**
 * Set up an iFrame with an isolated freedom.js context inside.
 * @method setupFrame
 */
Frame.prototype.setupFrame = function() {
  var frame, onMsg;
  this.getDocument();
  frame = this.makeFrame(this.config.source, this.config.inject);
  
  this.root.appendChild(frame);

  onMsg = function(frame, msg) {
    if (!this.obj) {
      this.obj = frame;
      this.emit('started');
    }
    if (msg.data.src !== 'out') {
      this.emitMessage(msg.data.flow, msg.data.message);
    }
  }.bind(this, frame.contentWindow);

  frame.contentWindow.addEventListener('message', onMsg, true);
  this.stop = function() {
    frame.contentWindow.removeEventListener('message', onMsg, true);
    if (this.obj) {
      delete this.obj;
    }
    this.revokeURL(frame.src);
    frame.src = "about:blank";
    this.root.removeChild(frame);
  };
};

/**
 * Make frames to replicate freedom isolation without web-workers.
 * iFrame isolation is non-standardized, and access to the DOM within frames
 * means that they are insecure. However, debugging of webworkers is
 * painful enough that this mode of execution can be valuable for debugging.
 * @method makeFrame
 */
Frame.prototype.makeFrame = function(src, inject) {
  // TODO(willscott): add sandboxing protection.
  var frame = this.document.createElement('iframe'),
      extra = '',
      loader,
      blob;

  if (inject) {
    if (!inject.length) {
      inject = [inject];
    }
    inject.forEach(function(script) {
      extra += '<script src="' + script + '" onerror="' +
      'throw new Error(\'Injection of ' + script +' Failed!\');' +
      '"></script>';
    });
  }
  loader = '<html><meta http-equiv="Content-type" content="text/html;' +
    'charset=UTF-8">' + extra + '<script src="' + src + '" onerror="' +
    'throw new Error(\'Loading of ' + src +' Failed!\');' +
    '"></script></html>';
  blob = util.getBlob(loader, 'text/html');
  frame.src = this.getURL(blob);

  return frame;
};

/**
 * Receive messages from the hub to this port.
 * Received messages will be emitted from the other side of the port.
 * @method deliverMessage
 * @param {String} flow the channel/flow of the message.
 * @param {Object} message The Message.
 */
Frame.prototype.deliverMessage = function(flow, message) {
  if (this.obj) {
    //fdom.debug.log('message sent to worker: ', flow, message);
    this.obj.postMessage({
      src: this.src,
      flow: flow,
      message: message
    }, '*');
  } else {
    this.once('started', this.onMessage.bind(this, flow, message));
  }
};

module.exports = Frame;


},{"../link":61,"../util":73}],64:[function(require,module,exports){
/*jslint indent:2,node:true,sloppy:true */
var util = require('./util');
var ModuleInternal = require('./moduleinternal');

/**
 * A freedom port which manages the control plane of of changing hub routes.
 * @class Manager
 * @implements Port
 * @param {Hub} hub The routing hub to control.
 * @param {Resource} resource The resource manager for the runtime.
 * @param {Api} api The API manager for the runtime.
 * @constructor
 */
var Manager = function (hub, resource, api) {
  this.id = 'control';
  this.config = {};
  this.controlFlows = {};
  this.dataFlows = {};
  this.dataFlows[this.id] = [];
  this.reverseFlowMap = {};

  this.debug = hub.debug;
  this.hub = hub;
  this.resource = resource;
  this.api = api;

  this.delegate = null;
  this.toDelegate = {};
  
  this.hub.on('config', function (config) {
    util.mixin(this.config, config);
    this.emit('config');
  }.bind(this));
  
  util.handleEvents(this);
  this.hub.register(this);
};

/**
 * Provide a textual description of this port.
 * @method toString
 * @return {String} the description of this port.
 */
Manager.prototype.toString = function () {
  return "[Local Controller]";
};

/**
 * Process messages sent to this port.
 * The manager, or 'control' destination handles several types of messages,
 * identified by the request property.  The actions are:
 * 1. debug. Prints the message to the console.
 * 2. link. Creates a link between the source and a provided destination port.
 * 3. environment. Instantiate a module environment defined in ModuleInternal.
 * 4. delegate. Routes a defined set of control messages to another location.
 * 5. resource. Registers the source as a resource resolver.
 * 6. core. Generates a core provider for the requester.
 * 7. close. Tears down routes involing the requesting port.
 * 8. unlink. Tears down a route from the requesting port.
 * @method onMessage
 * @param {String} flow The source identifier of the message.
 * @param {Object} message The received message.
 */
Manager.prototype.onMessage = function (flow, message) {
  var reverseFlow = this.controlFlows[flow], origin;
  if (!reverseFlow) {
    this.debug.warn("Unknown message source: " + flow);
    return;
  }
  origin = this.hub.getDestination(reverseFlow);

  if (this.delegate && reverseFlow !== this.delegate &&
      this.toDelegate[flow]) {
    // Ship off to the delegee
    this.emit(this.delegate, {
      type: 'Delegation',
      request: 'handle',
      quiet: true,
      flow: flow,
      message: message
    });
    return;
  }

  if (message.request === 'debug') {
    this.debug.print(message);
    return;
  }

  if (message.request === 'link') {
    this.createLink(origin, message.name, message.to, message.overrideDest);
  } else if (message.request === 'environment') {
    this.createLink(origin, message.name, new ModuleInternal(this));
  } else if (message.request === 'delegate') {
    // Initate Delegation.
    if (this.delegate === null) {
      this.delegate = reverseFlow;
    }
    this.toDelegate[message.flow] = true;
    this.emit('delegate');
  } else if (message.request === 'resource') {
    this.resource.addResolver(message.args[0]);
    this.resource.addRetriever(message.service, message.args[1]);
  } else if (message.request === 'core') {
    if (this.core && reverseFlow === this.delegate) {
      (new this.core()).onMessage(origin, message.message);
      return;
    }
    this.getCore(function (to, core) {
      this.hub.onMessage(to, {
        type: 'core',
        core: core
      });
    }.bind(this, reverseFlow));
  } else if (message.request === 'close') {
    this.destroy(origin);
  } else if (message.request === 'unlink') {
    this.removeLink(origin, message.to);
  } else {
    this.debug.warn("Unknown control request: " + message.request);
    this.debug.log(JSON.stringify(message));
    return;
  }
};

/**
 * Get the port messages will be routed to given its id.
 * @method getPort
 * @param {String} portId The ID of the port.
 * @returns {fdom.Port} The port with that ID.
 */
Manager.prototype.getPort = function (portId) {
  return this.hub.getDestination(this.controlFlows[portId]);
};

/**
 * Set up a port with the hub.
 * @method setup
 * @param {Port} port The port to register.
 */
Manager.prototype.setup = function (port) {
  if (!port.id) {
    this.debug.warn("Refusing to setup unidentified port ");
    return false;
  }

  if (this.controlFlows[port.id]) {
    this.debug.warn("Refusing to re-initialize port " + port.id);
    return false;
  }

  if (!this.config.global) {
    this.once('config', this.setup.bind(this, port));
    return;
  }

  this.hub.register(port);
  var flow = this.hub.install(this, port.id, "control"),
    reverse = this.hub.install(port, this.id, port.id);
  this.controlFlows[port.id] = flow;
  this.dataFlows[port.id] = [reverse];
  this.reverseFlowMap[flow] = reverse;
  this.reverseFlowMap[reverse] = flow;

  if (port.lineage) {
    this.emit('moduleAdd', {id: port.id, lineage: port.lineage});
  }
  
  this.hub.onMessage(flow, {
    type: 'setup',
    channel: reverse,
    config: this.config
  });

  return true;
};

/**
 * Tear down a port on the hub.
 * @method destroy
 * @apram {Port} port The port to unregister.
 */
Manager.prototype.destroy = function (port) {
  if (!port.id) {
    this.debug.warn("Unable to tear down unidentified port");
    return false;
  }

  if (port.lineage) {
    this.emit('moduleRemove', {id: port.id, lineage: port.lineage});
  }

  // Remove the port.
  delete this.controlFlows[port.id];

  // Remove associated links.
  var i;
  for (i = this.dataFlows[port.id].length - 1; i >= 0; i -= 1) {
    this.removeLink(port, this.dataFlows[port.id][i]);
  }

  // Remove the port.
  delete this.dataFlows[port.id];
  this.hub.deregister(port);
};

/**
 * Create a link between two ports.  Links are created in both directions,
 * and a message with those capabilities is sent to the source port.
 * @method createLink
 * @param {Port} port The source port.
 * @param {String} name The flow for messages from destination to port.
 * @param {Port} destination The destination port.
 * @param {String} [destName] The flow name for messages to the destination.
 * @param {Boolean} [toDest] Tell the destination about the link.
 */
Manager.prototype.createLink = function (port, name, destination, destName,
                                         toDest) {
  if (!this.config.global) {
    this.once('config',
      this.createLink.bind(this, port, name, destination, destName));
    return;
  }
  
  if (!this.controlFlows[port.id]) {
    this.debug.warn('Unwilling to link from non-registered source.');
    return;
  }

  if (!this.controlFlows[destination.id]) {
    if (this.setup(destination) === false) {
      this.debug.warn('Could not find or setup destination.');
      return;
    }
  }
  var quiet = destination.quiet || false,
    outgoingName = destName || 'default',
    outgoing = this.hub.install(port, destination.id, outgoingName, quiet),
    reverse;

  // Recover the port so that listeners are installed.
  destination = this.hub.getDestination(outgoing);
  reverse = this.hub.install(destination, port.id, name, quiet);

  this.reverseFlowMap[outgoing] = reverse;
  this.dataFlows[port.id].push(outgoing);
  this.reverseFlowMap[reverse] = outgoing;
  this.dataFlows[destination.id].push(reverse);

  if (toDest) {
    this.hub.onMessage(this.controlFlows[destination.id], {
      type: 'createLink',
      name: outgoingName,
      channel: reverse,
      reverse: outgoing
    });
  } else {
    this.hub.onMessage(this.controlFlows[port.id], {
      name: name,
      type: 'createLink',
      channel: outgoing,
      reverse: reverse
    });
  }
};

/**
 * Remove a link between to ports. The reverse link will also be removed.
 * @method removeLink
 * @param {Port} port The source port.
 * @param {String} name The flow to be removed.
 */
Manager.prototype.removeLink = function (port, name) {
  var reverse = this.hub.getDestination(name),
    rflow = this.reverseFlowMap[name],
    i;

  if (!reverse || !rflow) {
    this.debug.warn("Could not find metadata to remove flow: " + name);
    return;
  }

  if (this.hub.getDestination(rflow).id !== port.id) {
    this.debug.warn("Source port does not own flow " + name);
    return;
  }

  // Notify ports that a channel is closing.
  i = this.controlFlows[port.id];
  if (i) {
    this.hub.onMessage(i, {
      type: 'close',
      channel: name
    });
  }
  i = this.controlFlows[reverse.id];
  if (i) {
    this.hub.onMessage(i, {
      type: 'close',
      channel: rflow
    });
  }

  // Uninstall the channel.
  this.hub.uninstall(port, name);
  this.hub.uninstall(reverse, rflow);

  delete this.reverseFlowMap[name];
  delete this.reverseFlowMap[rflow];
  this.forgetFlow(reverse.id, rflow);
  this.forgetFlow(port.id, name);
};

/**
 * Forget the flow from id with a given name.
 * @method forgetFlow
 * @private
 * @param {String} id The port ID of the source.
 * @param {String} name The flow name.
 */
Manager.prototype.forgetFlow = function (id, name) {
  var i;
  if (this.dataFlows[id]) {
    for (i = 0; i < this.dataFlows[id].length; i += 1) {
      if (this.dataFlows[id][i] === name) {
        this.dataFlows[id].splice(i, 1);
        break;
      }
    }
  }
};

/**
 * Get the core freedom.js API active on the current hub.
 * @method getCore
 * @private
 * @param {Function} cb Callback to fire with the core object.
 */
Manager.prototype.getCore = function (cb) {
  if (this.core) {
    cb(this.core);
  } else {
    this.api.getCore('core', this).then(function (core) {
      this.core = core;
      cb(this.core);
    }.bind(this));
  }
};

module.exports = Manager;

},{"./moduleinternal":66,"./util":73}],65:[function(require,module,exports){
/*jslint indent:2,node:true,sloppy:true */
var util = require('./util');
var Provider = require('./provider');

/**
 * The external Port face of a module on a hub.
 * @class Module
 * @extends Port
 * @param {String} manifestURL The manifest this module loads.
 * @param {String[]} creator The lineage of creation for this module.
 * @param {Policy} Policy The policy loader for dependencies.
 * @constructor
 */
var Module = function (manifestURL, manifest, creator, policy) {
  this.api = policy.api;
  this.policy = policy;
  this.resource = policy.resource;
  this.debug = policy.debug;

  this.config = {};

  this.id = manifestURL + Math.random();
  this.manifestId = manifestURL;
  this.manifest = manifest;
  this.lineage = [this.manifestId].concat(creator);

  this.quiet = this.manifest.quiet || false;

  this.externalPortMap = {};
  this.internalPortMap = {};
  this.dependantChannels = [];
  this.started = false;

  util.handleEvents(this);
};

/**
 * Receive a message for the Module.
 * @method onMessage
 * @param {String} flow The origin of the message.
 * @param {Object} message The message received.
 */
Module.prototype.onMessage = function (flow, message) {
  if (flow === 'control') {
    if (message.type === 'setup') {
      this.controlChannel = message.channel;
      util.mixin(this.config, message.config);
      this.emit(this.controlChannel, {
        type: 'Core Provider',
        request: 'core'
      });
      this.start();
      return;
    } else if (message.type === 'createLink' && message.channel) {
      this.debug.debug(this + 'got create link for ' + message.name);
      this.externalPortMap[message.name] = message.channel;
      if (this.internalPortMap[message.name] === undefined) {
        this.internalPortMap[message.name] = false;
      }
      var msg = {
        type: 'default channel announcement',
        channel: message.reverse
      };
      if (this.manifest.dependencies &&
          this.manifest.dependencies[message.name]) {
        msg.api = this.manifest.dependencies[message.name].api;
      }
      this.emit(message.channel, msg);
      return;
    } else if (message.core) {
      this.core = new message.core();
      this.emit('core', message.core);
      return;
    } else if (message.type === 'close') {
      // Closing channel.
      if (message.channel === 'control') {
        this.stop();
      }
      this.deregisterFlow(message.channel, false);
    } else {
      this.port.onMessage(flow, message);
    }
  } else {
    if ((this.externalPortMap[flow] === false ||
        !this.externalPortMap[flow]) && message.channel) {
      this.debug.debug(this + 'handling channel announcement for ' + flow);
      this.externalPortMap[flow] = message.channel;
      if (this.internalPortMap[flow] === undefined) {
        this.internalPortMap[flow] = false;

        // New incoming connection attempts should get routed to modInternal.
        if (this.manifest.provides && this.modInternal) {
          this.port.onMessage(this.modInternal, {
            type: 'Connection',
            channel: flow,
            api: message.api
          });
        } else if (this.manifest.provides) {
          this.once('modInternal', function (flow, api) {
            this.port.onMessage(this.modInternal, {
              type: 'Connection',
              channel: flow,
              api: api
            });
          }.bind(this, flow, message.api));
        // First connection retains legacy mapping as 'default'.
        } else if (!this.externalPortMap['default'] && message.channel) {
          this.externalPortMap['default'] = message.channel;
          this.once('internalChannelReady', function (flow) {
            this.internalPortMap[flow] = this.internalPortMap['default'];
          }.bind(this, flow));
        }
      }
      return;
    } else if (!this.started) {
      this.once('start', this.onMessage.bind(this, flow, message));
    } else {
      if (this.internalPortMap[flow] === false) {
        console.warn('waiting on internal channel for msg');
        this.once('internalChannelReady', this.onMessage.bind(this, flow, message));
      } else if (!this.internalPortMap[flow]) {
        this.debug.error('Unexpected message from ' + flow);
        return;
      } else {
        this.port.onMessage(this.internalPortMap[flow], message);
      }
    }
  }
};

/**
 * Clean up after a flow which is no longer used / needed.
 * @method deregisterFLow
 * @param {String} flow The flow to remove mappings for.
 * @param {Boolean} internal If the flow name is the internal identifier.
 * @returns {Boolean} Whether the flow was successfully deregistered.
 * @private
 */
Module.prototype.deregisterFlow = function (flow, internal) {
  var key,
    map = internal ? this.internalPortMap : this.externalPortMap;
  // TODO: this is inefficient, but seems less confusing than a 3rd
  // reverse lookup map.
  for (key in map) {
    if (map[key] === flow) {
      if (internal) {
        this.emit(this.controlChannel, {
          type: 'Channel Teardown',
          request: 'unlink',
          to: this.externalPortMap[key]
        });
      } else {
        this.port.onMessage('control', {
          type: 'close',
          channel: this.internalPortMap[key]
        });
      }
      delete this.externalPortMap[key];
      delete this.internalPortMap[key];

      // When there are still non-dependant channels, keep running
      for (key in this.externalPortMap) {
        if (this.externalPortMap.hasOwnProperty(key)) {
          if (this.dependantChannels.indexOf(key) < 0) {
            return true;
          }
        }
      }
      // Otherwise shut down the module.
      this.stop();
      return true;
    }
  }
  return false;
};

/**
 * Attempt to start the module once the remote freedom context
 * exists.
 * @method start
 * @private
 */
Module.prototype.start = function () {
  var Port;
  if (this.started || this.port) {
    return false;
  }
  if (this.controlChannel) {
    this.loadLinks();
    Port = this.config.portType;
    this.port = new Port(this.manifest.name, this.resource);
    // Listen to all port messages.
    this.port.on(this.emitMessage.bind(this));
    this.port.addErrorHandler(function (err) {
      this.debug.warn('Module Failed', err);
      this.stop();
    }.bind(this));
    // Tell the local port to ask us for help.
    this.port.onMessage('control', {
      channel: 'control',
      config: this.config
    });

    // Tell the remote location to delegate debugging.
    this.port.onMessage('control', {
      type: 'Redirect',
      request: 'delegate',
      flow: 'debug'
    });
    this.port.onMessage('control', {
      type: 'Redirect',
      request: 'delegate',
      flow: 'core'
    });
    
    // Tell the container to instantiate the counterpart to this external view.
    this.port.onMessage('control', {
      type: 'Environment Configuration',
      request: 'environment',
      name: 'ModInternal'
    });
  }
};

/**
 * Stop the module when it is no longer needed, and tear-down state.
 * @method stop
 * @private
 */
Module.prototype.stop = function () {
  if (!this.started) {
    return;
  }
  this.emit('close');
  if (this.port) {
    this.port.off();
    this.port.onMessage('control', {
      type: 'close',
      channel: 'control'
    });
    this.port.stop();
    delete this.port;
  }
  this.started = false;
};

/**
 * Textual Description of the Port
 * @method toString
 * @return {String} The description of this Port.
 */
Module.prototype.toString = function () {
  return "[Module " + this.manifest.name + "]";
};

/**
 * Intercept messages as they arrive from the module,
 * mapping them between internal and external flow names.
 * @method emitMessage
 * @param {String} name The destination the module wants to send to.
 * @param {Object} message The message to send.
 * @private
 */
Module.prototype.emitMessage = function (name, message) {
  if (this.internalPortMap[name] === false && message.channel) {
    this.internalPortMap[name] = message.channel;
    this.emit('internalChannelReady');
    return;
  }
  // Terminate debug redirection requested in start().
  if (name === 'control') {
    if (message.flow === 'debug' && message.message) {
      this.debug.format(message.message.severity,
          message.message.source || this.toString(),
          message.message.msg);
    } else if (message.flow === 'core' && message.message) {
      if (!this.core) {
        this.once('core', this.emitMessage.bind(this, name, message));
        return;
      }
      if (message.message.type === 'register') {
        message.message.reply = this.port.onMessage.bind(this.port, 'control');
        this.externalPortMap[message.message.id] = false;
      }
      this.core.onMessage(this, message.message);
    } else if (message.name === 'ModInternal' && !this.modInternal) {
      this.modInternal = message.channel;
      this.port.onMessage(this.modInternal, {
        type: 'Initialization',
        id: this.manifestId,
        appId: this.id,
        manifest: this.manifest,
        lineage: this.lineage,
        channel: message.reverse
      });
      this.emit('modInternal');
    } else if (message.type === 'createLink') {
      this.internalPortMap[message.name] = message.channel;
      this.port.onMessage(message.channel, {
        type: 'channel announcement',
        channel: message.reverse
      });
      this.emit('internalChannelReady');
    } else if (message.type === 'close') {
      this.deregisterFlow(message.channel, true);
    }
  } else if (name === 'ModInternal' && message.type === 'ready' && !this.started) {
    this.started = true;
    this.emit('start');
  } else if (name === 'ModInternal' && message.type === 'resolve') {
    this.resource.get(this.manifestId, message.data).then(function (id, data) {
      this.port.onMessage(this.modInternal, {
        type: 'resolve response',
        id: id,
        data: data
      });
    }.bind(this, message.id), function () {
      this.debug.warn('Error Resolving URL for Module.');
    }.bind(this));
  } else {
    this.emit(this.externalPortMap[name], message);
  }
  return false;
};

/**
 * Request the external routes used by this module.
 * @method loadLinks
 * @private
 */
Module.prototype.loadLinks = function () {
  var i, channels = ['default'], name, dep,
    finishLink = function (dep, name, provider) {
      var style = this.api.getInterfaceStyle(name);
      dep.getInterface()[style](provider);
    };
  if (this.manifest.permissions) {
    for (i = 0; i < this.manifest.permissions.length; i += 1) {
      name = this.manifest.permissions[i];
      if (channels.indexOf(name) < 0 && name.indexOf('core.') === 0) {
        channels.push(name);
        this.dependantChannels.push(name);
        dep = new Provider(this.api.get(name).definition, this.debug);
        this.api.getCore(name, this).then(finishLink.bind(this, dep, name));

        this.emit(this.controlChannel, {
          type: 'Core Link to ' + name,
          request: 'link',
          name: name,
          to: dep
        });
      }
    }
  }
  if (this.manifest.dependencies) {
    util.eachProp(this.manifest.dependencies, function (desc, name) {
      if (channels.indexOf(name) < 0) {
        channels.push(name);
        this.dependantChannels.push(name);
      }
      this.resource.get(this.manifestId, desc.url).then(function (url) {
        this.policy.get(this.lineage, url).then(function (dep) {
          this.updateEnv(name, dep.manifest);
          this.emit(this.controlChannel, {
            type: 'Link to ' + name,
            request: 'link',
            name: name,
            overrideDest: name + '.' + this.id,
            to: dep
          });
        }.bind(this), function (err) {
          this.debug.warn('failed to load dep: ', name, err);
        }.bind(this));
      }.bind(this));
    }.bind(this));
  }
  // Note that messages can be synchronous, so some ports may already be bound.
  for (i = 0; i < channels.length; i += 1) {
    this.externalPortMap[channels[i]] = this.externalPortMap[channels[i]] || false;
    this.internalPortMap[channels[i]] = false;
  }
};

/**
 * Update the module environment with information about a dependent manifest.
 * @method updateEnv
 * @param {String} dep The dependency
 * @param {Object} manifest The manifest of the dependency
 */
Module.prototype.updateEnv = function (dep, manifest) {
  if (!manifest) {
    return;
  }
  if (!this.modInternal) {
    this.once('modInternal', this.updateEnv.bind(this, dep, manifest));
    return;
  }
  
  var metadata;

  // Decide if/what other properties should be exported.
  // Keep in sync with ModuleInternal.updateEnv
  metadata = {
    name: manifest.name,
    icon: manifest.icon,
    description: manifest.description,
    api: manifest.api
  };
  
  this.port.onMessage(this.modInternal, {
    type: 'manifest',
    name: dep,
    manifest: metadata
  });
};

module.exports = Module;

},{"./provider":68,"./util":73}],66:[function(require,module,exports){
/*jslint indent:2, node:true,sloppy:true */
var PromiseCompat = require('es6-promise').Promise;

var ApiInterface = require('./proxy/apiInterface');
var Provider = require('./provider');
var ProxyBinder = require('./proxybinder');
var util = require('./util');

/**
 * The internal logic for module setup, which makes sure the public
 * facing exports have appropriate properties, and load user scripts.
 * @class ModuleInternal
 * @extends Port
 * @param {Port} manager The manager in this module to use for routing setup.
 * @constructor
 */
var ModuleInternal = function (manager) {
  this.config = {};
  this.manager = manager;
  this.debug = manager.debug;
  this.binder = new ProxyBinder(this.manager);
  this.api = this.manager.api;
  this.manifests = {};
  this.providers = {};
  
  this.id = 'ModuleInternal';
  this.pendingPorts = 0;
  this.requests = {};

  util.handleEvents(this);
};

/**
 * Message handler for this port.
 * This port only handles two messages:
 * The first is its setup from the manager, which it uses for configuration.
 * The second is from the module controller (fdom.port.Module), which provides
 * the manifest info for the module.
 * @method onMessage
 * @param {String} flow The detination of the message.
 * @param {Object} message The message.
 */
ModuleInternal.prototype.onMessage = function (flow, message) {
  if (flow === 'control') {
    if (!this.controlChannel && message.channel) {
      this.controlChannel = message.channel;
      util.mixin(this.config, message.config);
    }
  } else if (flow === 'default' && !this.appId) {
    // Recover the ID of this module:
    this.port = this.manager.hub.getDestination(message.channel);
    this.externalChannel = message.channel;
    this.appId = message.appId;
    this.lineage = message.lineage;

    var objects = this.mapProxies(message.manifest);

    this.generateEnv(message.manifest, objects).then(function () {
      return this.loadLinks(objects);
    }.bind(this)).then(this.loadScripts.bind(this, message.id,
        message.manifest.app.script));
  } else if (flow === 'default' && this.requests[message.id]) {
    this.requests[message.id](message.data);
    delete this.requests[message.id];
  } else if (flow === 'default' && message.type === 'manifest') {
    this.emit('manifest', message);
    this.updateManifest(message.name, message.manifest);
  } else if (flow === 'default' && message.type === 'Connection') {
    // Multiple connections can be made to the default provider.
    if (message.api && this.providers[message.api]) {
      this.manager.createLink(this.providers[message.api], message.channel,
                             this.port, message.channel);
    } else if (this.defaultPort &&
               (message.api === this.defaultPort.api || !message.api)) {
      this.manager.createLink(this.defaultPort, message.channel,
                              this.port, message.channel);
    } else {
      this.once('start', this.onMessage.bind(this, flow, message));
    }
  }
};

/**
 * Get a textual description of this Port.
 * @method toString
 * @return {String} a description of this Port.
 */
ModuleInternal.prototype.toString = function () {
  return "[Environment Helper]";
};

/**
 * Generate an externaly visisble namespace
 * @method generateEnv
 * @param {Object} manifest The manifest of the module.
 * @param {Object[]} items Other interfaces to load.
 * @returns {Promise} A promise when the external namespace is visible.
 * @private
 */
ModuleInternal.prototype.generateEnv = function (manifest, items) {
  return this.binder.bindDefault(this.port, this.api, manifest, true).then(
    function (binding) {
      var i = 0;
      binding.port.api = binding.external.api;
      this.defaultPort = binding.port;
      if (binding.external.api) {
        for (i = 0; i < items.length; i += 1) {
          if (items[i].name === binding.external.api && items[i].def.provides) {
            items.splice(i, 1);
            break;
          }
        }
      }
      this.config.global.freedom = binding.external;
    }.bind(this)
  );
};

/**
 * Attach a proxy to the externally visible namespace.
 * @method attach
 * @param {String} name The name of the proxy.
 * @param {Boolean} provides If this proxy is a provider.
 * @param {ProxyInterface} proxy The proxy to attach.
 * @param {String} api The API the proxy implements.
 * @private.
 */
ModuleInternal.prototype.attach = function (name, provides, proxy) {
  var exp = this.config.global.freedom;
  
  if (provides) {
    this.providers[name] = proxy.port;
  }

  if (!exp[name]) {
    exp[name] = proxy.external;
    if (this.manifests[name]) {
      exp[name].manifest = this.manifests[name];
    }
  }

  this.pendingPorts -= 1;
  if (this.pendingPorts === 0) {
    this.emit('start');
  }
};

/**
 * Request a set of proxy interfaces, and bind them to the external
 * namespace.
 * @method loadLinks
 * @param {Object[]} items Descriptors of the proxy ports to load.
 * @private
 * @returns {Promise} Promise for when all links are loaded.
 */
//TODO(willscott): promise should be chained, rather than going through events.
ModuleInternal.prototype.loadLinks = function (items) {
  var i, proxy, provider, core,
    manifestPredicate = function (name, flow, msg) {
      return flow === 'manifest' && msg.name === name;
    },
    onManifest = function (item, msg) {
      var definition = {
        name: item.api
      };
      if (!msg.manifest.api || !msg.manifest.api[item.api]) {
        definition.definition = null;
      } else {
        definition.definition = msg.manifest.api[item.api];
      }
      this.binder.getExternal(this.port, item.name, definition).then(
        this.attach.bind(this, item.name, false)
      );
    }.bind(this),
    promise = new PromiseCompat(function (resolve, reject) {
      this.once('start', resolve);
    }.bind(this));

  for (i = 0; i < items.length; i += 1) {
    if (items[i].api && !items[i].def) {
      if (this.manifests[items[i].name]) {
        onManifest(items[i], {
          manifest: this.manifests[items[i].name]
        });
      } else {
        this.once(manifestPredicate.bind({}, items[i].name),
                  onManifest.bind(this, items[i]));
      }
    } else {
      this.binder.getExternal(this.port, items[i].name, items[i].def).then(
        this.attach.bind(this, items[i].name, items[i].def &&
                         items[i].def.provides)
      );
    }
    this.pendingPorts += 1;
  }
  
  // Allow resolution of files by parent.
  this.manager.resource.addResolver(function (manifest, url, resolve) {
    var id = util.getId();
    this.requests[id] = resolve;
    this.emit(this.externalChannel, {
      type: 'resolve',
      id: id,
      data: url
    });
    return true;
  }.bind(this));

  // Attach Core.
  this.pendingPorts += 1;

  core = this.api.get('core').definition;
  provider = new Provider(core, this.debug);
  this.manager.getCore(function (CoreProv) {
    new CoreProv(this.manager).setId(this.lineage);
    provider.getInterface().provideAsynchronous(CoreProv);
  }.bind(this));

  this.emit(this.controlChannel, {
    type: 'Link to core',
    request: 'link',
    name: 'core',
    to: provider
  });
  
  this.binder.getExternal(provider, 'default', {
    name: 'core',
    definition: core
  }).then(
    this.attach.bind(this, 'core', false)
  );


//  proxy = new Proxy(ApiInterface.bind({}, core), this.debug);
//  this.manager.createLink(provider, 'default', proxy);
//  this.attach('core', {port: pr, external: proxy});

  if (this.pendingPorts === 0) {
    this.emit('start');
  }

  return promise;
};

/**
 * Update the exported manifest of a dependency.
 * Sets it internally if not yet exported, or attaches the property if it
 * is loaded after the module has started (we don't delay start to retreive
 * the manifest of the dependency.)
 * @method updateManifest
 * @param {String} name The Dependency
 * @param {Object} manifest The manifest of the dependency
 */
ModuleInternal.prototype.updateManifest = function (name, manifest) {
  var exp = this.config.global.freedom;

  if (exp && exp[name]) {
    exp[name].manifest = manifest;
  } else {
    this.manifests[name] = manifest;
  }
};

/**
 * Determine which proxy ports should be exposed by this module.
 * @method mapProxies
 * @param {Object} manifest the module JSON manifest.
 * @return {Object[]} proxy descriptors defined in the manifest.
 */
ModuleInternal.prototype.mapProxies = function (manifest) {
  var proxies = [], seen = ['core'], i, obj;
  
  if (manifest.permissions) {
    for (i = 0; i < manifest.permissions.length; i += 1) {
      obj = {
        name: manifest.permissions[i],
        def: undefined
      };
      obj.def = this.api.get(obj.name);
      if (seen.indexOf(obj.name) < 0 && obj.def) {
        proxies.push(obj);
        seen.push(obj.name);
      }
    }
  }
  
  if (manifest.dependencies) {
    util.eachProp(manifest.dependencies, function (desc, name) {
      obj = {
        name: name,
        api: desc.api
      };
      if (seen.indexOf(name) < 0) {
        if (desc.api) {
          obj.def = this.api.get(desc.api);
        }
        proxies.push(obj);
        seen.push(name);
      }
    }.bind(this));
  }
  
  if (manifest.provides) {
    for (i = 0; i < manifest.provides.length; i += 1) {
      obj = {
        name: manifest.provides[i],
        def: undefined
      };
      obj.def = this.api.get(obj.name);
      if (obj.def) {
        obj.def.provides = true;
      } else if (manifest.api && manifest.api[obj.name]) {
        obj.def = {
          name: obj.name,
          definition: manifest.api[obj.name],
          provides: true
        };
      } else {
        this.debug.warn('Module will not provide "' + obj.name +
          '", since no declaration can be found.');
        /*jslint continue:true*/
        continue;
      }
      /*jslint continue:false*/
      if (seen.indexOf(obj.name) < 0) {
        proxies.push(obj);
        seen.push(obj.name);
      }
    }
  }

  return proxies;
};

/**
 * Load external scripts into this namespace.
 * @method loadScripts
 * @param {String} from The URL of this modules's manifest.
 * @param {String[]} scripts The URLs of the scripts to load.
 */
ModuleInternal.prototype.loadScripts = function (from, scripts) {
  // TODO(salomegeo): add a test for failure.
  var importer = function (script, resolve, reject) {
    try {
      this.config.global.importScripts(script);
      resolve(true);
    } catch (e) {
      reject(e);
    }
  }.bind(this),
    scripts_count,
    load;
  if (typeof scripts === 'string') {
    scripts_count = 1;
  } else {
    scripts_count = scripts.length;
  }

  load = function (next) {
    if (next === scripts_count) {
      this.emit(this.externalChannel, {
        type: "ready"
      });
      return;
    }

    var script;
    if (typeof scripts === 'string') {
      script = scripts;
    } else {
      script = scripts[next];
    }

    this.manager.resource.get(from, script).then(function (url) {
      this.tryLoad(importer, url).then(function () {
        load(next + 1);
      }.bind(this));
    }.bind(this));
  }.bind(this);



  if (!this.config.global.importScripts) {
    importer = function (url, resolve, reject) {
      var script = this.config.global.document.createElement('script');
      script.src = url;
      script.addEventListener('load', resolve, true);
      this.config.global.document.body.appendChild(script);
    }.bind(this);
  }

  load(0);
};

/**
 * Attempt to load resolved scripts into the namespace.
 * @method tryLoad
 * @private
 * @param {Function} importer The actual import function
 * @param {String[]} urls The resoved URLs to load.
 * @returns {Promise} completion of load
 */
ModuleInternal.prototype.tryLoad = function (importer, url) {
  return new PromiseCompat(importer.bind({}, url)).then(function (val) {
    return val;
  }, function (e) {
    this.debug.warn(e.stack);
    this.debug.error("Error loading " + url, e);
    this.debug.error("If the stack trace is not useful, see https://" +
        "github.com/freedomjs/freedom/wiki/Debugging-Script-Parse-Errors");
  }.bind(this));
};

module.exports = ModuleInternal;

},{"./provider":68,"./proxy/apiInterface":69,"./proxybinder":71,"./util":73,"es6-promise":1}],67:[function(require,module,exports){
/*globals XMLHttpRequest */
/*jslint indent:2,white:true,node:true,sloppy:true */
var PromiseCompat = require('es6-promise').Promise;
var Module = require('./module');
var util = require('./util');

/**
 * The Policy registry for freedom.js.  Used to look up modules and provide
 * migration and coallesing of execution.
 * @Class Policy
 * @param {Manager} manager The manager of the active runtime.
 * @param {Resource} resource The resource loader of the active runtime.
 * @param {Object} config The local config.
 * @constructor
 */
var Policy = function(manager, resource, config) {
  this.api = manager.api;
  this.debug = manager.debug;
  this.location = config.location;
  this.resource = resource;

  this.config = config;
  this.runtimes = [];
  this.policies = [];
  this.pending = {};
  util.handleEvents(this);

  this.add(manager, config.policy);
  this.runtimes[0].local = true;
};

/**
 * The policy a runtime is expected to have unless it specifies
 * otherwise.
 * TODO: consider making static
 * @property defaultPolicy
 */
Policy.prototype.defaultPolicy = {
  background: false, // Can this runtime run 'background' modules?
  interactive: true // Is there a view associated with this runtime?
  // TODO: remaining runtime policy.
};

/**
 * The constraints a code modules is expected to have unless it specifies
 * otherwise.
 * TODO: consider making static
 * @property defaultConstraints
 */
Policy.prototype.defaultConstraints = {
  isolation: "always", // values: always, app, never
  placement: "local" // values: local, stable, redundant
  // TODO: remaining constraints, express platform-specific dependencies.
};

/**
 * Resolve a module from its canonical URL.
 * Reponds with the promise of a port representing the module, 
 * @method get
 * @param {String[]} lineage The lineage of the requesting module.
 * @param {String} id The canonical ID of the module to get.
 * @returns {Promise} A promise for the local port towards the module.
 */
Policy.prototype.get = function(lineage, id) {
  
  // Make sure that a module isn't getting located twice at the same time.
  // This is resolved by delaying if it until we see it in a 'moduleAdd' event.
  if (this.pending[id]) {
    return new PromiseCompat(function (resolve, reject) {
      this.once('placed', function(l, i) {
        this.get(l, i).then(resolve, reject);
      }.bind(this, lineage, id));
    }.bind(this));
  } else {
    this.pending[id] = true;
  }

  return this.loadManifest(id).then(function(manifest) {
    var constraints = this.overlay(this.defaultConstraints, manifest.constraints),
        runtime = this.findDestination(lineage, id, constraints),
        portId;
    if (runtime.local) {
      portId = this.isRunning(runtime, id, lineage,
                             constraints.isolation !== 'never');
      if(constraints.isolation !== 'always' && portId) {
        this.debug.info('Reused port ' + portId);
        delete this.pending[id];
        this.emit('placed');
        return runtime.manager.getPort(portId);
      } else {
        return new Module(id, manifest, lineage, this);
      }
    } else {
      // TODO: Create a port to go to the remote runtime.
      this.debug.error('Unexpected location selected for module placement');
      return false;
    }
  }.bind(this), function(err) {
    this.debug.error('Policy Error Resolving ' + id, err);
    throw(err);
  }.bind(this));
};

/**
 * Find the runtime destination for a module given its constraints and the
 * module creating it.
 * @method findDestination
 * @param {String[]} lineage The identity of the module creating this module.
 * @param {String] id The canonical url of the module
 * @param {Object} constraints Constraints for the module.
 * @returns {Object} The element of this.runtimes where the module should run.
 */
Policy.prototype.findDestination = function(lineage, id, constraints) {
  var i;

  // Step 1: if an instance already exists, the m
  if (constraints.isolation !== 'always') {
    for (i = 0; i < this.policies.length; i += 1) {
      if (this.isRunning(this.runtimes[i], id, lineage,
                         constraints.isolation !== 'never')) {
        return this.runtimes[i];
      }
    }
  }

  // Step 2: if the module wants stability, it may need to be remote.
  if (constraints.placement === 'local') {
    return this.runtimes[0];
  } else if (constraints.placement === 'stable') {
    for (i = 0; i < this.policies.length; i += 1) {
      if (this.policies[i].background) {
        return this.runtimes[i];
      }
    }
  }

  // Step 3: if the module needs longevity / interactivity, it may want to be remote.
  return this.runtimes[0];
};

/**
 * Determine if a known runtime is running an appropriate instance of a module.
 * @method isRunning
 * @param {Object} runtime The runtime to check.
 * @param {String} id The module to look for.
 * @param {String[]} from The identifier of the requesting module.
 * @param {Boolean} fullMatch If the module needs to be in the same app.
 * @returns {String|Boolean} The Module id if it is running, or false if not.
 */
Policy.prototype.isRunning = function(runtime, id, from, fullMatch) {
  var i = 0, j = 0, okay;
  for (i = 0; i < runtime.modules.length; i += 1) {
    if (fullMatch && runtime.modules[i].length === from.length + 1) {
      okay = true;
      for (j = 0; j < from.length; j += 1) {
        if (runtime.modules[i][j + 1].indexOf(from[j]) !== 0) {
          okay = false;
          break;
        }
      }
      if (runtime.modules[i][0].indexOf(id) !== 0) {
        okay = false;
      }

      if (okay) {
        return runtime.modules[i][0];
      }
    } else if (!fullMatch && runtime.modules[i][0].indexOf(id) === 0) {
      return runtime.modules[i][0];
    }
  }
  return false;
};

/**
 * Get a promise of the manifest for a module ID.
 * @method loadManifest
 * @param {String} manifest The canonical ID of the manifest
 * @returns {Promise} Promise for the json contents of the manifest.
 */
Policy.prototype.loadManifest = function(manifest) {
  return this.resource.getContents(manifest).then(function(data) {
    var resp = {};
    try {
      return JSON.parse(data);
    } catch(err) {
      this.debug.error("Failed to load " + manifest + ": " + err);
      throw new Error("No Manifest Available");
    }
  }.bind(this));
};

/**
 * Add a runtime to keep track of in this policy.
 * @method add
 * @param {fdom.port} port The port to use for module lifetime info
 * @param {Object} policy The policy of the runtime.
 */
Policy.prototype.add = function(port, policy) {
  var runtime = {
    manager: port,
    modules: []
  };
  this.runtimes.push(runtime);
  this.policies.push(this.overlay(this.defaultPolicy, policy));

  port.on('moduleAdd', function(runtime, info) {
    var lineage = [];
    lineage = lineage.concat(info.lineage);
    lineage[0] = info.id;
    runtime.modules.push(lineage);
    if (this.pending[info.lineage[0]]) {
      delete this.pending[info.lineage[0]];
      this.emit('placed');
    }
  }.bind(this, runtime));
  port.on('moduleRemove', function(runtime, info) {
    var lineage = [], i, modFingerprint;
    lineage = lineage.concat(info.lineage);
    lineage[0] = info.id;
    modFingerprint = lineage.toString();

    for (i = 0; i < runtime.modules.length; i += 1) {
      if (runtime.modules[i].toString() === modFingerprint) {
        runtime.modules.splice(i, 1);
        return;
      }
    }
    this.debug.warn('Unknown module to remove: ', info.id);
  }.bind(this, runtime));
};

/**
 * Overlay a specific policy or constraint instance on default settings.
 * TODO: consider making static.
 * @method overlay
 * @private
 * @param {Object} base The default object
 * @param {Object} overlay The superceeding object
 * @returns {Object} A new object with base parameters when not set in overlay.
 */
Policy.prototype.overlay = function(base, overlay) {
  var ret = {};

  util.mixin(ret, base);
  if (overlay) {
    util.mixin(ret, overlay, true);
  }
  return ret;
};

module.exports = Policy;

},{"./module":65,"./util":73,"es6-promise":1}],68:[function(require,module,exports){
/*jslint indent:2, node:true, sloppy:true, browser:true */
var Consumer = require('./consumer');
var util = require('./util');

/**
 * A freedom port for a user-accessable provider.
 * @class Provider
 * @implements Port
 * @uses handleEvents
 * @param {Object} def The interface of the provider.
 * @param {Debug} debug The debugger to use for logging.
 * @contructor
 */
var Provider = function (def, debug) {
  this.id = Consumer.nextId();
  util.handleEvents(this);
  this.debug = debug;
  
  this.definition = def;
  this.mode = Provider.mode.synchronous;
  this.channels = {};
  this.iface = null;
  this.providerCls = null;
  this.providerInstances = {};
};

/**
 * Provider modes of operation.
 * @property mode
 * @static
 * @type number
 */
Provider.mode = {
  synchronous: 0,
  asynchronous: 1,
  promises: 2
};

/**
 * Receive external messages for the provider.
 * @method onMessage
 * @param {String} source the source identifier of the message.
 * @param {Object} message The received message.
 */
Provider.prototype.onMessage = function (source, message) {
  if (source === 'control' && message.reverse) {
    this.channels[message.name] = message.channel;
    this.emit(message.channel, {
      type: 'channel announcement',
      channel: message.reverse
    });
    this.emit('start');
  } else if (source === 'control' && message.type === 'setup') {
    this.controlChannel = message.channel;
  } else if (source === 'control' && message.type === 'close') {
    if (message.channel === this.controlChannel) {
      delete this.controlChannel;
    }
    this.close();
  } else {
    if (!this.channels[source] && message.channel) {
      this.channels[source] = message.channel;
      this.emit('start');
      return;
    } else if (!this.channels[source]) {
      this.debug.warn('Message from unconfigured source: ' + source);
      return;
    }

    if (message.type === 'close' && message.to) {
      delete this.providerInstances[source][message.to];
    } else if (message.to && this.providerInstances[source] &&
               this.providerInstances[source][message.to]) {
      message.message.to = message.to;
      this.providerInstances[source][message.to](message.message);
    } else if (message.to && message.message &&
        message.message.type === 'construct') {
      var args = Consumer.portableToMessage(
          (this.definition.constructor && this.definition.constructor.value) ?
              this.definition.constructor.value : [],
          message.message,
          this.debug
        );
      if (!this.providerInstances[source]) {
        this.providerInstances[source] = {};
      }
      this.providerInstances[source][message.to] = this.getProvider(source, message.to, args);
    } else {
      this.debug.warn(this.toString() + ' dropping message ' +
          JSON.stringify(message));
    }
  }
};

/**
 * Close / teardown the flow this provider terminates.
 * @method close
 */
Provider.prototype.close = function () {
  if (this.controlChannel) {
    this.emit(this.controlChannel, {
      type: 'Provider Closing',
      request: 'close'
    });
    delete this.controlChannel;
  }
  this.emit('close');

  this.providerInstances = {};
  this.emitChannel = null;
};

/**
 * Get an interface to expose externally representing this port.
 * Providers are registered with the port using either
 * provideSynchronous or provideAsynchronous depending on the desired
 * return interface.
 * @method getInterface
 * @return {Object} The external interface of this Provider.
 */
Provider.prototype.getInterface = function () {
  if (this.iface) {
    return this.iface;
  } else {
    this.iface = {
      provideSynchronous: function (prov) {
        this.providerCls = prov;
        this.mode = Provider.mode.synchronous;
      }.bind(this),
      provideAsynchronous: function (prov) {
        this.providerCls = prov;
        this.mode = Provider.mode.asynchronous;
      }.bind(this),
      providePromises: function (prov) {
        this.providerCls = prov;
        this.mode = Provider.mode.promises;
      }.bind(this),
      close: function () {
        this.close();
      }.bind(this)
    };

    util.eachProp(this.definition, function (prop, name) {
      switch (prop.type) {
      case "constant":
        Object.defineProperty(this.iface, name, {
          value: Consumer.recursiveFreezeObject(prop.value),
          writable: false
        });
        break;
      }
    }.bind(this));

    return this.iface;
  }
};

/**
 * Create a function that can be used to get interfaces from this provider from
 * a user-visible point.
 * @method getProxyInterface
 */
Provider.prototype.getProxyInterface = function () {
  var func = function (p) {
    return p.getInterface();
  }.bind({}, this);

  func.close = function (iface) {
    if (iface) {
      util.eachProp(this.ifaces, function (candidate, id) {
        if (candidate === iface) {
          this.teardown(id);
          this.emit(this.emitChannel, {
            type: 'close',
            to: id
          });
          return true;
        }
      }.bind(this));
    } else {
      // Close the channel.
      this.close();
    }
  }.bind(this);

  func.onClose = function (iface, handler) {
    if (typeof iface === 'function' && handler === undefined) {
      // Add an on-channel-closed handler.
      this.once('close', iface);
      return;
    }

    util.eachProp(this.ifaces, function (candidate, id) {
      if (candidate === iface) {
        if (this.handlers[id]) {
          this.handlers[id].push(handler);
        } else {
          this.handlers[id] = [handler];
        }
        return true;
      }
    }.bind(this));
  }.bind(this);

  return func;
};

/**
 * Get a new instance of the registered provider.
 * @method getProvider
 * @param {String} source The port this instance is interactign with.
 * @param {String} identifier the messagable address for this provider.
 * @param {Array} args Constructor arguments for the provider.
 * @return {Function} A function to send messages to the provider.
 */
Provider.prototype.getProvider = function (source, identifier, args) {
  if (!this.providerCls) {
    this.debug.warn('Cannot instantiate provider, since it is not provided');
    return null;
  }

  var events = {},
    dispatchEvent,
    BoundClass,
    instance;

  util.eachProp(this.definition, function (prop, name) {
    if (prop.type === 'event') {
      events[name] = prop;
    }
  });

  dispatchEvent = function (src, ev, id, name, value) {
    if (ev[name]) {
      var streams = Consumer.messageToPortable(ev[name].value, value,
                                                   this.debug);
      this.emit(this.channels[src], {
        type: 'message',
        to: id,
        message: {
          name: name,
          type: 'event',
          text: streams.text,
          binary: streams.binary
        }
      });
    }
  }.bind(this, source, events, identifier);

  // this is all to say: new providerCls(dispatchEvent, args[0], args[1],...)
  BoundClass = this.providerCls.bind.apply(this.providerCls,
      [this.providerCls, dispatchEvent].concat(args || []));
  instance = new BoundClass();

  return function (port, src, msg) {
    if (msg.action === 'method') {
      if (typeof this[msg.type] !== 'function') {
        port.debug.warn("Provider does not implement " + msg.type + "()!");
        return;
      }
      var prop = port.definition[msg.type],
        debug = port.debug,
        args = Consumer.portableToMessage(prop.value, msg, debug),
        ret = function (src, msg, prop, resolve, reject) {
          var streams = Consumer.messageToPortable(prop.ret, resolve,
                                                       debug);
          this.emit(this.channels[src], {
            type: 'method',
            to: msg.to,
            message: {
              to: msg.to,
              type: 'method',
              reqId: msg.reqId,
              name: msg.type,
              text: streams.text,
              binary: streams.binary,
              error: reject
            }
          });
        }.bind(port, src, msg, prop);
      if (!Array.isArray(args)) {
        args = [args];
      }
      if (port.mode === Provider.mode.synchronous) {
        try {
          ret(this[msg.type].apply(this, args));
        } catch (e) {
          ret(undefined, e.message);
        }
      } else if (port.mode === Provider.mode.asynchronous) {
        this[msg.type].apply(instance, args.concat(ret));
      } else if (port.mode === Provider.mode.promises) {
        this[msg.type].apply(this, args).then(ret, ret.bind({}, undefined));
      }
    }
  }.bind(instance, this, source);
};

/**
 * Get a textual description of this port.
 * @method toString
 * @return {String} the description of this port.
 */
Provider.prototype.toString = function () {
  if (this.emitChannel) {
    return "[Provider " + this.emitChannel + "]";
  } else {
    return "[unbound Provider]";
  }
};

module.exports = Provider;

},{"./consumer":57,"./util":73}],69:[function(require,module,exports){
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */
var PromiseCompat = require('es6-promise').Promise;

var util = require('../util');
var Consumer = require('../consumer');

var ApiInterface = function(def, onMsg, emit, debug) {
  var inflight = {},
      events = null,
      emitter = null,
      reqId = 0,
      args = arguments;

  util.eachProp(def, function(prop, name) {
    switch(prop.type) {
    case 'method':
      this[name] = function() {
        // Note: inflight should be registered before message is passed
        // in order to prepare for synchronous in-window pipes.
        var thisReq = reqId,
            promise = new PromiseCompat(function(resolve, reject) {
              inflight[thisReq] = {
                resolve:resolve,
                reject:reject,
                template: prop.ret
              };
            }),
            streams = Consumer.messageToPortable(prop.value,
                Array.prototype.slice.call(arguments, 0),
                debug);
        reqId += 1;
        emit({
          action: 'method',
          type: name,
          reqId: thisReq,
          text: streams.text,
          binary: streams.binary
        });
        return promise;
      };
      break;
    case 'event':
      if(!events) {
        util.handleEvents(this);
        emitter = this.emit;
        delete this.emit;
        events = {};
      }
      events[name] = prop;
      break;
    case 'constant':
      Object.defineProperty(this, name, {
        value: Consumer.recursiveFreezeObject(prop.value),
        writable: false
      });
      break;
    }
  }.bind(this));

  onMsg(this, function(type, msg) {
    if (type === 'close') {
      this.off();
      delete this.inflight;
      return;
    }
    if (!msg) {
      return;
    }
    if (msg.type === 'method') {
      if (inflight[msg.reqId]) {
        var resolver = inflight[msg.reqId],
            template = resolver.template;
        delete inflight[msg.reqId];
        if (msg.error) {
          resolver.reject(msg.error);
        } else {
          resolver.resolve(Consumer.portableToMessage(template, msg, debug));
        }
      } else {
        debug.error('Incoming message claimed to be an RPC ' +
                         'returning for unregistered call', msg.reqId);
      }
    } else if (msg.type === 'event') {
      if (events[msg.name]) {
        emitter(msg.name, Consumer.portableToMessage(events[msg.name].value,
                msg, debug));
      }
    }
  }.bind(this));

  args = Consumer.messageToPortable(
      (def.constructor && def.constructor.value) ? def.constructor.value : [],
      Array.prototype.slice.call(args, 4),
      debug);

  emit({
    type: 'construct',
    text: args.text,
    binary: args.binary
  });
};

module.exports = ApiInterface;

},{"../consumer":57,"../util":73,"es6-promise":1}],70:[function(require,module,exports){
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */
var util = require('../util');

var EventInterface = function(onMsg, emit, debug) {
  util.handleEvents(this);
  
  onMsg(this, function(emit, type, msg) {
    emit(msg.type, msg.message);
  }.bind(this, this.emit));

  this.emit = function(emitter, type, msg) {
    emitter({type: type, message: msg}, true);
  }.bind({}, emit);
};

module.exports = EventInterface;

},{"../util":73}],71:[function(require,module,exports){
/*jslint indent:2, node:true */
var PromiseCompat = require('es6-promise').Promise;

var ApiInterface = require('./proxy/apiInterface');
var EventInterface = require('./proxy/eventInterface');
var Consumer = require('./consumer');
var Provider = require('./provider');

/**
 * A Proxy Binder manages the external interface, and creates one of
 * the different types of objects exposed by freedom either as a global
 * within a worker / module context, or returned by an external call to
 * create a freedom runtime.
 * @Class ProxyBinder
 * @param {Manager} manager The manager for the active runtime.
 */
var ProxyBinder = function (manager) {
  'use strict';
  this.manager = manager;
};

/**
 * Create a proxy for a freedom port, and return it once loaded.
 * @method getExternal
 * @param {Port} port The port for the proxy to communicate with.
 * @param {String} name The name of the proxy.
 * @param {Object} [definition] The definition of the API to expose.
 * @param {String} definition.name The name of the API.
 * @param {Object} definition.definition The definition of the API.
 * @param {Boolean} definition.provides Whether this is a consumer or provider.
 * @returns {Promise} A promise for the active proxy interface.
 */
ProxyBinder.prototype.getExternal = function (port, name, definition) {
  'use strict';
  var proxy, api;
  return new PromiseCompat(function (resolve, reject) {
    if (definition) {
      api = definition.name;
      if (definition.provides) {
        proxy = new Provider(definition.definition, this.manager.debug);
      } else {
        proxy = new Consumer(ApiInterface.bind({},
            definition.definition),
            this.manager.debug);
      }
    } else {
      proxy = new Consumer(EventInterface, this.manager.debug);
    }

    proxy.once('start', function () {
      var iface = proxy.getProxyInterface();
      if (api) {
        iface.api = api;
      }
      resolve({
        port: proxy,
        external: iface
      });
    });

    this.manager.createLink(port, name, proxy);
  }.bind(this));
};

/**
 * Bind the default proxy for a freedom port.
 * @method bindDefault
 * @param {Port} port The port for the proxy to communicate with.
 * @param {Api} api The API loader with API definitions.
 * @param {Object} manifest The manifest of the module to expose.
 * @param {Boolean} internal Whether the interface is for inside the module.
 * @returns {Promise} A promise for a proxy interface.
 * @private
 */
ProxyBinder.prototype.bindDefault = function (port, api, manifest, internal) {
  'use strict';
  var metadata = {
    name: manifest.name,
    icon: manifest.icon,
    description: manifest.description
  }, def;

  if (manifest['default']) {
    def = api.get(manifest['default']);
    if (!def && manifest.api && manifest.api[manifest['default']]) {
      def = {
        name: manifest['default'],
        definition: manifest.api[manifest['default']]
      };
    }
    if (internal && manifest.provides &&
        manifest.provides.indexOf(manifest['default']) !== false) {
      def.provides = true;
    } else if (internal) {
      api.debug.warn("default API not provided, " +
                     "are you missing a provides key in your manifest?");
    }
  }

  return this.getExternal(port, 'default', def).then(
    function (metadata, info) {
      info.external.manifest = metadata;
      return info;
    }.bind(this, metadata)
  );
};

module.exports = ProxyBinder;

},{"./consumer":57,"./provider":68,"./proxy/apiInterface":69,"./proxy/eventInterface":70,"es6-promise":1}],72:[function(require,module,exports){
/*globals XMLHttpRequest */
/*jslint indent:2,node:true,sloppy:true */
var PromiseCompat = require('es6-promise').Promise;

var util = require('./util');

/**
 * The Resource registry for FreeDOM.  Used to look up requested Resources,
 * and provide lookup and migration of resources.
 * @Class Resource
 * @param {Debug} debug The logger to use for debugging.
 * @constructor
 */
var Resource = function (debug) {
  this.debug = debug;
  this.files = {};
  this.resolvers = [this.httpResolver, this.nullResolver];
  this.contentRetrievers = {
    'http': this.xhrRetriever,
    'https': this.xhrRetriever,
    'chrome-extension': this.xhrRetriever,
    'resource': this.xhrRetriever,
    'chrome': this.xhrRetriever,
    'app': this.xhrRetriever,
    'manifest': this.manifestRetriever
  };
};

/**
 * Resolve a resurce URL requested from a module.
 * @method get
 * @param {String} manifest The canonical address of the module requesting.
 * @param {String} url The resource to get.
 * @returns {Promise} A promise for the resource address.
 */
Resource.prototype.get = function (manifest, url) {
  var key = JSON.stringify([manifest, url]);
  
  return new PromiseCompat(function (resolve, reject) {
    if (this.files[key]) {
      resolve(this.files[key]);
    } else {
      this.resolve(manifest, url).then(function (key, resolve, address) {
        this.files[key] = address;
        //fdom.debug.log('Resolved ' + key + ' to ' + address);
        resolve(address);
      }.bind(this, key, resolve), reject);
    }
  }.bind(this));
};

/**
 * Get the contents of a resource.
 * @method getContents
 * @param {String} url The resource to read.
 * @returns {Promise} A promise for the resource contents.
 */
Resource.prototype.getContents = function (url) {
  return new PromiseCompat(function (resolve, reject) {
    var prop;
    if (!url) {
      this.debug.warn("Asked to get contents of undefined URL.");
      return reject();
    }
    for (prop in this.contentRetrievers) {
      if (this.contentRetrievers.hasOwnProperty(prop)) {
        if (url.indexOf(prop + "://") === 0) {
          return this.contentRetrievers[prop].call(this, url, resolve, reject);
        } else if (url.indexOf("://") === -1 && prop === "null") {
          return this.contentRetrievers[prop].call(this, url, resolve, reject);
        }
      }
    }
    reject();
  }.bind(this));
};

/**
 * Return a promise that resolves when the first of an array of promises
 * resolves, or rejects after all promises reject. Can be thought of as
 * the missing 'Promise.any' - race is no good, since early rejections
 * preempt a subsequent resolution.
 * @private
 * @static
 * @method FirstPromise
 * @param {Promise[]} Promises to select from
 * @returns {Promise} Promise resolving with a value from arguments.
 */
var firstPromise = function(promises) {
  return new PromiseCompat(function(resolve, reject) {
    var errors = [];
    promises.forEach(function(promise) {
      promise.then(resolve, function(err) {
        errors.push(err);
        if (errors.length === promises.length) {
          reject(errors);
        }
      });
    });
  });
};

/**
 * Resolve a resource using known resolvers. Unlike get, resolve does
 * not cache resolved resources.
 * @method resolve
 * @private
 * @param {String} manifest The module requesting the resource.
 * @param {String} url The resource to resolve;
 * @returns {Promise} A promise for the resource address.
 */
Resource.prototype.resolve = function (manifest, url) {
  return new PromiseCompat(function (resolve, reject) {
    var promises = [];
    if (url === undefined) {
      return reject();
    }
    util.eachReverse(this.resolvers, function (resolver) {
      promises.push(new PromiseCompat(resolver.bind({}, manifest, url)));
    }.bind(this));
    firstPromise(promises).then(resolve, function() {
      reject('No resolvers to handle url: ' + JSON.stringify([manifest, url]));
    });
  }.bind(this));
};

/**
 * Register resolvers: code that knows how to get resources
 * needed by the runtime. A resolver will be called with four
 * arguments: the absolute manifest of the requester, the
 * resource being requested, and a resolve / reject pair to
 * fulfill a promise.
 * @method addResolver
 * @param {Function} resolver The resolver to add.
 */
Resource.prototype.addResolver = function (resolver) {
  this.resolvers.push(resolver);
};

/**
 * Register retrievers: code that knows how to load resources
 * needed by the runtime. A retriever will be called with a URL
 * to retrieve with a protocol that it is able to handle.
 * @method addRetriever
 * @param {String} proto The protocol to register for.
 * @param {Function} retriever The retriever to add.
 */
Resource.prototype.addRetriever = function (proto, retriever) {
  if (this.contentRetrievers[proto]) {
    this.debug.warn("Unwilling to override file retrieval for " + proto);
    return;
  }
  this.contentRetrievers[proto] = retriever;
};

/**
 * Register external resolvers and retreavers
 * @method register
 * @param {{"proto":String, "resolver":Function, "retreaver":Function}[]}
 *     resolvers The list of retreivers and resolvers.
 */
Resource.prototype.register = function (resolvers) {
  if (!resolvers.length) {
    return;
  }

  resolvers.forEach(function (item) {
    if (item.resolver) {
      this.addResolver(item.resolver);
    } else if (item.proto && item.retriever) {
      this.addRetriever(item.proto, item.retriever);
    }
  }.bind(this));
};

/**
 * Determine if a URL is an absolute URL of a given Scheme.
 * @method hasScheme
 * @static
 * @private
 * @param {String[]} protocols Whitelisted protocols
 * @param {String} URL the URL to match.
 * @returns {Boolean} If the URL is an absolute example of one of the schemes.
 */
Resource.hasScheme = function (protocols, url) {
  var i;
  for (i = 0; i < protocols.length; i += 1) {
    if (url.indexOf(protocols[i] + "://") === 0) {
      return true;
    }
  }
  return false;
};

/**
 * Remove './' and '../' from a URL
 * Required because Chrome Apps for Mobile (cca) doesn't understand
 * XHR paths with these relative components in the URL.
 * @method removeRelativePath
 * @param {String} url The URL to modify
 * @returns {String} url without './' and '../'
 **/
Resource.removeRelativePath = function (url) {
  var idx = url.indexOf("://") + 3,
    stack,
    toRemove,
    result;
  // Remove all instances of /./
  url = url.replace(/\/\.\//g, "/");
  //Weird bug where in cca, manifest starts with 'chrome:////'
  //This forces there to only be 2 slashes
  while (url.charAt(idx) === "/") {
    url = url.slice(0, idx) + url.slice(idx + 1, url.length);
  }

  // Advance to next /
  idx = url.indexOf("/", idx);
  // Removing ../
  stack = url.substr(idx + 1).split("/");
  while (stack.indexOf("..") !== -1) {
    toRemove = stack.indexOf("..");
    if (toRemove === 0) {
      stack.shift();
    } else {
      stack.splice((toRemove - 1), 2);
    }
  }
  
  //Rebuild string
  result = url.substr(0, idx);
  for (idx = 0; idx < stack.length; idx += 1) {
    result += "/" + stack[idx];
  }
  return result;
};

/**
 * Resolve URLs which can be accessed using standard HTTP requests.
 * @method httpResolver
 * @private
 * @param {String} manifest The Manifest URL.
 * @param {String} url The URL to resolve.
 * @param {Function} resolve The promise to complete.
 * @param {Function} reject The promise to reject.
 * @returns {Boolean} True if the URL could be resolved.
 */
Resource.prototype.httpResolver = function (manifest, url, resolve, reject) {
  var protocols = ["http", "https", "chrome", "chrome-extension", "resource",
                   "app"],
    dirname,
    protocolIdx,
    pathIdx,
    path,
    base,
    result;

  if (Resource.hasScheme(protocols, url)) {
    resolve(Resource.removeRelativePath(url));
    return true;
  }
  
  if (!manifest) {
    reject();
    return false;
  }
  if (Resource.hasScheme(protocols, manifest) &&
      url.indexOf("://") === -1) {
    dirname = manifest.substr(0, manifest.lastIndexOf("/"));
    protocolIdx = dirname.indexOf("://");
    pathIdx = protocolIdx + 3 + dirname.substr(protocolIdx + 3).indexOf("/");
    path = dirname.substr(pathIdx);
    base = dirname.substr(0, pathIdx);
    if (url.indexOf("/") === 0) {
      resolve(Resource.removeRelativePath(base + url));
    } else {
      resolve(Resource.removeRelativePath(base + path + "/" + url));
    }
    return true;
  }
  reject();
};

/**
 * Resolve URLs which are self-describing.
 * @method nullResolver
 * @private
 * @param {String} manifest The Manifest URL.
 * @param {String} url The URL to resolve.
 * @param {Function} resolve The promise to complete.
 * @param {Function} reject The promise to reject.
 * @returns {Boolean} True if the URL could be resolved.
 */
Resource.prototype.nullResolver = function (manifest, url, resolve, reject) {
  var protocols = ["manifest"];
  if (Resource.hasScheme(protocols, url)) {
    resolve(url);
    return true;
  } else if (url.indexOf('data:') === 0) {
    resolve(url);
    return true;
  }
  reject();
};

/**
 * Retrieve manifest content from a self-descriptive manifest url.
 * These urls are used to reference a manifest without requiring subsequent,
 * potentially non-CORS requests.
 * @method manifestRetriever
 * @private
 * @param {String} manifest The Manifest URL
 * @param {Function} resolve The promise to complete.
 * @param {Function} reject The promise to reject.
 */
Resource.prototype.manifestRetriever = function (manifest, resolve, reject) {
  var data;
  try {
    data = manifest.substr(11);
    JSON.parse(data);
    resolve(data);
  } catch (e) {
    this.debug.warn("Invalid manifest URL referenced:" + manifest);
    reject();
  }
};

/**
 * Retrieve resource contents using an XHR request.
 * @method xhrRetriever
 * @private
 * @param {String} url The resource to fetch.
 * @param {Function} resolve The promise to complete.
 * @param {Function} reject The promise to reject.
 */
Resource.prototype.xhrRetriever = function (url, resolve, reject) {
  var ref = new XMLHttpRequest();
  ref.addEventListener("readystatechange", function (resolve, reject) {
    if (ref.readyState === 4 && ref.responseText) {
      resolve(ref.responseText);
    } else if (ref.readyState === 4) {
      this.debug.warn("Failed to load file " + url + ": " + ref.status);
      reject(ref.status);
    }
  }.bind(this, resolve, reject), false);
  ref.overrideMimeType("application/json");
  ref.open("GET", url, true);
  ref.send();
};

module.exports = Resource;

},{"./util":73,"es6-promise":1}],73:[function(require,module,exports){
/*globals crypto, WebKitBlobBuilder, Blob, URL */
/*globals webkitURL, Uint8Array, Uint16Array, ArrayBuffer */
/*jslint indent:2,white:true,browser:true,node:true,sloppy:true */

/**
 * Utility method used within the freedom Library.
 * @class util
 * @static
 */
var util = {};


/**
 * Helper function for iterating over an array backwards. If the func
 * returns a true value, it will break out of the loop.
 * @method eachReverse
 * @static
 */
util.eachReverse = function(ary, func) {
  if (ary) {
    var i;
    for (i = ary.length - 1; i > -1; i -= 1) {
      if (ary[i] && func(ary[i], i, ary)) {
        break;
      }
    }
  }
};

/**
 * @method hasProp
 * @static
 */
util.hasProp = function(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
};

/**
 * Cycles over properties in an object and calls a function for each
 * property value. If the function returns a truthy value, then the
 * iteration is stopped.
 * @method eachProp
 * @static
 */
util.eachProp = function(obj, func) {
  var prop;
  for (prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      if (func(obj[prop], prop)) {
        break;
      }
    }
  }
};

/**
 * Simple function to mix in properties from source into target,
 * but only if target does not already have a property of the same name.
 * This is not robust in IE for transferring methods that match
 * Object.prototype names, but the uses of mixin here seem unlikely to
 * trigger a problem related to that.
 * @method mixin
 * @static
 */
util.mixin = function(target, source, force) {
  if (source) {
    util.eachProp(source, function (value, prop) {
      if (force || !util.hasProp(target, prop)) {
        target[prop] = value;
      }
    });
  }
  return target;
};

/**
 * Get a unique ID.
 * @method getId
 * @static
 */
util.getId = function() {
  var guid = 'guid',
      domain = 12,
      buffer;
  // Chrome / Firefox.
  if (typeof crypto === 'object' && crypto.getRandomValues) {
    buffer = new Uint8Array(domain);
    crypto.getRandomValues(buffer);
    util.eachReverse(buffer, function(n) {
      guid += '-' + n;
    });
  // Node
  } else if (typeof crypto === 'object' && crypto.randomBytes) {
    buffer = crypto.randomBytes(domain);
    util.eachReverse(buffer, function(n) {
      guid += '-' + n;
    });
  } else {
    while (domain > 0) {
      guid += '-' + Math.ceil(255 * Math.random());
      domain -= 1;
    }
  }

  return guid;
};

/**
 * Encode a string into a binary array buffer, by treating each character as a
 * utf16 encoded character - the native javascript encoding.
 * @method str2ab
 * @static
 * @param {String} str The string to encode.
 * @returns {ArrayBuffer} The encoded string.
 */
util.str2ab = function(str) {
  var length = str.length,
      buffer = new ArrayBuffer(length * 2), // 2 bytes for each char
      bufferView = new Uint16Array(buffer),
      i;
  for (i = 0; i < length; i += 1) {
    bufferView[i] = str.charCodeAt(i);
  }

  return buffer;
};

/**
 * Convert an array buffer containing an encoded string back into a string.
 * @method ab2str
 * @static
 * @param {ArrayBuffer} buffer The buffer to unwrap.
 * @returns {String} The decoded buffer.
 */
util.ab2str = function(buffer) {
  return String.fromCharCode.apply(null, new Uint16Array(buffer));
};

/**
 * Add 'on' and 'emit' methods to an object, which act as a light weight
 * event handling structure.
 * @class handleEvents
 * @static
 */
util.handleEvents = function(obj) {
  var eventState = {
    multiple: {},
    maybemultiple: [],
    single: {},
    maybesingle: []
  }, filter, push;

  /**
   * Filter a list based on a predicate. The list is filtered in place, with
   * selected items removed and returned by the function.
   * @method
   * @param {Array} list The list to filter
   * @param {Function} predicate The method to run on each item.
   * @returns {Array} Selected items
   */
  filter = function(list, predicate) {
    var ret = [], i;

    if (!list || !list.length) {
      return [];
    }

    for (i = list.length - 1; i >= 0; i -= 1) {
      if (predicate(list[i])) {
        ret.push(list.splice(i, 1));
      }
    }
    return ret;
  };

  /**
   * Enqueue a handler for a specific type.
   * @method
   * @param {String} to The queue ('single' or 'multiple') to queue on.
   * @param {String} type The type of event to wait for.
   * @param {Function} handler The handler to enqueue.
   */
  push = function(to, type, handler) {
    if (typeof type === 'function') {
      this['maybe' + to].push([type, handler]);
    } else if (this[to][type]) {
      this[to][type].push(handler);
    } else {
      this[to][type] = [handler];
    }
  };

  /**
   * Register a method to be executed when an event of a specific type occurs.
   * @method on
   * @param {String|Function} type The type of event to register against.
   * @param {Function} handler The handler to run when the event occurs.
   */
  obj.on = push.bind(eventState, 'multiple');

  /**
   * Register a method to be execute the next time an event occurs.
   * @method once
   * @param {String|Function} type The type of event to wait for.
   * @param {Function} handler The handler to run the next time a matching event
   *     is raised.
   */
  obj.once = push.bind(eventState, 'single');

  /**
   * Emit an event on this object.
   * @method emit
   * @param {String} type The type of event to raise.
   * @param {Object} data The payload of the event.
   */
  obj.emit = function(type, data) {
    var i, queue;
    if (this.multiple[type]) {
      for (i = 0; i < this.multiple[type].length; i += 1) {
        if (this.multiple[type][i](data) === false) {
          return;
        }
      }
    }
    if (this.single[type]) {
      queue = this.single[type];
      this.single[type] = [];
      for (i = 0; i < queue.length; i += 1) {
        queue[i](data);
      }
    }
    for (i = 0; i < this.maybemultiple.length; i += 1) {
      if (this.maybemultiple[i][0](type, data)) {
        this.maybemultiple[i][1](data);
      }
    }
    for (i = this.maybesingle.length - 1; i >= 0; i -= 1) {
      if (this.maybesingle[i][0](type, data)) {
        queue = this.maybesingle.splice(i, 1);
        queue[0][1](data);
      }
    }
  }.bind(eventState);

  /**
   * Remove an event handler
   * @method off
   * @param {String} type The type of event to remove.
   * @param {Function?} handler The handler to remove.
   */
  obj.off = function(type, handler) {
    if (!type) {
      this.multiple = {};
      this.maybemultiple = [];
      this.single = {};
      this.maybesingle = [];
      return;
    }

    if (typeof type === 'function') {
      filter(this.maybesingle, function(item) {
        return item[0] === type && (!handler || item[1] === handler);
      });
      filter(this.maybemultiple, function(item) {
        return item[0] === type && (!handler || item[1] === handler);
      });
    }

    if (!handler) {
      delete this.multiple[type];
      delete this.single[type];
    } else {
      filter(this.multiple[type], function(item) {
        return item === handler;
      });
      filter(this.single[type], function(item) {
        return item === handler;
      });
    }
  }.bind(eventState);
};

/**
 * When run without a window, or specifically requested.
 * Note: Declaration can be redefined in forceModuleContext below.
 * @method isModuleContext
 * @for util
 * @static
 */
/*!@preserve StartModuleContextDeclaration*/
util.isModuleContext = function() {
  return (typeof document === 'undefined');
};

/**
 * Get a Blob object of a string.
 * Polyfills implementations which don't have a current Blob constructor, like
 * phantomjs.
 * @method getBlob
 * @static
 */
util.getBlob = function(data, type) {
  if (typeof Blob !== 'function' && typeof WebKitBlobBuilder !== 'undefined') {
    var builder = new WebKitBlobBuilder();
    builder.append(data);
    return builder.getBlob(type);
  } else {
    return new Blob([data], {type: type});
  }
};

/**
 * Find all scripts on the given page.
 * @method scripts
 * @static
 */
util.scripts = function(global) {
  return global.document.getElementsByTagName('script');
};

module.exports = util;

},{}]},{},[40,41,42,43,44,45,46,47,48,49,50,51,52,53,27,28,29,30,31,32,33,34,35,36,37,38,39])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9jb21tb25qcy9tYWluLmpzIiwibm9kZV9tb2R1bGVzL2VzNi1wcm9taXNlL2Rpc3QvY29tbW9uanMvcHJvbWlzZS9hbGwuanMiLCJub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9jb21tb25qcy9wcm9taXNlL2FzYXAuanMiLCJub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9jb21tb25qcy9wcm9taXNlL2NvbmZpZy5qcyIsIm5vZGVfbW9kdWxlcy9lczYtcHJvbWlzZS9kaXN0L2NvbW1vbmpzL3Byb21pc2UvcG9seWZpbGwuanMiLCJub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9jb21tb25qcy9wcm9taXNlL3Byb21pc2UuanMiLCJub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9jb21tb25qcy9wcm9taXNlL3JhY2UuanMiLCJub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9jb21tb25qcy9wcm9taXNlL3JlamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9lczYtcHJvbWlzZS9kaXN0L2NvbW1vbmpzL3Byb21pc2UvcmVzb2x2ZS5qcyIsIm5vZGVfbW9kdWxlcy9lczYtcHJvbWlzZS9kaXN0L2NvbW1vbmpzL3Byb21pc2UvdXRpbHMuanMiLCJub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9ub2RlLWpzb24tbWluaWZ5L2pzb24ubWluaWZ5LmpzIiwicHJvdmlkZXJzL2NvcmUvY29uc29sZS51bnByaXZpbGVnZWQuanMiLCJwcm92aWRlcnMvY29yZS9jb3JlLm9hdXRoLmpzIiwicHJvdmlkZXJzL2NvcmUvY29yZS51bnByaXZpbGVnZWQuanMiLCJwcm92aWRlcnMvY29yZS9jb3JlLnZpZXcuanMiLCJwcm92aWRlcnMvY29yZS9lY2hvLnVucHJpdmlsZWdlZC5qcyIsInByb3ZpZGVycy9jb3JlL3BlZXJjb25uZWN0aW9uLnVucHJpdmlsZWdlZC5qcyIsInByb3ZpZGVycy9jb3JlL3N0b3JhZ2UubG9jYWxzdG9yYWdlLmpzIiwicHJvdmlkZXJzL2NvcmUvd2Vic29ja2V0LnVucHJpdmlsZWdlZC5qcyIsInByb3ZpZGVycy9zb2NpYWwvbG9vcGJhY2svc29jaWFsLmxvb3BiYWNrLmpzIiwicHJvdmlkZXJzL3NvY2lhbC93ZWJzb2NrZXQtc2VydmVyL3NvY2lhbC53cy5qcyIsInByb3ZpZGVycy9zdG9yYWdlL2lzb2xhdGVkL3N0b3JhZ2UuaXNvbGF0ZWQuanMiLCJwcm92aWRlcnMvc3RvcmFnZS9zaGFyZWQvc3RvcmFnZS5zaGFyZWQuanMiLCJwcm92aWRlcnMvdHJhbnNwb3J0L3dlYnJ0Yy90cmFuc3BvcnQud2VicnRjLmpzIiwic3BlYy9wcm92aWRlcnMvY29yZS9jb25zb2xlLnVuaXQuc3BlYy5qcyIsInNwZWMvcHJvdmlkZXJzL2NvcmUvY29yZS51bml0LnNwZWMuanMiLCJzcGVjL3Byb3ZpZGVycy9jb3JlL2VjaG8udW5pdC5zcGVjLmpzIiwic3BlYy9wcm92aWRlcnMvY29yZS9vYXV0aC51bml0LnNwZWMuanMiLCJzcGVjL3Byb3ZpZGVycy9jb3JlL3BlZXJjb25uZWN0aW9uLnVuaXQuc3BlYy5qcyIsInNwZWMvcHJvdmlkZXJzL2NvcmUvc3RvcmFnZS51bml0LnNwZWMuanMiLCJzcGVjL3Byb3ZpZGVycy9jb3JlL3ZpZXcudW5pdC5zcGVjLmpzIiwic3BlYy9wcm92aWRlcnMvY29yZS93ZWJzb2NrZXQudW5pdC5zcGVjLmpzIiwic3BlYy9wcm92aWRlcnMvc29jaWFsL3NvY2lhbC5sb29wYmFjay51bml0LnNwZWMuanMiLCJzcGVjL3Byb3ZpZGVycy9zb2NpYWwvc29jaWFsLndzLnVuaXQuc3BlYy5qcyIsInNwZWMvcHJvdmlkZXJzL3N0b3JhZ2Uvc3RvcmFnZS5pc29sYXRlZC51bml0LnNwZWMuanMiLCJzcGVjL3Byb3ZpZGVycy9zdG9yYWdlL3N0b3JhZ2Uuc2hhcmVkLnVuaXQuc3BlYy5qcyIsInNwZWMvcHJvdmlkZXJzL3RyYW5zcG9ydC90cmFuc3BvcnQud2VicnRjLnVuaXQuc3BlYy5qcyIsInNwZWMvc3JjL2FwaS5zcGVjLmpzIiwic3BlYy9zcmMvY29uc3VtZXIuc3BlYy5qcyIsInNwZWMvc3JjL2RlYnVnLnNwZWMuanMiLCJzcGVjL3NyYy9mcmVlZG9tLnNwZWMuanMiLCJzcGVjL3NyYy9mcmVlZG9tTW9kdWxlLnNwZWMuanMiLCJzcGVjL3NyYy9odWIuc3BlYy5qcyIsInNwZWMvc3JjL21hbmFnZXIuc3BlYy5qcyIsInNwZWMvc3JjL21vZHVsZS5zcGVjLmpzIiwic3BlYy9zcmMvbW9kdWxlSW50ZXJuYWwuc3BlYy5qcyIsInNwZWMvc3JjL3BvbGljeS5zcGVjLmpzIiwic3BlYy9zcmMvcHJvdmlkZXIuc3BlYy5qcyIsInNwZWMvc3JjL3Byb3h5QVBJSW50ZXJmYWNlLnNwZWMuanMiLCJzcGVjL3NyYy9yZXNvdXJjZS5zcGVjLmpzIiwic3BlYy9zcmMvdXRpbC5zcGVjLmpzIiwic3BlYy91dGlsLmpzIiwic3JjL2FwaS5qcyIsInNyYy9idW5kbGUuanMiLCJzcmMvY29uc3VtZXIuanMiLCJzcmMvZGVidWcuanMiLCJzcmMvZW50cnkuanMiLCJzcmMvaHViLmpzIiwic3JjL2xpbmsuanMiLCJzcmMvbGluay9kaXJlY3QuanMiLCJzcmMvbGluay9mcmFtZS5qcyIsInNyYy9tYW5hZ2VyLmpzIiwic3JjL21vZHVsZS5qcyIsInNyYy9tb2R1bGVpbnRlcm5hbC5qcyIsInNyYy9wb2xpY3kuanMiLCJzcmMvcHJvdmlkZXIuanMiLCJzcmMvcHJveHkvYXBpSW50ZXJmYWNlLmpzIiwic3JjL3Byb3h5L2V2ZW50SW50ZXJmYWNlLmpzIiwic3JjL3Byb3h5YmluZGVyLmpzIiwic3JjL3Jlc291cmNlLmpzIiwic3JjL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbFVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM1FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqYUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBQcm9taXNlID0gcmVxdWlyZShcIi4vcHJvbWlzZS9wcm9taXNlXCIpLlByb21pc2U7XG52YXIgcG9seWZpbGwgPSByZXF1aXJlKFwiLi9wcm9taXNlL3BvbHlmaWxsXCIpLnBvbHlmaWxsO1xuZXhwb3J0cy5Qcm9taXNlID0gUHJvbWlzZTtcbmV4cG9ydHMucG9seWZpbGwgPSBwb2x5ZmlsbDsiLCJcInVzZSBzdHJpY3RcIjtcbi8qIGdsb2JhbCB0b1N0cmluZyAqL1xuXG52YXIgaXNBcnJheSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLmlzQXJyYXk7XG52YXIgaXNGdW5jdGlvbiA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLmlzRnVuY3Rpb247XG5cbi8qKlxuICBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGlzIGZ1bGZpbGxlZCB3aGVuIGFsbCB0aGUgZ2l2ZW4gcHJvbWlzZXMgaGF2ZSBiZWVuXG4gIGZ1bGZpbGxlZCwgb3IgcmVqZWN0ZWQgaWYgYW55IG9mIHRoZW0gYmVjb21lIHJlamVjdGVkLiBUaGUgcmV0dXJuIHByb21pc2VcbiAgaXMgZnVsZmlsbGVkIHdpdGggYW4gYXJyYXkgdGhhdCBnaXZlcyBhbGwgdGhlIHZhbHVlcyBpbiB0aGUgb3JkZXIgdGhleSB3ZXJlXG4gIHBhc3NlZCBpbiB0aGUgYHByb21pc2VzYCBhcnJheSBhcmd1bWVudC5cblxuICBFeGFtcGxlOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgdmFyIHByb21pc2UxID0gUlNWUC5yZXNvbHZlKDEpO1xuICB2YXIgcHJvbWlzZTIgPSBSU1ZQLnJlc29sdmUoMik7XG4gIHZhciBwcm9taXNlMyA9IFJTVlAucmVzb2x2ZSgzKTtcbiAgdmFyIHByb21pc2VzID0gWyBwcm9taXNlMSwgcHJvbWlzZTIsIHByb21pc2UzIF07XG5cbiAgUlNWUC5hbGwocHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24oYXJyYXkpe1xuICAgIC8vIFRoZSBhcnJheSBoZXJlIHdvdWxkIGJlIFsgMSwgMiwgMyBdO1xuICB9KTtcbiAgYGBgXG5cbiAgSWYgYW55IG9mIHRoZSBgcHJvbWlzZXNgIGdpdmVuIHRvIGBSU1ZQLmFsbGAgYXJlIHJlamVjdGVkLCB0aGUgZmlyc3QgcHJvbWlzZVxuICB0aGF0IGlzIHJlamVjdGVkIHdpbGwgYmUgZ2l2ZW4gYXMgYW4gYXJndW1lbnQgdG8gdGhlIHJldHVybmVkIHByb21pc2VzJ3NcbiAgcmVqZWN0aW9uIGhhbmRsZXIuIEZvciBleGFtcGxlOlxuXG4gIEV4YW1wbGU6XG5cbiAgYGBgamF2YXNjcmlwdFxuICB2YXIgcHJvbWlzZTEgPSBSU1ZQLnJlc29sdmUoMSk7XG4gIHZhciBwcm9taXNlMiA9IFJTVlAucmVqZWN0KG5ldyBFcnJvcihcIjJcIikpO1xuICB2YXIgcHJvbWlzZTMgPSBSU1ZQLnJlamVjdChuZXcgRXJyb3IoXCIzXCIpKTtcbiAgdmFyIHByb21pc2VzID0gWyBwcm9taXNlMSwgcHJvbWlzZTIsIHByb21pc2UzIF07XG5cbiAgUlNWUC5hbGwocHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24oYXJyYXkpe1xuICAgIC8vIENvZGUgaGVyZSBuZXZlciBydW5zIGJlY2F1c2UgdGhlcmUgYXJlIHJlamVjdGVkIHByb21pc2VzIVxuICB9LCBmdW5jdGlvbihlcnJvcikge1xuICAgIC8vIGVycm9yLm1lc3NhZ2UgPT09IFwiMlwiXG4gIH0pO1xuICBgYGBcblxuICBAbWV0aG9kIGFsbFxuICBAZm9yIFJTVlBcbiAgQHBhcmFtIHtBcnJheX0gcHJvbWlzZXNcbiAgQHBhcmFtIHtTdHJpbmd9IGxhYmVsXG4gIEByZXR1cm4ge1Byb21pc2V9IHByb21pc2UgdGhhdCBpcyBmdWxmaWxsZWQgd2hlbiBhbGwgYHByb21pc2VzYCBoYXZlIGJlZW5cbiAgZnVsZmlsbGVkLCBvciByZWplY3RlZCBpZiBhbnkgb2YgdGhlbSBiZWNvbWUgcmVqZWN0ZWQuXG4qL1xuZnVuY3Rpb24gYWxsKHByb21pc2VzKSB7XG4gIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gIHZhciBQcm9taXNlID0gdGhpcztcblxuICBpZiAoIWlzQXJyYXkocHJvbWlzZXMpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhbiBhcnJheSB0byBhbGwuJyk7XG4gIH1cblxuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXSwgcmVtYWluaW5nID0gcHJvbWlzZXMubGVuZ3RoLFxuICAgIHByb21pc2U7XG5cbiAgICBpZiAocmVtYWluaW5nID09PSAwKSB7XG4gICAgICByZXNvbHZlKFtdKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXNvbHZlcihpbmRleCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJlc29sdmVBbGwoaW5kZXgsIHZhbHVlKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVzb2x2ZUFsbChpbmRleCwgdmFsdWUpIHtcbiAgICAgIHJlc3VsdHNbaW5kZXhdID0gdmFsdWU7XG4gICAgICBpZiAoLS1yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgcmVzb2x2ZShyZXN1bHRzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb21pc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBwcm9taXNlID0gcHJvbWlzZXNbaV07XG5cbiAgICAgIGlmIChwcm9taXNlICYmIGlzRnVuY3Rpb24ocHJvbWlzZS50aGVuKSkge1xuICAgICAgICBwcm9taXNlLnRoZW4ocmVzb2x2ZXIoaSksIHJlamVjdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXNvbHZlQWxsKGksIHByb21pc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59XG5cbmV4cG9ydHMuYWxsID0gYWxsOyIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgYnJvd3Nlckdsb2JhbCA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykgPyB3aW5kb3cgOiB7fTtcbnZhciBCcm93c2VyTXV0YXRpb25PYnNlcnZlciA9IGJyb3dzZXJHbG9iYWwuTXV0YXRpb25PYnNlcnZlciB8fCBicm93c2VyR2xvYmFsLldlYktpdE11dGF0aW9uT2JzZXJ2ZXI7XG52YXIgbG9jYWwgPSAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpID8gZ2xvYmFsIDogKHRoaXMgPT09IHVuZGVmaW5lZD8gd2luZG93OnRoaXMpO1xuXG4vLyBub2RlXG5mdW5jdGlvbiB1c2VOZXh0VGljaygpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHByb2Nlc3MubmV4dFRpY2soZmx1c2gpO1xuICB9O1xufVxuXG5mdW5jdGlvbiB1c2VNdXRhdGlvbk9ic2VydmVyKCkge1xuICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gIHZhciBvYnNlcnZlciA9IG5ldyBCcm93c2VyTXV0YXRpb25PYnNlcnZlcihmbHVzaCk7XG4gIHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJycpO1xuICBvYnNlcnZlci5vYnNlcnZlKG5vZGUsIHsgY2hhcmFjdGVyRGF0YTogdHJ1ZSB9KTtcblxuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgbm9kZS5kYXRhID0gKGl0ZXJhdGlvbnMgPSArK2l0ZXJhdGlvbnMgJSAyKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gdXNlU2V0VGltZW91dCgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIGxvY2FsLnNldFRpbWVvdXQoZmx1c2gsIDEpO1xuICB9O1xufVxuXG52YXIgcXVldWUgPSBbXTtcbmZ1bmN0aW9uIGZsdXNoKCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHF1ZXVlLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHR1cGxlID0gcXVldWVbaV07XG4gICAgdmFyIGNhbGxiYWNrID0gdHVwbGVbMF0sIGFyZyA9IHR1cGxlWzFdO1xuICAgIGNhbGxiYWNrKGFyZyk7XG4gIH1cbiAgcXVldWUgPSBbXTtcbn1cblxudmFyIHNjaGVkdWxlRmx1c2g7XG5cbi8vIERlY2lkZSB3aGF0IGFzeW5jIG1ldGhvZCB0byB1c2UgdG8gdHJpZ2dlcmluZyBwcm9jZXNzaW5nIG9mIHF1ZXVlZCBjYWxsYmFja3M6XG5pZiAodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHt9LnRvU3RyaW5nLmNhbGwocHJvY2VzcykgPT09ICdbb2JqZWN0IHByb2Nlc3NdJykge1xuICBzY2hlZHVsZUZsdXNoID0gdXNlTmV4dFRpY2soKTtcbn0gZWxzZSBpZiAoQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIpIHtcbiAgc2NoZWR1bGVGbHVzaCA9IHVzZU11dGF0aW9uT2JzZXJ2ZXIoKTtcbn0gZWxzZSB7XG4gIHNjaGVkdWxlRmx1c2ggPSB1c2VTZXRUaW1lb3V0KCk7XG59XG5cbmZ1bmN0aW9uIGFzYXAoY2FsbGJhY2ssIGFyZykge1xuICB2YXIgbGVuZ3RoID0gcXVldWUucHVzaChbY2FsbGJhY2ssIGFyZ10pO1xuICBpZiAobGVuZ3RoID09PSAxKSB7XG4gICAgLy8gSWYgbGVuZ3RoIGlzIDEsIHRoYXQgbWVhbnMgdGhhdCB3ZSBuZWVkIHRvIHNjaGVkdWxlIGFuIGFzeW5jIGZsdXNoLlxuICAgIC8vIElmIGFkZGl0aW9uYWwgY2FsbGJhY2tzIGFyZSBxdWV1ZWQgYmVmb3JlIHRoZSBxdWV1ZSBpcyBmbHVzaGVkLCB0aGV5XG4gICAgLy8gd2lsbCBiZSBwcm9jZXNzZWQgYnkgdGhpcyBmbHVzaCB0aGF0IHdlIGFyZSBzY2hlZHVsaW5nLlxuICAgIHNjaGVkdWxlRmx1c2goKTtcbiAgfVxufVxuXG5leHBvcnRzLmFzYXAgPSBhc2FwO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoJ19wcm9jZXNzJyksdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBjb25maWcgPSB7XG4gIGluc3RydW1lbnQ6IGZhbHNlXG59O1xuXG5mdW5jdGlvbiBjb25maWd1cmUobmFtZSwgdmFsdWUpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcbiAgICBjb25maWdbbmFtZV0gPSB2YWx1ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gY29uZmlnW25hbWVdO1xuICB9XG59XG5cbmV4cG9ydHMuY29uZmlnID0gY29uZmlnO1xuZXhwb3J0cy5jb25maWd1cmUgPSBjb25maWd1cmU7IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuXCJ1c2Ugc3RyaWN0XCI7XG4vKmdsb2JhbCBzZWxmKi9cbnZhciBSU1ZQUHJvbWlzZSA9IHJlcXVpcmUoXCIuL3Byb21pc2VcIikuUHJvbWlzZTtcbnZhciBpc0Z1bmN0aW9uID0gcmVxdWlyZShcIi4vdXRpbHNcIikuaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gcG9seWZpbGwoKSB7XG4gIHZhciBsb2NhbDtcblxuICBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBsb2NhbCA9IGdsb2JhbDtcbiAgfSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuZG9jdW1lbnQpIHtcbiAgICBsb2NhbCA9IHdpbmRvdztcbiAgfSBlbHNlIHtcbiAgICBsb2NhbCA9IHNlbGY7XG4gIH1cblxuICB2YXIgZXM2UHJvbWlzZVN1cHBvcnQgPSBcbiAgICBcIlByb21pc2VcIiBpbiBsb2NhbCAmJlxuICAgIC8vIFNvbWUgb2YgdGhlc2UgbWV0aG9kcyBhcmUgbWlzc2luZyBmcm9tXG4gICAgLy8gRmlyZWZveC9DaHJvbWUgZXhwZXJpbWVudGFsIGltcGxlbWVudGF0aW9uc1xuICAgIFwicmVzb2x2ZVwiIGluIGxvY2FsLlByb21pc2UgJiZcbiAgICBcInJlamVjdFwiIGluIGxvY2FsLlByb21pc2UgJiZcbiAgICBcImFsbFwiIGluIGxvY2FsLlByb21pc2UgJiZcbiAgICBcInJhY2VcIiBpbiBsb2NhbC5Qcm9taXNlICYmXG4gICAgLy8gT2xkZXIgdmVyc2lvbiBvZiB0aGUgc3BlYyBoYWQgYSByZXNvbHZlciBvYmplY3RcbiAgICAvLyBhcyB0aGUgYXJnIHJhdGhlciB0aGFuIGEgZnVuY3Rpb25cbiAgICAoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcmVzb2x2ZTtcbiAgICAgIG5ldyBsb2NhbC5Qcm9taXNlKGZ1bmN0aW9uKHIpIHsgcmVzb2x2ZSA9IHI7IH0pO1xuICAgICAgcmV0dXJuIGlzRnVuY3Rpb24ocmVzb2x2ZSk7XG4gICAgfSgpKTtcblxuICBpZiAoIWVzNlByb21pc2VTdXBwb3J0KSB7XG4gICAgbG9jYWwuUHJvbWlzZSA9IFJTVlBQcm9taXNlO1xuICB9XG59XG5cbmV4cG9ydHMucG9seWZpbGwgPSBwb2x5ZmlsbDtcbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIlwidXNlIHN0cmljdFwiO1xudmFyIGNvbmZpZyA9IHJlcXVpcmUoXCIuL2NvbmZpZ1wiKS5jb25maWc7XG52YXIgY29uZmlndXJlID0gcmVxdWlyZShcIi4vY29uZmlnXCIpLmNvbmZpZ3VyZTtcbnZhciBvYmplY3RPckZ1bmN0aW9uID0gcmVxdWlyZShcIi4vdXRpbHNcIikub2JqZWN0T3JGdW5jdGlvbjtcbnZhciBpc0Z1bmN0aW9uID0gcmVxdWlyZShcIi4vdXRpbHNcIikuaXNGdW5jdGlvbjtcbnZhciBub3cgPSByZXF1aXJlKFwiLi91dGlsc1wiKS5ub3c7XG52YXIgYWxsID0gcmVxdWlyZShcIi4vYWxsXCIpLmFsbDtcbnZhciByYWNlID0gcmVxdWlyZShcIi4vcmFjZVwiKS5yYWNlO1xudmFyIHN0YXRpY1Jlc29sdmUgPSByZXF1aXJlKFwiLi9yZXNvbHZlXCIpLnJlc29sdmU7XG52YXIgc3RhdGljUmVqZWN0ID0gcmVxdWlyZShcIi4vcmVqZWN0XCIpLnJlamVjdDtcbnZhciBhc2FwID0gcmVxdWlyZShcIi4vYXNhcFwiKS5hc2FwO1xuXG52YXIgY291bnRlciA9IDA7XG5cbmNvbmZpZy5hc3luYyA9IGFzYXA7IC8vIGRlZmF1bHQgYXN5bmMgaXMgYXNhcDtcblxuZnVuY3Rpb24gUHJvbWlzZShyZXNvbHZlcikge1xuICBpZiAoIWlzRnVuY3Rpb24ocmVzb2x2ZXIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhIHJlc29sdmVyIGZ1bmN0aW9uIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byB0aGUgcHJvbWlzZSBjb25zdHJ1Y3RvcicpO1xuICB9XG5cbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFByb21pc2UpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkZhaWxlZCB0byBjb25zdHJ1Y3QgJ1Byb21pc2UnOiBQbGVhc2UgdXNlIHRoZSAnbmV3JyBvcGVyYXRvciwgdGhpcyBvYmplY3QgY29uc3RydWN0b3IgY2Fubm90IGJlIGNhbGxlZCBhcyBhIGZ1bmN0aW9uLlwiKTtcbiAgfVxuXG4gIHRoaXMuX3N1YnNjcmliZXJzID0gW107XG5cbiAgaW52b2tlUmVzb2x2ZXIocmVzb2x2ZXIsIHRoaXMpO1xufVxuXG5mdW5jdGlvbiBpbnZva2VSZXNvbHZlcihyZXNvbHZlciwgcHJvbWlzZSkge1xuICBmdW5jdGlvbiByZXNvbHZlUHJvbWlzZSh2YWx1ZSkge1xuICAgIHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVqZWN0UHJvbWlzZShyZWFzb24pIHtcbiAgICByZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgcmVzb2x2ZXIocmVzb2x2ZVByb21pc2UsIHJlamVjdFByb21pc2UpO1xuICB9IGNhdGNoKGUpIHtcbiAgICByZWplY3RQcm9taXNlKGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGludm9rZUNhbGxiYWNrKHNldHRsZWQsIHByb21pc2UsIGNhbGxiYWNrLCBkZXRhaWwpIHtcbiAgdmFyIGhhc0NhbGxiYWNrID0gaXNGdW5jdGlvbihjYWxsYmFjayksXG4gICAgICB2YWx1ZSwgZXJyb3IsIHN1Y2NlZWRlZCwgZmFpbGVkO1xuXG4gIGlmIChoYXNDYWxsYmFjaykge1xuICAgIHRyeSB7XG4gICAgICB2YWx1ZSA9IGNhbGxiYWNrKGRldGFpbCk7XG4gICAgICBzdWNjZWVkZWQgPSB0cnVlO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgZmFpbGVkID0gdHJ1ZTtcbiAgICAgIGVycm9yID0gZTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFsdWUgPSBkZXRhaWw7XG4gICAgc3VjY2VlZGVkID0gdHJ1ZTtcbiAgfVxuXG4gIGlmIChoYW5kbGVUaGVuYWJsZShwcm9taXNlLCB2YWx1ZSkpIHtcbiAgICByZXR1cm47XG4gIH0gZWxzZSBpZiAoaGFzQ2FsbGJhY2sgJiYgc3VjY2VlZGVkKSB7XG4gICAgcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gIH0gZWxzZSBpZiAoZmFpbGVkKSB7XG4gICAgcmVqZWN0KHByb21pc2UsIGVycm9yKTtcbiAgfSBlbHNlIGlmIChzZXR0bGVkID09PSBGVUxGSUxMRUQpIHtcbiAgICByZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgfSBlbHNlIGlmIChzZXR0bGVkID09PSBSRUpFQ1RFRCkge1xuICAgIHJlamVjdChwcm9taXNlLCB2YWx1ZSk7XG4gIH1cbn1cblxudmFyIFBFTkRJTkcgICA9IHZvaWQgMDtcbnZhciBTRUFMRUQgICAgPSAwO1xudmFyIEZVTEZJTExFRCA9IDE7XG52YXIgUkVKRUNURUQgID0gMjtcblxuZnVuY3Rpb24gc3Vic2NyaWJlKHBhcmVudCwgY2hpbGQsIG9uRnVsZmlsbG1lbnQsIG9uUmVqZWN0aW9uKSB7XG4gIHZhciBzdWJzY3JpYmVycyA9IHBhcmVudC5fc3Vic2NyaWJlcnM7XG4gIHZhciBsZW5ndGggPSBzdWJzY3JpYmVycy5sZW5ndGg7XG5cbiAgc3Vic2NyaWJlcnNbbGVuZ3RoXSA9IGNoaWxkO1xuICBzdWJzY3JpYmVyc1tsZW5ndGggKyBGVUxGSUxMRURdID0gb25GdWxmaWxsbWVudDtcbiAgc3Vic2NyaWJlcnNbbGVuZ3RoICsgUkVKRUNURURdICA9IG9uUmVqZWN0aW9uO1xufVxuXG5mdW5jdGlvbiBwdWJsaXNoKHByb21pc2UsIHNldHRsZWQpIHtcbiAgdmFyIGNoaWxkLCBjYWxsYmFjaywgc3Vic2NyaWJlcnMgPSBwcm9taXNlLl9zdWJzY3JpYmVycywgZGV0YWlsID0gcHJvbWlzZS5fZGV0YWlsO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3Vic2NyaWJlcnMubGVuZ3RoOyBpICs9IDMpIHtcbiAgICBjaGlsZCA9IHN1YnNjcmliZXJzW2ldO1xuICAgIGNhbGxiYWNrID0gc3Vic2NyaWJlcnNbaSArIHNldHRsZWRdO1xuXG4gICAgaW52b2tlQ2FsbGJhY2soc2V0dGxlZCwgY2hpbGQsIGNhbGxiYWNrLCBkZXRhaWwpO1xuICB9XG5cbiAgcHJvbWlzZS5fc3Vic2NyaWJlcnMgPSBudWxsO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZSA9IHtcbiAgY29uc3RydWN0b3I6IFByb21pc2UsXG5cbiAgX3N0YXRlOiB1bmRlZmluZWQsXG4gIF9kZXRhaWw6IHVuZGVmaW5lZCxcbiAgX3N1YnNjcmliZXJzOiB1bmRlZmluZWQsXG5cbiAgdGhlbjogZnVuY3Rpb24ob25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pIHtcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXM7XG5cbiAgICB2YXIgdGhlblByb21pc2UgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcihmdW5jdGlvbigpIHt9KTtcblxuICAgIGlmICh0aGlzLl9zdGF0ZSkge1xuICAgICAgdmFyIGNhbGxiYWNrcyA9IGFyZ3VtZW50cztcbiAgICAgIGNvbmZpZy5hc3luYyhmdW5jdGlvbiBpbnZva2VQcm9taXNlQ2FsbGJhY2soKSB7XG4gICAgICAgIGludm9rZUNhbGxiYWNrKHByb21pc2UuX3N0YXRlLCB0aGVuUHJvbWlzZSwgY2FsbGJhY2tzW3Byb21pc2UuX3N0YXRlIC0gMV0sIHByb21pc2UuX2RldGFpbCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3Vic2NyaWJlKHRoaXMsIHRoZW5Qcm9taXNlLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoZW5Qcm9taXNlO1xuICB9LFxuXG4gICdjYXRjaCc6IGZ1bmN0aW9uKG9uUmVqZWN0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihudWxsLCBvblJlamVjdGlvbik7XG4gIH1cbn07XG5cblByb21pc2UuYWxsID0gYWxsO1xuUHJvbWlzZS5yYWNlID0gcmFjZTtcblByb21pc2UucmVzb2x2ZSA9IHN0YXRpY1Jlc29sdmU7XG5Qcm9taXNlLnJlamVjdCA9IHN0YXRpY1JlamVjdDtcblxuZnVuY3Rpb24gaGFuZGxlVGhlbmFibGUocHJvbWlzZSwgdmFsdWUpIHtcbiAgdmFyIHRoZW4gPSBudWxsLFxuICByZXNvbHZlZDtcblxuICB0cnkge1xuICAgIGlmIChwcm9taXNlID09PSB2YWx1ZSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkEgcHJvbWlzZXMgY2FsbGJhY2sgY2Fubm90IHJldHVybiB0aGF0IHNhbWUgcHJvbWlzZS5cIik7XG4gICAgfVxuXG4gICAgaWYgKG9iamVjdE9yRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB0aGVuID0gdmFsdWUudGhlbjtcblxuICAgICAgaWYgKGlzRnVuY3Rpb24odGhlbikpIHtcbiAgICAgICAgdGhlbi5jYWxsKHZhbHVlLCBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgICBpZiAocmVzb2x2ZWQpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICByZXNvbHZlZCA9IHRydWU7XG5cbiAgICAgICAgICBpZiAodmFsdWUgIT09IHZhbCkge1xuICAgICAgICAgICAgcmVzb2x2ZShwcm9taXNlLCB2YWwpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmdWxmaWxsKHByb21pc2UsIHZhbCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgICBpZiAocmVzb2x2ZWQpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICByZXNvbHZlZCA9IHRydWU7XG5cbiAgICAgICAgICByZWplY3QocHJvbWlzZSwgdmFsKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGlmIChyZXNvbHZlZCkgeyByZXR1cm4gdHJ1ZTsgfVxuICAgIHJlamVjdChwcm9taXNlLCBlcnJvcik7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmUocHJvbWlzZSwgdmFsdWUpIHtcbiAgaWYgKHByb21pc2UgPT09IHZhbHVlKSB7XG4gICAgZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gIH0gZWxzZSBpZiAoIWhhbmRsZVRoZW5hYmxlKHByb21pc2UsIHZhbHVlKSkge1xuICAgIGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpIHtcbiAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBQRU5ESU5HKSB7IHJldHVybjsgfVxuICBwcm9taXNlLl9zdGF0ZSA9IFNFQUxFRDtcbiAgcHJvbWlzZS5fZGV0YWlsID0gdmFsdWU7XG5cbiAgY29uZmlnLmFzeW5jKHB1Ymxpc2hGdWxmaWxsbWVudCwgcHJvbWlzZSk7XG59XG5cbmZ1bmN0aW9uIHJlamVjdChwcm9taXNlLCByZWFzb24pIHtcbiAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBQRU5ESU5HKSB7IHJldHVybjsgfVxuICBwcm9taXNlLl9zdGF0ZSA9IFNFQUxFRDtcbiAgcHJvbWlzZS5fZGV0YWlsID0gcmVhc29uO1xuXG4gIGNvbmZpZy5hc3luYyhwdWJsaXNoUmVqZWN0aW9uLCBwcm9taXNlKTtcbn1cblxuZnVuY3Rpb24gcHVibGlzaEZ1bGZpbGxtZW50KHByb21pc2UpIHtcbiAgcHVibGlzaChwcm9taXNlLCBwcm9taXNlLl9zdGF0ZSA9IEZVTEZJTExFRCk7XG59XG5cbmZ1bmN0aW9uIHB1Ymxpc2hSZWplY3Rpb24ocHJvbWlzZSkge1xuICBwdWJsaXNoKHByb21pc2UsIHByb21pc2UuX3N0YXRlID0gUkVKRUNURUQpO1xufVxuXG5leHBvcnRzLlByb21pc2UgPSBQcm9taXNlOyIsIlwidXNlIHN0cmljdFwiO1xuLyogZ2xvYmFsIHRvU3RyaW5nICovXG52YXIgaXNBcnJheSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLmlzQXJyYXk7XG5cbi8qKlxuICBgUlNWUC5yYWNlYCBhbGxvd3MgeW91IHRvIHdhdGNoIGEgc2VyaWVzIG9mIHByb21pc2VzIGFuZCBhY3QgYXMgc29vbiBhcyB0aGVcbiAgZmlyc3QgcHJvbWlzZSBnaXZlbiB0byB0aGUgYHByb21pc2VzYCBhcmd1bWVudCBmdWxmaWxscyBvciByZWplY3RzLlxuXG4gIEV4YW1wbGU6XG5cbiAgYGBgamF2YXNjcmlwdFxuICB2YXIgcHJvbWlzZTEgPSBuZXcgUlNWUC5Qcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgcmVzb2x2ZShcInByb21pc2UgMVwiKTtcbiAgICB9LCAyMDApO1xuICB9KTtcblxuICB2YXIgcHJvbWlzZTIgPSBuZXcgUlNWUC5Qcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgcmVzb2x2ZShcInByb21pc2UgMlwiKTtcbiAgICB9LCAxMDApO1xuICB9KTtcblxuICBSU1ZQLnJhY2UoW3Byb21pc2UxLCBwcm9taXNlMl0pLnRoZW4oZnVuY3Rpb24ocmVzdWx0KXtcbiAgICAvLyByZXN1bHQgPT09IFwicHJvbWlzZSAyXCIgYmVjYXVzZSBpdCB3YXMgcmVzb2x2ZWQgYmVmb3JlIHByb21pc2UxXG4gICAgLy8gd2FzIHJlc29sdmVkLlxuICB9KTtcbiAgYGBgXG5cbiAgYFJTVlAucmFjZWAgaXMgZGV0ZXJtaW5pc3RpYyBpbiB0aGF0IG9ubHkgdGhlIHN0YXRlIG9mIHRoZSBmaXJzdCBjb21wbGV0ZWRcbiAgcHJvbWlzZSBtYXR0ZXJzLiBGb3IgZXhhbXBsZSwgZXZlbiBpZiBvdGhlciBwcm9taXNlcyBnaXZlbiB0byB0aGUgYHByb21pc2VzYFxuICBhcnJheSBhcmd1bWVudCBhcmUgcmVzb2x2ZWQsIGJ1dCB0aGUgZmlyc3QgY29tcGxldGVkIHByb21pc2UgaGFzIGJlY29tZVxuICByZWplY3RlZCBiZWZvcmUgdGhlIG90aGVyIHByb21pc2VzIGJlY2FtZSBmdWxmaWxsZWQsIHRoZSByZXR1cm5lZCBwcm9taXNlXG4gIHdpbGwgYmVjb21lIHJlamVjdGVkOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgdmFyIHByb21pc2UxID0gbmV3IFJTVlAuUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIHJlc29sdmUoXCJwcm9taXNlIDFcIik7XG4gICAgfSwgMjAwKTtcbiAgfSk7XG5cbiAgdmFyIHByb21pc2UyID0gbmV3IFJTVlAuUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJwcm9taXNlIDJcIikpO1xuICAgIH0sIDEwMCk7XG4gIH0pO1xuXG4gIFJTVlAucmFjZShbcHJvbWlzZTEsIHByb21pc2UyXSkudGhlbihmdW5jdGlvbihyZXN1bHQpe1xuICAgIC8vIENvZGUgaGVyZSBuZXZlciBydW5zIGJlY2F1c2UgdGhlcmUgYXJlIHJlamVjdGVkIHByb21pc2VzIVxuICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgIC8vIHJlYXNvbi5tZXNzYWdlID09PSBcInByb21pc2UyXCIgYmVjYXVzZSBwcm9taXNlIDIgYmVjYW1lIHJlamVjdGVkIGJlZm9yZVxuICAgIC8vIHByb21pc2UgMSBiZWNhbWUgZnVsZmlsbGVkXG4gIH0pO1xuICBgYGBcblxuICBAbWV0aG9kIHJhY2VcbiAgQGZvciBSU1ZQXG4gIEBwYXJhbSB7QXJyYXl9IHByb21pc2VzIGFycmF5IG9mIHByb21pc2VzIHRvIG9ic2VydmVcbiAgQHBhcmFtIHtTdHJpbmd9IGxhYmVsIG9wdGlvbmFsIHN0cmluZyBmb3IgZGVzY3JpYmluZyB0aGUgcHJvbWlzZSByZXR1cm5lZC5cbiAgVXNlZnVsIGZvciB0b29saW5nLlxuICBAcmV0dXJuIHtQcm9taXNlfSBhIHByb21pc2UgdGhhdCBiZWNvbWVzIGZ1bGZpbGxlZCB3aXRoIHRoZSB2YWx1ZSB0aGUgZmlyc3RcbiAgY29tcGxldGVkIHByb21pc2VzIGlzIHJlc29sdmVkIHdpdGggaWYgdGhlIGZpcnN0IGNvbXBsZXRlZCBwcm9taXNlIHdhc1xuICBmdWxmaWxsZWQsIG9yIHJlamVjdGVkIHdpdGggdGhlIHJlYXNvbiB0aGF0IHRoZSBmaXJzdCBjb21wbGV0ZWQgcHJvbWlzZVxuICB3YXMgcmVqZWN0ZWQgd2l0aC5cbiovXG5mdW5jdGlvbiByYWNlKHByb21pc2VzKSB7XG4gIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gIHZhciBQcm9taXNlID0gdGhpcztcblxuICBpZiAoIWlzQXJyYXkocHJvbWlzZXMpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhbiBhcnJheSB0byByYWNlLicpO1xuICB9XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICB2YXIgcmVzdWx0cyA9IFtdLCBwcm9taXNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9taXNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgcHJvbWlzZSA9IHByb21pc2VzW2ldO1xuXG4gICAgICBpZiAocHJvbWlzZSAmJiB0eXBlb2YgcHJvbWlzZS50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHByb21pc2UudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzb2x2ZShwcm9taXNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufVxuXG5leHBvcnRzLnJhY2UgPSByYWNlOyIsIlwidXNlIHN0cmljdFwiO1xuLyoqXG4gIGBSU1ZQLnJlamVjdGAgcmV0dXJucyBhIHByb21pc2UgdGhhdCB3aWxsIGJlY29tZSByZWplY3RlZCB3aXRoIHRoZSBwYXNzZWRcbiAgYHJlYXNvbmAuIGBSU1ZQLnJlamVjdGAgaXMgZXNzZW50aWFsbHkgc2hvcnRoYW5kIGZvciB0aGUgZm9sbG93aW5nOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgdmFyIHByb21pc2UgPSBuZXcgUlNWUC5Qcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgcmVqZWN0KG5ldyBFcnJvcignV0hPT1BTJykpO1xuICB9KTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpe1xuICAgIC8vIENvZGUgaGVyZSBkb2Vzbid0IHJ1biBiZWNhdXNlIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkIVxuICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgIC8vIHJlYXNvbi5tZXNzYWdlID09PSAnV0hPT1BTJ1xuICB9KTtcbiAgYGBgXG5cbiAgSW5zdGVhZCBvZiB3cml0aW5nIHRoZSBhYm92ZSwgeW91ciBjb2RlIG5vdyBzaW1wbHkgYmVjb21lcyB0aGUgZm9sbG93aW5nOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgdmFyIHByb21pc2UgPSBSU1ZQLnJlamVjdChuZXcgRXJyb3IoJ1dIT09QUycpKTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpe1xuICAgIC8vIENvZGUgaGVyZSBkb2Vzbid0IHJ1biBiZWNhdXNlIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkIVxuICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgIC8vIHJlYXNvbi5tZXNzYWdlID09PSAnV0hPT1BTJ1xuICB9KTtcbiAgYGBgXG5cbiAgQG1ldGhvZCByZWplY3RcbiAgQGZvciBSU1ZQXG4gIEBwYXJhbSB7QW55fSByZWFzb24gdmFsdWUgdGhhdCB0aGUgcmV0dXJuZWQgcHJvbWlzZSB3aWxsIGJlIHJlamVjdGVkIHdpdGguXG4gIEBwYXJhbSB7U3RyaW5nfSBsYWJlbCBvcHRpb25hbCBzdHJpbmcgZm9yIGlkZW50aWZ5aW5nIHRoZSByZXR1cm5lZCBwcm9taXNlLlxuICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gIEByZXR1cm4ge1Byb21pc2V9IGEgcHJvbWlzZSB0aGF0IHdpbGwgYmVjb21lIHJlamVjdGVkIHdpdGggdGhlIGdpdmVuXG4gIGByZWFzb25gLlxuKi9cbmZ1bmN0aW9uIHJlamVjdChyZWFzb24pIHtcbiAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgdmFyIFByb21pc2UgPSB0aGlzO1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgcmVqZWN0KHJlYXNvbik7XG4gIH0pO1xufVxuXG5leHBvcnRzLnJlamVjdCA9IHJlamVjdDsiLCJcInVzZSBzdHJpY3RcIjtcbmZ1bmN0aW9uIHJlc29sdmUodmFsdWUpIHtcbiAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUuY29uc3RydWN0b3IgPT09IHRoaXMpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICB2YXIgUHJvbWlzZSA9IHRoaXM7XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICByZXNvbHZlKHZhbHVlKTtcbiAgfSk7XG59XG5cbmV4cG9ydHMucmVzb2x2ZSA9IHJlc29sdmU7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5mdW5jdGlvbiBvYmplY3RPckZ1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIGlzRnVuY3Rpb24oeCkgfHwgKHR5cGVvZiB4ID09PSBcIm9iamVjdFwiICYmIHggIT09IG51bGwpO1xufVxuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIHR5cGVvZiB4ID09PSBcImZ1bmN0aW9uXCI7XG59XG5cbmZ1bmN0aW9uIGlzQXJyYXkoeCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHgpID09PSBcIltvYmplY3QgQXJyYXldXCI7XG59XG5cbi8vIERhdGUubm93IGlzIG5vdCBhdmFpbGFibGUgaW4gYnJvd3NlcnMgPCBJRTlcbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0RhdGUvbm93I0NvbXBhdGliaWxpdHlcbnZhciBub3cgPSBEYXRlLm5vdyB8fCBmdW5jdGlvbigpIHsgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpOyB9O1xuXG5cbmV4cG9ydHMub2JqZWN0T3JGdW5jdGlvbiA9IG9iamVjdE9yRnVuY3Rpb247XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcbmV4cG9ydHMubm93ID0gbm93OyIsbnVsbCwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuTXV0YXRpb25PYnNlcnZlciA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93Lk11dGF0aW9uT2JzZXJ2ZXI7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgdmFyIHF1ZXVlID0gW107XG5cbiAgICBpZiAoY2FuTXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgICB2YXIgaGlkZGVuRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHF1ZXVlTGlzdCA9IHF1ZXVlLnNsaWNlKCk7XG4gICAgICAgICAgICBxdWV1ZS5sZW5ndGggPSAwO1xuICAgICAgICAgICAgcXVldWVMaXN0LmZvckVhY2goZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBvYnNlcnZlci5vYnNlcnZlKGhpZGRlbkRpdiwgeyBhdHRyaWJ1dGVzOiB0cnVlIH0pO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBoaWRkZW5EaXYuc2V0QXR0cmlidXRlKCd5ZXMnLCAnbm8nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbiIsIi8qISBKU09OLm1pbmlmeSgpXG5cdHYwLjEuMy1hIChjKSBLeWxlIFNpbXBzb25cblx0TUlUIExpY2Vuc2VcbiovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oanNvbikge1xuXHRcblx0dmFyIHRva2VuaXplciA9IC9cInwoXFwvXFwqKXwoXFwqXFwvKXwoXFwvXFwvKXxcXG58XFxyL2csXG5cdFx0aW5fc3RyaW5nID0gZmFsc2UsXG5cdFx0aW5fbXVsdGlsaW5lX2NvbW1lbnQgPSBmYWxzZSxcblx0XHRpbl9zaW5nbGVsaW5lX2NvbW1lbnQgPSBmYWxzZSxcblx0XHR0bXAsIHRtcDIsIG5ld19zdHIgPSBbXSwgbnMgPSAwLCBmcm9tID0gMCwgbGMsIHJjXG5cdDtcblx0XG5cdHRva2VuaXplci5sYXN0SW5kZXggPSAwO1xuXHRcblx0d2hpbGUgKHRtcCA9IHRva2VuaXplci5leGVjKGpzb24pKSB7XG5cdFx0bGMgPSBSZWdFeHAubGVmdENvbnRleHQ7XG5cdFx0cmMgPSBSZWdFeHAucmlnaHRDb250ZXh0O1xuXHRcdGlmICghaW5fbXVsdGlsaW5lX2NvbW1lbnQgJiYgIWluX3NpbmdsZWxpbmVfY29tbWVudCkge1xuXHRcdFx0dG1wMiA9IGxjLnN1YnN0cmluZyhmcm9tKTtcblx0XHRcdGlmICghaW5fc3RyaW5nKSB7XG5cdFx0XHRcdHRtcDIgPSB0bXAyLnJlcGxhY2UoLyhcXG58XFxyfFxccykqL2csXCJcIik7XG5cdFx0XHR9XG5cdFx0XHRuZXdfc3RyW25zKytdID0gdG1wMjtcblx0XHR9XG5cdFx0ZnJvbSA9IHRva2VuaXplci5sYXN0SW5kZXg7XG5cdFx0XG5cdFx0aWYgKHRtcFswXSA9PSBcIlxcXCJcIiAmJiAhaW5fbXVsdGlsaW5lX2NvbW1lbnQgJiYgIWluX3NpbmdsZWxpbmVfY29tbWVudCkge1xuXHRcdFx0dG1wMiA9IGxjLm1hdGNoKC8oXFxcXCkqJC8pO1xuXHRcdFx0aWYgKCFpbl9zdHJpbmcgfHwgIXRtcDIgfHwgKHRtcDJbMF0ubGVuZ3RoICUgMikgPT0gMCkge1x0Ly8gc3RhcnQgb2Ygc3RyaW5nIHdpdGggXCIsIG9yIHVuZXNjYXBlZCBcIiBjaGFyYWN0ZXIgZm91bmQgdG8gZW5kIHN0cmluZ1xuXHRcdFx0XHRpbl9zdHJpbmcgPSAhaW5fc3RyaW5nO1xuXHRcdFx0fVxuXHRcdFx0ZnJvbS0tOyAvLyBpbmNsdWRlIFwiIGNoYXJhY3RlciBpbiBuZXh0IGNhdGNoXG5cdFx0XHRyYyA9IGpzb24uc3Vic3RyaW5nKGZyb20pO1xuXHRcdH1cblx0XHRlbHNlIGlmICh0bXBbMF0gPT0gXCIvKlwiICYmICFpbl9zdHJpbmcgJiYgIWluX211bHRpbGluZV9jb21tZW50ICYmICFpbl9zaW5nbGVsaW5lX2NvbW1lbnQpIHtcblx0XHRcdGluX211bHRpbGluZV9jb21tZW50ID0gdHJ1ZTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAodG1wWzBdID09IFwiKi9cIiAmJiAhaW5fc3RyaW5nICYmIGluX211bHRpbGluZV9jb21tZW50ICYmICFpbl9zaW5nbGVsaW5lX2NvbW1lbnQpIHtcblx0XHRcdGluX211bHRpbGluZV9jb21tZW50ID0gZmFsc2U7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKHRtcFswXSA9PSBcIi8vXCIgJiYgIWluX3N0cmluZyAmJiAhaW5fbXVsdGlsaW5lX2NvbW1lbnQgJiYgIWluX3NpbmdsZWxpbmVfY29tbWVudCkge1xuXHRcdFx0aW5fc2luZ2xlbGluZV9jb21tZW50ID0gdHJ1ZTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoKHRtcFswXSA9PSBcIlxcblwiIHx8IHRtcFswXSA9PSBcIlxcclwiKSAmJiAhaW5fc3RyaW5nICYmICFpbl9tdWx0aWxpbmVfY29tbWVudCAmJiBpbl9zaW5nbGVsaW5lX2NvbW1lbnQpIHtcblx0XHRcdGluX3NpbmdsZWxpbmVfY29tbWVudCA9IGZhbHNlO1xuXHRcdH1cblx0XHRlbHNlIGlmICghaW5fbXVsdGlsaW5lX2NvbW1lbnQgJiYgIWluX3NpbmdsZWxpbmVfY29tbWVudCAmJiAhKC9cXG58XFxyfFxccy8udGVzdCh0bXBbMF0pKSkge1xuXHRcdFx0bmV3X3N0cltucysrXSA9IHRtcFswXTtcblx0XHR9XG5cdH1cblx0bmV3X3N0cltucysrXSA9IHJjO1xuXHRyZXR1cm4gbmV3X3N0ci5qb2luKFwiXCIpO1xufTtcblxuIiwiKGZ1bmN0aW9uIChwcm9jZXNzKXtcbi8qZ2xvYmFscyBwcm9jZXNzLCBjb25zb2xlICovXG4vKmpzbGludCBpbmRlbnQ6MixzbG9wcHk6dHJ1ZSwgbm9kZTp0cnVlICovXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uLy4uL3NyYy91dGlsJyk7XG5cbi8qKlxuICogQSBmcmVlZG9tLmpzIGxvZ2dpbmcgcHJvdmlkZXIgdGhhdCBsb2dzIHRvIGNocm9tZSwgZmlyZWZveCwgYW5kIG5vZGUgY29uc29sZXMuXG4gKiBAQ2xhc3MgTG9nZ2VyX2NvbnNvbGVcbiAqIEBjb25zdHJ1Y3RvclxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXBwfSBhcHAgVGhlIGFwcGxpY2F0aW9uIGNyZWF0aW5nIHRoaXMgcHJvdmlkZXIsIGluIHByYWN0aWNlIHVuc2V0LlxuICovXG52YXIgTG9nZ2VyX2NvbnNvbGUgPSBmdW5jdGlvbiAoYXBwKSB7XG4gIHRoaXMubGV2ZWwgPSAoYXBwLmNvbmZpZyAmJiBhcHAuY29uZmlnLmRlYnVnKSB8fCAnbG9nJztcbiAgdGhpcy5jb25zb2xlID0gKGFwcC5jb25maWcgJiYgYXBwLmNvbmZpZy5nbG9iYWwuY29uc29sZSk7XG4gIHV0aWwuaGFuZGxlRXZlbnRzKHRoaXMpO1xufTtcblxuXG4vKipcbiAqIExvZ2dpbmcgbGV2ZWxzLCBmb3IgZmlsdGVyaW5nIG91dHB1dC5cbiAqIEBwcml2YXRlXG4gKiBAc3RhdGljXG4gKi9cbkxvZ2dlcl9jb25zb2xlLmxldmVsID0ge1xuICBcImRlYnVnXCI6IDAsXG4gIFwiaW5mb1wiOiAxLFxuICBcImxvZ1wiOiAyLFxuICBcIndhcm5cIjogMyxcbiAgXCJlcnJvclwiOiA0XG59O1xuXG4vKipcbiAqIFByaW50IGEgbWVzc2FnZSB3aXRoIGFwcHJvcHJpYXRlIGZvcm1hdHRpbmcuXG4gKiBAbWV0aG9kIHByaW50XG4gKi9cbkxvZ2dlcl9jb25zb2xlLnByb3RvdHlwZS5wcmludCA9IGZ1bmN0aW9uIChzZXZlcml0eSwgc291cmNlLCBtc2cpIHtcbiAgdmFyIGFyciA9IG1zZztcbiAgaWYgKHR5cGVvZiB0aGlzLmNvbnNvbGUgPT09ICd1bmRlZmluZWQnIHx8XG4gICAgICB0aGlzLmNvbnNvbGUuZnJlZWRvbSA9PT0gdHJ1ZSkge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAodHlwZW9mIGFyciA9PT0gJ3N0cmluZycpIHtcbiAgICBhcnIgPSBbYXJyXTtcbiAgfVxuICBcbiAgaWYgKExvZ2dlcl9jb25zb2xlLmxldmVsW3RoaXMubGV2ZWxdICE9PSB1bmRlZmluZWQgJiZcbiAgICAgIExvZ2dlcl9jb25zb2xlLmxldmVsW3NldmVyaXR5XSA8IExvZ2dlcl9jb25zb2xlLmxldmVsW3RoaXMubGV2ZWxdKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIFxuICBpZiAodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICB7fS50b1N0cmluZy5jYWxsKHByb2Nlc3MpID09PSAnW29iamVjdCBwcm9jZXNzXScgJiYgc291cmNlKSB7XG4gICAgYXJyLnVuc2hpZnQoJ1xceDFCWzM5bScpO1xuICAgIGFyci51bnNoaWZ0KCdcXHgxQlszMW0nICsgc291cmNlKTtcbiAgICAvKmpzbGludCBub21lbjogdHJ1ZSovXG4gIH0gZWxzZSBpZiAodGhpcy5jb25zb2xlLl9fbW96aWxsYUNvbnNvbGVfXyAmJiBzb3VyY2UpIHtcbiAgICBhcnIudW5zaGlmdChzb3VyY2UudG9VcHBlckNhc2UoKSk7XG4gICAgLypqc2xpbnQgbm9tZW46IGZhbHNlKi9cbiAgfSBlbHNlIGlmIChzb3VyY2UpIHtcbiAgICBhcnIudW5zaGlmdCgnY29sb3I6IHJlZCcpO1xuICAgIGFyci51bnNoaWZ0KCclYyAnICsgc291cmNlKTtcbiAgfVxuICBpZiAoIXRoaXMuY29uc29sZVtzZXZlcml0eV0gJiYgdGhpcy5jb25zb2xlLmxvZykge1xuICAgIHNldmVyaXR5ID0gJ2xvZyc7XG4gIH1cbiAgdGhpcy5jb25zb2xlW3NldmVyaXR5XS5hcHBseSh0aGlzLmNvbnNvbGUsIGFycik7XG59O1xuXG4vKipcbiAqIExvZyBhIG1lc3NhZ2UgdG8gdGhlIGNvbnNvbGUuXG4gKiBAcGFyYW0ge1N0cmluZ30gc291cmNlIFRoZSBzb3VyY2Ugb2YgdGhlIG1lc3NhZ2UuXG4gKiBAcGFyYW0ge1N0cmluZ30gbXNnIFRoZSBtZXNzYWdlIHRvIGxvZy5cbiAqIEBtZXRob2QgbG9nXG4gKi9cbkxvZ2dlcl9jb25zb2xlLnByb3RvdHlwZS5sb2cgPSBmdW5jdGlvbiAoc291cmNlLCBtc2csIGNvbnRpbnVhdGlvbikge1xuICB0aGlzLnByaW50KCdsb2cnLCBzb3VyY2UsIG1zZyk7XG4gIGNvbnRpbnVhdGlvbigpO1xufTtcblxuLyoqXG4gKiBMb2cgYSBtZXNzYWdlIHRvIHRoZSBjb25zb2xlIHdpdGggZGVidWcgcHJpb3JpdHkuXG4gKiBAcGFyYW0ge1N0cmluZ30gc291cmNlIFRoZSBzb3VyY2Ugb2YgdGhlIG1lc3NhZ2UuXG4gKiBAcGFyYW0ge1N0cmluZ30gbXNnIFRoZSBtZXNzYWdlIHRvIGxvZy5cbiAqIEBtZXRob2QgbG9nXG4gKi9cbkxvZ2dlcl9jb25zb2xlLnByb3RvdHlwZS5kZWJ1ZyA9IGZ1bmN0aW9uIChzb3VyY2UsIG1zZywgY29udGludWF0aW9uKSB7XG4gIHRoaXMucHJpbnQoJ2RlYnVnJywgc291cmNlLCBtc2cpO1xuICBjb250aW51YXRpb24oKTtcbn07XG5cbi8qKlxuICogTG9nIGEgbWVzc2FnZSB0byB0aGUgY29uc29sZSB3aXRoIGluZm8gcHJpb3JpdHkuXG4gKiBAcGFyYW0ge1N0cmluZ30gc291cmNlIFRoZSBzb3VyY2Ugb2YgdGhlIG1lc3NhZ2UuXG4gKiBAcGFyYW0ge1N0cmluZ30gbXNnIFRoZSBtZXNzYWdlIHRvIGxvZy5cbiAqIEBtZXRob2QgbG9nXG4gKi9cbkxvZ2dlcl9jb25zb2xlLnByb3RvdHlwZS5pbmZvID0gZnVuY3Rpb24gKHNvdXJjZSwgbXNnLCBjb250aW51YXRpb24pIHtcbiAgdGhpcy5wcmludCgnaW5mbycsIHNvdXJjZSwgbXNnKTtcbiAgY29udGludWF0aW9uKCk7XG59O1xuXG4vKipcbiAqIExvZyBhIG1lc3NhZ2UgdG8gdGhlIGNvbnNvbGUgd2l0aCB3YXJuIHByaW9yaXR5LlxuICogQHBhcmFtIHtTdHJpbmd9IHNvdXJjZSBUaGUgc291cmNlIG9mIHRoZSBtZXNzYWdlLlxuICogQHBhcmFtIHtTdHJpbmd9IG1zZyBUaGUgbWVzc2FnZSB0byBsb2cuXG4gKiBAbWV0aG9kIGxvZ1xuICovXG5Mb2dnZXJfY29uc29sZS5wcm90b3R5cGUud2FybiA9IGZ1bmN0aW9uIChzb3VyY2UsIG1zZywgY29udGludWF0aW9uKSB7XG4gIHRoaXMucHJpbnQoJ3dhcm4nLCBzb3VyY2UsIG1zZyk7XG4gIGNvbnRpbnVhdGlvbigpO1xufTtcblxuLyoqXG4gKiBMb2cgYSBtZXNzYWdlIHRvIHRoZSBjb25zb2xlIHdpdGggZXJyb3IgcHJpb3JpdHkuXG4gKiBAcGFyYW0ge1N0cmluZ30gc291cmNlIFRoZSBzb3VyY2Ugb2YgdGhlIG1lc3NhZ2UuXG4gKiBAcGFyYW0ge1N0cmluZ30gbXNnIFRoZSBtZXNzYWdlIHRvIGxvZy5cbiAqIEBtZXRob2QgbG9nXG4gKi9cbkxvZ2dlcl9jb25zb2xlLnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uIChzb3VyY2UsIG1zZywgY29udGludWF0aW9uKSB7XG4gIHRoaXMucHJpbnQoJ2Vycm9yJywgc291cmNlLCBtc2cpO1xuICBjb250aW51YXRpb24oKTtcbn07XG5cbi8qKiBSRUdJU1RFUiBQUk9WSURFUiAqKi9cbmV4cG9ydHMucHJvdmlkZXIgPSBMb2dnZXJfY29uc29sZTtcbmV4cG9ydHMubmFtZSA9ICdjb3JlLmNvbnNvbGUnO1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZSgnX3Byb2Nlc3MnKSkiLCIvKmdsb2JhbHMgY29uc29sZSAqL1xuLypqc2xpbnQgaW5kZW50OjIsd2hpdGU6dHJ1ZSxzbG9wcHk6dHJ1ZSxub2RlOnRydWUgKi9cblxuLyoqXG4gKiBBbiBvQXV0aCBtZXRhLXByb3ZpZGVyIGFsbG93aW5nIG11bHRpcGxlIHBsYXRmb3JtLWRlcGVuZGFudFxuICogb0F1dGggaW1wbGVtZW50YXRpb25zIHRvIHNlcnZlIGFzIHRoZSByZWRpcmVjdFVSTCBmb3IgYW4gb0F1dGggZmxvdy5cbiAqIFRoZSBjb3JlIGltcGxlbWVudGF0aW9ucyBhcmUgcHJvdmlkZWQgaW4gcHJvdmlkZXJzL29hdXRoLCBhbmQgYXJlXG4gKiBzdXBwbGVtZW50ZWQgaW4gcGxhdGZvcm0tZGVwZW5kZW50IHJlcG9zaXRvcmllcy5cbiAqXG4gKi9cbnZhciBPQXV0aCA9IGZ1bmN0aW9uIChoYW5kbGVycywgbW9kLCBkaXNwYXRjaEV2ZW50KSB7XG4gIHRoaXMuaGFuZGxlcnMgPSBoYW5kbGVycztcbiAgdGhpcy5tb2QgPSBtb2Q7XG4gIHRoaXMuZGlzcGF0Y2hFdmVudCA9IGRpc3BhdGNoRXZlbnQ7XG4gIHRoaXMub25nb2luZyA9IHt9O1xufTtcblxuLyoqXG4gKiBSZWdpc3RlciBvQXV0aCBoYW5kbGVycy5cbiAqIFRoaXMgbWV0aG9kIHNob3VsZCBiZSBjYWxsZWQgYmVmb3JlIHByb3ZpZGVyIGlzIHVzZWQsIGFuZCBiaW5kcyB0aGUgY3VycmVudFxuICogb0F1dGggcHJvdmlkZXIgdG8gYmUgYXNzb2NpYXRlZCB3aXRoIHJlZ2lzdGVyZWQgaGFuZGxlcnMuIFRoaXMgaXMgdXNlZCBzb1xuICogdGhhdCBoYW5kbGVycyB3aGljaCBhcmUgcmVnaXN0ZXJlZCBieSB0aGUgdXNlciBhcHBseSBvbmx5IHRoZSB0aGUgZnJlZWRvbSgpXG4gKiBzZXR1cCBjYWxsIHRoZXkgYXJlIGFzc29jaWF0ZWQgd2l0aCwgd2hpbGUgc3RpbGwgYmVpbmcgcmVnaXN0ZXJlZCBhY3Jvc3NcbiAqIG11bHRpcGxlIGluc3RhbmNlcyBvZiBPQXV0aCBwcm92aWRlcnMuXG4gKlxuICogQG1ldGhvZCByZWdpc3RlclxuICogQHBhcmFtIHtbY29uc3RydWN0b3JdfSBoYW5kbGVyc1xuICogQHByaXZhdGVcbiAqL1xuT0F1dGgucmVnaXN0ZXIgPSBmdW5jdGlvbiAoaGFuZGxlcnMpIHtcbiAgdmFyIGksXG4gICAgICBib3VuZEhhbmRsZXJzID0gW107XG4gIGlmICghaGFuZGxlcnMgfHwgIWhhbmRsZXJzLmxlbmd0aCkge1xuICAgIHJldHVybiBPQXV0aC5yZXNldCgpO1xuICB9XG5cbiAgZm9yIChpID0gMDsgaSA8IGhhbmRsZXJzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgYm91bmRIYW5kbGVycy5wdXNoKG5ldyBoYW5kbGVyc1tpXSgpKTtcbiAgfVxuICBleHBvcnRzLnByb3ZpZGVyID0gT0F1dGguYmluZCh0aGlzLCBib3VuZEhhbmRsZXJzKTtcbn07XG5cbi8qKlxuICogUmVzZXQgdGhlIG9BdXRoIHByb3ZpZGVyIHJlZ2lzdHJhdGlvbnMuXG4gKiBAbWV0aG9kIHJlc2V0XG4gKiBAcHJpdmF0ZVxuICovXG5PQXV0aC5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgZXhwb3J0cy5wcm92aWRlciA9IE9BdXRoLmJpbmQodGhpcywgW10pO1xufTtcblxuLyoqXG4gKiBJbmRpY2F0ZSB0aGUgaW50ZW50aW9uIHRvIGluaXRpYXRlIGFuIG9BdXRoIGZsb3csIGFsbG93aW5nIGFuIGFwcHJvcHJpYXRlXG4gKiBvQXV0aCBwcm92aWRlciB0byBiZWdpbiBtb25pdG9yaW5nIGZvciByZWRpcmVjdGlvbi5cbiAqXG4gKiBAbWV0aG9kIGluaXRpYXRlT0F1dGhcbiAqIEBwYXJhbSB7c3RyaW5nW119IHJlZGlyZWN0VVJJcyAtIG9BdXRoIHJlZGlyZWN0aW9uIFVSSXMgcmVnaXN0ZXJlZCB3aXRoIHRoZVxuICogICAgIHByb3ZpZGVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY29udGludWF0aW9uIC0gRnVuY3Rpb24gdG8gY2FsbCB3aGVuIGNvbXBsZXRlXG4gKiAgICBFeHBlY3RlZCB0byBzZWUgYSB2YWx1ZSBvZiBzY2hlbWE6IHt7cmVkaXJlY3Q6U3RyaW5nLCBzdGF0ZTpTdHJpbmd9fVxuICogICAgd2hlcmUgJ3JlZGlyZWN0JyBpcyB0aGUgY2hvc2VuIHJlZGlyZWN0IFVSSVxuICogICAgYW5kICdzdGF0ZScgaXMgdGhlIHN0YXRlIHRvIHBhc3MgdG8gdGhlIFVSSSBvbiBjb21wbGV0aW9uIG9mIG9BdXRoXG4gKi9cbk9BdXRoLnByb3RvdHlwZS5pbml0aWF0ZU9BdXRoID0gZnVuY3Rpb24gKHJlZGlyZWN0VVJJcywgY29udGludWF0aW9uKSB7XG4gIHZhciBwcm9taXNlLCBpO1xuICB2YXIgc3VjY2Vzc0NhbGxiYWNrID0gZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgdGhpcy5vbmdvaW5nW3Jlc3VsdC5zdGF0ZV0gPSB0aGlzLmhhbmRsZXJzW2ldO1xuICAgIGNvbnRpbnVhdGlvbihyZXN1bHQpO1xuICB9LmJpbmQodGhpcyk7XG5cbiAgZm9yIChpID0gMDsgaSA8IHRoaXMuaGFuZGxlcnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICBpZiAodGhpcy5oYW5kbGVyc1tpXS5pbml0aWF0ZU9BdXRoKHJlZGlyZWN0VVJJcywgc3VjY2Vzc0NhbGxiYWNrKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuICAvL0lmIGhlcmUsIHdlIGhhdmUgbm8gY29tcGF0aWJsZSBwcm92aWRlcnNcbiAgY29udGludWF0aW9uKG51bGwsIHtcbiAgICAnZXJyY29kZSc6ICdVTktOT1dOJyxcbiAgICAnbWVzc2FnZSc6ICdObyByZXF1ZXN0ZWQgcmVkaXJlY3RzIGNhbiBiZSBoYW5kbGVkLidcbiAgfSk7XG4gIHJldHVybjtcbn07XG5cbi8qKlxuICogb0F1dGggY2xpZW50LXNpZGUgZmxvdyAtIGxhdW5jaCB0aGUgcHJvdmlkZWQgVVJMXG4gKiBUaGlzIG11c3QgYmUgY2FsbGVkIGFmdGVyIGluaXRpYXRlT0F1dGggd2l0aCB0aGUgcmV0dXJuZWQgc3RhdGUgb2JqZWN0XG4gKlxuICogQG1ldGhvZCBsYXVuY2hBdXRoRmxvd1xuICogQHBhcmFtIHtTdHJpbmd9IGF1dGhVcmwgLSBUaGUgVVJMIHRoYXQgaW5pdGlhdGVzIHRoZSBhdXRoIGZsb3cuXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCBzdHJpbmc+fSBzdGF0ZU9iaiAtIFRoZSByZXR1cm4gdmFsdWUgZnJvbSBpbml0aWF0ZU9BdXRoXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb250aW51YXRpb24gLSBGdW5jdGlvbiB0byBjYWxsIHdoZW4gY29tcGxldGVcbiAqICAgIEV4cGVjdGVkIHRvIHNlZSBhIFN0cmluZyB2YWx1ZSB0aGF0IGlzIHRoZSByZXNwb25zZSBVcmwgY29udGFpbmluZyB0aGUgYWNjZXNzIHRva2VuXG4gKi9cbk9BdXRoLnByb3RvdHlwZS5sYXVuY2hBdXRoRmxvdyA9IGZ1bmN0aW9uKGF1dGhVcmwsIHN0YXRlT2JqLCBjb250aW51YXRpb24pIHtcbiAgaWYgKCF0aGlzLm9uZ29pbmcuaGFzT3duUHJvcGVydHkoc3RhdGVPYmouc3RhdGUpKSB7XG4gICAgY29udGludWF0aW9uKHVuZGVmaW5lZCwge1xuICAgICAgJ2VycmNvZGUnOiAnVU5LTk9XTicsXG4gICAgICAnbWVzc2FnZSc6ICdZb3UgbXVzdCBiZWdpbiB0aGUgb0F1dGggZmxvdyB3aXRoIGluaXRpYXRlT0F1dGggZmlyc3QnXG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGhpcy5vbmdvaW5nW3N0YXRlT2JqLnN0YXRlXS5sYXVuY2hBdXRoRmxvdyhhdXRoVXJsLCBzdGF0ZU9iaiwgY29udGludWF0aW9uKTtcbiAgZGVsZXRlIHRoaXMub25nb2luZ1tzdGF0ZU9iai5zdGF0ZV07XG59O1xuXG5leHBvcnRzLnJlZ2lzdGVyID0gT0F1dGgucmVnaXN0ZXI7XG5leHBvcnRzLnJlc2V0ID0gT0F1dGgucmVzZXQ7XG5leHBvcnRzLnByb3ZpZGVyID0gT0F1dGguYmluZCh0aGlzLCBbXSk7XG5leHBvcnRzLm5hbWUgPSAnY29yZS5vYXV0aCc7XG4iLCIvKmpzbGludCBpbmRlbnQ6Mix3aGl0ZTp0cnVlLHNsb3BweTp0cnVlLG5vZGU6dHJ1ZSAqL1xudmFyIEV2ZW50SW50ZXJmYWNlID0gcmVxdWlyZSgnLi4vLi4vc3JjL3Byb3h5L2V2ZW50SW50ZXJmYWNlJyk7XG52YXIgQ29uc3VtZXIgPSByZXF1aXJlKCcuLi8uLi9zcmMvY29uc3VtZXInKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vLi4vc3JjL3V0aWwnKTtcblxuLyoqXG4gKiBDb3JlIGZyZWVkb20gc2VydmljZXMgYXZhaWxhYmxlIHRvIGFsbCBtb2R1bGVzLlxuICogQ3JlYXRlZCBieSB0aGUgZW52aXJvbm1lbnQgaGVscGVyIGluIHJlc3BvbnNlIHRvIGEgJ2NvcmUnIHJlcXVlc3QuXG4gKiBAQ2xhc3MgQ29yZV91bnByaXZpbGVnZWRcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtNYW5hZ2VyfSBtYW5hZ2VyIFRoZSBtYW5hZ2VyIHRoaXMgY29yZSBpcyBjb25uZWN0ZWQgd2l0aC5cbiAqIEBwcml2YXRlXG4gKi9cbnZhciBDb3JlX3VucHJpdmlsZWdlZCA9IGZ1bmN0aW9uKG1hbmFnZXIsIHBvc3RNZXNzYWdlKSB7XG4gIHRoaXMubWFuYWdlciA9IG1hbmFnZXI7XG4gIHRoaXMuZGVidWcgPSB0aGlzLm1hbmFnZXIuZGVidWc7XG59O1xuXG5Db3JlX3VucHJpdmlsZWdlZC51bmJvdW5kQ2hhbm5lbHMgPSB7fTtcblxuQ29yZV91bnByaXZpbGVnZWQuY29udGV4dElkID0gdW5kZWZpbmVkO1xuXG4vKipcbiAqIENyZWF0ZSBhIGN1c3RvbSBjaGFubmVsLlxuICogUmV0dXJucyB0aGUgc3RydWN0dXJlIHtjaGFubmVsOiBQcm94eSwgaWRlbnRpZmllcjogT2JqZWN0fSxcbiAqIHdoZXJlIHRoZSBpZGVudGlmaWVyIGNhbiBiZSAncmVkZWVtZWQnIGJ5IGFub3RoZXIgbW9kdWxlIG9yIHByb3ZpZGVyIHVzaW5nXG4gKiBiaW5kIGNoYW5uZWwsIGF0IHdoaWNoIHBvaW50IHRoZSBkZWZlcnJlZCBvYmplY3Qgd2lsbCByZXNvbHZlIHdpdGggYSBjaGFubmVsXG4gKiBiZXR3ZWVuIHRoZSB0d28gZW5kcG9pbnRzLlxuICogQG1ldGhvZCBjcmVhdGVDaGFubmVsXG4gKiBAcGFyYW1zIHtGdW5jdGlvbn0gY29udGludWF0aW9uIE1ldGhvZCB0byBjYWxsIHdpdGggdGhlIGNvc250cnVjdGVkIHN0cnVjdHVyZS5cbiAqL1xuQ29yZV91bnByaXZpbGVnZWQucHJvdG90eXBlLmNyZWF0ZUNoYW5uZWwgPSBmdW5jdGlvbihjb250aW51YXRpb24pIHtcbiAgdmFyIHByb3h5ID0gbmV3IENvbnN1bWVyKEV2ZW50SW50ZXJmYWNlLCB0aGlzLm1hbmFnZXIuZGVidWcpLFxuICAgICAgaWQgPSB1dGlsLmdldElkKCksXG4gICAgICBjaGFuID0gdGhpcy5nZXRDaGFubmVsKHByb3h5KTtcbiAgdGhpcy5tYW5hZ2VyLnNldHVwKHByb3h5KTtcblxuICBpZiAodGhpcy5tYW5hZ2VyLmRlbGVnYXRlICYmIHRoaXMubWFuYWdlci50b0RlbGVnYXRlLmNvcmUpIHtcbiAgICB0aGlzLm1hbmFnZXIuZW1pdCh0aGlzLm1hbmFnZXIuZGVsZWdhdGUsIHtcbiAgICAgIHR5cGU6ICdEZWxlZ2F0aW9uJyxcbiAgICAgIHJlcXVlc3Q6ICdoYW5kbGUnLFxuICAgICAgZmxvdzogJ2NvcmUnLFxuICAgICAgbWVzc2FnZToge1xuICAgICAgICB0eXBlOiAncmVnaXN0ZXInLFxuICAgICAgICBpZDogaWRcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBDb3JlX3VucHJpdmlsZWdlZC51bmJvdW5kQ2hhbm5lbHNbaWRdID0ge1xuICAgIGxvY2FsOiB0cnVlLFxuICAgIHByb3h5OiBwcm94eVxuICB9O1xuXG4gIHByb3h5Lm9uY2UoJ3N0YXJ0JywgdGhpcy5nZXRDaGFubmVsLmJpbmQodGhpcywgcHJveHkpKTtcblxuICBjb250aW51YXRpb24oe1xuICAgIGNoYW5uZWw6IGNoYW4sXG4gICAgaWRlbnRpZmllcjogaWRcbiAgfSk7XG59O1xuXG5Db3JlX3VucHJpdmlsZWdlZC5wcm90b3R5cGUuZ2V0Q2hhbm5lbCA9IGZ1bmN0aW9uKHByb3h5KSB7XG4gIHZhciBpZmFjZSA9IHByb3h5LmdldFByb3h5SW50ZXJmYWNlKCksXG4gICAgICBjaGFuID0gaWZhY2UoKTtcbiAgY2hhbi5jbG9zZSA9IGlmYWNlLmNsb3NlO1xuICBjaGFuLm9uQ2xvc2UgPSBpZmFjZS5vbkNsb3NlO1xuICBpZmFjZS5vbkNsb3NlKGNoYW4sIGZ1bmN0aW9uKCkge1xuICAgIHByb3h5LmRvQ2xvc2UoKTtcbiAgfSk7XG4gIHJldHVybiBjaGFuO1xufTtcblxuLyoqXG4gKiBSZWNlaXZlIGEgbWVzc2FnZSBmcm9tIGFub3RoZXIgY29yZSBpbnN0YW5jZS5cbiAqIE5vdGU6IENvcmVfdW5wcml2aWxlZ2VkIGlzIG5vdCByZWdpc3RlcmVkIG9uIHRoZSBodWIuIGl0IGlzIGEgcHJvdmlkZXIsXG4gKiAgICAgYXMgaXQncyBsb2NhdGlvbiBhbmQgbmFtZSB3b3VsZCBpbmRpY2F0ZS4gVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgYnlcbiAqICAgICBwb3J0LWFwcCB0byByZWxheSBtZXNzYWdlcyB1cCB0byBoaWdoZXIgbGV2ZWxzLiAgTW9yZSBnZW5lcmFsbHksIHRoZVxuICogICAgIG1lc3NhZ2VzIGVtaXR0ZWQgYnkgdGhlIGNvcmUgdG8gJ3RoaXMubWFuYWdlci5lbWl0KHRoaXMubWFuYW5hZ2UuZGVsZWdhdGUnXG4gKiAgICAgU2hvdWxkIGJlIG9uTWVzc2FnZWQgdG8gdGhlIGNvbnRyb2xsaW5nIGNvcmUuXG4gKiBAcGFyYW0ge1N0cmluZ30gc291cmNlIFRoZSBzb3VyY2Ugb2YgdGhlIG1lc3NhZ2UuXG4gKiBAcGFyYW0ge09iamVjdH0gbXNnIFRoZSBtZXNzc2FnZSBmcm9tIGFuIGlzb2xhdGVkIGNvcmUgcHJvdmlkZXIuXG4gKi9cbkNvcmVfdW5wcml2aWxlZ2VkLnByb3RvdHlwZS5vbk1lc3NhZ2UgPSBmdW5jdGlvbihzb3VyY2UsIG1zZykge1xuICBpZiAobXNnLnR5cGUgPT09ICdyZWdpc3RlcicpIHtcbiAgICBDb3JlX3VucHJpdmlsZWdlZC51bmJvdW5kQ2hhbm5lbHNbbXNnLmlkXSA9IHtcbiAgICAgIHJlbW90ZTogdHJ1ZSxcbiAgICAgIHJlc29sdmU6IG1zZy5yZXBseSxcbiAgICAgIHNvdXJjZTogc291cmNlXG4gICAgfTtcbiAgfSBlbHNlIGlmIChtc2cudHlwZSA9PT0gJ2NsZWFyJykge1xuICAgIGRlbGV0ZSBDb3JlX3VucHJpdmlsZWdlZC51bmJvdW5kQ2hhbm5lbHNbbXNnLmlkXTtcbiAgfSBlbHNlIGlmIChtc2cudHlwZSA9PT0gJ2JpbmQnKSB7XG4gICAgaWYgKENvcmVfdW5wcml2aWxlZ2VkLnVuYm91bmRDaGFubmVsc1ttc2cuaWRdKSB7XG4gICAgICB0aGlzLmJpbmRDaGFubmVsKG1zZy5pZCwgZnVuY3Rpb24oKSB7fSwgc291cmNlKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQmluZCBhIGN1c3RvbSBjaGFubmVsLlxuICogQ3JlYXRlcyBhIHByb3h5IGludGVyZmFjZSB0byB0aGUgY3VzdG9tIGNoYW5uZWwsIHdoaWNoIHdpbGwgYmUgYm91bmQgdG9cbiAqIHRoZSBwcm94eSBvYnRhaW5lZCB0aHJvdWdoIGFuIGVhcmxpZXIgY3JlYXRlQ2hhbm5lbCBjYWxsLlxuICogY2hhbm5lbCB0byBhIHByb3h5LlxuICogQG1ldGhvZCBiaW5kQ2hhbm5lbFxuICogQHBhcmFtIHtPYmplY3R9IGlkZW50aWZpZXIgQW4gaWRlbnRpZmllciBvYnRhaW5lZCB0aHJvdWdoIGNyZWF0ZUNoYW5uZWwuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb250aW51YXRpb24gQSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2l0aCB0aGUgcHJveHkuXG4gKi9cbkNvcmVfdW5wcml2aWxlZ2VkLnByb3RvdHlwZS5iaW5kQ2hhbm5lbCA9IGZ1bmN0aW9uKGlkZW50aWZpZXIsIGNvbnRpbnVhdGlvbiwgc291cmNlKSB7XG4gIHZhciB0b0JpbmQgPSBDb3JlX3VucHJpdmlsZWdlZC51bmJvdW5kQ2hhbm5lbHNbaWRlbnRpZmllcl0sXG4gICAgICBuZXdTb3VyY2UgPSAhc291cmNlO1xuXG4gIC8vIHdoZW4gYmluZENoYW5uZWwgaXMgY2FsbGVkIGRpcmVjdGx5LCBzb3VyY2Ugd2lsbCBiZSB1bmRlZmluZWQuXG4gIC8vIFdoZW4gaXQgaXMgcHJvcG9nYXRlZCBieSBvbk1lc3NhZ2UsIGEgc291cmNlIGZvciBiaW5kaW5nIHdpbGwgYWxyZWFkeSBleGlzdC5cbiAgaWYgKG5ld1NvdXJjZSkge1xuICAgIHRoaXMuZGVidWcuZGVidWcoJ21ha2luZyBsb2NhbCBwcm94eSBmb3IgY29yZSBiaW5kaW5nJyk7XG4gICAgc291cmNlID0gbmV3IENvbnN1bWVyKEV2ZW50SW50ZXJmYWNlLCB0aGlzLmRlYnVnKTtcbiAgICB0aGlzLm1hbmFnZXIuc2V0dXAoc291cmNlKTtcbiAgfVxuXG4gIC8vIElmIHRoaXMgaXMgYSBrbm93biBpZGVudGlmaWVyIGFuZCBpcyBpbiB0aGUgc2FtZSBjb250ZXh0LCBiaW5kaW5nIGlzIGVhc3kuXG4gIGlmICh0b0JpbmQgJiYgdG9CaW5kLmxvY2FsKSB7XG4gICAgdGhpcy5kZWJ1Zy5kZWJ1ZygnQmluZGluZyBhIGNoYW5uZWwgdG8gcG9ydCBvbiB0aGlzIGh1YjonICsgc291cmNlKTtcbiAgICB0aGlzLm1hbmFnZXIuY3JlYXRlTGluayhzb3VyY2UsIGlkZW50aWZpZXIsIHRvQmluZC5wcm94eSwgJ2RlZmF1bHQnKTtcbiAgICBkZWxldGUgQ29yZV91bnByaXZpbGVnZWQudW5ib3VuZENoYW5uZWxzW2lkZW50aWZpZXJdO1xuICAgIGlmICh0aGlzLm1hbmFnZXIuZGVsZWdhdGUgJiYgdGhpcy5tYW5hZ2VyLnRvRGVsZWdhdGUuY29yZSkge1xuICAgICAgdGhpcy5tYW5hZ2VyLmVtaXQodGhpcy5tYW5hZ2VyLmRlbGVnYXRlLCB7XG4gICAgICAgIHR5cGU6ICdEZWxlZ2F0aW9uJyxcbiAgICAgICAgcmVxdWVzdDogJ2hhbmRsZScsXG4gICAgICAgIGZsb3c6ICdjb3JlJyxcbiAgICAgICAgbWVzc2FnZToge1xuICAgICAgICAgIHR5cGU6ICdjbGVhcicsXG4gICAgICAgICAgaWQ6IGlkZW50aWZpZXJcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHRvQmluZCAmJiB0b0JpbmQucmVtb3RlKSB7XG4gICAgdGhpcy5kZWJ1Zy5kZWJ1ZygnQmluZGluZyBhIGNoYW5uZWwgaW50byBhIG1vZHVsZS4nKTtcbiAgICB0aGlzLm1hbmFnZXIuY3JlYXRlTGluayhcbiAgICAgICAgc291cmNlLFxuICAgICAgICBuZXdTb3VyY2UgPyAnZGVmYXVsdCcgOiBpZGVudGlmaWVyLFxuICAgICAgICB0b0JpbmQuc291cmNlLFxuICAgICAgICBpZGVudGlmaWVyKTtcbiAgICB0b0JpbmQucmVzb2x2ZSh7XG4gICAgICB0eXBlOiAnQmluZCBDaGFubmVsJyxcbiAgICAgIHJlcXVlc3Q6J2NvcmUnLFxuICAgICAgZmxvdzogJ2NvcmUnLFxuICAgICAgbWVzc2FnZToge1xuICAgICAgICB0eXBlOiAnYmluZCcsXG4gICAgICAgIGlkOiBpZGVudGlmaWVyXG4gICAgICB9XG4gICAgfSk7XG4gICAgZGVsZXRlIENvcmVfdW5wcml2aWxlZ2VkLnVuYm91bmRDaGFubmVsc1tpZGVudGlmaWVyXTtcbiAgfSBlbHNlIGlmICh0aGlzLm1hbmFnZXIuZGVsZWdhdGUgJiYgdGhpcy5tYW5hZ2VyLnRvRGVsZWdhdGUuY29yZSkge1xuICAgIHRoaXMuZGVidWcuaW5mbygnZGVsZWdhdGluZyBjaGFubmVsIGJpbmQgZm9yIGFuIHVua25vd24gSUQ6JyArIGlkZW50aWZpZXIpO1xuICAgIHRoaXMubWFuYWdlci5lbWl0KHRoaXMubWFuYWdlci5kZWxlZ2F0ZSwge1xuICAgICAgdHlwZTogJ0RlbGVnYXRpb24nLFxuICAgICAgcmVxdWVzdDogJ2hhbmRsZScsXG4gICAgICBmbG93OiAnY29yZScsXG4gICAgICBtZXNzYWdlOiB7XG4gICAgICAgIHR5cGU6ICdiaW5kJyxcbiAgICAgICAgaWQ6IGlkZW50aWZpZXJcbiAgICAgIH1cbiAgICB9KTtcbiAgICBzb3VyY2Uub25jZSgnc3RhcnQnLCBmdW5jdGlvbihwLCBjYikge1xuICAgICAgY2IodGhpcy5nZXRDaGFubmVsKHApKTtcbiAgICB9LmJpbmQodGhpcywgc291cmNlLCBjb250aW51YXRpb24pKTtcbiAgICB0aGlzLm1hbmFnZXIuY3JlYXRlTGluayhzb3VyY2UsXG4gICAgICAgICdkZWZhdWx0JyxcbiAgICAgICAgdGhpcy5tYW5hZ2VyLmh1Yi5nZXREZXN0aW5hdGlvbih0aGlzLm1hbmFnZXIuZGVsZWdhdGUpLFxuICAgICAgICBpZGVudGlmaWVyKTtcbiAgICBkZWxldGUgQ29yZV91bnByaXZpbGVnZWQudW5ib3VuZENoYW5uZWxzW2lkZW50aWZpZXJdO1xuICAgIHJldHVybjtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmRlYnVnLndhcm4oJ0Fza2VkIHRvIGJpbmQgdW5rbm93biBjaGFubmVsOiAnICsgaWRlbnRpZmllcik7XG4gICAgdGhpcy5kZWJ1Zy5sb2coQ29yZV91bnByaXZpbGVnZWQudW5ib3VuZENoYW5uZWxzKTtcbiAgICBjb250aW51YXRpb24oKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoc291cmNlLmdldEludGVyZmFjZSkge1xuICAgIGNvbnRpbnVhdGlvbih0aGlzLmdldENoYW5uZWwoc291cmNlKSk7XG4gIH0gZWxzZSB7XG4gICAgY29udGludWF0aW9uKCk7XG4gIH1cbn07XG5cbi8qKlxuICogR2V0IHRoZSBJRCBvZiB0aGUgY3VycmVudCBmcmVlZG9tLmpzIGNvbnRleHQuICBQcm92aWRlcyBhblxuICogYXJyYXkgb2YgbW9kdWxlIFVSTHMsIHRoZSBsaW5lYWdlIG9mIHRoZSBjdXJyZW50IGNvbnRleHQuXG4gKiBXaGVuIG5vdCBpbiBhbiBhcHBsaWNhdGlvbiBjb250ZXh0LCB0aGUgSUQgaXMgdGhlIGxpbmVhZ2VcbiAqIG9mIHRoZSBjdXJyZW50IFZpZXcuXG4gKiBAbWV0aG9kIGdldElkXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gY2FsbGVkIHdpdGggSUQgaW5mb3JtYXRpb24uXG4gKi9cbkNvcmVfdW5wcml2aWxlZ2VkLnByb3RvdHlwZS5nZXRJZCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIC8vIFRPRE86IG1ha2Ugc3VyZSBjb250ZXh0SUQgaXMgcHJvcGVybHkgZnJvemVuLlxuICBjYWxsYmFjayhDb3JlX3VucHJpdmlsZWdlZC5jb250ZXh0SWQpO1xufTtcblxuLyoqXG4gKiBHZXQgYSBsb2dnZXIgZm9yIGxvZ2dpbmcgdG8gdGhlIGZyZWVkb20uanMgbG9nZ2VyLiBQcm92aWRlcyBhXG4gKiBsb2cgb2JqZWN0IHdpdGggYW4gaW50ZXJmYWNlIHNpbWlsYXIgdG8gdGhlIHN0YW5kYXJkIGphdmFzY3JpcHQgY29uc29sZSxcbiAqIHdoaWNoIGxvZ3MgdmlhIGRlYnVnLlxuICogQG1ldGhvZCBnZXRMb2dnZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBsb2dnZXIsIHVzZWQgYXMgaXRzICdzb3VyY2UnXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdG8gY2FsbCB3aXRoIHRoZSBsb2dnZXIuXG4gKi9cbkNvcmVfdW5wcml2aWxlZ2VkLnByb3RvdHlwZS5nZXRMb2dnZXIgPSBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaykge1xuICBjYWxsYmFjayh0aGlzLm1hbmFnZXIuZGVidWcuZ2V0TG9nZ2VyKG5hbWUpKTtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBJRCBvZiB0aGUgY3VycmVudCBmcmVlZG9tLmpzIGNvbnRleHQuXG4gKiBAbWV0aG9kIHNldElkXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtTdHJpbmdbXX0gaWQgVGhlIGxpbmVhZ2Ugb2YgdGhlIGN1cnJlbnQgY29udGV4dC5cbiAqL1xuQ29yZV91bnByaXZpbGVnZWQucHJvdG90eXBlLnNldElkID0gZnVuY3Rpb24oaWQpIHtcbiAgQ29yZV91bnByaXZpbGVnZWQuY29udGV4dElkID0gaWQ7XG59O1xuXG5leHBvcnRzLnByb3ZpZGVyID0gQ29yZV91bnByaXZpbGVnZWQ7XG5leHBvcnRzLm5hbWUgPSBcImNvcmVcIjtcbiIsIi8qZ2xvYmFscyBkb2N1bWVudCAqL1xyXG4vKmpzbGludCBpbmRlbnQ6MixzbG9wcHk6dHJ1ZSxub2RlOnRydWUgKi9cclxudmFyIHV0aWwgPSByZXF1aXJlKCcuLi8uLi9zcmMvdXRpbCcpO1xyXG52YXIgUHJvbWlzZUNvbXBhdCA9IHJlcXVpcmUoJ2VzNi1wcm9taXNlJykuUHJvbWlzZTtcclxuXHJcbi8qKlxyXG4gKiBBIGZyZWVkb20uanMgdmlldyBpcyB0aGUgaW50ZXJmYWNlIGZvciB1c2VyIGludGVyYWN0aW9uLlxyXG4gKiBBIHZpZXcgZXhpc3RzIGFzIGFuIGlGcmFtZSwgd2hpY2ggaXMgc2hvd24gdG8gdGhlIHVzZXIgaW4gc29tZSB3YXkuXHJcbiAqIGNvbW11bmljYXRpb24gYmV0d2VlbiB0aGUgdmlldyBhbmQgdGhlIGZyZWVkb20uanMgbW9kdWxlIGlzIHBlcmZvcm1lZFxyXG4gKiB0aHJvdWdoIHRoZSBIVE1MNSBwb3N0TWVzc2FnZSBtZWNoYW5pc20sIHdoaWNoIHRoaXMgcHJvdmlkZXIgdHJhbnNsYXRlc1xyXG4gKiB0byBmcmVlZG9tLmpzIG1lc3NhZ2UgZXZlbnRzLlxyXG4gKiBAQ2xhc3MgVmlld191bnByaXZpbGVnZWRcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSB7VmlldyBQcm92aWRlcn0gcHJvdmlkZXJcclxuICogQHBhcmFtIHtwb3J0Lk1vZHVsZX0gY2FsbGVyIFRoZSBtb2R1bGUgY3JlYXRpbmcgdGhpcyBwcm92aWRlci5cclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZGlzcGF0Y2hFdmVudCBGdW5jdGlvbiB0byBjYWxsIHRvIGVtaXQgZXZlbnRzLlxyXG4gKi9cclxudmFyIENvcmVfVmlldyA9IGZ1bmN0aW9uIChwcm92aWRlciwgY2FsbGVyLCBkaXNwYXRjaEV2ZW50KSB7XHJcbiAgdGhpcy5wcm92aWRlciA9IHByb3ZpZGVyO1xyXG4gIHRoaXMuZGlzcGF0Y2hFdmVudCA9IGRpc3BhdGNoRXZlbnQ7XHJcbiAgdGhpcy5tb2R1bGUgPSBjYWxsZXI7XHJcbiAgdGhpcy5tb2R1bGUub25jZSgnY2xvc2UnLCB0aGlzLmNsb3NlLmJpbmQodGhpcywgZnVuY3Rpb24gKCkge30pKTtcclxuICB1dGlsLmhhbmRsZUV2ZW50cyh0aGlzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUaGUgaXMgdGhlIGRlZmF1bHQgcHJvdmlkZXIgZm9yIGNvcmUudmlldywgdW5sZXNzIG92ZXJyaWRkZW4gYnkgY29udGV4dCBvclxyXG4gKiBhIHVzZXIgc3VwcGxpZWQgcHJvdmlkZXIuIFRoZSBpbnRlcmZhY2UgaXMgZG9jdW1lbnRlZCBhdDpcclxuICogaHR0cHM6Ly9naXRodWIuY29tL2ZyZWVkb21qcy9mcmVlZG9tL3dpa2kvZnJlZWRvbS5qcy1WaWV3c1xyXG4gKlxyXG4gKiBHZW5lcmFsbHksIGEgdmlldyBwcm92aWRlciBjb25zaXN0cyBvZiAzIG1ldGhvZHM6XHJcbiAqIG9uT3BlbiBpcyBjYWxsZWQgd2hlbiBhIHZpZXcgc2hvdWxkIGJlIHNob3duLlxyXG4gKiAgICAgaWQgLSBpcyBhIHVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGlzIHZpZXcsIHVzZWQgb24gc3Vic2VxdWVudCBjYWxsc1xyXG4gKiAgICAgICAgICBmb3IgY29tbXVuaWNhdGlvbiBhbmQgdG8gZXZlbnR1YWxseSBjbG9zZSB0aGUgdmlldy5cclxuICogICAgIG5hbWUgLSBpcyB0aGUgbmFtZSBvZiB0aGUgdmlldyAoYXMgZGVmaW5lZCBpbiB0aGUgbWFuaWZlc3QpLFxyXG4gKiAgICAgICAgICAgIGluIG9yZGVyIHRvIHBsYWNlIGl0IGFwcHJvcHJpYXRlbHkuXHJcbiAqICAgICBwYWdlIC0gaXMgdGhlIHJlc29sdmVkIFVSTCB0byBvcGVuLlxyXG4gKiAgICAgcmVzb3VyY2VzIC0gaXMgYW4gYXJyYXkgb2YgcmVzb2x2ZWQgVVJMcyB3aGljaCBhcmUgcmVmZXJlbmNlZC5cclxuICogICAgIHBvc3RNZXNzYWdlIC0gaXMgYSBmdW5jdGlvbiB0byBjYWxsIHdoZW4gbWVzc2FnZXMgYXJlIGVtaXR0ZWRcclxuICogICAgICAgICAgICAgICAgICAgYnkgdGhlIHdpbmRvdyBpbiB3aGljaCB0aGUgdmlldyBpcyBvcGVuZWQuXHJcbiAqIG9uT3BlbiByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGNvbXBsZXRlcyB3aGVuIHRoZSB2aWV3IGlzIGxvYWRlZC5cclxuICogb25NZXNzYWdlIGlzIGNhbGxlZCB0byBzZW5kIGEgbWVzc2FnZSB0byBhbiBvcGVuIHZpZXcuXHJcbiAqICAgICBpZCAtIGlzIHRoZSB1bmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIG9wZW4gdmlldy5cclxuICogICAgIG1lc3NhZ2UgLSBpcyB0aGUgbWVzc2FnZSB0byBwb3N0TWVzc2FnZSB0byB0aGUgdmlldydzIHdpbmRvdy5cclxuICogb25DbG9zZSBpcyBjYWxsZWQgdG8gY2xvc2UgYSB2aWV3LlxyXG4gKiAgICAgaWQgLSBpcyB0aGUgdW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB2aWV3LlxyXG4gKi9cclxuQ29yZV9WaWV3LnByb3ZpZGVyID0ge1xyXG4gIGxpc3RlbmVyOiB1bmRlZmluZWQsXHJcbiAgYWN0aXZlOiB7fSxcclxuICBvbk9wZW46IGZ1bmN0aW9uIChpZCwgbmFtZSwgcGFnZSwgcmVzb3VyY2VzLCBwb3N0TWVzc2FnZSkge1xyXG4gICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmJvZHksXHJcbiAgICAgIHJvb3QsXHJcbiAgICAgIGZyYW1lO1xyXG4gICAgXHJcbiAgICBpZiAoIXRoaXMubGlzdGVuZXIpIHtcclxuICAgICAgdGhpcy5saXN0ZW5lciA9IGZ1bmN0aW9uIChtc2cpIHtcclxuICAgICAgICB2YXIgaTtcclxuICAgICAgICBmb3IgKGkgaW4gdGhpcy5hY3RpdmUpIHtcclxuICAgICAgICAgIGlmICh0aGlzLmFjdGl2ZS5oYXNPd25Qcm9wZXJ0eShpKSAmJlxyXG4gICAgICAgICAgICAgIHRoaXMuYWN0aXZlW2ldLnNvdXJjZSA9PT0gbXNnLnNvdXJjZSkge1xyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZVtpXS5wb3N0TWVzc2FnZShtc2cuZGF0YSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9LmJpbmQodGhpcyk7XHJcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgdGhpcy5saXN0ZW5lciwgdHJ1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVmlld3Mgb3BlbiBieSBkZWZhdWx0IGluIGFuIGVsZW1lbnQgd2l0aCB0aGVpciBJRCwgb3IgZmlsbCB0aGUgcGFnZVxyXG4gICAgLy8gb3RoZXJ3aXNlLlxyXG4gICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5hbWUpKSB7XHJcbiAgICAgIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHJvb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgcm9vdC5zdHlsZS53aWR0aCA9IFwiMTAwJVwiO1xyXG4gICAgcm9vdC5zdHlsZS5oZWlnaHQgPSBcIjEwMCVcIjtcclxuICAgIHJvb3Quc3R5bGUuZGlzcGxheSA9IFwicmVsYXRpdmVcIjtcclxuXHJcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQocm9vdCk7XHJcbiAgICBcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZUNvbXBhdChmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgIGZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlmcmFtZVwiKTtcclxuICAgICAgZnJhbWUuc2V0QXR0cmlidXRlKFwic2FuZGJveFwiLCBcImFsbG93LXNjcmlwdHMgYWxsb3ctZm9ybXNcIik7XHJcbiAgICAgIGZyYW1lLnN0eWxlLndpZHRoID0gXCIxMDAlXCI7XHJcbiAgICAgIGZyYW1lLnN0eWxlLmhlaWdodCA9IFwiMTAwJVwiO1xyXG4gICAgICBmcmFtZS5zdHlsZS5ib3JkZXIgPSBcIjBcIjtcclxuICAgICAgZnJhbWUuc3R5bGUuYmFja2dyb3VuZCA9IFwidHJhbnNwYXJlbnRcIjtcclxuICAgICAgZnJhbWUuc3JjID0gcGFnZTtcclxuICAgICAgZnJhbWUuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIHJlc29sdmUsIHRydWUpO1xyXG4gICAgICBmcmFtZS5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIHJlamVjdCwgdHJ1ZSk7XHJcblxyXG4gICAgICByb290LmFwcGVuZENoaWxkKGZyYW1lKTtcclxuXHJcbiAgICAgIHRoaXMuYWN0aXZlW2lkXSA9IHtcclxuICAgICAgICBwb3N0TWVzc2FnZTogcG9zdE1lc3NhZ2UsXHJcbiAgICAgICAgY29udGFpbmVyOiBjb250YWluZXIsXHJcbiAgICAgICAgcm9vdDogcm9vdCxcclxuICAgICAgICBzb3VyY2U6IGZyYW1lLmNvbnRlbnRXaW5kb3dcclxuICAgICAgfTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgfSxcclxuICBvbk1lc3NhZ2U6IGZ1bmN0aW9uIChpZCwgbWVzc2FnZSkge1xyXG4gICAgdGhpcy5hY3RpdmVbaWRdLnNvdXJjZS5wb3N0TWVzc2FnZShtZXNzYWdlLCAnKicpO1xyXG4gIH0sXHJcbiAgb25DbG9zZTogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICB0aGlzLmFjdGl2ZVtpZF0uY29udGFpbmVyLnJlbW92ZUNoaWxkKHRoaXMuYWN0aXZlW2lkXS5yb290KTtcclxuICAgIGRlbGV0ZSB0aGlzLmFjdGl2ZVtpZF07XHJcbiAgICBcclxuICAgIGlmIChPYmplY3Qua2V5cyh0aGlzLmFjdGl2ZSkubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgdGhpcy5saXN0ZW5lciwgdHJ1ZSk7XHJcbiAgICAgIHRoaXMubGlzdGVuZXIgPSB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFzayBmb3IgdGhpcyB2aWV3IHRvIG9wZW4gYSBzcGVjaWZpYyBsb2NhdGlvbiwgZWl0aGVyIGEgRmlsZSByZWxhdGl2ZSB0b1xyXG4gKiB0aGUgbG9hZGVyLCBvciBhbiBleHBsaWNpdCBjb2RlIGxvY2F0aW9uLlxyXG4gKiBAbWV0aG9kIHNob3dcclxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgVGhlIGlkZW50aWZpZXIgb2YgdGhlIHZpZXcuXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbnRpbnVhdGlvbiBGdW5jdGlvbiB0byBjYWxsIHdoZW4gdmlldyBpcyBsb2FkZWQuXHJcbiAqL1xyXG5Db3JlX1ZpZXcucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiAobmFtZSwgY29udGludWF0aW9uKSB7XHJcbiAgaWYgKHRoaXMuaWQpIHtcclxuICAgIHJldHVybiBjb250aW51YXRpb24odW5kZWZpbmVkLCB7XHJcbiAgICAgIGVycmNvZGU6ICdBTFJFQURZX09QRU4nLFxyXG4gICAgICBtZXNzYWdlOiAnQ2Fubm90IHNob3cgbXVsdGlwbGUgdmlld3MgdGhyb3VnaCBvbmUgaW5zdGFuY2UuJ1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHRoaXMuaWQgPSB1dGlsLmdldElkKCk7XHJcblxyXG4gIHZhciBjb25maWcgPSB0aGlzLm1vZHVsZS5tYW5pZmVzdC52aWV3cyxcclxuICAgIHRvUmVzb2x2ZSA9IFtdO1xyXG4gIGlmICghY29uZmlnIHx8ICFjb25maWdbbmFtZV0pIHtcclxuICAgIHJldHVybiBjb250aW51YXRpb24odW5kZWZpbmVkLCB7XHJcbiAgICAgIGVycmNvZGU6ICdOT05fRVhJU1RBTlQnLFxyXG4gICAgICBtZXNzYWdlOiAnVmlldyBub3QgZm91bmQ6ICcgKyBuYW1lXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGlmIChjb25maWdbbmFtZV0ubWFpbiAmJiBjb25maWdbbmFtZV0uZmlsZXMpIHtcclxuICAgIHRvUmVzb2x2ZSA9IGNvbmZpZ1tuYW1lXS5maWxlcy5jb25jYXQoY29uZmlnW25hbWVdLm1haW4pO1xyXG4gICAgUHJvbWlzZUNvbXBhdC5hbGwodG9SZXNvbHZlLm1hcChmdW5jdGlvbiAoZm5hbWUpIHtcclxuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLnJlc291cmNlLmdldCh0aGlzLm1vZHVsZS5tYW5pZmVzdElkLCBmbmFtZSk7XHJcbiAgICB9LmJpbmQodGhpcykpKS50aGVuKGZ1bmN0aW9uIChmaWxlcykge1xyXG4gICAgICB0aGlzLnByb3ZpZGVyLm9uT3Blbih0aGlzLmlkLFxyXG4gICAgICAgICAgbmFtZSxcclxuICAgICAgICAgIGZpbGVzW2ZpbGVzLmxlbmd0aCAtIDFdLFxyXG4gICAgICAgICAgZmlsZXMsXHJcbiAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQuYmluZCh0aGlzLCAnbWVzc2FnZScpKS50aGVuKFxyXG4gICAgICAgIGNvbnRpbnVhdGlvbixcclxuICAgICAgICBjb250aW51YXRpb24uYmluZCh7fSwgdW5kZWZpbmVkKVxyXG4gICAgICApO1xyXG4gICAgfS5iaW5kKHRoaXMpLCBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgIHRoaXMubW9kdWxlLmRlYnVnLmVycm9yKCdVbmFibGUgdG8gb3BlbiB2aWV3ICcgKyBuYW1lICsgJzogJywgZXJyKTtcclxuICAgICAgY29udGludWF0aW9uKHVuZGVmaW5lZCwge1xyXG4gICAgICAgIGVycmNvZGU6ICdWSUVXX01BTEZPUk1FRCcsXHJcbiAgICAgICAgbWVzc2FnZTogJ01hbGZvcm1lZCBWaWV3IERlY2xhcmF0aW9uOiAnICsgZXJyXHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIGNvbnRpbnVhdGlvbih1bmRlZmluZWQsIHtcclxuICAgICAgZXJyY29kZTogJ05PTl9FWElTVEFOVCcsXHJcbiAgICAgIG1lc3NhZ2U6ICdWaWV3IG5vdCBmb3VuZDogJyArIG5hbWVcclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBpc1NlY3VyZSBkZXRlcm1pbmVzIHdoZXRoZXIgdGhlIG1vZHVsZSBjYW4gaGF2ZSBjb25maWRlbmNlIHRoYXQgaXRzXHJcbiAqIGNvbW11bmljYXRpb24gd2l0aCBpdHMgdmlldyBjYW5ub3QgYmUgaW50ZXJjZXB0ZWQgYnkgYW4gdW50cnVzdGVkIDNyZCBwYXJ0eS5cclxuICogSW4gcHJhY3RpY2UsIHRoaXMgbWVhbnMgdGhhdCBpdHMgb2theSBmb3IgdGhlIHJ1bnRpbWUgdG8gaGF2ZSBhY2Nlc3MgdG8gdGhlXHJcbiAqIG1lc3NhZ2VzLCBhbmQgaWYgdGhlIGNvbnRleHQgaXMgYSB3ZWIgc2VydmVyIG9yIGEgYnJvd3NlciBleHRlbnNpb24gdGhlblxyXG4gKiB0aGF0IGNvbnRleHQgaXMgdHJ1c3RlZC4gSG93ZXZlciwgaWYgYSBwcm92aWRlciB3YW50cyB0byBhbGxvdyB0aGVpciBlLmcuXHJcbiAqIHNvY2lhbCBwcm92aWRlciB0byBiZSB1c2VkIG9uIGFyYml0cmFyeSB3ZWJzaXRlcywgdGhpcyBtZWNoYW5pc20gbWVhbnMgdGhhdFxyXG4gKiBpZiB0aGUgd2Vic2l0ZSB1c2VzIGEgdHJ1c3RlZCB2ZXJzaW9uIG9mIHRoZSBmcmVlZG9tLmpzIGxpYnJhcnksIHRoZW4gdGhlXHJcbiAqIG1vZHVsZSBjYW4gYmUgdXNlZC5cclxuICogQG1ldGhvZCBpc1NlY3VyZVxyXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gaWYgdGhlIGNoYW5uZWwgdG8gdGhlIHZpZXcgaXMgc2VjdXJlLlxyXG4gKi9cclxuQ29yZV9WaWV3LnByb3RvdHlwZS5pc1NlY3VyZSA9IGZ1bmN0aW9uIChjb250aW51YXRpb24pIHtcclxuICBjb250aW51YXRpb24oZmFsc2UpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNlbmQgYSBtZXNzYWdlIHRvIGFuIG9wZW4gdmlldy5cclxuICogQG1ldGhvZCBwb3N0TWVzc2FnZVxyXG4gKi9cclxuQ29yZV9WaWV3LnByb3RvdHlwZS5wb3N0TWVzc2FnZSA9IGZ1bmN0aW9uIChtc2csIGNvbnRpbnVhdGlvbikge1xyXG4gIGlmICghdGhpcy5pZCkge1xyXG4gICAgcmV0dXJuIGNvbnRpbnVhdGlvbih1bmRlZmluZWQsIHtcclxuICAgICAgZXJyY29kZTogJ05PVF9PUEVOJyxcclxuICAgICAgbWVzc2FnZTogJ0Nhbm5vdCBwb3N0IG1lc3NhZ2UgdG8gdW5pbml0aWFsaXplZCB2aWV3LidcclxuICAgIH0pO1xyXG4gIH1cclxuICB0aGlzLnByb3ZpZGVyLm9uTWVzc2FnZSh0aGlzLmlkLCBtc2cpO1xyXG4gIGNvbnRpbnVhdGlvbigpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENsb3NlIGFuIGFjdGl2ZSB2aWV3LlxyXG4gKiBAbWV0aG9kIGNsb3NlXHJcbiAqL1xyXG5Db3JlX1ZpZXcucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKGNvbnRpbnVhdGlvbikge1xyXG4gIGlmICghdGhpcy5pZCkge1xyXG4gICAgcmV0dXJuIGNvbnRpbnVhdGlvbih1bmRlZmluZWQsIHtcclxuICAgICAgZXJyY29kZTogJ05PVF9PUEVOJyxcclxuICAgICAgbWVzc2FnZTogJ0Nhbm5vdCBjbG9zZSB1bmluaXRpYWxpemVkIHZpZXcuJ1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHRoaXMucHJvdmlkZXIub25DbG9zZSh0aGlzLmlkKTtcclxuICBkZWxldGUgdGhpcy5pZDtcclxuXHJcbiAgY29udGludWF0aW9uKCk7XHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIEFsbG93IGEgd2ViIHBhZ2UgdG8gcmVkZWZpbmUgYmVoYXZpb3IgZm9yIGhvdyB2aWV3cyBhcmUgc2hvd24uXHJcbiAqIEBtZXRob2QgcmVnaXN0ZXJcclxuICogQHN0YXRpY1xyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBQYWdlUHJvdmlkZXIgVGhlIGN1c3RvbSB2aWV3IGJlaGF2aW9yLlxyXG4gKi9cclxuQ29yZV9WaWV3LnJlZ2lzdGVyID0gZnVuY3Rpb24gKFBhZ2VQcm92aWRlcikge1xyXG4gIHZhciBwcm92aWRlciA9IFBhZ2VQcm92aWRlciA/IG5ldyBQYWdlUHJvdmlkZXIoKSA6IENvcmVfVmlldy5wcm92aWRlcjtcclxuICBleHBvcnRzLnByb3ZpZGVyID0gQ29yZV9WaWV3LmJpbmQodGhpcywgcHJvdmlkZXIpO1xyXG59O1xyXG5cclxuZXhwb3J0cy5wcm92aWRlciA9IENvcmVfVmlldy5iaW5kKHRoaXMsIENvcmVfVmlldy5wcm92aWRlcik7XHJcbmV4cG9ydHMubmFtZSA9ICdjb3JlLnZpZXcnO1xyXG5leHBvcnRzLnJlZ2lzdGVyID0gQ29yZV9WaWV3LnJlZ2lzdGVyO1xyXG4iLCIvKmdsb2JhbHMgY29uc29sZSAqL1xuLypqc2xpbnQgaW5kZW50OjIsd2hpdGU6dHJ1ZSxzbG9wcHk6dHJ1ZSwgbm9kZTp0cnVlICovXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uLy4uL3NyYy91dGlsJyk7XG5cbi8qKlxuICogQSBtaW5pbWFsIHByb3ZpZGVyIGltcGxlbWVudGluZyB0aGUgY29yZS5lY2hvIGludGVyZmFjZSBmb3IgaW50ZXJhY3Rpb24gd2l0aFxuICogY3VzdG9tIGNoYW5uZWxzLiAgUHJpbWFyaWx5IHVzZWQgZm9yIHRlc3RpbmcgdGhlIHJvYnVzdG5lc3Mgb2YgdGhlIGN1c3RvbVxuICogY2hhbm5lbCBpbXBsZW1lbnRhdGlvbi5cbiAqIEBDbGFzcyBFY2hvX3VucHJpdmlsZWdlZFxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge01vZHVsZX0gbW9kIFRoZSBtb2R1bGUgY3JlYXRpbmcgdGhpcyBwcm92aWRlci5cbiAqL1xudmFyIEVjaG9fdW5wcml2aWxlZ2VkID0gZnVuY3Rpb24obW9kLCBkaXNwYXRjaEV2ZW50KSB7XG4gIHRoaXMubW9kID0gbW9kO1xuICB0aGlzLmRpc3BhdGNoRXZlbnQgPSBkaXNwYXRjaEV2ZW50O1xuICB1dGlsLmhhbmRsZUV2ZW50cyh0aGlzKTtcblxuICAvLyBUaGUgQ29yZSBvYmplY3QgZm9yIG1hbmFnaW5nIGNoYW5uZWxzLlxuICB0aGlzLm1vZC5vbmNlKCdjb3JlJywgZnVuY3Rpb24oQ29yZSkge1xuICAgIHRoaXMuY29yZSA9IG5ldyBDb3JlKCk7XG4gIH0uYmluZCh0aGlzKSk7XG4gIHRoaXMubW9kLmVtaXQodGhpcy5tb2QuY29udHJvbENoYW5uZWwsIHtcbiAgICB0eXBlOiAnY29yZSByZXF1ZXN0IGRlbGVnYXRlZCB0byBlY2hvJyxcbiAgICByZXF1ZXN0OiAnY29yZSdcbiAgfSk7XG59O1xuXG4vKipcbiAqIFNldHVwIHRoZSBwcm92aWRlciB0byBlY2hvIG9uIGEgc3BlY2lmaWMgcHJveHkuIFN1YnNlcXVlbnQgbWVzc2FnZXNcbiAqIEZyb20gdGhlIGN1c3RvbSBjaGFubmVsIGJvdW5kIGhlcmUgd2lsbCBiZSByZS1lbWl0dGVkIGFzIGEgbWVzc2FnZVxuICogZnJvbSB0aGUgcHJvdmlkZXIuICBTdWJzZXF1ZW50IG1lc3NhZ2VzIHRvIHRoZSBwcm92aWRlciB3aWxsIGJlXG4gKiBlbWl0dGVkIG9uIHRoZSBib3VuZCBjaGFubmVsLlxuICogQHBhcmFtIHtPYmplY3R9IHByb3h5IFRoZSBpZGVudGlmaWVyIGZvciB0aGUgY3VzdG9tIGNoYW5uZWwgdG8gYmluZC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbnRpbnVhdGlvbiBGdW5jdGlvbiB0byBjYWxsIHdoZW4gc2V0dXAgaXMgY29tcGxldGUuXG4gKiBAbWV0aG9kIHNldHVwXG4gKi9cbkVjaG9fdW5wcml2aWxlZ2VkLnByb3RvdHlwZS5zZXR1cCA9IGZ1bmN0aW9uKHByb3h5LCBjb250aW51YXRpb24pIHtcbiAgY29udGludWF0aW9uKCk7XG4gIGlmICghdGhpcy5jb3JlKSB7XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdtZXNzYWdlJywgJ25vIGNvcmUgYXZhaWxhYmxlIHRvIHNldHVwIHByb3h5IHdpdGggYXQgZWNobycpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRoaXMuY29yZS5iaW5kQ2hhbm5lbChwcm94eSwgZnVuY3Rpb24oY2hhbikge1xuICAgIGlmICh0aGlzLmNoYW4pIHtcbiAgICAgIHRoaXMuY2hhbi5jbG9zZSgpO1xuICAgIH1cbiAgICB0aGlzLmNoYW4gPSBjaGFuO1xuICAgIHRoaXMuY2hhbi5vbkNsb3NlKGZ1bmN0aW9uKCkge1xuICAgICAgZGVsZXRlIHRoaXMuY2hhbjtcbiAgICB9LmJpbmQodGhpcykpO1xuICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgnbWVzc2FnZScsICdjaGFubmVsIGJvdW5kIHRvIGVjaG8nKTtcbiAgICB0aGlzLmNoYW4ub24oJ21lc3NhZ2UnLCBmdW5jdGlvbihtKSB7XG4gICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ21lc3NhZ2UnLCAnZnJvbSBjdXN0b20gY2hhbm5lbDogJyArIG0pO1xuICAgIH0uYmluZCh0aGlzKSk7XG4gIH0uYmluZCh0aGlzKSk7XG59O1xuXG4vKipcbiAqIFNlbmQgYSBtZXNzYWdlIHRvIHRoZSBib3VuZCBjdXN0b20gY2hhbm5lbC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIHN0cmluZyB0byBzZW5kLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY29udGludWF0aW9uIEZ1bmN0aW9uIHRvIGNhbGwgd2hlbiBzZW5kaW5nIGlzIGNvbXBsZXRlLlxuICogQG1ldGhvZCBzZW5kXG4gKi9cbkVjaG9fdW5wcml2aWxlZ2VkLnByb3RvdHlwZS5zZW5kID0gZnVuY3Rpb24oc3RyLCBjb250aW51YXRpb24pIHtcbiAgY29udGludWF0aW9uKCk7XG4gIGlmICh0aGlzLmNoYW4pIHtcbiAgICB0aGlzLmNoYW4uZW1pdCgnbWVzc2FnZScsIHN0cik7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdtZXNzYWdlJywgJ25vIGNoYW5uZWwgYXZhaWxhYmxlJyk7XG4gIH1cbn07XG5cbmV4cG9ydHMucHJvdmlkZXIgPSBFY2hvX3VucHJpdmlsZWdlZDtcbmV4cG9ydHMubmFtZSA9IFwiY29yZS5lY2hvXCI7XG4iLCIvKmdsb2JhbHMgY29uc29sZSwgUlRDUGVlckNvbm5lY3Rpb24sIHdlYmtpdFJUQ1BlZXJDb25uZWN0aW9uICovXG4vKmdsb2JhbHMgbW96UlRDUGVlckNvbm5lY3Rpb24sIFJUQ1Nlc3Npb25EZXNjcmlwdGlvbiwgUlRDSWNlQ2FuZGlkYXRlICovXG4vKmdsb2JhbHMgbW96UlRDU2Vzc2lvbkRlc2NyaXB0aW9uLCBtb3pSVENJY2VDYW5kaWRhdGUgKi9cbi8qZ2xvYmFscyBBcnJheUJ1ZmZlciwgQmxvYiAqL1xuLypqc2xpbnQgaW5kZW50OjIsc2xvcHB5OnRydWUsbm9kZTp0cnVlICovXG4vKipcbiAqIERhdGFQZWVyIC0gYSBjbGFzcyB0aGF0IHdyYXBzIHBlZXIgY29ubmVjdGlvbnMgYW5kIGRhdGEgY2hhbm5lbHMuXG4gKi9cbi8vIFRPRE86IGNoZWNrIHRoYXQgSGFuZGxpbmcgb2YgcHJhbnN3ZXIgaXMgdHJlYXRlZCBhcHByb3ByaWF0ZWx5LlxudmFyIFNpbXBsZURhdGFQZWVyU3RhdGUgPSB7XG4gIERJU0NPTk5FQ1RFRDogJ0RJU0NPTk5FQ1RFRCcsXG4gIENPTk5FQ1RJTkc6ICdDT05ORUNUSU5HJyxcbiAgQ09OTkVDVEVEOiAnQ09OTkVDVEVEJ1xufTtcblxuZnVuY3Rpb24gU2ltcGxlRGF0YVBlZXIocGVlck5hbWUsIHN0dW5TZXJ2ZXJzLCBkYXRhQ2hhbm5lbENhbGxiYWNrcywgbW9ja3MpIHtcbiAgdmFyIGNvbnN0cmFpbnRzLFxuICAgIGNvbmZpZyxcbiAgICBpO1xuICB0aGlzLnBlZXJOYW1lID0gcGVlck5hbWU7XG4gIHRoaXMuY2hhbm5lbHMgPSB7fTtcbiAgdGhpcy5kYXRhQ2hhbm5lbENhbGxiYWNrcyA9IGRhdGFDaGFubmVsQ2FsbGJhY2tzO1xuICB0aGlzLm9uQ29ubmVjdGVkUXVldWUgPSBbXTtcblxuICBpZiAodHlwZW9mIG1vY2tzLlJUQ1BlZXJDb25uZWN0aW9uICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgdGhpcy5SVENQZWVyQ29ubmVjdGlvbiA9IG1vY2tzLlJUQ1BlZXJDb25uZWN0aW9uO1xuICB9IGVsc2UgaWYgKHR5cGVvZiB3ZWJraXRSVENQZWVyQ29ubmVjdGlvbiAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHRoaXMuUlRDUGVlckNvbm5lY3Rpb24gPSB3ZWJraXRSVENQZWVyQ29ubmVjdGlvbjtcbiAgfSBlbHNlIGlmICh0eXBlb2YgbW96UlRDUGVlckNvbm5lY3Rpb24gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICB0aGlzLlJUQ1BlZXJDb25uZWN0aW9uID0gbW96UlRDUGVlckNvbm5lY3Rpb247XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiVGhpcyBlbnZpcm9ubWVudCBkb2VzIG5vdCBhcHBlYXIgdG8gc3VwcG9ydCBSVENQZWVyQ29ubmVjdGlvblwiKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgbW9ja3MuUlRDU2Vzc2lvbkRlc2NyaXB0aW9uICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgdGhpcy5SVENTZXNzaW9uRGVzY3JpcHRpb24gPSBtb2Nrcy5SVENTZXNzaW9uRGVzY3JpcHRpb247XG4gIH0gZWxzZSBpZiAodHlwZW9mIFJUQ1Nlc3Npb25EZXNjcmlwdGlvbiAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHRoaXMuUlRDU2Vzc2lvbkRlc2NyaXB0aW9uID0gUlRDU2Vzc2lvbkRlc2NyaXB0aW9uO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBtb3pSVENTZXNzaW9uRGVzY3JpcHRpb24gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICB0aGlzLlJUQ1Nlc3Npb25EZXNjcmlwdGlvbiA9IG1velJUQ1Nlc3Npb25EZXNjcmlwdGlvbjtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGlzIGVudmlyb25tZW50IGRvZXMgbm90IGFwcGVhciB0byBzdXBwb3J0IFJUQ1Nlc3Npb25EZXNjcmlwdGlvblwiKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgbW9ja3MuUlRDSWNlQ2FuZGlkYXRlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgdGhpcy5SVENJY2VDYW5kaWRhdGUgPSBtb2Nrcy5SVENJY2VDYW5kaWRhdGU7XG4gIH0gZWxzZSBpZiAodHlwZW9mIFJUQ0ljZUNhbmRpZGF0ZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHRoaXMuUlRDSWNlQ2FuZGlkYXRlID0gUlRDSWNlQ2FuZGlkYXRlO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBtb3pSVENJY2VDYW5kaWRhdGUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICB0aGlzLlJUQ0ljZUNhbmRpZGF0ZSA9IG1velJUQ0ljZUNhbmRpZGF0ZTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGlzIGVudmlyb25tZW50IGRvZXMgbm90IGFwcGVhciB0byBzdXBwb3J0IFJUQ0ljZUNhbmRpZGF0ZVwiKTtcbiAgfVxuXG5cbiAgY29uc3RyYWludHMgPSB7XG4gICAgb3B0aW9uYWw6IFt7RHRsc1NydHBLZXlBZ3JlZW1lbnQ6IHRydWV9XVxuICB9O1xuICAvLyBBIHdheSB0byBzcGVhayB0byB0aGUgcGVlciB0byBzZW5kIFNEUCBoZWFkZXJzIGV0Yy5cbiAgdGhpcy5zZW5kU2lnbmFsTWVzc2FnZSA9IG51bGw7XG5cbiAgdGhpcy5wYyA9IG51bGw7ICAvLyBUaGUgcGVlciBjb25uZWN0aW9uLlxuICAvLyBHZXQgVFVSTiBzZXJ2ZXJzIGZvciB0aGUgcGVlciBjb25uZWN0aW9uLlxuICBjb25maWcgPSB7aWNlU2VydmVyczogW119O1xuICBmb3IgKGkgPSAwOyBpIDwgc3R1blNlcnZlcnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICBjb25maWcuaWNlU2VydmVycy5wdXNoKHtcbiAgICAgICd1cmwnIDogc3R1blNlcnZlcnNbaV1cbiAgICB9KTtcbiAgfVxuICB0aGlzLnBjID0gbmV3IHRoaXMuUlRDUGVlckNvbm5lY3Rpb24oY29uZmlnLCBjb25zdHJhaW50cyk7XG4gIC8vIEFkZCBiYXNpYyBldmVudCBoYW5kbGVycy5cbiAgdGhpcy5wYy5hZGRFdmVudExpc3RlbmVyKFwiaWNlY2FuZGlkYXRlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkljZUNhbGxiYWNrLmJpbmQodGhpcykpO1xuICB0aGlzLnBjLmFkZEV2ZW50TGlzdGVuZXIoXCJuZWdvdGlhdGlvbm5lZWRlZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25OZWdvdGlhdGlvbk5lZWRlZC5iaW5kKHRoaXMpKTtcbiAgdGhpcy5wYy5hZGRFdmVudExpc3RlbmVyKFwiZGF0YWNoYW5uZWxcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRGF0YUNoYW5uZWwuYmluZCh0aGlzKSk7XG4gIHRoaXMucGMuYWRkRXZlbnRMaXN0ZW5lcihcInNpZ25hbGluZ3N0YXRlY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAvLyBUT0RPOiBjb21lIHVwIHdpdGggYSBiZXR0ZXIgd2F5IHRvIGRldGVjdCBjb25uZWN0aW9uLiAgV2Ugc3RhcnQgb3V0XG4gICAgLy8gYXMgXCJzdGFibGVcIiBldmVuIGJlZm9yZSB3ZSBhcmUgY29ubmVjdGVkLlxuICAgIC8vIFRPRE86IHRoaXMgaXMgbm90IGZpcmVkIGZvciBjb25uZWN0aW9ucyBjbG9zZWQgYnkgdGhlIG90aGVyIHNpZGUuXG4gICAgLy8gVGhpcyB3aWxsIGJlIGZpeGVkIGluIG0zNywgYXQgdGhhdCBwb2ludCB3ZSBzaG91bGQgZGlzcGF0Y2ggYW4gb25DbG9zZVxuICAgIC8vIGV2ZW50IGhlcmUgZm9yIGZyZWVkb20udHJhbnNwb3J0IHRvIHBpY2sgdXAuXG4gICAgaWYgKHRoaXMucGMuc2lnbmFsaW5nU3RhdGUgPT09IFwic3RhYmxlXCIpIHtcbiAgICAgIHRoaXMucGNTdGF0ZSA9IFNpbXBsZURhdGFQZWVyU3RhdGUuQ09OTkVDVEVEO1xuICAgICAgdGhpcy5vbkNvbm5lY3RlZFF1ZXVlLm1hcChmdW5jdGlvbiAoY2FsbGJhY2spIHsgY2FsbGJhY2soKTsgfSk7XG4gICAgfVxuICB9LmJpbmQodGhpcykpO1xuICAvLyBUaGlzIHN0YXRlIHZhcmlhYmxlIGlzIHVzZWQgdG8gZmFrZSBvZmZlci9hbnN3ZXIgd2hlbiB0aGV5IGFyZSB3cm9uZ2x5XG4gIC8vIHJlcXVlc3RlZCBhbmQgd2UgcmVhbGx5IGp1c3QgbmVlZCB0byByZXVzZSB3aGF0IHdlIGFscmVhZHkgaGF2ZS5cbiAgdGhpcy5wY1N0YXRlID0gU2ltcGxlRGF0YVBlZXJTdGF0ZS5ESVNDT05ORUNURUQ7XG5cbiAgLy8gTm90ZTogdG8gYWN0dWFsbHkgZG8gc29tZXRoaW5nIHdpdGggZGF0YSBjaGFubmVscyBvcGVuZWQgYnkgYSBwZWVyLCB3ZVxuICAvLyBuZWVkIHNvbWVvbmUgdG8gbWFuYWdlIFwiZGF0YWNoYW5uZWxcIiBldmVudC5cbn1cblxuU2ltcGxlRGF0YVBlZXIucHJvdG90eXBlLmNyZWF0ZU9mZmVyID0gZnVuY3Rpb24gKGNvbnN0YWludHMsIGNvbnRpbnVhdGlvbikge1xuICB0aGlzLnBjLmNyZWF0ZU9mZmVyKGNvbnRpbnVhdGlvbiwgZnVuY3Rpb24gKCkge1xuICAgIGNvbnNvbGUuZXJyb3IoJ2NvcmUucGVlcmNvbm5lY3Rpb24gY3JlYXRlT2ZmZXIgZmFpbGVkLicpO1xuICB9LCBjb25zdGFpbnRzKTtcbn07XG5cblNpbXBsZURhdGFQZWVyLnByb3RvdHlwZS5ydW5XaGVuQ29ubmVjdGVkID0gZnVuY3Rpb24gKGZ1bmMpIHtcbiAgaWYgKHRoaXMucGNTdGF0ZSA9PT0gU2ltcGxlRGF0YVBlZXJTdGF0ZS5DT05ORUNURUQpIHtcbiAgICBmdW5jKCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5vbkNvbm5lY3RlZFF1ZXVlLnB1c2goZnVuYyk7XG4gIH1cbn07XG5cblNpbXBsZURhdGFQZWVyLnByb3RvdHlwZS5zZW5kID0gZnVuY3Rpb24gKGNoYW5uZWxJZCwgbWVzc2FnZSwgY29udGludWF0aW9uKSB7XG4gIHRoaXMuY2hhbm5lbHNbY2hhbm5lbElkXS5zZW5kKG1lc3NhZ2UpO1xuICBjb250aW51YXRpb24oKTtcbn07XG5cblNpbXBsZURhdGFQZWVyLnByb3RvdHlwZS5vcGVuRGF0YUNoYW5uZWwgPSBmdW5jdGlvbiAoY2hhbm5lbElkLCBjb250aW51YXRpb24pIHtcbiAgdmFyIGRhdGFDaGFubmVsID0gdGhpcy5wYy5jcmVhdGVEYXRhQ2hhbm5lbChjaGFubmVsSWQsIHt9KTtcbiAgZGF0YUNoYW5uZWwub25vcGVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuYWRkRGF0YUNoYW5uZWwoY2hhbm5lbElkLCBkYXRhQ2hhbm5lbCk7XG4gICAgY29udGludWF0aW9uKCk7XG4gIH0uYmluZCh0aGlzKTtcbiAgZGF0YUNoYW5uZWwub25lcnJvciA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAvL0AocnlzY2hlbmcpIHRvZG8gLSByZXBsYWNlIHdpdGggZXJyb3JzIHRoYXQgd29yayBhY3Jvc3MgdGhlIGludGVyZmFjZVxuICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICBjb250aW51YXRpb24odW5kZWZpbmVkLCBlcnIpO1xuICB9O1xuICAvLyBGaXJlZm94IGRvZXMgbm90IGZpcmUgXCJuZWdvdGlhdGlvbm5lZWRlZFwiLCBzbyB3ZSBuZWVkIHRvXG4gIC8vIG5lZ290YXRlIGhlcmUgaWYgd2UgYXJlIG5vdCBjb25uZWN0ZWQuXG4gIC8vIFNlZSBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD04NDA3MjhcbiAgaWYgKHR5cGVvZiBtb3pSVENQZWVyQ29ubmVjdGlvbiAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgdGhpcy5wY1N0YXRlID09PSBTaW1wbGVEYXRhUGVlclN0YXRlLkRJU0NPTk5FQ1RFRCkge1xuICAgIHRoaXMubmVnb3RpYXRlQ29ubmVjdGlvbigpO1xuICB9XG59O1xuXG5TaW1wbGVEYXRhUGVlci5wcm90b3R5cGUuY2xvc2VDaGFubmVsID0gZnVuY3Rpb24gKGNoYW5uZWxJZCkge1xuICBpZiAodGhpcy5jaGFubmVsc1tjaGFubmVsSWRdICE9PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzLmNoYW5uZWxzW2NoYW5uZWxJZF0uY2xvc2UoKTtcbiAgICBkZWxldGUgdGhpcy5jaGFubmVsc1tjaGFubmVsSWRdO1xuICB9XG59O1xuXG5TaW1wbGVEYXRhUGVlci5wcm90b3R5cGUuZ2V0QnVmZmVyZWRBbW91bnQgPSBmdW5jdGlvbiAoY2hhbm5lbElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVhdGlvbikge1xuICBpZiAodGhpcy5jaGFubmVsc1tjaGFubmVsSWRdICE9PSB1bmRlZmluZWQpIHtcbiAgICB2YXIgZGF0YUNoYW5uZWwgPSB0aGlzLmNoYW5uZWxzW2NoYW5uZWxJZF07XG4gICAgcmV0dXJuIGRhdGFDaGFubmVsLmJ1ZmZlcmVkQW1vdW50O1xuICB9XG4gIHRocm93IG5ldyBFcnJvcihcIk5vIGNoYW5uZWwgd2l0aCBpZDogXCIgKyBjaGFubmVsSWQpO1xufTtcblxuU2ltcGxlRGF0YVBlZXIucHJvdG90eXBlLnNldFNlbmRTaWduYWxNZXNzYWdlID0gZnVuY3Rpb24gKHNlbmRTaWduYWxNZXNzYWdlRm4pIHtcbiAgdGhpcy5zZW5kU2lnbmFsTWVzc2FnZSA9IHNlbmRTaWduYWxNZXNzYWdlRm47XG59O1xuXG4vLyBIYW5kbGUgYSBtZXNzYWdlIHNlbmQgb24gdGhlIHNpZ25hbGxpbmcgY2hhbm5lbCB0byB0aGlzIHBlZXIuXG5TaW1wbGVEYXRhUGVlci5wcm90b3R5cGUuaGFuZGxlU2lnbmFsTWVzc2FnZSA9IGZ1bmN0aW9uIChtZXNzYWdlVGV4dCkge1xuICAvL2NvbnNvbGUubG9nKHRoaXMucGVlck5hbWUgKyBcIjogXCIgKyBcImhhbmRsZVNpZ25hbE1lc3NhZ2U6IFxcblwiICsgbWVzc2FnZVRleHQpO1xuICB2YXIganNvbiA9IEpTT04ucGFyc2UobWVzc2FnZVRleHQpLFxuICAgIGljZV9jYW5kaWRhdGU7XG5cbiAgLy8gVE9ETzogSWYgd2UgYXJlIG9mZmVyaW5nIGFuZCB0aGV5IGFyZSBhbHNvIG9mZmVycmluZyBhdCB0aGUgc2FtZSB0aW1lLFxuICAvLyBwaWNrIHRoZSBvbmUgd2hvIGhhcyB0aGUgbG93ZXIgcmFuZG9tSWQ/XG4gIC8vICh0aGlzLnBjLnNpZ25hbGluZ1N0YXRlID09IFwiaGF2ZS1sb2NhbC1vZmZlclwiICYmIGpzb24uc2RwICYmXG4gIC8vICAgIGpzb24uc2RwLnR5cGUgPT0gXCJvZmZlclwiICYmIGpzb24uc2RwLnJhbmRvbUlkIDwgdGhpcy5sb2NhbFJhbmRvbUlkKVxuICBpZiAoanNvbi5zZHApIHtcbiAgICAvLyBTZXQgdGhlIHJlbW90ZSBkZXNjcmlwdGlvbi5cbiAgICB0aGlzLnBjLnNldFJlbW90ZURlc2NyaXB0aW9uKFxuICAgICAgbmV3IHRoaXMuUlRDU2Vzc2lvbkRlc2NyaXB0aW9uKGpzb24uc2RwKSxcbiAgICAgIC8vIFN1Y2Nlc3NcbiAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZyh0aGlzLnBlZXJOYW1lICsgXCI6IHNldFJlbW90ZURlc2NyaXB0aW9uIHN1Y2NlZWRlZFwiKTtcbiAgICAgICAgaWYgKHRoaXMucGMucmVtb3RlRGVzY3JpcHRpb24udHlwZSA9PT0gXCJvZmZlclwiKSB7XG4gICAgICAgICAgdGhpcy5wYy5jcmVhdGVBbnN3ZXIodGhpcy5vbkRlc2NyaXB0aW9uLmJpbmQodGhpcyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0uYmluZCh0aGlzKSxcbiAgICAgIC8vIEZhaWx1cmVcbiAgICAgIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IodGhpcy5wZWVyTmFtZSArIFwiOiBcIiArXG4gICAgICAgICAgICBcInNldFJlbW90ZURlc2NyaXB0aW9uIGZhaWxlZDpcIiwgZSk7XG4gICAgICB9LmJpbmQodGhpcylcbiAgICApO1xuICB9IGVsc2UgaWYgKGpzb24uY2FuZGlkYXRlKSB7XG4gICAgLy8gQWRkIHJlbW90ZSBpY2UgY2FuZGlkYXRlLlxuICAgIC8vY29uc29sZS5sb2codGhpcy5wZWVyTmFtZSArIFwiOiBBZGRpbmcgaWNlIGNhbmRpZGF0ZTogXCIgKyBKU09OLnN0cmluZ2lmeShqc29uLmNhbmRpZGF0ZSkpO1xuICAgIGljZV9jYW5kaWRhdGUgPSBuZXcgdGhpcy5SVENJY2VDYW5kaWRhdGUoanNvbi5jYW5kaWRhdGUpO1xuICAgIHRoaXMucGMuYWRkSWNlQ2FuZGlkYXRlKGljZV9jYW5kaWRhdGUpO1xuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUud2Fybih0aGlzLnBlZXJOYW1lICsgXCI6IFwiICtcbiAgICAgICAgXCJoYW5kbGVTaWduYWxNZXNzYWdlIGdvdCB1bmV4cGVjdGVkIG1lc3NhZ2U6IFwiLCBtZXNzYWdlVGV4dCk7XG4gIH1cbn07XG5cbi8vIENvbm5lY3QgdG8gdGhlIHBlZXIgYnkgdGhlIHNpZ25hbGxpbmcgY2hhbm5lbC5cblNpbXBsZURhdGFQZWVyLnByb3RvdHlwZS5uZWdvdGlhdGVDb25uZWN0aW9uID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLnBjU3RhdGUgPSBTaW1wbGVEYXRhUGVlclN0YXRlLkNPTk5FQ1RJTkc7XG4gIHRoaXMucGMuY3JlYXRlT2ZmZXIoXG4gICAgdGhpcy5vbkRlc2NyaXB0aW9uLmJpbmQodGhpcyksXG4gICAgZnVuY3Rpb24gKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IodGhpcy5wZWVyTmFtZSArIFwiOiBcIiArXG4gICAgICAgICAgXCJjcmVhdGVPZmZlciBmYWlsZWQ6IFwiLCBlLnRvU3RyaW5nKCkpO1xuICAgICAgdGhpcy5wY1N0YXRlID0gU2ltcGxlRGF0YVBlZXJTdGF0ZS5ESVNDT05ORUNURUQ7XG4gICAgfS5iaW5kKHRoaXMpXG4gICk7XG59O1xuXG5TaW1wbGVEYXRhUGVlci5wcm90b3R5cGUuaXNDbG9zZWQgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiAhdGhpcy5wYyB8fCB0aGlzLnBjLnNpZ25hbGluZ1N0YXRlID09PSBcImNsb3NlZFwiO1xufTtcblxuU2ltcGxlRGF0YVBlZXIucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKCkge1xuICBpZiAoIXRoaXMuaXNDbG9zZWQoKSkge1xuICAgIHRoaXMucGMuY2xvc2UoKTtcbiAgfVxuICAvL2NvbnNvbGUubG9nKHRoaXMucGVlck5hbWUgKyBcIjogXCIgKyBcIkNsb3NlZCBwZWVyIGNvbm5lY3Rpb24uXCIpO1xufTtcblxuU2ltcGxlRGF0YVBlZXIucHJvdG90eXBlLmFkZERhdGFDaGFubmVsID0gZnVuY3Rpb24gKGNoYW5uZWxJZCwgY2hhbm5lbCkge1xuICB2YXIgY2FsbGJhY2tzID0gdGhpcy5kYXRhQ2hhbm5lbENhbGxiYWNrcztcbiAgdGhpcy5jaGFubmVsc1tjaGFubmVsSWRdID0gY2hhbm5lbDtcblxuICBpZiAoY2hhbm5lbC5yZWFkeVN0YXRlID09PSBcImNvbm5lY3RpbmdcIikge1xuICAgIGNoYW5uZWwub25vcGVuID0gY2FsbGJhY2tzLm9uT3BlbkZuLmJpbmQodGhpcywgY2hhbm5lbCwge2xhYmVsOiBjaGFubmVsSWR9KTtcbiAgfVxuXG4gIGNoYW5uZWwub25jbG9zZSA9IGNhbGxiYWNrcy5vbkNsb3NlRm4uYmluZCh0aGlzLCBjaGFubmVsLCB7bGFiZWw6IGNoYW5uZWxJZH0pO1xuXG4gIGNoYW5uZWwub25tZXNzYWdlID0gY2FsbGJhY2tzLm9uTWVzc2FnZUZuLmJpbmQodGhpcywgY2hhbm5lbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7bGFiZWw6IGNoYW5uZWxJZH0pO1xuXG4gIGNoYW5uZWwub25lcnJvciA9IGNhbGxiYWNrcy5vbkVycm9yRm4uYmluZCh0aGlzLCBjaGFubmVsLCB7bGFiZWw6IGNoYW5uZWx9KTtcbn07XG5cbi8vIFdoZW4gd2UgZ2V0IG91ciBkZXNjcmlwdGlvbiwgd2Ugc2V0IGl0IHRvIGJlIG91ciBsb2NhbCBkZXNjcmlwdGlvbiBhbmRcbi8vIHNlbmQgaXQgdG8gdGhlIHBlZXIuXG5TaW1wbGVEYXRhUGVlci5wcm90b3R5cGUub25EZXNjcmlwdGlvbiA9IGZ1bmN0aW9uIChkZXNjcmlwdGlvbikge1xuICBpZiAodGhpcy5zZW5kU2lnbmFsTWVzc2FnZSkge1xuICAgIHRoaXMucGMuc2V0TG9jYWxEZXNjcmlwdGlvbihcbiAgICAgIGRlc2NyaXB0aW9uLFxuICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAvL2NvbnNvbGUubG9nKHRoaXMucGVlck5hbWUgKyBcIjogc2V0TG9jYWxEZXNjcmlwdGlvbiBzdWNjZWVkZWRcIik7XG4gICAgICAgIHRoaXMuc2VuZFNpZ25hbE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoeydzZHAnOiBkZXNjcmlwdGlvbn0pKTtcbiAgICAgIH0uYmluZCh0aGlzKSxcbiAgICAgIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IodGhpcy5wZWVyTmFtZSArIFwiOiBcIiArXG4gICAgICAgICAgICBcInNldExvY2FsRGVzY3JpcHRpb24gZmFpbGVkOlwiLCBlKTtcbiAgICAgIH0uYmluZCh0aGlzKVxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5lcnJvcih0aGlzLnBlZXJOYW1lICsgXCI6IFwiICtcbiAgICAgICAgXCJfb25EZXNjcmlwdGlvbjogX3NlbmRTaWduYWxNZXNzYWdlIGlzIG5vdCBzZXQsIHNvIHdlIGRpZCBub3QgXCIgK1xuICAgICAgICAgICAgXCJzZXQgdGhlIGxvY2FsIGRlc2NyaXB0aW9uLiBcIik7XG4gIH1cbn07XG5cblNpbXBsZURhdGFQZWVyLnByb3RvdHlwZS5vbk5lZ290aWF0aW9uTmVlZGVkID0gZnVuY3Rpb24gKGUpIHtcbiAgLy9jb25zb2xlLmxvZyh0aGlzLnBlZXJOYW1lICsgXCI6IFwiICsgXCJvbk5lZ290aWF0aW9uTmVlZGVkXCIsXG4gIC8vICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkodGhpcy5fcGMpLCBlKTtcbiAgaWYgKHRoaXMucGNTdGF0ZSAhPT0gU2ltcGxlRGF0YVBlZXJTdGF0ZS5ESVNDT05ORUNURUQpIHtcbiAgICAvLyBOZWdvdGlhdGlvbiBtZXNzYWdlcyBhcmUgZmFsc2VseSByZXF1ZXN0ZWQgZm9yIG5ldyBkYXRhIGNoYW5uZWxzLlxuICAgIC8vICAgaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC93ZWJydGMvaXNzdWVzL2RldGFpbD9pZD0yNDMxXG4gICAgLy8gVGhpcyBjb2RlIGlzIGEgaGFjayB0byBzaW1wbHkgcmVzZXQgdGhlIHNhbWUgbG9jYWwgYW5kIHJlbW90ZVxuICAgIC8vIGRlc2NyaXB0aW9uIHdoaWNoIHdpbGwgdHJpZ2dlciB0aGUgYXBwcm9wcmlhdGUgZGF0YSBjaGFubmVsIG9wZW4gZXZlbnQuXG4gICAgLy8gVE9ETzogZml4L3JlbW92ZSB0aGlzIHdoZW4gQ2hyb21lIGlzc3VlIGlzIGZpeGVkLlxuICAgIHZhciBsb2dTdWNjZXNzID0gZnVuY3Rpb24gKG9wKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAvL2NvbnNvbGUubG9nKHRoaXMucGVlck5hbWUgKyBcIjogXCIgKyBvcCArIFwiIHN1Y2NlZWRlZCBcIik7XG4gICAgICB9LmJpbmQodGhpcyk7XG4gICAgfS5iaW5kKHRoaXMpLFxuICAgICAgbG9nRmFpbCA9IGZ1bmN0aW9uIChvcCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKHRoaXMucGVlck5hbWUgKyBcIjogXCIgKyBvcCArIFwiIGZhaWxlZDogXCIgKyBlKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuICAgICAgfS5iaW5kKHRoaXMpO1xuICAgIGlmICh0aGlzLnBjLmxvY2FsRGVzY3JpcHRpb24gJiYgdGhpcy5wYy5yZW1vdGVEZXNjcmlwdGlvbiAmJlxuICAgICAgICB0aGlzLnBjLmxvY2FsRGVzY3JpcHRpb24udHlwZSA9PT0gXCJvZmZlclwiKSB7XG4gICAgICB0aGlzLnBjLnNldExvY2FsRGVzY3JpcHRpb24odGhpcy5wYy5sb2NhbERlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dTdWNjZXNzKFwic2V0TG9jYWxEZXNjcmlwdGlvblwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nRmFpbChcInNldExvY2FsRGVzY3JpcHRpb25cIikpO1xuICAgICAgdGhpcy5wYy5zZXRSZW1vdGVEZXNjcmlwdGlvbih0aGlzLnBjLnJlbW90ZURlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nU3VjY2VzcyhcInNldFJlbW90ZURlc2NyaXB0aW9uXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nRmFpbChcInNldFJlbW90ZURlc2NyaXB0aW9uXCIpKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMucGMubG9jYWxEZXNjcmlwdGlvbiAmJiB0aGlzLnBjLnJlbW90ZURlc2NyaXB0aW9uICYmXG4gICAgICAgIHRoaXMucGMubG9jYWxEZXNjcmlwdGlvbi50eXBlID09PSBcImFuc3dlclwiKSB7XG4gICAgICB0aGlzLnBjLnNldFJlbW90ZURlc2NyaXB0aW9uKHRoaXMucGMucmVtb3RlRGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dTdWNjZXNzKFwic2V0UmVtb3RlRGVzY3JpcHRpb25cIiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dGYWlsKFwic2V0UmVtb3RlRGVzY3JpcHRpb25cIikpO1xuICAgICAgdGhpcy5wYy5zZXRMb2NhbERlc2NyaXB0aW9uKHRoaXMucGMubG9jYWxEZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nU3VjY2VzcyhcInNldExvY2FsRGVzY3JpcHRpb25cIiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ0ZhaWwoXCJzZXRMb2NhbERlc2NyaXB0aW9uXCIpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5lcnJvcih0aGlzLnBlZXJOYW1lICsgJywgb25OZWdvdGlhdGlvbk5lZWRlZCBmYWlsZWQnKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMubmVnb3RpYXRlQ29ubmVjdGlvbigpO1xufTtcblxuU2ltcGxlRGF0YVBlZXIucHJvdG90eXBlLm9uSWNlQ2FsbGJhY2sgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgaWYgKGV2ZW50LmNhbmRpZGF0ZSkge1xuICAgIC8vIFNlbmQgSWNlQ2FuZGlkYXRlIHRvIHBlZXIuXG4gICAgLy9jb25zb2xlLmxvZyh0aGlzLnBlZXJOYW1lICsgXCI6IFwiICsgXCJpY2UgY2FsbGJhY2sgd2l0aCBjYW5kaWRhdGVcIiwgZXZlbnQpO1xuICAgIGlmICh0aGlzLnNlbmRTaWduYWxNZXNzYWdlKSB7XG4gICAgICB0aGlzLnNlbmRTaWduYWxNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHsnY2FuZGlkYXRlJzogZXZlbnQuY2FuZGlkYXRlfSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLndhcm4odGhpcy5wZWVyTmFtZSArIFwiOiBcIiArIFwiX29uRGVzY3JpcHRpb246IF9zZW5kU2lnbmFsTWVzc2FnZSBpcyBub3Qgc2V0LlwiKTtcbiAgICB9XG4gIH1cbn07XG5cblNpbXBsZURhdGFQZWVyLnByb3RvdHlwZS5vblNpZ25hbGluZ1N0YXRlQ2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAvL2NvbnNvbGUubG9nKHRoaXMucGVlck5hbWUgKyBcIjogXCIgKyBcIm9uU2lnbmFsaW5nU3RhdGVDaGFuZ2U6IFwiLCB0aGlzLl9wYy5zaWduYWxpbmdTdGF0ZSk7XG4gIGlmICh0aGlzLnBjLnNpZ25hbGluZ1N0YXRlID09PSBcInN0YWJsZVwiKSB7XG4gICAgdGhpcy5wY1N0YXRlID0gU2ltcGxlRGF0YVBlZXJTdGF0ZS5DT05ORUNURUQ7XG4gICAgdGhpcy5vbkNvbm5lY3RlZFF1ZXVlLm1hcChmdW5jdGlvbiAoY2FsbGJhY2spIHsgY2FsbGJhY2soKTsgfSk7XG4gIH1cbn07XG5cblNpbXBsZURhdGFQZWVyLnByb3RvdHlwZS5vbkRhdGFDaGFubmVsID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gIHRoaXMuYWRkRGF0YUNoYW5uZWwoZXZlbnQuY2hhbm5lbC5sYWJlbCwgZXZlbnQuY2hhbm5lbCk7XG4gIC8vIFJUQ0RhdGFDaGFubmVscyBjcmVhdGVkIGJ5IGEgUlRDRGF0YUNoYW5uZWxFdmVudCBoYXZlIGFuIGluaXRpYWxcbiAgLy8gc3RhdGUgb2Ygb3Blbiwgc28gdGhlIG9ub3BlbiBldmVudCBmb3IgdGhlIGNoYW5uZWwgd2lsbCBub3RcbiAgLy8gZmlyZS4gV2UgbmVlZCB0byBmaXJlIHRoZSBvbk9wZW5EYXRhQ2hhbm5lbCBldmVudCBoZXJlXG4gIC8vIGh0dHA6Ly93d3cudzMub3JnL1RSL3dlYnJ0Yy8jaWRsLWRlZi1SVENEYXRhQ2hhbm5lbFN0YXRlXG5cbiAgLy8gRmlyZWZveCBjaGFubmVscyBkbyBub3QgaGF2ZSBhbiBpbml0aWFsIHN0YXRlIG9mIFwib3BlblwiXG4gIC8vIFNlZSBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD0xMDAwNDc4XG4gIGlmIChldmVudC5jaGFubmVsLnJlYWR5U3RhdGUgPT09IFwib3BlblwiKSB7XG4gICAgdGhpcy5kYXRhQ2hhbm5lbENhbGxiYWNrcy5vbk9wZW5GbihldmVudC5jaGFubmVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2xhYmVsOiBldmVudC5jaGFubmVsLmxhYmVsfSk7XG4gIH1cbn07XG5cbi8vIF9zaWduYWxsaW5nQ2hhbm5lbCBpcyBhIGNoYW5uZWwgZm9yIGVtaXR0aW5nIGV2ZW50cyBiYWNrIHRvIHRoZSBmcmVlZG9tIEh1Yi5cbmZ1bmN0aW9uIFBlZXJDb25uZWN0aW9uKHBvcnRNb2R1bGUsIGRpc3BhdGNoRXZlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBSVENQZWVyQ29ubmVjdGlvbiwgUlRDU2Vzc2lvbkRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgUlRDSWNlQ2FuZGlkYXRlKSB7XG4gIC8vIENoYW5uZWwgZm9yIGVtaXR0aW5nIGV2ZW50cyB0byBjb25zdW1lci5cbiAgdGhpcy5kaXNwYXRjaEV2ZW50ID0gZGlzcGF0Y2hFdmVudDtcblxuICAvLyBhIChob3BlZnVsbHkgdW5pcXVlKSBJRCBmb3IgZGVidWdnaW5nLlxuICB0aGlzLnBlZXJOYW1lID0gXCJwXCIgKyBNYXRoLnJhbmRvbSgpO1xuXG4gIC8vIFRoaXMgaXMgdGhlIHBvcnRBcHAgKGRlZmluZWQgaW4gZnJlZWRvbS9zcmMvcG9ydC1hcHAuanMpLiBBIHdheSB0byBzcGVha1xuICAvLyB0byBmcmVlZG9tLlxuICB0aGlzLmZyZWVkb21Nb2R1bGUgPSBwb3J0TW9kdWxlO1xuXG4gIC8vIEZvciB0ZXN0cyB3ZSBtYXkgbW9jayBvdXQgdGhlIFBlZXJDb25uZWN0aW9uIGFuZFxuICAvLyBTZXNzaW9uRGVzY3JpcHRpb24gaW1wbGVtZW50YXRpb25zXG4gIHRoaXMuUlRDUGVlckNvbm5lY3Rpb24gPSBSVENQZWVyQ29ubmVjdGlvbjtcbiAgdGhpcy5SVENTZXNzaW9uRGVzY3JpcHRpb24gPSBSVENTZXNzaW9uRGVzY3JpcHRpb247XG4gIHRoaXMuUlRDSWNlQ2FuZGlkYXRlID0gUlRDSWNlQ2FuZGlkYXRlO1xuXG4gIC8vIFRoaXMgaXMgdGhlIGEgY2hhbm5lbCB0byBzZW5kIHNpZ25hbGxpbmcgbWVzc2FnZXMuXG4gIHRoaXMuc2lnbmFsbGluZ0NoYW5uZWwgPSBudWxsO1xuXG4gIC8vIFRoZSBEYXRhUGVlciBvYmplY3QgZm9yIHRhbGtpbmcgdG8gdGhlIHBlZXIuXG4gIHRoaXMucGVlciA9IG51bGw7XG5cbiAgLy8gVGhlIENvcmUgb2JqZWN0IGZvciBtYW5hZ2luZyBjaGFubmVscy5cbiAgdGhpcy5mcmVlZG9tTW9kdWxlLm9uY2UoJ2NvcmUnLCBmdW5jdGlvbiAoQ29yZSkge1xuICAgIHRoaXMuY29yZSA9IG5ldyBDb3JlKCk7XG4gIH0uYmluZCh0aGlzKSk7XG4gIHRoaXMuZnJlZWRvbU1vZHVsZS5lbWl0KHRoaXMuZnJlZWRvbU1vZHVsZS5jb250cm9sQ2hhbm5lbCwge1xuICAgIHR5cGU6ICdjb3JlIHJlcXVlc3QgZGVsZWdhdGVkIHRvIHBlZXJjb25uZWN0aW9uJyxcbiAgICByZXF1ZXN0OiAnY29yZSdcbiAgfSk7XG59XG5cbi8vIFN0YXJ0IGEgcGVlciBjb25uZWN0aW9uIHVzaW5nIHRoZSBnaXZlbiBmcmVlZG9tQ2hhbm5lbElkIGFzIHRoZSB3YXkgdG9cbi8vIGNvbW11bmljYXRlIHdpdGggdGhlIHBlZXIuIFRoZSBhcmd1bWVudCB8ZnJlZWRvbUNoYW5uZWxJZHwgaXMgYSB3YXkgdG8gc3BlYWtcbi8vIHRvIGFuIGlkZW50aXR5IHByb3ZpZGUgdG8gc2VuZCB0aGVtIFNEUCBoZWFkZXJzIG5lZ290aWF0ZSB0aGUgYWRkcmVzcy9wb3J0IHRvXG4vLyBzZXR1cCB0aGUgcGVlciB0byBwZWVyQ29ubmVjdGlvbi5cbi8vXG4vLyBvcHRpb25zOiB7XG4vLyAgIHBlZXJOYW1lOiBzdHJpbmcsICAgLy8gRm9yIHByZXR0eSBwcmludGluZyBtZXNzYWdlcyBhYm91dCB0aGlzIHBlZXIuXG4vLyAgIGRlYnVnOiBib29sZWFuICAgICAgICAgICAvLyBzaG91bGQgd2UgYWRkIGV4dHJhXG4vLyB9XG5QZWVyQ29ubmVjdGlvbi5wcm90b3R5cGUuc2V0dXAgPSBmdW5jdGlvbiAoc2lnbmFsbGluZ0NoYW5uZWxJZCwgcGVlck5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R1blNlcnZlcnMsIGluaXRpYXRlQ29ubmVjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51YXRpb24pIHtcbiAgdGhpcy5wZWVyTmFtZSA9IHBlZXJOYW1lO1xuICB2YXIgbW9ja3MgPSB7UlRDUGVlckNvbm5lY3Rpb246IHRoaXMuUlRDUGVlckNvbm5lY3Rpb24sXG4gICAgICAgICAgICAgICBSVENTZXNzaW9uRGVzY3JpcHRpb246IHRoaXMuUlRDU2Vzc2lvbkRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgUlRDSWNlQ2FuZGlkYXRlOiB0aGlzLlJUQ0ljZUNhbmRpZGF0ZX0sXG4gICAgc2VsZiA9IHRoaXMsXG4gICAgZGF0YUNoYW5uZWxDYWxsYmFja3MgPSB7XG4gICAgICAvLyBvbk9wZW5GbiBpcyBjYWxsZWQgYXQgdGhlIHBvaW50IG1lc3NhZ2VzIHdpbGwgYWN0dWFsbHkgZ2V0IHRocm91Z2guXG4gICAgICBvbk9wZW5GbjogZnVuY3Rpb24gKGRhdGFDaGFubmVsLCBpbmZvKSB7XG4gICAgICAgIHNlbGYuZGlzcGF0Y2hFdmVudChcIm9uT3BlbkRhdGFDaGFubmVsXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgeyBjaGFubmVsSWQ6IGluZm8ubGFiZWx9KTtcbiAgICAgIH0sXG4gICAgICBvbkNsb3NlRm46IGZ1bmN0aW9uIChkYXRhQ2hhbm5lbCwgaW5mbykge1xuICAgICAgICBzZWxmLmRpc3BhdGNoRXZlbnQoXCJvbkNsb3NlRGF0YUNoYW5uZWxcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICB7IGNoYW5uZWxJZDogaW5mby5sYWJlbH0pO1xuICAgICAgfSxcbiAgICAgIC8vIERlZmF1bHQgb24gcmVhbCBtZXNzYWdlIHByaW50cyBpdCB0byBjb25zb2xlLlxuICAgICAgb25NZXNzYWdlRm46IGZ1bmN0aW9uIChkYXRhQ2hhbm5lbCwgaW5mbywgZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmRhdGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgICAgIHNlbGYuZGlzcGF0Y2hFdmVudCgnb25SZWNlaXZlZCcsIHtcbiAgICAgICAgICAgICdjaGFubmVsTGFiZWwnOiBpbmZvLmxhYmVsLFxuICAgICAgICAgICAgJ2J1ZmZlcic6IGV2ZW50LmRhdGFcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudC5kYXRhIGluc3RhbmNlb2YgQmxvYikge1xuICAgICAgICAgIHNlbGYuZGlzcGF0Y2hFdmVudCgnb25SZWNlaXZlZCcsIHtcbiAgICAgICAgICAgICdjaGFubmVsTGFiZWwnOiBpbmZvLmxhYmVsLFxuICAgICAgICAgICAgJ2JpbmFyeSc6IGV2ZW50LmRhdGFcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgKGV2ZW50LmRhdGEpID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIHNlbGYuZGlzcGF0Y2hFdmVudCgnb25SZWNlaXZlZCcsIHtcbiAgICAgICAgICAgICdjaGFubmVsTGFiZWwnOiBpbmZvLmxhYmVsLFxuICAgICAgICAgICAgJ3RleHQnOiBldmVudC5kYXRhXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAvLyBEZWZhdWx0IG9uIGVycm9yLCBwcmludHMgaXQuXG4gICAgICBvbkVycm9yRm46IGZ1bmN0aW9uIChkYXRhQ2hhbm5lbCwgaW5mbywgZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZGF0YUNoYW5uZWwucGVlck5hbWUgKyBcIjogZGF0YUNoYW5uZWwoXCIgK1xuICAgICAgICAgICAgICAgICAgICAgIGRhdGFDaGFubmVsLmRhdGFDaGFubmVsLmxhYmVsICsgXCIpOiBlcnJvcjogXCIsIGVycik7XG4gICAgICB9XG4gICAgfSxcbiAgICBjaGFubmVsSWQsXG4gICAgb3BlbkRhdGFDaGFubmVsQ29udGludWF0aW9uO1xuXG4gIHRoaXMucGVlciA9IG5ldyBTaW1wbGVEYXRhUGVlcih0aGlzLnBlZXJOYW1lLCBzdHVuU2VydmVycyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFDaGFubmVsQ2FsbGJhY2tzLCBtb2Nrcyk7XG5cbiAgLy8gU2V0dXAgbGluayBiZXR3ZWVuIEZyZWVkb20gbWVzc2FnaW5nIGFuZCBfcGVlcidzIHNpZ25hbGxpbmcuXG4gIC8vIE5vdGU6IHRoZSBzaWduYWxsaW5nIGNoYW5uZWwgc2hvdWxkIG9ubHkgYmUgc2VuZGluZyByZWNlaXZlaW5nIHN0cmluZ3MuXG4gIHRoaXMuY29yZS5iaW5kQ2hhbm5lbChzaWduYWxsaW5nQ2hhbm5lbElkLCBmdW5jdGlvbiAoY2hhbm5lbCkge1xuICAgIHRoaXMuc2lnbmFsbGluZ0NoYW5uZWwgPSBjaGFubmVsO1xuICAgIHRoaXMucGVlci5zZXRTZW5kU2lnbmFsTWVzc2FnZShmdW5jdGlvbiAobXNnKSB7XG4gICAgICB0aGlzLnNpZ25hbGxpbmdDaGFubmVsLmVtaXQoJ21lc3NhZ2UnLCBtc2cpO1xuICAgIH0uYmluZCh0aGlzKSk7XG4gICAgdGhpcy5zaWduYWxsaW5nQ2hhbm5lbC5vbignbWVzc2FnZScsXG4gICAgICAgIHRoaXMucGVlci5oYW5kbGVTaWduYWxNZXNzYWdlLmJpbmQodGhpcy5wZWVyKSk7XG4gICAgdGhpcy5zaWduYWxsaW5nQ2hhbm5lbC5lbWl0KCdyZWFkeScpO1xuICAgIGlmICghaW5pdGlhdGVDb25uZWN0aW9uKSB7XG4gICAgICB0aGlzLnBlZXIucnVuV2hlbkNvbm5lY3RlZChjb250aW51YXRpb24pO1xuICAgIH1cbiAgfS5iaW5kKHRoaXMpKTtcblxuICBpZiAoaW5pdGlhdGVDb25uZWN0aW9uKSB7XG4gICAgLy8gU2V0dXAgYSBjb25uZWN0aW9uIHJpZ2h0IGF3YXksIHRoZW4gaW52b2tlIGNvbnRpbnVhdGlvbi5cbiAgICBjb25zb2xlLmxvZyh0aGlzLnBlZXJOYW1lICsgJyBpbml0aWF0aW5nIGNvbm5lY3Rpb24nKTtcbiAgICBjaGFubmVsSWQgPSAnaGVsbG8nICsgTWF0aC5yYW5kb20oKS50b1N0cmluZygpO1xuICAgIG9wZW5EYXRhQ2hhbm5lbENvbnRpbnVhdGlvbiA9IGZ1bmN0aW9uIChzdWNjZXNzLCBlcnJvcikge1xuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIGNvbnRpbnVhdGlvbih1bmRlZmluZWQsIGVycm9yKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY2xvc2VEYXRhQ2hhbm5lbChjaGFubmVsSWQsIGNvbnRpbnVhdGlvbik7XG4gICAgICB9XG4gICAgfS5iaW5kKHRoaXMpO1xuICAgIHRoaXMub3BlbkRhdGFDaGFubmVsKGNoYW5uZWxJZCwgb3BlbkRhdGFDaGFubmVsQ29udGludWF0aW9uKTtcbiAgfVxufTtcblxuUGVlckNvbm5lY3Rpb24ucHJvdG90eXBlLmNyZWF0ZU9mZmVyID0gZnVuY3Rpb24gKGNvbnN0cmFpbnRzLCBjb250aW51YXRpb24pIHtcbiAgdGhpcy5wZWVyLmNyZWF0ZU9mZmVyKGNvbnN0cmFpbnRzLCBjb250aW51YXRpb24pO1xufTtcblxuLy8gVE9ETzogZGVsYXkgY29udGludWF0aW9uIHVudGlsIHRoZSBvcGVuIGNhbGxiYWNrIGZyb20gX3BlZXIgaXMgY2FsbGVkLlxuUGVlckNvbm5lY3Rpb24ucHJvdG90eXBlLm9wZW5EYXRhQ2hhbm5lbCA9IGZ1bmN0aW9uIChjaGFubmVsSWQsIGNvbnRpbnVhdGlvbikge1xuICB0aGlzLnBlZXIub3BlbkRhdGFDaGFubmVsKGNoYW5uZWxJZCwgY29udGludWF0aW9uKTtcbn07XG5cblBlZXJDb25uZWN0aW9uLnByb3RvdHlwZS5jbG9zZURhdGFDaGFubmVsID0gZnVuY3Rpb24gKGNoYW5uZWxJZCwgY29udGludWF0aW9uKSB7XG4gIHRoaXMucGVlci5jbG9zZUNoYW5uZWwoY2hhbm5lbElkKTtcbiAgY29udGludWF0aW9uKCk7XG59O1xuXG4vLyBDYWxsZWQgdG8gc2VuZCBhIG1lc3NhZ2Ugb3ZlciB0aGUgZ2l2ZW4gZGF0YWNoYW5uZWwgdG8gYSBwZWVyLiBJZiB0aGUgZGF0YVxuLy8gY2hhbm5lbCBkb2Vzbid0IGFscmVhZHkgZXhpc3QsIHRoZSBEYXRhUGVlciBjcmVhdGVzIGl0LlxuUGVlckNvbm5lY3Rpb24ucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbiAoc2VuZEluZm8sIGNvbnRpbnVhdGlvbikge1xuICB2YXIgb2JqVG9TZW5kID0gc2VuZEluZm8udGV4dCB8fCBzZW5kSW5mby5idWZmZXIgfHwgc2VuZEluZm8uYmluYXJ5O1xuICBpZiAodHlwZW9mIG9ialRvU2VuZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiTm8gdmFsaWQgZGF0YSB0byBzZW5kIGhhcyBiZWVuIHByb3ZpZGVkLlwiLCBzZW5kSW5mbyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIC8vREVCVUdcbiAgLy8gb2JqVG9TZW5kID0gbmV3IEFycmF5QnVmZmVyKDQpO1xuICAvL0RFQlVHXG4gIHRoaXMucGVlci5zZW5kKHNlbmRJbmZvLmNoYW5uZWxMYWJlbCwgb2JqVG9TZW5kLCBjb250aW51YXRpb24pO1xufTtcblxuUGVlckNvbm5lY3Rpb24ucHJvdG90eXBlLmdldEJ1ZmZlcmVkQW1vdW50ID0gZnVuY3Rpb24gKGNoYW5uZWxJZCwgY29udGludWF0aW9uKSB7XG4gIGNvbnRpbnVhdGlvbih0aGlzLnBlZXIuZ2V0QnVmZmVyZWRBbW91bnQoY2hhbm5lbElkKSk7XG59O1xuXG5QZWVyQ29ubmVjdGlvbi5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbiAoY29udGludWF0aW9uKSB7XG4gIGlmICh0aGlzLnBlZXIuaXNDbG9zZWQoKSkge1xuICAgIC8vIFBlZXIgYWxyZWFkeSBjbG9zZWQsIHJ1biBjb250aW51YXRpb24gd2l0aG91dCBkaXNwYXRjaGluZyBldmVudC5cbiAgICBjb250aW51YXRpb24oKTtcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5wZWVyLmNsb3NlKCk7XG4gIHRoaXMuZGlzcGF0Y2hFdmVudChcIm9uQ2xvc2VcIik7XG4gIGNvbnRpbnVhdGlvbigpO1xufTtcblxuZXhwb3J0cy5wcm92aWRlciA9IFBlZXJDb25uZWN0aW9uO1xuZXhwb3J0cy5uYW1lID0gJ2NvcmUucGVlcmNvbm5lY3Rpb24nO1xuIiwiLypnbG9iYWxzIGxvY2FsU3RvcmFnZSAqL1xuLypqc2xpbnQgaW5kZW50OjIsc2xvcHB5OnRydWUsbm9kZTp0cnVlICovXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uLy4uL3NyYy91dGlsJyk7XG5cbi8qKlxuICogQSBGcmVlRE9NIGNvcmUuc3RvcmFnZSBwcm92aWRlciB0aGF0IGRlcGVuZHMgb24gbG9jYWxTdG9yYWdlXG4gKiBUaHVzLCB0aGlzIG9ubHkgd29ya3MgaW4gdGhlIGNvbnRleHQgb2YgYSB3ZWJwYWdlIGFuZCBoYXNcbiAqIHNvbWUgc2l6ZSBsaW1pdGF0aW9ucy5cbiAqIE5vdGUgdGhhdCB0aGlzIGNhbiBjb25mbGljdCB3aXRoIG90aGVyIHNjcmlwdHMgdXNpbmcgbG9jYWxTdG9yYWdlXG4gKiBhcyBrZXlzIGFyZSByYXdcbiAqIEBDbGFzcyBTdG9yYWdlX3VucHJpdmlsZWdlZFxuICogQGNvbnN0cnVjdG9yXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcHB9IGFwcCBUaGUgYXBwbGljYXRpb24gY3JlYXRpbmcgdGhpcyBwcm92aWRlci5cbiAqL1xudmFyIFN0b3JhZ2VfdW5wcml2aWxlZ2VkID0gZnVuY3Rpb24gKGFwcCwgZGlzcGF0Y2hFdmVudCkge1xuICB0aGlzLmFwcCA9IGFwcDtcbiAgdXRpbC5oYW5kbGVFdmVudHModGhpcyk7XG59O1xuXG4vKipcbiAqIExpc3RzIGtleXMgaW4gdGhlIHN0b3JhZ2UgcmVwb3NpdG9yeVxuICogQG1ldGhvZCBrZXlzXG4gKi9cblN0b3JhZ2VfdW5wcml2aWxlZ2VkLnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24gKGNvbnRpbnVhdGlvbikge1xuICB2YXIgcmVzdWx0ID0gW10sXG4gICAgaTtcbiAgZm9yIChpID0gMDsgaSA8IGxvY2FsU3RvcmFnZS5sZW5ndGg7IGkgKz0gMSkge1xuICAgIHJlc3VsdC5wdXNoKGxvY2FsU3RvcmFnZS5rZXkoaSkpO1xuICB9XG4gIGNvbnRpbnVhdGlvbihyZXN1bHQpO1xufTtcblxuLyoqXG4gKiBHZXQgYSBrZXkgZnJvbSB0aGUgc3RvcmFnZSByZXBvc2l0b3J5LlxuICogQHBhcmFtIHtTdHJpbmd9IGtleSBUaGUgaXRlbSB0byBnZXQgZnJvbSBzdG9yYWdlLlxuICogQG1ldGhvZCBnZXRcbiAqL1xuU3RvcmFnZV91bnByaXZpbGVnZWQucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChrZXksIGNvbnRpbnVhdGlvbikge1xuICB0cnkge1xuICAgIHZhciB2YWwgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpO1xuICAgIGNvbnRpbnVhdGlvbih2YWwpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgY29udGludWF0aW9uKG51bGwpO1xuICB9XG59O1xuXG4vKipcbiAqIFNldCBhIGtleSBpbiB0aGUgc3RvcmFnZSByZXBvc2l0b3J5LlxuICogQHBhcmFtIHtTdHJpbmd9IGtleSBUaGUgaXRlbSB0byBzYXZlIGluIHN0b3JhZ2UuXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsdWUgVGhlIHZhbHVlIHRvIHNhdmUgaW4gc3RvcmFnZS5cbiAqIEBtZXRob2Qgc2V0XG4gKi9cblN0b3JhZ2VfdW5wcml2aWxlZ2VkLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSwgY29udGludWF0aW9uKSB7XG4gIHZhciByZXQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpO1xuICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIHZhbHVlKTtcbiAgY29udGludWF0aW9uKHJldCk7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhIGtleSBmcm9tIHRoZSBzdG9yYWdlIHJlcG9zaXRvcnkuXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5IFRoZSBpdGVtIHRvIHJlbW92ZSBmcm9tIHN0b3JhZ2U7XG4gKiBAbWV0aG9kIHJlbW92ZVxuICovXG5TdG9yYWdlX3VucHJpdmlsZWdlZC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKGtleSwgY29udGludWF0aW9uKSB7XG4gIHZhciByZXQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpO1xuICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpO1xuICBjb250aW51YXRpb24ocmV0KTtcbn07XG5cbi8qKlxuICogUmVzZXQgdGhlIGNvbnRlbnRzIG9mIHRoZSBzdG9yYWdlIHJlcG9zaXRvcnkuXG4gKiBAbWV0aG9kIGNsZWFyXG4gKi9cblN0b3JhZ2VfdW5wcml2aWxlZ2VkLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uIChjb250aW51YXRpb24pIHtcbiAgbG9jYWxTdG9yYWdlLmNsZWFyKCk7XG4gIGNvbnRpbnVhdGlvbigpO1xufTtcblxuZXhwb3J0cy5wcm92aWRlciA9IFN0b3JhZ2VfdW5wcml2aWxlZ2VkO1xuZXhwb3J0cy5uYW1lID0gJ2NvcmUuc3RvcmFnZSc7XG4iLCIvKmdsb2JhbHMgV2ViU29ja2V0LCBBcnJheUJ1ZmZlciwgQmxvYiwgVWludDhBcnJheSwgY29uc29sZSAqL1xuLypqc2xpbnQgc2xvcHB5OnRydWUsIG5vZGU6dHJ1ZSAqL1xuXG52YXIgV1NIYW5kbGUgPSBudWxsO1xudmFyIG5vZGVTdHlsZSA9IGZhbHNlO1xuXG4vKipcbiAqIEEgV2ViU29ja2V0IGNvcmUgcHJvdmlkZXJcbiAqXG4gKiBAcGFyYW0ge3BvcnQuTW9kdWxlfSBtb2R1bGUgVGhlIE1vZHVsZSByZXF1ZXN0aW5nIHRoaXMgcHJvdmlkZXJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGRpc3BhdGNoRXZlbnQgRnVuY3Rpb24gdG8gZGlzcGF0Y2ggZXZlbnRzLlxuICogQHBhcmFtIHtTdHJpbmd9IHVybCBUaGUgUmVtb3RlIFVSTCB0byBjb25uZWN0IHdpdGguXG4gKiBAcGFyYW0ge1N0cmluZ1tdfSBwcm90b2NvbHMgU3ViUHJvdG9jb2xzIHRvIG9wZW4uXG4gKiBAcGFyYW0ge1dlYlNvY2tldD99IHNvY2tldCBBbiBhbHRlcm5hdGl2ZSBzb2NrZXQgY2xhc3MgdG8gdXNlLlxuICovXG52YXIgV1MgPSBmdW5jdGlvbiAobW9kdWxlLCBkaXNwYXRjaEV2ZW50LCB1cmwsIHByb3RvY29scywgc29ja2V0KSB7XG4gIHZhciBXU0ltcGxlbWVudGF0aW9uID0gbnVsbCxcbiAgICBlcnJvcjtcbiAgdGhpcy5pc05vZGUgPSBub2RlU3R5bGU7XG4gIGlmICh0eXBlb2Ygc29ja2V0ICE9PSAndW5kZWZpbmVkJykge1xuICAgIFdTSW1wbGVtZW50YXRpb24gPSBzb2NrZXQ7XG4gIH0gZWxzZSBpZiAoV1NIYW5kbGUgIT09IG51bGwpIHtcbiAgICBXU0ltcGxlbWVudGF0aW9uID0gV1NIYW5kbGU7XG4gIH0gZWxzZSBpZiAodHlwZW9mIFdlYlNvY2tldCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBXU0ltcGxlbWVudGF0aW9uID0gV2ViU29ja2V0O1xuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1BsYXRmb3JtIGRvZXMgbm90IHN1cHBvcnQgV2ViU29ja2V0Jyk7XG4gIH1cblxuICB0aGlzLmRpc3BhdGNoRXZlbnQgPSBkaXNwYXRjaEV2ZW50O1xuICB0cnkge1xuICAgIGlmIChwcm90b2NvbHMpIHtcbiAgICAgIHRoaXMud2Vic29ja2V0ID0gbmV3IFdTSW1wbGVtZW50YXRpb24odXJsLCBwcm90b2NvbHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLndlYnNvY2tldCA9IG5ldyBXU0ltcGxlbWVudGF0aW9uKHVybCk7XG4gICAgfVxuICAgIHRoaXMud2Vic29ja2V0LmJpbmFyeVR5cGUgPSAnYXJyYXlidWZmZXInO1xuICB9IGNhdGNoIChlKSB7XG4gICAgZXJyb3IgPSB7fTtcbiAgICBpZiAoZSBpbnN0YW5jZW9mIFN5bnRheEVycm9yKSB7XG4gICAgICBlcnJvci5lcnJjb2RlID0gJ1NZTlRBWCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVycm9yLmVycmNvZGUgPSBlLm5hbWU7XG4gICAgfVxuICAgIGVycm9yLm1lc3NhZ2UgPSBlLm1lc3NhZ2U7XG4gICAgZGlzcGF0Y2hFdmVudCgnb25FcnJvcicsIGVycm9yKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAodGhpcy5pc05vZGUpIHtcbiAgICB0aGlzLndlYnNvY2tldC5vbignbWVzc2FnZScsIHRoaXMub25NZXNzYWdlLmJpbmQodGhpcykpO1xuICAgIHRoaXMud2Vic29ja2V0Lm9uKCdvcGVuJywgdGhpcy5vbk9wZW4uYmluZCh0aGlzKSk7XG4gICAgLy8gbm9kZS5qcyB3ZWJzb2NrZXQgaW1wbGVtZW50YXRpb24gbm90IGNvbXBsaWFudFxuICAgIHRoaXMud2Vic29ja2V0Lm9uKCdjbG9zZScsIHRoaXMub25DbG9zZS5iaW5kKHRoaXMsIHtcbiAgICAgIGNvZGU6IDAsXG4gICAgICByZWFzb246ICdVTktOT1dOJyxcbiAgICAgIHdhc0NsZWFuOiB0cnVlXG4gICAgfSkpO1xuICAgIHRoaXMud2Vic29ja2V0Lm9uKCdlcnJvcicsIHRoaXMub25FcnJvci5iaW5kKHRoaXMpKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLndlYnNvY2tldC5vbm9wZW4gPSB0aGlzLm9uT3Blbi5iaW5kKHRoaXMpO1xuICAgIHRoaXMud2Vic29ja2V0Lm9uY2xvc2UgPSB0aGlzLm9uQ2xvc2UuYmluZCh0aGlzKTtcbiAgICB0aGlzLndlYnNvY2tldC5vbm1lc3NhZ2UgPSB0aGlzLm9uTWVzc2FnZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMud2Vic29ja2V0Lm9uZXJyb3IgPSB0aGlzLm9uRXJyb3IuYmluZCh0aGlzKTtcbiAgfVxufTtcblxuV1MucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbiAoZGF0YSwgY29udGludWF0aW9uKSB7XG4gIHZhciB0b1NlbmQgPSBkYXRhLnRleHQgfHwgZGF0YS5iaW5hcnkgfHwgZGF0YS5idWZmZXIsXG4gICAgZXJyY29kZSxcbiAgICBtZXNzYWdlO1xuXG4gIGlmICh0b1NlbmQpIHtcbiAgICB0cnkge1xuICAgICAgLy8gRm9yIG5vZGUuanMsIHdlIGhhdmUgdG8gZG8gd2VpcmQgYnVmZmVyIHN0dWZmXG4gICAgICBpZiAodGhpcy5pc05vZGUgJiYgdG9TZW5kIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgICAgdGhpcy53ZWJzb2NrZXQuc2VuZChcbiAgICAgICAgICBuZXcgVWludDhBcnJheSh0b1NlbmQpLFxuICAgICAgICAgIHsgYmluYXJ5OiB0cnVlIH0sXG4gICAgICAgICAgdGhpcy5vbkVycm9yLmJpbmQodGhpcylcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMud2Vic29ja2V0LnNlbmQodG9TZW5kKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIFN5bnRheEVycm9yKSB7XG4gICAgICAgIGVycmNvZGUgPSBcIlNZTlRBWFwiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXJyY29kZSA9IFwiSU5WQUxJRF9TVEFURVwiO1xuICAgICAgfVxuICAgICAgbWVzc2FnZSA9IGUubWVzc2FnZTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZXJyY29kZSA9IFwiQkFEX1NFTkRcIjtcbiAgICBtZXNzYWdlID0gXCJObyB0ZXh0LCBiaW5hcnksIG9yIGJ1ZmZlciBkYXRhIGZvdW5kLlwiO1xuICB9XG5cbiAgaWYgKGVycmNvZGUpIHtcbiAgICBjb250aW51YXRpb24odW5kZWZpbmVkLCB7XG4gICAgICBlcnJjb2RlOiBlcnJjb2RlLFxuICAgICAgbWVzc2FnZTogbWVzc2FnZVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGNvbnRpbnVhdGlvbigpO1xuICB9XG59O1xuXG5XUy5wcm90b3R5cGUuZ2V0UmVhZHlTdGF0ZSA9IGZ1bmN0aW9uIChjb250aW51YXRpb24pIHtcbiAgY29udGludWF0aW9uKHRoaXMud2Vic29ja2V0LnJlYWR5U3RhdGUpO1xufTtcblxuV1MucHJvdG90eXBlLmdldEJ1ZmZlcmVkQW1vdW50ID0gZnVuY3Rpb24gKGNvbnRpbnVhdGlvbikge1xuICBjb250aW51YXRpb24odGhpcy53ZWJzb2NrZXQuYnVmZmVyZWRBbW91bnQpO1xufTtcblxuV1MucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKGNvZGUsIHJlYXNvbiwgY29udGludWF0aW9uKSB7XG4gIHRyeSB7XG4gICAgaWYgKGNvZGUgJiYgcmVhc29uKSB7XG4gICAgICB0aGlzLndlYnNvY2tldC5jbG9zZShjb2RlLCByZWFzb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLndlYnNvY2tldC5jbG9zZSgpO1xuICAgIH1cbiAgICBjb250aW51YXRpb24oKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHZhciBlcnJvckNvZGU7XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBTeW50YXhFcnJvcikge1xuICAgICAgZXJyb3JDb2RlID0gXCJTWU5UQVhcIjtcbiAgICB9IGVsc2Uge1xuICAgICAgZXJyb3JDb2RlID0gXCJJTlZBTElEX0FDQ0VTU1wiO1xuICAgIH1cbiAgICBjb250aW51YXRpb24odW5kZWZpbmVkLCB7XG4gICAgICBlcnJjb2RlOiBlcnJvckNvZGUsXG4gICAgICBtZXNzYWdlOiBlLm1lc3NhZ2VcbiAgICB9KTtcbiAgfVxufTtcblxuV1MucHJvdG90eXBlLm9uT3BlbiA9IGZ1bmN0aW9uIChldmVudCkge1xuICB0aGlzLmRpc3BhdGNoRXZlbnQoJ29uT3BlbicpO1xufTtcblxuV1MucHJvdG90eXBlLm9uTWVzc2FnZSA9IGZ1bmN0aW9uIChldmVudCwgZmxhZ3MpIHtcbiAgdmFyIGRhdGEgPSB7fTtcbiAgaWYgKHRoaXMuaXNOb2RlICYmIGZsYWdzICYmIGZsYWdzLmJpbmFyeSkge1xuICAgIGRhdGEuYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoZXZlbnQpLmJ1ZmZlcjtcbiAgfSBlbHNlIGlmICh0aGlzLmlzTm9kZSkge1xuICAgIGRhdGEudGV4dCA9IGV2ZW50O1xuICB9IGVsc2UgaWYgKHR5cGVvZiBBcnJheUJ1ZmZlciAhPT0gJ3VuZGVmaW5lZCcgJiYgZXZlbnQuZGF0YSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgZGF0YS5idWZmZXIgPSBldmVudC5kYXRhO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBCbG9iICE9PSAndW5kZWZpbmVkJyAmJiBldmVudC5kYXRhIGluc3RhbmNlb2YgQmxvYikge1xuICAgIGRhdGEuYmluYXJ5ID0gZXZlbnQuZGF0YTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXZlbnQuZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICBkYXRhLnRleHQgPSBldmVudC5kYXRhO1xuICB9XG4gIHRoaXMuZGlzcGF0Y2hFdmVudCgnb25NZXNzYWdlJywgZGF0YSk7XG59O1xuXG5XUy5wcm90b3R5cGUub25FcnJvciA9IGZ1bmN0aW9uIChldmVudCkge1xuICAvLyBOb3RoaW5nIHRvIHBhc3Mgb25cbiAgLy8gU2VlOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xODgwNDI5OC8zMDA1MzlcbiAgdGhpcy5kaXNwYXRjaEV2ZW50KCdvbkVycm9yJyk7XG59O1xuXG5XUy5wcm90b3R5cGUub25DbG9zZSA9IGZ1bmN0aW9uIChldmVudCkge1xuICB0aGlzLmRpc3BhdGNoRXZlbnQoJ29uQ2xvc2UnLFxuICAgICAgICAgICAgICAgICAgICAge2NvZGU6IGV2ZW50LmNvZGUsXG4gICAgICAgICAgICAgICAgICAgICAgcmVhc29uOiBldmVudC5yZWFzb24sXG4gICAgICAgICAgICAgICAgICAgICAgd2FzQ2xlYW46IGV2ZW50Lndhc0NsZWFufSk7XG59O1xuXG5leHBvcnRzLnByb3ZpZGVyID0gV1M7XG5leHBvcnRzLm5hbWUgPSAnY29yZS53ZWJzb2NrZXQnO1xuZXhwb3J0cy5zZXRTb2NrZXQgPSBmdW5jdGlvbihpbXBsLCBpc05vZGUpIHtcbiAgV1NIYW5kbGUgPSBpbXBsO1xuICBub2RlU3R5bGUgPSBpc05vZGU7XG59O1xuIiwiLypnbG9iYWxzIGZyZWVkb206dHJ1ZSwgZXhwb3J0cyAqL1xuLypqc2xpbnQgaW5kZW50OjIsIHdoaXRlOnRydWUsIHNsb3BweTp0cnVlLCBicm93c2VyOnRydWUgKi9cblxuLyoqXG4gKiBJbXBsZW1lbnRhdGlvbiBvZiBhIFNvY2lhbCBwcm92aWRlciB3aXRoIGEgZmFrZSBidWRkeWxpc3RcbiAqICdPdGhlciBVc2VyJyBlY2hvcyBldmVyeXRoaW5nIHlvdSBzZW5kIHRvIGl0IGJhY2sgdG8geW91XG4gKiBUaGlzIGlzIHBhcnRpY3VsYXJseSB1c2VmdWwgd2hlbiB5b3UncmUgZGVidWdnaW5nIFVJcyB3aXRoIG11bHRpLXVzZXIgaW50ZXJhY3Rpb25zXG4gKlxuICogVGhlIHByb3ZpZGVyIG9mZmVyc1xuICogLSBhIGJ1ZGR5bGlzdCBvZiBmYWtlIHVzZXJzXG4gKiAtIG5vIHJlbGlhYmlsaXR5IG9mIG1lc3NhZ2UgZGVsaXZlcnlcbiAqIC0gaW4tb3JkZXIgZGVsaXZlcnlcbiAqIC0gY2xpZW50cyBhcmUgc3RhdGljYWxseSBkZWZpbmVkIGluIHRoZSBjbGFzc1xuICogLSAnT3RoZXIgVXNlcicgaXMgYSBzcGVjaWFsIGJ1ZGR5IHRoYXQgZWNob3Mgd2hhdCB5b3Ugc2F5IGJhY2sgdG8geW91XG4gKiovXG5cbmZ1bmN0aW9uIExvb3BiYWNrU29jaWFsUHJvdmlkZXIoZGlzcGF0Y2hFdmVudCkge1xuICB0aGlzLmRpc3BhdGNoRXZlbnQgPSBkaXNwYXRjaEV2ZW50O1xuXG4gIC8vQ29uc3RhbnRzXG4gIHRoaXMudGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gIHRoaXMudXNlcklkID0gJ1Rlc3QgVXNlcic7ICAgICAgLy9NeSB1c2VySWRcbiAgdGhpcy5jbGllbnRJZCA9ICdUZXN0IFVzZXIuMCc7ICAvL015IGNsaWVudElkXG4gIHRoaXMuc29jaWFsID0gZnJlZWRvbSgpO1xuXG4gIC8vUG9wdWxhdGUgYSBmYWtlIHJvc3RlclxuICB0aGlzLnVzZXJzID0ge1xuICAgIFwiVGVzdCBVc2VyXCI6IHRoaXMubWFrZVVzZXJFbnRyeSh0aGlzLnVzZXJJZCksXG4gICAgXCJPdGhlciBVc2VyXCI6IHRoaXMubWFrZVVzZXJFbnRyeShcIk90aGVyIFVzZXJcIiksXG4gICAgJ0pvaG5ueSBBcHBsZXNlZWQnOiB0aGlzLm1ha2VVc2VyRW50cnkoJ0pvaG5ueSBBcHBsZXNlZWQnKSxcbiAgICAnQmV0dHkgQm9vcCc6IHRoaXMubWFrZVVzZXJFbnRyeSgnQmV0dHkgQm9vcCcpLFxuICAgICdCaWcgQmlyZCc6IHRoaXMubWFrZVVzZXJFbnRyeSgnQmlnIEJpcmQnKSxcbiAgICAnQnVncyBCdW5ueSc6IHRoaXMubWFrZVVzZXJFbnRyeSgnQnVncyBCdW5ueScpLFxuICAgICdEYWZmeSBEdWNrJzogdGhpcy5tYWtlVXNlckVudHJ5KCdEYWZmeSBEdWNrJyksXG4gICAgJ0tlcm1pdCB0aGUgRnJvZyc6IHRoaXMubWFrZVVzZXJFbnRyeSgnS2VybWl0IHRoZSBGcm9nJyksXG4gICAgJ01pbm5pZSBNb3VzZSc6IHRoaXMubWFrZVVzZXJFbnRyeSgnTWlubmllIE1vdXNlJyksXG4gICAgJ1Bvcmt5IFBpZyc6IHRoaXMubWFrZVVzZXJFbnRyeSgnUG9ya3kgUGlnJyksXG4gICAgJ1N3ZWRpc2ggQ2hlZic6IHRoaXMubWFrZVVzZXJFbnRyeSgnU3dlZGlzaCBDaGVmJyksXG4gICAgJ1lvc2VtaXRlIFNhbSc6IHRoaXMubWFrZVVzZXJFbnRyeSgnWW9zZW1pdGUgU2FtJylcbiAgfTtcbiAgdGhpcy5jbGllbnRzID0ge307XG59XG5cbi8vIEF1dG9jcmVhdGVzIGZha2Ugcm9zdGVycyB3aXRoIHZhcmlhYmxlIG51bWJlcnMgb2YgY2xpZW50c1xuLy8gYW5kIHJhbmRvbSBzdGF0dXNlc1xuTG9vcGJhY2tTb2NpYWxQcm92aWRlci5wcm90b3R5cGUubWFrZVVzZXJFbnRyeSA9IGZ1bmN0aW9uKHVzZXJJZCkge1xuICByZXR1cm4ge1xuICAgIHVzZXJJZDogdXNlcklkLFxuICAgIG5hbWU6IHVzZXJJZCxcbiAgICBsYXN0VXBkYXRlZDogdGhpcy50aW1lXG4gIH07XG59O1xuXG5Mb29wYmFja1NvY2lhbFByb3ZpZGVyLnByb3RvdHlwZS5maWxsQ2xpZW50cyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgU1RBVFVTRVMgPSBbJ09OTElORScsICdPRkZMSU5FJywgJ09OTElORV9XSVRIX09USEVSX0FQUCddLFxuICAgICAgdXNlcklkLCBuQ2xpZW50cywgY2xpZW50SWQsIGk7XG4gIHRoaXMuY2xpZW50cyA9IHtcbiAgICBcIlRlc3QgVXNlci4wXCI6IHtcbiAgICAgICd1c2VySWQnOiB0aGlzLnVzZXJJZCxcbiAgICAgICdjbGllbnRJZCc6IHRoaXMuY2xpZW50SWQsXG4gICAgICAnc3RhdHVzJzogXCJPTkxJTkVcIixcbiAgICAgICdsYXN0VXBkYXRlZCc6IHRoaXMudGltZSxcbiAgICAgICdsYXN0U2Vlbic6IHRoaXMudGltZVxuICAgIH0sXG4gICAgXCJPdGhlciBVc2VyLjBcIjoge1xuICAgICAgJ3VzZXJJZCc6IFwiT3RoZXIgVXNlclwiLFxuICAgICAgJ2NsaWVudElkJzogXCJPdGhlciBVc2VyLjBcIiwgXG4gICAgICAnc3RhdHVzJzogXCJPTkxJTkVcIixcbiAgICAgICdsYXN0VXBkYXRlZCc6IHRoaXMudGltZSxcbiAgICAgICdsYXN0U2Vlbic6IHRoaXMudGltZVxuICAgIH1cbiAgfTtcblxuICBmb3IgKHVzZXJJZCBpbiB0aGlzLnVzZXJzKSB7XG4gICAgaWYgKHRoaXMudXNlcnMuaGFzT3duUHJvcGVydHkodXNlcklkKSkge1xuICAgICAgbkNsaWVudHMgPSB1c2VySWQuY2hhckNvZGVBdCgwKSAlIDM7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbkNsaWVudHM7IGkgKz0gMSkge1xuICAgICAgICBjbGllbnRJZCA9IHVzZXJJZCArICcvLWNsaWVudCcgKyAoaSArIDEpO1xuICAgICAgICB0aGlzLmNsaWVudHNbY2xpZW50SWRdID0ge1xuICAgICAgICAgIHVzZXJJZDogdXNlcklkLFxuICAgICAgICAgIGNsaWVudElkOiBjbGllbnRJZCxcbiAgICAgICAgICBzdGF0dXM6IFNUQVRVU0VTW2ldLFxuICAgICAgICAgIGxhc3RVcGRhdGVkOiB0aGlzLnRpbWUsXG4gICAgICAgICAgbGFzdFNlZW46IHRoaXMudGltZVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm47XG59O1xuXG4vLyBMb2cgaW4uIE9wdGlvbnMgYXJlIGlnbm9yZWRcbi8vIFJvc3RlciBpcyBvbmx5IGVtaXR0ZWQgdG8gY2FsbGVyIGFmdGVyIGxvZyBpblxuTG9vcGJhY2tTb2NpYWxQcm92aWRlci5wcm90b3R5cGUubG9naW4gPSBmdW5jdGlvbihvcHRzLCBjb250aW51YXRpb24pIHtcbiAgdmFyIHVzZXJJZCwgY2xpZW50SWQ7XG5cbiAgaWYgKHRoaXMuY2xpZW50cy5oYXNPd25Qcm9wZXJ0eSh0aGlzLmNsaWVudElkKSkge1xuICAgIGNvbnRpbnVhdGlvbih1bmRlZmluZWQsIHRoaXMuZXJyKFwiTE9HSU5fQUxSRUFEWU9OTElORVwiKSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMuZmlsbENsaWVudHMoKTtcbiAgZm9yICh1c2VySWQgaW4gdGhpcy51c2Vycykge1xuICAgIGlmICh0aGlzLnVzZXJzLmhhc093blByb3BlcnR5KHVzZXJJZCkpIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgnb25Vc2VyUHJvZmlsZScsIHRoaXMudXNlcnNbdXNlcklkXSk7XG4gICAgfVxuICB9XG4gIGZvciAoY2xpZW50SWQgaW4gdGhpcy5jbGllbnRzKSB7XG4gICAgaWYgKHRoaXMuY2xpZW50cy5oYXNPd25Qcm9wZXJ0eShjbGllbnRJZCkpIHtcbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgnb25DbGllbnRTdGF0ZScsIHRoaXMuY2xpZW50c1tjbGllbnRJZF0pO1xuICAgIH1cbiAgfVxuICBjb250aW51YXRpb24odGhpcy5jbGllbnRzW3RoaXMuY2xpZW50SWRdKTtcbn07XG5cbi8vIENsZWFyIGNyZWRlbnRpYWxzICh0aGVyZSBhcmUgbm9uZSlcbkxvb3BiYWNrU29jaWFsUHJvdmlkZXIucHJvdG90eXBlLmNsZWFyQ2FjaGVkQ3JlZGVudGlhbHMgPSBmdW5jdGlvbihjb250aW51YXRpb24pIHtcbiAgcmV0dXJuO1xufTtcblxuLy8gUmV0dXJuIHRoZSB1c2VyIHByb2ZpbGVzXG5Mb29wYmFja1NvY2lhbFByb3ZpZGVyLnByb3RvdHlwZS5nZXRVc2VycyA9IGZ1bmN0aW9uKGNvbnRpbnVhdGlvbikge1xuICBpZiAoIXRoaXMuY2xpZW50cy5oYXNPd25Qcm9wZXJ0eSh0aGlzLmNsaWVudElkKSkge1xuICAgIGNvbnRpbnVhdGlvbih1bmRlZmluZWQsIHRoaXMuZXJyKFwiT0ZGTElORVwiKSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnRpbnVhdGlvbih0aGlzLnVzZXJzKTtcbn07XG5cbi8vIFJldHVybiB0aGUgY2xpZW50c1xuTG9vcGJhY2tTb2NpYWxQcm92aWRlci5wcm90b3R5cGUuZ2V0Q2xpZW50cyA9IGZ1bmN0aW9uKGNvbnRpbnVhdGlvbikge1xuICBpZiAoIXRoaXMuY2xpZW50cy5oYXNPd25Qcm9wZXJ0eSh0aGlzLmNsaWVudElkKSkge1xuICAgIGNvbnRpbnVhdGlvbih1bmRlZmluZWQsIHRoaXMuZXJyKFwiT0ZGTElORVwiKSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnRpbnVhdGlvbih0aGlzLmNsaWVudHMpO1xufTtcblxuLy8gU2VuZCBhIG1lc3NhZ2UgdG8gc29tZW9uZS5cbi8vIEFsbCBtZXNzYWdlcyBub3Qgc2VudCB0byB0aGlzLnVzZXJJZCB3aWxsIGJlIGVjaG9lZCBiYWNrIHRvIHNlbGYgYXMgaWZcbi8vIHNlbnQgYnkgJ090aGVyIFVzZXInXG5Mb29wYmFja1NvY2lhbFByb3ZpZGVyLnByb3RvdHlwZS5zZW5kTWVzc2FnZSA9IGZ1bmN0aW9uKHRvLCBtc2csIGNvbnRpbnVhdGlvbikge1xuICBpZiAoIXRoaXMuY2xpZW50cy5oYXNPd25Qcm9wZXJ0eSh0aGlzLmNsaWVudElkKSkge1xuICAgIGNvbnRpbnVhdGlvbih1bmRlZmluZWQsIHRoaXMuZXJyKFwiT0ZGTElORVwiKSk7XG4gICAgcmV0dXJuO1xuICB9IGVsc2UgaWYgKCF0aGlzLmNsaWVudHMuaGFzT3duUHJvcGVydHkodG8pICYmICF0aGlzLnVzZXJzLmhhc093blByb3BlcnR5KHRvKSkge1xuICAgIGNvbnRpbnVhdGlvbih1bmRlZmluZWQsIHRoaXMuZXJyKFwiU0VORF9JTlZBTElEREVTVElOQVRJT05cIikpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICh0byA9PT0gdGhpcy51c2VySWQgfHwgdG8gPT09IHRoaXMuY2xpZW50SWQpIHtcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ29uTWVzc2FnZScsIHtcbiAgICAgIGZyb206IHRoaXMuY2xpZW50c1t0aGlzLmNsaWVudElkXSxcbiAgICAgIG1lc3NhZ2U6IG1zZ1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgnb25NZXNzYWdlJywge1xuICAgICAgZnJvbTogdGhpcy5jbGllbnRzW1wiT3RoZXIgVXNlci4wXCJdLFxuICAgICAgbWVzc2FnZTogbXNnXG4gICAgfSk7XG4gIH1cbiAgY29udGludWF0aW9uKCk7XG59O1xuXG4vLyBMb2cgb3V0LiBBbGwgdXNlcnMgaW4gdGhlIHJvc3RlciB3aWxsIGdvIG9mZmxpbmVcbi8vIE9wdGlvbnMgYXJlIGlnbm9yZWRcbkxvb3BiYWNrU29jaWFsUHJvdmlkZXIucHJvdG90eXBlLmxvZ291dCA9IGZ1bmN0aW9uKGNvbnRpbnVhdGlvbikge1xuICB2YXIgY2xpZW50SWQ7XG4gIGlmICghdGhpcy5jbGllbnRzLmhhc093blByb3BlcnR5KHRoaXMuY2xpZW50SWQpKSB7XG4gICAgY29udGludWF0aW9uKHVuZGVmaW5lZCwgdGhpcy5lcnIoXCJPRkZMSU5FXCIpKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBmb3IgKGNsaWVudElkIGluIHRoaXMuY2xpZW50cykge1xuICAgIGlmICh0aGlzLmNsaWVudHMuaGFzT3duUHJvcGVydHkoY2xpZW50SWQpKSB7XG4gICAgICB0aGlzLmNsaWVudHNbY2xpZW50SWRdLnN0YXR1cyA9ICdPRkZMSU5FJztcbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgnb25DbGllbnRTdGF0ZScsIHRoaXMuY2xpZW50c1tjbGllbnRJZF0pO1xuICAgIH1cbiAgfVxuXG4gIHRoaXMuY2xpZW50cyA9IHt9O1xuICBjb250aW51YXRpb24oKTtcbn07XG5cbkxvb3BiYWNrU29jaWFsUHJvdmlkZXIucHJvdG90eXBlLmVyciA9IGZ1bmN0aW9uKGNvZGUpIHtcbiAgdmFyIGVyciA9IHtcbiAgICBlcnJjb2RlOiBjb2RlLFxuICAgIG1lc3NhZ2U6IHRoaXMuc29jaWFsLkVSUkNPREVbY29kZV1cbiAgfTtcbiAgcmV0dXJuIGVycjtcbn07XG5cbi8qKiBSRUdJU1RFUiBQUk9WSURFUiAqKi9cbmlmICh0eXBlb2YgZnJlZWRvbSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgZnJlZWRvbSgpLnByb3ZpZGVBc3luY2hyb25vdXMoTG9vcGJhY2tTb2NpYWxQcm92aWRlcik7XG59XG5cbmlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgZXhwb3J0cy5wcm92aWRlciA9IExvb3BiYWNrU29jaWFsUHJvdmlkZXI7XG4gIGV4cG9ydHMubmFtZSA9ICdzb2NpYWwnO1xufVxuIiwiLypnbG9iYWxzIGZyZWVkb206dHJ1ZSwgV2ViU29ja2V0LCBERUJVRyAqL1xuLypqc2xpbnQgaW5kZW50OjIsIHdoaXRlOnRydWUsIG5vZGU6dHJ1ZSwgc2xvcHB5OnRydWUsIGJyb3dzZXI6dHJ1ZSAqL1xuXG4vKipcbiAqIEltcGxlbWVudGF0aW9uIG9mIGEgU29jaWFsIHByb3ZpZGVyIHRoYXQgZGVwZW5kcyBvblxuICogdGhlIFdlYlNvY2tldHMgc2VydmVyIGNvZGUgaW4gc2VydmVyL3JvdXRlci5weVxuICogVGhlIGN1cnJlbnQgaW1wbGVtZW50YXRpb24gdXNlcyBhIHB1YmxpYyBmYWNpbmcgY29tbW9uIHNlcnZlclxuICogaG9zdGVkIG9uIHAycGJyLmNvbVxuICpcbiAqIFRoZSBwcm92aWRlciBvZmZlcnNcbiAqIC0gQSBzaW5nbGUgZ2xvYmFsIGJ1ZGR5bGlzdCB0aGF0IGV2ZXJ5b25lIGlzIG9uXG4gKiAtIG5vIHJlbGlhYmlsaXR5XG4gKiAtIG91dCBvZiBvcmRlciBkZWxpdmVyeVxuICogLSBlcGhlbWVyYWwgdXNlcklkcyBhbmQgY2xpZW50SWRzXG4gKiBAY2xhc3MgV1NTb2NpYWxQcm92aWRlclxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkaXNwYXRjaEV2ZW50IGNhbGxiYWNrIHRvIHNpZ25hbCBldmVudHNcbiAqIEBwYXJhbSB7V2ViU29ja2V0fSB3ZWJTb2NrZXQgQWx0ZXJuYXRpdmUgd2ViU29ja2V0IGltcGxlbWVudGF0aW9uIGZvciB0ZXN0c1xuICoqL1xuZnVuY3Rpb24gV1NTb2NpYWxQcm92aWRlcihkaXNwYXRjaEV2ZW50LCB3ZWJTb2NrZXQpIHtcbiAgdGhpcy5kaXNwYXRjaEV2ZW50ID0gZGlzcGF0Y2hFdmVudDtcblxuICB0aGlzLndlYnNvY2tldCA9IGZyZWVkb21bXCJjb3JlLndlYnNvY2tldFwiXSB8fCB3ZWJTb2NrZXQ7XG4gIGlmICh0eXBlb2YgREVCVUcgIT09ICd1bmRlZmluZWQnICYmIERFQlVHKSB7XG4gICAgdGhpcy5XU19VUkwgPSAnd3M6Ly9wMnBici5jb206ODA4Mi9yb3V0ZS8nO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuV1NfVVJMID0gJ3dzczovL3AycGJyLmNvbS9yb3V0ZS8nO1xuICB9XG4gIHRoaXMuc29jaWFsID0gZnJlZWRvbSgpO1xuXG4gIHRoaXMuY29ubiA9IG51bGw7ICAgLy8gV2ViIFNvY2tldFxuICB0aGlzLmlkID0gbnVsbDsgICAgIC8vIHVzZXJJZCBvZiB0aGlzIHVzZXJcbiAgXG4gIC8vTm90ZSB0aGF0IGluIHRoaXMud2Vic29ja2V0LCB0aGVyZSBpcyBhIDEtMSByZWxhdGlvbnNoaXAgYmV0d2VlbiB1c2VyIGFuZCBjbGllbnRcbiAgdGhpcy51c2VycyA9IHt9OyAgICAvLyBMaXN0IG9mIHNlZW4gdXNlcnMgKDx1c2VyX3Byb2ZpbGU+KVxuICB0aGlzLmNsaWVudHMgPSB7fTsgIC8vIExpc3Qgb2Ygc2VlbiBjbGllbnRzICg8Y2xpZW50X3N0YXRlPilcblxufVxuXG4vKipcbiAqIENvbm5lY3QgdG8gdGhlIFdlYiBTb2NrZXQgcmVuZGV6dm91cyBzZXJ2ZXJcbiAqIGUuZy4gc29jaWFsLmxvZ2luKE9iamVjdCBvcHRpb25zKVxuICogVGhlIG9ubHkgbG9naW4gb3B0aW9uIG5lZWRlZCBpcyAnYWdlbnQnLCB1c2VkIHRvIGRldGVybWluZSB3aGljaCBncm91cCB0byBqb2luIGluIHRoZSBzZXJ2ZXJcbiAqXG4gKiBAbWV0aG9kIGxvZ2luXG4gKiBAcGFyYW0ge09iamVjdH0gbG9naW5PcHRpb25zXG4gKiBAcmV0dXJuIHtPYmplY3R9IHN0YXR1cyAtIFNhbWUgc2NoZW1hIGFzICdvblN0YXR1cycgZXZlbnRzXG4gKiovXG5XU1NvY2lhbFByb3ZpZGVyLnByb3RvdHlwZS5sb2dpbiA9IGZ1bmN0aW9uKGxvZ2luT3B0cywgY29udGludWF0aW9uKSB7XG4gIC8vIFdyYXAgdGhlIGNvbnRpbnVhdGlvbiBzbyB0aGF0IGl0IHdpbGwgb25seSBiZSBjYWxsZWQgb25jZSBieVxuICAvLyBvbm1lc3NhZ2UgaW4gdGhlIGNhc2Ugb2Ygc3VjY2Vzcy5cbiAgdmFyIGZpbmlzaExvZ2luID0ge1xuICAgIGNvbnRpbnVhdGlvbjogY29udGludWF0aW9uLFxuICAgIGZpbmlzaDogZnVuY3Rpb24obXNnLCBlcnIpIHtcbiAgICAgIGlmICh0aGlzLmNvbnRpbnVhdGlvbikge1xuICAgICAgICB0aGlzLmNvbnRpbnVhdGlvbihtc2csIGVycik7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmNvbnRpbnVhdGlvbjtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgaWYgKHRoaXMuY29ubiAhPT0gbnVsbCkge1xuICAgIGZpbmlzaExvZ2luLmZpbmlzaCh1bmRlZmluZWQsIHRoaXMuZXJyKFwiTE9HSU5fQUxSRUFEWU9OTElORVwiKSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMuY29ubiA9IHRoaXMud2Vic29ja2V0KHRoaXMuV1NfVVJMICsgbG9naW5PcHRzLmFnZW50KTtcbiAgLy8gU2F2ZSB0aGUgY29udGludWF0aW9uIHVudGlsIHdlIGdldCBhIHN0YXR1cyBtZXNzYWdlIGZvclxuICAvLyBzdWNjZXNzZnVsIGxvZ2luLlxuICB0aGlzLmNvbm4ub24oXCJvbk1lc3NhZ2VcIiwgdGhpcy5vbk1lc3NhZ2UuYmluZCh0aGlzLCBmaW5pc2hMb2dpbikpO1xuICB0aGlzLmNvbm4ub24oXCJvbkVycm9yXCIsIGZ1bmN0aW9uIChjb250LCBlcnJvcikge1xuICAgIHRoaXMuY29ubiA9IG51bGw7XG4gICAgY29udC5maW5pc2godW5kZWZpbmVkLCB0aGlzLmVycignRVJSX0NPTk5FQ1RJT04nKSk7XG4gIH0uYmluZCh0aGlzLCBmaW5pc2hMb2dpbikpO1xuICB0aGlzLmNvbm4ub24oXCJvbkNsb3NlXCIsIGZ1bmN0aW9uIChjb250LCBtc2cpIHtcbiAgICB0aGlzLmNvbm4gPSBudWxsO1xuICAgIHRoaXMuY2hhbmdlUm9zdGVyKHRoaXMuaWQsIGZhbHNlKTtcbiAgfS5iaW5kKHRoaXMsIGZpbmlzaExvZ2luKSk7XG5cbn07XG5cbi8qKlxuICogUmV0dXJucyBhbGwgdGhlIDx1c2VyX3Byb2ZpbGU+cyB0aGF0IHdlJ3ZlIHNlZW4gc28gZmFyIChmcm9tICdvblVzZXJQcm9maWxlJyBldmVudHMpXG4gKiBOb3RlOiB0aGUgdXNlcidzIG93biA8dXNlcl9wcm9maWxlPiB3aWxsIGJlIHNvbWV3aGVyZSBpbiB0aGlzIGxpc3QuIFxuICogVXNlIHRoZSB1c2VySWQgcmV0dXJuZWQgZnJvbSBzb2NpYWwubG9naW4oKSB0byBleHRyYWN0IHlvdXIgZWxlbWVudFxuICogTk9URTogVGhpcyBkb2VzIG5vdCBndWFyYW50ZWUgdG8gYmUgZW50aXJlIHJvc3RlciwganVzdCB1c2VycyB3ZSdyZSBjdXJyZW50bHkgYXdhcmUgb2YgYXQgdGhlIG1vbWVudFxuICogZS5nLiBzb2NpYWwuZ2V0VXNlcnMoKTtcbiAqXG4gKiBAbWV0aG9kIGdldFVzZXJzXG4gKiBAcmV0dXJuIHtPYmplY3R9IHsgXG4gKiAgICAndXNlcklkMSc6IDx1c2VyX3Byb2ZpbGU+LFxuICogICAgJ3VzZXJJZDInOiA8dXNlcl9wcm9maWxlPixcbiAqICAgICAuLi5cbiAqIH0gTGlzdCBvZiA8dXNlcl9wcm9maWxlPnMgaW5kZXhlZCBieSB1c2VySWRcbiAqICAgT24gZmFpbHVyZSwgcmVqZWN0cyB3aXRoIGFuIGVycm9yIGNvZGUgKHNlZSBhYm92ZSlcbiAqKi9cbldTU29jaWFsUHJvdmlkZXIucHJvdG90eXBlLmdldFVzZXJzID0gZnVuY3Rpb24oY29udGludWF0aW9uKSB7XG4gIGlmICh0aGlzLmNvbm4gPT09IG51bGwpIHtcbiAgICBjb250aW51YXRpb24odW5kZWZpbmVkLCB0aGlzLmVycihcIk9GRkxJTkVcIikpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb250aW51YXRpb24odGhpcy51c2Vycyk7XG59O1xuXG4vKipcbiAqIFJldHVybnMgYWxsIHRoZSA8Y2xpZW50X3N0YXRlPnMgdGhhdCB3ZSd2ZSBzZWVuIHNvIGZhciAoZnJvbSBhbnkgJ29uQ2xpZW50U3RhdGUnIGV2ZW50KVxuICogTm90ZTogdGhpcyBpbnN0YW5jZSdzIG93biA8Y2xpZW50X3N0YXRlPiB3aWxsIGJlIHNvbWV3aGVyZSBpbiB0aGlzIGxpc3RcbiAqIFVzZSB0aGUgY2xpZW50SWQgcmV0dXJuZWQgZnJvbSBzb2NpYWwubG9naW4oKSB0byBleHRyYWN0IHlvdXIgZWxlbWVudFxuICogTk9URTogVGhpcyBkb2VzIG5vdCBndWFyYW50ZWUgdG8gYmUgZW50aXJlIHJvc3RlciwganVzdCBjbGllbnRzIHdlJ3JlIGN1cnJlbnRseSBhd2FyZSBvZiBhdCB0aGUgbW9tZW50XG4gKiBlLmcuIHNvY2lhbC5nZXRDbGllbnRzKClcbiAqIFxuICogQG1ldGhvZCBnZXRDbGllbnRzXG4gKiBAcmV0dXJuIHtPYmplY3R9IHsgXG4gKiAgICAnY2xpZW50SWQxJzogPGNsaWVudF9zdGF0ZT4sXG4gKiAgICAnY2xpZW50SWQyJzogPGNsaWVudF9zdGF0ZT4sXG4gKiAgICAgLi4uXG4gKiB9IExpc3Qgb2YgPGNsaWVudF9zdGF0ZT5zIGluZGV4ZWQgYnkgY2xpZW50SWRcbiAqICAgT24gZmFpbHVyZSwgcmVqZWN0cyB3aXRoIGFuIGVycm9yIGNvZGUgKHNlZSBhYm92ZSlcbiAqKi9cbldTU29jaWFsUHJvdmlkZXIucHJvdG90eXBlLmdldENsaWVudHMgPSBmdW5jdGlvbihjb250aW51YXRpb24pIHtcbiAgaWYgKHRoaXMuY29ubiA9PT0gbnVsbCkge1xuICAgIGNvbnRpbnVhdGlvbih1bmRlZmluZWQsIHRoaXMuZXJyKFwiT0ZGTElORVwiKSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnRpbnVhdGlvbih0aGlzLmNsaWVudHMpO1xufTtcblxuLyoqIFxuICogU2VuZCBhIG1lc3NhZ2UgdG8gdXNlciBvbiB5b3VyIG5ldHdvcmtcbiAqIElmIHRoZSBkZXN0aW5hdGlvbiBpcyBub3Qgc3BlY2lmaWVkIG9yIGludmFsaWQsIHRoZSBtZXNzYWdlIGlzIGRyb3BwZWRcbiAqIE5vdGU6IHVzZXJJZCBhbmQgY2xpZW50SWQgYXJlIHRoZSBzYW1lIGZvciB0aGlzLndlYnNvY2tldFxuICogZS5nLiBzZW5kTWVzc2FnZShTdHJpbmcgZGVzdGluYXRpb25faWQsIFN0cmluZyBtZXNzYWdlKVxuICogXG4gKiBAbWV0aG9kIHNlbmRNZXNzYWdlXG4gKiBAcGFyYW0ge1N0cmluZ30gZGVzdGluYXRpb25faWQgLSB0YXJnZXRcbiAqIEByZXR1cm4gbm90aGluZ1xuICoqL1xuV1NTb2NpYWxQcm92aWRlci5wcm90b3R5cGUuc2VuZE1lc3NhZ2UgPSBmdW5jdGlvbih0bywgbXNnLCBjb250aW51YXRpb24pIHtcbiAgaWYgKHRoaXMuY29ubiA9PT0gbnVsbCkge1xuICAgIGNvbnRpbnVhdGlvbih1bmRlZmluZWQsIHRoaXMuZXJyKFwiT0ZGTElORVwiKSk7XG4gICAgcmV0dXJuO1xuICB9IGVsc2UgaWYgKCF0aGlzLmNsaWVudHMuaGFzT3duUHJvcGVydHkodG8pICYmICF0aGlzLnVzZXJzLmhhc093blByb3BlcnR5KHRvKSkge1xuICAgIGNvbnRpbnVhdGlvbih1bmRlZmluZWQsIHRoaXMuZXJyKFwiU0VORF9JTlZBTElEREVTVElOQVRJT05cIikpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRoaXMuY29ubi5zZW5kKHt0ZXh0OiBKU09OLnN0cmluZ2lmeSh7dG86IHRvLCBtc2c6IG1zZ30pfSk7XG4gIGNvbnRpbnVhdGlvbigpO1xufTtcblxuLyoqXG4gICAqIERpc2Nvbm5lY3RzIGZyb20gdGhlIFdlYiBTb2NrZXQgc2VydmVyXG4gICAqIGUuZy4gbG9nb3V0KE9iamVjdCBvcHRpb25zKVxuICAgKiBObyBvcHRpb25zIG5lZWRlZFxuICAgKiBcbiAgICogQG1ldGhvZCBsb2dvdXRcbiAgICogQHJldHVybiB7T2JqZWN0fSBzdGF0dXMgLSBzYW1lIHNjaGVtYSBhcyAnb25TdGF0dXMnIGV2ZW50c1xuICAgKiovXG5XU1NvY2lhbFByb3ZpZGVyLnByb3RvdHlwZS5sb2dvdXQgPSBmdW5jdGlvbihjb250aW51YXRpb24pIHtcbiAgaWYgKHRoaXMuY29ubiA9PT0gbnVsbCkgeyAvLyBXZSBtYXkgbm90IGhhdmUgYmVlbiBsb2dnZWQgaW5cbiAgICB0aGlzLmNoYW5nZVJvc3Rlcih0aGlzLmlkLCBmYWxzZSk7XG4gICAgY29udGludWF0aW9uKHVuZGVmaW5lZCwgdGhpcy5lcnIoXCJPRkZMSU5FXCIpKTtcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5jb25uLm9uKFwib25DbG9zZVwiLCBmdW5jdGlvbihjb250aW51YXRpb24pIHtcbiAgICB0aGlzLmNvbm4gPSBudWxsO1xuICAgIHRoaXMuY2hhbmdlUm9zdGVyKHRoaXMuaWQsIGZhbHNlKTtcbiAgICBjb250aW51YXRpb24oKTtcbiAgfS5iaW5kKHRoaXMsIGNvbnRpbnVhdGlvbikpO1xuICB0aGlzLmNvbm4uY2xvc2UoKTtcbn07XG5cbi8qKlxuICogSU5URVJOQUwgTUVUSE9EU1xuICoqL1xuXG4vKipcbiAqIERpc3BhdGNoIGFuICdvbkNsaWVudFN0YXRlJyBldmVudCB3aXRoIHRoZSBmb2xsb3dpbmcgc3RhdHVzIGFuZCByZXR1cm4gdGhlIDxjbGllbnRfY2FyZD5cbiAqIE1vZGlmeSBlbnRyaWVzIGluIHRoaXMudXNlcnMgYW5kIHRoaXMuY2xpZW50cyBpZiBuZWNlc3NhcnlcbiAqIE5vdGUsIGJlY2F1c2UgdGhpcyBwcm92aWRlciBoYXMgYSBnbG9iYWwgYnVkZHlsaXN0IG9mIGVwaGVtZXJhbCBjbGllbnRzLCB3ZSB0cmltIGFsbCBPRkZMSU5FIHVzZXJzXG4gKlxuICogQG1ldGhvZCBjaGFuZ2VSb3N0ZXJcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge1N0cmluZ30gaWQgLSB1c2VySWQgYW5kIGNsaWVudElkIGFyZSB0aGUgc2FtZSBpbiB0aGlzIHByb3ZpZGVyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHN0YXQgLSB0cnVlIGlmIFwiT05MSU5FXCIsIGZhbHNlIGlmIFwiT0ZGTElORVwiLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgIFwiT05MSU5FX1dJVEhfT1RIRVJfQVBQXCJcbiAqIEByZXR1cm4ge09iamVjdH0gLSBzYW1lIHNjaGVtYSBhcyAnb25TdGF0dXMnIGV2ZW50XG4gKiovXG5XU1NvY2lhbFByb3ZpZGVyLnByb3RvdHlwZS5jaGFuZ2VSb3N0ZXIgPSBmdW5jdGlvbihpZCwgc3RhdCkge1xuICB2YXIgbmV3U3RhdHVzLCByZXN1bHQgPSB7XG4gICAgdXNlcklkOiBpZCxcbiAgICBjbGllbnRJZDogaWQsXG4gICAgbGFzdFVwZGF0ZWQ6ICh0aGlzLmNsaWVudHMuaGFzT3duUHJvcGVydHkoaWQpKSA/IHRoaXMuY2xpZW50c1tpZF0ubGFzdFVwZGF0ZWQ6IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCksXG4gICAgbGFzdFNlZW46IChuZXcgRGF0ZSgpKS5nZXRUaW1lKClcbiAgfTtcbiAgaWYgKHN0YXQpIHtcbiAgICBuZXdTdGF0dXMgPSBcIk9OTElORVwiO1xuICB9IGVsc2Uge1xuICAgIG5ld1N0YXR1cyA9IFwiT0ZGTElORVwiO1xuICB9XG4gIHJlc3VsdC5zdGF0dXMgPSBuZXdTdGF0dXM7XG4gIGlmICghdGhpcy5jbGllbnRzLmhhc093blByb3BlcnR5KGlkKSB8fCBcbiAgICAgICh0aGlzLmNsaWVudHNbaWRdICYmIHRoaXMuY2xpZW50c1tpZF0uc3RhdHVzICE9PSBuZXdTdGF0dXMpKSB7XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdvbkNsaWVudFN0YXRlJywgcmVzdWx0KTtcbiAgfVxuXG4gIGlmIChzdGF0KSB7XG4gICAgdGhpcy5jbGllbnRzW2lkXSA9IHJlc3VsdDtcbiAgICBpZiAoIXRoaXMudXNlcnMuaGFzT3duUHJvcGVydHkoaWQpKSB7XG4gICAgICB0aGlzLnVzZXJzW2lkXSA9IHtcbiAgICAgICAgdXNlcklkOiBpZCxcbiAgICAgICAgbmFtZTogaWQsXG4gICAgICAgIGxhc3RVcGRhdGVkOiAobmV3IERhdGUoKSkuZ2V0VGltZSgpXG4gICAgICB9O1xuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdvblVzZXJQcm9maWxlJywgdGhpcy51c2Vyc1tpZF0pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBkZWxldGUgdGhpcy51c2Vyc1tpZF07XG4gICAgZGVsZXRlIHRoaXMuY2xpZW50c1tpZF07XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogSW50ZXJwcmV0IG1lc3NhZ2VzIGZyb20gdGhlIHNlcnZlclxuICogVGhlcmUgYXJlIDMgdHlwZXMgb2YgbWVzc2FnZXNcbiAqIC0gRGlyZWN0ZWQgbWVzc2FnZXMgZnJvbSBmcmllbmRzXG4gKiAtIFN0YXRlIGluZm9ybWF0aW9uIGZyb20gdGhlIHNlcnZlciBvbiBpbml0aWFsaXphdGlvblxuICogLSBSb3N0ZXIgY2hhbmdlIGV2ZW50cyAodXNlcnMgZ28gb25saW5lL29mZmxpbmUpXG4gKlxuICogQG1ldGhvZCBvbk1lc3NhZ2VcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gZmluaXNoTG9naW4gRnVuY3Rpb24gdG8gY2FsbCB1cG9uIHN1Y2Nlc3NmdWwgbG9naW5cbiAqIEBwYXJhbSB7U3RyaW5nfSBtc2cgTWVzc2FnZSBmcm9tIHRoZSBzZXJ2ZXIgKHNlZSBzZXJ2ZXIvcm91dGVyLnB5IGZvciBzY2hlbWEpXG4gKiBAcmV0dXJuIG5vdGhpbmdcbiAqKi9cbldTU29jaWFsUHJvdmlkZXIucHJvdG90eXBlLm9uTWVzc2FnZSA9IGZ1bmN0aW9uKGZpbmlzaExvZ2luLCBtc2cpIHtcbiAgdmFyIGk7XG4gIG1zZyA9IEpTT04ucGFyc2UobXNnLnRleHQpO1xuXG4gIC8vIElmIHN0YXRlIGluZm9ybWF0aW9uIGZyb20gdGhlIHNlcnZlclxuICAvLyBTdG9yZSBteSBvd24gSUQgYW5kIGFsbCBrbm93biB1c2VycyBhdCB0aGUgdGltZVxuICBpZiAobXNnLmNtZCA9PT0gJ3N0YXRlJykge1xuICAgIHRoaXMuaWQgPSBtc2cuaWQ7XG4gICAgZm9yIChpID0gMDsgaSA8IG1zZy5tc2cubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIHRoaXMuY2hhbmdlUm9zdGVyKG1zZy5tc2dbaV0sIHRydWUpO1xuICAgIH1cbiAgICBmaW5pc2hMb2dpbi5maW5pc2godGhpcy5jaGFuZ2VSb3N0ZXIodGhpcy5pZCwgdHJ1ZSkpO1xuICAvLyBJZiBkaXJlY3RlZCBtZXNzYWdlLCBlbWl0IGV2ZW50XG4gIH0gZWxzZSBpZiAobXNnLmNtZCA9PT0gJ21lc3NhZ2UnKSB7XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdvbk1lc3NhZ2UnLCB7XG4gICAgICBmcm9tOiB0aGlzLmNoYW5nZVJvc3Rlcihtc2cuZnJvbSwgdHJ1ZSksXG4gICAgICBtZXNzYWdlOiBtc2cubXNnXG4gICAgfSk7XG4gIC8vIFJvc3RlciBjaGFuZ2UgZXZlbnRcbiAgfSBlbHNlIGlmIChtc2cuY21kID09PSAncm9zdGVyJykge1xuICAgIHRoaXMuY2hhbmdlUm9zdGVyKG1zZy5pZCwgbXNnLm9ubGluZSk7XG4gIC8vIE5vIGlkZWEgd2hhdCB0aGlzIG1lc3NhZ2UgaXMsIGJ1dCBsZXQncyBrZWVwIHRyYWNrIG9mIHdobyBpdCdzIGZyb21cbiAgfSBlbHNlIGlmIChtc2cuZnJvbSkge1xuICAgIHRoaXMuY2hhbmdlUm9zdGVyKG1zZy5mcm9tLCB0cnVlKTtcbiAgfVxufTtcblxuV1NTb2NpYWxQcm92aWRlci5wcm90b3R5cGUuZXJyID0gZnVuY3Rpb24oY29kZSkge1xuICB2YXIgZXJyID0ge1xuICAgIGVycmNvZGU6IGNvZGUsXG4gICAgbWVzc2FnZTogdGhpcy5zb2NpYWwuRVJSQ09ERVtjb2RlXVxuICB9O1xuICByZXR1cm4gZXJyO1xufTtcblxuLyoqIFJFR0lTVEVSIFBST1ZJREVSICoqL1xuaWYgKHR5cGVvZiBmcmVlZG9tICE9PSAndW5kZWZpbmVkJykge1xuICBmcmVlZG9tKCkucHJvdmlkZUFzeW5jaHJvbm91cyhXU1NvY2lhbFByb3ZpZGVyKTtcbn1cblxuaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICBleHBvcnRzLnByb3ZpZGVyID0gV1NTb2NpYWxQcm92aWRlcjtcbiAgZXhwb3J0cy5uYW1lID0gJ3NvY2lhbCc7XG59XG5cbiIsIi8qZ2xvYmFscyBmcmVlZG9tOnRydWUsIGxvY2F0aW9uICovXG4vKmpzbGludCBpbmRlbnQ6Mix3aGl0ZTp0cnVlLG5vZGU6dHJ1ZSxzbG9wcHk6dHJ1ZSAqL1xuLyoqXG4gKiAgSW1wbGVtZW50YXRpb24gb2Ygc3RvcmFnZSB0aGF0IGlzb2xhdGVzIHRoZSBuYW1lc3BhY2VcbiAqICBmb3IgZWFjaCBpbnN0YW50aWF0aW9uIG9mIHRoaXMgcHJvdmlkZXJcbiAqICBCZWhhdmlvcjpcbiAqICAgIGUuZy4gQm90aCBtb2R1bGVzIEEgYW5kIEIgdXNlIHRoaXMgc3RvcmFnZSBwcm92aWRlci5cbiAqICAgIFRoZXkgY2Fubm90IGFjY2VzcyBlYWNoIG90aGVyJ3Mga2V5c1xuICoqL1xuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBJc29sYXRlZFN0b3JhZ2VQcm92aWRlcihkaXNwYXRjaEV2ZW50KSB7XG4gIHZhciBpO1xuICB0aGlzLmNvcmUgPSBmcmVlZG9tLmNvcmUoKTtcbiAgdGhpcy5zdG9yZSA9IGZyZWVkb21bJ2NvcmUuc3RvcmFnZSddKCk7XG4gIHRoaXMubWFnaWMgPSBcIlwiO1xuICB0aGlzLnF1ZXVlID0gW107XG5cbiAgdGhpcy5jb3JlLmdldElkKCkudGhlbihmdW5jdGlvbiAodmFsKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgdGhpcy5tYWdpYyArPSB2YWxbaV0gKyBcIjtcIjtcbiAgICB9XG4gICAgdGhpcy5fZmx1c2hRdWV1ZSgpO1xuICB9LmJpbmQodGhpcykpO1xufVxuXG5Jc29sYXRlZFN0b3JhZ2VQcm92aWRlci5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uKGNvbnRpbnVhdGlvbikge1xuICBpZiAodGhpcy5tYWdpYyA9PT0gXCJcIikge1xuICAgIHRoaXMuX3B1c2hRdWV1ZShcImtleXNcIiwgbnVsbCwgbnVsbCwgY29udGludWF0aW9uKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLnN0b3JlLmtleXMoKS50aGVuKGZ1bmN0aW9uKHZhbCkge1xuICAgIHZhciByZXN1bHQgPSBbXSwgaTtcbiAgICAvL0NoZWNrIHRoYXQgb3VyIG1hZ2ljIGhhcyBiZWVuIGluaXRpYWxpemVkXG4gICAgLy9Pbmx5IHJldHVybiBrZXlzIGluIG15IHBhcnRpdGlvblxuICAgIGZvciAoaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIGlmICh0aGlzLl9pc015S2V5KHZhbFtpXSkpIHtcbiAgICAgICAgcmVzdWx0LnB1c2godGhpcy5fZnJvbVN0b3JlZEtleSh2YWxbaV0pKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29udGludWF0aW9uKHJlc3VsdCk7XG4gIH0uYmluZCh0aGlzKSk7XG59O1xuXG5Jc29sYXRlZFN0b3JhZ2VQcm92aWRlci5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oa2V5LCBjb250aW51YXRpb24pIHtcbiAgaWYgKHRoaXMubWFnaWMgPT09IFwiXCIpIHtcbiAgICB0aGlzLl9wdXNoUXVldWUoXCJnZXRcIiwga2V5LCBudWxsLCBjb250aW51YXRpb24pO1xuICAgIHJldHVybjtcbiAgfSBcbiAgXG4gIHZhciBwcm9taXNlID0gdGhpcy5zdG9yZS5nZXQodGhpcy5fdG9TdG9yZWRLZXkoa2V5KSk7XG4gIHByb21pc2UudGhlbihjb250aW51YXRpb24pO1xufTtcblxuSXNvbGF0ZWRTdG9yYWdlUHJvdmlkZXIucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKGtleSwgdmFsdWUsIGNvbnRpbnVhdGlvbikge1xuICBpZiAodGhpcy5tYWdpYyA9PT0gXCJcIikge1xuICAgIHRoaXMuX3B1c2hRdWV1ZShcInNldFwiLCBrZXksIHZhbHVlLCBjb250aW51YXRpb24pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBwcm9taXNlID0gdGhpcy5zdG9yZS5zZXQodGhpcy5fdG9TdG9yZWRLZXkoa2V5KSwgdmFsdWUpO1xuICBwcm9taXNlLnRoZW4oY29udGludWF0aW9uKTtcbn07XG5cbklzb2xhdGVkU3RvcmFnZVByb3ZpZGVyLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbihrZXksIGNvbnRpbnVhdGlvbikge1xuICBpZiAodGhpcy5tYWdpYyA9PT0gXCJcIikge1xuICAgIHRoaXMuX3B1c2hRdWV1ZShcInJlbW92ZVwiLCBrZXksIG51bGwsIGNvbnRpbnVhdGlvbik7XG4gICAgcmV0dXJuO1xuICB9XG4gIFxuICB2YXIgcHJvbWlzZSA9IHRoaXMuc3RvcmUucmVtb3ZlKHRoaXMuX3RvU3RvcmVkS2V5KGtleSkpO1xuICBwcm9taXNlLnRoZW4oY29udGludWF0aW9uKTtcbn07XG5cbklzb2xhdGVkU3RvcmFnZVByb3ZpZGVyLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKGNvbnRpbnVhdGlvbikge1xuICB2YXIgcHJvbWlzZSA9IHRoaXMuc3RvcmUua2V5cygpLCBpO1xuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24oa2V5cykge1xuICAgIC8vT25seSByZW1vdmUga2V5cyBpbiBteSBwYXJ0aXRpb25cbiAgICBmb3IgKGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgaWYgKHRoaXMuX2lzTXlLZXkoa2V5c1tpXSkpIHtcbiAgICAgICAgdGhpcy5zdG9yZS5yZW1vdmUoa2V5c1tpXSk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnRpbnVhdGlvbigpO1xuICB9LmJpbmQodGhpcykpO1xufTtcblxuLyoqIElOVEVSTkFMIE1FVEhPRFMgKiovXG4vL0luc2VydCBjYWxsIGludG8gcXVldWVcbklzb2xhdGVkU3RvcmFnZVByb3ZpZGVyLnByb3RvdHlwZS5fcHVzaFF1ZXVlID0gZnVuY3Rpb24obWV0aG9kLCBrZXksIHZhbHVlLCBjb250aW51YXRpb24pIHtcbiAgdGhpcy5xdWV1ZS5wdXNoKHtcbiAgICBjbWQ6IG1ldGhvZCxcbiAgICBrZXk6IGtleSxcbiAgICB2YWx1ZTogdmFsdWUsXG4gICAgY29udDogY29udGludWF0aW9uXG4gIH0pO1xufTtcblxuLy9GbHVzaCBjb21tYW5kcyBpbiBxdWV1ZVxuSXNvbGF0ZWRTdG9yYWdlUHJvdmlkZXIucHJvdG90eXBlLl9mbHVzaFF1ZXVlID0gZnVuY3Rpb24oKSB7XG4gIHZhciBpLCBlbHQ7XG4gIGZvciAoaSA9IDA7IGkgPCB0aGlzLnF1ZXVlLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgZWx0ID0gdGhpcy5xdWV1ZVtpXTtcbiAgICBpZiAoZWx0LmNtZCA9PT0gXCJrZXlzXCIpIHtcbiAgICAgIHRoaXMua2V5cyhlbHQuY29udCk7XG4gICAgfSBlbHNlIGlmIChlbHQuY21kID09PSBcImdldFwiKSB7XG4gICAgICB0aGlzLmdldChlbHQua2V5LCBlbHQuY29udCk7XG4gICAgfSBlbHNlIGlmIChlbHQuY21kID09PSBcInNldFwiKSB7XG4gICAgICB0aGlzLnNldChlbHQua2V5LCBlbHQudmFsdWUsIGVsdC5jb250KTtcbiAgICB9IGVsc2UgaWYgKGVsdC5jbWQgPT09IFwicmVtb3ZlXCIpIHtcbiAgICAgIHRoaXMucmVtb3ZlKGVsdC5rZXksIGVsdC5jb250KTtcbiAgICB9IGVsc2UgaWYgKGVsdC5jbWQgPT09IFwiY2xlYXJcIikge1xuICAgICAgdGhpcy5jbGVhcihlbHQuY29udCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJJc29sYXRlZCBTdG9yYWdlOiB1bnJlY29nbml6ZWQgY29tbWFuZCBcIiArIEpTT04uc3RyaW5naWZ5KGVsdCkpO1xuICAgIH1cbiAgfVxuXG4gIHRoaXMucXVldWUgPSBbXTtcbn07XG5cbi8vIEZyb20gY2FsbGVyJ3Mga2V5ID0+IHN0b3JlZCBrZXlcbi8vIGUuZy4gJ2tleUEnID0+ICdwYXJ0aXRpb24xK2tleUEnXG5Jc29sYXRlZFN0b3JhZ2VQcm92aWRlci5wcm90b3R5cGUuX3RvU3RvcmVkS2V5ID0gZnVuY3Rpb24oa2V5KSB7XG4gIHJldHVybiAodGhpcy5tYWdpYyArIGtleSk7XG59O1xuXG4vLyBGcm9tIHN0b3JlZCBrZXkgPT4gY2FsbGVyJ3Mga2V5XG4vLyBlLmcuICdwYXJ0aXRpb24xK2tleUEnID0+ICdrZXlBJ1xuSXNvbGF0ZWRTdG9yYWdlUHJvdmlkZXIucHJvdG90eXBlLl9mcm9tU3RvcmVkS2V5ID0gZnVuY3Rpb24oa2V5KSB7XG4gIHJldHVybiBrZXkuc3Vic3RyKHRoaXMubWFnaWMubGVuZ3RoKTtcbn07XG5cbi8vIENoZWNrIGlmIHRoaXMgc3RvcmVkIGtleSBpcyBpbiBteSBwYXJ0aXRpb25cbklzb2xhdGVkU3RvcmFnZVByb3ZpZGVyLnByb3RvdHlwZS5faXNNeUtleSA9IGZ1bmN0aW9uKHN0b3JlZEtleSkge1xuICByZXR1cm4gKHN0b3JlZEtleS5zdWJzdHIoMCwgdGhpcy5tYWdpYy5sZW5ndGgpID09PSB0aGlzLm1hZ2ljKTtcbn07XG5cbi8qKiBSRUdJU1RFUiBQUk9WSURFUiAqKi9cbmlmICh0eXBlb2YgZnJlZWRvbSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgZnJlZWRvbSgpLnByb3ZpZGVBc3luY2hyb25vdXMoSXNvbGF0ZWRTdG9yYWdlUHJvdmlkZXIpO1xufVxuXG5pZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gIGV4cG9ydHMucHJvdmlkZXIgPSBJc29sYXRlZFN0b3JhZ2VQcm92aWRlcjtcbiAgZXhwb3J0cy5uYW1lID0gJ3N0b3JhZ2UnO1xufVxuIiwiLypqc2xpbnQgc2xvcHB5OnRydWUqL1xuLypnbG9iYWxzIGZyZWVkb20sZXhwb3J0cyovXG4vKipcbiAqIEltcGxlbWVudGF0aW9uIG9mIHRoZSBTdG9yYWdlIHByb3ZpZGVyIHRoYXQgdGhpbi13cmFwcyBmcmVlZG9tWydjb3JlLnN0b3JhZ2UnXSgpO1xuICogQmVoYXZpb3I6XG4gKiAtIE5hbWVzcGFjZSBpcyBzaGFyZWQgd2l0aCBhbGwgaW5zdGFuY2VzIG9mIHRoaXMgcHJvdmlkZXIuXG4gKiAgIGUuZy4gQm90aCBtb2R1bGVzIEEgYW5kIEIgdXNlIHRoaXMgc3RvcmFnZSBwcm92aWRlci4gVGhleSdkIGJlIGFibGUgdG8gYWNjZXNzIHRoZSBzYW1lIGtleXNcbiAqKi9cblxuZnVuY3Rpb24gU2hhcmVkU3RvcmFnZVByb3ZpZGVyKCkge1xuICB0aGlzLnN0b3JlID0gZnJlZWRvbVsnY29yZS5zdG9yYWdlJ10oKTtcbiAgLy9jb25zb2xlLmxvZyhcIlNoYXJlZCBTdG9yYWdlIFByb3ZpZGVyLCBydW5uaW5nIGluIHdvcmtlciBcIiArIHNlbGYubG9jYXRpb24uaHJlZik7XG59XG5cblNoYXJlZFN0b3JhZ2VQcm92aWRlci5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uIChjb250aW51YXRpb24pIHtcbiAgdGhpcy5zdG9yZS5rZXlzKCkudGhlbihjb250aW51YXRpb24pO1xufTtcblxuU2hhcmVkU3RvcmFnZVByb3ZpZGVyLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoa2V5LCBjb250aW51YXRpb24pIHtcbiAgdGhpcy5zdG9yZS5nZXQoa2V5KS50aGVuKGNvbnRpbnVhdGlvbik7XG59O1xuXG5TaGFyZWRTdG9yYWdlUHJvdmlkZXIucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlLCBjb250aW51YXRpb24pIHtcbiAgdGhpcy5zdG9yZS5zZXQoa2V5LCB2YWx1ZSkudGhlbihjb250aW51YXRpb24pO1xufTtcblxuU2hhcmVkU3RvcmFnZVByb3ZpZGVyLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoa2V5LCBjb250aW51YXRpb24pIHtcbiAgdGhpcy5zdG9yZS5yZW1vdmUoa2V5KS50aGVuKGNvbnRpbnVhdGlvbik7XG59O1xuXG5TaGFyZWRTdG9yYWdlUHJvdmlkZXIucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKGNvbnRpbnVhdGlvbikge1xuICB0aGlzLnN0b3JlLmNsZWFyKCkudGhlbihjb250aW51YXRpb24pO1xufTtcblxuLyoqIFJFR0lTVEVSIFBST1ZJREVSICoqL1xuaWYgKHR5cGVvZiBmcmVlZG9tICE9PSAndW5kZWZpbmVkJykge1xuICBmcmVlZG9tKCkucHJvdmlkZUFzeW5jaHJvbm91cyhTaGFyZWRTdG9yYWdlUHJvdmlkZXIpO1xufVxuXG5pZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gIGV4cG9ydHMucHJvdmlkZXIgPSBTaGFyZWRTdG9yYWdlUHJvdmlkZXI7XG4gIGV4cG9ydHMubmFtZSA9ICdzdG9yYWdlJztcbn1cbiIsIi8qanNsaW50IHNsb3BweTp0cnVlKi9cbi8qZ2xvYmFscyBmcmVlZG9tLGNvbnNvbGUsRmlsZVJlYWRlclN5bmMsZXhwb3J0cyovXG4vKlxuICogUGVlciAyIFBlZXIgdHJhbnNwb3J0IHByb3ZpZGVyLlxuICpcbiAqL1xudmFyIFdlYlJUQ1RyYW5zcG9ydFByb3ZpZGVyID0gZnVuY3Rpb24gKGRpc3BhdGNoRXZlbnQpIHtcbiAgdGhpcy5kaXNwYXRjaEV2ZW50ID0gZGlzcGF0Y2hFdmVudDtcbiAgdGhpcy5uYW1lID0gbnVsbDtcbiAgdGhpcy5fc2V0dXAgPSBmYWxzZTtcbiAgdGhpcy5wYyA9IGZyZWVkb21bJ2NvcmUucGVlcmNvbm5lY3Rpb24nXSgpO1xuICB0aGlzLnBjLm9uKCdvblJlY2VpdmVkJywgdGhpcy5vbkRhdGEuYmluZCh0aGlzKSk7XG4gIHRoaXMucGMub24oJ29uQ2xvc2UnLCB0aGlzLm9uQ2xvc2UuYmluZCh0aGlzKSk7XG4gIHRoaXMucGMub24oJ29uT3BlbkRhdGFDaGFubmVsJywgdGhpcy5vbk5ld1RhZy5iaW5kKHRoaXMpKTtcbiAgdGhpcy5fdGFncyA9IFtdO1xuICAvLyBNYXBzIHRhZ3MgdG8gYm9vbGVhbnMuIFRoZSBib29sZWFuIGNvcnJlc3BvbmRpbmcgdG8gYSBnaXZlbiB0YWdcbiAgLy8gaXMgdHJ1ZSBpZiB0aGlzIFdlYlJUQ1RyYW5zcG9ydFByb3ZpZGVyIGlzIGN1cnJlbnRseSBzZW5kaW5nIG91dFxuICAvLyBjaHVua3Mgb2YgYSBtZXNzYWdlIGZvciB0aGF0IHRhZy5cbiAgdGhpcy5fc2VuZGluZyA9IHt9O1xuICAvLyBNYXBzIHRhZ3MgdG8gbGlzdHMgb2Ygd2hvbGUgb3V0Z29pbmcgbWVzc2FnZXMgdGhhdCBhcmUgd2FpdGluZyB0b1xuICAvLyBiZSBzZW50IG92ZXIgdGhlIHdpcmUuIE1lc3NhZ2VzIG11c3QgYmUgc2VudCBvbmUgYXQgYSB0aW1lIHRvXG4gIC8vIHByZXZlbnQgdGhlIGludGVybGVhdmluZyBvZiBjaHVua3MgZnJvbSB0d28gb3IgbWVzc2FnZXMuXG4gIHRoaXMuX3F1ZXVlZE1lc3NhZ2VzID0ge307XG4gIC8vIEVudHJpZXMgaW4gdGhpcyBkaWN0aW9uYXJ5IG1hcCB0YWdzIHRvIGFycmF5cyBjb250YWluaW5nIGNodW5rc1xuICAvLyBvZiBpbmNvbWluZyBtZXNzYWdlcy4gSWYgdGhlcmUgaXMgbm8gZW50cnkgZm9yIGEgdGFnIGluIHRoZVxuICAvLyBkaWN0aW9uYXJ5LCB0aGVuIHdlIGhhdmUgbm90IHJlY2VpdmVkIHRoZSBmaXJzdCBjaHVuayBvZiB0aGUgbmV4dFxuICAvLyBtZXNzYWdlLlxuICB0aGlzLl9jaHVua3MgPSB7fTtcbiAgLy8gTWVzc2FnZXMgbWF5IGJlIGxpbWl0ZWQgdG8gYSAxNktCIGxlbmd0aFxuICAvLyBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9kcmFmdC1pZXRmLXJ0Y3dlYi1kYXRhLWNoYW5uZWwtMDcjc2VjdGlvbi02LjZcbiAgdGhpcy5fY2h1bmtTaXplID0gMTUwMDA7XG4gIC8vIFRoZSBtYXhpbXVtIGFtb3VudCBvZiBieXRlcyB3ZSBzaG91bGQgYWxsb3cgdG8gZ2V0IHF1ZXVlZCB1cCBpblxuICAvLyBwZWVyY29ubmVjdGlvbiwgYW55IG1vcmUgYW5kIHdlIHN0YXJ0IHF1ZXVlaW5nIG91cnNlbGYuXG4gIHRoaXMuX3BjUXVldWVMaW1pdCA9IDEwMjQgKiAyNTA7XG4gIC8vIEphdmFzY3JpcHQgaGFzIHRyb3VibGUgcmVwcmVzZW50aW5nIGludGVnZXJzIGxhcmdlciB0aGFuIDJeNTMgZXhhY3RseVxuICB0aGlzLl9tYXhNZXNzYWdlU2l6ZSA9IE1hdGgucG93KDIsIDUzKTtcbn07XG5cbldlYlJUQ1RyYW5zcG9ydFByb3ZpZGVyLnN0dW5fc2VydmVycyA9IFtcbiAgXCJzdHVuOnN0dW4ubC5nb29nbGUuY29tOjE5MzAyXCIsXG4gIFwic3R1bjpzdHVuMS5sLmdvb2dsZS5jb206MTkzMDJcIixcbiAgXCJzdHVuOnN0dW4yLmwuZ29vZ2xlLmNvbToxOTMwMlwiLFxuICBcInN0dW46c3R1bjMubC5nb29nbGUuY29tOjE5MzAyXCIsXG4gIFwic3R1bjpzdHVuNC5sLmdvb2dsZS5jb206MTkzMDJcIlxuXTtcblxuLy8gVGhlIGFyZ3VtZW50IHxzaWduYWxsaW5nQ2hhbm5lbElkfCBpcyBhIGZyZWVkb20gY29tbXVuaWNhdGlvbiBjaGFubmVsIGlkIHRvXG4vLyB1c2UgdG8gb3BlbiBhIHBlZXIgY29ubmVjdGlvbi4gXG5XZWJSVENUcmFuc3BvcnRQcm92aWRlci5wcm90b3R5cGUuc2V0dXAgPSBmdW5jdGlvbihuYW1lLCBzaWduYWxsaW5nQ2hhbm5lbElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWF0aW9uKSB7XG4gIHRoaXMubmFtZSA9IG5hbWU7XG4gIHZhciBwcm9taXNlID0gdGhpcy5wYy5zZXR1cChzaWduYWxsaW5nQ2hhbm5lbElkLCBuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgV2ViUlRDVHJhbnNwb3J0UHJvdmlkZXIuc3R1bl9zZXJ2ZXJzLCBmYWxzZSk7XG4gIHRoaXMuX3NldHVwID0gdHJ1ZTtcbiAgcHJvbWlzZS50aGVuKGNvbnRpbnVhdGlvbikuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3Igc2V0dGluZyB1cCBwZWVyY29ubmVjdGlvbicpO1xuICAgIFxuICAgIGNvbnRpbnVhdGlvbih1bmRlZmluZWQsIHtcbiAgICAgIFwiZXJyY29kZVwiOiBcIkZBSUxFRFwiLFxuICAgICAgXCJtZXNzYWdlXCI6ICdFcnJvciBzZXR0aW5nIHVwIHBlZXJjb25uZWN0aW9uJ1xuICAgIH0pO1xuICB9KTtcbn07XG5cbldlYlJUQ1RyYW5zcG9ydFByb3ZpZGVyLnByb3RvdHlwZS5zZW5kID0gZnVuY3Rpb24odGFnLCBkYXRhLCBjb250aW51YXRpb24pIHtcbiAgLy8gY29uc29sZS5sb2coXCJUcmFuc3BvcnRQcm92aWRlci5zZW5kLlwiICsgdGhpcy5uYW1lKTtcbiAgaWYoIXRoaXMuX3NldHVwKSB7XG4gICAgY29udGludWF0aW9uKHVuZGVmaW5lZCwge1xuICAgICAgXCJlcnJjb2RlXCI6IFwiTk9UUkVBRFlcIixcbiAgICAgIFwibWVzc2FnZVwiOiBcInNlbmQgY2FsbGVkIGJlZm9yZSBzZXR1cFwiXG4gICAgfSk7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwic2VuZCBjYWxsZWQgYmVmb3JlIHNldHVwIGluIFdlYlJUQ1RyYW5zcG9ydFByb3ZpZGVyXCIpO1xuICB9XG4gIGlmICh0aGlzLl90YWdzLmluZGV4T2YodGFnKSA+PSAwKSB7XG4gICAgaWYgKHRoaXMuX3NlbmRpbmdbdGFnXSkge1xuICAgICAgLy8gQSBtZXNzYWdlIGlzIGN1cnJlbnRseSBiZWluZyBzZW50LiBRdWV1ZSB0aGlzIG1lc3NhZ2UgdG9cbiAgICAgIC8vIHByZXZlbnQgbWVzc2FnZSBpbnRlcmxlYXZpbmcuXG4gICAgICB0aGlzLl9xdWV1ZWRNZXNzYWdlc1t0YWddLnB1c2goe3RhZzogdGFnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51YXRpb246IGNvbnRpbnVhdGlvbn0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgYnVmZmVycyA9IHRoaXMuX2NodW5rKGRhdGEpO1xuICAgIHRoaXMuX3NlbmRpbmdbdGFnXSA9IHRydWU7XG4gICAgdGhpcy5fd2FpdFNlbmQodGFnLCBidWZmZXJzKS50aGVuKGZ1bmN0aW9uIGFmdGVyU2VuZGluZygpIHtcbiAgICAgIHRoaXMuX3NlbmRpbmdbdGFnXSA9IGZhbHNlO1xuICAgICAgaWYgKCh0eXBlb2YgdGhpcy5fcXVldWVkTWVzc2FnZXNbdGFnXSAhPT0gXCJ1bmRlZmluZWRcIikgJiZcbiAgICAgICAgICB0aGlzLl9xdWV1ZWRNZXNzYWdlc1t0YWddLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIG5leHQgPSB0aGlzLl9xdWV1ZWRNZXNzYWdlc1t0YWddLnNoaWZ0KCk7XG4gICAgICAgIHRoaXMuc2VuZChuZXh0LnRhZywgbmV4dC5kYXRhLCBuZXh0LmNvbnRpbnVhdGlvbik7XG4gICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKS50aGVuKGNvbnRpbnVhdGlvbik7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5wYy5vcGVuRGF0YUNoYW5uZWwodGFnKS50aGVuKGZ1bmN0aW9uKCl7XG4gICAgICB0aGlzLl90YWdzLnB1c2godGFnKTtcbiAgICAgIHRoaXMuX3NlbmRpbmdbdGFnXSA9IGZhbHNlO1xuICAgICAgdGhpcy5fcXVldWVkTWVzc2FnZXNbdGFnXSA9IFtdO1xuXG4gICAgICB0aGlzLnNlbmQodGFnLCBkYXRhLCBjb250aW51YXRpb24pO1xuICAgIH0uYmluZCh0aGlzKSk7XG4gIH1cbn07XG5cblxuXG4vKipcbiAqIENodW5rIGEgc2luZ2xlIEFycmF5QnVmZmVyIGludG8gbXVsdGlwbGUgQXJyYXlCdWZmZXJzIG9mXG4gKiB0aGlzLl9jaHVua1NpemUgbGVuZ3RoLlxuICogQHBhcmFtIHtBcnJheUJ1ZmZlcn0gZGF0YSAtIERhdGEgdG8gY2h1bmsuXG4gKiBAcmV0dXJuIHtBcnJheX0gLSBBcnJheSBvZiBBcnJheUJ1ZmZlciBvYmplY3RzIHN1Y2ggdGhhdCB0aGVcbiAqIGNvbmNhdGVuYXRpb24gb2YgYWxsIGFycmF5IGJ1ZmZlciBvYmplY3RzIGVxdWFscyB0aGUgZGF0YVxuICogcGFyYW1ldGVyLlxuICovXG5XZWJSVENUcmFuc3BvcnRQcm92aWRlci5wcm90b3R5cGUuX2NodW5rID0gZnVuY3Rpb24oZGF0YSkge1xuICAvLyBUaGUgZmlyc3QgOCBieXRlcyBvZiB0aGUgZmlyc3QgY2h1bmsgb2YgYSBtZXNzYWdlIGVuY29kZXMgdGhlXG4gIC8vIG51bWJlciBvZiBieXRlcyBpbiB0aGUgbWVzc2FnZS5cbiAgdmFyIGRhdGFWaWV3ID0gbmV3IFVpbnQ4QXJyYXkoZGF0YSk7XG4gIHZhciBidWZmZXJzID0gW107XG4gIHZhciBzaXplID0gZGF0YS5ieXRlTGVuZ3RoO1xuICB2YXIgbG93ZXJCb3VuZCA9IDA7IC8vIGV4Y2x1c2l2ZSByYW5nZVxuICB2YXIgdXBwZXJCb3VuZDtcblxuICAvLyBsb3dlckJvdW5kIHBvaW50cyB0byB0aGUgYnl0ZSBhZnRlciB0aGUgbGFzdCBieXRlIHRvIGJlIGNodW5rZWRcbiAgLy8gZnJvbSB0aGUgb3JpZ2luYWwgZGF0YSBidWZmZXIuICBJdCBzaG91bGQgYmUgdGhlIGNhc2UgdGhhdFxuICAvLyBsb3dlckJvdW5kIDwgdXBwZXJCb3VuZC5cbiAgLy8gQnVmZmVyOiBbLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXVxuICAvLyAgICAgICAgICBeICAgICAgICAgICAgICBeICAgICAgICAgICAgICBeICBcbiAgLy8gICAgICAgICAgbEJfMCAgICAgICAgICAgdUJfMC9sQl8xICAgICAgdUJfMS9sQl8yIC4uLiAgICBedUJfblxuICBcbiAgdmFyIHNpemVCdWZmZXIgPSB0aGlzLl9zaXplVG9CdWZmZXIoc2l6ZSk7XG4gIHZhciBmaXJzdEJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KE1hdGgubWluKHRoaXMuX2NodW5rU2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemUgKyBzaXplQnVmZmVyLmJ5dGVMZW5ndGgpKTtcblxuICBmaXJzdEJ1ZmZlci5zZXQoc2l6ZUJ1ZmZlciwgMCk7XG4gIHVwcGVyQm91bmQgPSBNYXRoLm1pbih0aGlzLl9jaHVua1NpemUgLSBzaXplQnVmZmVyLmJ5dGVMZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJzdEJ1ZmZlci5ieXRlTGVuZ3RoKTtcbiAgZmlyc3RCdWZmZXIuc2V0KGRhdGFWaWV3LnN1YmFycmF5KDAsIHVwcGVyQm91bmQpLCBzaXplQnVmZmVyLmJ5dGVMZW5ndGgpO1xuICBidWZmZXJzLnB1c2goZmlyc3RCdWZmZXIuYnVmZmVyKTtcbiAgbG93ZXJCb3VuZCA9IHVwcGVyQm91bmQ7XG5cbiAgd2hpbGUgKGxvd2VyQm91bmQgPCBzaXplKSB7XG4gICAgdXBwZXJCb3VuZCA9IGxvd2VyQm91bmQgKyB0aGlzLl9jaHVua1NpemU7XG4gICAgYnVmZmVycy5wdXNoKGRhdGEuc2xpY2UobG93ZXJCb3VuZCwgdXBwZXJCb3VuZCkpO1xuICAgIGxvd2VyQm91bmQgPSB1cHBlckJvdW5kO1xuICB9XG5cbiAgcmV0dXJuIGJ1ZmZlcnM7XG59O1xuXG5XZWJSVENUcmFuc3BvcnRQcm92aWRlci5wcm90b3R5cGUuX3dhaXRTZW5kID0gZnVuY3Rpb24odGFnLCBidWZmZXJzKSB7XG4gIHZhciBidWZmZXJCb3VuZCA9IDA7IC8vIHVwcGVyIGJvdW5kIG9uIHRoZSAjIG9mIGJ5dGVzIGJ1ZmZlcmVkXG5cbiAgdmFyIHNlbmRCdWZmZXJzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHByb21pc2VzID0gW107XG4gICAgd2hpbGUoYnVmZmVyQm91bmQgKyB0aGlzLl9jaHVua1NpemUgPD0gdGhpcy5fcGNRdWV1ZUxpbWl0ICYmXG4gICAgICAgICAgYnVmZmVycy5sZW5ndGggPiAwKSB7XG4gICAgICB2YXIgbmV4dEJ1ZmZlciA9IGJ1ZmZlcnMuc2hpZnQoKTtcbiAgICAgIHByb21pc2VzLnB1c2godGhpcy5wYy5zZW5kKHtcImNoYW5uZWxMYWJlbFwiOiB0YWcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJidWZmZXJcIjogbmV4dEJ1ZmZlcn0pKTtcbiAgICAgIGJ1ZmZlckJvdW5kICs9IG5leHRCdWZmZXIuYnl0ZUxlbmd0aDtcbiAgICB9XG5cbiAgICB2YXIgYWxsU2VuZHMgPSBQcm9taXNlLmFsbChwcm9taXNlcyk7XG4gICAgaWYgKGJ1ZmZlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gYWxsU2VuZHM7XG4gICAgfVxuICAgIHJldHVybiBhbGxTZW5kcy50aGVuKGNoZWNrQnVmZmVyZWRBbW91bnQpO1xuICB9LmJpbmQodGhpcyk7XG5cbiAgdmFyIGNoZWNrQnVmZmVyZWRBbW91bnQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5wYy5nZXRCdWZmZXJlZEFtb3VudCh0YWcpLnRoZW4oZnVuY3Rpb24oYnVmZmVyZWRBbW91bnQpIHtcbiAgICAgIGJ1ZmZlckJvdW5kID0gYnVmZmVyZWRBbW91bnQ7XG4gICAgICBpZiAoYnVmZmVyZWRBbW91bnQgKyB0aGlzLl9jaHVua1NpemUgPiB0aGlzLl9wY1F1ZXVlTGltaXQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmVzb2x2ZShjaGVja0J1ZmZlcmVkQW1vdW50KCkpO1xuICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHNlbmRCdWZmZXJzKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0uYmluZCh0aGlzKTtcbiAgLy8gQ2hlY2sgZmlyc3QsIGluIGNhc2UgdGhlcmUgaXMgZGF0YSBpbiB0aGUgcGMgYnVmZmVyIGZyb20gYW5vdGhlciBtZXNzYWdlLlxuICByZXR1cm4gY2hlY2tCdWZmZXJlZEFtb3VudCgpO1xufTtcblxuXG5XZWJSVENUcmFuc3BvcnRQcm92aWRlci5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbihjb250aW51YXRpb24pIHtcbiAgLy8gVE9ETzogQ2xvc2UgZGF0YSBjaGFubmVscy5cbiAgdGhpcy5fdGFncyA9IFtdO1xuICB0aGlzLl9zZW5kaW5nID0ge307XG4gIHRoaXMuX3F1ZXVlZE1lc3NhZ2VzID0ge307XG4gIHRoaXMuX2NodW5rcyA9IHt9O1xuICB0aGlzLnBjLmNsb3NlKCkudGhlbihjb250aW51YXRpb24pO1xufTtcblxuLy8gQ2FsbGVkIHdoZW4gdGhlIHBlZXItY29ubmVjdGlvbiByZWNlaXZlcyBkYXRhLCBpdCB0aGVuIHBhc3NlcyBpdCBoZXJlLlxuV2ViUlRDVHJhbnNwb3J0UHJvdmlkZXIucHJvdG90eXBlLm9uRGF0YSA9IGZ1bmN0aW9uKG1zZykge1xuICAvL2NvbnNvbGUubG9nKFwiVHJhbnNwb3J0UHJvdmlkZXIucHJvdG90eXBlLm1lc3NhZ2U6IEdvdCBNZXNzYWdlOlwiICsgSlNPTi5zdHJpbmdpZnkobXNnKSk7XG4gIGlmIChtc2cuYnVmZmVyKSB7XG4gICAgdGhpcy5faGFuZGxlRGF0YShtc2cuY2hhbm5lbExhYmVsLCBtc2cuYnVmZmVyKTtcbiAgfSBlbHNlIGlmIChtc2cuYmluYXJ5KSB7XG4gICAgaWYgKHR5cGVvZiBGaWxlUmVhZGVyU3luYyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHZhciBmaWxlUmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgIGZpbGVSZWFkZXIub25sb2FkID0gKGZ1bmN0aW9uKGhhbmRsZURhdGEsIGNoYW5uZWxMYWJlbCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oZSkge1xuICAgICAgICAgIGhhbmRsZURhdGEoY2hhbm5lbExhYmVsLCBlLnRhcmdldC5yZXN1bHQpO1xuICAgICAgICB9O1xuICAgICAgfSh0aGlzLl9oYW5kbGVEYXRhLmJpbmQodGhpcyksIG1zZy5jaGFubmVsTGFiZWwpKTtcbiAgICAgIGZpbGVSZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIobXNnLmJpbmFyeSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBmaWxlUmVhZGVyU3luYyA9IG5ldyBGaWxlUmVhZGVyU3luYygpO1xuICAgICAgdmFyIGFycmF5QnVmZmVyID0gZmlsZVJlYWRlclN5bmMucmVhZEFzQXJyYXlCdWZmZXIobXNnLmJpbmFyeSk7XG4gICAgICB0aGlzLl9oYW5kbGVEYXRhKG1zZy5jaGFubmVsTGFiZWwsIGFycmF5QnVmZmVyKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAobXNnLnRleHQpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiU3RyaW5ncyBub3Qgc3VwcG9ydGVkLlwiKTtcbiAgfSAgZWxzZSB7XG4gICAgY29uc29sZS5lcnJvcignbWVzc2FnZSBjYWxsZWQgd2l0aG91dCBhIHZhbGlkIGRhdGEgZmllbGQnKTtcbiAgfVxufTtcblxuV2ViUlRDVHJhbnNwb3J0UHJvdmlkZXIucHJvdG90eXBlLl9oYW5kbGVEYXRhID0gZnVuY3Rpb24odGFnLCBidWZmZXIpIHtcbiAgdmFyIGN1cnJlbnRUYWc7XG4gIGlmICh0YWcgaW4gdGhpcy5fY2h1bmtzKSB7XG4gICAgY3VycmVudFRhZyA9IHRoaXMuX2NodW5rc1t0YWddO1xuICAgIGN1cnJlbnRUYWcuYnVmZmVycy5wdXNoKGJ1ZmZlcik7XG4gICAgY3VycmVudFRhZy5jdXJyZW50Qnl0ZUNvdW50ICs9IGJ1ZmZlci5ieXRlTGVuZ3RoO1xuICB9IGVsc2Uge1xuICAgIGN1cnJlbnRUYWcgPSB7YnVmZmVyczogW10sXG4gICAgICAgICAgICAgICAgICBjdXJyZW50Qnl0ZUNvdW50OiAwLFxuICAgICAgICAgICAgICAgICAgdG90YWxCeXRlQ291bnQ6IDB9O1xuICAgIHRoaXMuX2NodW5rc1t0YWddID0gY3VycmVudFRhZztcbiAgICB2YXIgc2l6ZSA9IHRoaXMuX2J1ZmZlclRvU2l6ZShidWZmZXIuc2xpY2UoMCwgOCkpO1xuICAgIGlmIChzaXplID4gdGhpcy5fbWF4TWVzc2FnZVNpemUpIHtcbiAgICAgIGNvbnNvbGUud2FybihcIkluY29tbWluZyBtZXNzYWdlIGlzIGxhcmdlciB0aGFuIG1heGltdW0gbWVzc2FnZSBzaXplXCIpO1xuICAgIH1cbiAgICBjdXJyZW50VGFnLnRvdGFsQnl0ZUNvdW50ID0gc2l6ZTtcbiAgICBjdXJyZW50VGFnLmJ1ZmZlcnMucHVzaChidWZmZXIuc2xpY2UoOCkpO1xuICAgIGN1cnJlbnRUYWcuY3VycmVudEJ5dGVDb3VudCArPSBidWZmZXIuYnl0ZUxlbmd0aCAtIDg7XG4gIH1cblxuICBpZihjdXJyZW50VGFnLmN1cnJlbnRCeXRlQ291bnQgPT09IGN1cnJlbnRUYWcudG90YWxCeXRlQ291bnQpIHtcbiAgICB2YXIgcmV0dXJuQnVmZmVyID0gdGhpcy5fYXNzZW1ibGVCdWZmZXJzKHRhZyk7XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdvbkRhdGEnLCB7XG4gICAgICBcInRhZ1wiOiB0YWcsIFxuICAgICAgXCJkYXRhXCI6IHJldHVybkJ1ZmZlclxuICAgIH0pO1xuICAgIGRlbGV0ZSB0aGlzLl9jaHVua3NbdGFnXTtcbiAgfSBlbHNlIGlmKGN1cnJlbnRUYWcuY3VycmVudEJ5dGVDb3VudCA+IGN1cnJlbnRUYWcudG90YWxCeXRlQ291bnQpIHtcbiAgICBjb25zb2xlLndhcm4oXCJSZWNlaXZlZCBtb3JlIGJ5dGVzIGZvciBtZXNzYWdlIHRoYW4gZXhwZWN0ZWQsIHNvbWV0aGluZyBoYXMgZ29uZSBzZXJpb3VzbHkgd3JvbmdcIik7XG4gICAgZGVsZXRlIHRoaXMuX2NodW5rc1t0YWddO1xuICB9XG4gIFxufTtcblxuV2ViUlRDVHJhbnNwb3J0UHJvdmlkZXIucHJvdG90eXBlLm9uTmV3VGFnID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgdGhpcy5fdGFncy5wdXNoKGV2ZW50LmNoYW5uZWxJZCk7XG59O1xuXG5XZWJSVENUcmFuc3BvcnRQcm92aWRlci5wcm90b3R5cGUub25DbG9zZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl90YWdzID0gW107XG4gIHRoaXMuX3NlbmRpbmcgPSB7fTtcbiAgdGhpcy5fcXVldWVkTWVzc2FnZXMgPSB7fTtcbiAgdGhpcy5fY2h1bmtzID0ge307XG4gIHRoaXMuZGlzcGF0Y2hFdmVudCgnb25DbG9zZScsIG51bGwpO1xufTtcblxuXG5XZWJSVENUcmFuc3BvcnRQcm92aWRlci5wcm90b3R5cGUuX3NpemVUb0J1ZmZlciA9IGZ1bmN0aW9uKHNpemUpIHtcbiAgLy8gQml0IHNoaWZ0cyBoYXZlIG92ZXJmbG93IGlzc3VlcyBmb3IgYW55IGludGVnZXJzIHdpdGggbW9yZSB0aGFuXG4gIC8vIDMyIGJpdHMsIHNvIHVzZSBkaXZpc2lvbi5cbiAgdmFyIGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcig4KTtcbiAgdmFyIHZpZXcgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgODsgaW5kZXgrKykge1xuICAgIC8qanNsaW50IGJpdHdpc2U6dHJ1ZSovXG4gICAgdmFyIGN1cnJlbnRCeXRlID0gKHNpemUgJiAweGZmKTtcbiAgICAvKmpzbGludCBiaXR3aXNlOmZhbHNlKi9cbiAgICB2aWV3IFsgaW5kZXggXSA9IGN1cnJlbnRCeXRlO1xuICAgIHNpemUgPSAoc2l6ZSAtIGN1cnJlbnRCeXRlKSAvIDI1NiA7XG4gIH1cbiAgcmV0dXJuIHZpZXc7XG59O1xuXG5XZWJSVENUcmFuc3BvcnRQcm92aWRlci5wcm90b3R5cGUuX2J1ZmZlclRvU2l6ZSA9IGZ1bmN0aW9uKGJ1ZmZlcikge1xuICB2YXIgdmlldyA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XG4gIHZhciBudW1iZXIgPSAwO1xuICBmb3IgKCB2YXIgaSA9IHZpZXcuYnl0ZUxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgbnVtYmVyID0gKG51bWJlciAqIDI1NikgKyB2aWV3W2ldO1xuICB9XG5cbiAgcmV0dXJuIG51bWJlcjtcbn07XG5cbi8qXG4gKiBSZWFzc2VtYmxlIHRoZSBidWZmZXJzIGZvciB0aGUgZ2l2ZW4gdGFnIGludG8gYSBzaW5nbGUgQXJyYXlCdWZmZXIgb2JqZWN0LlxuICogQHBhcmFtIHtTdHJpbmd9IFxuICogQHJldHVybiB7QXJyYXlCdWZmZXJ9IFJlc3VsdCBvZiBjb25jYXRlbmF0aW5nIGFsbCBidWZmZXJzIGZvciB0YWdcbiAqL1xuV2ViUlRDVHJhbnNwb3J0UHJvdmlkZXIucHJvdG90eXBlLl9hc3NlbWJsZUJ1ZmZlcnMgPSBmdW5jdGlvbih0YWcpIHtcbiAgdmFyIHNpemUgPSB0aGlzLl9jaHVua3NbdGFnXS50b3RhbEJ5dGVDb3VudDtcbiAgdmFyIGJ5dGVzQ29waWVkID0gMDtcbiAgdmFyIHJlc3VsdCA9IG5ldyBBcnJheUJ1ZmZlcihzaXplKTtcbiAgdmFyIHZpZXcgPSBuZXcgVWludDhBcnJheShyZXN1bHQpO1xuICB0aGlzLl9jaHVua3NbdGFnXS5idWZmZXJzLmZvckVhY2goZnVuY3Rpb24oYnVmZmVyKSB7XG5cbiAgICB2aWV3LnNldChuZXcgVWludDhBcnJheShidWZmZXIpLCBieXRlc0NvcGllZCk7XG4gICAgYnl0ZXNDb3BpZWQgKz0gYnVmZmVyLmJ5dGVMZW5ndGg7XG4gIH0pO1xuICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqIFJFR0lTVEVSIFBST1ZJREVSICoqL1xuaWYgKHR5cGVvZiBmcmVlZG9tICE9PSAndW5kZWZpbmVkJykge1xuICBmcmVlZG9tKCkucHJvdmlkZUFzeW5jaHJvbm91cyhXZWJSVENUcmFuc3BvcnRQcm92aWRlcik7XG59XG5cbmlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgZXhwb3J0cy5wcm92aWRlciA9IFdlYlJUQ1RyYW5zcG9ydFByb3ZpZGVyO1xuICBleHBvcnRzLm5hbWUgPSAndHJhbnNwb3J0Jztcbn1cbiIsInZhciB0ZXN0VXRpbCA9IHJlcXVpcmUoJy4uLy4uL3V0aWwnKTtcbnZhciBDb25zb2xlX3VucHJpdiA9IHJlcXVpcmUoJy4uLy4uLy4uL3Byb3ZpZGVycy9jb3JlL2NvbnNvbGUudW5wcml2aWxlZ2VkJyk7XG5cbmRlc2NyaWJlKFwicHJvdmlkZXJzL2NvcmUvQ29uc29sZV91bnByaXZpbGVnZWRcIiwgZnVuY3Rpb24oKSB7XG4gIHZhciBhcHAsIGxvZ2dlciwgY29uc29sZTtcblxuICBiZWZvcmVFYWNoKGZ1bmN0aW9uKCkge1xuICAgIGFwcCA9IHRlc3RVdGlsLmNyZWF0ZVRlc3RQb3J0KCd0ZXN0Jyk7XG4gICAgYXBwLmNvbmZpZyA9IHtcbiAgICAgIGdsb2JhbDoge1xuICAgICAgICBjb25zb2xlOiB7fVxuICAgICAgfVxuICAgIH07XG4gICAgY29uc29sZSA9IGFwcC5jb25maWcuZ2xvYmFsLmNvbnNvbGU7XG4gICAgXG4gICAgYXBwLmNvbnRyb2xDaGFubmVsID0gJ2NvbnRyb2wnO1xuICAgIGxvZ2dlciA9IG5ldyBDb25zb2xlX3VucHJpdi5wcm92aWRlcihhcHApO1xuICB9KTtcblxuICBpdChcIlByaW50cyBtZXNzYWdlcyBhdCBjb3JyZWN0IGxldmVsc1wiLCBmdW5jdGlvbigpIHtcbiAgICBsb2dnZXIubGV2ZWwgPSAnZGVidWcnO1xuICAgIE9iamVjdC5rZXlzKENvbnNvbGVfdW5wcml2LnByb3ZpZGVyLmxldmVsKS5mb3JFYWNoKGZ1bmN0aW9uKGxldmVsKSB7XG4gICAgICBjb25zb2xlW2xldmVsXSA9IGphc21pbmUuY3JlYXRlU3B5KGxldmVsKTtcbiAgICAgIGxvZ2dlcltsZXZlbF0oJ3Rlc3QnLCAnTXlNc2cnLCBmdW5jdGlvbigpIHt9KTtcbiAgICAgIGV4cGVjdChjb25zb2xlW2xldmVsXSkudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgIH0pO1xuXG4gICAgbG9nZ2VyLmxldmVsID0gJ3dhcm4nO1xuICAgIE9iamVjdC5rZXlzKENvbnNvbGVfdW5wcml2LnByb3ZpZGVyLmxldmVsKS5mb3JFYWNoKGZ1bmN0aW9uKGxldmVsKSB7XG4gICAgICBjb25zb2xlW2xldmVsXSA9IGphc21pbmUuY3JlYXRlU3B5KGxldmVsKTtcbiAgICAgIGxvZ2dlcltsZXZlbF0oJ3Rlc3QnLCAnTXlNc2cnLCBmdW5jdGlvbigpIHt9KTtcbiAgICAgIGlmIChsZXZlbCA9PT0gJ3dhcm4nIHx8IGxldmVsID09PSAnZXJyb3InKSB7XG4gICAgICAgIGV4cGVjdChjb25zb2xlW2xldmVsXSkudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXhwZWN0KGNvbnNvbGVbbGV2ZWxdKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgICAgfVxuICAgIH0pO1xuICBcbiAgfSk7XG59KTtcbiIsInZhciBEZWJ1ZyA9IHJlcXVpcmUoJy4uLy4uLy4uL3NyYy9kZWJ1ZycpO1xudmFyIEh1YiA9IHJlcXVpcmUoJy4uLy4uLy4uL3NyYy9odWInKTtcbnZhciBSZXNvdXJjZSA9IHJlcXVpcmUoJy4uLy4uLy4uL3NyYy9yZXNvdXJjZScpO1xudmFyIEFwaSA9IHJlcXVpcmUoJy4uLy4uLy4uL3NyYy9hcGknKTtcbnZhciBCdW5kbGUgPSByZXF1aXJlKCcuLi8uLi8uLi9zcmMvYnVuZGxlJyk7XG52YXIgTWFuYWdlciA9IHJlcXVpcmUoJy4uLy4uLy4uL3NyYy9tYW5hZ2VyJyk7XG52YXIgQ29yZSA9IHJlcXVpcmUoJy4uLy4uLy4uL3Byb3ZpZGVycy9jb3JlL2NvcmUudW5wcml2aWxlZ2VkJyk7XG52YXIgdGVzdFV0aWwgPSByZXF1aXJlKCcuLi8uLi91dGlsJyk7XG5cbmRlc2NyaWJlKFwiQ29yZSBQcm92aWRlciBJbnRlZ3JhdGlvblwiLCBmdW5jdGlvbigpIHtcbiAgdmFyIGZyZWVkb207XG4gIGJlZm9yZUVhY2goZnVuY3Rpb24oZG9uZSkge1xuICAgIHRlc3RVdGlsLnNldENvcmVQcm92aWRlcnMoW1xuICAgICAgQ29yZVxuICAgIF0pO1xuICAgIHRlc3RVdGlsLnNldHVwTW9kdWxlKCdyZWxhdGl2ZTovL3NwZWMvaGVscGVyL2NoYW5uZWwuanNvbicpLnRoZW4oZnVuY3Rpb24oaWZhY2UpIHtcbiAgICAgIGZyZWVkb20gPSBpZmFjZSgpO1xuICAgICAgZG9uZSgpO1xuICAgIH0pO1xuICB9KTtcbiAgXG4gIGFmdGVyRWFjaChmdW5jdGlvbigpIHtcbiAgICB0ZXN0VXRpbC5jbGVhbnVwSWZyYW1lcygpO1xuICB9KTtcblxuICBpdChcIk1hbmFnZXMgQ2hhbm5lbHMgQmV0d2VlbiBNb2R1bGVzXCIsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICB2YXIgY2IgPSBqYXNtaW5lLmNyZWF0ZVNweSgnY2InKTtcbiAgICBmcmVlZG9tLm9uY2UoJ21lc3NhZ2UnLCBmdW5jdGlvbihtc2cpIHtcbiAgICAgIC8vIGNyZWF0ZWQuXG4gICAgICBleHBlY3QobXNnKS50b0VxdWFsKCdjcmVhdGluZyBjdXN0b20gY2hhbm5lbCAwJyk7XG4gICAgICBmcmVlZG9tLm9uKCdtZXNzYWdlJywgY2IpO1xuICAgICAgZnJlZWRvbS5vbignbWVzc2FnZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBleHBlY3QoY2IpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCdzZW5kaW5nIG1lc3NhZ2UgdG8gMCcpO1xuICAgICAgICBpZiAoY2IuY2FsbHMuY291bnQoKSA9PSAzKSB7XG4gICAgICAgICAgZXhwZWN0KGNiKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCgnY2hhbm5lbCAwIHJlcGxpZXMgTWVzc2FnZSB0byBjaGFuIDAnKTtcbiAgICAgICAgICBkb25lKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgZnJlZWRvbS5lbWl0KCdtZXNzYWdlJywgMCk7XG4gICAgfSk7XG4gICAgZnJlZWRvbS5lbWl0KCdjcmVhdGUnKTtcbiAgfSk7XG5cbiAgaXQoXCJNYW5hZ2VzIENoYW5uZWxzIFdpdGggcHJvdmlkZXJzXCIsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICB2YXIgY2IgPSBqYXNtaW5lLmNyZWF0ZVNweSgnY2InKTtcbiAgICBmcmVlZG9tLm9uY2UoJ21lc3NhZ2UnLCBmdW5jdGlvbihtc2cpIHtcbiAgICAgIC8vIGNyZWF0ZWQuXG4gICAgICBmcmVlZG9tLm9uKCdtZXNzYWdlJywgY2IpO1xuICAgICAgZnJlZWRvbS5vbmNlKCdtZXNzYWdlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGV4cGVjdChjYikudG9IYXZlQmVlbkNhbGxlZFdpdGgoJ3NlbmRpbmcgbWVzc2FnZSB0byBwZWVyIDAnKTtcbiAgICAgICAgZG9uZSgpO1xuICAgICAgfSk7XG4gICAgICBmcmVlZG9tLmVtaXQoJ21lc3NhZ2UnLCAwKTtcbiAgICB9KTtcbiAgICBmcmVlZG9tLmVtaXQoJ3BlZXInKTtcbiAgfSk7XG59KTtcblxuZGVzY3JpYmUoXCJDb3JlIFByb3ZpZGVyIENoYW5uZWxzXCIsIGZ1bmN0aW9uKCkge1xuICB2YXIgbWFuYWdlciwgaHViLCBnbG9iYWwsIHNvdXJjZSwgY29yZTtcbiAgXG4gIGJlZm9yZUVhY2goZnVuY3Rpb24oZG9uZSkge1xuICAgIHZhciBkZWJ1ZyA9IG5ldyBEZWJ1ZygpLFxuICAgICAgaHViID0gbmV3IEh1YihkZWJ1ZyksXG4gICAgICByZXNvdXJjZSA9IG5ldyBSZXNvdXJjZShkZWJ1ZyksXG4gICAgICBhcGkgPSBuZXcgQXBpKGRlYnVnKSxcbiAgICAgIG1hbmFnZXIgPSBuZXcgTWFuYWdlcihodWIsIHJlc291cmNlLCBhcGkpLFxuICAgICAgc291cmNlID0gdGVzdFV0aWwuY3JlYXRlVGVzdFBvcnQoJ3Rlc3QnKTtcbiAgICBCdW5kbGUucmVnaXN0ZXIoW3tcbiAgICAgICduYW1lJzogJ2NvcmUnLFxuICAgICAgJ3Byb3ZpZGVyJzogQ29yZS5wcm92aWRlclxuICAgIH1dLCBhcGkpO1xuXG4gICAgaHViLmVtaXQoJ2NvbmZpZycsIHtcbiAgICAgIGdsb2JhbDoge31cbiAgICB9KTtcbiAgICBtYW5hZ2VyLnNldHVwKHNvdXJjZSk7XG5cbiAgICB2YXIgY2hhbiA9IHNvdXJjZS5nb3RNZXNzYWdlKCdjb250cm9sJykuY2hhbm5lbDtcbiAgICBodWIub25NZXNzYWdlKGNoYW4sIHtcbiAgICAgIHR5cGU6ICdDb3JlIFByb3ZpZGVyJyxcbiAgICAgIHJlcXVlc3Q6ICdjb3JlJ1xuICAgIH0pO1xuICAgIFxuICAgIHNvdXJjZS5nb3RNZXNzYWdlQXN5bmMoJ2NvbnRyb2wnLCB7dHlwZTogJ2NvcmUnfSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgIGNvcmUgPSByZXNwb25zZS5jb3JlO1xuICAgICAgZG9uZSgpO1xuICAgIH0pO1xuICB9KTtcblxuICBpdCgnTGlua3MgQ3VzdG9tIENoYW5uZWxzJywgZnVuY3Rpb24oKSB7XG4gICAgZXhwZWN0KGNvcmUpLnRvQmVEZWZpbmVkKCk7XG5cbiAgICB2YXIgYyA9IG5ldyBjb3JlKCksIGlkLCBpbnB1dDtcbiAgICB2YXIgY2FsbCA9IGMuY3JlYXRlQ2hhbm5lbChmdW5jdGlvbihjaGFuKSB7XG4gICAgICBpZCA9IGNoYW4uaWRlbnRpZmllcjtcbiAgICAgIGlucHV0ID0gY2hhbi5jaGFubmVsO1xuICAgIH0pO1xuICAgIGV4cGVjdChpbnB1dCkudG9CZURlZmluZWQoKTtcbiAgICBcbiAgICB2YXIgaW5IYW5kbGUgPSBqYXNtaW5lLmNyZWF0ZVNweSgnaW5wdXQnKTtcbiAgICBpbnB1dC5vbihpbkhhbmRsZSk7XG4gICAgZXhwZWN0KGluSGFuZGxlKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpO1xuXG4gICAgdmFyIG91dHB1dDtcbiAgICBjLmJpbmRDaGFubmVsKGlkLCBmdW5jdGlvbihjaGFuKSB7XG4gICAgICBvdXRwdXQgPSBjaGFuO1xuICAgIH0pO1xuICAgIGV4cGVjdChvdXRwdXQpLnRvQmVEZWZpbmVkKCk7XG4gICAgXG4gICAgZXhwZWN0KGluSGFuZGxlKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgIG91dHB1dC5lbWl0KCdtZXNzYWdlJywgJ3dob28hJyk7XG4gICAgZXhwZWN0KGluSGFuZGxlKS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gIH0pO1xuXG5cbiAgaXQoJ1N1cHBvcnRzIEN1c3RvbSBDaGFubmVsIENsb3NpbmcnLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgYyA9IG5ldyBjb3JlKCksIGlkLCBpbnB1dDtcbiAgICB2YXIgY2FsbCA9IGMuY3JlYXRlQ2hhbm5lbChmdW5jdGlvbihjaGFuKSB7XG4gICAgICBpZCA9IGNoYW4uaWRlbnRpZmllcjtcbiAgICAgIGlucHV0ID0gY2hhbi5jaGFubmVsO1xuICAgIH0pO1xuICAgIGV4cGVjdChpbnB1dCkudG9CZURlZmluZWQoKTtcbiAgICBcbiAgICB2YXIgaGFuZGxlID0gamFzbWluZS5jcmVhdGVTcHkoJ21lc3NhZ2UnKTtcblxuICAgIHZhciBvdXRwdXQ7XG4gICAgYy5iaW5kQ2hhbm5lbChpZCwgZnVuY3Rpb24oY2hhbikge1xuICAgICAgb3V0cHV0ID0gY2hhbjtcbiAgICB9KTtcbiAgICBleHBlY3Qob3V0cHV0KS50b0JlRGVmaW5lZCgpO1xuICAgIG91dHB1dC5vbihoYW5kbGUpO1xuXG4gICAgdmFyIGNsb3NlciA9IGphc21pbmUuY3JlYXRlU3B5KCdjbG9zZScpO1xuICAgIGlucHV0Lm9uQ2xvc2UoY2xvc2VyKTtcbiAgICBleHBlY3QoaGFuZGxlKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgIGlucHV0LmVtaXQoJ21lc3NhZ2UnLCAnd2hvbyEnKTtcbiAgICBleHBlY3QoaGFuZGxlKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCgnbWVzc2FnZScsICd3aG9vIScpO1xuICAgIGV4cGVjdChjbG9zZXIpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgb3V0cHV0LmNsb3NlKCk7XG4gICAgZXhwZWN0KGNsb3NlcikudG9IYXZlQmVlbkNhbGxlZCgpO1xuICB9KTtcblxuICBpdCgnTWFuYWdlcyBNb2R1bGUgSWRlbnRpZmllcnMnLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgYyA9IG5ldyBjb3JlKCk7XG4gICAgYy5zZXRJZChbJ2EnLCdiJywnYyddKTtcbiAgICBcbiAgICB2YXIgc3B5ID0gamFzbWluZS5jcmVhdGVTcHkoJ2lkJyk7XG4gICAgYy5nZXRJZChzcHkpO1xuICAgIGV4cGVjdChzcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFsnYScsJ2InLCdjJ10pO1xuICB9KTtcbn0pO1xuIiwidmFyIHRlc3RVdGlsID0gcmVxdWlyZSgnLi4vLi4vdXRpbCcpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuLi8uLi8uLi9zcmMvdXRpbCcpO1xudmFyIEVjaG8gPSByZXF1aXJlKCcuLi8uLi8uLi9wcm92aWRlcnMvY29yZS9lY2hvLnVucHJpdmlsZWdlZCcpO1xuXG5kZXNjcmliZShcInByb3ZpZGVycy9jb3JlL0VjaG9fVW5wcml2aWxlZ2VkXCIsIGZ1bmN0aW9uKCkge1xuICB2YXIgYXBwO1xuICB2YXIgZWNobztcblxuICBiZWZvcmVFYWNoKGZ1bmN0aW9uKCkge1xuICAgIGFwcCA9IHRlc3RVdGlsLmNyZWF0ZVRlc3RQb3J0KCd0ZXN0Jyk7XG4gICAgYXBwLmNvbnRyb2xDaGFubmVsID0gJ2NvbnRyb2wnO1xuICAgIGVjaG8gPSBuZXcgRWNoby5wcm92aWRlcihhcHAsIGFwcC5lbWl0LmJpbmQoYXBwKSk7XG4gIH0pO1xuXG4gIGl0KFwiTmVlZHMgY29yZVwiLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3B5ID0gamFzbWluZS5jcmVhdGVTcHkoJ21zZycpO1xuICAgIGFwcC5vbignbWVzc2FnZScsIHNweSk7XG4gICAgZWNoby5zZXR1cCgndGVzdCcsIGZ1bmN0aW9uKCkge30pO1xuICAgIGV4cGVjdChzcHkpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgfSk7XG4gIFxuICBpdChcIkJpbmRzIGEgY3VzdG9tIGNoYW5uZWxcIiwgZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNweSA9IGphc21pbmUuY3JlYXRlU3B5KCdtc2cnKTtcbiAgICBhcHAub24oJ21lc3NhZ2UnLCBzcHkpO1xuXG4gICAgdmFyIGFyZ3M7XG4gICAgYXBwLmVtaXQoJ2NvcmUnLCBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuYmluZENoYW5uZWwgPSBmdW5jdGlvbihpZCwgY2IpIHtcbiAgICAgICAgYXJncyA9IFtpZCwgY2JdO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgZWNoby5zZXR1cCgndGVzdCcsIGZ1bmN0aW9uKCkge30pO1xuICAgIGV4cGVjdChzcHkpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgZXhwZWN0KGFyZ3NbMF0pLnRvRXF1YWwoJ3Rlc3QnKTtcbiAgICBcbiAgICB2YXIgY2hhbiA9IHt9O1xuICAgIFV0aWwuaGFuZGxlRXZlbnRzKGNoYW4pO1xuICAgIGNoYW4ub25DbG9zZSA9IGZ1bmN0aW9uKGMpIHt9O1xuICAgIFxuICAgIGFyZ3NbMV0oY2hhbik7XG4gICAgZXhwZWN0KHNweSkudG9IYXZlQmVlbkNhbGxlZCgpO1xuXG4gICAgY2hhbi5lbWl0KCdtZXNzYWdlJywgJ3Rlc3QxJyk7XG4gICAgZXhwZWN0KHNweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoJ2Zyb20gY3VzdG9tIGNoYW5uZWw6IHRlc3QxJyk7XG4gIH0pO1xuXG4gIGl0KFwiUmViaW5kcyB0aGUgY2hhbm5lbFwiLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncztcbiAgICBhcHAuZW1pdCgnY29yZScsIGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5iaW5kQ2hhbm5lbCA9IGZ1bmN0aW9uKGlkLCBjYikge1xuICAgICAgICBhcmdzID0gW2lkLCBjYl07XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBlY2hvLnNldHVwKCd0ZXN0JywgZnVuY3Rpb24oKSB7fSk7XG4gICAgZXhwZWN0KGFyZ3NbMF0pLnRvRXF1YWwoJ3Rlc3QnKTtcbiAgICBcbiAgICB2YXIgY2hhbiA9IHt9O1xuICAgIFV0aWwuaGFuZGxlRXZlbnRzKGNoYW4pO1xuICAgIGNoYW4ub25DbG9zZSA9IGZ1bmN0aW9uKGMpIHt9O1xuICAgIGNoYW4uY2xvc2UgPSBqYXNtaW5lLmNyZWF0ZVNweSgnY2xvc2UnKTtcbiAgICBcbiAgICBhcmdzWzFdKGNoYW4pO1xuICAgIGFyZ3NbMV0oY2hhbik7XG4gICAgZXhwZWN0KGNoYW4uY2xvc2UpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgfSk7XG59KTtcbiIsInZhciBvQXV0aCA9IHJlcXVpcmUoJy4uLy4uLy4uL3Byb3ZpZGVycy9jb3JlL2NvcmUub2F1dGgnKTtcbnZhciBzZXR1cCA9IHJlcXVpcmUoJy4uLy4uLy4uL3NyYy9lbnRyeScpO1xudmFyIFByb21pc2VDb21wYXQgPSByZXF1aXJlKCdlczYtcHJvbWlzZScpLlByb21pc2U7XG5cbmZ1bmN0aW9uIE1vY2tQcm92aWRlcigpIHtcbiAgLy8gRW1wdHkgQ29uc3RydWN0b3IuXG59O1xuXG5Nb2NrUHJvdmlkZXIucHJvdG90eXBlLmluaXRpYXRlT0F1dGggPSBmdW5jdGlvbihyZWRpcmVjdFVSSXMsIGNvbnQpIHtcbiAgY29udCh7XG4gICAgcmVkaXJlY3Q6IFwiaHR0cDovL2xvY2FsaG9zdC9vQXV0aFJlZGlyZWN0XCIsXG4gICAgc3RhdGU6IE1hdGgucmFuZG9tKClcbiAgfSk7XG4gIHJldHVybiB0cnVlO1xufTtcblxuTW9ja1Byb3ZpZGVyLnByb3RvdHlwZS5sYXVuY2hBdXRoRmxvdyA9IGZ1bmN0aW9uKGF1dGhVcmwsIHN0YXRlT2JqLCBjb250KSB7XG4gIGNvbnQoXCJSZXNwb25zZSBVcmxcIik7XG4gIHJldHVybiB0cnVlO1xufTtcblxuZGVzY3JpYmUoJ29BdXRoJywgZnVuY3Rpb24gKCkge1xuICBpdChcIm9hdXRoOiBDaGVja3MgZm9yIGEgdmFsaWQgcmVnaXN0ZXJlZCBoYW5kbGVyXCIsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICB2YXIgZGUgPSBqYXNtaW5lLmNyZWF0ZVNweSgnZGUnKSxcbiAgICAgIGNiID0gamFzbWluZS5jcmVhdGVTcHkoJ2NiJyk7XG4gICAgdmFyIGF1dGhQcm92aWRlciA9IG5ldyBvQXV0aC5wcm92aWRlcih7fSwgZGUpO1xuICAgIGF1dGhQcm92aWRlci5pbml0aWF0ZU9BdXRoKFsnaHR0cDovL2xvY2FsaG9zdC9vQXV0aFJlZGlyZWN0J10sIGNiKTtcbiAgICBleHBlY3QoY2IpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKG51bGwsIGphc21pbmUub2JqZWN0Q29udGFpbmluZyh7ZXJyY29kZTogJ1VOS05PV04nfSkpO1xuICAgIGRvbmUoKTtcbiAgfSk7XG5cbiAgaXQoXCJvYXV0aDogRGVsZWdhdGVzIHRvIHJlZ2lzdGVyZWQgaGFuZGxlcnNcIiwgZnVuY3Rpb24gKGRvbmUpIHtcbiAgICB2YXIgZGUgPSBqYXNtaW5lLmNyZWF0ZVNweSgnZGUnKSxcbiAgICAgIGNiID0gamFzbWluZS5jcmVhdGVTcHkoJ2NiJyk7XG4gICAgb0F1dGgucmVnaXN0ZXIoW01vY2tQcm92aWRlcl0pO1xuICAgIHZhciBhdXRoUHJvdmlkZXIgPSBuZXcgb0F1dGgucHJvdmlkZXIoe30sIGRlKTtcblxuICAgIHZhciBjYWxsYmFja09uZSA9IGZ1bmN0aW9uKHN0YXRlT2JqKSB7XG4gICAgICBleHBlY3Qoc3RhdGVPYmopLnRvRXF1YWwoamFzbWluZS5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgcmVkaXJlY3Q6IFwiaHR0cDovL2xvY2FsaG9zdC9vQXV0aFJlZGlyZWN0XCIsXG4gICAgICAgIHN0YXRlOiBqYXNtaW5lLmFueShOdW1iZXIpXG4gICAgICB9KSk7XG4gICAgICBhdXRoUHJvdmlkZXIubGF1bmNoQXV0aEZsb3coXCJBVVRIIFVSTFwiLCBzdGF0ZU9iaiwgY2FsbGJhY2tUd28pO1xuICAgIH07XG5cbiAgICB2YXIgY2FsbGJhY2tUd28gPSBmdW5jdGlvbihyZXNwVXJsKSB7XG4gICAgICBleHBlY3QocmVzcFVybCkudG9FcXVhbChqYXNtaW5lLmFueShTdHJpbmcpKTtcbiAgICAgIGRvbmUoKTtcbiAgICB9O1xuXG4gICAgYXV0aFByb3ZpZGVyLmluaXRpYXRlT0F1dGgoWydodHRwOi8vbG9jYWxob3N0L29BdXRoUmVkaXJlY3QnXSwgY2FsbGJhY2tPbmUpO1xuICB9KTtcblxuICBpdChcIlN1cHBvcnRzIHVzZXItcHJvdmlkZWQgb0F1dGggaGFuZGxlcnNcIiwgZnVuY3Rpb24gKGRvbmUpIHtcbiAgICB2YXIgc3B5ID0gamFzbWluZS5jcmVhdGVTcHkoJ29BdXRoIENCJyk7XG5cbiAgICB2YXIgZnJlZWRvbSA9IHNldHVwKHtcbiAgICAgIHByb3ZpZGVyczogW29BdXRoXVxuICAgIH0sICcnLCB7XG4gICAgICBvYXV0aDogW01vY2tQcm92aWRlcl1cbiAgICB9KTtcblxuICAgIGZyZWVkb20uY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGRlID0gamFzbWluZS5jcmVhdGVTcHkoJ2RlJyksXG4gICAgICAgIGNiID0gamFzbWluZS5jcmVhdGVTcHkoJ2NiJyk7XG4gICAgICB2YXIgYXV0aFByb3ZpZGVyID0gbmV3IG9BdXRoLnByb3ZpZGVyKHt9LCBkZSk7XG4gICAgICBhdXRoUHJvdmlkZXIuaW5pdGlhdGVPQXV0aChbJ2h0dHA6Ly9sb2NhbGhvc3Qvb0F1dGhSZWRpcmVjdCddLCBmdW5jdGlvbiAocmV0LCBlcnIpIHtcbiAgICAgICAgZXhwZWN0KHJldC5yZWRpcmVjdCkudG9FcXVhbChcImh0dHA6Ly9sb2NhbGhvc3Qvb0F1dGhSZWRpcmVjdFwiKTtcbiAgICAgICAgZG9uZSgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuICBcbiAgYWZ0ZXJFYWNoKGZ1bmN0aW9uICgpIHtcbiAgICBvQXV0aC5yZXNldCgpO1xuICB9KTtcbn0pO1xuIiwidmFyIFBlZXJDb25uZWN0aW9uID0gcmVxdWlyZSgnLi4vLi4vLi4vcHJvdmlkZXJzL2NvcmUvcGVlcmNvbm5lY3Rpb24udW5wcml2aWxlZ2VkJyk7XG5cbmZ1bmN0aW9uIE1vY2tSVENJY2VDYW5kaWRhdGUoKSB7XG59XG5mdW5jdGlvbiBNb2NrUlRDUGVlckNvbm5lY3Rpb24oY29uZmlndXJhdGlvbiwgY29uc3RyYWludHMpIHtcbiAgTW9ja1JUQ1BlZXJDb25uZWN0aW9uLm1vc3RSZWNlbnQgPSB0aGlzO1xuICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBjb25maWd1cmF0aW9uO1xuICB0aGlzLmNvbnN0cmFpbnRzID0gY29uc3RyYWludHM7XG4gIHRoaXMubGlzdGVuZXJzID0ge307XG59XG5cbk1vY2tSVENQZWVyQ29ubmVjdGlvbi5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50LCBmdW5jKSB7XG4gIC8vIFdlIG9ubHkgYWxsb3cgcmVnaXN0ZXJpbmcgb25lIGxpc3RlbmVyIGZvciBzaW1wbGljaXR5XG4gIHRoaXMubGlzdGVuZXJzW2V2ZW50XSA9IGZ1bmM7XG59O1xuXG5Nb2NrUlRDUGVlckNvbm5lY3Rpb24ucHJvdG90eXBlLmNyZWF0ZURhdGFDaGFubmVsID0gZnVuY3Rpb24obGFiZWwsIGRpY3QpIHtcbiAgdmFyIGRhdGFDaGFubmVsID0gbmV3IFJUQ0RhdGFDaGFubmVsKGxhYmVsLCBkaWN0KTtcbiAgcmV0dXJuIGRhdGFDaGFubmVsO1xufTtcblxuTW9ja1JUQ1BlZXJDb25uZWN0aW9uLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnNpZ25hbGluZ1N0YXRlID0gJ2Nsb3NlZCc7XG59O1xuXG5mdW5jdGlvbiBSVENEYXRhQ2hhbm5lbChsYWJlbCwgZGljdCkge1xuICBSVENEYXRhQ2hhbm5lbC5tb3N0UmVjZW50ID0gdGhpcztcblxuICB0aGlzLmxhYmVsID0gbGFiZWw7XG4gIHRoaXMuYnVmZmVyZWRBbW91bnQgPSAwO1xuICB0aGlzLnJlYWR5U3RhdGUgPSBcImNvbm5lY3RpbmdcIjtcbiAgdGhpcy5fY2xvc2VkID0gZmFsc2U7XG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLm9ub3BlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy5vbm9wZW4oKTtcbiAgICB9XG4gIH0uYmluZCh0aGlzKSwgMCk7XG59XG5cblJUQ0RhdGFDaGFubmVsLnByb3RvdHlwZS5zZW5kID0gZnVuY3Rpb24oKSB7XG59O1xuXG5SVENEYXRhQ2hhbm5lbC5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fY2xvc2VkID0gdHJ1ZTtcbn07XG5cblxuZnVuY3Rpb24gTW9ja1JUQ1Nlc3Npb25EZXNjcmlwdGlvbihkZXNjcmlwdGlvbkluaXREaWN0KSB7XG4gIHRoaXMuZGVzY3JpcHRpb25Jbml0RGljdCA9IGRlc2NyaXB0aW9uSW5pdERpY3Q7XG4gIHRoaXMuc2RwID0gZGVzY3JpcHRpb25Jbml0RGljdC5zZHA7XG4gIHRoaXMudHlwZSA9IGRlc2NyaXB0aW9uSW5pdERpY3QudHlwZTtcbn1cblxuZGVzY3JpYmUoXCJwcm92aWRlcnMvY29yZS9wZWVyY29ubmVjdGlvblwiLCBmdW5jdGlvbigpIHtcbiAgdmFyIHBvcnRBcHAsIHNpZ25hbENoYW5uZWwsIGVtaXR0ZWQsIGxpc3RlbmluZ09uO1xuICB2YXIgZGlzcGF0Y2hlZEV2ZW50cztcbiAgdmFyIHBlZXJjb25uZWN0aW9uO1xuICB2YXIgdHVyblNlcnZlcnMgPSBbXTtcbiAgdmFyIFBST1hZID0gXCJQUk9YWVwiO1xuICB2YXIgVElNRU9VVCA9IDEwMDA7XG4gIFxuXG4gIGZ1bmN0aW9uIENvcmUgKCkge1xuICB9O1xuXG4gIENvcmUucHJvdG90eXBlLmJpbmRDaGFubmVsID0gZnVuY3Rpb24oaWQsIGNvbnRpbnVhdGlvbikge1xuICAgIGNvbnRpbnVhdGlvbihzaWduYWxDaGFubmVsKTtcbiAgfTtcblxuICBiZWZvcmVFYWNoKGZ1bmN0aW9uIGJlZm9yZUVhY2goZG9uZSkge1xuICAgIGVtaXR0ZWQgPSBbXTtcbiAgICBsaXN0ZW5pbmdPbiA9IHt9O1xuICAgIGRpc3BhdGNoZWRFdmVudHMgPSB7fTtcblxuICAgIC8vIHNpZ25hbGxpbmcgY2hhbm5lbCBldmVudHNcbiAgICBzaWduYWxDaGFubmVsID0ge1xuICAgICAgZW1pdDogZnVuY3Rpb24oZXZlbnROYW1lLCBldmVudERhdGEpIHtcbiAgICAgICAgZW1pdHRlZC5wdXNoKHtldmVudE5hbWU6IGV2ZW50TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICBldmVudERhdGE6IGV2ZW50RGF0YX0pO1xuICAgICAgfSxcbiAgICAgIG9uOiBmdW5jdGlvbihldmVudCwgZnVuYykge1xuICAgICAgICBsaXN0ZW5pbmdPbltldmVudF0gPSBmdW5jO1xuICAgICAgfVxuICAgIH07XG4gICAgXG4gICAgcG9ydEFwcCA9IHtcbiAgICAgIG9uY2U6IGZ1bmN0aW9uKG5hbWUsIGZ1bmMpIHtcbiAgICAgICAgZXhwZWN0KG5hbWUpLnRvRXF1YWwoXCJjb3JlXCIpO1xuICAgICAgICBmdW5jKENvcmUpO1xuICAgICAgfSxcbiAgICAgIGVtaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgfVxuICAgIH07XG4gICAgcGVlcmNvbm5lY3Rpb24gPSBuZXcgUGVlckNvbm5lY3Rpb24ucHJvdmlkZXIocG9ydEFwcCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTW9ja1JUQ1BlZXJDb25uZWN0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1vY2tSVENTZXNzaW9uRGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTW9ja1JUQ0ljZUNhbmRpZGF0ZSk7XG4gICAgcGVlcmNvbm5lY3Rpb24uZGlzcGF0Y2hFdmVudCA9IGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG4gICAgICBpZiAoZGlzcGF0Y2hlZEV2ZW50c1tldmVudF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBkaXNwYXRjaGVkRXZlbnRzW2V2ZW50XSA9IFtdO1xuICAgICAgfVxuICAgICAgZGlzcGF0Y2hlZEV2ZW50c1tldmVudF0ucHVzaChkYXRhKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gc2V0dXBDYWxsZWQoKSB7XG4gICAgICBleHBlY3QoZW1pdHRlZCkudG9Db250YWluKHtldmVudE5hbWU6IFwicmVhZHlcIiwgZXZlbnREYXRhOiB1bmRlZmluZWR9KTtcbiAgICAgIGRvbmUoKTtcbiAgICB9XG5cbiAgICBwZWVyY29ubmVjdGlvbi5zZXR1cChQUk9YWSwgXCJzZXR1cCBwZWVyXCIsIHR1cm5TZXJ2ZXJzLCBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICBzZXR1cENhbGxlZCk7XG4gICAgLy8gTW9kaWZ5IHRoZSBTaW1wbGVEYXRhUGVlcidzIHBjIG9iamVjdCB0byBjaGFuZ2UgdGhlIHN0YXRlIHRvIENPTk5FQ1RFRCxcbiAgICAvLyBzbyB0aGF0IFNpbXBsZURhdGFQZWVyLnJ1bldoZW5Db25uZWN0ZWQgY2FsbGJhY2tzIHdpbGwgYmUgcnVuLlxuICAgIHBlZXJjb25uZWN0aW9uLnBlZXIucGMuc2lnbmFsaW5nU3RhdGUgPSAnc3RhYmxlJztcbiAgICBwZWVyY29ubmVjdGlvbi5wZWVyLnBjLmxpc3RlbmVyc1snc2lnbmFsaW5nc3RhdGVjaGFuZ2UnXSgpO1xuICB9KTtcblxuICBpdChcIk9wZW5zIGRhdGEgY2hhbm5lbFwiLCBmdW5jdGlvbihkb25lKSB7XG4gICAgdmFyIHJ0Y3BjID0gTW9ja1JUQ1BlZXJDb25uZWN0aW9uLm1vc3RSZWNlbnQ7XG4gICAgc3B5T24ocnRjcGMsIFwiY3JlYXRlRGF0YUNoYW5uZWxcIikuYW5kLmNhbGxUaHJvdWdoKCk7XG4gICAgcGVlcmNvbm5lY3Rpb24ub3BlbkRhdGFDaGFubmVsKFwib3BlbkRDXCIsIG9wZW5EYXRhQ2hhbm5lbENvbnRpbnVhdGlvbik7XG5cbiAgICBmdW5jdGlvbiBvcGVuRGF0YUNoYW5uZWxDb250aW51YXRpb24oKSB7XG4gICAgICB2YXIgZGF0YUNoYW5uZWw7XG4gICAgICBleHBlY3QocnRjcGMuY3JlYXRlRGF0YUNoYW5uZWwpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFwib3BlbkRDXCIsIHt9KTtcbiAgICAgIGRhdGFDaGFubmVsID0gUlRDRGF0YUNoYW5uZWwubW9zdFJlY2VudDtcbiAgICAgIGV4cGVjdChkYXRhQ2hhbm5lbCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChkYXRhQ2hhbm5lbC5sYWJlbCkudG9FcXVhbChcIm9wZW5EQ1wiKTtcbiAgICAgIGRvbmUoKTtcbiAgICB9XG4gIH0pO1xuXG4gIGl0KFwiRmlyZXMgb25PcGVuRGF0YUNoYW5uZWwgZm9yIHBlZXIgY3JlYXRlZCBkYXRhIGNoYW5uZWxzLlwiLCBmdW5jdGlvbihkb25lKSB7XG4gICAgdmFyIHJ0Y3BjID0gTW9ja1JUQ1BlZXJDb25uZWN0aW9uLm1vc3RSZWNlbnQ7XG4gICAgdmFyIGRhdGFDaGFubmVsID0gbmV3IFJUQ0RhdGFDaGFubmVsKFwib25PcGVuRENcIiwge30pO1xuICAgIGRhdGFDaGFubmVsLnJlYWR5U3RhdGUgPSBcIm9wZW5cIjtcbiAgICB2YXIgZXZlbnQgPSB7Y2hhbm5lbDogZGF0YUNoYW5uZWx9O1xuICAgIFxuICAgIHJ0Y3BjLmxpc3RlbmVycy5kYXRhY2hhbm5lbChldmVudCk7XG4gICAgZXhwZWN0KGRpc3BhdGNoZWRFdmVudHMub25PcGVuRGF0YUNoYW5uZWxbMF0pLnRvRXF1YWwoeyBjaGFubmVsSWQ6IFwib25PcGVuRENcIn0pO1xuICAgIGRvbmUoKTtcbiAgfSk7XG5cbiAgaXQoXCJDbG9zZXMgZGF0YSBjaGFubmVsXCIsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICB2YXIgcnRjcGMgPSBNb2NrUlRDUGVlckNvbm5lY3Rpb24ubW9zdFJlY2VudDtcbiAgICB2YXIgZGF0YUNoYW5uZWw7XG4gICAgcGVlcmNvbm5lY3Rpb24ub3BlbkRhdGFDaGFubmVsKFwiY2xvc2VEQ1wiLCBvcGVuRGF0YUNoYW5uZWxDb250aW51YXRpb24pO1xuXG4gICAgZnVuY3Rpb24gb3BlbkRhdGFDaGFubmVsQ29udGludWF0aW9uKCkge1xuICAgICAgZGF0YUNoYW5uZWwgPSBSVENEYXRhQ2hhbm5lbC5tb3N0UmVjZW50O1xuICAgICAgZXhwZWN0KGRhdGFDaGFubmVsKS50b0JlRGVmaW5lZCgpO1xuICAgICAgc3B5T24oZGF0YUNoYW5uZWwsIFwiY2xvc2VcIikuYW5kLmNhbGxUaHJvdWdoKCk7XG4gICAgICBwZWVyY29ubmVjdGlvbi5jbG9zZURhdGFDaGFubmVsKFwiY2xvc2VEQ1wiLCBjbG9zZURhdGFDaGFubmVsQ29udGludWF0aW9uKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gY2xvc2VEYXRhQ2hhbm5lbENvbnRpbnVhdGlvbigpIHtcbiAgICAgIGV4cGVjdChkYXRhQ2hhbm5lbC5jbG9zZSkudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgICAgZG9uZSgpO1xuICAgIH1cbiAgfSk7XG5cbiAgaXQoXCJGaXJlcyBvbkNsb3NlIHdoZW4gY2xvc2VkXCIsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICB2YXIgcnRjcGMgPSBNb2NrUlRDUGVlckNvbm5lY3Rpb24ubW9zdFJlY2VudDtcbiAgICB2YXIgZGF0YUNoYW5uZWw7XG4gICAgcGVlcmNvbm5lY3Rpb24ub3BlbkRhdGFDaGFubmVsKFwib25jbG9zZURDXCIsIG9wZW5EYXRhQ2hhbm5lbENvbnRpbnVhdGlvbik7XG4gICAgZnVuY3Rpb24gb3BlbkRhdGFDaGFubmVsQ29udGludWF0aW9uKCkge1xuICAgICAgZGF0YUNoYW5uZWwgPSBSVENEYXRhQ2hhbm5lbC5tb3N0UmVjZW50O1xuICAgICAgZXhwZWN0KGRhdGFDaGFubmVsLm9uY2xvc2UpLnRvRXF1YWwoamFzbWluZS5hbnkoRnVuY3Rpb24pKTtcbiAgICAgIGRhdGFDaGFubmVsLm9uY2xvc2UoKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KGRpc3BhdGNoZWRFdmVudHMub25DbG9zZURhdGFDaGFubmVsWzBdKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZG9uZSgpO1xuICAgIH1cbiAgfSk7XG5cbiAgaXQoXCJTZW5kcyBtZXNzYWdlXCIsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICB2YXIgcnRjcGMgPSBNb2NrUlRDUGVlckNvbm5lY3Rpb24ubW9zdFJlY2VudDtcbiAgICB2YXIgZGF0YUNoYW5uZWw7XG4gICAgdmFyIHNlbmRJbmZvID0ge2NoYW5uZWxMYWJlbDogXCJzZW5kRENcIixcbiAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIkhlbGxvIFdvcmxkXCJ9O1xuICAgIHBlZXJjb25uZWN0aW9uLm9wZW5EYXRhQ2hhbm5lbChcInNlbmREQ1wiLCBvcGVuRGF0YUNoYW5uZWxDb250aW51YXRpb24pO1xuXG4gICAgZnVuY3Rpb24gb3BlbkRhdGFDaGFubmVsQ29udGludWF0aW9uKCkge1xuICAgICAgZGF0YUNoYW5uZWwgPSBSVENEYXRhQ2hhbm5lbC5tb3N0UmVjZW50O1xuICAgICAgZXhwZWN0KGRhdGFDaGFubmVsKS50b0JlRGVmaW5lZCgpO1xuICAgICAgc3B5T24oZGF0YUNoYW5uZWwsIFwic2VuZFwiKTtcbiAgICAgIHBlZXJjb25uZWN0aW9uLnNlbmQoc2VuZEluZm8sIHNlbmRDb250aW51YXRpb24pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzZW5kQ29udGludWF0aW9uKCkge1xuICAgICAgZXhwZWN0KGRhdGFDaGFubmVsLnNlbmQpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFwiSGVsbG8gV29ybGRcIik7XG4gICAgICBkb25lKCk7XG4gICAgfVxuICB9KTtcblxuICBpdChcIlJlY2VpdmVzIG1lc3NhZ2VzXCIsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICB2YXIgcnRjcGMgPSBNb2NrUlRDUGVlckNvbm5lY3Rpb24ubW9zdFJlY2VudDtcbiAgICB2YXIgZGF0YUNoYW5uZWw7XG5cbiAgICBwZWVyY29ubmVjdGlvbi5vcGVuRGF0YUNoYW5uZWwoXCJyZWNlaXZlRENcIiwgb3BlbkRhdGFDaGFubmVsQ29udGludWF0aW9uKTtcbiAgICBmdW5jdGlvbiBvcGVuRGF0YUNoYW5uZWxDb250aW51YXRpb24oKSB7XG4gICAgICBkYXRhQ2hhbm5lbCA9IFJUQ0RhdGFDaGFubmVsLm1vc3RSZWNlbnQ7XG4gICAgICBleHBlY3QoZGF0YUNoYW5uZWwub25tZXNzYWdlKS50b0VxdWFsKGphc21pbmUuYW55KEZ1bmN0aW9uKSk7XG4gICAgICBkYXRhQ2hhbm5lbC5vbm1lc3NhZ2Uoe2RhdGE6IFwiSGVsbG8gV29ybGRcIn0pO1xuXG4gICAgICB2YXIgbWVzc2FnZSA9IGRpc3BhdGNoZWRFdmVudHMub25SZWNlaXZlZFswXTtcbiAgICAgIGV4cGVjdChtZXNzYWdlKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KG1lc3NhZ2UuY2hhbm5lbExhYmVsKS50b0VxdWFsKFwicmVjZWl2ZURDXCIpO1xuICAgICAgZXhwZWN0KG1lc3NhZ2UudGV4dCkudG9FcXVhbChcIkhlbGxvIFdvcmxkXCIpO1xuXG4gICAgICBkb25lKCk7XG4gICAgfVxuICB9KTtcblxuICBpdChcImdldEJ1ZmZlckFtb3VudFwiLCBmdW5jdGlvbihkb25lKSB7XG4gICAgcGVlcmNvbm5lY3Rpb24ub3BlbkRhdGFDaGFubmVsKFwiYnVmQW1vdW50RENcIiwgb3BlbkRhdGFDaGFubmVsQ29udGludWF0aW9uKTtcbiAgICBmdW5jdGlvbiBvcGVuRGF0YUNoYW5uZWxDb250aW51YXRpb24oKSB7XG4gICAgICB2YXIgZGF0YUNoYW5uZWwgPSBSVENEYXRhQ2hhbm5lbC5tb3N0UmVjZW50O1xuICAgICAgcGVlcmNvbm5lY3Rpb24uXG4gICAgICAgIGdldEJ1ZmZlcmVkQW1vdW50KFwiYnVmQW1vdW50RENcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrQnVmZmVyZWRBbW91bnQuYmluZCh1bmRlZmluZWQsIDApKTtcblxuICAgICAgZGF0YUNoYW5uZWwuYnVmZmVyZWRBbW91bnQgPSAxO1xuICAgICAgcGVlcmNvbm5lY3Rpb24uXG4gICAgICAgIGdldEJ1ZmZlcmVkQW1vdW50KFwiYnVmQW1vdW50RENcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrQnVmZmVyZWRBbW91bnQuYmluZCh1bmRlZmluZWQsIDEpKTtcblxuICAgICAgZGF0YUNoYW5uZWwuYnVmZmVyZWRBbW91bnQgPSAxMzM3O1xuICAgICAgcGVlcmNvbm5lY3Rpb24uXG4gICAgICAgIGdldEJ1ZmZlcmVkQW1vdW50KFwiYnVmQW1vdW50RENcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrQnVmZmVyZWRBbW91bnQuYmluZCh1bmRlZmluZWQsIDEzMzcpKTtcbiAgICAgIGRvbmUoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gY2hlY2tCdWZmZXJlZEFtb3VudChleHBlY3RlZCwgdmFsdWVSZXR1cm5lZCkge1xuICAgICAgZXhwZWN0KHZhbHVlUmV0dXJuZWQpLnRvRXF1YWwoZXhwZWN0ZWQpO1xuICAgIH1cbiAgfSk7XG5cbiAgaXQoXCJPbmx5IGZpcmVzIG9uQ2xvc2Ugb25jZVwiLCBmdW5jdGlvbihkb25lKSB7XG4gICAgZXhwZWN0KGRpc3BhdGNoZWRFdmVudHMub25DbG9zZSkubm90LnRvQmVEZWZpbmVkKCk7XG4gICAgcGVlcmNvbm5lY3Rpb24uY2xvc2UoZnVuY3Rpb24oKSB7XG4gICAgICBleHBlY3QoZGlzcGF0Y2hlZEV2ZW50cy5vbkNsb3NlLmxlbmd0aCkudG9FcXVhbCgxKTtcbiAgICB9KTtcbiAgICBwZWVyY29ubmVjdGlvbi5jbG9zZShmdW5jdGlvbigpIHtcbiAgICAgIGV4cGVjdChkaXNwYXRjaGVkRXZlbnRzLm9uQ2xvc2UubGVuZ3RoKS50b0VxdWFsKDEpO1xuICAgICAgZG9uZSgpO1xuICAgIH0pO1xuICB9KTtcblxufSk7XG4iLCJ2YXIgUHJvdmlkZXIgPSByZXF1aXJlKCcuLi8uLi8uLi9wcm92aWRlcnMvY29yZS9zdG9yYWdlLmxvY2Fsc3RvcmFnZScpO1xuXG5kZXNjcmliZShcImNvcmUuc3RvcmFnZSB1bnByaXZpbGVnZWRcIiwgZnVuY3Rpb24oKSB7XG4gIHZhciBwcm92aWRlcjtcbiAgdmFyIFRJTUVPVVQgPSAxMDAwO1xuICBcbiAgYmVmb3JlRWFjaChmdW5jdGlvbihkb25lKSB7XG4gICAgcHJvdmlkZXIgPSBuZXcgUHJvdmlkZXIucHJvdmlkZXIoe30pO1xuICAgIHByb3ZpZGVyLmNsZWFyKGRvbmUpO1xuICB9KTtcbiAgXG4gIGl0KFwiRGVhbHMgd2l0aCBLZXlzIGFwcHJvcHJpYXRlbHlcIiwgZnVuY3Rpb24oZG9uZSkge1xuICAgIHZhciBjYWxsYmFja09uZSA9IGZ1bmN0aW9uKHJldCkge1xuICAgICAgZXhwZWN0KHJldCkudG9FcXVhbChbXSk7XG4gICAgICBwcm92aWRlci5nZXQoJ215S2V5JywgY2FsbGJhY2tUd28pO1xuICAgIH07XG4gICAgdmFyIGNhbGxiYWNrVHdvID0gZnVuY3Rpb24ocmV0KSB7XG4gICAgICBleHBlY3QocmV0KS50b0VxdWFsKG51bGwpO1xuICAgICAgcHJvdmlkZXIuc2V0KCdteUtleScsICdteVZhbCcsIGNhbGxiYWNrVGhyZWUpO1xuICAgIH07XG4gICAgdmFyIGNhbGxiYWNrVGhyZWUgPSBmdW5jdGlvbihyZXQpIHtcbiAgICAgIHByb3ZpZGVyLmdldCgnbXlLZXknLCBjYWxsYmFja0ZvdXIpO1xuICAgIH1cbiAgICB2YXIgY2FsbGJhY2tGb3VyID0gZnVuY3Rpb24ocmV0KSB7XG4gICAgICBleHBlY3QocmV0KS50b0VxdWFsKCdteVZhbCcpO1xuICAgICAgcHJvdmlkZXIua2V5cyhjYWxsYmFja0ZpdmUpO1xuICAgIH07XG4gICAgdmFyIGNhbGxiYWNrRml2ZSA9IGZ1bmN0aW9uKHJldCkge1xuICAgICAgZXhwZWN0KHJldCkudG9FcXVhbChbJ215S2V5J10pO1xuICAgICAgcHJvdmlkZXIucmVtb3ZlKCdteUtleScsIGNhbGxiYWNrU2l4KTtcbiAgICB9XG4gICAgdmFyIGNhbGxiYWNrU2l4ID0gZnVuY3Rpb24ocmV0KSB7XG4gICAgICBwcm92aWRlci5nZXQoJ215S2V5JywgY2FsbGJhY2tTZXZlbik7XG4gICAgfTtcbiAgICB2YXIgY2FsbGJhY2tTZXZlbiA9IGZ1bmN0aW9uKHJldCkge1xuICAgICAgZXhwZWN0KHJldCkudG9FcXVhbChudWxsKTtcbiAgICAgIGRvbmUoKTtcbiAgICB9O1xuICAgIHByb3ZpZGVyLmtleXMoY2FsbGJhY2tPbmUpO1xuICB9KTtcblxuICBpdChcIkNsZWFycyBJdGVtc1wiLCBmdW5jdGlvbihkb25lKSB7XG4gICAgdmFyIGNhbGxiYWNrT25lID0gZnVuY3Rpb24ocmV0KSB7XG4gICAgICBwcm92aWRlci5zZXQoJ290aGVyS2V5JywgJ290aGVyVmFsdWUnLCBjYWxsYmFja1R3byk7XG4gICAgfTtcbiAgICB2YXIgY2FsbGJhY2tUd28gPSBmdW5jdGlvbihyZXQpIHtcbiAgICAgIHByb3ZpZGVyLmNsZWFyKGNhbGxiYWNrVGhyZWUpO1xuICAgIH07XG4gICAgdmFyIGNhbGxiYWNrVGhyZWUgPSBmdW5jdGlvbihyZXQpIHtcbiAgICAgIHByb3ZpZGVyLmdldCgnbXlLZXknLCBjYWxsYmFja0ZvdXIpO1xuICAgIH07XG4gICAgdmFyIGNhbGxiYWNrRm91ciA9IGZ1bmN0aW9uKHJldCkge1xuICAgICAgZXhwZWN0KHJldCkudG9FcXVhbChudWxsKTtcbiAgICAgIHByb3ZpZGVyLmdldCgnb3RoZXJLZXknLCBjYWxsYmFja0ZpdmUpO1xuICAgIH07XG4gICAgdmFyIGNhbGxiYWNrRml2ZSA9IGZ1bmN0aW9uKHJldCkge1xuICAgICAgZXhwZWN0KHJldCkudG9FcXVhbChudWxsKTtcbiAgICAgIGRvbmUoKTtcbiAgICB9XG4gICAgcHJvdmlkZXIuc2V0KCdteUtleScsICdteVZhbCcsIGNhbGxiYWNrT25lKTtcbiAgfSk7XG59KTtcbiIsInZhciBWaWV3ID0gcmVxdWlyZSgnLi4vLi4vLi4vcHJvdmlkZXJzL2NvcmUvY29yZS52aWV3Jyk7XG52YXIgUHJvbWlzZUNvbXBhdCA9IHJlcXVpcmUoJ2VzNi1wcm9taXNlJykuUHJvbWlzZTtcbnZhciB0ZXN0VXRpbCA9IHJlcXVpcmUoJy4uLy4uL3V0aWwnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vLi4vLi4vc3JjL3V0aWwnKTtcblxuZGVzY3JpYmUoXCJjb3JlLnZpZXdcIiwgZnVuY3Rpb24gKCkge1xuICB2YXIgcHJvdmlkZXIsIGFwcCwgZWwsIGRlO1xuXG4gIGJlZm9yZUVhY2goZnVuY3Rpb24gKCkge1xuICAgIGFwcCA9IHtcbiAgICAgIGNvbmZpZzoge1xuICAgICAgICBnbG9iYWw6IHdpbmRvd1xuICAgICAgfSxcbiAgICAgIFxuICAgICAgcmVzb3VyY2U6IHRlc3RVdGlsLnNldHVwUmVzb2x2ZXJzKCksXG4gICAgICBtYW5pZmVzdElkOiAnbXlBcHAnLFxuICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgdmlld3M6IHt9XG4gICAgICB9XG4gICAgfTtcbiAgICBkZSA9IGphc21pbmUuY3JlYXRlU3B5KCdkaXNwYXRjaEV2ZW50cycpO1xuICAgIHV0aWwuaGFuZGxlRXZlbnRzKGFwcCk7XG4gICAgcHJvdmlkZXIgPSBuZXcgVmlldy5wcm92aWRlcihhcHAsIGRlKTtcbiBcbiAgICBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsLmlkID0gJ215dmlldyc7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbCk7XG4gIH0pO1xuXG4gIGFmdGVyRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChlbCk7XG4gICAgZGVsZXRlIGVsO1xuICB9KTtcblxuICBpdChcIlBsYWNlcyBvYmplY3RzIGFuZCBjbGVhbnMgdXAuXCIsIGZ1bmN0aW9uIChkb25lKSB7XG4gICAgYXBwLm1hbmlmZXN0LnZpZXdzWydteXZpZXcnXSA9IHtcbiAgICAgIG1haW46IFwicmVsYXRpdmU6Ly9zcGVjL2hlbHBlci92aWV3Lmh0bWxcIixcbiAgICAgIGZpbGVzOiBbXVxuICAgIH07XG5cbiAgICB2YXIgY2IgPSBqYXNtaW5lLmNyZWF0ZVNweSgnY2InKTtcbiAgICBwcm92aWRlci5zaG93KCdteXZpZXcnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBleHBlY3QoZWwuY2hpbGRyZW4ubGVuZ3RoKS5ub3QudG9CZSgwKTtcblxuICAgICAgcHJvdmlkZXIuY2xvc2UoY2IpO1xuICAgICAgZXhwZWN0KGVsLmlubmVySFRNTCkudG9CZShcIlwiKTtcbiAgICAgIGV4cGVjdChjYikudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgICAgZG9uZSgpO1xuICAgIH0pO1xuICB9KTtcblxuICBpdChcIlJvdW5kdHJpcHMgbWVzc2FnZXNcIiwgZnVuY3Rpb24gKGRvbmUpIHtcbiAgICBhcHAubWFuaWZlc3Qudmlld3NbJ215dmlldyddID0ge1xuICAgICAgbWFpbjogXCJyZWxhdGl2ZTovL3NwZWMvaGVscGVyL3ZpZXcuaHRtbFwiLFxuICAgICAgZmlsZXM6IFtdXG4gICAgfTtcbiAgICBcbiAgICB2YXIgb25Qb3N0ID0gZnVuY3Rpb24gKHJldCwgZXJyKSB7XG4gICAgICBleHBlY3QoZXJyKS50b0VxdWFsKHVuZGVmaW5lZCk7XG4gICAgfTtcbiAgICBcbiAgICB2YXIgb25NZXNzYWdlID0gZnVuY3Rpb24gKHR5cGUsIGRhdGEpIHtcbiAgICAgIGV4cGVjdCh0eXBlKS50b0VxdWFsKCdtZXNzYWdlJyk7XG4gICAgICBleHBlY3QoZGF0YSkudG9FcXVhbCgnRWNobzogVEVTVCcpO1xuICAgICAgcHJvdmlkZXIuY2xvc2UoZG9uZSk7XG4gICAgfTtcbiAgICBcbiAgICB2YXIgb25TaG93ID0gZnVuY3Rpb24gKHJldCwgZXJyKSB7XG4gICAgICBleHBlY3QoZXJyKS50b0VxdWFsKHVuZGVmaW5lZCk7XG4gICAgICBkZS5hbmQuY2FsbEZha2Uob25NZXNzYWdlKTtcbiAgICAgIHByb3ZpZGVyLnBvc3RNZXNzYWdlKCdURVNUJywgb25Qb3N0KTtcbiAgICB9O1xuXG4gICAgcHJvdmlkZXIuc2hvdygnbXl2aWV3Jywgb25TaG93KTtcbiAgfSk7XG59KTtcbiIsInZhciBXUyA9IHJlcXVpcmUoJy4uLy4uLy4uL3Byb3ZpZGVycy9jb3JlL3dlYnNvY2tldC51bnByaXZpbGVnZWQnKTtcblxuZnVuY3Rpb24gTW9ja1dlYlNvY2tldCh1cmwsIHByb3RvY29scykge1xuICBNb2NrV2ViU29ja2V0LmN1cnJlbnRJbnN0YW5jZSA9IHRoaXM7XG5cbiAgdGhpcy5fbmFtZSA9IE1hdGgucmFuZG9tKCk7XG4gIHRoaXMudXJsID0gdXJsO1xuICB0aGlzLnByb3RvY29scyA9IHByb3RvY29scztcbiAgLy8gdGhpcy5yZWFkeVN0YXRlID0gTW9ja1dlYlNvY2tldC5yZWFkeVN0YXRlc1tcIkNPTk5FQ1RJTkdcIl07XG5cbiAgdGhpcy5yZWFkeVN0YXRlID0gTW9ja1dlYlNvY2tldC5yZWFkeVN0YXRlc1tcIkNPTk5FQ1RJTkdcIl07XG4gIHNldFRpbWVvdXQodGhpcy5fb3Blbi5iaW5kKHRoaXMpLCAwKTtcblxuICAvLyBSZWNvcmQgb2YgZGlzcGF0Y2hlZCBldmVudHMuXG4gIHRoaXMuZGlzcGF0Y2hlZEV2ZW50cyA9IHt9O1xufVxuXG5Nb2NrV2ViU29ja2V0LnJlYWR5U3RhdGVzID0ge1xuICBcIkNPTk5FQ1RJTkdcIiA6IDAsXG4gIFwiT1BFTlwiIDogMSxcbiAgXCJDTE9TSU5HXCIgOiAyLFxuICBcIkNMT1NFRFwiIDogM1xufTtcblxuTW9ja1dlYlNvY2tldC5wcm90b3R5cGUuZGlzcGF0Y2hFdmVudCA9IGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG4gIHRoaXMuZGlzcGF0Y2hlZEV2ZW50c1tldmVudF0gPSBkYXRhO1xuICBpZiAodGhpcy5oYXNPd25Qcm9wZXJ0eShldmVudCkpIHtcbiAgICB0aGlzW2V2ZW50XShkYXRhKTtcbiAgfVxufTtcblxuTW9ja1dlYlNvY2tldC5wcm90b3R5cGUuX29wZW4gPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5yZWFkeVN0YXRlID0gTW9ja1dlYlNvY2tldC5yZWFkeVN0YXRlc1tcIk9QRU5cIl07XG4gIHRoaXMuZGlzcGF0Y2hFdmVudChcIm9ub3BlblwiKTtcbn07XG5cbk1vY2tXZWJTb2NrZXQucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbihkYXRhKSB7XG4gIHRoaXMuc2VudCA9IGRhdGE7XG59O1xuXG5Nb2NrV2ViU29ja2V0LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKGNvZGUsIHJlYXNvbikge1xuICB0aGlzLnJlYWR5U3RhdGUgPSBNb2NrV2ViU29ja2V0LnJlYWR5U3RhdGVzW1wiQ0xPU0VEXCJdO1xuICB0aGlzLmRpc3BhdGNoRXZlbnQoXCJvbmNsb3NlXCIsIHt9KTtcbn07XG5cbmRlc2NyaWJlKFwiY29yZS53ZWJzb2NrZXQgdW5wcml2aWxlZ2VkXCIsIGZ1bmN0aW9uKCkge1xuICB2YXIgd2Vic29ja2V0O1xuICB2YXIgV1NfVVJMID0gXCJ3czovL3AycGJyLmNvbTo4MDgyL3JvdXRlL1wiO1xuICB2YXIgZXZlbnRNYW5hZ2VyO1xuXG4gIGZ1bmN0aW9uIEV2ZW50TWFuYWdlcigpIHtcbiAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSB7fTtcbiAgICB0aGlzLmRpc3BhdGNoZWRFdmVudHMgPSB7fTtcbiAgfVxuXG4gIEV2ZW50TWFuYWdlci5wcm90b3R5cGUuZGlzcGF0Y2hFdmVudCA9IGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG4gICAgaWYgKCF0aGlzLmFjdGl2ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmRpc3BhdGNoZWRFdmVudHNbZXZlbnRdID0gZGF0YTtcbiAgICBpZiAodGhpcy5saXN0ZW5lcnNbZXZlbnRdKSB7XG4gICAgICB0aGlzLmxpc3RlbmVyc1tldmVudF0oZGF0YSk7XG4gICAgfVxuICB9O1xuXG4gIEV2ZW50TWFuYWdlci5wcm90b3R5cGUubGlzdGVuRm9yID0gZnVuY3Rpb24oZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgdGhpcy5saXN0ZW5lcnNbZXZlbnRdID0gbGlzdGVuZXI7XG4gIH07XG5cbiAgYmVmb3JlRWFjaChmdW5jdGlvbigpIHtcbiAgICBldmVudE1hbmFnZXIgPSBuZXcgRXZlbnRNYW5hZ2VyKCk7XG4gICAgdmFyIGRpc3BhdGNoRXZlbnQgPSBldmVudE1hbmFnZXIuZGlzcGF0Y2hFdmVudC5iaW5kKGV2ZW50TWFuYWdlcik7XG4gICAgd2Vic29ja2V0ID0gbmV3IFdTLnByb3ZpZGVyKHVuZGVmaW5lZCxkaXNwYXRjaEV2ZW50LFxuICAgICAgICAgICAgICAgICAgICAgICBXU19VUkwsIHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgTW9ja1dlYlNvY2tldCk7XG4gICAgc3B5T24oTW9ja1dlYlNvY2tldC5jdXJyZW50SW5zdGFuY2UsIFwic2VuZFwiKS5hbmQuY2FsbFRocm91Z2goKTtcbiAgICBzcHlPbihNb2NrV2ViU29ja2V0LmN1cnJlbnRJbnN0YW5jZSwgXCJjbG9zZVwiKS5hbmQuY2FsbFRocm91Z2goKTtcbiAgfSk7XG5cbiAgYWZ0ZXJFYWNoKGZ1bmN0aW9uKCkge1xuICAgIGV2ZW50TWFuYWdlci5hY3RpdmUgPSBmYWxzZTtcbiAgICBldmVudE1hbmFnZXIgPSB1bmRlZmluZWQ7XG4gICAgZGVsZXRlIE1vY2tXZWJTb2NrZXQuY3VycmVudEluc3RhbmNlO1xuICAgIHdlYnNvY2tldCA9IHVuZGVmaW5lZDtcbiAgfSk7XG5cbiAgaXQoXCJmaXJlcyBvbm9wZW5cIiwgZnVuY3Rpb24oZG9uZSkge1xuICAgIGZ1bmN0aW9uIG9uT3BlbigpIHtcbiAgICAgIGRvbmUoKTtcbiAgICB9XG4gICAgZXZlbnRNYW5hZ2VyLmxpc3RlbkZvcihcIm9uT3BlblwiLCBvbk9wZW4pO1xuICB9KTtcblxuICBpdChcImNsb3Nlc1wiLCBmdW5jdGlvbihkb25lKSB7XG5cbiAgICBmdW5jdGlvbiBjbG9zZUNvbnRpbnVhdGlvbihub29wLCBleGNlcHRpb24pIHtcbiAgICAgIGV4cGVjdChub29wKS5ub3QudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChleGNlcHRpb24pLm5vdC50b0JlRGVmaW5lZCgpO1xuXG4gICAgICB2YXIgbW9jayA9IE1vY2tXZWJTb2NrZXQuY3VycmVudEluc3RhbmNlO1xuICAgICAgZXhwZWN0KG1vY2suY2xvc2UuY2FsbHMuY291bnQoKSkudG9FcXVhbCgxKTtcbiAgICAgIGRvbmUoKTtcbiAgICB9XG5cbiAgICB3ZWJzb2NrZXQuY2xvc2UodW5kZWZpbmVkLCB1bmRlZmluZWQsIGNsb3NlQ29udGludWF0aW9uKTtcbiAgfSk7XG5cbiAgaXQoXCJzZW5kc1wiLCBmdW5jdGlvbihkb25lKSB7XG4gICAgLy8gV2Ugb25seSB0ZXN0IHN0cmluZ3MgYmVjYXVzZSBwaGFudG9tanMgZG9lc24ndCBzdXBwb3J0IEJsb2JzIG9yXG4gICAgLy8gQXJyYXlCdWZmZXJzLiA6KFxuICAgIHZhciBtZXNzYWdlID0ge1xuICAgICAgdGV4dDogXCJIZWxsbyBXb3JsZFwiXG4gICAgfTtcbiAgICBmdW5jdGlvbiBzZW5kQ29udGludWF0aW9uKCkge1xuICAgICAgdmFyIG1vY2sgPSBNb2NrV2ViU29ja2V0LmN1cnJlbnRJbnN0YW5jZTtcbiAgICAgIGV4cGVjdChtb2NrLnNlbmQuY2FsbHMuY291bnQoKSkudG9FcXVhbCgxKTtcbiAgICAgIGV4cGVjdChtb2NrLnNlbnQpLnRvRXF1YWwoXCJIZWxsbyBXb3JsZFwiKTtcbiAgICAgIGRvbmUoKTtcbiAgICB9XG4gICAgd2Vic29ja2V0LnNlbmQobWVzc2FnZSwgc2VuZENvbnRpbnVhdGlvbik7XG4gIH0pO1xuXG4gIGl0KFwic2VuZCBnaXZlcyBlcnJvciB3aXRoIGJhZCBkYXRhXCIsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICB2YXIgbWVzc2FnZSA9IHtcbiAgICB9O1xuICAgIGZ1bmN0aW9uIHNlbmRDb250aW51YXRpb24obm9vcCwgZXJyb3IpIHtcbiAgICAgIGV4cGVjdChlcnJvcikudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChlcnJvci5lcnJjb2RlKS50b0VxdWFsKFwiQkFEX1NFTkRcIik7XG4gICAgICBkb25lKCk7XG4gICAgfVxuICAgIHdlYnNvY2tldC5zZW5kKG1lc3NhZ2UsIHNlbmRDb250aW51YXRpb24pO1xuICB9KTtcblxuICBpdChcImdldHMgcmVhZHkgc3RhdGVcIiwgZnVuY3Rpb24oZG9uZSkge1xuICAgIHZhciBtb2NrID0gTW9ja1dlYlNvY2tldC5jdXJyZW50SW5zdGFuY2U7XG5cbiAgICBmdW5jdGlvbiByZWFkeVN0YXRlQ29udGludWF0aW9uKHN0YXRlKSB7XG4gICAgICBleHBlY3QobW9jay5yZWFkeVN0YXRlKS50b0VxdWFsKE1vY2tXZWJTb2NrZXQucmVhZHlTdGF0ZXNbXCJPUEVOXCJdKTtcbiAgICAgIGV4cGVjdChzdGF0ZSkudG9FcXVhbChNb2NrV2ViU29ja2V0LnJlYWR5U3RhdGVzW1wiT1BFTlwiXSk7XG4gICAgICBkb25lKCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uT3BlbigpIHtcbiAgICAgIGV4cGVjdChtb2NrLnJlYWR5U3RhdGUpLnRvRXF1YWwoTW9ja1dlYlNvY2tldC5yZWFkeVN0YXRlc1tcIk9QRU5cIl0pO1xuICAgICAgd2Vic29ja2V0LmdldFJlYWR5U3RhdGUocmVhZHlTdGF0ZUNvbnRpbnVhdGlvbik7ICBcbiAgICB9XG4gICAgXG4gICAgZXZlbnRNYW5hZ2VyLmxpc3RlbkZvcihcIm9uT3BlblwiLCBvbk9wZW4pO1xuICB9KTtcbiAgXG4gIGl0KFwicmVjZWl2ZXMgbWVzc2FnZXNcIiwgZnVuY3Rpb24oZG9uZSkge1xuICAgIGV2ZW50TWFuYWdlci5saXN0ZW5Gb3IoJ29uTWVzc2FnZScsIGZ1bmN0aW9uKG0pIHtcbiAgICAgIGV4cGVjdChtKS50b0VxdWFsKHt0ZXh0OiAnbXl0ZXh0J30pO1xuICAgICAgZG9uZSgpO1xuICAgIH0pO1xuICAgIE1vY2tXZWJTb2NrZXQuY3VycmVudEluc3RhbmNlLm9ubWVzc2FnZSh7ZGF0YTogJ215dGV4dCd9KTtcbiAgfSk7XG59KTtcbiIsInZhciB0ZXN0VXRpbCA9IHJlcXVpcmUoJy4uLy4uL3V0aWwnKTtcbnZhciBQcm92aWRlciA9IHJlcXVpcmUoJy4uLy4uLy4uL3Byb3ZpZGVycy9zb2NpYWwvbG9vcGJhY2svc29jaWFsLmxvb3BiYWNrJyk7XG5cbmRlc2NyaWJlKFwidW5pdDogc29jaWFsLmxvb3BiYWNrLmpzb25cIiwgZnVuY3Rpb24gKCkge1xuICB2YXIgcHJvdmlkZXI7XG5cbiAgYmVmb3JlRWFjaChmdW5jdGlvbigpIHtcbiAgICAvLyBDb21tZW50IGZvciBtb3JlIGRlYnVnZ2luZyBtZXNzYWdlcy5cbiAgICBzcHlPbihjb25zb2xlLCAnbG9nJyk7XG4gICAgXG4gICAgdmFyIHNvY2lhbCA9IHRlc3RVdGlsLmdldEFwaXMoKS5nZXQoXCJzb2NpYWxcIikuZGVmaW5pdGlvbjtcblxuICAgIGZyZWVkb20gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0ZXN0VXRpbC5tb2NrSWZhY2UoW10sIFtcbiAgICAgICAgWydTVEFUVVMnLCBzb2NpYWwuU1RBVFVTLnZhbHVlXSxcbiAgICAgICAgWydFUlJDT0RFJywgc29jaWFsLkVSUkNPREUudmFsdWVdXG4gICAgICBdKVxuICAgIH07XG5cbiAgICBwcm92aWRlciA9IG5ldyBQcm92aWRlci5wcm92aWRlcihqYXNtaW5lLmNyZWF0ZVNweSgnZGlzcGF0Y2hFdmVudCcpKTtcbiAgfSk7XG4gIFxuICBhZnRlckVhY2goZnVuY3Rpb24oKSB7XG4gIH0pO1xuIFxuICBpdChcImxvZ3MgaW5cIiwgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGQgPSBqYXNtaW5lLmNyZWF0ZVNweShcImxvZ2luXCIpO1xuICAgIHZhciBleHBlY3RlZFJlc3VsdCA9IHtcbiAgICAgIHVzZXJJZDogXCJUZXN0IFVzZXJcIixcbiAgICAgIGNsaWVudElkOiBcIlRlc3QgVXNlci4wXCIsXG4gICAgICBzdGF0dXM6IFwiT05MSU5FXCIsXG4gICAgICBsYXN0VXBkYXRlZDogamFzbWluZS5hbnkoTnVtYmVyKSxcbiAgICAgIGxhc3RTZWVuOiBqYXNtaW5lLmFueShOdW1iZXIpXG4gICAgfTtcbiAgICBwcm92aWRlci5sb2dpbih7fSwgZCk7XG4gICAgZXhwZWN0KGQpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICBleHBlY3QoZCkudG9IYXZlQmVlbkNhbGxlZFdpdGgoZXhwZWN0ZWRSZXN1bHQpO1xuICAgIGV4cGVjdChwcm92aWRlci5kaXNwYXRjaEV2ZW50KS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgZXhwZWN0KHByb3ZpZGVyLmRpc3BhdGNoRXZlbnQpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFwib25DbGllbnRTdGF0ZVwiLCBleHBlY3RlZFJlc3VsdCk7XG4gICAgZXhwZWN0KHByb3ZpZGVyLmRpc3BhdGNoRXZlbnQpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFwib25DbGllbnRTdGF0ZVwiLCB7XG4gICAgICB1c2VySWQ6IFwiT3RoZXIgVXNlclwiLFxuICAgICAgY2xpZW50SWQ6IFwiT3RoZXIgVXNlci4wXCIsXG4gICAgICBzdGF0dXM6IFwiT05MSU5FXCIsXG4gICAgICBsYXN0VXBkYXRlZDogamFzbWluZS5hbnkoTnVtYmVyKSxcbiAgICAgIGxhc3RTZWVuOiBqYXNtaW5lLmFueShOdW1iZXIpXG4gICAgfSk7XG4gICAgZXhwZWN0KHByb3ZpZGVyLmRpc3BhdGNoRXZlbnQpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFwib25Vc2VyUHJvZmlsZVwiLCB7XG4gICAgICB1c2VySWQ6IFwiVGVzdCBVc2VyXCIsXG4gICAgICBuYW1lOiBcIlRlc3QgVXNlclwiLFxuICAgICAgbGFzdFVwZGF0ZWQ6IGphc21pbmUuYW55KE51bWJlcilcbiAgICB9KTtcbiAgICBleHBlY3QocHJvdmlkZXIuZGlzcGF0Y2hFdmVudCkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXCJvblVzZXJQcm9maWxlXCIsIHtcbiAgICAgIHVzZXJJZDogXCJPdGhlciBVc2VyXCIsXG4gICAgICBuYW1lOiBcIk90aGVyIFVzZXJcIixcbiAgICAgIGxhc3RVcGRhdGVkOiBqYXNtaW5lLmFueShOdW1iZXIpXG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KFwiY2FuIGdldENsaWVudHNcIiwgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGQgPSBqYXNtaW5lLmNyZWF0ZVNweShcImdldENsaWVudHNcIik7XG4gICAgcHJvdmlkZXIubG9naW4oe30sIGZ1bmN0aW9uKCkge30pO1xuICAgIHByb3ZpZGVyLmdldENsaWVudHMoZCk7XG4gICAgZXhwZWN0KGQuY2FsbHMuY291bnQoKSkudG9FcXVhbCgxKTtcbiAgICBleHBlY3QoZC5jYWxscy5tb3N0UmVjZW50KCkuYXJncy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICBleHBlY3QoZC5jYWxscy5tb3N0UmVjZW50KCkuYXJnc1swXVtcIlRlc3QgVXNlci4wXCJdKS50b0JlRGVmaW5lZCgpO1xuICAgIGV4cGVjdChkLmNhbGxzLm1vc3RSZWNlbnQoKS5hcmdzWzBdW1wiVGVzdCBVc2VyLjBcIl0pLnRvRXF1YWwoe1xuICAgICAgdXNlcklkOiBcIlRlc3QgVXNlclwiLFxuICAgICAgY2xpZW50SWQ6IFwiVGVzdCBVc2VyLjBcIixcbiAgICAgIHN0YXR1czogXCJPTkxJTkVcIixcbiAgICAgIGxhc3RVcGRhdGVkOiBqYXNtaW5lLmFueShOdW1iZXIpLFxuICAgICAgbGFzdFNlZW46IGphc21pbmUuYW55KE51bWJlcilcbiAgICB9KTtcbiAgICBleHBlY3QoZC5jYWxscy5tb3N0UmVjZW50KCkuYXJnc1swXVtcIk90aGVyIFVzZXIuMFwiXSkudG9CZURlZmluZWQoKTtcbiAgICBleHBlY3QoZC5jYWxscy5tb3N0UmVjZW50KCkuYXJnc1swXVtcIk90aGVyIFVzZXIuMFwiXSkudG9FcXVhbCh7XG4gICAgICB1c2VySWQ6IFwiT3RoZXIgVXNlclwiLFxuICAgICAgY2xpZW50SWQ6IFwiT3RoZXIgVXNlci4wXCIsXG4gICAgICBzdGF0dXM6IFwiT05MSU5FXCIsXG4gICAgICBsYXN0VXBkYXRlZDogamFzbWluZS5hbnkoTnVtYmVyKSxcbiAgICAgIGxhc3RTZWVuOiBqYXNtaW5lLmFueShOdW1iZXIpXG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KFwiY2FuIGdldFVzZXJzXCIsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBkID0gamFzbWluZS5jcmVhdGVTcHkoXCJnZXRVc2Vyc1wiKTtcbiAgICBwcm92aWRlci5sb2dpbih7fSwgZnVuY3Rpb24oKSB7fSk7XG4gICAgcHJvdmlkZXIuZ2V0VXNlcnMoZCk7XG4gICAgZXhwZWN0KGQuY2FsbHMuY291bnQoKSkudG9FcXVhbCgxKTtcbiAgICBleHBlY3QoZC5jYWxscy5tb3N0UmVjZW50KCkuYXJncy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICBleHBlY3QoZC5jYWxscy5tb3N0UmVjZW50KCkuYXJnc1swXVtcIlRlc3QgVXNlclwiXSkudG9CZURlZmluZWQoKTtcbiAgICBleHBlY3QoZC5jYWxscy5tb3N0UmVjZW50KCkuYXJnc1swXVtcIlRlc3QgVXNlclwiXSkudG9FcXVhbCh7XG4gICAgICB1c2VySWQ6IFwiVGVzdCBVc2VyXCIsXG4gICAgICBuYW1lOiBcIlRlc3QgVXNlclwiLFxuICAgICAgbGFzdFVwZGF0ZWQ6IGphc21pbmUuYW55KE51bWJlcilcbiAgICB9KTtcbiAgICBleHBlY3QoZC5jYWxscy5tb3N0UmVjZW50KCkuYXJnc1swXVtcIk90aGVyIFVzZXJcIl0pLnRvQmVEZWZpbmVkKCk7XG4gICAgZXhwZWN0KGQuY2FsbHMubW9zdFJlY2VudCgpLmFyZ3NbMF1bXCJPdGhlciBVc2VyXCJdKS50b0VxdWFsKHtcbiAgICAgIHVzZXJJZDogXCJPdGhlciBVc2VyXCIsXG4gICAgICBuYW1lOiBcIk90aGVyIFVzZXJcIixcbiAgICAgIGxhc3RVcGRhdGVkOiBqYXNtaW5lLmFueShOdW1iZXIpXG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KFwibG9ncyBvdXRcIiwgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGQgPSBqYXNtaW5lLmNyZWF0ZVNweShcImxvZ291dFwiKTtcbiAgICBwcm92aWRlci5sb2dpbih7fSwgZnVuY3Rpb24oKSB7fSk7XG4gICAgcHJvdmlkZXIubG9nb3V0KGQpO1xuICAgIGV4cGVjdChkKS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgZXhwZWN0KHByb3ZpZGVyLmRpc3BhdGNoRXZlbnQpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICBleHBlY3QocHJvdmlkZXIuZGlzcGF0Y2hFdmVudCkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXCJvbkNsaWVudFN0YXRlXCIsIHtcbiAgICAgIHVzZXJJZDogXCJUZXN0IFVzZXJcIixcbiAgICAgIGNsaWVudElkOiBcIlRlc3QgVXNlci4wXCIsXG4gICAgICBzdGF0dXM6IFwiT0ZGTElORVwiLFxuICAgICAgbGFzdFVwZGF0ZWQ6IGphc21pbmUuYW55KE51bWJlciksXG4gICAgICBsYXN0U2VlbjogamFzbWluZS5hbnkoTnVtYmVyKVxuICAgIH0pO1xuICAgIGV4cGVjdChwcm92aWRlci5kaXNwYXRjaEV2ZW50KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcIm9uQ2xpZW50U3RhdGVcIiwge1xuICAgICAgdXNlcklkOiBcIk90aGVyIFVzZXJcIixcbiAgICAgIGNsaWVudElkOiBcIk90aGVyIFVzZXIuMFwiLFxuICAgICAgc3RhdHVzOiBcIk9GRkxJTkVcIixcbiAgICAgIGxhc3RVcGRhdGVkOiBqYXNtaW5lLmFueShOdW1iZXIpLFxuICAgICAgbGFzdFNlZW46IGphc21pbmUuYW55KE51bWJlcilcbiAgICB9KTtcbiAgXG4gIH0pO1xuXG4gIGl0KFwiZWNob3MgbWVzc2FnZXNcIiwgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGQgPSBqYXNtaW5lLmNyZWF0ZVNweShcInNlbmRNZXNzYWdlXCIpO1xuICAgIHByb3ZpZGVyLmxvZ2luKHt9LCBmdW5jdGlvbigpIHt9KTtcbiAgICBwcm92aWRlci5zZW5kTWVzc2FnZShcIk90aGVyIFVzZXJcIiwgXCJIZWxsbyBXb3JsZFwiLCBkKTtcbiAgICBleHBlY3QoZCkudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgIGV4cGVjdChwcm92aWRlci5kaXNwYXRjaEV2ZW50KS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgZXhwZWN0KHByb3ZpZGVyLmRpc3BhdGNoRXZlbnQpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFwib25NZXNzYWdlXCIsIHtcbiAgICAgIGZyb206IHtcbiAgICAgICAgdXNlcklkOiBcIk90aGVyIFVzZXJcIixcbiAgICAgICAgY2xpZW50SWQ6IFwiT3RoZXIgVXNlci4wXCIsXG4gICAgICAgIHN0YXR1czogXCJPTkxJTkVcIixcbiAgICAgICAgbGFzdFVwZGF0ZWQ6IGphc21pbmUuYW55KE51bWJlciksXG4gICAgICAgIGxhc3RTZWVuOiBqYXNtaW5lLmFueShOdW1iZXIpXG4gICAgICB9LFxuICAgICAgbWVzc2FnZTogXCJIZWxsbyBXb3JsZFwiXG4gICAgfSk7XG4gIH0pO1xuXG5cbn0pO1xuXG5cbiIsInZhciB0ZXN0VXRpbCA9IHJlcXVpcmUoJy4uLy4uL3V0aWwnKTtcbnZhciBQcm92aWRlciA9IHJlcXVpcmUoJy4uLy4uLy4uL3Byb3ZpZGVycy9zb2NpYWwvd2Vic29ja2V0LXNlcnZlci9zb2NpYWwud3MnKTtcblxuZGVzY3JpYmUoXCJ1bml0OiBzb2NpYWwud3MuanNvblwiLCBmdW5jdGlvbiAoKSB7XG4gIHZhciBwcm92aWRlciwgZGUsIHdzO1xuXG4gIGJlZm9yZUVhY2goZnVuY3Rpb24oKSB7XG4gICAgLy8gQ29tbWVudCBmb3IgbW9yZSBkZWJ1Z2dpbmcgbWVzc2FnZXMuXG4gICAgc3B5T24oY29uc29sZSwgJ2xvZycpO1xuXG4gICAgdmFyIHNvY2lhbCA9IHRlc3RVdGlsLmdldEFwaXMoKS5nZXQoXCJzb2NpYWxcIikuZGVmaW5pdGlvbjtcblxuICAgIGZyZWVkb20gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0ZXN0VXRpbC5tb2NrSWZhY2UoW10sIFtcbiAgICAgICAgWydTVEFUVVMnLCBzb2NpYWwuU1RBVFVTLnZhbHVlXSxcbiAgICAgICAgWydFUlJDT0RFJywgc29jaWFsLkVSUkNPREUudmFsdWVdXG4gICAgICBdKVxuICAgIH07XG5cbiAgICBqYXNtaW5lLmNsb2NrKCkuaW5zdGFsbCgpO1xuICAgIGRlID0gamFzbWluZS5jcmVhdGVTcHkoJ2Rpc3BhdGNoRXZlbnQnKTtcbiAgICB2YXIgd3Nwcm92ID0gZnVuY3Rpb24odXJsLCBwcm90b2NvbHMpIHtcbiAgICAgIHdzID0ge1xuICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgcHJvdG9jb2xzOiBwcm90b2NvbHMsXG4gICAgICAgIGNsb3NlOiBqYXNtaW5lLmNyZWF0ZVNweSgnY2xvc2UnKS5hbmQuY2FsbEZha2UoZnVuY3Rpb24oKSB7dGhpcy5vbkNsb3NlKCk7fSksXG4gICAgICAgIHNlbmQ6IGphc21pbmUuY3JlYXRlU3B5KCdzZW5kJyksXG4gICAgICAgIG9uOiBqYXNtaW5lLmNyZWF0ZVNweSgnb24nKS5hbmQuY2FsbEZha2UoZnVuY3Rpb24oZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgdGhpc1tldmVudF0gPSBjYWxsYmFjaztcbiAgICAgICAgfSlcbiAgICAgIH07XG4gICAgICByZXR1cm4gd3M7XG4gICAgfTtcbiAgICBwcm92aWRlciA9IG5ldyBQcm92aWRlci5wcm92aWRlcihkZSwgd3Nwcm92KTtcbiAgfSk7XG4gIFxuICBhZnRlckVhY2goZnVuY3Rpb24oKSB7XG4gICAgamFzbWluZS5jbG9jaygpLnVuaW5zdGFsbCgpO1xuICB9KTtcblxuICBmdW5jdGlvbiBtYWtlQ2xpZW50U3RhdGUoaWQsIHN0YXR1cykge1xuICAgIHJldHVybiB7XG4gICAgICB1c2VySWQ6IGlkLFxuICAgICAgY2xpZW50SWQ6IGlkLFxuICAgICAgc3RhdHVzOiBzdGF0dXMsXG4gICAgICBsYXN0VXBkYXRlZDogamFzbWluZS5hbnkoTnVtYmVyKSxcbiAgICAgIGxhc3RTZWVuOiBqYXNtaW5lLmFueShOdW1iZXIpXG4gICAgfTtcbiAgfVxuICBcbiAgaXQoXCJsb2dzIGluXCIsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBkID0gamFzbWluZS5jcmVhdGVTcHkoXCJsb2dpblwiKTtcbiAgICBwcm92aWRlci5sb2dpbih7fSwgZCk7XG4gICAgZXhwZWN0KGQpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKCk7XG5cbiAgICB3cy5vbk1lc3NhZ2Uoe3RleHQ6IEpTT04uc3RyaW5naWZ5KHsnY21kJzogJ3N0YXRlJywgJ2lkJzogJ3lvdXJJZCcsICdtc2cnOicnfSl9KTtcbiAgICBcbiAgICBleHBlY3QocHJvdmlkZXIuZGlzcGF0Y2hFdmVudCkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXCJvbkNsaWVudFN0YXRlXCIsIG1ha2VDbGllbnRTdGF0ZShcInlvdXJJZFwiLCBcIk9OTElORVwiKSk7XG4gICAgZXhwZWN0KGQpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKG1ha2VDbGllbnRTdGF0ZShcInlvdXJJZFwiLCBcIk9OTElORVwiKSwgdW5kZWZpbmVkKTtcbiAgfSk7XG5cbiAgaXQoXCJjYW4gZ2V0Q2xpZW50c1wiLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgZCA9IGphc21pbmUuY3JlYXRlU3B5KFwiZ2V0Um9zdGVyXCIpO1xuICAgIHByb3ZpZGVyLmxvZ2luKHt9LCBmdW5jdGlvbigpIHt9KTtcbiAgICB3cy5vbk1lc3NhZ2Uoe3RleHQ6IEpTT04uc3RyaW5naWZ5KHsnY21kJzogJ3N0YXRlJywgJ2lkJzogJ3lvdXJJZCcsICdtc2cnOlsndG9tJywgJ2JpbGwnXX0pfSk7XG4gICAgcHJvdmlkZXIuZ2V0Q2xpZW50cyhkKTtcbiAgICBleHBlY3QoZC5jYWxscy5jb3VudCgpKS50b0VxdWFsKDEpO1xuICAgIGV4cGVjdChkLmNhbGxzLm1vc3RSZWNlbnQoKS5hcmdzLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgIGV4cGVjdChkLmNhbGxzLm1vc3RSZWNlbnQoKS5hcmdzWzBdW1widG9tXCJdKS50b0VxdWFsKG1ha2VDbGllbnRTdGF0ZShcInRvbVwiLCBcIk9OTElORVwiKSk7XG4gICAgZXhwZWN0KGQuY2FsbHMubW9zdFJlY2VudCgpLmFyZ3NbMF1bXCJiaWxsXCJdKS50b0VxdWFsKG1ha2VDbGllbnRTdGF0ZShcImJpbGxcIiwgXCJPTkxJTkVcIikpO1xuICB9KTtcblxuICBpdChcImNhbiBnZXRVc2Vyc1wiLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgZCA9IGphc21pbmUuY3JlYXRlU3B5KFwiZ2V0Um9zdGVyXCIpO1xuICAgIHByb3ZpZGVyLmxvZ2luKHt9LCBmdW5jdGlvbigpIHt9KTtcbiAgICB3cy5vbk1lc3NhZ2Uoe3RleHQ6IEpTT04uc3RyaW5naWZ5KHsnY21kJzogJ3N0YXRlJywgJ2lkJzogJ3lvdXJJZCcsICdtc2cnOlsndG9tJywgJ2JpbGwnXX0pfSk7XG4gICAgcHJvdmlkZXIuZ2V0VXNlcnMoZCk7XG4gICAgZXhwZWN0KGQuY2FsbHMuY291bnQoKSkudG9FcXVhbCgxKTtcbiAgICBleHBlY3QoZC5jYWxscy5tb3N0UmVjZW50KCkuYXJncy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICBleHBlY3QoZC5jYWxscy5tb3N0UmVjZW50KCkuYXJnc1swXVtcInRvbVwiXSkudG9CZURlZmluZWQoKTtcbiAgICBleHBlY3QoZC5jYWxscy5tb3N0UmVjZW50KCkuYXJnc1swXVtcImJpbGxcIl0pLnRvRXF1YWwoe1xuICAgICAgdXNlcklkOiBcImJpbGxcIixcbiAgICAgIG5hbWU6IFwiYmlsbFwiLFxuICAgICAgbGFzdFVwZGF0ZWQ6IGphc21pbmUuYW55KE51bWJlcilcbiAgICB9KTtcbiAgfSk7XG5cblxuICBpdChcImxvZ3Mgb3V0XCIsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBkID0gamFzbWluZS5jcmVhdGVTcHkoXCJsb2dvdXRcIik7XG4gICAgcHJvdmlkZXIubG9naW4oe30sIGZ1bmN0aW9uKCkge30pO1xuICAgIHByb3ZpZGVyLmxvZ291dChkKTtcbiAgICBleHBlY3QoZCkudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgIGV4cGVjdChwcm92aWRlci5kaXNwYXRjaEV2ZW50KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcIm9uQ2xpZW50U3RhdGVcIiwgamFzbWluZS5vYmplY3RDb250YWluaW5nKHtcbiAgICAgIHN0YXR1czogXCJPRkZMSU5FXCJcbiAgICB9KSk7XG4gICAgZXhwZWN0KHdzLmNsb3NlKS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gIH0pO1xuXG4gIGl0KFwiZWNob3MgbWVzc2FnZXNcIiwgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGQgPSBqYXNtaW5lLmNyZWF0ZVNweShcInNlbmRNZXNzYWdlXCIpO1xuICAgIHByb3ZpZGVyLmxvZ2luKHt9LCBmdW5jdGlvbigpIHt9KTtcbiAgICB3cy5vbk1lc3NhZ2Uoe3RleHQ6IEpTT04uc3RyaW5naWZ5KHsnY21kJzogJ3N0YXRlJywgJ2lkJzogJ3lvdXJJZCcsICdtc2cnOlsndG9tJywgJ2JpbGwnXX0pfSk7XG4gICAgcHJvdmlkZXIuc2VuZE1lc3NhZ2UoXCJ0b21cIiwgXCJIZWxsbyBXb3JsZFwiLCBkKTtcbiAgICBleHBlY3Qod3Muc2VuZC5jYWxscy5tb3N0UmVjZW50KCkuYXJnc1swXSlcbiAgICAgIC50b0VxdWFsKHt0ZXh0OiBqYXNtaW5lLmFueShTdHJpbmcpfSk7XG4gICAgZXhwZWN0KGQpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcblxuICAgIHdzLm9uTWVzc2FnZSh7dGV4dDogSlNPTi5zdHJpbmdpZnkoeydjbWQnOiAnbWVzc2FnZScsICdmcm9tJzondG9tJywgJ21zZyc6J2hlbGxvJ30pfSk7XG4gICAgZXhwZWN0KHByb3ZpZGVyLmRpc3BhdGNoRXZlbnQpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFwib25NZXNzYWdlXCIsIHtcbiAgICAgIGZyb206IG1ha2VDbGllbnRTdGF0ZShcInRvbVwiLCBcIk9OTElORVwiKSxcbiAgICAgIG1lc3NhZ2U6IFwiaGVsbG9cIlxuICAgIH0pO1xuICB9KTtcbn0pO1xuXG5cbiIsInZhciB0ZXN0VXRpbCA9IHJlcXVpcmUoJy4uLy4uL3V0aWwnKTtcbnZhciBQcm92aWRlciA9IHJlcXVpcmUoJy4uLy4uLy4uL3Byb3ZpZGVycy9zdG9yYWdlL2lzb2xhdGVkL3N0b3JhZ2UuaXNvbGF0ZWQnKTtcbnZhciBQcm9taXNlQ29tcGF0ID0gcmVxdWlyZSgnZXM2LXByb21pc2UnKS5Qcm9taXNlO1xuXG5kZXNjcmliZShcInVuaXQ6IHN0b3JhZ2UuaXNvbGF0ZWQuanNvblwiLCBmdW5jdGlvbiAoKSB7XG4gIHZhciBwcm92aWRlciwgZmluaXNoQ29yZSwgcHJvbWlzZTtcbiAgYmVmb3JlRWFjaChmdW5jdGlvbigpIHtcbiAgICAvLyBDb21tZW50IGZvciBsb2cgbWVzc2FnZXMuXG4gICAgc3B5T24oY29uc29sZSwgXCJsb2dcIik7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlQ29tcGF0KGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICAgIGZpbmlzaENvcmUgPSByZXNvbHZlO1xuICAgIH0pO1xuXG4gICAgZnJlZWRvbSA9IHtcbiAgICAgIGNvcmU6IHRlc3RVdGlsLm1vY2tJZmFjZShbWydnZXRJZCcsIHByb21pc2VdXSksXG4gICAgICAnY29yZS5zdG9yYWdlJzogdGVzdFV0aWwubW9ja0lmYWNlKFtcbiAgICAgICAgWydrZXlzJywgWydteUlkO1Rlc3QnLCAnb3RoZXJUZXN0J11dLFxuICAgICAgICBbJ2dldCcsICd2YWx1ZSddLFxuICAgICAgICBbJ3NldCcsIHVuZGVmaW5lZF0sXG4gICAgICAgIFsncmVtb3ZlJywgdW5kZWZpbmVkXVxuICAgICAgXSlcbiAgICB9O1xuICAgIHByb3ZpZGVyID0gbmV3IFByb3ZpZGVyLnByb3ZpZGVyKG51bGwpO1xuICB9KTtcblxuICBpdChcInJldHVybnMgb3duZWQga2V5c1wiLCBmdW5jdGlvbihkb25lKSB7XG4gICAgZmluaXNoQ29yZShbJ215SWQnXSk7XG4gICAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGQgPSBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgZXhwZWN0KHByb3ZpZGVyLnN0b3JlLmtleXMpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICAgICAgZXhwZWN0KHJlc3VsdCkudG9FcXVhbChbJ1Rlc3QnXSk7XG4gICAgICAgIGRvbmUoKTtcbiAgICAgIH07XG4gICAgICBwcm92aWRlci5rZXlzKGQpO1xuICAgIH0pO1xuICB9KTtcblxuICBpdChcImdldHMgc2F2ZWQgaXRlbXNcIiwgZnVuY3Rpb24oZG9uZSkge1xuICAgIGZpbmlzaENvcmUoWydteUlkJ10pO1xuICAgIHZhciBkID0gZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICBleHBlY3QocHJvdmlkZXIuc3RvcmUuZ2V0KS50b0hhdmVCZWVuQ2FsbGVkV2l0aCgnbXlJZDtteWtleScpO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG9FcXVhbCgndmFsdWUnKTtcbiAgICAgIGRvbmUoKTtcbiAgICB9O1xuICAgIHByb3ZpZGVyLmdldCgnbXlrZXknLCBkKTtcbiAgfSk7XG5cbiAgaXQoXCJzZXRzIGl0ZW1zXCIsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICBmaW5pc2hDb3JlKFsnbXlJZCddKTtcbiAgICB2YXIgZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgZXhwZWN0KHByb3ZpZGVyLnN0b3JlLnNldCkudG9IYXZlQmVlbkNhbGxlZFdpdGgoJ215SWQ7bXlrZXknLCAnbXl2YWwnKTtcbiAgICAgIGRvbmUoKTtcbiAgICB9O1xuICAgIHByb3ZpZGVyLnNldCgnbXlrZXknLCAnbXl2YWwnLCBkKTtcbiAgfSk7XG5cbiAgaXQoXCJSZW1vdmVzIGl0ZW1zXCIsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICBmaW5pc2hDb3JlKFsnbXlJZCddKTtcbiAgICB2YXIgZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgZXhwZWN0KHByb3ZpZGVyLnN0b3JlLnJlbW92ZSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoJ215SWQ7bXlrZXknKTtcbiAgICAgIGRvbmUoKTtcbiAgICB9O1xuICAgIHByb3ZpZGVyLnJlbW92ZSgnbXlrZXknLCBkKTtcbiAgfSk7XG5cbiAgaXQoXCJDbGVhcnMgc3RvcmFnZVwiLCBmdW5jdGlvbihkb25lKSB7XG4gICAgZmluaXNoQ29yZShbJ215SWQnXSk7XG4gICAgdmFyIGQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGV4cGVjdChwcm92aWRlci5zdG9yZS5yZW1vdmUpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICAgIGRvbmUoKTtcbiAgICB9O1xuICAgIHByb3ZpZGVyLmNsZWFyKGQpO1xuICB9KTtcblxuICBpdChcIkJ1ZmZlcnMgdW50aWwgY29yZSBpcyByZWFkeVwiLCBmdW5jdGlvbihkb25lKSB7XG4gICAgdmFyIGNiID0gamFzbWluZS5jcmVhdGVTcHkoJ2J1ZmZlcicpO1xuICAgIHZhciBkID0gZnVuY3Rpb24oKSB7XG4gICAgICBkb25lKCk7XG4gICAgfTtcbiAgICBwcm92aWRlci5rZXlzKGNiKTtcbiAgICBwcm92aWRlci5zZXQoJ215a2V5JywgJ215dmFsJywgY2IpO1xuICAgIHByb3ZpZGVyLmdldCgnbXlrZXknLCBjYik7XG4gICAgcHJvdmlkZXIucmVtb3ZlKCdteWtleScsIGQpO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICBleHBlY3QoY2IpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICBmaW5pc2hDb3JlKFsnbXlJZCddKTtcbiAgICB9LCAwKTtcbiAgfSk7XG59KTtcbiIsInZhciB0ZXN0VXRpbCA9IHJlcXVpcmUoJy4uLy4uL3V0aWwnKTtcbnZhciBQcm92aWRlciA9IHJlcXVpcmUoJy4uLy4uLy4uL3Byb3ZpZGVycy9zdG9yYWdlL3NoYXJlZC9zdG9yYWdlLnNoYXJlZCcpO1xuXG5kZXNjcmliZShcInVuaXQ6IHN0b3JhZ2Uuc2hhcmVkLmpzb25cIiwgZnVuY3Rpb24gKCkge1xuICB2YXIgcHJvdmlkZXI7XG4gIGJlZm9yZUVhY2goZnVuY3Rpb24oKSB7XG4gICAgZnJlZWRvbSA9IHtcbiAgICAgIGNvcmU6IHRlc3RVdGlsLm1vY2tJZmFjZShbWydnZXRJZCcsIFsnbXlJZCddXV0pLFxuICAgICAgJ2NvcmUuc3RvcmFnZSc6IHRlc3RVdGlsLm1vY2tJZmFjZShbXG4gICAgICAgIFsna2V5cycsIFsnbXlJZDtUZXN0JywgJ290aGVyVGVzdCddXSxcbiAgICAgICAgWydnZXQnLCAndmFsdWUnXSxcbiAgICAgICAgWydzZXQnLCB1bmRlZmluZWRdLFxuICAgICAgICBbJ3JlbW92ZScsIHVuZGVmaW5lZF0sXG4gICAgICAgIFsnY2xlYXInLCB1bmRlZmluZWRdXG4gICAgICBdKVxuICAgIH07XG4gICAgcHJvdmlkZXIgPSBuZXcgUHJvdmlkZXIucHJvdmlkZXIoKTtcbiAgfSk7XG5cbiAgaXQoXCJyZXR1cm5zIG93bmVkIGtleXNcIiwgZnVuY3Rpb24oZG9uZSkge1xuICAgIHZhciBkID0gamFzbWluZS5jcmVhdGVTcHkoJ2tleXMnKTtcbiAgICBwcm92aWRlci5rZXlzKGQpO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICBleHBlY3QocHJvdmlkZXIuc3RvcmUua2V5cykudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgICAgZXhwZWN0KGQpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFsnbXlJZDtUZXN0JywgJ290aGVyVGVzdCddKTtcbiAgICAgIGRvbmUoKTtcbiAgICB9LCAwKTtcbiAgfSk7XG5cbiAgaXQoXCJnZXRzIHNhdmVkIGl0ZW1zXCIsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICB2YXIgZCA9IGphc21pbmUuY3JlYXRlU3B5KCdnZXQnKTtcbiAgICBwcm92aWRlci5nZXQoJ215a2V5JywgZCk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIGV4cGVjdChkKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCgndmFsdWUnKTtcbiAgICAgIGV4cGVjdChwcm92aWRlci5zdG9yZS5nZXQpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCdteWtleScpO1xuICAgICAgZG9uZSgpO1xuICAgIH0sIDApO1xuICB9KTtcblxuICBpdChcInNldHMgaXRlbXNcIiwgZnVuY3Rpb24oZG9uZSkge1xuICAgIHZhciBkID0gamFzbWluZS5jcmVhdGVTcHkoJ3NldCcpO1xuICAgIHByb3ZpZGVyLnNldCgnbXlrZXknLCAnbXl2YWwnLCBkKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgZXhwZWN0KGQpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICAgIGV4cGVjdChwcm92aWRlci5zdG9yZS5zZXQpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCdteWtleScsICdteXZhbCcpO1xuICAgICAgZG9uZSgpO1xuICAgIH0sIDApO1xuICB9KTtcblxuICBpdChcIlJlbW92ZXMgaXRlbXNcIiwgZnVuY3Rpb24oZG9uZSkge1xuICAgIHZhciBkID0gamFzbWluZS5jcmVhdGVTcHkoJ3JlbW92ZScpO1xuICAgIHByb3ZpZGVyLnJlbW92ZSgnbXlrZXknLCBkKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgZXhwZWN0KGQpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICAgIGV4cGVjdChwcm92aWRlci5zdG9yZS5yZW1vdmUpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCdteWtleScpO1xuICAgICAgZG9uZSgpO1xuICAgIH0pO1xuICB9KTtcblxuICBpdChcIkNsZWFycyBzdG9yYWdlXCIsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICB2YXIgZCA9IGphc21pbmUuY3JlYXRlU3B5KCdjbGVhcicpO1xuICAgIHByb3ZpZGVyLmNsZWFyKGQpO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICBleHBlY3QoZCkudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgICAgZXhwZWN0KHByb3ZpZGVyLnN0b3JlLmNsZWFyKS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICBkb25lKCk7XG4gICAgfSk7XG4gIH0pO1xuXG59KTtcblxuIiwidmFyIHRlc3RVdGlsID0gcmVxdWlyZSgnLi4vLi4vdXRpbCcpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi8uLi8uLi9zcmMvdXRpbCcpO1xudmFyIFByb3ZpZGVyID0gcmVxdWlyZSgnLi4vLi4vLi4vcHJvdmlkZXJzL3RyYW5zcG9ydC93ZWJydGMvdHJhbnNwb3J0LndlYnJ0YycpO1xuXG5kZXNjcmliZShcInVuaXQ6IHRyYW5zcG9ydC53ZWJydGMuanNvblwiLCBmdW5jdGlvbiAoKSB7XG4gIHZhciB0cmFuc3BvcnQsIHBlZXJjb25uZWN0aW9uLCBkaXNwYXRjaGVkRXZlbnRzO1xuICB2YXIgc2l6ZVRvQnVmZmVyID0gUHJvdmlkZXIucHJvdmlkZXIucHJvdG90eXBlLl9zaXplVG9CdWZmZXI7XG4gIHZhciBidWZmZXJUb1NpemUgPSBQcm92aWRlci5wcm92aWRlci5wcm90b3R5cGUuX2J1ZmZlclRvU2l6ZTtcbiAgZnVuY3Rpb24gZGVmaW5lU2xpY2UoYXJyYXlCdWZmZXIpIHtcbiAgICBhcnJheUJ1ZmZlci5zbGljZSA9IGZ1bmN0aW9uKGJlZ2luLCBlbmQpIHtcbiAgICAgIGJlZ2luID0gKGJlZ2lufDApIHx8IDA7XG4gICAgICB2YXIgbnVtID0gdGhpcy5ieXRlTGVuZ3RoO1xuICAgICAgZW5kID0gZW5kID09PSAodm9pZCAwKSA/IG51bSA6IChlbmR8MCk7XG5cbiAgICAgIC8vIEhhbmRsZSBuZWdhdGl2ZSB2YWx1ZXMuXG4gICAgICBpZiAoYmVnaW4gPCAwKSBiZWdpbiArPSBudW07XG4gICAgICBpZiAoZW5kIDwgMCkgZW5kICs9IG51bTtcblxuICAgICAgaWYgKG51bSA9PT0gMCB8fCBiZWdpbiA+PSBudW0gfHwgYmVnaW4gPj0gZW5kKSB7XG4gICAgICAgIHJldHVybiBuZXcgQXJyYXlCdWZmZXIoMCk7XG4gICAgICB9XG5cbiAgICAgIHZhciBsZW5ndGggPSBNYXRoLm1pbihudW0gLSBiZWdpbiwgZW5kIC0gYmVnaW4pO1xuICAgICAgdmFyIHRhcmdldCA9IG5ldyBBcnJheUJ1ZmZlcihsZW5ndGgpO1xuICAgICAgdmFyIHRhcmdldEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkodGFyZ2V0KTtcbiAgICAgIHRhcmdldEFycmF5LnNldChuZXcgVWludDhBcnJheSh0aGlzLCBiZWdpbiwgbGVuZ3RoKSk7XG4gICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH07XG4gIH1cblxuXG4gIC8vIEFkZHMgXCJvblwiIGxpc3RlbmVyIHRoYXQgY2FuIHJlZ2lzdGVyIGV2ZW50IGxpc3RlbmVycywgd2hpY2ggY2FuXG4gIC8vIGxhdGVyIGJlIGZpcmVkIHRocm91Z2ggXCJmaXJlRXZlbnRcIi4gSXQgaXMgZXhwZWN0ZWQgdGhhdCBsaXN0ZW5lcnNcbiAgLy8gd2lsbCBiZSByZWdzdGVyZWQgYmVmb3JlIGV2ZW50cyBhcmUgZmlyZWQuXG4gIGZ1bmN0aW9uIG1ha2VFdmVudFRhcmdldCh0YXJnZXQpIHtcbiAgICB2YXIgbGlzdGVuZXJzID0ge307XG4gICAgdGFyZ2V0Lm9uID0gZnVuY3Rpb24oZXZlbnQsIGZ1bmMpIHtcbiAgICAgIGlmIChsaXN0ZW5lcnNbZXZlbnRdKSB7XG4gICAgICAgIGxpc3RlbmVyc1tldmVudF0ucHVzaChmdW5jKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpc3RlbmVyc1tldmVudF0gPSBbZnVuY107XG4gICAgICB9XG4gICAgfTtcbiAgICB0YXJnZXQuZmlyZUV2ZW50ID0gZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcbiAgICAgIGV4cGVjdCh0YXJnZXQub24pLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKGV2ZW50LCBqYXNtaW5lLmFueShGdW5jdGlvbikpO1xuICAgICAgbGlzdGVuZXJzW2V2ZW50XS5mb3JFYWNoKGZ1bmN0aW9uKGxpc3RlbmVyKSB7XG4gICAgICAgIGxpc3RlbmVyKGRhdGEpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICB0YXJnZXQucmVtb3ZlTGlzdGVuZXJzID0gZnVuY3Rpb24oKSB7XG4gICAgICBsaXN0ZW5lcnMgPSB7fTtcbiAgICB9O1xuICAgIHNweU9uKHRhcmdldCwgXCJvblwiKS5hbmQuY2FsbFRocm91Z2goKTtcbiAgfVxuXG4gIGJlZm9yZUVhY2goZnVuY3Rpb24oZG9uZSkge1xuICAgIGRpc3BhdGNoZWRFdmVudHMgPSB7fTtcbiAgICBmcmVlZG9tID0ge1xuICAgICAgY29yZTogdGVzdFV0aWwubW9ja0lmYWNlKFtbXCJnZXRJZFwiLCBbXCJteUlkXCJdXV0pLFxuICAgICAgLy8gV2UgY2FuJ3QgdXNlIG1vY2tJZmFjZSBhbG9uZSwgd2UgbmVlZCB0byBtYWtlIHBlZXJjb25uZWN0aW9uXG4gICAgICAvLyBhbiBldmVudCB0YXJnZXQuXG4gICAgICBcImNvcmUucGVlcmNvbm5lY3Rpb25cIjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpZmFjZSA9IHRlc3RVdGlsLm1vY2tJZmFjZShbXG4gICAgICAgICAgW1wic2V0dXBcIiwgdW5kZWZpbmVkXSxcbiAgICAgICAgICBbXCJzZW5kXCIsIHVuZGVmaW5lZF0sXG4gICAgICAgICAgW1wib3BlbkRhdGFDaGFubmVsXCIsIHVuZGVmaW5lZF0sXG4gICAgICAgICAgW1wiY2xvc2VcIiwgdW5kZWZpbmVkXSxcbiAgICAgICAgICBbXCJnZXRCdWZmZXJlZEFtb3VudFwiLCAwXVxuICAgICAgICBdKTtcbiAgICAgICAgcGVlcmNvbm5lY3Rpb24gPSBpZmFjZSgpO1xuICAgICAgICBtYWtlRXZlbnRUYXJnZXQocGVlcmNvbm5lY3Rpb24pO1xuICAgICAgICByZXR1cm4gcGVlcmNvbm5lY3Rpb247XG4gICAgICB9XG4gICAgfTtcbiAgICB0cmFuc3BvcnQgPSBuZXcgUHJvdmlkZXIucHJvdmlkZXIoKTtcbiAgICB0cmFuc3BvcnQuZGlzcGF0Y2hFdmVudCA9IGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG4gICAgICBkaXNwYXRjaGVkRXZlbnRzW2V2ZW50XSA9IGRhdGE7XG4gICAgfTtcblxuICAgIHRyYW5zcG9ydC5zZXR1cChcInVuaXQtdGVzdHNcIiwgdW5kZWZpbmVkLCBwb3N0U2V0dXApO1xuICAgIGZ1bmN0aW9uIHBvc3RTZXR1cCgpIHtcbiAgICAgIGV4cGVjdChwZWVyY29ubmVjdGlvbi5zZXR1cCkudG9IYXZlQmVlbkNhbGxlZFdpdGgodW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidW5pdC10ZXN0c1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQcm92aWRlci5wcm92aWRlci5zdHVuX3NlcnZlcnMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhbHNlKTtcbiAgICAgIGRvbmUoKTtcbiAgICB9XG4gIH0pO1xuXG4gIGl0KFwiU2VuZHMgZGF0YVwiLCBmdW5jdGlvbihkb25lKSB7XG4gICAgdmFyIHRhZyA9IFwidGVzdCB0YWdcIjtcbiAgICB2YXIgZmlyc3RNZXNzYWdlID0gdXRpbC5zdHIyYWIoXCJIZWxsbyBXb3JsZFwiKTtcbiAgICB2YXIgc2Vjb25kTWVzc2FnZSA9IHV0aWwuc3RyMmFiKFwiV2VsbG8gSG9ybGRcIik7XG4gICAgc3B5T24odHJhbnNwb3J0LCBcInNlbmRcIikuYW5kLmNhbGxUaHJvdWdoKCk7XG4gICAgdHJhbnNwb3J0LnNlbmQodGFnLCBmaXJzdE1lc3NhZ2UsIGZpcnN0U2VuZENhbGxiYWNrKTtcbiAgICBmdW5jdGlvbiBmaXJzdFNlbmRDYWxsYmFjaygpIHtcbiAgICAgIHZhciBleHBlY3RlZE1lc3NhZ2UgPSBuZXcgQXJyYXlCdWZmZXIoZmlyc3RNZXNzYWdlLmJ5dGVMZW5ndGggKyA4KTtcbiAgICAgIHZhciB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoZXhwZWN0ZWRNZXNzYWdlKTtcbiAgICAgIHZpZXcuc2V0KHNpemVUb0J1ZmZlcihmaXJzdE1lc3NhZ2UuYnl0ZUxlbmd0aCkpO1xuICAgICAgdmlldy5zZXQoZmlyc3RNZXNzYWdlLCA4KTtcbiAgICAgIGV4cGVjdCh0cmFuc3BvcnQuX3RhZ3MpLnRvQ29udGFpbih0YWcpO1xuICAgICAgZXhwZWN0KHRyYW5zcG9ydC5zZW5kLmNhbGxzLmNvdW50KCkpLnRvQmUoMik7XG4gICAgICBleHBlY3QocGVlcmNvbm5lY3Rpb24uc2VuZCkuXG4gICAgICAgIHRvSGF2ZUJlZW5DYWxsZWRXaXRoKHtjaGFubmVsTGFiZWw6IHRhZywgYnVmZmVyOiBleHBlY3RlZE1lc3NhZ2V9KTtcbiAgICAgIC8vIENhbGwgYSBzZWNvbmQgdGltZSwgdG8gY2hlY2sgcGF0aCB0aGF0IGRvZXMgbm90IG5lZWQgdG9cbiAgICAgIC8vIGNyZWF0ZSBuZXcgdGFnLlxuICAgICAgdHJhbnNwb3J0LnNlbmQodGFnLCBzZWNvbmRNZXNzYWdlLCBzZWNvbmRTZW5kQ2FsbGJhY2spO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNlY29uZFNlbmRDYWxsYmFjaygpIHtcbiAgICAgIHZhciBleHBlY3RlZE1lc3NhZ2UgPSBuZXcgQXJyYXlCdWZmZXIoc2Vjb25kTWVzc2FnZS5ieXRlTGVuZ3RoICsgOCk7XG4gICAgICB2YXIgdmlldyA9IG5ldyBVaW50OEFycmF5KGV4cGVjdGVkTWVzc2FnZSk7XG4gICAgICB2aWV3LnNldChzaXplVG9CdWZmZXIoc2Vjb25kTWVzc2FnZS5ieXRlTGVuZ3RoKSk7XG4gICAgICB2aWV3LnNldChzZWNvbmRNZXNzYWdlLCA4KTtcbiAgICAgIGV4cGVjdCh0cmFuc3BvcnQuc2VuZC5jYWxscy5jb3VudCgpKS50b0JlKDMpO1xuICAgICAgZXhwZWN0KHBlZXJjb25uZWN0aW9uLnNlbmQpLlxuICAgICAgICB0b0hhdmVCZWVuQ2FsbGVkV2l0aCh7Y2hhbm5lbExhYmVsOiB0YWcsIGJ1ZmZlcjogZXhwZWN0ZWRNZXNzYWdlfSk7XG4gICAgICBkb25lKCk7XG4gICAgfVxuICB9KTtcblxuICBmdW5jdGlvbiBwcmludEJ1ZmZlcihidWZmZXIpIHtcbiAgICB2YXIgdGVzdCA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBidWZmZXIuYnl0ZUxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zb2xlLmxvZyh0ZXN0W2ldKTtcbiAgICB9XG4gIH1cblxuICB4aXQoXCJmaXJlcyBvbiBkYXRhIGV2ZW50XCIsIGZ1bmN0aW9uKCkge1xuICAgIHZhciB0YWcgPSBcInRlc3RcIjtcbiAgICB2YXIgZGF0YSA9IHV0aWwuc3RyMmFiKFwiSGVsbG8gV29ybGRcIik7XG4gICAgdmFyIHNpemVBc0J1ZmZlciA9IHNpemVUb0J1ZmZlcihkYXRhLmJ5dGVMZW5ndGgpO1xuICAgIHZhciB0b1NlbmQgPSBuZXcgQXJyYXlCdWZmZXIoZGF0YS5ieXRlTGVuZ3RoICsgOCk7XG4gICAgZGVmaW5lU2xpY2UodG9TZW5kKTtcbiAgICB2YXIgdmlldyA9IG5ldyBVaW50OEFycmF5KHRvU2VuZCk7XG4gICAgdmlldy5zZXQoc2l6ZUFzQnVmZmVyKTtcbiAgICB2aWV3LnNldChkYXRhLCA4KTtcbiAgICB2YXIgbWVzc2FnZSA9IHtjaGFubmVsTGFiZWw6IFwidGVzdFwiLFxuICAgICAgICAgICAgICAgICAgIGJ1ZmZlcjogdG9TZW5kfTtcbiAgICB0cmFuc3BvcnQub25EYXRhKG1lc3NhZ2UpO1xuICAgIGNvbnNvbGUuaW5mbyhkaXNwYXRjaGVkRXZlbnRzLm9uRGF0YS5kYXRhLmJ5dGVMZW5ndGgpO1xuICAgIGNvbnNvbGUuaW5mbyh1dGlsLmFiMnN0cihkaXNwYXRjaGVkRXZlbnRzLm9uRGF0YS5kYXRhKSk7XG4gICAgZXhwZWN0KGRpc3BhdGNoZWRFdmVudHMub25EYXRhKS50b0VxdWFsKHt0YWc6IHRhZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IGRhdGF9KTtcbiAgfSk7XG5cbiAgaXQoXCJjbG9zZXNcIiwgZnVuY3Rpb24oZG9uZSkge1xuICAgIHRyYW5zcG9ydC5jbG9zZShjbG9zZUNhbGxiYWNrKTtcbiAgICBmdW5jdGlvbiBjbG9zZUNhbGxiYWNrKCkge1xuICAgICAgZXhwZWN0KHBlZXJjb25uZWN0aW9uLmNsb3NlKS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICBkb25lKCk7XG4gICAgfVxuICB9KTtcblxuICBpdChcImZpcmVzIG9uQ2xvc2UgZXZlbnRcIiwgZnVuY3Rpb24oKSB7XG4gICAgcGVlcmNvbm5lY3Rpb24uZmlyZUV2ZW50KFwib25DbG9zZVwiLCB1bmRlZmluZWQpO1xuICAgIGV4cGVjdChkaXNwYXRjaGVkRXZlbnRzLm9uQ2xvc2UpLnRvQmVEZWZpbmVkKCk7XG4gIH0pO1xufSk7XG4iLCJ2YXIgQXBpID0gcmVxdWlyZSgnLi4vLi4vc3JjL2FwaScpO1xuXG5kZXNjcmliZShcIkFwaVwiLCBmdW5jdGlvbigpIHtcbiAgdmFyIGFwaTtcblxuICBiZWZvcmVFYWNoKGZ1bmN0aW9uKCkge1xuICAgIGFwaSA9IG5ldyBBcGkoKTtcbiAgfSk7XG5cbiAgaXQoXCJzaG91bGQgcmV0dXJuIHJlZ2lzdGVyZWQgcHJvdmlkZXJzXCIsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBwcm92aWRlciA9IHtpZDogXCJ0ZXN0XCJ9O1xuICAgIGFwaS5zZXQoJ2N1c3RvbU5hbWUnLCBwcm92aWRlcik7XG4gICAgZXhwZWN0KGFwaS5nZXQoJ2N1c3RvbU5hbWUnKS5kZWZpbml0aW9uKS50b0VxdWFsKHByb3ZpZGVyKTtcbiAgICBleHBlY3QoYXBpLmdldCgnY3VzdG9tTmFtZScpLm5hbWUpLnRvRXF1YWwoJ2N1c3RvbU5hbWUnKTtcbiAgICBleHBlY3QoYXBpLmdldCgnb3RoZXJOYW1lJykpLnRvQmVGYWxzeSgpO1xuICB9KTtcblxuICBpdChcInNob3VsZCBub3QgYWxsb3cgY29yZSBwcm92aWRlcnMgd2l0aG91dCBhbiBBUEkuXCIsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICB2YXIgcHJvdmlkZXIgPSBmdW5jdGlvbigpIHt9O1xuXG4gICAgYXBpLnJlZ2lzdGVyKCdjdXN0b21Db3JlJywgcHJvdmlkZXIpO1xuICAgIHZhciBjaGFubmVsID0gYXBpLmdldENvcmUoJ2N1c3RvbUNvcmUnLCBudWxsKTtcbiAgICBjaGFubmVsLnRoZW4oZnVuY3Rpb24oKSB7fSwgZnVuY3Rpb24oKSB7XG4gICAgICBkb25lKCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KFwic2hvdWxkIHJlZ2lzdGVyIGNvcmUgcHJvdmlkZXJzXCIsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICB2YXIgcHJvdmlkZXIgPSBmdW5jdGlvbihhcmcpIHsgdGhpcy5hcmcgPSBhcmcgfTtcblxuICAgIGFwaS5zZXQoJ2N1c3RvbUNvcmUnLCBwcm92aWRlcik7XG4gICAgYXBpLnJlZ2lzdGVyKCdjdXN0b21Db3JlJywgcHJvdmlkZXIpO1xuICAgIHZhciBjaGFubmVsID0gYXBpLmdldENvcmUoJ2N1c3RvbUNvcmUnLCAxMik7XG4gICAgY2hhbm5lbC50aGVuKGZ1bmN0aW9uKHByb3YpIHtcbiAgICAgIHZhciBvYmogPSBuZXcgcHJvdigpO1xuICAgICAgZXhwZWN0KG9iai5hcmcpLnRvRXF1YWwoMTIpO1xuICAgICAgZG9uZSgpO1xuICAgIH0pO1xuICB9KTtcbiAgXG4gIGl0KFwic2hvdWxkIHJlZ2lzdGVyIGNvcmUgcHJvdmlkZXJzIGluIHByb21pc2Ugc3R5bGVcIiwgZnVuY3Rpb24oZG9uZSkge1xuICAgIHZhciBwcm92aWRlciA9IGZ1bmN0aW9uKGFyZykgeyB0aGlzLmFyZyA9IGFyZyB9O1xuXG4gICAgYXBpLnNldCgnY3VzdG9tQ29yZScsIHByb3ZpZGVyKTtcbiAgICBhcGkucmVnaXN0ZXIoJ2N1c3RvbUNvcmUnLCBwcm92aWRlciwgJ3Byb3ZpZGVQcm9taXNlcycpO1xuICAgIHZhciBjaGFubmVsID0gYXBpLmdldENvcmUoJ2N1c3RvbUNvcmUnLCAxMik7XG4gICAgY2hhbm5lbC50aGVuKGZ1bmN0aW9uKHByb3YpIHtcbiAgICAgIHZhciBvYmogPSBuZXcgcHJvdigpO1xuICAgICAgZXhwZWN0KGFwaS5nZXRJbnRlcmZhY2VTdHlsZSgnY3VzdG9tQ29yZScpKS50b0VxdWFsKCdwcm92aWRlUHJvbWlzZXMnKTtcbiAgICAgIGV4cGVjdChvYmouYXJnKS50b0VxdWFsKDEyKTtcbiAgICAgIGRvbmUoKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgaXQoXCJhbGxvd3MgbGF0ZSByZWdpc3RyYXRpb24gb2YgY29yZSBwcm92aWRlcnNcIiwgZnVuY3Rpb24oZG9uZSkge1xuICAgIHZhciBwcm92aWRlciA9IGZ1bmN0aW9uKGFyZykgeyB0aGlzLmFyZyA9IGFyZyB9O1xuXG4gICAgYXBpLnNldCgnY3VzdG9tQ29yZScsIHByb3ZpZGVyKTtcbiAgICB2YXIgY2hhbm5lbCA9IGFwaS5nZXRDb3JlKCdjdXN0b21Db3JlJywgMTIpO1xuXG4gICAgdmFyIGFyZyA9IDA7XG4gICAgY2hhbm5lbC50aGVuKGZ1bmN0aW9uKHByb3YpIHtcbiAgICAgIHZhciBtaW5lID0gbmV3IHByb3YoKTtcbiAgICAgIGFyZyA9IG1pbmUuYXJnO1xuICAgICAgZXhwZWN0KGFyZykudG9FcXVhbCgxMik7XG4gICAgICBkb25lKCk7XG4gICAgfSk7XG5cbiAgICBleHBlY3QoYXJnKS50b0VxdWFsKDApO1xuICAgIFxuICAgIGFwaS5yZWdpc3RlcignY3VzdG9tQ29yZScsIHByb3ZpZGVyKTtcbiAgfSk7XG59KTtcbiIsInZhciBDb25zdW1lciA9IHJlcXVpcmUoJy4uLy4uL3NyYy9jb25zdW1lcicpO1xudmFyIEV2ZW50SW50ZXJmYWNlID0gcmVxdWlyZSgnLi4vLi4vc3JjL3Byb3h5L2V2ZW50SW50ZXJmYWNlJyk7XG5cbmRlc2NyaWJlKFwiQ29uc3VtZXJcIiwgZnVuY3Rpb24oKSB7XG4gIHZhciBwb3J0O1xuICBiZWZvcmVFYWNoKGZ1bmN0aW9uKCkge1xuICAgIHBvcnQgPSBuZXcgQ29uc3VtZXIoRXZlbnRJbnRlcmZhY2UpO1xuICB9KTtcblxuICBpdChcInJlcG9ydHMgbWVzc2FnZXMgYmFjayB0byB0aGUgcG9ydFwiLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgaWZhY2UgPSBwb3J0LmdldEludGVyZmFjZSgpO1xuICAgIGV4cGVjdChpZmFjZS5vbikudG9CZURlZmluZWQoKTtcbiAgICB2YXIgc3B5ID0gamFzbWluZS5jcmVhdGVTcHkoJ2NiJyk7XG4gICAgcG9ydC5vbignbWVzc2FnZScsIHNweSk7XG5cbiAgICAvLyBzZXR1cC5cbiAgICBwb3J0Lm9uTWVzc2FnZSgnZGVmYXVsdCcsIHtcbiAgICAgIGNoYW5uZWw6ICdtZXNzYWdlJ1xuICAgIH0pO1xuICAgIGV4cGVjdChzcHkpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKCk7XG5cbiAgICAvLyBleGlzdGluZyBpbnRlcmZhY2VzIG5vdyB3b3JrLlxuICAgIGlmYWNlLmVtaXQoJ2hpJywgJ21zZycpO1xuICAgIGV4cGVjdChzcHkpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICBcbiAgICAvLyBOZXcgaW50ZXJmYWNlcyBhbHNvIHdpbGwuXG4gICAgaWZhY2UgPSBwb3J0LmdldEludGVyZmFjZSgpO1xuICAgIGlmYWNlLmVtaXQoJ2hpJywgJ21zZycpO1xuICAgIGV4cGVjdChzcHkuY2FsbHMuY291bnQoKSkudG9FcXVhbCgyKTtcbiAgfSk7XG5cbiAgaXQoXCJyZXBvcnRzIG1lc3NhZ2VzIHRvIHRoZSBpbnRlcmZhY2VcIiwgZnVuY3Rpb24oKSB7XG4gICAgLy8gc2V0dXAuXG4gICAgcG9ydC5vbk1lc3NhZ2UoJ2RlZmF1bHQnLCB7XG4gICAgICBjaGFubmVsOiAnbWVzc2FnZSdcbiAgICB9KTtcbiAgICB2YXIgaWZhY2UgPSBwb3J0LmdldEludGVyZmFjZSgpO1xuICAgIHZhciBzcHkgPSBqYXNtaW5lLmNyZWF0ZVNweSgnY2InKTtcbiAgICBpZmFjZS5vbignbWVzc2FnZScsIHNweSk7XG4gICAgXG4gICAgcG9ydC5vbk1lc3NhZ2UoJ2RlZmF1bHQnLCB7dHlwZTonbWVzc2FnZScsIG1lc3NhZ2U6e3R5cGU6J21lc3NhZ2UnLCBtZXNzYWdlOiAndGhpbmcnfX0pO1xuICAgIGV4cGVjdChzcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCd0aGluZycpO1xuICB9KTtcbiAgXG4gIGl0KFwic2VuZHMgY29uc3RydWN0b3IgYXJndW1lbnRzIHRvIGFwcHJvcHJpYXRlIGludGVyZmFjZVwiLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJnID0gdW5kZWZpbmVkO1xuICAgIHZhciBteUludGVyZmFjZSA9IGZ1bmN0aW9uKG9uTXNnLCBlbWl0LCBkZWJ1ZywgeCkge1xuICAgICAgYXJnID0geDtcbiAgICB9O1xuICAgIC8vIHNldHVwLlxuICAgIHBvcnQgPSBuZXcgQ29uc3VtZXIobXlJbnRlcmZhY2UpO1xuXG4gICAgcG9ydC5vbk1lc3NhZ2UoJ2RlZmF1bHQnLCB7XG4gICAgICBjaGFubmVsOiAnbWVzc2FnZSdcbiAgICB9KTtcbiAgICB2YXIgaWZhY2UgPSBwb3J0LmdldEludGVyZmFjZSgnYXJnMScpO1xuICAgIGV4cGVjdChhcmcpLnRvRXF1YWwoJ2FyZzEnKTtcblxuICAgIGFyZyA9IHVuZGVmaW5lZDtcbiAgICB2YXIgcHJveHkgPSBwb3J0LmdldFByb3h5SW50ZXJmYWNlKCk7XG4gICAgcHJveHkoJ2FyZzEnKTtcbiAgICBleHBlY3QoYXJnKS50b0VxdWFsKCdhcmcxJyk7XG4gIH0pO1xuXG4gIGl0KFwiY2xvc2VzIHRoZSBpbnRlcmZhY2Ugd2hlbiBhc2tlZFwiLCBmdW5jdGlvbigpIHtcbiAgICAvLyBzZXR1cC5cbiAgICBwb3J0Lm9uTWVzc2FnZSgnY29udHJvbCcsIHtcbiAgICAgIHR5cGU6ICdzZXR1cCcsXG4gICAgICBjaGFubmVsOiAnY29udHJvbCdcbiAgICB9KTtcbiAgICBwb3J0Lm9uTWVzc2FnZSgnZGVmYXVsdCcsIHtcbiAgICAgIGNoYW5uZWw6ICdtZXNzYWdlJ1xuICAgIH0pO1xuICAgIHZhciBzcHkgPSBqYXNtaW5lLmNyZWF0ZVNweSgnY2InKTtcbiAgICBwb3J0Lm9uKCdtZXNzYWdlJywgc3B5KTtcbiAgICB2YXIgY2xvc2VTcHkgPSBqYXNtaW5lLmNyZWF0ZVNweSgnY2xvc2UnKTtcbiAgICBwb3J0Lm9uKCdjb250cm9sJywgY2xvc2VTcHkpO1xuXG4gICAgdmFyIHB1YmxpY1Byb3h5ID0gcG9ydC5nZXRQcm94eUludGVyZmFjZSgpO1xuICAgIHZhciBpZmFjZSA9IHB1YmxpY1Byb3h5KCk7XG4gICAgaWZhY2UuZW1pdCgnaGknLCAnbXNnJyk7XG5cbiAgICBleHBlY3Qoc3B5KS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgcHVibGljUHJveHkuY2xvc2UoKTtcbiAgICBpZmFjZS5lbWl0KCdoaScsICdtc2cnKTtcbiAgICBleHBlY3Qoc3B5LmNhbGxzLmNvdW50KCkpLnRvRXF1YWwoMSk7XG4gICAgZXhwZWN0KGNsb3NlU3B5KS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgZXhwZWN0KGNsb3NlU3B5LmNhbGxzLmFyZ3NGb3IoMClbMF0ucmVxdWVzdCkudG9FcXVhbCgnY2xvc2UnKTtcbiAgfSk7XG5cbiAgaXQoXCJyZXBvcnRzIGVycm9ycyB3aGVuIHRoZXkgb2NjdXJcIiwgZnVuY3Rpb24oKSB7XG4gICAgLy8gc2V0dXAuXG4gICAgcG9ydC5vbk1lc3NhZ2UoJ2NvbnRyb2wnLCB7XG4gICAgICB0eXBlOiAnc2V0dXAnLFxuICAgICAgY2hhbm5lbDogJ2NvbnRyb2wnXG4gICAgfSk7XG4gICAgcG9ydC5vbk1lc3NhZ2UoJ2RlZmF1bHQnLCB7XG4gICAgICBjaGFubmVsOiAnbWVzc2FnZSdcbiAgICB9KTtcbiAgICB2YXIgc3B5ID0gamFzbWluZS5jcmVhdGVTcHkoJ21zZycpO1xuICAgIHZhciBlc3B5ID0gamFzbWluZS5jcmVhdGVTcHkoJ2NiJyk7XG4gICAgcG9ydC5vbignbWVzc2FnZScsIHNweSk7XG5cbiAgICB2YXIgcHVibGljUHJveHkgPSBwb3J0LmdldFByb3h5SW50ZXJmYWNlKCk7XG4gICAgdmFyIGlmYWNlID0gcHVibGljUHJveHkoKTtcbiAgICBwdWJsaWNQcm94eS5vbkVycm9yKGVzcHkpO1xuICAgIGlmYWNlLmVtaXQoJ2hpJywgJ21zZycpO1xuICAgIGV4cGVjdChzcHkpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcblxuICAgIGV4cGVjdChlc3B5KS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgIHBvcnQub25NZXNzYWdlKCdkZWZhdWx0Jywge1xuICAgICAgdHlwZTogJ2Vycm9yJyxcbiAgICAgIHRvOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6ICdtc2cnXG4gICAgfSk7XG4gICAgZXhwZWN0KGVzcHkpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgfSk7XG59KTtcbiIsInZhciBEZWJ1ZyA9IHJlcXVpcmUoJy4uLy4uL3NyYy9kZWJ1Zy5qcycpO1xuXG5kZXNjcmliZShcIkRlYnVnXCIsIGZ1bmN0aW9uKCkge1xuICB2YXIgZGVidWcsIGFjdGl2ZUxvZ2dlciwgb25Mb2dnZXI7XG4gIHZhciBMb2dnZXIgPSBmdW5jdGlvbigpIHtcbiAgICBhY3RpdmVMb2dnZXIgPSB0aGlzO1xuICAgIHRoaXMuc3B5ID0gamFzbWluZS5jcmVhdGVTcHkoJ2xvZycpO1xuICAgIHRoaXMubG9nID0gZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnNweShhcmd1bWVudHNbMF0sIGFyZ3VtZW50c1sxXSk7XG4gICAgICBvbkxvZ2dlcigpO1xuICAgIH07XG4gICAgdGhpcy53YXJuID0gZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnNweShhcmd1bWVudHNbMF0sIGFyZ3VtZW50c1sxXSk7XG4gICAgICBvbkxvZ2dlcigpO1xuICAgIH07XG4gIH07XG5cbiAgYmVmb3JlRWFjaChmdW5jdGlvbigpIHtcbiAgICBkZWJ1ZyA9IG5ldyBEZWJ1ZygpO1xuICB9KTtcblxuICBpdChcIlJlbGF5cyBNZXNzYWdlc1wiLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3B5ID0gamFzbWluZS5jcmVhdGVTcHkoJ2NiJyk7XG4gICAgZGVidWcub24oJ21zZycsIHNweSk7XG5cbiAgICBkZWJ1Zy5sb2coJ3Rlc3QxJyk7XG4gICAgZGVidWcud2FybigndGVzdDInKTtcbiAgICBkZWJ1Zy5lcnJvcigndGVzdDMnKTtcbiAgICBkZWJ1Zy5mb3JtYXQoJ2xvZycsICdzb3VyY2UnLCAnbWVzc2FnZScpO1xuICAgIGV4cGVjdChzcHkpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKCk7XG5cbiAgICBkZWJ1Zy5vbk1lc3NhZ2UoJ2NvbnRyb2wnLCB7XG4gICAgICBjaGFubmVsOiAnbXNnJyxcbiAgICAgIGNvbmZpZzoge1xuICAgICAgICBkZWJ1ZzogdHJ1ZSxcbiAgICAgICAgZ2xvYmFsOiB7fVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgZXhwZWN0KHNweSkudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgIGV4cGVjdChzcHkuY2FsbHMuY291bnQoKSkudG9FcXVhbCg0KTtcbiAgfSk7XG5cbiAgaXQoXCJQcmludHMgdG8gYSBwcm92aWRlclwiLCBmdW5jdGlvbihkb25lKSB7XG4gICAgdmFyIGxvZyA9IG5ldyBMb2dnZXIoKTtcbiAgICBkZWJ1Zy5zZXRMb2dnZXIobG9nKTtcblxuICAgIHZhciBtc2cgPSB7XG4gICAgICBzZXZlcml0eTogJ2xvZycsXG4gICAgICBzb3VyY2U6IG51bGwsXG4gICAgICBtc2c6IEpTT04uc3RyaW5naWZ5KFtcIk15IE1lc3NhZ2VcIl0pXG4gICAgfVxuXG4gICAgb25Mb2dnZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIGV4cGVjdChhY3RpdmVMb2dnZXIubG9nKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KGFjdGl2ZUxvZ2dlci5zcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKG51bGwsIFtcIk15IE1lc3NhZ2VcIl0pO1xuICAgICAgZG9uZSgpO1xuICAgICAgb25Mb2dnZXIgPSBmdW5jdGlvbigpIHt9O1xuICAgIH07XG5cbiAgICBkZWJ1Zy5wcmludChtc2cpO1xufSk7XG59KTtcbiIsInZhciB0ZXN0VXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxuLy9SdW4gamFzbWluZSB0ZXN0cyB3aXRoIDEwIHNlY29uZCB0aW1lb3V0LlxuamFzbWluZS5ERUZBVUxUX1RJTUVPVVRfSU5URVJWQUwgPSAxMDAwMDtcblxuZGVzY3JpYmUoXCJmcmVlZG9tXCIsIGZ1bmN0aW9uKCkge1xuICB2YXIgZnJlZWRvbTtcbiAgYmVmb3JlRWFjaChmdW5jdGlvbigpIHtcbiAgICB0ZXN0VXRpbC5zZXRDb3JlUHJvdmlkZXJzKFtcbiAgICAgIHJlcXVpcmUoJy4uLy4uL3Byb3ZpZGVycy9jb3JlL2NvcmUudW5wcml2aWxlZ2VkJyksXG4gICAgICByZXF1aXJlKCcuLi8uLi9wcm92aWRlcnMvY29yZS9jb25zb2xlLnVucHJpdmlsZWdlZCcpXG4gICAgXSk7XG4gICAgZnJlZWRvbSA9IHRlc3RVdGlsLnNldHVwTW9kdWxlKFwicmVsYXRpdmU6Ly9zcGVjL2hlbHBlci9tYW5pZmVzdC5qc29uXCIpO1xuICB9KTtcbiAgXG4gIGFmdGVyRWFjaChmdW5jdGlvbigpIHtcbiAgICB0ZXN0VXRpbC5jbGVhbnVwSWZyYW1lcygpO1xuICAgIGZyZWVkb20gPSBudWxsO1xuICB9KTtcblxuICBpdChcImNyZWF0ZXMgbW9kdWxlc1wiLCBmdW5jdGlvbihkb25lKSB7XG4gICAgZnJlZWRvbS50aGVuKGZ1bmN0aW9uKGlmYWNlKSB7XG4gICAgICB2YXIgYXBwID0gaWZhY2UoKTtcbiAgICAgIGFwcC5vbignb3V0cHV0JywgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgZXhwZWN0KHZhbHVlKS50b0VxdWFsKCdyb3VuZHRyaXAnKTtcbiAgICAgICAgZG9uZSgpO1xuICAgICAgfSk7XG4gICAgICBhcHAuZW1pdCgnaW5wdXQnLCAncm91bmR0cmlwJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KFwiQ3JlYXRlcyBjaGlsZCBtb2R1bGVzXCIsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICBmcmVlZG9tLnRoZW4oZnVuY3Rpb24oaWZhY2UpIHtcbiAgICAgIHZhciBhcHAgPSBpZmFjZSgpO1xuICAgICAgYXBwLm9uKCdjaGlsZC1vdXRwdXQnLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBleHBlY3QodmFsdWUpLnRvRXF1YWwoJ2NoaWxkLXJvdW5kdHJpcCcpO1xuICAgICAgICBkb25lKCk7XG4gICAgICB9KTtcbiAgICAgIGFwcC5lbWl0KCdjaGlsZC1pbnB1dCcsICdjaGlsZC1yb3VuZHRyaXAnKTtcbiAgICB9KTtcbiAgfSk7XG4gIFxuICBpdChcIkhhbmRsZXMgbWFuaWZlc3QtZGVmaW5lZCBBUElzXCIsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICBmcmVlZG9tLnRoZW4oZnVuY3Rpb24oaWZhY2UpIHtcbiAgICAgIHZhciBhcHAgPSBpZmFjZSgpO1xuICAgICAgYXBwLm9uKCdsb2cnLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICB2YXIgbG9nID0gSlNPTi5wYXJzZSh2YWx1ZSk7XG4gICAgICAgIGlmIChsb2cubGVuZ3RoIDwgMikge1xuICAgICAgICAgIGFwcC5lbWl0KCdnZXQtbG9nJyk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGV4cGVjdChsb2dbMF1bMl0pLnRvRXF1YWwoJ2xvZyBNc2cnKTtcbiAgICAgICAgZXhwZWN0KGxvZ1sxXVsyXSkudG9FcXVhbCgnYW5vdGhlciBMb2cnKTtcbiAgICAgICAgZXhwZWN0KGxvZ1sxXVswXSAtIGxvZ1swXVswXSkudG9CZUdyZWF0ZXJUaGFuKC0xKTtcbiAgICAgICAgZG9uZSgpO1xuICAgICAgfSk7XG4gICAgICBhcHAuZW1pdCgnZG8tbG9nJywgJ2xvZyBNc2cnKTtcbiAgICAgIGFwcC5lbWl0KCdkby1sb2cnLCAnYW5vdGhlciBMb2cnKTtcbiAgICAgIGFwcC5lbWl0KCdnZXQtbG9nJyk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG5cbmRlc2NyaWJlKFwiZnJlZWRvbSBpbnN0YW5jZXNcIiwgZnVuY3Rpb24oKSB7XG4gIHZhciBmcmVlZG9tO1xuICBiZWZvcmVFYWNoKGZ1bmN0aW9uKCkge1xuICAgIHRlc3RVdGlsLnNldENvcmVQcm92aWRlcnMoW1xuICAgICAgcmVxdWlyZSgnLi4vLi4vcHJvdmlkZXJzL2NvcmUvY29yZS51bnByaXZpbGVnZWQnKSxcbiAgICAgIHJlcXVpcmUoJy4uLy4uL3Byb3ZpZGVycy9jb3JlL2NvbnNvbGUudW5wcml2aWxlZ2VkJylcbiAgICBdKTtcbiAgfSk7XG5cbiAgaXQoXCJTdXBwb3J0cyBjdXN0b20gbG9nZ2Vyc1wiLCBmdW5jdGlvbihkb25lKSB7XG4gICAgZnJlZWRvbSA9IHRlc3RVdGlsLnNldHVwTW9kdWxlKFwicmVsYXRpdmU6Ly9zcGVjL2hlbHBlci9tYW5pZmVzdC5qc29uXCIsIHtcbiAgICAgIGxvZ2dlcjogXCJyZWxhdGl2ZTovL3NwZWMvaGVscGVyL2xvZ2dlci5qc29uXCJcbiAgICB9KTtcbiAgICBmcmVlZG9tLnRoZW4oZnVuY3Rpb24gKGlmYWNlKSB7XG4gICAgICB2YXIgYXBwID0gaWZhY2UoKTtcbiAgICAgIGFwcC5vbignbG9nJywgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgdmFyIGxvZyA9IEpTT04ucGFyc2UodmFsdWUpO1xuICAgICAgICBleHBlY3QobG9nLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgICBkb25lKCk7XG4gICAgICB9KTtcbiAgICAgIGFwcC5lbWl0KCdnZXQtbG9nJyk7XG4gICAgfSk7XG4gIH0pO1xuICBcbiAgYWZ0ZXJFYWNoKGZ1bmN0aW9uKCkge1xuICAgIHRlc3RVdGlsLmNsZWFudXBJZnJhbWVzKCk7XG4gICAgZnJlZWRvbSA9IG51bGw7XG4gIH0pO1xufSk7IiwidmFyIGVudHJ5ID0gcmVxdWlyZSgnLi4vLi4vc3JjL2VudHJ5Jyk7XG52YXIgdGVzdFV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG52YXIgZGlyZWN0ID0gcmVxdWlyZSgnLi4vLi4vc3JjL2xpbmsvZGlyZWN0Jyk7XG5cbmRlc2NyaWJlKFwiRnJlZWRvbU1vZHVsZVwiLCBmdW5jdGlvbigpIHtcbiAgdmFyIGZyZWVkb20sIGdsb2JhbCwgaCA9IFtdO1xuICBiZWZvcmVFYWNoKGZ1bmN0aW9uKCkge1xuICAgIGdsb2JhbCA9IHtcbiAgICAgIGRpcmVjdExpbms6IHtcbiAgICAgICAgZW1pdDogZnVuY3Rpb24oZmxvdywgbXNnKSB7XG4gICAgICAgICAgaC5wdXNoKFtmbG93LCBtc2ddKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgcGF0aCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLFxuICAgICAgICBkaXJfaWR4ID0gcGF0aC5sYXN0SW5kZXhPZignLycpLFxuICAgICAgICBkaXIgPSBwYXRoLnN1YnN0cigwLCBkaXJfaWR4KSArICcvJztcbiAgICBmcmVlZG9tID0gZW50cnkoe1xuICAgICAgJ3BvcnRUeXBlJzogZGlyZWN0LFxuICAgICAgJ2lzTW9kdWxlJzogdHJ1ZSxcbiAgICAgICdwcm92aWRlcnMnOiBbXSxcbiAgICAgICdnbG9iYWwnOiBnbG9iYWxcbiAgICB9KTtcbiAgfSk7XG4gIFxuICBpdChcIkluaXRpYXRlcyBjb25uZWN0aW9uIG91dHdhcmRzLlwiLCBmdW5jdGlvbigpIHtcbiAgICBleHBlY3QoaC5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgfSk7XG59KTtcbiIsInZhciBIdWIgPSByZXF1aXJlKCcuLi8uLi9zcmMvaHViJyk7XG52YXIgRGVidWcgPSByZXF1aXJlKCcuLi8uLi9zcmMvZGVidWcnKTtcblxuZGVzY3JpYmUoXCJIdWJcIiwgZnVuY3Rpb24oKSB7XG4gIHZhciBodWIsIGRlYnVnO1xuXG4gIGJlZm9yZUVhY2goZnVuY3Rpb24oKSB7XG4gICAgZGVidWcgPSBuZXcgRGVidWcoKTtcbiAgICBodWIgPSBuZXcgSHViKGRlYnVnKTtcbiAgfSk7XG5cbiAgaXQoXCJyb3V0ZXMgbWVzc2FnZXNcIiwgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFwcCA9IHtcbiAgICAgIGlkOiAndGVzdEFwcCdcbiAgICB9O1xuICAgIGh1Yi5yZWdpc3RlcihhcHApO1xuICAgIGFwcC5vbk1lc3NhZ2UgPSBqYXNtaW5lLmNyZWF0ZVNweSgnY2InKTtcbiAgICB2YXIgcm91dGUgPSBodWIuaW5zdGFsbChhcHAsICd0ZXN0QXBwJywgJ3Rlc3QnKTtcbiAgICBcbiAgICB2YXIgbXNnID0ge3Rlc3Q6IHRydWV9O1xuICAgIGh1Yi5vbk1lc3NhZ2Uocm91dGUsIG1zZyk7XG5cbiAgICBleHBlY3QoYXBwLm9uTWVzc2FnZSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoJ3Rlc3QnLCBtc2cpO1xuICB9KTtcblxuICBpdChcInJlcXVpcmVzIHJlZ2lzdHJhdGlvblwiLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXBwID0ge1xuICAgICAgaWQ6ICd0ZXN0QXBwJ1xuICAgIH07XG4gICAgc3B5T24oZGVidWcsICd3YXJuJyk7XG4gICAgaHViLmluc3RhbGwoYXBwLCBudWxsLCAnbWFnaWMnKTtcbiAgICBleHBlY3QoZGVidWcud2FybikudG9IYXZlQmVlbkNhbGxlZCgpO1xuXG4gICAgaHViLnJlZ2lzdGVyKGFwcCk7XG4gICAgaHViLmluc3RhbGwoYXBwLCBudWxsLCAnbWFnaWMnKTtcbiAgICBleHBlY3QoZGVidWcud2Fybi5jYWxscy5jb3VudCgpKS50b0VxdWFsKDIpO1xuICAgIGV4cGVjdChodWIucmVnaXN0ZXIoYXBwKSkudG9FcXVhbChmYWxzZSk7XG5cbiAgICBleHBlY3QoaHViLmRlcmVnaXN0ZXIoYXBwKSkudG9FcXVhbCh0cnVlKTtcbiAgICBleHBlY3QoaHViLmRlcmVnaXN0ZXIoYXBwKSkudG9FcXVhbChmYWxzZSk7XG4gIH0pO1xuXG4gIGl0KFwiZ29lcyBiZXR3ZWVuIGFwcHNcIiwgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFwcDEgPSB7XG4gICAgICBpZDogJ3Rlc3RBcHAnXG4gICAgfTtcbiAgICB2YXIgYXBwMiA9IHtcbiAgICAgIGlkOiAnb3RoZXJBcHAnXG4gICAgfTtcbiAgICBodWIucmVnaXN0ZXIoYXBwMSk7XG4gICAgaHViLnJlZ2lzdGVyKGFwcDIpO1xuICAgIGFwcDIub25NZXNzYWdlID0gamFzbWluZS5jcmVhdGVTcHkoJ2NiJyk7XG4gICAgdmFyIHJvdXRlID0gaHViLmluc3RhbGwoYXBwMSwgJ290aGVyQXBwJywgJ3Rlc3R4Jyk7XG4gICAgXG4gICAgdmFyIG1zZyA9IHt0ZXN0OiB0cnVlfTtcbiAgICBodWIub25NZXNzYWdlKHJvdXRlLCBtc2cpO1xuXG4gICAgZXhwZWN0KGFwcDIub25NZXNzYWdlKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCgndGVzdHgnLCBtc2cpO1xuICB9KTtcblxuICBpdChcImFsZXJ0cyBpZiBtZXNzYWdlcyBhcmUgc2VudCBpbXByb3Blcmx5XCIsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcHAgPSB7XG4gICAgICBpZDogJ3Rlc3RBcHAnXG4gICAgfTtcbiAgICBodWIucmVnaXN0ZXIoYXBwKTtcbiAgICBhcHAub25NZXNzYWdlID0gamFzbWluZS5jcmVhdGVTcHkoJ2NiJyk7XG5cbiAgICBzcHlPbihkZWJ1ZywgJ3dhcm4nKTtcbiAgICBcbiAgICBodWIub25NZXNzYWdlKCd0ZXN0JywgXCJ0ZXN0aW5nXCIpO1xuXG4gICAgZXhwZWN0KGFwcC5vbk1lc3NhZ2UpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgZXhwZWN0KGRlYnVnLndhcm4pLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgfSk7XG5cbiAgaXQoXCJyZW1vdmVzIHJvdXRlc1wiLCBmdW5jdGlvbigpIHtcbiAgICBzcHlPbihkZWJ1ZywgJ3dhcm4nKTtcbiAgICB2YXIgYXBwMSA9IHtcbiAgICAgIGlkOiAndGVzdEFwcCdcbiAgICB9O1xuICAgIHZhciBhcHAyID0ge1xuICAgICAgaWQ6ICdvdGhlckFwcCdcbiAgICB9O1xuICAgIGh1Yi5yZWdpc3RlcihhcHAxKTtcbiAgICBodWIucmVnaXN0ZXIoYXBwMik7XG4gICAgYXBwMi5vbk1lc3NhZ2UgPSBqYXNtaW5lLmNyZWF0ZVNweSgnY2InKTtcbiAgICB2YXIgcm91dGUgPSBodWIuaW5zdGFsbChhcHAxLCAnb3RoZXJBcHAnLCAndGVzdHgnKTtcbiAgICBcbiAgICB2YXIgbXNnID0ge3Rlc3Q6IHRydWV9O1xuICAgIGh1Yi5vbk1lc3NhZ2Uocm91dGUsIG1zZyk7XG5cbiAgICBleHBlY3QoYXBwMi5vbk1lc3NhZ2UpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCd0ZXN0eCcsIG1zZyk7XG5cbiAgICBodWIudW5pbnN0YWxsKGFwcDEsIHJvdXRlKTtcblxuICAgIGV4cGVjdChkZWJ1Zy53YXJuKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpO1xuXG4gICAgaHViLm9uTWVzc2FnZShyb3V0ZSwgbXNnKTtcbiAgICBleHBlY3QoZGVidWcud2FybikudG9IYXZlQmVlbkNhbGxlZCgpO1xuICB9KTtcblxuICBpdChcIkhhbmRsZXMgZmFpbHVyZXMgd2hlbiByZW1vdmluZyByb3V0ZXNcIiwgZnVuY3Rpb24oKSB7XG4gICAgc3B5T24oZGVidWcsICd3YXJuJyk7XG4gICAgdmFyIGFwcDEgPSB7XG4gICAgICBpZDogJ3Rlc3RBcHAnXG4gICAgfTtcbiAgICB2YXIgYXBwMiA9IHtcbiAgICAgIGlkOiAnb3RoZXJBcHAnXG4gICAgfTtcbiAgICBodWIucmVnaXN0ZXIoYXBwMSk7XG4gICAgaHViLnJlZ2lzdGVyKGFwcDIpO1xuICAgIGFwcDIub25NZXNzYWdlID0gamFzbWluZS5jcmVhdGVTcHkoJ2NiJyk7XG4gICAgdmFyIHJvdXRlID0gaHViLmluc3RhbGwoYXBwMSwgJ290aGVyQXBwJywgJ3Rlc3R4Jyk7XG4gICAgXG4gICAgaHViLnVuaW5zdGFsbChhcHAyLCByb3V0ZSk7XG4gICAgZXhwZWN0KGRlYnVnLndhcm4pLnRvSGF2ZUJlZW5DYWxsZWQoKTtcblxuICAgIGh1Yi51bmluc3RhbGwoe2lkOiBudWxsfSwgcm91dGUpO1xuICAgIGV4cGVjdChkZWJ1Zy53YXJuLmNhbGxzLmNvdW50KCkpLnRvRXF1YWwoMik7XG5cbiAgICBleHBlY3QoaHViLnVuaW5zdGFsbChhcHAxLCByb3V0ZSsnZmFrZScpKS50b0VxdWFsKGZhbHNlKTtcblxuICAgIGh1Yi5kZXJlZ2lzdGVyKGFwcDIpO1xuICAgIGV4cGVjdChodWIuZ2V0RGVzdGluYXRpb24ocm91dGUpKS50b0VxdWFsKHVuZGVmaW5lZCk7XG4gICAgZXhwZWN0KGh1Yi5nZXREZXN0aW5hdGlvbihyb3V0ZSsnZmFrZScpKS50b0VxdWFsKG51bGwpO1xuXG4gICAgaHViLm9uTWVzc2FnZShyb3V0ZSwge3Rlc3Q6IHRydWV9KTtcbiAgICBleHBlY3QoZGVidWcud2Fybi5jYWxscy5jb3VudCgpKS50b0VxdWFsKDMpO1xuICB9KTtcbn0pO1xuXG4iLCJ2YXIgRGVidWcgPSByZXF1aXJlKCcuLi8uLi9zcmMvZGVidWcnKTtcbnZhciBIdWIgPSByZXF1aXJlKCcuLi8uLi9zcmMvaHViJyk7XG52YXIgTWFuYWdlciA9IHJlcXVpcmUoJy4uLy4uL3NyYy9tYW5hZ2VyJyk7XG52YXIgUmVzb3VyY2UgPSByZXF1aXJlKCcuLi8uLi9zcmMvcmVzb3VyY2UnKTtcbnZhciBBcGkgPSByZXF1aXJlKCcuLi8uLi9zcmMvYXBpJyk7XG5cbnZhciB0ZXN0VXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxuZGVzY3JpYmUoXCJNYW5hZ2VyXCIsIGZ1bmN0aW9uKCkge1xuICB2YXIgZGVidWcsIGh1YiwgbWFuYWdlciwgcG9ydCwgcmVzb3VyY2UsIGFwaTtcblxuICBiZWZvcmVFYWNoKGZ1bmN0aW9uKCkge1xuICAgIGRlYnVnID0gbmV3IERlYnVnKCk7XG4gICAgaHViID0gbmV3IEh1YihkZWJ1Zyk7XG4gICAgcmVzb3VyY2UgPSBuZXcgUmVzb3VyY2UoZGVidWcpO1xuICAgIGFwaSA9IG5ldyBBcGkoZGVidWcpO1xuICAgIGFwaS5zZXQoJ2NvcmUnLHt9KTtcbiAgICBhcGkucmVnaXN0ZXIoJ2NvcmUnLGZ1bmN0aW9uKCkge30pO1xuICAgIG1hbmFnZXIgPSBuZXcgTWFuYWdlcihodWIsIHJlc291cmNlLCBhcGkpO1xuICAgIHZhciBnbG9iYWwgPSB7fTtcblxuICAgIGh1Yi5lbWl0KCdjb25maWcnLCB7XG4gICAgICBnbG9iYWw6IGdsb2JhbCxcbiAgICAgIGRlYnVnOiB0cnVlXG4gICAgfSk7XG4gICAgcG9ydCA9IHRlc3RVdGlsLmNyZWF0ZVRlc3RQb3J0KCd0ZXN0aW5nJyk7XG4gICAgbWFuYWdlci5zZXR1cChwb3J0KTtcbiAgfSk7XG5cbiAgaXQoXCJIYW5kbGVzIERlYnVnIE1lc3NhZ2VzXCIsIGZ1bmN0aW9uKCkge1xuICAgIHNweU9uKGRlYnVnLCAncHJpbnQnKTtcbiAgICBtYW5hZ2VyLm9uTWVzc2FnZSgndGVzdGluZycsIHtcbiAgICAgIHJlcXVlc3Q6ICdkZWJ1ZydcbiAgICB9KTtcbiAgICBleHBlY3QoZGVidWcucHJpbnQpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICBtYW5hZ2VyLm9uTWVzc2FnZSgndW5yZWdpc3RlcmVkJywge1xuICAgICAgcmVxdWVzdDogJ2RlYnVnJ1xuICAgIH0pO1xuICAgIGV4cGVjdChkZWJ1Zy5wcmludC5jYWxscy5jb3VudCgpKS50b0VxdWFsKDEpO1xuICB9KTtcblxuICBpdChcIkNyZWF0ZXMgTGlua3NcIiwgZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRlc3RQb3J0ID0gdGVzdFV0aWwuY3JlYXRlVGVzdFBvcnQoJ2Rlc3QnKTtcblxuICAgIG1hbmFnZXIub25NZXNzYWdlKCd0ZXN0aW5nJywge1xuICAgICAgcmVxdWVzdDogJ2xpbmsnLFxuICAgICAgbmFtZTogJ3Rlc3RMaW5rJyxcbiAgICAgIHRvOiB0ZXN0UG9ydFxuICAgIH0pO1xuICAgIC8vIFNldHVwIG1lc3NhZ2UuXG4gICAgZXhwZWN0KHRlc3RQb3J0LmdvdE1lc3NhZ2UoJ2NvbnRyb2wnKSkubm90LnRvRXF1YWwoZmFsc2UpO1xuICAgIC8vIE5vdGlmaWNhdGlvbiBvZiBsaW5rLlxuICAgIHZhciBub3RpZmljYXRpb24gPSBwb3J0LmdvdE1lc3NhZ2UoJ2NvbnRyb2wnLCB7dHlwZTogJ2NyZWF0ZUxpbmsnfSk7XG4gICAgZXhwZWN0KG5vdGlmaWNhdGlvbikubm90LnRvRXF1YWwoZmFsc2UpO1xuXG4gICAgLy8gRm9yd2FyZCBsaW5rIGlzICdkZWZhdWx0Jy5cbiAgICB2YXIgbXNnID0ge2NvbnRlbnRzOiBcImhpIVwifTtcbiAgICBwb3J0LmVtaXQobm90aWZpY2F0aW9uLmNoYW5uZWwsIG1zZyk7XG4gICAgZXhwZWN0KHRlc3RQb3J0LmdvdE1lc3NhZ2UoJ2RlZmF1bHQnKSkudG9FcXVhbChtc2cpO1xuXG4gICAgLy8gQmFja3dhcmRzIGxpbmsgc2hvdWxkIGJlICd0ZXN0TGluaycuXG4gICAgdGVzdFBvcnQuZW1pdChub3RpZmljYXRpb24ucmV2ZXJzZSwgbXNnKTtcbiAgICBleHBlY3QocG9ydC5nb3RNZXNzYWdlKCd0ZXN0TGluaycpKS50b0VxdWFsKG1zZyk7XG4gIH0pO1xuXG4gIGl0KFwiU3VwcG9ydHMgZGVsZWdhdGlvbiBvZiBjb250cm9sXCIsIGZ1bmN0aW9uKCkge1xuICAgIHZhciB0ZXN0UG9ydCA9IHRlc3RVdGlsLmNyZWF0ZVRlc3RQb3J0KCdkZXN0Jyk7XG5cbiAgICBtYW5hZ2VyLnNldHVwKHRlc3RQb3J0KTtcblxuICAgIC8vIERlbGVnYXRlIG1lc3NhZ2VzIGZyb20gdGhlIG5ldyBwb3J0IHRvIG91ciBwb3J0LlxuICAgIG1hbmFnZXIub25NZXNzYWdlKCd0ZXN0aW5nJywge1xuICAgICAgcmVxdWVzdDogJ2RlbGVnYXRlJyxcbiAgICAgIGZsb3c6ICdkZXN0J1xuICAgIH0pO1xuXG4gICAgLy8gU2VuZCBhIG1lc3NhZ2UgZnJvbSB0aGUgbmV3IHBvcnQuXG4gICAgbWFuYWdlci5vbk1lc3NhZ2UoJ2Rlc3QnLCB7XG4gICAgICBjb250ZW50czogJ2hpISdcbiAgICB9KTtcblxuICAgIHZhciBub3RpZmljYXRpb24gPSBwb3J0LmdvdE1lc3NhZ2UoJ2NvbnRyb2wnLCB7dHlwZTogJ0RlbGVnYXRpb24nfSk7XG4gICAgZXhwZWN0KG5vdGlmaWNhdGlvbikubm90LnRvRXF1YWwoZmFsc2UpO1xuICAgIGV4cGVjdChub3RpZmljYXRpb24uZmxvdykudG9FcXVhbCgnZGVzdCcpO1xuICAgIGV4cGVjdChub3RpZmljYXRpb24ubWVzc2FnZS5jb250ZW50cykudG9FcXVhbCgnaGkhJyk7XG4gIH0pO1xuXG4gIGl0KFwiUmVnaXN0ZXJzIHJlc291cmNlIHJlc29sdmVyc1wiLCBmdW5jdGlvbigpIHtcbiAgICBtYW5hZ2VyLm9uTWVzc2FnZSgndGVzdGluZycsIHtcbiAgICAgIHJlcXVlc3Q6ICdyZXNvdXJjZScsXG4gICAgICBzZXJ2aWNlOiAndGVzdGluZycsXG4gICAgICBhcmdzOiBbJ3JldHJpZXZlcicsICdyZXNvbHZlciddXG4gICAgfSk7XG4gICAgZXhwZWN0KHJlc291cmNlLmNvbnRlbnRSZXRyaWV2ZXJzWyd0ZXN0aW5nJ10pLnRvRXF1YWwoJ3Jlc29sdmVyJyk7XG4gIH0pO1xuXG4gIGl0KFwiUHJvdmlkZXMgc2luZ2xldG9uIGFjY2VzcyB0byB0aGUgQ29yZSBBUElcIiwgZnVuY3Rpb24oZG9uZSkge1xuICAgIG1hbmFnZXIub25NZXNzYWdlKCd0ZXN0aW5nJywge1xuICAgICAgcmVxdWVzdDogJ2NvcmUnXG4gICAgfSk7XG4gICAgcG9ydC5nb3RNZXNzYWdlQXN5bmMoJ2NvbnRyb2wnLCB7dHlwZTogJ2NvcmUnfSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgIGV4cGVjdChyZXNwb25zZSkubm90LnRvRXF1YWwoZmFsc2UpO1xuICAgICAgdmFyIGNvcmUgPSByZXNwb25zZS5jb3JlO1xuXG4gICAgICB2YXIgb3RoZXJQb3J0ID0gdGVzdFV0aWwuY3JlYXRlVGVzdFBvcnQoJ2Rlc3QnKTtcbiAgICAgIG1hbmFnZXIuc2V0dXAob3RoZXJQb3J0KTtcbiAgICAgIG1hbmFnZXIub25NZXNzYWdlKCdkZXN0Jywge1xuICAgICAgICByZXF1ZXN0OiAnY29yZSdcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBvdGhlclBvcnQuZ290TWVzc2FnZUFzeW5jKCdjb250cm9sJywge3R5cGU6ICdjb3JlJ30sIGZ1bmN0aW9uKG90aGVyUmVzcG9uc2UpIHtcbiAgICAgICAgZXhwZWN0KG90aGVyUmVzcG9uc2UuY29yZSkudG9FcXVhbChjb3JlKTtcbiAgICAgICAgZG9uZSgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KFwiVGVhcnMgZG93biBQb3J0c1wiLCBmdW5jdGlvbigpIHtcbiAgICBtYW5hZ2VyLm9uTWVzc2FnZSgndGVzdGluZycsIHtcbiAgICAgIHJlcXVlc3Q6ICdjbG9zZSdcbiAgICB9KTtcblxuICAgIC8vIFN1YnNlcXVlbnQgcmVxdWVzdHMgc2hvdWxkIGZhaWwgLyBjYXVzZSBhIHdhcm5pbmcuXG4gICAgc3B5T24oZGVidWcsICd3YXJuJyk7XG4gICAgbWFuYWdlci5vbk1lc3NhZ2UoJ3Rlc3RpbmcnLCB7XG4gICAgICByZXF1ZXN0OiAnY29yZSdcbiAgICB9KTtcbiAgICBleHBlY3QoZGVidWcud2FybikudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgIGV4cGVjdChwb3J0LmdvdE1lc3NhZ2UoJ2NvbnRyb2wnLCB7dHlwZTogJ2NvcmUnfSkpLnRvRXF1YWwoZmFsc2UpO1xuICB9KTtcblxuICBpdChcIlJldHJlaXZlcyBQb3J0cyBieSBJRFwiLCBmdW5jdGlvbigpIHtcbiAgICBleHBlY3QobWFuYWdlci5nZXRQb3J0KHBvcnQuaWQpKS50b0VxdWFsKHBvcnQpO1xuICB9KTtcbn0pO1xuIiwidmFyIE1vZHVsZSA9IHJlcXVpcmUoJy4uLy4uL3NyYy9tb2R1bGUnKTtcbnZhciB0ZXN0VXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxuZGVzY3JpYmUoXCJNb2R1bGVcIiwgZnVuY3Rpb24oKSB7XG4gIHZhciBtb2R1bGUsIGxpbmssIHBvcnQsIHBvbGljeTtcbiAgYmVmb3JlRWFjaChmdW5jdGlvbihkb25lKSB7XG4gICAgcG9saWN5ID0gdGVzdFV0aWwuY3JlYXRlTW9ja1BvbGljeSgpO1xuICAgIG1vZHVsZSA9IG5ldyBNb2R1bGUoXCJtYW5pZmVzdDovL3t9XCIsIHt9LCBbXSwgcG9saWN5KTtcbiAgICBwb3J0ID0gdGVzdFV0aWwuY3JlYXRlVGVzdFBvcnQoJ21lc3NhZ2VyJyk7XG4gICAgbW9kdWxlLm9uKCdjb250cm9sJywgcG9ydC5vbk1lc3NhZ2UuYmluZChwb3J0LCAnY29udHJvbCcpKTtcbiAgICBtb2R1bGUub24oJ2V4dHBvcnQnLCBwb3J0Lm9uTWVzc2FnZS5iaW5kKHBvcnQsICdleHRwb3J0JykpO1xuICAgIGxpbmsgPSB0ZXN0VXRpbC5jcmVhdGVUZXN0UG9ydCgnbW9kdWxlbGluaycpO1xuICAgIHZhciB0ZXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmFkZEVycm9ySGFuZGxlciA9IGZ1bmN0aW9uKCkge307XG4gICAgICB0aGlzLm9uTWVzc2FnZSA9IGxpbmsub25NZXNzYWdlLmJpbmQobGluayk7XG4gICAgICB0aGlzLm9uID0gbGluay5vbi5iaW5kKGxpbmspO1xuICAgICAgdGhpcy5vZmYgPSBsaW5rLm9mZi5iaW5kKGxpbmspO1xuICAgIH07XG4gICAgbW9kdWxlLm9uTWVzc2FnZShcImNvbnRyb2xcIiwge1xuICAgICAgdHlwZTogJ3NldHVwJyxcbiAgICAgIGNoYW5uZWw6ICdjb250cm9sJyxcbiAgICAgIGNvbmZpZzoge1xuICAgICAgICBwb3J0VHlwZTogdGVzdFxuICAgICAgfVxuICAgIH0pO1xuICAgIHNldFRpbWVvdXQoZG9uZSwgMCk7XG4gIH0pO1xuICBcbiAgaXQoXCJBdHRlbXB0cyBNb2R1bGUgU3RhcnR1cFwiLCBmdW5jdGlvbigpIHtcbiAgICBleHBlY3QobGluay5nb3RNZXNzYWdlKCdjb250cm9sJywge3JlcXVlc3Q6ICdlbnZpcm9ubWVudCd9KSkubm90LnRvQmVGYWxzeSgpO1xuICB9KTtcblxuICBpdChcIk1hcHMgZmxvd3MgYmV0d2VlbiBpbm5lciBhbmQgb3V0ZXIgaHViXCIsIGZ1bmN0aW9uKCkge1xuICAgIC8vIExpbmsgdGhlIGNvcmVcbiAgICB2YXIgc3B5ID0gamFzbWluZS5jcmVhdGVTcHkoJ2NvcmVtc2cnKTtcbiAgICB2YXIgY29yZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5vbk1lc3NhZ2UgPSBzcHk7XG4gICAgfTtcbiAgICBtb2R1bGUub25NZXNzYWdlKCdjb250cm9sJywge1xuICAgICAgY29yZTogY29yZVxuICAgIH0pO1xuICAgIFxuICAgIC8vIFByZXRlbmQgdGhlIG1vZHVsZSBoYXMgc3RhcnRlZC5cbiAgICBsaW5rLmVtaXQoJ01vZEludGVybmFsJywge1xuICAgICAgdHlwZTogJ3JlYWR5J1xuICAgIH0pO1xuXG4gICAgLy8gUmVxdWVzdCB0byByZWdpc3RlciBhIHBvcnQuIHZpYSBhICdjb3JlJyBhcGkgY2FsbC5cbiAgICBsaW5rLmVtaXQoJ2NvbnRyb2wnLCB7XG4gICAgICBmbG93OiAnY29yZScsXG4gICAgICBtZXNzYWdlOiB7XG4gICAgICAgIHR5cGU6ICdyZWdpc3RlcicsXG4gICAgICAgIGlkOiAnbmV3cG9ydCdcbiAgICAgIH1cbiAgICB9KTtcbiAgICBleHBlY3Qoc3B5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aChtb2R1bGUsIHtcbiAgICAgIHR5cGU6ICdyZWdpc3RlcicsXG4gICAgICBpZDogJ25ld3BvcnQnLFxuICAgICAgcmVwbHk6IGphc21pbmUuYW55KEZ1bmN0aW9uKVxuICAgIH0pO1xuICAgIC8vIFJlc3BvbmQgYXMgaWYgYmluZGluZyBoYXMgb2NjdXJlZFxuICAgIG1vZHVsZS5vbk1lc3NhZ2UoJ2NvbnRyb2wnLCB7XG4gICAgICB0eXBlOiAnY3JlYXRlTGluaycsXG4gICAgICBjaGFubmVsOiAnZXh0cG9ydCcsXG4gICAgICBuYW1lOiAnbmV3cG9ydCdcbiAgICB9KTtcbiAgICAvLyBJbnRlcm5hbCBNYXBwaW5nXG4gICAgbGluay5lbWl0KCdjb250cm9sJywge1xuICAgICAgdHlwZTogJ2NyZWF0ZUxpbmsnLFxuICAgICAgY2hhbm5lbDogJ2ludHBvcnQnLFxuICAgICAgbmFtZTogJ25ld3BvcnQnXG4gICAgfSk7XG4gICAgLy8gTWFrZSBzdXJlIG1lc3NhZ2VzIG5vdyB0cmFuc2xhdGUgYm90aCB3YXlzLlxuICAgIG1vZHVsZS5vbk1lc3NhZ2UoJ25ld3BvcnQnLCAnaW5nb2luZyBtc2cnKTtcbiAgICBleHBlY3QobGluay5nb3RNZXNzYWdlKCdpbnRwb3J0JywgJ2luZ29pbmcgbXNnJykpLm5vdC50b0JlRmFsc3koKTtcblxuICAgIGxpbmsuZW1pdCgnbmV3cG9ydCcsICdvdXRnb2luZyBtc2cnKTtcbiAgICBleHBlY3QocG9ydC5nb3RNZXNzYWdlKCdleHRwb3J0JywgJ291dGdvaW5nIG1zZycpKS5ub3QudG9CZUZhbHN5KCk7XG5cbiAgICAvLyBUZWFyIERvd24uXG4gICAgbW9kdWxlLm9uTWVzc2FnZSgnY29udHJvbCcsIHtcbiAgICAgIHR5cGU6ICdjbG9zZScsXG4gICAgICBjaGFubmVsOiAnZXh0cG9ydCdcbiAgICB9KTtcbiAgICBleHBlY3QobGluay5nb3RNZXNzYWdlKCdjb250cm9sJywge3R5cGU6ICdjbG9zZSd9KSkubm90LnRvQmVGYWxzeSgpO1xuICB9KTtcbn0pOyIsInZhciBBcGkgPSByZXF1aXJlKCcuLi8uLi9zcmMvYXBpJyk7XG52YXIgRGVidWcgPSByZXF1aXJlKCcuLi8uLi9zcmMvZGVidWcnKTtcbnZhciBIdWIgPSByZXF1aXJlKCcuLi8uLi9zcmMvaHViJyk7XG52YXIgTWFuYWdlciA9IHJlcXVpcmUoJy4uLy4uL3NyYy9tYW5hZ2VyJyk7XG52YXIgTW9kdWxlSW50ZXJuYWwgPSByZXF1aXJlKCcuLi8uLi9zcmMvbW9kdWxlaW50ZXJuYWwnKTtcblxudmFyIHRlc3RVdGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG5kZXNjcmliZSgnTW9kdWxlSW50ZXJuYWwnLCBmdW5jdGlvbigpIHtcbiAgdmFyIGFwcCwgbWFuYWdlciwgaHViLCBnbG9iYWwsIGxvYztcbiAgYmVmb3JlRWFjaChmdW5jdGlvbigpIHtcbiAgICBnbG9iYWwgPSB7ZnJlZWRvbToge319O1xuICAgIGh1YiA9IG5ldyBIdWIobmV3IERlYnVnKCkpO1xuICAgIHZhciByZXNvdXJjZSA9IHRlc3RVdGlsLnNldHVwUmVzb2x2ZXJzKCk7XG4gICAgdmFyIGFwaSA9IG5ldyBBcGkoKTtcbiAgICBhcGkuc2V0KCdjb3JlJywge30pO1xuICAgIGFwaS5yZWdpc3RlcignY29yZScsIGZ1bmN0aW9uICgpIHt9KTtcbiAgICBtYW5hZ2VyID0gbmV3IE1hbmFnZXIoaHViLCByZXNvdXJjZSwgYXBpKTtcbiAgICBhcHAgPSBuZXcgTW9kdWxlSW50ZXJuYWwobWFuYWdlcik7XG4gICAgaHViLmVtaXQoJ2NvbmZpZycsIHtcbiAgICAgIGdsb2JhbDogZ2xvYmFsLFxuICAgICAgbG9jYXRpb246ICdyZWxhdGl2ZTovLydcbiAgICB9KTtcbiAgICBtYW5hZ2VyLnNldHVwKGFwcCk7XG5cbiAgICB2YXIgcGF0aCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLFxuICAgICAgICBkaXJfaWR4ID0gcGF0aC5sYXN0SW5kZXhPZignLycpO1xuICAgIGxvYyA9IHBhdGguc3Vic3RyKDAsIGRpcl9pZHgpICsgJy8nO1xufSk7XG5cbiAgaXQoJ2NvbmZpZ3VyZXMgYW4gYXBwIGVudmlyb25tZW50JywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNvdXJjZSA9IHRlc3RVdGlsLmNyZWF0ZVRlc3RQb3J0KCd0ZXN0Jyk7XG4gICAgbWFuYWdlci5zZXR1cChzb3VyY2UpO1xuICAgIG1hbmFnZXIuY3JlYXRlTGluayhzb3VyY2UsICdkZWZhdWx0JywgYXBwLCAnZGVmYXVsdCcpO1xuXG4gICAgaHViLm9uTWVzc2FnZShzb3VyY2UubWVzc2FnZXNbMV1bMV0uY2hhbm5lbCwge1xuICAgICAgY2hhbm5lbDogc291cmNlLm1lc3NhZ2VzWzFdWzFdLnJldmVyc2UsXG4gICAgICBhcHBJZDogJ3Rlc3RBcHAnLFxuICAgICAgbGluZWFnZTogWydnbG9iYWwnLCAndGVzdEFwcCddLFxuICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgYXBwOiB7XG4gICAgICAgICAgc2NyaXB0OiAnaGVscGVyL2NoYW5uZWwuanMnXG4gICAgICAgIH0sXG4gICAgICAgIHBlcm1pc3Npb25zOiBbJ2NvcmUuZWNobyddLFxuICAgICAgICBkZXBlbmRlbmNpZXM6IFsnaGVscGVyL2ZyaWVuZC5qc29uJ10sXG4gICAgICAgIHByb3ZpZGVzOiBbJ2lkZW50aXR5J11cbiAgICAgIH0sXG4gICAgICBpZDogJ3JlbGF0aXZlOi8vc3BlYy9oZWxwZXIvbWFuaWZlc3QuanNvbicsXG4gICAgfSk7XG5cbiAgICBleHBlY3Qoc291cmNlLmdvdE1lc3NhZ2UoJ2NvbnRyb2wnLCB7J25hbWUnOiAnaWRlbnRpdHknfSkpLnRvQmVEZWZpbmVkKCk7XG4gICAgZXhwZWN0KHNvdXJjZS5nb3RNZXNzYWdlKCdjb250cm9sJywgeyduYW1lJzogJ2NvcmUuZWNobyd9KSkudG9CZURlZmluZWQoKTtcbiAgfSk7XG5cbiAgaXQoJ2hhbmRsZXMgc2NyaXB0IGxvYWRpbmcgYW5kIGF0dGFjaG1lbnQnLCBmdW5jdGlvbihkb25lKSB7XG4gICAgZ2xvYmFsLmRvY3VtZW50ID0gZG9jdW1lbnQ7XG4gICAgXG4gICAgdmFyIHNjcmlwdCA9IGJ0b2EoJ2ZpbGVJbmNsdWRlZCA9IHRydWU7IGNhbGxiYWNrKCk7Jyk7XG5cbiAgICB3aW5kb3cuY2FsbGJhY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgIGV4cGVjdChmaWxlSW5jbHVkZWQpLnRvRXF1YWwodHJ1ZSk7XG4gICAgICBkZWxldGUgY2FsbGJhY2s7XG4gICAgICBkb25lKCk7XG4gICAgfSBcbiAgICBcbiAgICBhcHAubG9hZFNjcmlwdHMobG9jLCBbJ2RhdGE6dGV4dC9qYXZhc2NyaXB0O2Jhc2U2NCwnICsgc2NyaXB0LCAnbm9uX2V4aXN0aW5nX2ZpbGUnXSk7XG4gIH0pO1xuXG4gIGl0KCdsb2FkIHNjcmlwdHMgc2VxdWVudGlhbGx5JywgZnVuY3Rpb24oZG9uZSkge1xuICAgIGdsb2JhbC5kb2N1bWVudCA9IGRvY3VtZW50O1xuXG4gICAgZmlsZUluY2x1ZGVkID0gZmFsc2U7XG4gICAgZmlsZUluY2x1ZGVkMCA9IGZhbHNlO1xuXG4gICAgdmFyIHNjcmlwdDAgPSBidG9hKCdmaWxlSW5jbHVkZWQwID0gdHJ1ZTsgY2FsbGJhY2swKCk7Jyk7XG4gICAgd2luZG93LmNhbGxiYWNrMCA9IGZ1bmN0aW9uKCkge1xuICAgICAgZXhwZWN0KGZpbGVJbmNsdWRlZDApLnRvRXF1YWwodHJ1ZSk7XG4gICAgICBleHBlY3QoZmlsZUluY2x1ZGVkKS50b0VxdWFsKGZhbHNlKTtcbiAgICAgIGRlbGV0ZSBjYWxsYmFjazA7XG4gICAgfTtcblxuICAgIHZhciBzY3JpcHQgPSBidG9hKCdmaWxlSW5jbHVkZWQgPSB0cnVlOyBjYWxsYmFjaygpOycpO1xuICAgIHdpbmRvdy5jYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgZXhwZWN0KGZpbGVJbmNsdWRlZDApLnRvRXF1YWwodHJ1ZSk7XG4gICAgICBleHBlY3QoZmlsZUluY2x1ZGVkKS50b0VxdWFsKHRydWUpO1xuICAgICAgZGVsZXRlIGNhbGxiYWNrO1xuICAgICAgZG9uZSgpO1xuICAgIH07XG5cbiAgICBhcHAubG9hZFNjcmlwdHMobG9jLCBbJ2RhdGE6dGV4dC9qYXZhc2NyaXB0O2Jhc2U2NCwnICsgc2NyaXB0MCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGE6dGV4dC9qYXZhc2NyaXB0O2Jhc2U2NCwnICsgc2NyaXB0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAnbm9uX2V4aXN0aW5nX2ZpbGUnXSk7XG4gIH0pXG5cbiAgaXQoJ2V4cG9zZXMgZGVwZW5kZW5jeSBhcGlzJywgZnVuY3Rpb24oZG9uZSkge1xuICAgIHZhciBzb3VyY2UgPSB0ZXN0VXRpbC5jcmVhdGVUZXN0UG9ydCgndGVzdCcpO1xuICAgIG1hbmFnZXIuc2V0dXAoc291cmNlKTtcbiAgICBtYW5hZ2VyLmNyZWF0ZUxpbmsoc291cmNlLCAnZGVmYXVsdCcsIGFwcCwgJ2RlZmF1bHQnKTtcbiAgICBzb3VyY2Uub24oJ29uTWVzc2FnZScsIGZ1bmN0aW9uKG1zZykge1xuICAgICAgLy8gRGVwZW5kZW5jaWVzIHdpbGwgYmUgcmVxdWVzdGVkIHZpYSAnY3JlYXRlTGluaycgbWVzc2FnZXMuIHJlc29sdmUgdGhvc2UuXG4gICAgICBpZiAobXNnLmNoYW5uZWwgJiYgbXNnLnR5cGUgPT09ICdjcmVhdGVMaW5rJykge1xuICAgICAgICBodWIub25NZXNzYWdlKG1zZy5jaGFubmVsLCB7XG4gICAgICAgICAgdHlwZTogJ2NoYW5uZWwgYW5ub3VuY2VtZW50JyxcbiAgICAgICAgICBjaGFubmVsOiBtc2cucmV2ZXJzZVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAobXNnLnR5cGUgPT09ICdyZXNvbHZlJykge1xuICAgICAgICBodWIub25NZXNzYWdlKHNvdXJjZS5tZXNzYWdlc1sxXVsxXS5jaGFubmVsLCB7XG4gICAgICAgICAgaWQ6IG1zZy5pZCxcbiAgICAgICAgICBkYXRhOiAnc3BlYy8nICsgbXNnLmRhdGFcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBnbG9iYWwuZG9jdW1lbnQgPSBkb2N1bWVudDtcblxuICAgIGh1Yi5vbk1lc3NhZ2Uoc291cmNlLm1lc3NhZ2VzWzFdWzFdLmNoYW5uZWwsIHtcbiAgICAgIGNoYW5uZWw6IHNvdXJjZS5tZXNzYWdlc1sxXVsxXS5yZXZlcnNlLFxuICAgICAgYXBwSWQ6ICd0ZXN0QXBwJyxcbiAgICAgIGxpbmVhZ2U6IFsnZ2xvYmFsJywgJ3Rlc3RBcHAnXSxcbiAgICAgIG1hbmlmZXN0OiB7XG4gICAgICAgIG5hbWU6ICdNeSBNb2R1bGUgTmFtZScsXG4gICAgICAgIGFwcDoge1xuICAgICAgICAgIHNjcmlwdDogJ2hlbHBlci9iZWFjb24uanMnXG4gICAgICAgIH0sXG4gICAgICAgIGRlcGVuZGVuY2llczoge1xuICAgICAgICAgIFwidGVzdFwiOiB7XG4gICAgICAgICAgICBcInVybFwiOiBcInJlbGF0aXZlOi8vc3BlYy9oZWxwZXIvZnJpZW5kLmpzb25cIixcbiAgICAgICAgICAgIFwiYXBpXCI6IFwic29jaWFsXCJcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBpZDogJ3JlbGF0aXZlOi8vc3BlYy9oZWxwZXIvbWFuaWZlc3QuanNvbicsXG4gICAgfSk7XG4gICAgaHViLm9uTWVzc2FnZShzb3VyY2UubWVzc2FnZXNbMV1bMV0uY2hhbm5lbCwge1xuICAgICAgdHlwZTogJ21hbmlmZXN0JyxcbiAgICAgIG5hbWU6ICd0ZXN0JyxcbiAgICAgIG1hbmlmZXN0OiB7bmFtZTogJ3Rlc3QgbWFuaWZlc3QnfVxuICAgIH0pO1xuXG4gICAgd2luZG93LmNhbGxiYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICBkZWxldGUgY2FsbGJhY2s7XG4gICAgICBleHBlY3QoZ2xvYmFsLmZyZWVkb20ubWFuaWZlc3QubmFtZSkudG9FcXVhbCgnTXkgTW9kdWxlIE5hbWUnKTtcbiAgICAgIGV4cGVjdChnbG9iYWwuZnJlZWRvbS50ZXN0LmFwaSkudG9FcXVhbCgnc29jaWFsJyk7XG4gICAgICBleHBlY3QoZ2xvYmFsLmZyZWVkb20udGVzdC5tYW5pZmVzdC5uYW1lKS50b0VxdWFsKCd0ZXN0IG1hbmlmZXN0Jyk7XG4gICAgICBkb25lKCk7XG4gICAgfTtcbiAgfSk7XG59KTtcbiIsInZhciBEZWJ1ZyA9IHJlcXVpcmUoJy4uLy4uL3NyYy9kZWJ1ZycpO1xudmFyIFBvbGljeSA9IHJlcXVpcmUoJy4uLy4uL3NyYy9wb2xpY3knKTtcbnZhciBSZXNvdXJjZSA9IHJlcXVpcmUoJy4uLy4uL3NyYy9yZXNvdXJjZScpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi8uLi9zcmMvdXRpbCcpO1xuXG5kZXNjcmliZSgnUG9saWN5JywgZnVuY3Rpb24oKSB7XG4gIHZhciBwb2xpY3ksXG4gICAgICBtYW5hZ2VyO1xuICBiZWZvcmVFYWNoKGZ1bmN0aW9uKCkge1xuICAgIG1hbmFnZXIgPSB7ZGVidWc6IG5ldyBEZWJ1ZygpfTtcbiAgICB1dGlsLmhhbmRsZUV2ZW50cyhtYW5hZ2VyKTtcbiAgICBtYW5hZ2VyLmdldFBvcnQgPSBmdW5jdGlvbihpZCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6IGlkXG4gICAgICB9O1xuICAgIH07XG4gICAgdmFyIHJzcmMgPSBuZXcgUmVzb3VyY2UoKTtcbiAgICBwb2xpY3kgPSBuZXcgUG9saWN5KG1hbmFnZXIsIHJzcmMsIHt9KTtcbiAgfSk7XG4gIFxuICBpdCgnR2VuZXJhdGVzIG5ldyBtb2R1bGVzIHdoZW4gbmVlZGVkJywgZnVuY3Rpb24oZG9uZSkge1xuICAgIHZhciBtYW5pZmVzdCA9IHtcbiAgICAgIGNvbnN0cmFpbnRzOiB7XG4gICAgICAgIGlzb2xhdGlvbjogXCJuZXZlclwiXG4gICAgICB9XG4gICAgfTtcbiAgICB2YXIgbWFuaWZlc3RVUkwgPSBcIm1hbmlmZXN0Oi8vXCIgKyBKU09OLnN0cmluZ2lmeShtYW5pZmVzdCk7XG4gICAgcG9saWN5LmdldChbXSwgbWFuaWZlc3RVUkwpLnRoZW4oZnVuY3Rpb24obW9kKSB7XG4gICAgICBtYW5hZ2VyLmVtaXQoJ21vZHVsZUFkZCcsIHtsaW5lYWdlOlttYW5pZmVzdFVSTF0sIGlkOm1vZC5pZH0pO1xuICAgICAgcG9saWN5LmdldChbXSwgbWFuaWZlc3RVUkwpLnRoZW4oZnVuY3Rpb24obW9kMikge1xuICAgICAgICBleHBlY3QobW9kMi5pZCkudG9FcXVhbChtb2QuaWQpO1xuICAgICAgICBkb25lKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG4gIFxuICB4aXQoJ0ZpbmRzIGFuIGFwcHJvcHJpYXRlIHJ1bnRpbWUgdG8gcGxhY2UgbmV3IG1vZHVsZXMnLCBmdW5jdGlvbigpIHtcbiAgICAvL1RPRE86IG5lZWQgdG8gdW5kZXJzdGFuZCBhY3R1YWwgcG9saWN5IGZvciBtdWx0aXBsZSBydW50aW1lcyBiZXR0ZXIuXG4gIH0pO1xuICBcbiAgaXQoJ0RldGVjdHMgaWYgYSBtb2R1bGUgaXMgcnVubmluZyBpbiBhIHJ1bnRpbWUnLCBmdW5jdGlvbigpIHtcbiAgICBtYW5hZ2VyLmVtaXQoJ21vZHVsZUFkZCcsIHtsaW5lYWdlOlsndGVzdCcsJ2EnLCdiJywnYyddLCBpZDondGVzdDEnfSk7XG4gICAgbWFuYWdlci5lbWl0KCdtb2R1bGVBZGQnLCB7bGluZWFnZTpbJ3Rlc3QnLCdhJywnZDEnLCdlMiddLCBpZDondGVzdDInfSk7XG5cbiAgICBleHBlY3QocG9saWN5LmlzUnVubmluZyhwb2xpY3kucnVudGltZXNbMF0sICd0ZXN0JywgW10sIGZhbHNlKSkudG9FcXVhbCgndGVzdDEnKTtcbiAgICBleHBlY3QocG9saWN5LmlzUnVubmluZyhwb2xpY3kucnVudGltZXNbMF0sICd0ZXN0JywgWydhJywnYicsJ2MnXSwgdHJ1ZSkpLnRvRXF1YWwoJ3Rlc3QxJyk7XG4gICAgZXhwZWN0KHBvbGljeS5pc1J1bm5pbmcocG9saWN5LnJ1bnRpbWVzWzBdLCAndGVzdCcsIFsnYScsJ2InLCdlJ10sIHRydWUpKS50b0VxdWFsKGZhbHNlKTtcbiAgICBleHBlY3QocG9saWN5LmlzUnVubmluZyhwb2xpY3kucnVudGltZXNbMF0sICd0ZXN0JywgWydhJywnZCcsJ2UnXSwgdHJ1ZSkpLnRvRXF1YWwoJ3Rlc3QyJyk7XG4gIH0pO1xuICBcbiAgaXQoJ0xvYWRzIE1hbmlmZXN0cycsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICBwb2xpY3kubG9hZE1hbmlmZXN0KCdtYW5pZmVzdDovL3tcInhcIjpcInlcIn0nKS50aGVuKGZ1bmN0aW9uKG1hbmlmZXN0KSB7XG4gICAgICBleHBlY3QobWFuaWZlc3QueCkudG9FcXVhbCgneScpO1xuICAgICAgZG9uZSgpO1xuICAgIH0pO1xuICB9KTtcblxuICBpdCgnS2VlcHMgdHJhY2sgb2YgcnVubmluZyBtb2R1bGVzJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIHBvcnQyID0ge307XG4gICAgdXRpbC5oYW5kbGVFdmVudHMocG9ydDIpO1xuICAgIHBvbGljeS5hZGQocG9ydDIsIHt9KTtcbiAgICBwb3J0Mi5lbWl0KCdtb2R1bGVBZGQnLCB7bGluZWFnZTpbJ3Rlc3QnXSwgaWQ6J3Rlc3QnfSk7XG4gICAgZXhwZWN0KHBvbGljeS5pc1J1bm5pbmcocG9saWN5LnJ1bnRpbWVzWzFdLCAndGVzdCcsIFtdLCBmYWxzZSkpLnRvRXF1YWwoJ3Rlc3QnKTtcbiAgICBwb3J0Mi5lbWl0KCdtb2R1bGVSZW1vdmUnLCB7bGluZWFnZTpbJ3Rlc3QnXSwgaWQ6J3Rlc3QnfSk7XG4gICAgZXhwZWN0KHBvbGljeS5pc1J1bm5pbmcocG9saWN5LnJ1bnRpbWVzWzFdLCAndGVzdCcsIFtdLCBmYWxzZSkpLnRvRXF1YWwoZmFsc2UpO1xuICB9KTtcblxuICBpdCgnT3ZlcmxheXMgcG9saWN5IC8gY29uZmlnJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGN1c3RvbVBvbGljeSA9IHtcbiAgICAgIGJhY2tncm91bmQ6IHRydWUsXG4gICAgICBpbnRlcmFjdGl2ZTogZmFsc2UsXG4gICAgICBjdXN0b206IHRydWVcbiAgICB9O1xuICAgIGV4cGVjdChwb2xpY3kub3ZlcmxheShwb2xpY3kuZGVmYXVsdFBvbGljeSwgY3VzdG9tUG9saWN5KSkudG9FcXVhbChjdXN0b21Qb2xpY3kpO1xuXG4gICAgdmFyIG51bGxQb2xpY3kgPSB7fTtcbiAgICBleHBlY3QocG9saWN5Lm92ZXJsYXkocG9saWN5LmRlZmF1bHRQb2xpY3ksIG51bGxQb2xpY3kpKS50b0VxdWFsKHBvbGljeS5kZWZhdWx0UG9saWN5KTtcbiAgfSk7XG59KTsiLCJ2YXIgUHJvdmlkZXIgPSByZXF1aXJlKCcuLi8uLi9zcmMvcHJvdmlkZXInKTtcbnZhciBQcm9taXNlID0gcmVxdWlyZSgnZXM2LXByb21pc2UnKS5Qcm9taXNlO1xuXG5kZXNjcmliZShcIlByb3ZpZGVyXCIsIGZ1bmN0aW9uKCkge1xuICB2YXIgcG9ydCwgbywgY29uc3RydWN0c3B5O1xuICBiZWZvcmVFYWNoKGZ1bmN0aW9uKCkge1xuICAgIHZhciBkZWZpbml0aW9uID0ge1xuICAgICAgJ20xJzoge3R5cGU6ICdtZXRob2QnLCB2YWx1ZTpbJ3N0cmluZyddLCByZXQ6J3N0cmluZyd9LFxuICAgICAgJ20yJzoge3R5cGU6ICdtZXRob2QnLCB2YWx1ZTpbeyduYW1lJzonc3RyaW5nJ31dfSxcbiAgICAgICdlMSc6IHt0eXBlOiAnZXZlbnQnLCB2YWx1ZTonc3RyaW5nJ30sXG4gICAgICAnYzEnOiB7dHlwZTogJ2NvbnN0YW50JywgdmFsdWU6XCJ0ZXN0X2NvbnN0YW50XCJ9XG4gICAgfTtcbiAgICBwb3J0ID0gbmV3IFByb3ZpZGVyKGRlZmluaXRpb24pO1xuXG4gICAgY29uc3RydWN0c3B5ID0gamFzbWluZS5jcmVhdGVTcHkoJ2NvbnN0cnVjdG9yJyk7XG4gICAgbyA9IGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3RydWN0c3B5KGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgICBvLnByb3RvdHlwZS5tMSA9IGZ1bmN0aW9uKHN0cikge1xuICAgICAgcmV0dXJuIFwibTEtY2FsbGVkXCI7XG4gICAgfTtcbiAgICBvLnByb3RvdHlwZS5tMiA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIG9iai5uYW1lO1xuICAgIH07XG4gIH0pO1xuXG4gIGl0KFwicHJlc2VudHMgYSBwdWJsaWMgaW50ZXJmYWNlIHdoaWNoIGNhbiBiZSBwcm92aWRlZC5cIiwgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGlmYWNlID0gcG9ydC5nZXRJbnRlcmZhY2UoKTtcbiAgICBleHBlY3QoaWZhY2VbJ3Byb3ZpZGVTeW5jaHJvbm91cyddKS50b0JlRGVmaW5lZCgpO1xuICAgIGV4cGVjdChpZmFjZS5jMSkudG9FcXVhbChcInRlc3RfY29uc3RhbnRcIik7XG5cbiAgICBpZmFjZS5wcm92aWRlU3luY2hyb25vdXMobyk7XG4gICAgLy8gc2V0dXAuXG4gICAgcG9ydC5vbk1lc3NhZ2UoJ2RlZmF1bHQnLCB7XG4gICAgICBjaGFubmVsOiAnbWVzc2FnZSdcbiAgICB9KTtcbiAgICBleHBlY3QoY29uc3RydWN0c3B5KS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpO1xuXG4gICAgcG9ydC5vbk1lc3NhZ2UoJ2RlZmF1bHQnLCB7dG86ICd0ZXN0SW5zdCcsIHR5cGU6J21lc3NhZ2UnLCBtZXNzYWdlOnsndHlwZSc6ICdjb25zdHJ1Y3QnfX0pO1xuICAgIFxuICAgIGV4cGVjdChjb25zdHJ1Y3RzcHkpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgfSk7XG5cbiAgaXQoXCJjb25zdHJ1Y3RzIGludGVyZmFjZXMgd2l0aCBhcmd1bWVudHMgaW4gYSByZWFzb25hYmxlIHdheS5cIiwgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRlZmluaXRpb24gPSB7XG4gICAgICAnY29uc3RydWN0b3InOiB7dmFsdWU6IFsnb2JqZWN0J119XG4gICAgfTtcbiAgICBwb3J0ID0gbmV3IFByb3ZpZGVyKGRlZmluaXRpb24pO1xuICAgIHZhciBpZmFjZSA9IHBvcnQuZ2V0SW50ZXJmYWNlKCk7XG4gICAgZXhwZWN0KGlmYWNlWydwcm92aWRlU3luY2hyb25vdXMnXSkudG9CZURlZmluZWQoKTtcblxuICAgIG8gPSBmdW5jdGlvbihkaXNwYXRjaEV2ZW50LCBhcmcpIHtcbiAgICAgIGNvbnN0cnVjdHNweShhcmcpO1xuICAgIH07XG4gICAgaWZhY2UucHJvdmlkZVN5bmNocm9ub3VzKG8pO1xuICAgIC8vIHNldHVwLlxuICAgIHBvcnQub25NZXNzYWdlKCdkZWZhdWx0Jywge1xuICAgICAgY2hhbm5lbDogJ21lc3NhZ2UnXG4gICAgfSk7XG4gICAgZXhwZWN0KGNvbnN0cnVjdHNweSkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKTtcblxuICAgIHBvcnQub25NZXNzYWdlKCdkZWZhdWx0Jywge3RvOiAndGVzdEluc3QnLCB0eXBlOidtZXNzYWdlJywgbWVzc2FnZTp7XG4gICAgICAndHlwZSc6ICdjb25zdHJ1Y3QnLFxuICAgICAgJ3RleHQnOiBbeyd0ZXN0JzonaGknfV0sXG4gICAgICAnYmluYXJ5JzogW11cbiAgICB9fSk7XG5cbiAgICBleHBlY3QoY29uc3RydWN0c3B5KS50b0hhdmVCZWVuQ2FsbGVkV2l0aCh7J3Rlc3QnOidoaSd9KTtcbiAgfSk7XG5cbiAgaXQoXCJhbGxvd3MgcHJvbWlzZXMgdG8gYmUgdXNlZC5cIiwgZnVuY3Rpb24oZG9uZSkge1xuICAgIHZhciBpZmFjZSA9IHBvcnQuZ2V0SW50ZXJmYWNlKCk7XG4gICAgdmFyIG8gPSBmdW5jdGlvbigpIHt9O1xuICAgIHZhciBjYWxsZWQgPSBmYWxzZSwgcmVzcDtcbiAgICBvLnByb3RvdHlwZS5tMSA9IGZ1bmN0aW9uKHN0cikge1xuICAgICAgY2FsbGVkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoJ3Jlc29sdmVkICcgKyBzdHIpO1xuICAgIH07XG5cbiAgICBpZmFjZS5wcm92aWRlUHJvbWlzZXMobyk7XG4gICAgcG9ydC5vbk1lc3NhZ2UoJ2RlZmF1bHQnLCB7XG4gICAgICBjaGFubmVsOiAnbWVzc2FnZSdcbiAgICB9KTtcblxuICAgIHBvcnQub25NZXNzYWdlKCdkZWZhdWx0Jywge3RvOiAndGVzdEluc3QnLCB0eXBlOidtZXNzYWdlJywgbWVzc2FnZTp7XG4gICAgICAndHlwZSc6ICdjb25zdHJ1Y3QnLFxuICAgIH19KTtcblxuICAgIHBvcnQub25NZXNzYWdlKCdkZWZhdWx0Jywge3RvOiAndGVzdEluc3QnLCB0eXBlOidtZXNzYWdlJywgbWVzc2FnZToge1xuICAgICAgJ2FjdGlvbic6ICdtZXRob2QnLFxuICAgICAgJ3R5cGUnOiAnbTEnLFxuICAgICAgJ3RleHQnOiBbJ215c3RyJ10sXG4gICAgICAncmVxSWQnOiAxXG4gICAgfX0pO1xuXG4gICAgZXhwZWN0KGNhbGxlZCkudG9FcXVhbCh0cnVlKTtcblxuICAgIHBvcnQub24oJ21lc3NhZ2UnLCBmdW5jdGlvbihuKSB7XG4gICAgICBleHBlY3Qobi5tZXNzYWdlLnRleHQpLnRvRXF1YWwoJ3Jlc29sdmVkIG15c3RyJyk7XG4gICAgICBkb25lKCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KFwiQWxsb3dzIGNsb3NpbmdcIiwgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGlmYWNlID0gcG9ydC5nZXRQcm94eUludGVyZmFjZSgpO1xuICAgIHZhciBtYWtlciA9IGlmYWNlKCk7XG4gICAgbWFrZXIucHJvdmlkZVN5bmNocm9ub3VzKG8pO1xuXG4gICAgdmFyIHNweSA9IGphc21pbmUuY3JlYXRlU3B5KCdjYicpO1xuICAgIGlmYWNlLm9uQ2xvc2Uoc3B5KTtcblxuICAgIHBvcnQuY2xvc2UoKTtcbiAgICBleHBlY3Qoc3B5KS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gIH0pO1xufSk7XG4iLCJ2YXIgQXBpSW50ZXJmYWNlID0gcmVxdWlyZSgnLi4vLi4vc3JjL3Byb3h5L2FwaUludGVyZmFjZScpO1xudmFyIENvbnN1bWVyID0gcmVxdWlyZSgnLi4vLi4vc3JjL2NvbnN1bWVyJyk7XG5cbmRlc2NyaWJlKFwicHJveHkvQVBJSW50ZXJmYWNlXCIsIGZ1bmN0aW9uKCkge1xuICB2YXIgZW1pdCwgcmVnLCBhcGk7XG4gIGJlZm9yZUVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpZmFjZSA9IHtcbiAgICAgICd0ZXN0Jzogeyd0eXBlJzogJ21ldGhvZCcsICd2YWx1ZSc6IFsnc3RyaW5nJ10sICdyZXQnOiAnc3RyaW5nJ30sXG4gICAgICAnZXYnOiB7J3R5cGUnOiAnZXZlbnQnLCAndmFsdWUnOiAnc3RyaW5nJ30sXG4gICAgICAnY28nOiB7J3R5cGUnOiAnY29uc3RhbnQnLCAndmFsdWUnOiAnMTInfVxuICAgIH07XG4gICAgZW1pdCA9IGphc21pbmUuY3JlYXRlU3B5KCdlbWl0Jyk7XG4gICAgdmFyIG9uTXNnID0gZnVuY3Rpb24ob2JqLCByKSB7XG4gICAgICByZWcgPSByO1xuICAgIH07XG4gICAgYXBpID0gbmV3IEFwaUludGVyZmFjZShpZmFjZSwgb25Nc2csIGVtaXQpO1xuICB9KTtcblxuICBpdChcIkNyZWF0ZXMgYW4gb2JqZWN0IGxvb2tpbmcgbGlrZSBhbiBpbnRlcmZhY2UuXCIsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICBleHBlY3QodHlwZW9mKGFwaS50ZXN0KSkudG9FcXVhbCgnZnVuY3Rpb24nKTtcbiAgICBleHBlY3QodHlwZW9mKGFwaS5vbikpLnRvRXF1YWwoJ2Z1bmN0aW9uJyk7XG4gICAgZXhwZWN0KGFwaS5jbykudG9FcXVhbCgnMTInKTtcblxuICAgIGV4cGVjdChlbWl0KS50b0hhdmVCZWVuQ2FsbGVkV2l0aCh7XG4gICAgICAndHlwZSc6ICdjb25zdHJ1Y3QnLFxuICAgICAgJ3RleHQnOiBbXSxcbiAgICAgICdiaW5hcnknOiBbXVxuICAgIH0pO1xuICAgIHZhciBwcm9taXNlID0gYXBpLnRlc3QoJ2hpJyk7XG4gICAgZXhwZWN0KGVtaXQpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHtcbiAgICAgIGFjdGlvbjogJ21ldGhvZCcsXG4gICAgICB0eXBlOiAndGVzdCcsXG4gICAgICByZXFJZDogMCxcbiAgICAgIHRleHQ6IFsnaGknXSxcbiAgICAgIGJpbmFyeTogW11cbiAgICB9KTtcblxuICAgIHZhciBzcHkgPSBqYXNtaW5lLmNyZWF0ZVNweSgncmV0Jyk7XG4gICAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICBzcHkoKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZSkudG9FcXVhbCgnYm9vIScpOztcbiAgICAgIGRvbmUoKTtcbiAgICB9KTtcbiAgICBleHBlY3Qoc3B5KS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpO1xuXG4gICAgcmVnKCdtZXNzYWdlJywge1xuICAgICAgdHlwZTogJ21ldGhvZCcsXG4gICAgICByZXFJZDogMCxcbiAgICAgIHRleHQ6ICdib28hJyxcbiAgICAgIGJpbmFyeTogW11cbiAgICB9KTtcbiAgfSk7XG5cbiAgaXQoXCJEZWxpdmVycyBjb25zdHJ1Y3RvciBhcmd1bWVudHMuXCIsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICB2YXIgaWZhY2UgPSB7XG4gICAgICAnY29uc3RydWN0b3InOiB7dmFsdWU6IFsnc3RyaW5nJ119XG4gICAgfTtcbiAgICB2YXIgb25Nc2cgPSBmdW5jdGlvbihvYmosIHIpIHtcbiAgICAgICAgcmVnID0gcjtcbiAgICAgIH07XG4gICAgdmFyIGNhbGxiYWNrID0gZnVuY3Rpb24obXNnKSB7XG4gICAgICBleHBlY3QobXNnKS50b0VxdWFsKHtcbiAgICAgICAgJ3R5cGUnOiAnY29uc3RydWN0JyxcbiAgICAgICAgJ3RleHQnOiBbJ215IHBhcmFtJ10sXG4gICAgICAgICdiaW5hcnknOiBbXVxuICAgICAgfSk7XG4gICAgICBkb25lKCk7XG4gICAgfTtcbiAgICB2YXIgZGVidWcgPSB7fTtcbiAgICB2YXIgYXBpbWFrZXIgPSBBcGlJbnRlcmZhY2UuYmluZCh7fSwgaWZhY2UsIG9uTXNnLCBjYWxsYmFjaywgZGVidWcpO1xuICAgIHZhciBhcGkgPSBuZXcgYXBpbWFrZXIoJ215IHBhcmFtJyk7XG4gIH0pO1xuXG4gIGl0KFwiRG9lc24ndCBlbmNhcHVzbGF0ZSBjb25zdHJ1Y3RvciBhcmdzIGFzIGFuIGFycmF5LlwiLCBmdW5jdGlvbihkb25lKSB7XG4gICAgdmFyIGlmYWNlID0ge1xuICAgICAgJ2NvbnN0cnVjdG9yJzoge3ZhbHVlOiBbJ29iamVjdCddfVxuICAgIH07XG4gICAgdmFyIG9uTXNnID0gZnVuY3Rpb24ob2JqLCByKSB7XG4gICAgICAgIHJlZyA9IHI7XG4gICAgICB9O1xuICAgIHZhciBjYWxsYmFjayA9IGZ1bmN0aW9uKG1zZykge1xuICAgICAgZXhwZWN0KG1zZykudG9FcXVhbCh7XG4gICAgICAgICd0eXBlJzogJ2NvbnN0cnVjdCcsXG4gICAgICAgICd0ZXh0JzogW3sndGVzdCc6J2hpJ31dLFxuICAgICAgICAnYmluYXJ5JzogW11cbiAgICAgIH0pO1xuICAgICAgZG9uZSgpO1xuICAgIH07XG4gICAgdmFyIGRlYnVnID0ge307XG4gICAgdmFyIGFwaW1ha2VyID0gQXBpSW50ZXJmYWNlLmJpbmQoe30sIGlmYWNlLCBvbk1zZywgY2FsbGJhY2ssIGRlYnVnKTtcbiAgICB2YXIgYXBpID0gbmV3IGFwaW1ha2VyKHsndGVzdCc6J2hpJ30pO1xuICB9KTtcblxuICBpdChcIlJlamVjdHMgbWV0aG9kcyBvbiBmYWlsdXJlLlwiLCBmdW5jdGlvbihkb25lKSB7XG4gICAgdmFyIHByb21pc2UgPSBhcGkudGVzdCgnaGknKSxcbiAgICAgICAgc3B5ID0gamFzbWluZS5jcmVhdGVTcHkoJ2ZhaWwnKTtcbiAgICBwcm9taXNlLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIGV4cGVjdChlcnIpLnRvRXF1YWwoJ0Vycm9yIE9jY3VyZWQnKTtcbiAgICAgIGRvbmUoKTtcbiAgICB9KTtcbiAgICBcbiAgICByZWcoJ21lc3NhZ2UnLCB7XG4gICAgICB0eXBlOiAnbWV0aG9kJyxcbiAgICAgIHJlcUlkOiAwLFxuICAgICAgdGV4dDogJ2VycnZhbCcsXG4gICAgICBlcnJvcjogJ0Vycm9yIE9jY3VyZWQnXG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KFwiZGVsaXZlcnMgZXZlbnRzXCIsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBjYiA9IGphc21pbmUuY3JlYXRlU3B5KCdjYicpO1xuICAgIGFwaS5vbignZXYnLCBjYik7XG4gICAgZXhwZWN0KGNiKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpO1xuXG4gICAgcmVnKCdtZXNzYWdlJywge1xuICAgICAgJ3R5cGUnOiAnZXZlbnQnLFxuICAgICAgJ25hbWUnOiAnZXYnLFxuICAgICAgJ3RleHQnOiAnYm9vIScsXG4gICAgICAnYmluYXJ5JzogW11cbiAgICB9KTtcbiAgICBleHBlY3QoY2IpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCdib28hJyk7XG4gIH0pO1xufSk7XG5cbmFmdGVyRWFjaChmdW5jdGlvbigpIHtcbiAgdmFyIGZyYW1lcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpZnJhbWUnKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBmcmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICBmcmFtZXNbaV0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChmcmFtZXNbaV0pO1xuICB9XG59KTtcblxuZGVzY3JpYmUoXCJDb25zdW1lci5yZWN1cnNpdmVGcmVlemVPYmplY3RcIiwgZnVuY3Rpb24oKSB7XG4gIGl0KFwiRnJlZXplcyBvYmplY3RzXCIsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgb2JqID0ge1xuICAgICAgYTogMSxcbiAgICAgIGI6IHtcbiAgICAgICAgYzogMlxuICAgICAgfVxuICAgIH07XG4gICAgdmFyIGZyb3plbiA9IENvbnN1bWVyLnJlY3Vyc2l2ZUZyZWV6ZU9iamVjdChvYmopO1xuICAgIGZyb3plbi5hID0gNTtcbiAgICBmcm96ZW4uYiA9IDU7XG4gICAgZnJvemVuLmMgPSA1O1xuICAgIGV4cGVjdChmcm96ZW4uYSkudG9FcXVhbCgxKTtcbiAgICBleHBlY3QoZnJvemVuLmIuYykudG9FcXVhbCgyKTtcbiAgfSk7XG59KTtcblxuZGVzY3JpYmUoXCJDb25zdW1lci5jb25mb3JtXCIsIGZ1bmN0aW9uKCkge1xuICB2YXIgZGVidWcgPSB7XG4gICAgZXJyb3I6IGZ1bmN0aW9uKCkge31cbiAgfTtcblxuICBpdChcIkNvbmZvcm1zIFNpbXBsZSB2YWx1ZXMgdG8gdGVtcGxhdGVzXCIsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBibG9iID0gbnVsbDtcbiAgICBpZiAodHlwZW9mKEJsb2IpID09PSB0eXBlb2YoRnVuY3Rpb24pKSB7XG4gICAgICBibG9iID0gbmV3IEJsb2IoWydoaSddKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGJ1aWxkID0gbmV3IFdlYktpdEJsb2JCdWlsZGVyKCk7XG4gICAgICBidWlsZC5hcHBlbmQoJ2hpJyk7XG4gICAgICBibG9iID0gYnVpbGQuZ2V0QmxvYigpO1xuICAgIH1cbiAgICB2YXIgdGVtcGxhdGUgPSB7XG4gICAgICAncDEnOiAnc3RyaW5nJyxcbiAgICAgICdwMic6ICdudW1iZXInLFxuICAgICAgJ3AzJzogJ2Jvb2xlYW4nLFxuICAgICAgJ3A0JzogJ29iamVjdCcsXG4gICAgICAncDUnOiAnYmxvYicsXG4gICAgICAncDYnOiAnYnVmZmVyJyxcbiAgICAgICdwOCc6ICdwcm94eScsXG4gICAgICAncDknOiBbJ2FycmF5JywgJ3N0cmluZyddLFxuICAgICAgJ3AxMCc6IFsnc3RyaW5nJywgJ251bWJlciddLFxuICAgICAgJ3AxMSc6IHsnYSc6ICdzdHJpbmcnLCAnYic6ICdudW1iZXInfVxuICAgIH07XG4gICAgdmFyIGNvcnJlY3QgPSB7XG4gICAgICAncDEnOiAnaGknLFxuICAgICAgJ3AyJzogMTIsXG4gICAgICAncDMnOiB0cnVlLFxuICAgICAgJ3A0Jzogeyd4JzogMTIsICd5JzogNDN9LFxuICAgICAgJ3A1JzogMCxcbiAgICAgICdwNic6IDEsXG4gICAgICAncDgnOiBbJ2FwcCcsICdmbG93JywgJ2lkJ10sXG4gICAgICAncDknOiBbJ3N0cmluZycsICdzdHJpbmcyJywgJ3N0cmluZzMnXSxcbiAgICAgICdwMTAnOiBbJ3Rlc3QnLCAxMl0sXG4gICAgICAncDExJzogeydhJzogJ2hpJywgJ2InOiAxMn1cbiAgICB9O1xuICAgIHZhciBjb25mb3JtZWQgPSBDb25zdW1lci5jb25mb3JtKHRlbXBsYXRlLCBjb3JyZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW2Jsb2IsIG5ldyBBcnJheUJ1ZmZlcigyKV0sIGZhbHNlKTtcbiAgICBjb3JyZWN0WydwNSddID0gY29uZm9ybWVkWydwNSddO1xuICAgIGNvcnJlY3RbJ3A2J10gPSBjb25mb3JtZWRbJ3A2J107XG4gICAgZXhwZWN0KGNvbmZvcm1lZCkudG9FcXVhbChjb3JyZWN0KTtcblxuICAgIHZhciBpbmNvcnJlY3QgPSB7XG4gICAgICAncDAnOiAndGVzdCcsXG4gICAgICAncDEnOiAxMixcbiAgICAgICdwMic6ICcxMicsXG4gICAgICAncDMnOiAnaGVsbG8nLFxuICAgICAgJ3A0JzogWzEsMiwzXSxcbiAgICAgICdwNic6ICdzdHInLFxuICAgICAgJ3A4JzogZnVuY3Rpb24oKSB7fSxcbiAgICAgICdwOSc6IFsxLCB7fV0sXG4gICAgICAncDEwJzogW3RydWUsIGZhbHNlLCB0cnVlXSxcbiAgICAgICdwMTEnOiBbXVxuICAgIH07XG5cbiAgICBjb25mb3JtZWQgPSBDb25zdW1lci5jb25mb3JtKHRlbXBsYXRlLCBpbmNvcnJlY3QsIFswLCBibG9iLCBibG9iXSwgZmFsc2UpO1xuICAgIGV4cGVjdChjb25mb3JtZWQpLnRvRXF1YWwoe1xuICAgICAgJ3AxJzogJzEyJyxcbiAgICAgICdwMic6IDEyLFxuICAgICAgJ3AzJzogZmFsc2UsXG4gICAgICAncDQnOiBbMSwyLDNdLFxuICAgICAgJ3A2JzogY29uZm9ybWVkLnA2LFxuICAgICAgJ3A4JzogdW5kZWZpbmVkLFxuICAgICAgJ3A5JzogWycxJywgJ1tvYmplY3QgT2JqZWN0XSddLFxuICAgICAgJ3AxMCc6IFsndHJ1ZScsIDBdLFxuICAgICAgJ3AxMSc6IHt9XG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KFwiY29uZm9ybXMgc2ltcGxlIGFyZ3VtZW50c1wiLCBmdW5jdGlvbigpIHtcbiAgICBleHBlY3QoQ29uc3VtZXIuY29uZm9ybShcInN0cmluZ1wiLCBcIm15c3RyaW5nXCIsIFtdLCBmYWxzZSwgZGVidWcpKS50b0VxdWFsKFwibXlzdHJpbmdcIik7XG4gICAgZXhwZWN0KENvbnN1bWVyLmNvbmZvcm0oXCJudW1iZXJcIiwgXCJteXN0cmluZ1wiLCBbXSwgZmFsc2UsIGRlYnVnKSkudG9FcXVhbChqYXNtaW5lLmFueShOdW1iZXIpKTtcbiAgICBleHBlY3QoQ29uc3VtZXIuY29uZm9ybShcImJvb2xlYW5cIiwgXCJteXN0cmluZ1wiLCBbXSwgZmFsc2UsIGRlYnVnKSkudG9FcXVhbChmYWxzZSk7XG4gICAgZXhwZWN0KENvbnN1bWVyLmNvbmZvcm0oXCJcIiwgXCJteXN0cmluZ1wiLCBbXSwgZmFsc2UsIGRlYnVnKSkudG9FcXVhbCh1bmRlZmluZWQpO1xuICAgIGV4cGVjdChDb25zdW1lci5jb25mb3JtKFtcInN0cmluZ1wiLCBcIm51bWJlclwiXSwgW1widGVzdFwiLCAwXSwgW10sIGZhbHNlLCBkZWJ1ZykpXG4gICAgICAudG9FcXVhbChbXCJ0ZXN0XCIsIDBdKTtcbiAgICBleHBlY3QoQ29uc3VtZXIuY29uZm9ybShcIm51bWJlclwiLCAwLCBbXSwgZmFsc2UsIGRlYnVnKSkudG9FcXVhbCgwKTtcbiAgfSk7XG5cbiAgaXQoXCJjb25mb3JtcyBjb21wbGV4IGFyZ3VtZW50c1wiLCBmdW5jdGlvbigpIHtcbiAgICBleHBlY3QoQ29uc3VtZXIuY29uZm9ybSh7XCJrZXlcIjpcInN0cmluZ1wifSwge1wia2V5XCI6XCJnb29kXCIsIFwib3RoZXJcIjpcImJhZFwifSxbXSwgZmFsc2UpKS5cbiAgICAgICAgdG9FcXVhbCh7XCJrZXlcIjpcImdvb2RcIn0pO1xuICAgIGV4cGVjdChDb25zdW1lci5jb25mb3JtKFtcInN0cmluZ1wiXSwgW1widGVzdFwiLCAxMl0sW10sIGZhbHNlKSkudG9FcXVhbChbXCJ0ZXN0XCJdKTtcbiAgICBleHBlY3QoQ29uc3VtZXIuY29uZm9ybShbXCJhcnJheVwiLCBcInN0cmluZ1wiXSwgW1widGVzdFwiLCAxMl0sW10sIGZhbHNlKSkudG9FcXVhbChbXCJ0ZXN0XCIsIFwiMTJcIl0pO1xuICAgIGV4cGVjdChDb25zdW1lci5jb25mb3JtKFwib2JqZWN0XCIsIHtcInNpbXBsZVwiOlwic3RyaW5nXCJ9LFtdLCBmYWxzZSkpLnRvRXF1YWwoe1wic2ltcGxlXCI6IFwic3RyaW5nXCJ9KTtcbiAgICAvL2V4cGVjdChmZG9tLnByb3h5LmNvbmZvcm0uYmluZCh7fSwgXCJvYmplY3RcIiwgZnVuY3Rpb24oKSB7fSxbXSwgZmFsc2UpKS50b1Rocm93KCk7XG4gICAgZXhwZWN0KENvbnN1bWVyLmNvbmZvcm0oXCJvYmplY3RcIiwgZnVuY3Rpb24oKSB7fSxbXSwgZmFsc2UpKS5ub3QudG9CZURlZmluZWQoKTtcbiAgfSk7XG5cbiAgaXQoXCJjb25mb3JtcyBudWxsc1wiLCBmdW5jdGlvbigpIHtcbiAgICBleHBlY3QoQ29uc3VtZXIuY29uZm9ybSh7XCJrZXlcIjogXCJzdHJpbmdcIn0sIHtcImtleVwiOiBudWxsfSwgW10sIGZhbHNlKSkuXG4gICAgICB0b0VxdWFsKHtcImtleVwiOiBudWxsfSk7XG4gICAgZXhwZWN0KENvbnN1bWVyLmNvbmZvcm0oXCJvYmplY3RcIiwgbnVsbCwgW10sIGZhbHNlKSkudG9FcXVhbChudWxsKTtcbiAgICBleHBlY3QoQ29uc3VtZXIuY29uZm9ybSh7XCJrZXlcIjogXCJzdHJpbmdcIn0sIHtcImtleVwiOiB1bmRlZmluZWR9LCBbXSwgZmFsc2UpKS5cbiAgICAgIHRvRXF1YWwoe30pO1xuICAgIGV4cGVjdChDb25zdW1lci5jb25mb3JtKFtcInN0cmluZ1wiLCBcInN0cmluZ1wiLCBcInN0cmluZ1wiLCBcInN0cmluZ1wiXSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbbnVsbCwgdW5kZWZpbmVkLCBudWxsLCAwXSwgW10sIGZhbHNlKSkuXG4gICAgICB0b0VxdWFsKFtudWxsLCB1bmRlZmluZWQsIG51bGwsIFwiMFwiXSk7XG4gICAgZXhwZWN0KENvbnN1bWVyLmNvbmZvcm0oXCJvYmplY3RcIiwgdW5kZWZpbmVkLCBbXSwgZmFsc2UpKS50b0VxdWFsKHVuZGVmaW5lZCk7XG4gIH0pO1xuXG4gIGl0KFwiY29uZm9ybXMgYmluYXJ5IGFyZ3VtZW50c1wiLCBmdW5jdGlvbigpIHtcbiAgICAvLyBUT0RPOiB0ZXN0IEJsb2Igc3VwcG9ydCAoQVBJIGlzIG5vbnN0YW5kYXJkIGJldHdlZW4gTm9kZSBhbmQgQnJvd3NlcnMpXG4gICAgLypcbiAgICAgKiB2YXIgYmxvYiA9IG5ldyBCbG9iKFtcInRlc3RcIl0pO1xuICAgICAqIGV4cGVjdChjb25mb3JtKFwiYmxvYlwiLCBibG9iKSkudG9FcXVhbChibG9iKTtcbiAgICAgKiBleHBlY3QoY29uZm9ybShcImJsb2JcIiwgXCJzdHJpbmdcIikpLnRvRXF1YWwoamFzbWluZS5hbnkoQmxvYikpO1xuICAgICAqL1xuXG4gICAgdmFyIGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcig0KTtcbiAgICB2YXIgZXh0ZXJuYWxzID0gW107XG4gICAgZXhwZWN0KENvbnN1bWVyLmNvbmZvcm0oXCJidWZmZXJcIiwgYnVmZmVyLCBleHRlcm5hbHMsIHRydWUsIGRlYnVnKSkudG9FcXVhbCgwKTtcbiAgICBleHBlY3QoZXh0ZXJuYWxzLmxlbmd0aCkudG9FcXVhbCgxKTtcbiAgICBleHBlY3QoQ29uc3VtZXIuY29uZm9ybShcImJ1ZmZlclwiLCAwLCBbXCJzdHJpbmdcIl0sIGZhbHNlLCBkZWJ1ZykpLnRvRXF1YWwoamFzbWluZS5hbnkoQXJyYXlCdWZmZXIpKTtcbiAgICBleHBlY3QoQ29uc3VtZXIuY29uZm9ybShcImJ1ZmZlclwiLCAwLCBleHRlcm5hbHMsIGZhbHNlLCBkZWJ1ZykpLnRvRXF1YWwoYnVmZmVyKTtcbiAgfSk7XG59KTtcbiIsInZhciBEZWJ1ZyA9IHJlcXVpcmUoJy4uLy4uL3NyYy9kZWJ1ZycpO1xudmFyIFJlc291cmNlID0gcmVxdWlyZSgnLi4vLi4vc3JjL3Jlc291cmNlJyk7XG5cbmRlc2NyaWJlKFwiUmVzb3VyY2VcIiwgZnVuY3Rpb24oKSB7XG4gIHZhciByZXNvdXJjZXMsIGRlYnVnO1xuXG4gIGJlZm9yZUVhY2goZnVuY3Rpb24oKSB7XG4gICAgZGVidWcgPSBuZXcgRGVidWcoKTtcbiAgICByZXNvdXJjZXMgPSBuZXcgUmVzb3VyY2UoZGVidWcpO1xuICB9KTtcblxuICBpdChcInNob3VsZCByZXNvbHZlIFVSTHNcIiwgZnVuY3Rpb24oZG9uZSkge1xuICAgIHZhciBwcm9taXNlID0gcmVzb3VyY2VzLmdldChcImh0dHA6Ly9sb2NhbGhvc3QvZm9sZGVyL21hbmlmZXN0Lmpzb25cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZmlsZS5qc1wiKTtcbiAgICB2YXIgY2FsbGJhY2sgPSBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgZXhwZWN0KHJlc3BvbnNlKS50b0VxdWFsKCdodHRwOi8vbG9jYWxob3N0L2ZvbGRlci9maWxlLmpzJyk7XG4gICAgICBkb25lKCk7XG4gICAgfTtcbiAgICBwcm9taXNlLnRoZW4oY2FsbGJhY2spO1xuICB9KTtcblxuICBpdChcInNob3VsZCBjYWNoZSByZXNvbHZlZCBVUkxzXCIsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICBzcHlPbihyZXNvdXJjZXMsICdyZXNvbHZlJykuYW5kLmNhbGxUaHJvdWdoKCk7XG4gICAgdmFyIHByb21pc2UgPSByZXNvdXJjZXMuZ2V0KFwiaHR0cDovL2xvY2FsaG9zdC9mb2xkZXIvbWFuaWZlc3QuanNvblwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJmaWxlLmpzXCIpO1xuICAgIHZhciBjYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgcHJvbWlzZSA9IHJlc291cmNlcy5nZXQoXCJodHRwOi8vbG9jYWxob3N0L2ZvbGRlci9tYW5pZmVzdC5qc29uXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImZpbGUuanNcIik7XG4gICAgICBwcm9taXNlLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIGV4cGVjdChyZXNvdXJjZXMucmVzb2x2ZS5jYWxscy5jb3VudCgpKS50b0VxdWFsKDEpO1xuICAgICAgICBkb25lKCk7XG4gICAgICB9KTtcbiAgICB9O1xuICAgIHByb21pc2UudGhlbihjYWxsYmFjayk7XG4gIH0pO1xuXG4gIGl0KFwic2hvdWxkIGZldGNoIFVSTHNcIiwgZnVuY3Rpb24oZG9uZSkge1xuICAgIHZhciBwcm9taXNlO1xuICAgIHByb21pc2UgPSByZXNvdXJjZXMuZ2V0Q29udGVudHMoJ21hbmlmZXN0Oi8ve1wibmFtZVwiOlwidGVzdFwifScpO1xuICAgIHByb21pc2UudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgZXhwZWN0KEpTT04ucGFyc2UocmVzcG9uc2UpLm5hbWUpLnRvRXF1YWwoXCJ0ZXN0XCIpO1xuICAgICAgZG9uZSgpO1xuICAgIH0pO1xuICB9KTtcbiAgXG4gIGl0KFwic2hvdWxkIHdhcm4gb24gZGVnZW5lcmF0ZSBVUkxzXCIsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICB2YXIgcHJvbWlzZSA9IHJlc291cmNlcy5nZXRDb250ZW50cygpO1xuICAgIHZhciBzcHkgPSBqYXNtaW5lLmNyZWF0ZVNweSgncicpO1xuICAgIHByb21pc2UudGhlbihmdW5jdGlvbigpIHt9LCBmdW5jdGlvbigpIHtcbiAgICAgIHJlc291cmNlcy5yZXNvbHZlKCd0ZXN0JykudGhlbihmdW5jdGlvbigpe30sIGZ1bmN0aW9uKCkge1xuICAgICAgICBkb25lKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgaXQoXCJzaG91bGQgaGFuZGxlIGN1c3RvbSByZXNvbHZlcnNcIiwgZnVuY3Rpb24oZG9uZSkge1xuICAgIHZhciByZXNvbHZlciA9IGZ1bmN0aW9uKG1hbmlmZXN0LCB1cmwsIHJlc29sdmUpIHtcbiAgICAgIGlmIChtYW5pZmVzdC5pbmRleE9mKCd0ZXN0JykgPT09IDApIHtcbiAgICAgICAgcmVzb2x2ZSgncmVzb2x2ZWQ6Ly8nICsgdXJsKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfTtcbiAgICByZXNvdXJjZXMuYWRkUmVzb2x2ZXIocmVzb2x2ZXIpO1xuXG4gICAgcmVzb3VyY2VzLmdldCgndGVzdDovL21hbmlmZXN0JywgJ215dXJsJykudGhlbihmdW5jdGlvbih1cmwpIHtcbiAgICAgIGV4cGVjdCh1cmwpLnRvRXF1YWwoJ3Jlc29sdmVkOi8vbXl1cmwnKTtcbiAgICAgIHJlc291cmNlcy5nZXQoJ290aGVycHJvdDovL21hbmlmZXN0JywgJ215dXJsJykudGhlbihmdW5jdGlvbih1cmwyKSB7XG4gICAgICAgIGV4cGVjdCh1cmwyKS50b0VxdWFsKHVuZGVmaW5lZCk7XG4gICAgICB9KTtcbiAgICAgIHNldFRpbWVvdXQoZG9uZSwwKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgaXQoXCJzaG91bGQgaGFuZGxlIGN1c3RvbSByZXRyaWV2ZXJzXCIsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICB2YXIgcmV0cmlldmVyID0gZnVuY3Rpb24odXJsLCByZXNvbHZlKSB7XG4gICAgICBleHBlY3QodXJsKS50b0NvbnRhaW4oXCJ0ZXN0Oi8vXCIpO1xuICAgICAgcmVzb2x2ZSgnQ3VzdG9tIGNvbnRlbnQhJyk7XG4gICAgfTtcbiAgICByZXNvdXJjZXMuYWRkUmV0cmlldmVyKCd0ZXN0JywgcmV0cmlldmVyKTtcblxuICAgIHJlc291cmNlcy5nZXRDb250ZW50cygndGVzdDovL3VybCcpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuICAgICAgZXhwZWN0KGRhdGEpLnRvRXF1YWwoJ0N1c3RvbSBjb250ZW50IScpO1xuICAgICAgcmVzb3VyY2VzLmdldENvbnRlbnRzKCd1bmtub3duOi8vdXJsJykudGhlbihmdW5jdGlvbigpe30sIGZ1bmN0aW9uKCl7XG4gICAgICAgIGRvbmUoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBpdChcInNob3VsZCBub3QgYWxsb3cgcmVwbGFjaW5nIHJldHJpZXZlcnNcIiwgZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJldHJpZXZlciA9IGZ1bmN0aW9uKHVybCwgZGVmZXJyZWQpIHtcbiAgICAgIGV4cGVjdCh1cmwpLnRvQ29udGFpbihcInRlc3Q6Ly9cIik7XG4gICAgICBkZWZlcnJlZC5yZXNvbHZlKCdDdXN0b20gY29udGVudCEnKTtcbiAgICB9O1xuICAgIHNweU9uKGRlYnVnLCAnd2FybicpO1xuICAgIHJlc291cmNlcy5hZGRSZXRyaWV2ZXIoJ2h0dHAnLCByZXRyaWV2ZXIpO1xuICAgIGV4cGVjdChkZWJ1Zy53YXJuKS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gIH0pO1xufSk7XG5cbmRlc2NyaWJlKCdyZXNvdXJjZXMuaHR0cFJlc29sdmVyJywgZnVuY3Rpb24oKSB7XG4gIHZhciByLCBmLCBzcHksIHJlc291cmNlcztcblxuICBiZWZvcmVFYWNoKGZ1bmN0aW9uKCkge1xuICAgIHJlc291cmNlcyA9IG5ldyBSZXNvdXJjZSgpO1xuICAgIHIgPSBzcHkgPSBqYXNtaW5lLmNyZWF0ZVNweSgncmVzb2x2ZWRVUkwnKTtcbiAgICBmID0gamFzbWluZS5jcmVhdGVTcHkoJ3JlamVjdFVSTCcpO1xuICB9KTtcblxuICBpdChcInNob3VsZCByZXNvbHZlIHJlbGF0aXZlIFVSTHNcIiwgZnVuY3Rpb24oKSB7XG4gICAgcmVzb3VyY2VzLmh0dHBSZXNvbHZlcignaHR0cDovL3d3dy5leGFtcGxlLmNvbS9wYXRoL21hbmlmZXN0Lmpzb24nLCAndGVzdC5odG1sJywgciwgZik7XG4gICAgZXhwZWN0KHNweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoJ2h0dHA6Ly93d3cuZXhhbXBsZS5jb20vcGF0aC90ZXN0Lmh0bWwnKTtcbiAgfSk7XG5cbiAgaXQoXCJzaG91bGQgcmVzb2x2ZSBwYXRoIGFic29sdXRlIFVSTHNcIiwgZnVuY3Rpb24oKSB7XG4gICAgcmVzb3VyY2VzLmh0dHBSZXNvbHZlcignaHR0cDovL3d3dy5leGFtcGxlLmNvbS9wYXRoL21hbmlmZXN0Lmpzb24nLCAnL3Rlc3QuaHRtbCcsIHIsIGYpO1xuICAgIGV4cGVjdChzcHkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCdodHRwOi8vd3d3LmV4YW1wbGUuY29tL3Rlc3QuaHRtbCcpO1xuICB9KTtcblxuICBpdChcInNob3VsZCByZXNvbHZlIGFic29sdXRlIFVSTHNcIiwgZnVuY3Rpb24oKSB7XG4gICAgcmVzb3VyY2VzLmh0dHBSZXNvbHZlcignaHR0cDovL3d3dy5leGFtcGxlLmNvbS9wYXRoL21hbmlmZXN0Lmpzb24nLCAnaHR0cDovL3d3dy5vdGhlci5jb20vdGVzdC5odG1sJywgciwgZik7XG4gICAgZXhwZWN0KHNweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoJ2h0dHA6Ly93d3cub3RoZXIuY29tL3Rlc3QuaHRtbCcpO1xuICB9KTtcblxuICBpdChcInNob3VsZCBub3QgcmVzb2x2ZSBVUkxzIHdpdGhvdXQgbWFuaWZlc3RcIiwgZnVuY3Rpb24oKSB7XG4gICAgcmVzb3VyY2VzLmh0dHBSZXNvbHZlcih1bmRlZmluZWQsICd0ZXN0Lmh0bWwnLCByLCBmKTtcbiAgICBleHBlY3QoZikudG9IYXZlQmVlbkNhbGxlZCgpO1xuICB9KTtcblxuICBpdChcInNob3VsZCByZW1vdmUgcmVsYXRpdmUgcGF0aHNcIiwgZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlc3VsdCA9IFJlc291cmNlLnJlbW92ZVJlbGF0aXZlUGF0aCgnaHR0cDovLy8vd3d3LmV4YW1wbGUuY29tLy4vLi4vdGVzdDEvdGVzdDIvLi4vdGVzdDMvJylcbiAgICBleHBlY3QocmVzdWx0KS50b0VxdWFsKCdodHRwOi8vd3d3LmV4YW1wbGUuY29tL3Rlc3QxL3Rlc3QzLycpO1xuICB9KTtcblxuICBpdChcInNob3VsZCByZXNvbHZlIHBhdGhzIHdpdGggcmVsYXRpdmUgcGF0aHNcIiwgZnVuY3Rpb24oKSB7XG4gICAgcmVzb3VyY2VzLmh0dHBSZXNvbHZlcignaHR0cDovL3d3dy5leGFtcGxlLmNvbS9wYXRoL21hbmlmZXN0Lmpzb24nLCAnLi4vLi4vdGVzdC5odG1sJywgciwgZik7XG4gICAgZXhwZWN0KHNweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoJ2h0dHA6Ly93d3cuZXhhbXBsZS5jb20vdGVzdC5odG1sJyk7XG4gIH0pO1xuXG4gIGl0KFwic2hvdWxkIHJlbW92ZSBidWdneSBjY2EgVVJMc1wiLCBmdW5jdGlvbigpIHtcbiAgICByZXNvdXJjZXMuaHR0cFJlc29sdmVyKCdjaHJvbWUtZXh0ZW5zaW9uOi8vLy9leHRlbnNpb25pZC9tYW5pZmVzdC5qc29uJywgJ3Jlc291cmNlLmpzJywgciwgZik7XG4gICAgZXhwZWN0KHNweSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoJ2Nocm9tZS1leHRlbnNpb246Ly9leHRlbnNpb25pZC9yZXNvdXJjZS5qcycpO1xuICB9KTtcbn0pO1xuIiwidmFyIHV0aWwgPSByZXF1aXJlKCcuLi8uLi9zcmMvdXRpbCcpO1xuXG5kZXNjcmliZShcInV0aWxcIiwgZnVuY3Rpb24oKSB7XG4gIGl0KFwiaXRlcmF0ZXMgb3ZlciBhbiBhcnJheVwiLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJyYXkgPSBbMSwgNCwgOSwgMTZdO1xuICAgIHZhciBzdW0gPSAwO1xuICAgIHZhciBpZHMgPSBbXTtcbiAgICB1dGlsLmVhY2hSZXZlcnNlKGFycmF5LCBmdW5jdGlvbihlbCwgaWR4KSB7XG4gICAgICBzdW0gKz0gZWw7XG4gICAgICBpZHMucHVzaChpZHgpO1xuICAgIH0pO1xuXG4gICAgZXhwZWN0KHN1bSkudG9FcXVhbCgzMCk7XG4gICAgZXhwZWN0KGlkcykudG9FcXVhbChbMywgMiwgMSwgMF0pO1xuXG4gICAgdXRpbC5lYWNoUmV2ZXJzZShmYWxzZSwgZnVuY3Rpb24oKSB7XG4gICAgICBzdW0gPSAxMDA7XG4gICAgfSk7XG4gICAgZXhwZWN0KHN1bSkudG9FcXVhbCgzMCk7XG4gIH0pO1xuXG4gIGl0KFwic3RvcHMgaXRlcmF0aW5nIGlmIG5lZWRlZFwiLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJyYXkgPSBbMSwgNCwgOSwgMTZdO1xuICAgIHZhciBzdW0gPSAwO1xuICAgIHV0aWwuZWFjaFJldmVyc2UoYXJyYXksIGZ1bmN0aW9uKGVsKSB7XG4gICAgICBzdW0gKz0gZWw7XG4gICAgICByZXR1cm4gZWwgJSAyICE9IDA7XG4gICAgfSk7XG4gICAgZXhwZWN0KHN1bSkudG9FcXVhbCgyNSk7XG4gIH0pO1xuXG4gIGl0KFwibG9jYXRlcyBwcm9wZXJ0aWVzXCIsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBvYmogPSB7fTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBcInRlc3RQcm9wXCIsIHt9KTtcblxuICAgIGV4cGVjdCh1dGlsLmhhc1Byb3Aob2JqLCBcInRlc3RQcm9wXCIpKS50b0JlVHJ1dGh5KCk7XG4gIH0pO1xuXG4gIGl0KFwiaXRlcmF0ZXMgcHJvcGVydGllc1wiLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgb2JqID0ge1xuICAgICAgYTogMSxcbiAgICAgIGI6IDIsXG4gICAgICBjOiA0XG4gICAgfTtcbiAgICB2YXIgc3VtID0gMDtcbiAgICB2YXIgcHJvcHMgPSBbXTtcbiAgICB1dGlsLmVhY2hQcm9wKG9iaiwgZnVuY3Rpb24odmFsLCBuYW1lKSB7XG4gICAgICBzdW0gKz0gdmFsO1xuICAgICAgcHJvcHMucHVzaChuYW1lKTtcbiAgICB9KTtcblxuICAgIGV4cGVjdChzdW0pLnRvRXF1YWwoNyk7XG4gICAgZXhwZWN0KHByb3BzKS50b0NvbnRhaW4oJ2EnKTtcbiAgICBleHBlY3QocHJvcHMpLnRvQ29udGFpbignYycpO1xuXG4gICAgc3VtID0gMDtcbiAgICB1dGlsLmVhY2hQcm9wKG9iaiwgZnVuY3Rpb24odmFsLCBuYW1lKSB7XG4gICAgICBzdW0gKz0gdmFsO1xuICAgICAgcmV0dXJuIG5hbWUgPT09ICdiJ1xuICAgIH0pO1xuICAgIGV4cGVjdChzdW0pLnRvRXF1YWwoMyk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKFwibWl4aW5cIiwgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGJhc2UsIG90aGVyO1xuXG4gICAgYmVmb3JlRWFjaChmdW5jdGlvbigpIHtcbiAgICAgIGJhc2UgPSB7dmFsdWU6IDF9O1xuICAgICAgb3RoZXIgPSB7dmFsdWU6IDIsIG90aGVyOjJ9O1xuICAgIH0pO1xuXG4gICAgaXQoXCJtaXhlcyBPYmplY3RzIHRvZ2V0aGVyXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgdXRpbC5taXhpbihiYXNlLCBvdGhlcik7XG4gICAgICBleHBlY3QoYmFzZS52YWx1ZSkudG9FcXVhbCgxKTtcbiAgICAgIGV4cGVjdChiYXNlLm90aGVyKS50b0VxdWFsKDIpO1xuICAgIH0pO1xuXG4gICAgaXQoXCJmb3JjYWJseSBtaXhlcyBPYmplY3RzIHRvZ2V0aGVyXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgdXRpbC5taXhpbihiYXNlLCBvdGhlciwgdHJ1ZSk7XG4gICAgICBleHBlY3QoYmFzZS52YWx1ZSkudG9FcXVhbCgyKTtcbiAgICAgIGV4cGVjdChiYXNlLm90aGVyKS50b0VxdWFsKDIpO1xuICAgIH0pO1xuXG4gICAgaXQoXCJyZWN1cnNpdmVseSBtaXhlcyBPYmplY3RzIHRvZ2V0aGVyXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgYmFzZS5vYmogPSB7dmFsOiAxLCBtaW5lOiAzfTtcbiAgICAgIG90aGVyLm9iaiA9IHt2YWw6IDJ9O1xuICAgICAgdXRpbC5taXhpbihiYXNlLCBvdGhlciwgdHJ1ZSk7XG4gICAgICBleHBlY3QoYmFzZS5vYmoudmFsKS50b0VxdWFsKDIpO1xuICAgICAgZXhwZWN0KGJhc2Uub2JqLm1pbmUpLnRvQmVVbmRlZmluZWQoKTtcbiAgICB9KTtcblxuICAgIGl0KFwiaGFuZGxlcyBkZWdlbmVyYXRlIG1peGluc1wiLCBmdW5jdGlvbigpIHtcbiAgICAgIHZhciByZXN1bHQgPSB1dGlsLm1peGluKGJhc2UsIG51bGwsIHRydWUpO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG9FcXVhbCh7dmFsdWU6IDF9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoXCJnZXRJZFwiLCBmdW5jdGlvbigpIHtcbiAgICBpdChcImNyZWF0ZXMgdW5pcXVlIElEc1wiLCBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpZDEgPSB1dGlsLmdldElkKCk7XG4gICAgICB2YXIgaWQyID0gdXRpbC5nZXRJZCgpO1xuICAgICAgZXhwZWN0KGlkMSkubm90LnRvRXF1YWwoaWQyKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoXCJoYW5kbGVFdmVudHNcIiwgZnVuY3Rpb24oKSB7XG4gICAgdmFyIG9iamVjdCwgY2I7XG5cbiAgICBiZWZvcmVFYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgb2JqZWN0ID0ge307XG4gICAgICBjYiA9IGphc21pbmUuY3JlYXRlU3B5KCdjYicpO1xuICAgICAgdXRpbC5oYW5kbGVFdmVudHMob2JqZWN0KTtcbiAgICB9KTtcblxuICAgIGl0KFwiY2FuIGV4ZWN1dGUgZXZlbnRzXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgb2JqZWN0Lm9uKCdtc2cnLCBjYik7XG4gICAgICBvYmplY3QuZW1pdCgnbXNnJywgJ3ZhbHVlJyk7XG4gICAgICBvYmplY3QuZW1pdCgnbXNnJywgJ3ZhbHVlMicpO1xuICAgICAgZXhwZWN0KGNiKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCgndmFsdWUyJyk7XG4gICAgICBleHBlY3QoY2IuY2FsbHMuY291bnQoKSkudG9FcXVhbCgyKTtcbiAgICB9KTtcblxuICAgIGl0KFwiY2FuIGV4ZWN1dGUgZXZlbnRzICdPbmNlJ1wiLCBmdW5jdGlvbigpIHtcbiAgICAgIG9iamVjdC5vbmNlKCdtc2cnLCBjYik7XG4gICAgICBvYmplY3QuZW1pdCgnbXNnJywgJ3ZhbHVlJyk7XG4gICAgICBvYmplY3QuZW1pdCgnbXNnJywgJ3ZhbHVlMicpO1xuICAgICAgZXhwZWN0KGNiKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCgndmFsdWUnKTtcbiAgICAgIGV4cGVjdChjYi5jYWxscy5jb3VudCgpKS50b0VxdWFsKDEpO1xuICAgIH0pO1xuXG4gICAgaXQoXCJjYW4gZXhlY3V0ZSBldmVudHMgY29uZGl0aW9uYWxseVwiLCBmdW5jdGlvbigpIHtcbiAgICAgIG9iamVjdC5vbmNlKGZ1bmN0aW9uKHR5cGUsIHZhbCkge1xuICAgICAgICByZXR1cm4gdmFsID09ICd5ZXMnO1xuICAgICAgfSwgY2IpO1xuICAgICAgb2JqZWN0LmVtaXQoJ21zZycsICd2YWx1ZScpO1xuICAgICAgb2JqZWN0LmVtaXQoJ21zZycsICd5ZXMnKTtcbiAgICAgIG9iamVjdC5lbWl0KCdvdGhlcm1zZycsICd5ZXMnKTtcbiAgICAgIGV4cGVjdChjYikudG9IYXZlQmVlbkNhbGxlZFdpdGgoJ3llcycpO1xuICAgICAgZXhwZWN0KGNiLmNhbGxzLmNvdW50KCkpLnRvRXF1YWwoMSk7XG4gICAgfSk7XG4gICAgXG4gICAgaXQoXCJjYW4gcmVxdWV1ZSBjb25kaXRpb2FubCBldmVudHNcIiwgZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZiA9IGZ1bmN0aW9uKG0pIHtcbiAgICAgICAgbSA9PSAnb2snID8gY2IoKSA6IG9iamVjdC5vbmNlKCdtc2cnLCBmKTtcbiAgICAgIH07XG4gICAgICBvYmplY3Qub25jZSgnbXNnJywgZik7XG4gICAgICBvYmplY3QuZW1pdCgnbXNnJywgJ2JhZCcpO1xuICAgICAgZXhwZWN0KGNiKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgICAgb2JqZWN0LmVtaXQoJ21zZycsICdvaycpO1xuICAgICAgZXhwZWN0KGNiKS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgfSk7XG5cbiAgICBpdChcImNhbiB1bnJlZ2lzdGVyIGV2ZW50c1wiLCBmdW5jdGlvbigpIHtcbiAgICAgIG9iamVjdC5vbignbXNnJywgY2IpO1xuICAgICAgb2JqZWN0Lm9mZignbXNnJywgY2IpO1xuICAgICAgb2JqZWN0LmVtaXQoJ21zZycsICd2YWx1ZScpO1xuICAgICAgZXhwZWN0KGNiKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgIH0pO1xuXG4gICAgaXQoXCJDYW4gY2xlYW51cCBhbGwgZXZlbnRzXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgb2JqZWN0Lm9uKCdtc2cnLCBjYik7XG4gICAgICBvYmplY3Qub24oJ290aGVyJywgY2IpO1xuICAgICAgb2JqZWN0Lm9mZigpO1xuICAgICAgb2JqZWN0LmVtaXQoJ21zZycsICd2YWx1ZScpO1xuICAgICAgZXhwZWN0KGNiKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgIH0pO1xuXG4gICAgaXQoXCJjYW4gdW5yZWdpc3RlciBjb25kaXRpb25hbCBldmVudHNcIiwgZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZnVuYyA9IGZ1bmN0aW9uKHR5cGUsIHZhbCkge1xuICAgICAgICByZXR1cm4gdmFsID09ICd5ZXMnO1xuICAgICAgfTtcbiAgICAgIG9iamVjdC5vbmNlKGZ1bmMsIGNiKTtcbiAgICAgIG9iamVjdC5vZmYoZnVuYyk7XG4gICAgICBvYmplY3QuZW1pdCgnbXNnJywgJ3llcycpO1xuICAgICAgZXhwZWN0KGNiKS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgIH0pXG4gIH0pO1xufSk7XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgQXBpID0gcmVxdWlyZSgnLi4vc3JjL2FwaScpO1xudmFyIEFwaUludGVyZmFjZSA9IHJlcXVpcmUoJy4uL3NyYy9wcm94eS9hcGlJbnRlcmZhY2UnKTtcbnZhciBCdW5kbGUgPSByZXF1aXJlKCcuLi9zcmMvYnVuZGxlJyk7XG52YXIgQ29uc3VtZXIgPSByZXF1aXJlKCcuLi9zcmMvY29uc3VtZXInKTtcbnZhciBEZWJ1ZyA9IHJlcXVpcmUoJy4uL3NyYy9kZWJ1ZycpO1xudmFyIFByb3ZpZGVyID0gcmVxdWlyZSgnLi4vc3JjL3Byb3ZpZGVyJyk7XG52YXIgUmVzb3VyY2UgPSByZXF1aXJlKCcuLi9zcmMvcmVzb3VyY2UnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vc3JjL3V0aWwnKTtcbnZhciBGcmFtZSA9IHJlcXVpcmUoJy4uL3NyYy9saW5rL2ZyYW1lJyk7XG52YXIgUHJvbWlzZUNvbXBhdCA9IHJlcXVpcmUoJ2VzNi1wcm9taXNlJykuUHJvbWlzZTtcblxuZXhwb3J0cy5jcmVhdGVUZXN0UG9ydCA9IGZ1bmN0aW9uKGlkKSB7XG4gIHZhciBwb3J0ID0ge1xuICAgIGlkOiBpZCxcbiAgICBtZXNzYWdlczogW10sXG4gICAgZ290TWVzc2FnZUNhbGxzOiBbXSxcbiAgICBjaGVja0dvdE1lc3NhZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGxlbiA9IHRoaXMuZ290TWVzc2FnZUNhbGxzLmxlbmd0aDtcbiAgICAgIGZvciAodmFyIGk9MDsgaTxsZW47IGkrKykge1xuICAgICAgICB2YXIgY2FsbCA9IHRoaXMuZ290TWVzc2FnZUNhbGxzLnNoaWZ0KCk7XG4gICAgICAgIHZhciByZXN1bHQgPSB0aGlzLmdvdE1lc3NhZ2UoY2FsbC5mcm9tLCBjYWxsLm1hdGNoKTtcbiAgICAgICAgaWYgKHJlc3VsdCAhPT0gZmFsc2UpIHtcbiAgICAgICAgICBjYWxsLmNhbGxiYWNrKHJlc3VsdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5nb3RNZXNzYWdlQ2FsbHMucHVzaChjYWxsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgb25NZXNzYWdlOiBmdW5jdGlvbihmcm9tLCBtc2cpIHtcbiAgICAgIHRoaXMubWVzc2FnZXMucHVzaChbZnJvbSwgbXNnXSk7XG4gICAgICB0aGlzLmVtaXQoJ29uTWVzc2FnZScsIG1zZyk7XG4gICAgICB0aGlzLmNoZWNrR290TWVzc2FnZSgpO1xuICAgIH0sXG4gICAgZ290TWVzc2FnZTogZnVuY3Rpb24oZnJvbSwgbWF0Y2gpIHtcbiAgICAgIHZhciBva2F5O1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1lc3NhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0aGlzLm1lc3NhZ2VzW2ldWzBdID09PSBmcm9tKSB7XG4gICAgICAgICAgb2theSA9IHRydWU7XG4gICAgICAgICAgZm9yICh2YXIgaiBpbiBtYXRjaCkge1xuICAgICAgICAgICAgaWYgKHRoaXMubWVzc2FnZXNbaV1bMV1bal0gIT09IG1hdGNoW2pdKSB7XG4gICAgICAgICAgICAgIG9rYXkgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG9rYXkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1lc3NhZ2VzW2ldWzFdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG4gICAgZ290TWVzc2FnZUFzeW5jOiBmdW5jdGlvbihmcm9tLCBtYXRjaCwgY2FsbGJhY2spIHtcbiAgICAgIHRoaXMuZ290TWVzc2FnZUNhbGxzLnB1c2goe1xuICAgICAgICBmcm9tOiBmcm9tLFxuICAgICAgICBtYXRjaDogbWF0Y2gsXG4gICAgICAgIGNhbGxiYWNrOiBjYWxsYmFja1xuICAgICAgfSk7XG4gICAgICB0aGlzLmNoZWNrR290TWVzc2FnZSgpO1xuICAgIH1cbiAgICBcbiAgfTtcblxuICB1dGlsLmhhbmRsZUV2ZW50cyhwb3J0KTtcblxuICByZXR1cm4gcG9ydDtcbn07XG5cbmV4cG9ydHMuY3JlYXRlTW9ja1BvbGljeSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIGFwaTogbmV3IEFwaSgpLFxuICAgIGRlYnVnOiBuZXcgRGVidWcoKVxuICB9O1xufTtcblxuZXhwb3J0cy5tb2NrSWZhY2UgPSBmdW5jdGlvbihwcm9wcywgY29uc3RzKSB7XG4gIHZhciBpZmFjZSA9IHt9O1xuICBwcm9wcy5mb3JFYWNoKGZ1bmN0aW9uKHApIHtcbiAgICBpZiAocFsxXSAmJiBwWzFdLnRoZW4pIHtcbiAgICAgIGlmYWNlW3BbMF1dID0gZnVuY3Rpb24ocikge1xuICAgICAgICByZXR1cm4gcjtcbiAgICAgIH0uYmluZCh7fSwgcFsxXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmYWNlW3BbMF1dID0gZnVuY3Rpb24ocikge1xuICAgICAgICByZXR1cm4gUHJvbWlzZUNvbXBhdC5yZXNvbHZlKHIpO1xuICAgICAgfS5iaW5kKHt9LCBwWzFdKTtcbiAgICB9XG4gICAgc3B5T24oaWZhY2UsIHBbMF0pLmFuZC5jYWxsVGhyb3VnaCgpO1xuICB9KTtcbiAgaWYgKGNvbnN0cykge1xuICAgIGNvbnN0cy5mb3JFYWNoKGZ1bmN0aW9uKGMpIHtcbiAgICAgIGlmYWNlW2NbMF1dID0gY1sxXTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGlmYWNlO1xuICB9O1xufTtcblxuZXhwb3J0cy5nZXRBcGlzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBhcGkgPSBuZXcgQXBpKCk7XG4gIEJ1bmRsZS5yZWdpc3RlcihbXSwgYXBpKTtcbiAgcmV0dXJuIGFwaTtcbn07XG5cbi8vIFNldHVwIHJlc291cmNlIGxvYWRpbmcgZm9yIHRoZSB0ZXN0IGVudmlyb25tZW50LCB3aGljaCB1c2VzIGZpbGU6Ly8gdXJscy5cbnZhciBzcGVjQmFzZSA9IG51bGwsIGV4dHJhUmVzb2x2ZSA9IGZ1bmN0aW9uKCkge307XG4oZnVuY3Rpb24gZmluZERlZmF1bHRCYXNlKCkge1xuICBpZiAodHlwZW9mIGxvY2F0aW9uID09PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbG9jID0gbG9jYXRpb24ucHJvdG9jb2wgKyBcIi8vXCIgKyBsb2NhdGlvbi5ob3N0ICsgbG9jYXRpb24ucGF0aG5hbWU7XG4gIHZhciBkaXJuYW1lID0gbG9jLnN1YnN0cigwLCBsb2MubGFzdEluZGV4T2YoJy8nKSk7XG4gIHNwZWNCYXNlID0gZGlybmFtZTtcbn0pKCk7XG5cbi8qKlxuICogRGVmaW5lIHdoZXJlIHRoZSByZWxhdGl2ZSByZXNvbHZlciB1c2VkIGJ5IGdlbmVyaWMgaW50ZWdyYXRpb24gdGVzdHNcbiAqIHNob3VsZCBtYXAgdG8sIGFuZCBwcm92aWRlIGEgaG9vayB0byByZWdpc3RlciBhZGRpdGlvbmFsLCBpbXBsZW1lbnRhdGlvblxuICogc3BlY2lmaWMgcmVzb2x2ZXJzLlxuICovXG5leHBvcnRzLnNldFNwZWNCYXNlID0gZnVuY3Rpb24oYmFzZSwgcmVzb2x2ZXJzKSB7XG4gIHNwZWNCYXNlID0gYmFzZTtcbiAgaWYgKHJlc29sdmVycykge1xuICAgIGV4dHJhUmVzb2x2ZSA9IHJlc29sdmVycztcbiAgfVxufVxuXG5leHBvcnRzLmdldFJlc29sdmVycyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmVzb2x2ZXJzID0gW107XG4gIHJlc29sdmVycy5wdXNoKHsncmVzb2x2ZXInOiBmdW5jdGlvbihtYW5pZmVzdCwgdXJsLCByZXNvbHZlLCByZWplY3QpIHtcbiAgICBpZiAodXJsLmluZGV4T2YoJ3JlbGF0aXZlOi8vJykgPT09IDApIHtcbiAgICAgIHJlc29sdmUoc3BlY0Jhc2UgKyAnLycgKyB1cmwuc3Vic3RyKDExKSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmVqZWN0KCk7XG4gIH19KTtcbiAgcmVzb2x2ZXJzLnB1c2goeydyZXNvbHZlcic6IGZ1bmN0aW9uKG1hbmlmZXN0LCB1cmwsIHJlc29sdmUsIHJlamVjdCkge1xuICAgIGlmIChtYW5pZmVzdCAmJiBtYW5pZmVzdC5pbmRleE9mKCdmaWxlOi8vJykgPT09IDApIHtcbiAgICAgIG1hbmlmZXN0ID0gJ2h0dHAnICsgbWFuaWZlc3Quc3Vic3RyKDQpO1xuICAgICAgcnNyYy5yZXNvbHZlKG1hbmlmZXN0LCB1cmwpLnRoZW4oZnVuY3Rpb24oYWRkcikge1xuICAgICAgICBhZGRyID0gJ2ZpbGUnICsgYWRkci5zdWJzdHIoNCk7XG4gICAgICAgIHJlc29sdmUoYWRkcik7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZWplY3QoKTtcbiAgfX0pO1xuICB2YXIgcnNyYyA9IG5ldyBSZXNvdXJjZSgpO1xuICByZXNvbHZlcnMucHVzaCh7J3Byb3RvJzonZmlsZScsICdyZXRyaWV2ZXInOiByc3JjLnhoclJldHJpZXZlcn0pO1xuICByZXNvbHZlcnMucHVzaCh7J3Byb3RvJzonbnVsbCcsICdyZXRyaWV2ZXInOiByc3JjLnhoclJldHJpZXZlcn0pO1xuICBleHRyYVJlc29sdmUocmVzb2x2ZXJzKTtcbiAgcmV0dXJuIHJlc29sdmVycztcbn1cblxuZXhwb3J0cy5zZXR1cFJlc29sdmVycyA9IGZ1bmN0aW9uKCkgeyBcbiAgdmFyIHJzcmMgPSBuZXcgUmVzb3VyY2UoKTtcbiAgcnNyYy5yZWdpc3RlcihleHBvcnRzLmdldFJlc29sdmVycygpKTtcbiAgcmV0dXJuIHJzcmM7XG59XG5cbnZhciBhY3RpdmVDb250ZXh0cyA9IFtdO1xuZXhwb3J0cy5jbGVhbnVwSWZyYW1lcyA9IGZ1bmN0aW9uKCkge1xuICBhY3RpdmVDb250ZXh0cy5mb3JFYWNoKGZ1bmN0aW9uKGYpIHtcbiAgICBmLmNsb3NlKCk7XG4gIH0pO1xuICBhY3RpdmVDb250ZXh0cyA9IFtdO1xuICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgZnJhbWVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpO1xuICAvLyBmcmFtZXMgaXMgYSBsaXZlIEhUTUxDb2xsZWN0aW9uLCBzbyBpdCBpcyBtb2RpZmllZCBlYWNoIHRpbWUgYW5cbiAgLy8gZWxlbWVudCBpcyByZW1vdmVkLlxuICB3aGlsZSAoZnJhbWVzLmxlbmd0aCA+IDApIHtcbiAgICBmcmFtZXNbMF0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChmcmFtZXNbMF0pO1xuICB9XG59XG5cbnZhciBjb3JlUHJvdmlkZXJzO1xuZXhwb3J0cy5zZXRDb3JlUHJvdmlkZXJzID0gZnVuY3Rpb24ocHJvdmlkZXJzKSB7XG4gIGNvcmVQcm92aWRlcnMgPSBwcm92aWRlcnM7XG59O1xudmFyIHRlc3RQb3J0ID0gRnJhbWU7XG52YXIgdGVzdFNvdXJjZSA9IFwic3BlYy9oZWxwZXIvZnJhbWUuanNcIjtcbnZhciB0ZXN0RGVidWcgPSAnZGVidWcnO1xuZXhwb3J0cy5zZXRNb2R1bGVTdHJhdGVneSA9IGZ1bmN0aW9uKHBvcnQsIHNvdXJjZSwgZGVidWcpIHtcbiAgdGVzdFBvcnQgPSBwb3J0O1xuICB0ZXN0U291cmNlID0gc291cmNlO1xuICB0ZXN0RGVidWcgPSBkZWJ1Zztcbn07XG5cbmV4cG9ydHMuc2V0dXBNb2R1bGUgPSBmdW5jdGlvbihtYW5pZmVzdF91cmwsIG9wdGlvbnMpIHtcbiAgdmFyIG15R2xvYmFsID0gZ2xvYmFsLCBkaXIgPSAnJztcbiAgaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBteUdsb2JhbCA9IHtcbiAgICAgIGRvY3VtZW50OiBkb2N1bWVudFxuICAgIH07XG4gIH1cbiAgaWYgKCFvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IHt9O1xuICB9XG5cbiAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7ICBcbiAgICB2YXIgcGF0aCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLFxuICAgICAgICBkaXJfaWR4ID0gcGF0aC5sYXN0SW5kZXhPZignLycpO1xuICAgIGRpciA9IHBhdGguc3Vic3RyKDAsIGRpcl9pZHgpICsgJy8nO1xuICB9XG4gIHZhciBmcmVlZG9tID0gcmVxdWlyZSgnLi4vc3JjL2VudHJ5Jykoe1xuICAgICAgJ2dsb2JhbCc6IG15R2xvYmFsLFxuICAgICAgJ2lzTW9kdWxlJzogZmFsc2UsXG4gICAgICAncHJvdmlkZXJzJzogY29yZVByb3ZpZGVycyxcbiAgICAgICdyZXNvbHZlcnMnOiBleHBvcnRzLmdldFJlc29sdmVycygpLFxuICAgICAgJ3BvcnRUeXBlJzogdGVzdFBvcnQsXG4gICAgICAnc291cmNlJzogZGlyICsgdGVzdFNvdXJjZSxcbiAgICAgICdpbmplY3QnOiBbXG4gICAgICAgIGRpciArIFwibm9kZV9tb2R1bGVzL2VzNS1zaGltL2VzNS1zaGltLmpzXCIsXG4gICAgICAgIGRpciArIFwibm9kZV9tb2R1bGVzL2VzNi1wcm9taXNlL2Rpc3QvcHJvbWlzZS0xLjAuMC5qc1wiXG4gICAgICBdXG4gICAgfSwgbWFuaWZlc3RfdXJsLCBvcHRpb25zKTtcbiAgZnJlZWRvbS50aGVuKGZ1bmN0aW9uKGMpIHtcbiAgICBhY3RpdmVDb250ZXh0cy5wdXNoKGMpO1xuICB9KTtcbiAgcmV0dXJuIGZyZWVkb207XG59XG5cbmV4cG9ydHMuZGlyZWN0UHJvdmlkZXJGb3IgPSBmdW5jdGlvbiAobW9kLCBhcGkpIHtcbiAgdmFyIGRlYnVnID0gbmV3IERlYnVnKCk7XG4gIHZhciBwcm92aWRlciA9IG5ldyBQcm92aWRlcihhcGksIGRlYnVnKTtcbiAgcHJvdmlkZXIuZ2V0UHJveHlJbnRlcmZhY2UoKSgpLnByb3ZpZGVBc3luY2hyb25vdXMobW9kKTtcbiAgdmFyIGlmYWNlID0gQXBpSW50ZXJmYWNlLmJpbmQoQXBpSW50ZXJmYWNlLCBhcGkpO1xuICB2YXIgY29uc3VtZXIgPSBuZXcgQ29uc3VtZXIoaWZhY2UsIGRlYnVnKTtcblxuICAvLyBDcmVhdGUgYSBsaW5rIGJldHdlZW4gdGhlbS5cbiAgcHJvdmlkZXIub24oJ2RlZmF1bHQnLCBjb25zdW1lci5vbk1lc3NhZ2UuYmluZChjb25zdW1lciwgJ2RlZmF1bHQnKSk7XG4gIGNvbnN1bWVyLm9uKCdkZWZhdWx0JywgcHJvdmlkZXIub25NZXNzYWdlLmJpbmQocHJvdmlkZXIsICdkZWZhdWx0JykpO1xuICBwcm92aWRlci5vbk1lc3NhZ2UoJ2NvbnRyb2wnLCB7Y2hhbm5lbDogJ2RlZmF1bHQnLCByZXZlcnNlOiAnZGVmYXVsdCcsIG5hbWU6ICdkZWZhdWx0J30pO1xuXG4gIHJldHVybiBjb25zdW1lci5nZXRQcm94eUludGVyZmFjZSgpO1xufTtcblxuZXhwb3J0cy5wcm92aWRlckZvciA9IGZ1bmN0aW9uKG1vZHVsZSwgYXBpKSB7XG4gIHZhciBtYW5pZmVzdCA9IHtcbiAgICBuYW1lOiAncHJvdmlkZXJzJyxcbiAgICBhcHA6IHtzY3JpcHQ6ICdyZWxhdGl2ZTovL3NwZWMvaGVscGVyL3Byb3ZpZGVycy5qcyd9LFxuICAgIGRlcGVuZGVuY2llczoge3VuZGVydGVzdDoge3VybDogJ3JlbGF0aXZlOi8vJyArIG1vZHVsZSwgYXBpOiBhcGl9fVxuICB9O1xuICB2YXIgZnJlZWRvbSA9IGV4cG9ydHMuc2V0dXBNb2R1bGUoJ21hbmlmZXN0Oi8vJyArIEpTT04uc3RyaW5naWZ5KG1hbmlmZXN0KSk7XG4gIHJldHVybiBmcmVlZG9tLnRoZW4oZnVuY3Rpb24oY2hhbikge1xuICAgIGFjdGl2ZUNvbnRleHRzLnB1c2goY2hhbik7XG4gICAgdmFyIGluc3QgPSBjaGFuKCk7XG4gICAgdmFyIHByb3ZpZGVyID0gbmV3IFByb3ZpZGVySGVscGVyKGluc3QpO1xuICAgIHByb3ZpZGVyLmNyZWF0ZSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIGluc3QuZW1pdChcImNyZWF0ZVwiLCB7bmFtZTogbmFtZSwgcHJvdmlkZXI6ICd1bmRlcnRlc3QnfSk7XG4gICAgfTtcbiAgICByZXR1cm4gcHJvdmlkZXI7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBQcm92aWRlckhlbHBlcihpbkZyZWVkb20pIHtcbiAgdGhpcy5jYWxsSWQgPSAwO1xuICB0aGlzLmNhbGxiYWNrcyA9IHt9O1xuICB0aGlzLmVycmNhbGxiYWNrcyA9IHt9O1xuICB0aGlzLnVuYm91bmRDaGFuQ2FsbGJhY2tzID0gW107XG4gIHRoaXMuY2hhbkNhbGxiYWNrcyA9IHt9O1xuICB0aGlzLmZyZWVkb20gPSBpbkZyZWVkb207XG4gIHRoaXMuX2V2ZW50TGlzdGVuZXJzID0ge307XG4gIHRoaXMuZnJlZWRvbS5vbihcImV2ZW50RmlyZWRcIiwgdGhpcy5fb24uYmluZCh0aGlzKSk7XG4gIHRoaXMuZnJlZWRvbS5vbihcInJldHVyblwiLCB0aGlzLnJldC5iaW5kKHRoaXMpKTtcbiAgdGhpcy5mcmVlZG9tLm9uKFwiZXJyb3JcIiwgdGhpcy5lcnIuYmluZCh0aGlzKSk7XG4gIHRoaXMuZnJlZWRvbS5vbihcImluaXRDaGFubmVsXCIsIHRoaXMub25Jbml0Q2hhbm5lbC5iaW5kKHRoaXMpKTtcbiAgdGhpcy5mcmVlZG9tLm9uKFwiaW5Gcm9tQ2hhbm5lbFwiLCB0aGlzLm9uSW5Gcm9tQ2hhbm5lbC5iaW5kKHRoaXMpKTtcbn1cblxuUHJvdmlkZXJIZWxwZXIucHJvdG90eXBlLmNyZWF0ZVByb3ZpZGVyID0gZnVuY3Rpb24obmFtZSwgcHJvdmlkZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdHJ1Y3RvckFyZ3VtZW50cykge1xuICB0aGlzLmZyZWVkb20uZW1pdCgnY3JlYXRlJywge1xuICAgIG5hbWU6IG5hbWUsXG4gICAgcHJvdmlkZXI6IHByb3ZpZGVyLFxuICAgIGNvbnN0cnVjdG9yQXJndW1lbnRzOiBjb25zdHJ1Y3RvckFyZ3VtZW50c1xuICB9KTtcbn07XG5cblByb3ZpZGVySGVscGVyLnByb3RvdHlwZS5jcmVhdGUgPSBQcm92aWRlckhlbHBlci5wcm90b3R5cGUuY3JlYXRlUHJvdmlkZXI7XG5cblByb3ZpZGVySGVscGVyLnByb3RvdHlwZS5jYWxsID0gZnVuY3Rpb24ocHJvdmlkZXIsIG1ldGhvZCwgYXJncywgY2IsIGVycmNiKSB7XG4gIHRoaXMuY2FsbElkICs9IDE7XG4gIHRoaXMuY2FsbGJhY2tzW3RoaXMuY2FsbElkXSA9IGNiO1xuICB0aGlzLmVycmNhbGxiYWNrc1t0aGlzLmNhbGxJZF0gPSBlcnJjYjtcbiAgdGhpcy5mcmVlZG9tLmVtaXQoJ2NhbGwnLCB7XG4gICAgaWQ6IHRoaXMuY2FsbElkLFxuICAgIHByb3ZpZGVyOiBwcm92aWRlcixcbiAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICBhcmdzOiBhcmdzXG4gIH0pO1xuICByZXR1cm4gdGhpcy5jYWxsSWQ7XG59O1xuXG5Qcm92aWRlckhlbHBlci5wcm90b3R5cGUucmV0ID0gZnVuY3Rpb24ob2JqKSB7XG4gIGlmICh0aGlzLmNhbGxiYWNrc1tvYmouaWRdKSB7XG4gICAgdGhpcy5jYWxsYmFja3Nbb2JqLmlkXShvYmouZGF0YSk7XG4gICAgZGVsZXRlIHRoaXMuY2FsbGJhY2tzW29iai5pZF07XG4gIH1cbn07XG5cblByb3ZpZGVySGVscGVyLnByb3RvdHlwZS5lcnIgPSBmdW5jdGlvbihvYmopIHtcbiAgaWYgKHRoaXMuZXJyY2FsbGJhY2tzW29iai5pZF0pIHtcbiAgICB0aGlzLmVycmNhbGxiYWNrc1tvYmouaWRdKG9iai5kYXRhKTtcbiAgICBkZWxldGUgdGhpcy5lcnJjYWxsYmFja3Nbb2JqLmlkXTtcbiAgfVxufVxuXG5Qcm92aWRlckhlbHBlci5wcm90b3R5cGUuX29uID0gZnVuY3Rpb24oZXZlbnRJbmZvKSB7XG4gIHZhciBwcm92aWRlciA9IGV2ZW50SW5mby5wcm92aWRlcjtcbiAgdmFyIGV2ZW50ID0gZXZlbnRJbmZvLmV2ZW50O1xuICB2YXIgZXZlbnRQYXlsb2FkID0gZXZlbnRJbmZvLmV2ZW50UGF5bG9hZDtcbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50TGlzdGVuZXJzW3Byb3ZpZGVyXVtldmVudF07XG4gIGlmIChsaXN0ZW5lcnMpIHtcbiAgICBsaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbiAobGlzdGVuZXIpIHtcbiAgICAgIGxpc3RlbmVyKGV2ZW50UGF5bG9hZCk7XG4gICAgfSk7XG4gIH1cbn07XG5cblByb3ZpZGVySGVscGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKHByb3ZpZGVyLCBldmVudCwgbGlzdGVuZXIpIHtcbiAgaWYgKHR5cGVvZiB0aGlzLl9ldmVudExpc3RlbmVyc1twcm92aWRlcl0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgdGhpcy5fZXZlbnRMaXN0ZW5lcnNbcHJvdmlkZXJdID0ge307XG4gIH1cbiAgaWYgKHR5cGVvZiB0aGlzLl9ldmVudExpc3RlbmVyc1twcm92aWRlcl1bZXZlbnRdID09PSAndW5kZWZpbmVkJykge1xuICAgIHRoaXMuX2V2ZW50TGlzdGVuZXJzW3Byb3ZpZGVyXVtldmVudF0gPSBbXTtcbiAgfVxuICB0aGlzLl9ldmVudExpc3RlbmVyc1twcm92aWRlcl1bZXZlbnRdLnB1c2gobGlzdGVuZXIpO1xuICB0aGlzLmZyZWVkb20uZW1pdChcImxpc3RlbkZvckV2ZW50XCIsIHtwcm92aWRlcjogcHJvdmlkZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudDogZXZlbnR9KTtcbn07XG5cbi8qKlxuICogUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgcmVnaXN0ZXJlZCB0aHJvdWdoIFwib25cIiBmb3IgYW4gZXZlbnQuIElmIGFuIGV2ZW50IGlzIG5vdFxuICogc3BlY2lmaWVkLCB0aGVuIGFsbCBsaXN0ZW5lcnMgZm9yIHRoZSBwcm92aWRlciBhcmUgcmVtb3ZlZC5cbiAqL1xuUHJvdmlkZXJIZWxwZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVycyA9IGZ1bmN0aW9uKHByb3ZpZGVyLCBldmVudCkge1xuICBpZiAodHlwZW9mIHRoaXMuX2V2ZW50TGlzdGVuZXJzW3Byb3ZpZGVyXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAoZXZlbnQpIHtcbiAgICAgIHRoaXMuX2V2ZW50TGlzdGVuZXJzW3Byb3ZpZGVyXVtldmVudF0gPSBbXTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fZXZlbnRMaXN0ZW5lcnNbcHJvdmlkZXJdID0ge307XG4gICAgfVxuICB9XG59O1xuXG5cblxuUHJvdmlkZXJIZWxwZXIucHJvdG90eXBlLmNyZWF0ZUNoYW5uZWwgPSBmdW5jdGlvbihjYikge1xuICB0aGlzLnVuYm91bmRDaGFuQ2FsbGJhY2tzLnB1c2goY2IpO1xuICB0aGlzLmZyZWVkb20uZW1pdCgnY3JlYXRlQ2hhbm5lbCcpO1xufTtcblxuUHJvdmlkZXJIZWxwZXIucHJvdG90eXBlLm9uSW5pdENoYW5uZWwgPSBmdW5jdGlvbihjaGFuSWQpIHtcbiAgdmFyIGNiID0gdGhpcy51bmJvdW5kQ2hhbkNhbGxiYWNrcy5wb3AoKTsgXG4gIGNiKGNoYW5JZCk7XG59O1xuXG5Qcm92aWRlckhlbHBlci5wcm90b3R5cGUuc2V0Q2hhbm5lbENhbGxiYWNrID0gZnVuY3Rpb24oY2hhbklkLCBjYikge1xuICB0aGlzLmNoYW5DYWxsYmFja3NbY2hhbklkXSA9IGNiO1xufTtcblByb3ZpZGVySGVscGVyLnByb3RvdHlwZS5zZW5kVG9DaGFubmVsID0gZnVuY3Rpb24oY2hhbklkLCBtc2cpIHtcbiAgdGhpcy5mcmVlZG9tLmVtaXQoXCJvdXRUb0NoYW5uZWxcIiwge1xuICAgIGNoYW5JZDogY2hhbklkLFxuICAgIG1lc3NhZ2U6IG1zZ1xuICB9KTtcbn07XG5Qcm92aWRlckhlbHBlci5wcm90b3R5cGUub25JbkZyb21DaGFubmVsID0gZnVuY3Rpb24oZGF0YSkge1xuICB0aGlzLmNoYW5DYWxsYmFja3NbZGF0YS5jaGFuSWRdKGRhdGEubWVzc2FnZSk7XG59O1xuXG5leHBvcnRzLlByb3ZpZGVySGVscGVyID0gUHJvdmlkZXJIZWxwZXI7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIi8qanNsaW50IGluZGVudDoyLHdoaXRlOnRydWUsbm9kZTp0cnVlLHNsb3BweTp0cnVlICovXG52YXIgUHJvbWlzZUNvbXBhdCA9IHJlcXVpcmUoJ2VzNi1wcm9taXNlJykuUHJvbWlzZTtcblxuLyoqXG4gKiBUaGUgQVBJIHJlZ2lzdHJ5IGZvciBmcmVlZG9tLmpzLiAgVXNlZCB0byBsb29rIHVwIHJlcXVlc3RlZCBBUElzLFxuICogYW5kIHByb3ZpZGVzIGEgYnJpZGdlIGZvciBjb3JlIEFQSXMgdG8gYWN0IGxpa2Ugbm9ybWFsIEFQSXMuXG4gKiBAQ2xhc3MgQVBJXG4gKiBAcGFyYW0ge0RlYnVnfSBkZWJ1ZyBUaGUgZGVidWdnZXIgdG8gdXNlIGZvciBsb2dnaW5nLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZhciBBcGkgPSBmdW5jdGlvbihkZWJ1Zykge1xuICB0aGlzLmRlYnVnID0gZGVidWc7XG4gIHRoaXMuYXBpcyA9IHt9O1xuICB0aGlzLnByb3ZpZGVycyA9IHt9O1xuICB0aGlzLndhaXRlcnMgPSB7fTtcbn07XG5cbi8qKlxuICogR2V0IGFuIEFQSS5cbiAqIEBtZXRob2QgZ2V0XG4gKiBAcGFyYW0ge1N0cmluZ30gYXBpIFRoZSBBUEkgbmFtZSB0byBnZXQuXG4gKiBAcmV0dXJucyB7e25hbWU6U3RyaW5nLCBkZWZpbml0aW9uOkFQSX19IFRoZSBBUEkgaWYgcmVnaXN0ZXJlZC5cbiAqL1xuQXBpLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihhcGkpIHtcbiAgaWYgKCF0aGlzLmFwaXNbYXBpXSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4ge1xuICAgIG5hbWU6IGFwaSxcbiAgICBkZWZpbml0aW9uOiB0aGlzLmFwaXNbYXBpXVxuICB9O1xufTtcblxuLyoqXG4gKiBTZXQgYW4gQVBJIHRvIGEgZGVmaW5pdGlvbi5cbiAqIEBtZXRob2Qgc2V0XG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBUaGUgQVBJIG5hbWUuXG4gKiBAcGFyYW0ge0FQSX0gZGVmaW5pdGlvbiBUaGUgSlNPTiBvYmplY3QgZGVmaW5pbmcgdGhlIEFQSS5cbiAqL1xuQXBpLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihuYW1lLCBkZWZpbml0aW9uKSB7XG4gIHRoaXMuYXBpc1tuYW1lXSA9IGRlZmluaXRpb247XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVyIGEgY29yZSBBUEkgcHJvdmlkZXIuXG4gKiBAbWV0aG9kIHJlZ2lzdGVyXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSB0aGUgQVBJIG5hbWUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb25zdHJ1Y3RvciB0aGUgZnVuY3Rpb24gdG8gY3JlYXRlIGEgcHJvdmlkZXIgZm9yIHRoZSBBUEkuXG4gKiBAcGFyYW0ge1N0cmluZz99IHN0eWxlIFRoZSBzdHlsZSB0aGUgcHJvdmlkZXIgaXMgd3JpdHRlbiBpbi4gVmFsaWQgc3R5bGVzXG4gKiAgIGFyZSBkb2N1bWVudGVkIGluIGZkb20ucG9ydC5Qcm92aWRlci5wcm90b3R5cGUuZ2V0SW50ZXJmYWNlLiBEZWZhdWx0cyB0b1xuICogICBwcm92aWRlQXN5bmNocm9ub3VzXG4gKi9cbkFwaS5wcm90b3R5cGUucmVnaXN0ZXIgPSBmdW5jdGlvbihuYW1lLCBjb25zdHJ1Y3Rvciwgc3R5bGUpIHtcbiAgdmFyIGk7XG5cbiAgdGhpcy5wcm92aWRlcnNbbmFtZV0gPSB7XG4gICAgY29uc3RydWN0b3I6IGNvbnN0cnVjdG9yLFxuICAgIHN0eWxlOiBzdHlsZSB8fCAncHJvdmlkZUFzeW5jaHJvbm91cydcbiAgfTtcblxuICBpZiAodGhpcy53YWl0ZXJzW25hbWVdKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMud2FpdGVyc1tuYW1lXS5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgdGhpcy53YWl0ZXJzW25hbWVdW2ldLnJlc29sdmUoY29uc3RydWN0b3IuYmluZCh7fSxcbiAgICAgICAgICB0aGlzLndhaXRlcnNbbmFtZV1baV0uZnJvbSkpO1xuICAgIH1cbiAgICBkZWxldGUgdGhpcy53YWl0ZXJzW25hbWVdO1xuICB9XG59O1xuXG4vKipcbiAqIEdldCBhIGNvcmUgQVBJIGNvbm5lY3RlZCB0byBhIGdpdmVuIEZyZWVET00gbW9kdWxlLlxuICogQG1ldGhvZCBnZXRDb3JlXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSB0aGUgQVBJIHRvIHJldHJpZXZlLlxuICogQHBhcmFtIHtwb3J0LkFwcH0gZnJvbSBUaGUgaW5zdGFudGlhdGluZyBBcHAuXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gQSBwcm9taXNlIG9mIGEgZmRvbS5BcHAgbG9vay1hbGlrZSBtYXRjaGluZ1xuICogYSBsb2NhbCBBUEkgZGVmaW5pdGlvbi5cbiAqL1xuQXBpLnByb3RvdHlwZS5nZXRDb3JlID0gZnVuY3Rpb24obmFtZSwgZnJvbSkge1xuICByZXR1cm4gbmV3IFByb21pc2VDb21wYXQoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgaWYgKHRoaXMuYXBpc1tuYW1lXSkge1xuICAgICAgaWYgKHRoaXMucHJvdmlkZXJzW25hbWVdKSB7XG4gICAgICAgIHJlc29sdmUodGhpcy5wcm92aWRlcnNbbmFtZV0uY29uc3RydWN0b3IuYmluZCh7fSwgZnJvbSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCF0aGlzLndhaXRlcnNbbmFtZV0pIHtcbiAgICAgICAgICB0aGlzLndhaXRlcnNbbmFtZV0gPSBbXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLndhaXRlcnNbbmFtZV0ucHVzaCh7XG4gICAgICAgICAgcmVzb2x2ZTogcmVzb2x2ZSxcbiAgICAgICAgICByZWplY3Q6IHJlamVjdCxcbiAgICAgICAgICBmcm9tOiBmcm9tXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRlYnVnLndhcm4oJ0FwaS5nZXRDb3JlIGFza2VkIGZvciB1bmtub3duIGNvcmU6ICcgKyBuYW1lKTtcbiAgICAgIHJlamVjdChudWxsKTtcbiAgICB9XG4gIH0uYmluZCh0aGlzKSk7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgc3R5bGUgaW4gd2hpY2ggYSBjb3JlIEFQSSBpcyB3cml0dGVuLlxuICogVGhpcyBtZXRob2QgaXMgZ3VhcmFudGVlZCB0byBrbm93IHRoZSBzdHlsZSBvZiBhIHByb3ZpZGVyIHJldHVybmVkIGZyb21cbiAqIGEgcHJldmlvdXMgZ2V0Q29yZSBjYWxsLCBhbmQgc28gZG9lcyBub3QgdXNlIHByb21pc2VzLlxuICogQG1ldGhvZCBnZXRJbnRlcmZhY2VTdHlsZVxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHByb3ZpZGVyLlxuICogQHJldHVybnMge1N0cmluZ30gVGhlIGNvZGluZyBzdHlsZSwgYXMgdXNlZCBieVxuICogICBmZG9tLnBvcnQuUHJvdmlkZXIucHJvdG90eXBlLmdldEludGVyZmFjZS5cbiAqL1xuQXBpLnByb3RvdHlwZS5nZXRJbnRlcmZhY2VTdHlsZSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgaWYgKHRoaXMucHJvdmlkZXJzW25hbWVdKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvdmlkZXJzW25hbWVdLnN0eWxlO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuZGVidWcud2FybignQXBpLmdldEludGVyZmFjZVN0eWxlIGZvciB1bmtub3duIHByb3ZpZGVyOiAnICsgbmFtZSk7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufTtcblxuLyoqXG4gKiBEZWZpbmVzIHRoZSBhcGlzIG1vZHVsZSBhbmQgcHJvdmlkZXIgcmVnaXN0cnkuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gQXBpO1xuIiwiLypqc2xpbnQgaW5kZW50OjIsbm9kZTp0cnVlICovXG52YXIgaW5jbHVkZUZvbGRlciA9IHVuZGVmaW5lZDtcbnZhciBtaW5pZnkgPSByZXF1aXJlKCdub2RlLWpzb24tbWluaWZ5Jyk7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbnZhciBCdW5kbGUgPSBmdW5jdGlvbiAoKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgdmFyIGZvdW5kO1xuICB0aGlzLmludGVyZmFjZXMgPSBbXTtcbiAgLypqc2xpbnQgbm9tZW46IHRydWUgKi9cbiAgdHJ5IHtcbiAgICBmb3VuZCA9IChmdW5jdGlvbigpe3ZhciBzZWxmPXt9LGZzID0gcmVxdWlyZSgnZnMnKTtcbnNlbGYuY29uc29sZSA9IFwie1xcbiAgXFxcIm5hbWVcXFwiOiBcXFwiY29uc29sZVxcXCIsXFxuICBcXFwiYXBpXFxcIjoge1xcbiAgICAvLyBMb2coc291cmNlLCBtZXNzYWdlKVxcbiAgICBcXFwibG9nXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIiwgXFxcInN0cmluZ1xcXCJdfSxcXG4gICAgXFxcImRlYnVnXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIiwgXFxcInN0cmluZ1xcXCJdfSxcXG4gICAgXFxcImluZm9cXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiLCBcXFwic3RyaW5nXFxcIl19LFxcbiAgICBcXFwid2FyblxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCIsIFxcXCJzdHJpbmdcXFwiXX0sXFxuICAgIFxcXCJlcnJvclxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCIsIFxcXCJzdHJpbmdcXFwiXX1cXG4gIH1cXG59XFxuXCI7XG5zZWxmLmNvcmVDb25zb2xlID0gXCJ7XFxuICBcXFwibmFtZVxcXCI6IFxcXCJjb3JlLmNvbnNvbGVcXFwiLFxcbiAgXFxcImFwaVxcXCI6IHtcXG4gICAgLy8gTG9nKHNvdXJjZSwgbWVzc2FnZSlcXG4gICAgXFxcImxvZ1xcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCIsIFxcXCJzdHJpbmdcXFwiXX0sXFxuICAgIFxcXCJkZWJ1Z1xcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCIsIFxcXCJzdHJpbmdcXFwiXX0sXFxuICAgIFxcXCJpbmZvXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIiwgXFxcInN0cmluZ1xcXCJdfSxcXG4gICAgXFxcIndhcm5cXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiLCBcXFwic3RyaW5nXFxcIl19LFxcbiAgICBcXFwiZXJyb3JcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiLCBcXFwic3RyaW5nXFxcIl19XFxuICB9XFxufVxcblwiO1xuc2VsZi5jb3JlRWNobyA9IFwie1xcbiAgXFxcIm5hbWVcXFwiOiBcXFwiY29yZS5lY2hvXFxcIixcXG4gIFxcXCJhcGlcXFwiOiB7XFxuICAgIFxcXCJzZXR1cFxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCJdfSxcXG4gICAgXFxcInNlbmRcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiXX0sXFxuICAgIFxcXCJtZXNzYWdlXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcImV2ZW50XFxcIiwgXFxcInZhbHVlXFxcIjogXFxcInN0cmluZ1xcXCJ9XFxuICB9XFxufVwiO1xuc2VsZi5jb3JlID0gXCJ7XFxuICBcXFwibmFtZVxcXCI6IFxcXCJjb3JlXFxcIixcXG4gIFxcXCJhcGlcXFwiOiB7XFxuICAgIFxcXCJjcmVhdGVDaGFubmVsXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdLCBcXFwicmV0XFxcIjoge1xcbiAgICAgIFxcXCJjaGFubmVsXFxcIjogXFxcInByb3h5XFxcIixcXG4gICAgICBcXFwiaWRlbnRpZmllclxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgIH19LFxcbiAgICBcXFwiYmluZENoYW5uZWxcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiXSwgXFxcInJldFxcXCI6IFxcXCJwcm94eVxcXCJ9LFxcbiAgICBcXFwiZ2V0SWRcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW10sIFxcXCJyZXRcXFwiOiBbXFxcImFycmF5XFxcIiwgXFxcInN0cmluZ1xcXCJdfSxcXG4gICAgXFxcImdldExvZ2dlclxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCJdLCBcXFwicmV0XFxcIjogXFxcInByb3h5XFxcIn1cXG4gIH1cXG59XFxuXCI7XG5zZWxmLmNvcmVPYXV0aCA9IFwie1xcbiAgXFxcIm5hbWVcXFwiOiBcXFwiY29yZS5vYXV0aFxcXCIsXFxuICBcXFwiYXBpXFxcIjoge1xcbiAgICAvKipcXG4gICAgICogSW5kaWNhdGUgdGhlIGludGVudGlvbiB0byBpbml0aWF0ZSBhbiBvQXV0aCBmbG93LCBhbGxvd2luZyBhbiBhcHByb3ByaWF0ZVxcbiAgICAgKiBvQXV0aCBwcm92aWRlciB0byBiZWdpbiBtb25pdG9yaW5nIGZvciByZWRpcmVjdGlvbi5cXG4gICAgICogVGhpcyB3aWxsIGdlbmVyYXRlIGEgdG9rZW4sIHdoaWNoIG11c3QgYmUgcGFzc2VkIHRvIHRoZSBzaW5nbGUgc3Vic2VxdWVudCBjYWxsXFxuICAgICAqIHRvIGxhdW5jaEF1dGhGbG93LiBcXG4gICAgICogXFxuICAgICAqIFxcbiAgICAgKiBAbWV0aG9kIGluaXRpYXRlT0F1dGhcXG4gICAgICogQHBhcmFtIHtTdHJpbmdbXX0gVmFsaWQgb0F1dGggcmVkaXJlY3QgVVJJcyBmb3IgeW91ciBhcHBsaWNhdGlvblxcbiAgICAgKiBAcmV0dXJuIHt7cmVkaXJlY3Q6IFN0cmluZywgc3RhdGU6IFN0cmluZ319IEEgY2hvc2VuIHJlZGlyZWN0IFVSSSBhbmRcXG4gICAgICogICBzdGF0ZSB3aGljaCB3aWxsIGJlIG1vbml0b3JlZCBmb3Igb0F1dGggcmVkaXJlY3Rpb24gaWYgYXZhaWxhYmxlXFxuICAgICAqKi9cXG4gICAgXFxcImluaXRpYXRlT0F1dGhcXFwiOiB7XFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIixcXG4gICAgICBcXFwidmFsdWVcXFwiOiBbW1xcXCJhcnJheVxcXCIsIFxcXCJzdHJpbmdcXFwiXV0sXFxuICAgICAgXFxcInJldFxcXCI6IHtcXG4gICAgICAgIFxcXCJyZWRpcmVjdFxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcInN0YXRlXFxcIjogXFxcInN0cmluZ1xcXCJcXG4gICAgICB9LFxcbiAgICAgIFxcXCJlcnJcXFwiOiB7XFxuICAgICAgICBcXFwiZXJyY29kZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcIm1lc3NhZ2VcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICAgIH1cXG4gICAgfSxcXG4gIFxcbiAgICAvKipcXG4gICAgICogb0F1dGggY2xpZW50LXNpZGUgZmxvdyAtIGxhdW5jaCB0aGUgcHJvdmlkZWQgVVJMXFxuICAgICAqIFRoaXMgbXVzdCBiZSBjYWxsZWQgYWZ0ZXIgaW5pdGlhdGVPQXV0aCB3aXRoIHRoZSByZXR1cm5lZCBzdGF0ZSBvYmplY3RcXG4gICAgICpcXG4gICAgICogQG1ldGhvZCBsYXVuY2hBdXRoRmxvd1xcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gVGhlIFVSTCB0aGF0IGluaXRpYXRlcyB0aGUgYXV0aCBmbG93LlxcbiAgICAgKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCBzdHJpbmc+fSBUaGUgcmV0dXJuIHZhbHVlIGZyb20gaW5pdGlhdGVPQXV0aFxcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IHJlc3BvbnNlVXJsIC0gY29udGFpbmluZyB0aGUgYWNjZXNzIHRva2VuXFxuICAgICAqL1xcbiAgICBcXFwibGF1bmNoQXV0aEZsb3dcXFwiOiB7XFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIixcXG4gICAgICBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCIsIHtcXG4gICAgICAgIFxcXCJyZWRpcmVjdFxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcInN0YXRlXFxcIjogXFxcInN0cmluZ1xcXCJcXG4gICAgICB9XSxcXG4gICAgICBcXFwicmV0XFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgXFxcImVyclxcXCI6IHtcXG4gICAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgICAgfVxcbiAgICB9XFxuICB9XFxufVxcblwiO1xuc2VsZi5jb3JlUGVlcmNvbm5lY3Rpb24gPSBcIntcXG4gIFxcXCJuYW1lXFxcIjogXFxcImNvcmUucGVlcmNvbm5lY3Rpb25cXFwiLFxcbiAgXFxcImFwaVxcXCI6IHtcXG4gICAgLy8gU2V0dXAgdGhlIGxpbmsgdG8gdGhlIHBlZXIgYW5kIG9wdGlvbnMgZm9yIHRoaXMgcGVlciBjb25uZWN0aW9uLlxcbiAgICBcXFwic2V0dXBcXFwiOiB7XFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIixcXG4gICAgICBcXFwidmFsdWVcXFwiOiBbXFxuICAgICAgICAvLyBUaGUgZnJlZWRvbS5qcyBjaGFubmVsIGlkZW50aWZpZXIgdXNlZCB0byBzZXR1cCBhIHNpZ25hbGxpbmcgY2hhbmVsLlxcbiAgICAgICAgXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICAvLyBUaGUgcGVlck5hbWUsIHVzZWQgZGVidWdnaW5nIGFuZCBjb25zb2xlIG1lc3NhZ2VzLlxcbiAgICAgICAgXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICAvLyBUaGUgbGlzdCBvZiBTVFVOIHNlcnZlcnMgdG8gdXNlLlxcbiAgICAgICAgLy8gVGhlIGZvcm1hdCBvZiBhIHNpbmdsZSBlbnRyeSBpcyBzdHVuOkhPU1Q6UE9SVCwgd2hlcmUgSE9TVFxcbiAgICAgICAgLy8gYW5kIFBPUlQgYXJlIGEgc3R1biBzZXJ2ZXIgaG9zdG5hbWUgYW5kIHBvcnQsIHJlc3BlY3RpdmVseS5cXG4gICAgICAgIFtcXFwiYXJyYXlcXFwiLCBcXFwic3RyaW5nXFxcIl0sXFxuICAgICAgICAvLyBXaGV0aGVyIHRvIGltbWVkaWF0ZWx5IGluaXRpYXRlIGEgY29ubmVjdGlvbiBiZWZvcmUgZnVsZmlsbGluZyByZXR1cm5cXG4gICAgICAgIC8vIHByb21pc2UuXFxuICAgICAgICBcXFwiYm9vbGVhblxcXCJcXG4gICAgICBdXFxuICAgIH0sXFxuICBcXG4gICAgLy8gU2VuZCBhIG1lc3NhZ2UgdG8gdGhlIHBlZXIuXFxuICAgIFxcXCJzZW5kXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFt7XFxuICAgICAgLy8gRGF0YSBjaGFubmVsIGlkLiBJZiBwcm92aWRlZCwgd2lsbCBiZSB1c2VkIGFzIHRoZSBjaGFubmVsIGxhYmVsLlxcbiAgICAgIC8vIFRoZSBiZWhhdmlvciBpcyB1bmRlZmluZWQgaWYgdGhlIGNoYW5uZWwgbGFiZWwgZG9lc24ndCBleGlzdC5cXG4gICAgICBcXFwiY2hhbm5lbExhYmVsXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgLy8gT25lIG9mIHRoZSBiZWxsb3cgc2hvdWxkIGJlIGRlZmluZWQ7IHRoaXMgaXMgdGhlIGRhdGEgdG8gc2VuZC5cXG4gICAgICBcXFwidGV4dFxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgIFxcXCJiaW5hcnlcXFwiOiBcXFwiYmxvYlxcXCIsXFxuICAgICAgXFxcImJ1ZmZlclxcXCI6IFxcXCJidWZmZXJcXFwiXFxuICAgIH1dfSxcXG4gIFxcbiAgICAvLyBDYWxsZWQgd2hlbiB3ZSBnZXQgYSBtZXNzYWdlIGZyb20gdGhlIHBlZXIuXFxuICAgIFxcXCJvblJlY2VpdmVkXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcImV2ZW50XFxcIiwgXFxcInZhbHVlXFxcIjoge1xcbiAgICAgIC8vIFRoZSBsYWJlbC9pZCBvZiB0aGUgZGF0YSBjaGFubmVsLlxcbiAgICAgIFxcXCJjaGFubmVsTGFiZWxcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAvLyBPbmUgdGhlIGJlbG93IHdpbGwgYmUgc3BlY2lmaWVkLlxcbiAgICAgIFxcXCJ0ZXh0XFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgXFxcImJpbmFyeVxcXCI6IFxcXCJibG9iXFxcIixcXG4gICAgICBcXFwiYnVmZmVyXFxcIjogXFxcImJ1ZmZlclxcXCJcXG4gICAgfX0sXFxuICBcXG4gICAgLy8gT3BlbiB0aGUgZGF0YSBjaGFubmVsIHdpdGggdGhpcyBsYWJlbC5cXG4gICAgXFxcIm9wZW5EYXRhQ2hhbm5lbFxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCJdfSxcXG4gICAgLy8gQ2xvc2UgdGhlIGRhdGEgY2hhbm5lbCB3aXRoIHRoaXMgbGFiZWwuXFxuICAgIFxcXCJjbG9zZURhdGFDaGFubmVsXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIl19LFxcbiAgXFxuICAgIC8vIEEgY2hhbm5lbCB3aXRoIHRoaXMgaWQgaGFzIGJlZW4gb3BlbmVkLlxcbiAgICBcXFwib25PcGVuRGF0YUNoYW5uZWxcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwiZXZlbnRcXFwiLCBcXFwidmFsdWVcXFwiOiB7XFxcImNoYW5uZWxJZFxcXCI6IFxcXCJzdHJpbmdcXFwifX0sXFxuICAgIC8vIFRoZSBjaGFubmFsZSB3aXRoIHRoaXMgaWQgaGFzIGJlZW4gY2xvc2VkLlxcbiAgICBcXFwib25DbG9zZURhdGFDaGFubmVsXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcImV2ZW50XFxcIiwgXFxcInZhbHVlXFxcIjoge1xcXCJjaGFubmVsSWRcXFwiOiBcXFwic3RyaW5nXFxcIn19LFxcbiAgXFxuICAgIC8vIFJldHVybnMgdGhlIG51bWJlciBvZiBieXRlcyB0aGF0IGhhdmUgcXVldWVkIHVzaW5nIFxcXCJzZW5kXFxcIiwgYnV0IG5vdFxcbiAgICAvLyB5ZXQgc2VudCBvdXQuIEN1cnJlbnRseSBqdXN0IGV4cG9zZXM6XFxuICAgIC8vIGh0dHA6Ly93d3cudzMub3JnL1RSL3dlYnJ0Yy8jd2lkbC1SVENEYXRhQ2hhbm5lbC1idWZmZXJlZEFtb3VudFxcbiAgICBcXFwiZ2V0QnVmZmVyZWRBbW91bnRcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIixcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIl0sXFxuICAgICAgICAgICAgICAgICAgICAgICAgICBcXFwicmV0XFxcIjogXFxcIm51bWJlclxcXCJ9LFxcbiAgXFxuICAgIC8vIFJldHVybnMgbG9jYWwgU0RQIGhlYWRlcnMgZnJvbSBjcmVhdGVPZmZlci5cXG4gICAgXFxcImdldEluZm9cXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW10sIFxcXCJyZXRcXFwiOiBcXFwic3RyaW5nXFxcIn0sXFxuICBcXG4gICAgXFxcImNyZWF0ZU9mZmVyXFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjogW3tcXG4gICAgICAgIC8vIE9wdGlvbmFsIDpSVENPZmZlck9wdGlvbnMgb2JqZWN0LlxcbiAgICAgICAgXFxcIm9mZmVyVG9SZWNlaXZlVmlkZW9cXFwiOiBcXFwibnVtYmVyXFxcIixcXG4gICAgICAgIFxcXCJvZmZlclRvUmVjZWl2ZUF1ZGlvXFxcIjogXFxcIm51bWJlclxcXCIsXFxuICAgICAgICBcXFwidm9pY2VBY3Rpdml0eURldGVjdGlvblxcXCI6IFxcXCJib29sZWFuXFxcIixcXG4gICAgICAgIFxcXCJpY2VSZXN0YXJ0XFxcIjogXFxcImJvb2xlYW5cXFwiXFxuICAgICAgfV0sXFxuICAgICAgXFxcInJldFxcXCI6IHtcXG4gICAgICAgIC8vIEZ1bGZpbGxzIHdpdGggYSA6UlRDU2Vzc2lvbkRlc2NyaXB0aW9uXFxuICAgICAgICBcXFwidHlwZVxcXCI6IFxcXCJzdHJpbmdcXFwiLCAgLy8gU2hvdWxkIGFsd2F5cyBiZSBcXFwib2ZmZXJcXFwiLlxcbiAgICAgICAgXFxcInNkcFxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgICAgfVxcbiAgICB9LFxcbiAgXFxuICAgIC8vIENsb3NlIHRoZSBwZWVyIGNvbm5lY3Rpb24uXFxuICAgIFxcXCJjbG9zZVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXX0sXFxuICAgIC8vIFRoZSBwZWVyIGNvbm5lY3Rpb24gaGFzIGJlZW4gY2xvc2VkLlxcbiAgICBcXFwib25DbG9zZVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IHt9fVxcbiAgfVxcbn1cXG5cIjtcbnNlbGYuY29yZVJ0Y2RhdGFjaGFubmVsID0gXCJ7XFxuICBcXFwibmFtZVxcXCI6IFxcXCJjb3JlLnJ0Y2RhdGFjaGFubmVsXFxcIixcXG4gIC8vIEFQSSBmb2xsb3dzIGh0dHA6Ly93M2MuZ2l0aHViLmlvL3dlYnJ0Yy1wYy9cXG4gIFxcXCJhcGlcXFwiOiB7XFxuXFxuICAgIFxcXCJjb25zdHJ1Y3RvclxcXCI6IHtcXG4gICAgICAvLyBOdW1lcmljIElEIHJldHJlYXZlZCBmcm9tIGNvcmUucnRjcGVlcmNvbm5lY3Rpb24uY3JlYXRlRGF0YUNoYW5uZWxcXG4gICAgICAvLyBvciBmcm9tIGFuIG9uZGF0YWNoYW5uZWwgZXZlbnQuXFxuICAgICAgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiXVxcbiAgICB9LFxcblxcbiAgICBcXFwiZ2V0TGFiZWxcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW10sIFxcXCJyZXRcXFwiOiBcXFwic3RyaW5nXFxcIn0sXFxuICAgIFxcXCJnZXRPcmRlcmVkXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdLCBcXFwicmV0XFxcIjogXFxcImJvb2xlYW5cXFwifSxcXG4gICAgXFxcImdldE1heFBhY2tldExpZmVUaW1lXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdLCBcXFwicmV0XFxcIjogXFxcIm51bWJlclxcXCJ9LFxcbiAgICBcXFwiZ2V0TWF4UmV0cmFuc21pdHNcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW10sIFxcXCJyZXRcXFwiOiBcXFwibnVtYmVyXFxcIn0sXFxuICAgIFxcXCJnZXRQcm90b2NvbFxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXSwgXFxcInJldFxcXCI6IFxcXCJzdHJpbmdcXFwifSxcXG4gICAgXFxcImdldE5lZ290aWF0ZWRcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW10sIFxcXCJyZXRcXFwiOiBcXFwiYm9vbGVhblxcXCJ9LFxcbiAgICBcXFwiZ2V0SWRcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW10sIFxcXCJyZXRcXFwiOiBcXFwibnVtYmVyXFxcIn0sXFxuICAgIFxcXCJnZXRSZWFkeVN0YXRlXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdLCBcXFwicmV0XFxcIjogXFxcInN0cmluZ1xcXCJ9LFxcbiAgICBcXFwiZ2V0QnVmZmVyZWRBbW91bnRcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW10sIFxcXCJyZXRcXFwiOiBcXFwibnVtYmVyXFxcIn0sXFxuXFxuICAgIFxcXCJvbm9wZW5cXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwiZXZlbnRcXFwiLCBcXFwidmFsdWVcXFwiOiBbXX0sXFxuICAgIFxcXCJvbmVycm9yXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcImV2ZW50XFxcIiwgXFxcInZhbHVlXFxcIjogW119LFxcbiAgICBcXFwib25jbG9zZVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdfSxcXG4gICAgXFxcImNsb3NlXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdfSxcXG4gICAgXFxcIm9ubWVzc2FnZVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IHtcXG4gICAgICBcXFwidGV4dFxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgIFxcXCJiaW5hcnlcXFwiOiBcXFwiYnVmZmVyXFxcIlxcbiAgICB9fSxcXG4gICAgXFxcImdldEJpbmFyeVR5cGVcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW10sIFxcXCJyZXRcXFwiOiBcXFwic3RyaW5nXFxcIn0sXFxuICAgIFxcXCJzZXRCaW5hcnlUeXBlXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIl19LFxcbiAgICBcXFwic2VuZFxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCJdfSxcXG4gICAgLy8gTm90ZTogcmVuYW1lZCBmcm9tICdzZW5kJyB0byBoYW5kbGUgdGhlIG92ZXJsb2FkZWQgdHlwZS5cXG4gICAgXFxcInNlbmRCdWZmZXJcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW1xcXCJidWZmZXJcXFwiXX1cXG4gIH1cXG59XFxuXCI7XG5zZWxmLmNvcmVSdGNwZWVyY29ubmVjdGlvbiA9IFwie1xcbiAgXFxcIm5hbWVcXFwiOiBcXFwiY29yZS5ydGNwZWVyY29ubmVjdGlvblxcXCIsXFxuICAvLyBBUEkgZm9sbG93cyBodHRwOi8vdzNjLmdpdGh1Yi5pby93ZWJydGMtcGMvXFxuICBcXFwiYXBpXFxcIjoge1xcbiAgICAvLyBBcmd1bWVudHM6IGljZVNlcnZlcnMsIGljZVRyYW5zcG9ydHMsIHBlZXJJZGVudGl0eVxcbiAgICAvLyBEZXZpYXRpb24gZnJvbSBzcGVjOiBpY2VTZXJ2ZXJzLCBhbmQgaWNlU2VydmVycy51cmxzIHdoZW4gc3BlY2lmaWVkIG11c3RcXG4gICAgLy8gYmUgYW4gYXJyYXksIGV2ZW4gaWYgb25seSAxIGlzIHNwZWNpZmllZC5cXG4gICAgXFxcImNvbnN0cnVjdG9yXFxcIjoge1xcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IFt7XFxuICAgICAgICBcXFwiaWNlU2VydmVyc1xcXCI6IFtcXFwiYXJyYXlcXFwiLCB7XFxuICAgICAgICAgIFxcXCJ1cmxzXFxcIjogW1xcXCJhcnJheVxcXCIsIFxcXCJzdHJpbmdcXFwiXSxcXG4gICAgICAgICAgXFxcInVzZXJuYW1lXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICAgIFxcXCJjcmVkZW50aWFsXFxcIjogXFxcInN0cmluZ1xcXCJcXG4gICAgICAgIH1dLFxcbiAgICAgICAgXFxcImljZVRyYW5zcG9ydHNcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJwZWVySWRlbnRpdHlcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICAgIH1dXFxuICAgIH0sXFxuXFxuICAgIC8vIFBlciBodHRwOi8vdzNjLmdpdGh1Yi5pby93ZWJydGMtcGMvI2lkbC1kZWYtUlRDT2ZmZXJPcHRpb25zXFxuICAgIFxcXCJjcmVhdGVPZmZlclxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbe1xcbiAgICAgIFxcXCJvZmZlclRvUmVjZWl2ZUF1ZGlvXFxcIjogXFxcIm51bWJlclxcXCIsXFxuICAgICAgXFxcIm9mZmVyVG9SZWNlaXZlVmlkZW9cXFwiOiBcXFwibnVtYmVyXFxcIixcXG4gICAgICBcXFwiaWNlUmVzdGFydFxcXCI6IFxcXCJib29sZWFuXFxcIixcXG4gICAgICBcXFwidm9pY2VBY3Rpdml0eURldGVjdGlvblxcXCI6IFxcXCJib29sZWFuXFxcIlxcbiAgICB9XSwgXFxcInJldFxcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgIFxcXCJzZHBcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICB9fSxcXG4gICAgXFxcImNyZWF0ZUFuc3dlclxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXSwgXFxcInJldFxcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgIFxcXCJzZHBcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICB9fSxcXG5cXG4gICAgLy8gUGVyIGh0dHA6Ly93M2MuZ2l0aHViLmlvL3dlYnJ0Yy1wYy8jaWRsLWRlZi1SVENTZXNzaW9uRGVzY3JpcHRpb25cXG4gICAgXFxcInNldExvY2FsRGVzY3JpcHRpb25cXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW3tcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgIFxcXCJzZHBcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICB9XX0sXFxuICAgIFxcXCJnZXRMb2NhbERlc2NyaXB0aW9uXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdLCBcXFwicmV0XFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgXFxcInNkcFxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgIH19LFxcbiAgICBcXFwic2V0UmVtb3RlRGVzY3JpcHRpb25cXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW3tcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgIFxcXCJzZHBcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICB9XSwgXFxcInJldFxcXCI6IHt9fSxcXG4gICAgXFxcImdldFJlbW90ZURlc2NyaXB0aW9uXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdLCBcXFwicmV0XFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgXFxcInNkcFxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgIH19LFxcblxcbiAgICAvLyBQZXIgaHR0cDovL3czYy5naXRodWIuaW8vd2VicnRjLXBjLyNpZGwtZGVmLVJUQ1NpZ25hbGluZ1N0YXRlXFxuICAgIFxcXCJnZXRTaWduYWxpbmdTdGF0ZVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXSwgXFxcInJldFxcXCI6IFxcXCJzdHJpbmdcXFwifSxcXG5cXG4gICAgLy8gUGVyIGh0dHA6Ly93M2MuZ2l0aHViLmlvL3dlYnJ0Yy1wYy8jaWRsLWRlZi1SVENDb25maWd1cmF0aW9uXFxuICAgIFxcXCJ1cGRhdGVJY2VcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW3tcXG4gICAgICAgIFxcXCJpY2VTZXJ2ZXJzXFxcIjogW1xcXCJhcnJheVxcXCIsIHtcXG4gICAgICAgICAgXFxcInVybHNcXFwiOiBbXFxcImFycmF5XFxcIiwgXFxcInN0cmluZ1xcXCJdLFxcbiAgICAgICAgICBcXFwidXNlcm5hbWVcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgICAgXFxcImNyZWRlbnRpYWxcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICAgICAgfV0sXFxuICAgICAgICBcXFwiaWNlVHJhbnNwb3J0c1xcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcInBlZXJJZGVudGl0eVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgICAgfV0sIFxcXCJyZXRcXFwiOiB7fX0sXFxuXFxuICAgIC8vIFBlciBodHRwOi8vdzNjLmdpdGh1Yi5pby93ZWJydGMtcGMvI2lkbC1kZWYtUlRDSWNlQ2FuZGlkYXRlXFxuICAgIFxcXCJhZGRJY2VDYW5kaWRhdGVcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW3tcXG4gICAgICBcXFwiY2FuZGlkYXRlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgXFxcInNkcE1pZFxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgIFxcXCJzZHBNTGluZUluZGV4XFxcIjogXFxcIm51bWJlclxcXCJcXG4gICAgfV0sIFxcXCJyZXRcXFwiOiB7fX0sXFxuXFxuICAgIFxcXCJnZXRJY2VHYXRoZXJpbmdTdGF0ZVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXSwgXFxcInJldFxcXCI6IFxcXCJzdHJpbmdcXFwifSxcXG4gICAgXFxcImdldEljZUNvbm5lY3Rpb25TdGF0ZVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXSwgXFxcInJldFxcXCI6IFxcXCJzdHJpbmdcXFwifSxcXG5cXG4gICAgXFxcImdldENvbmZpZ3VyYXRpb25cXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW10sIFxcXCJyZXRcXFwiOiB7XFxuICAgICAgXFxcImljZVNlcnZlcnNcXFwiOiBbXFxcImFycmF5XFxcIiwge1xcbiAgICAgICAgXFxcInVybHNcXFwiOiBbXFxcImFycmF5XFxcIiwgXFxcInN0cmluZ1xcXCJdLFxcbiAgICAgICAgXFxcInVzZXJuYW1lXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwiY3JlZGVudGlhbFxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgICAgfV0sXFxuICAgICAgXFxcImljZVRyYW5zcG9ydHNcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICBcXFwicGVlcklkZW50aXR5XFxcIjogXFxcInN0cmluZ1xcXCJcXG4gICAgfX0sXFxuXFxuICAgIC8vIE51bWJlcnMgZm9yIHN0cmVhbSBBUEkgYXJlIElEcyB3aXRoIHdoaWNoIHRvIG1ha2UgY29yZS5tZWRpYXN0cmVhbS5cXG4gICAgXFxcImdldExvY2FsU3RyZWFtc1xcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXSwgXFxcInJldFxcXCI6IFtcXFwiYXJyYXlcXFwiLCBcXFwic3RyaW5nXFxcIl19LFxcbiAgICBcXFwiZ2V0UmVtb3RlU3RyZWFtc1xcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXSwgXFxcInJldFxcXCI6IFtcXFwiYXJyYXlcXFwiLCBcXFwic3RyaW5nXFxcIl19LFxcbiAgICBcXFwiZ2V0U3RyZWFtQnlJZFxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCJdLCBcXFwicmV0XFxcIjogXFxcInN0cmluZ1xcXCJ9LFxcbiAgICBcXFwiYWRkU3RyZWFtXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIl0sIFxcXCJyZXRcXFwiOiB7fX0sXFxuICAgIFxcXCJyZW1vdmVTdHJlYW1cXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiXSwgXFxcInJldFxcXCI6IHt9fSxcXG5cXG4gICAgXFxcImNsb3NlXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdLCBcXFwicmV0XFxcIjoge319LFxcblxcbiAgICAvLyBQZXIgaHR0cDovL3czYy5naXRodWIuaW8vd2VicnRjLXBjLyNpZGwtZGVmLVJUQ0RhdGFDaGFubmVsSW5pdFxcbiAgICAvLyBOb3RlOiBOdW1iZXJzIGFyZSBJRHMgdXNlZCB0byBjcmVhdGUgY29yZS5kYXRhY2hhbm5lbCBvYmplY3RzLlxcbiAgICBcXFwiY3JlYXRlRGF0YUNoYW5uZWxcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiLCB7XFxuICAgICAgXFxcIm9yZGVyZWRcXFwiOiBcXFwiYm9vbGVhblxcXCIsXFxuICAgICAgXFxcIm1heFBhY2tldExpZmVUaW1lXFxcIjogXFxcIm51bWJlclxcXCIsXFxuICAgICAgXFxcIm1heFJldHJhbnNtaXRzXFxcIjogXFxcIm51bWJlclxcXCIsXFxuICAgICAgXFxcInByb3RvY29sXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgXFxcIm5lZ290aWF0ZWRcXFwiOiBcXFwiYm9vbGVhblxcXCIsXFxuICAgICAgXFxcImlkXFxcIjogXFxcIm51bWJlclxcXCJcXG4gICAgfV0sIFxcXCJyZXRcXFwiOiBcXFwic3RyaW5nXFxcIn0sXFxuICAgIC8vTm90ZTogb25seSByZXBvcnRzIGNoYW5uZWxzIG9wZW5lZCBieSB0aGUgcmVtb3RlIHBlZXIuXFxuICAgIFxcXCJvbmRhdGFjaGFubmVsXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcImV2ZW50XFxcIiwgXFxcInZhbHVlXFxcIjoge1xcbiAgICAgIFxcXCJjaGFubmVsXFxcIjogXFxcInN0cmluZ1xcXCJcXG4gICAgfX0sXFxuXFxuICAgIC8vVE9ETzogU3VwcG9ydCBEVE1GIEV4dGVuc2lvbi5cXG4gICAgLy9cXFwiY3JlYXRlRFRNRlNlbmRlclxcXCI6IHt9LFxcblxcbiAgICAvL3BlciBodHRwOi8vdzNjLmdpdGh1Yi5pby93ZWJydGMtcGMvI2lkbC1kZWYtUlRDU3RhdHNDYWxsYmFja1xcbiAgICAvL051bWJlciBpZiBzZXBlY2lmaWVkIHJlcHJlc2VudHMgYSBjb3JlLm1lZGlhc3RyZWFtdHJhY2suXFxuICAgIC8vUmV0dXJuZWQgb2JqZWN0IGlzIGEgc2VyaWFsaXphdGlvbiBvZiB0aGUgUlRDU3RhdHNSZXBvcnQuXFxuICAgIFxcXCJnZXRTdGF0c1xcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCJdLCBcXFwicmV0XFxcIjpcXFwib2JqZWN0XFxcIn0sXFxuXFxuICAgIC8vVE9ETzogU3VwcG9ydCBJZGVudGl0eSBFeHRlbnNpb24uXFxuICAgIC8qXFxuICAgIFxcXCJzZXRJZGVudGl0eVByb3ZpZGVyXFxcIjoge30sXFxuICAgIFxcXCJnZXRJZGVudGl0eUFzc2VydGlvblxcXCI6IHt9LFxcbiAgICBcXFwiZ2V0UGVlcklkZW50aXR5XFxcIjoge30sXFxuICAgIFxcXCJvbmlkZW50aXR5cmVzdWx0XFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcImV2ZW50XFxcIiwgXFxcInZhbHVlXFxcIjogW119LFxcbiAgICBcXFwib25wZWVyaWRlbnRpdHlcXFwiOntcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdfSxcXG4gICAgXFxcIm9uaWRwYXNzZXJ0aW9uZXJyb3JcXFwiOntcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdfSxcXG4gICAgXFxcIm9uaWRwdmFsaWRhdGlvbmVycm9yXFxcIjp7XFxcInR5cGVcXFwiOiBcXFwiZXZlbnRcXFwiLCBcXFwidmFsdWVcXFwiOiBbXX0sXFxuICAgICovXFxuXFxuICAgIFxcXCJvbm5lZ290aWF0aW9ubmVlZGVkXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcImV2ZW50XFxcIiwgXFxcInZhbHVlXFxcIjogW119LFxcbiAgICBcXFwib25pY2VjYW5kaWRhdGVcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwiZXZlbnRcXFwiLCBcXFwidmFsdWVcXFwiOiB7XFxuICAgICAgXFxcImNhbmRpZGF0ZVxcXCI6IHtcXG4gICAgICAgIFxcXCJjYW5kaWRhdGVcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJzZHBNaWRcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJzZHBNTGluZUluZGV4XFxcIjogXFxcIm51bWJlclxcXCJcXG4gICAgICB9XFxuICAgIH19LFxcbiAgICBcXFwib25zaWduYWxpbmdzdGF0ZWNoYW5nZVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdfSxcXG4gICAgXFxcIm9uYWRkc3RyZWFtXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcImV2ZW50XFxcIiwgXFxcInZhbHVlXFxcIjoge1xcbiAgICAgIFxcXCJzdHJlYW1cXFwiOiBcXFwibnVtYmVyXFxcIlxcbiAgICB9fSxcXG4gICAgXFxcIm9ucmVtb3Zlc3RyZWFtXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcImV2ZW50XFxcIiwgXFxcInZhbHVlXFxcIjoge1xcbiAgICAgIFxcXCJzdHJlYW1cXFwiOiBcXFwibnVtYmVyXFxcIlxcbiAgICB9fSxcXG4gICAgXFxcIm9uaWNlY29ubmVjdGlvbnN0YXRlY2hhbmdlXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcImV2ZW50XFxcIiwgXFxcInZhbHVlXFxcIjogW119XFxuICB9XFxufVxcblwiO1xuc2VsZi5jb3JlU3RvcmFnZSA9IFwie1xcbiAgXFxcIm5hbWVcXFwiOiBcXFwiY29yZS5zdG9yYWdlXFxcIixcXG4gIFxcXCJhcGlcXFwiOiB7XFxuICAgIFxcXCJrZXlzXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdLCBcXFwicmV0XFxcIjogW1xcXCJhcnJheVxcXCIsIFxcXCJzdHJpbmdcXFwiXX0sXFxuICAgIFxcXCJnZXRcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiXSwgXFxcInJldFxcXCI6IFxcXCJzdHJpbmdcXFwifSxcXG4gICAgXFxcInNldFxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCIsIFxcXCJzdHJpbmdcXFwiXSwgXFxcInJldFxcXCI6IFxcXCJzdHJpbmdcXFwifSxcXG4gICAgXFxcInJlbW92ZVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCJdLCBcXFwicmV0XFxcIjogXFxcInN0cmluZ1xcXCJ9LFxcbiAgICBcXFwiY2xlYXJcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW119XFxuICB9XFxufVwiO1xuc2VsZi5jb3JlVGNwc29ja2V0ID0gXCJ7XFxuICBcXFwibmFtZVxcXCI6IFxcXCJjb3JlLnRjcHNvY2tldFxcXCIsXFxuICBcXFwiYXBpXFxcIjoge1xcbiAgICAvLyBTb2NrZXRzIG1heSBiZSBjb25zdHJ1Y3RlZCBib3VuZCB0byBhIHByZS1leGlzdGluZyBpZCwgYXMgaW4gdGhlIGNhc2Ugb2ZcXG4gICAgLy8gaW50ZXJhY3Rpbmcgd2l0aCBhIHNvY2tldCBhY2NwZXRlZCBieSBhIHNlcnZlci4gIElmIG5vIElkIGlzIHNwZWNpZmllZCwgYVxcbiAgICAvLyBuZXcgc29ja2V0IHdpbGwgYmUgY3JlYXRlZCwgd2hpY2ggY2FuIGJlIGVpdGhlciBjb25uZWN0J2VkIG9yIGxpc3RlbidlZC5cXG4gICAgXFxcImNvbnN0cnVjdG9yXFxcIjoge1xcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IFtcXFwibnVtYmVyXFxcIl1cXG4gICAgfSxcXG4gIFxcbiAgICAvLyBHZXQgaW5mbyBhYm91dCBhIHNvY2tldC4gIFRlbGxzIHlvdSB3aGV0aGVyIHRoZSBzb2NrZXQgaXMgYWN0aXZlIGFuZFxcbiAgICAvLyBhdmFpbGFibGUgaG9zdCBpbmZvcm1hdGlvbi5cXG4gICAgXFxcImdldEluZm9cXFwiOiB7XFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIixcXG4gICAgICBcXFwidmFsdWVcXFwiOiBbXSxcXG4gICAgICBcXFwicmV0XFxcIjoge1xcbiAgICAgICAgXFxcImNvbm5lY3RlZFxcXCI6IFxcXCJib29sZWFuXFxcIixcXG4gICAgICAgIFxcXCJsb2NhbEFkZHJlc3NcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJsb2NhbFBvcnRcXFwiOiBcXFwibnVtYmVyXFxcIixcXG4gICAgICAgIFxcXCJwZWVyQWRkcmVzc1xcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcInBlZXJQb3J0XFxcIjogXFxcIm51bWJlclxcXCJcXG4gICAgICB9XFxuICAgIH0sXFxuICBcXG4gICAgLyoqIFxcbiAgICAgKiBlcnJvciBjb2RlcyBhbmQgZGVmYXVsdCBtZXNzYWdlcyB0aGF0IG1heSBiZSByZXR1cm5lZCBvbiBmYWlsdXJlcy5cXG4gICAgICovXFxuICAgIFxcXCJFUlJDT0RFXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcImNvbnN0YW50XFxcIiwgXFxcInZhbHVlXFxcIjoge1xcbiAgICAgIC8qKiBHRU5FUkFMICoqL1xcbiAgICAgIFxcXCJTVUNDRVNTXFxcIjogXFxcIlN1Y2Nlc3MhXFxcIixcXG4gICAgICAvLyBVbmtub3duXFxuICAgICAgXFxcIlVOS05PV05cXFwiOiBcXFwiVW5rbm93biBlcnJvclxcXCIsXFxuICAgICAgXFxuICAgICAgLy8gU29ja2V0IGlzIGFscmVhZHkgY29ubmVjdGVkXFxuICAgICAgXFxcIkFMUkVBRFlfQ09OTkVDVEVEXFxcIjogXFxcIlNvY2tldCBhbHJlYWR5IGNvbm5lY3RlZFxcXCIsXFxuICAgICAgLy8gSW52YWxpZCBBcmd1bWVudCwgY2xpZW50IGVycm9yXFxuICAgICAgXFxcIklOVkFMSURfQVJHVU1FTlRcXFwiOiBcXFwiSW52YWxpZCBhcmd1bWVudFxcXCIsXFxuICAgICAgLy8gQ29ubmVjdGlvbiB0aW1lZCBvdXQuXFxuICAgICAgXFxcIlRJTUVEX09VVFxcXCI6IFxcXCJUaW1lZCBvdXRcXFwiLFxcbiAgICAgIC8vIE9wZXJhdGlvbiBjYW5ub3QgY29tcGxldGUgYmVjYXVzZSBzb2NrZXQgaXMgbm90IGNvbm5lY3RlZC5cXG4gICAgICBcXFwiTk9UX0NPTk5FQ1RFRFxcXCI6IFxcXCJTb2NrZXQgbm90IGNvbm5lY3RlZFxcXCIsXFxuICAgICAgLy8gU29ja2V0IHJlc2V0IGJlY2F1c2Ugb2YgY2hhbmdlIGluIG5ldHdvcmsgc3RhdGUuXFxuICAgICAgXFxcIk5FVFdPUktfQ0hBTkdFRFxcXCI6IFxcXCJOZXR3b3JrIGNoYW5nZWRcXFwiLFxcbiAgICAgIC8vIENvbm5lY3Rpb24gY2xvc2VkXFxuICAgICAgXFxcIkNPTk5FQ1RJT05fQ0xPU0VEXFxcIjogXFxcIkNvbm5lY3Rpb24gY2xvc2VkIGdyYWNlZnVsbHlcXFwiLFxcbiAgICAgIC8vIENvbm5lY3Rpb24gUmVzZXRcXG4gICAgICBcXFwiQ09OTkVDVElPTl9SRVNFVFxcXCI6IFxcXCJDb25uZWN0aW9uIHJlc2V0XFxcIixcXG4gICAgICAvLyBDb25uZWN0aW9uIFJlZnVzZWRcXG4gICAgICBcXFwiQ09OTkVDVElPTl9SRUZVU0VEXFxcIjogXFxcIkNvbm5lY3Rpb24gcmVmdXNlZFxcXCIsXFxuICAgICAgLy8gR2VuZXJpYyBGYWlsdXJlXFxuICAgICAgXFxcIkNPTk5FQ1RJT05fRkFJTEVEXFxcIjogXFxcIkNvbm5lY3Rpb24gZmFpbGVkXFxcIlxcbiAgICB9fSxcXG4gICAgXFxuICAgIC8vIENsb3NlIGEgc29ja2V0LiBXaWxsIEZhaWwgaWYgdGhlIHNvY2tldCBpcyBub3QgY29ubmVjdGVkIG9yIGFscmVhZHlcXG4gICAgLy8gY2xvc2VkLlxcbiAgICBcXFwiY2xvc2VcXFwiOiB7XFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIixcXG4gICAgICBcXFwidmFsdWVcXFwiOiBbXSxcXG4gICAgICBcXFwiZXJyXFxcIjoge1xcbiAgICAgICAgXFxcImVycmNvZGVcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJtZXNzYWdlXFxcIjogXFxcInN0cmluZ1xcXCJcXG4gICAgICB9XFxuICAgIH0sXFxuICBcXG4gICAgLy8gUmVjZWl2ZSBub3RpZmljYXRpb24gdGhhdCB0aGUgc29ja2V0IGhhcyBkaXNjb25uZWN0ZWQuXFxuICAgIFxcXCJvbkRpc2Nvbm5lY3RcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwiZXZlbnRcXFwiLCBcXFwidmFsdWVcXFwiOiB7XFxuICAgICAgXFxcImVycmNvZGVcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgIH19LFxcbiAgXFxuICAgIC8vIENvbm5lY3QgdG8gYSBob3N0IGFuZCBwb3J0LlxcbiAgICAvLyBGYWlscyB3aXRoIGFuIGVycm9yIGlmIGNvbm5lY3Rpb24gZmFpbHMuXFxuICAgIFxcXCJjb25uZWN0XFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiLCBcXFwibnVtYmVyXFxcIl0sXFxuICAgICAgXFxcImVyclxcXCI6IHtcXG4gICAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgICAgfVxcbiAgICB9LFxcbiAgXFxuICAgIC8vIFVwZ3JhZGVzIGEgc29ja2V0IHRvIFRMUywgZXhwZWN0ZWQgdG8gYmUgaW52b2tlZCBhZnRlciBjb25uZWN0LlxcbiAgICBcXFwic2VjdXJlXFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjogW10sXFxuICAgICAgXFxcImVyclxcXCI6IHtcXG4gICAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgICAgfVxcbiAgICB9LFxcbiAgXFxuICAgIC8vIFByZXBhcmVzIGEgc29ja2V0IGZvciBiZWNvbWluZyBzZWN1cmUgYWZ0ZXIgdGhlIG5leHQgcmVhZCBldmVudC5cXG4gICAgLy8gU2VlIGRldGFpbHMgYXRcXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2ZyZWVkb21qcy9mcmVlZG9tL3dpa2kvcHJlcGFyZVNlY3VyZS1BUEktVXNhZ2VcXG4gICAgLy8gVGhpcyBzaG91bGQgYmUgY2FsbGVkIG9uZSByZWFkIHByaW9yIHRvIGNhbGxpbmcgLnNlY3VyZSwgZS5nLiBpbiBYTVBQXFxuICAgIC8vIHRoaXMgc2hvdWxkIGJlIGNhbGxlZCBiZWZvcmUgc2VuZGluZyBcXFwic3RhcnR0bHNcXFwiLCB0aGVuIGFmdGVyIGEgXFxcInByb2NlZWRcXFwiXFxuICAgIC8vIG1lc3NhZ2UgaXMgcmVhZCAuc2VjdXJlIHNob3VsZCBiZSBjYWxsZWQuXFxuICAgIFxcXCJwcmVwYXJlU2VjdXJlXFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjogW10sXFxuICAgICAgXFxcImVyclxcXCI6IHtcXG4gICAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgICAgfVxcbiAgICB9LFxcbiAgXFxuICAgIC8vIFdyaXRlIGJ1ZmZlciBkYXRhIHRvIGEgc29ja2V0LlxcbiAgICAvLyBGYWlscyB3aXRoIGFuIGVycm9yIGlmIHdyaXRlIGZhaWxzLlxcbiAgICBcXFwid3JpdGVcXFwiOiB7XFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIixcXG4gICAgICBcXFwidmFsdWVcXFwiOiBbXFxcImJ1ZmZlclxcXCJdLFxcbiAgICAgIFxcXCJlcnJcXFwiOiB7XFxuICAgICAgICBcXFwiZXJyY29kZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcIm1lc3NhZ2VcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICAgIH1cXG4gICAgfSxcXG4gIFxcbiAgICAvLyBSZWNlaXZlIGRhdGEgb24gYSBjb25uZWN0ZWQgc29ja2V0LlxcbiAgICBcXFwib25EYXRhXFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcImV2ZW50XFxcIixcXG4gICAgICBcXFwidmFsdWVcXFwiOiB7XFxcImRhdGFcXFwiOiBcXFwiYnVmZmVyXFxcIn1cXG4gICAgfSxcXG4gIFxcbiAgICAvLyBMaXN0ZW4gYXMgYSBzZXJ2ZXIgYXQgYSBzcGVjaWZpZWQgaG9zdCBhbmQgcG9ydC5cXG4gICAgLy8gQWZ0ZXIgY2FsbGluZyBsaXN0ZW4gdGhlIGNsaWVudCBzaG91bGQgbGlzdGVuIGZvciAnb25Db25uZWN0aW9uJyBldmVudHMuXFxuICAgIC8vIEZhaWxzIHdpdGggYW4gZXJyb3IgaWYgZXJyb3JzIG9jY3VyIHdoaWxlIGJpbmRpbmcgb3IgbGlzdGVuaW5nLlxcbiAgICBcXFwibGlzdGVuXFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiLCBcXFwibnVtYmVyXFxcIl0sXFxuICAgICAgXFxcImVyclxcXCI6IHtcXG4gICAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgICAgfVxcbiAgICB9LFxcbiAgXFxuICAgIC8vIFJlY2VpdmUgYSBjb25uZWN0aW9uLlxcbiAgICAvLyBUaGUgc29ja2V0IHBhcmFtZXRlciBtYXkgYmUgdXNlZCB0byBjb25zdHJ1Y3QgYSBuZXcgc29ja2V0LlxcbiAgICAvLyBIb3N0IGFuZCBwb3J0IGluZm9ybWF0aW9uIHByb3ZpZGUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHJlbW90ZSBwZWVyLlxcbiAgICBcXFwib25Db25uZWN0aW9uXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcImV2ZW50XFxcIiwgXFxcInZhbHVlXFxcIjoge1xcbiAgICAgIFxcXCJzb2NrZXRcXFwiOiBcXFwibnVtYmVyXFxcIixcXG4gICAgICBcXFwiaG9zdFxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgIFxcXCJwb3J0XFxcIjogXFxcIm51bWJlclxcXCJcXG4gICAgfX1cXG4gIH1cXG59XFxuXCI7XG5zZWxmLmNvcmVVZHBzb2NrZXQgPSBcIi8vIEEgVURQIHNvY2tldC5cXG4vLyBHZW5lcmFsbHksIHRvIHVzZSB5b3UganVzdCBuZWVkIHRvIGNhbGwgYmluZCgpIGF0IHdoaWNoIHBvaW50IG9uRGF0YVxcbi8vIGV2ZW50cyB3aWxsIHN0YXJ0IHRvIGZsb3cuIE5vdGUgdGhhdCBiaW5kKCkgc2hvdWxkIG9ubHkgYmUgY2FsbGVkXFxuLy8gb25jZSBwZXIgaW5zdGFuY2UuXFxue1xcbiAgXFxcIm5hbWVcXFwiOiBcXFwiY29yZS51ZHBzb2NrZXRcXFwiLFxcbiAgXFxcImFwaVxcXCI6IHtcXG4gICAgLyoqIFxcbiAgICAgKiBlcnJvciBjb2RlcyBhbmQgZGVmYXVsdCBtZXNzYWdlcyB0aGF0IG1heSBiZSByZXR1cm5lZCBvbiBmYWlsdXJlcy5cXG4gICAgICovXFxuICAgIFxcXCJFUlJDT0RFXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcImNvbnN0YW50XFxcIiwgXFxcInZhbHVlXFxcIjoge1xcbiAgICAgIC8qKiBHRU5FUkFMICoqL1xcbiAgICAgIFxcXCJTVUNDRVNTXFxcIjogXFxcIlN1Y2Nlc3MhXFxcIixcXG4gICAgICAvLyBVbmtub3duXFxuICAgICAgXFxcIlVOS05PV05cXFwiOiBcXFwiVW5rbm93biBlcnJvclxcXCIsXFxuICAgICAgXFxuICAgICAgLy8gU29ja2V0IGlzIGFscmVhZHkgYm91bmRcXG4gICAgICBcXFwiQUxSRUFEWV9CT1VORFxcXCI6IFxcXCJTb2NrZXQgYWxyZWFkeSBib3VuZFxcXCIsXFxuICAgICAgLy8gSW52YWxpZCBBcmd1bWVudCwgY2xpZW50IGVycm9yXFxuICAgICAgXFxcIklOVkFMSURfQVJHVU1FTlRcXFwiOiBcXFwiSW52YWxpZCBhcmd1bWVudFxcXCIsXFxuICAgICAgLy8gU29ja2V0IHJlc2V0IGJlY2F1c2Ugb2YgY2hhbmdlIGluIG5ldHdvcmsgc3RhdGUuXFxuICAgICAgXFxcIk5FVFdPUktfQ0hBTkdFRFxcXCI6IFxcXCJOZXR3b3JrIGNoYW5nZWRcXFwiLFxcbiAgICAgIC8vIEZhaWx1cmUgdG8gc2VuZCBkYXRhXFxuICAgICAgXFxcIlNORURfRkFJTEVEXFxcIjogXFxcIlNlbmQgZmFpbGVkXFxcIlxcbiAgICB9fSxcXG4gIFxcbiAgICAvLyBDcmVhdGVzIGEgc29ja2V0LCBiaW5kcyBpdCB0byBhbiBpbnRlcmZhY2UgYW5kIHBvcnQgYW5kIGxpc3RlbnMgZm9yXFxuICAgIC8vIG1lc3NhZ2VzLCBkaXNwYXRjaGluZyBlYWNoIG1lc3NhZ2UgYXMgb24gb25EYXRhIGV2ZW50LlxcbiAgICAvLyBSZXR1cm5zIG9uIHN1Y2Nlc3MsIG9yIGZhaWxzIHdpdGggYW4gZXJyb3Igb24gZmFpbHVyZS5cXG4gICAgXFxcImJpbmRcXFwiOiB7XFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIixcXG4gICAgICBcXFwidmFsdWVcXFwiOiBbXFxuICAgICAgICAvLyBJbnRlcmZhY2UgKGFkZHJlc3MpIG9uIHdoaWNoIHRvIGJpbmQuXFxuICAgICAgICBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIC8vIFBvcnQgb24gd2hpY2ggdG8gYmluZC5cXG4gICAgICAgIFxcXCJudW1iZXJcXFwiXFxuICAgICAgXSxcXG4gICAgICBcXFwicmV0XFxcIjogW10sXFxuICAgICAgXFxcImVyclxcXCI6IHtcXG4gICAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgICAgfVxcbiAgICB9LFxcbiAgXFxuICAgIC8vIFJldHJpZXZlcyB0aGUgc3RhdGUgb2YgdGhlIHNvY2tldC5cXG4gICAgLy8gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XFxuICAgIC8vICAtIGxvY2FsQWRkcmVzczogdGhlIHNvY2tldCdzIGxvY2FsIGFkZHJlc3MsIGlmIGJvdW5kXFxuICAgIC8vICAtIGxvY2FsUG9ydDogdGhlIHNvY2tldCdzIGxvY2FsIHBvcnQsIGlmIGJvdW5kXFxuICAgIFxcXCJnZXRJbmZvXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdLCBcXFwicmV0XFxcIjoge1xcbiAgICAgIFxcXCJsb2NhbEFkZHJlc3NcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICBcXFwibG9jYWxQb3J0XFxcIjogXFxcIm51bWJlclxcXCJcXG4gICAgfX0sXFxuICBcXG4gICAgLy8gU2VuZHMgZGF0YSB0byBhIHNlcnZlci5cXG4gICAgLy8gVGhlIHNvY2tldCBtdXN0IGJlIGJvdW5kLlxcbiAgICAvLyBSZXR1cm5zIGFuIGludGVnZXIgaW5kaWNhdGluZyB0aGUgbnVtYmVyIG9mIGJ5dGVzIHdyaXR0ZW4sIHdpdGggbm9cXG4gICAgLy8gZ3VhcmFudGVlIHRoYXQgdGhlIHJlbW90ZSBzaWRlIHJlY2VpdmVkIHRoZSBkYXRhLlxcbiAgICBcXFwic2VuZFRvXFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjogW1xcbiAgICAgICAgLy8gRGF0YSB0byBzZW5kLlxcbiAgICAgICAgXFxcImJ1ZmZlclxcXCIsXFxuICAgICAgICAvLyBEZXN0aW5hdGlvbiBhZGRyZXNzLlxcbiAgICAgICAgXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICAvLyBEZXN0aW5hdGlvbiBwb3J0LlxcbiAgICAgICAgXFxcIm51bWJlclxcXCJcXG4gICAgICBdLFxcbiAgICAgIFxcXCJyZXRcXFwiOiBcXFwibnVtYmVyXFxcIixcXG4gICAgICBcXFwiZXJyXFxcIjoge1xcbiAgICAgICAgXFxcImVycmNvZGVcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJtZXNzYWdlXFxcIjogXFxcInN0cmluZ1xcXCJcXG4gICAgICB9XFxuICAgIH0sXFxuICBcXG4gICAgLy8gUmVsZWFzZXMgYWxsIHJlc291cmNlcyBhc3NvY2lhdGVkIHdpdGggdGhpcyBzb2NrZXQuXFxuICAgIC8vIE5vLW9wIGlmIHRoZSBzb2NrZXQgaXMgbm90IGJvdW5kLlxcbiAgICBcXFwiZGVzdHJveVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXX0sXFxuICBcXG4gICAgLy8gQ2FsbGVkIG9uY2UgZm9yIGVhY2ggbWVzc2FnZSByZWNlaXZlZCBvbiB0aGlzIHNvY2tldCwgb25jZSBpdCdzXFxuICAgIC8vIGJlZW4gc3VjY2Vzc2Z1bGx5IGJvdW5kLlxcbiAgICBcXFwib25EYXRhXFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcImV2ZW50XFxcIixcXG4gICAgICBcXFwidmFsdWVcXFwiOiB7XFxuICAgICAgICAvLyBaZXJvIG1lYW5zIHN1Y2Nlc3MsIGFueSBvdGhlciBcXFwidmFsdWVcXFwiIGlzIGltcGxlbWVudGF0aW9uLWRlcGVuZGVudC5cXG4gICAgICAgIFxcXCJyZXN1bHRDb2RlXFxcIjogXFxcIm51bWJlclxcXCIsXFxuICAgICAgICAvLyBBZGRyZXNzIGZyb20gd2hpY2ggZGF0YSB3YXMgcmVjZWl2ZWQuXFxuICAgICAgICBcXFwiYWRkcmVzc1xcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgLy8gUG9ydCBmcm9tIHdoaWNoIGRhdGEgd2FzIHJlY2VpdmVkLlxcbiAgICAgICAgXFxcInBvcnRcXFwiOiBcXFwibnVtYmVyXFxcIixcXG4gICAgICAgIC8vIERhdGEgcmVjZWl2ZWQuXFxuICAgICAgICBcXFwiZGF0YVxcXCI6IFxcXCJidWZmZXJcXFwiXFxuICAgICAgfVxcbiAgICB9XFxuICB9XFxufVxcblwiO1xuc2VsZi5jb3JlVmlldyA9IFwie1xcbiAgXFxcIm5hbWVcXFwiOiBcXFwiY29yZS52aWV3XFxcIixcXG4gIFxcXCJhcGlcXFwiOiB7XFxuICAgIFxcXCJzaG93XFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIl19LFxcbiAgICBcXFwiaXNTZWN1cmVcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW10sIFxcXCJyZXRcXFwiOiBcXFwiYm9vbGVhblxcXCIgfSxcXG4gICAgXFxcImNsb3NlXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdfSxcXG4gICAgXFxcInBvc3RNZXNzYWdlXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtcXFwib2JqZWN0XFxcIl19LFxcbiAgXFxuICAgIFxcXCJtZXNzYWdlXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcImV2ZW50XFxcIiwgXFxcInZhbHVlXFxcIjogXFxcIm9iamVjdFxcXCJ9LFxcbiAgICBcXFwib25DbG9zZVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdfVxcbiAgfVxcbn1cXG5cIjtcbnNlbGYuY29yZVdlYnNvY2tldCA9IFwie1xcbiAgXFxcIm5hbWVcXFwiOiBcXFwiY29yZS53ZWJzb2NrZXRcXFwiLFxcbiAgXFxcImFwaVxcXCI6IHtcXG4gICAgLy8gQ29uc3RydWN0cyBuZXcgd2Vic29ja2V0LiBFcnJvcnMgaW4gY29uc3RydWN0aW9uIGFyZSBwYXNzZWQgb25cXG4gICAgLy8gdGhyb3VnaCB0aGUgb25FcnJvciBldmVudC5cXG4gICAgXFxcImNvbnN0cnVjdG9yXFxcIjoge1xcXCJ2YWx1ZVxcXCI6IFtcXG4gICAgICAvLyBVUkwgdG8gY29ubmVjdCB0aHJvdWdoXFxuICAgICAgXFxcInN0cmluZ1xcXCIsXFxuICAgICAgLy8gUHJvdG9jb2xzXFxuICAgICAgW1xcXCJhcnJheVxcXCIsIFxcXCJzdHJpbmdcXFwiXVxcbiAgICBdfSxcXG4gICAgLy8gU2VuZCB0aGUgZGF0YSB0byB0aGUgb3RoZXIgc2lkZSBvZiB0aGlzIGNvbm5lY3Rpb24uIE9ubHkgb25lIG9mXFxuICAgIC8vIHRoZSBlbnRyaWVzIGluIHRoZSBkaWN0aW9uYXJ5IHRoYXQgaXMgcGFzc2VkIHdpbGwgYmUgc2VudC5cXG4gICAgXFxcInNlbmRcXFwiOiB7XFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIixcXG4gICAgICBcXFwidmFsdWVcXFwiOiBbe1xcbiAgICAgICAgXFxcInRleHRcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJiaW5hcnlcXFwiOiBcXFwiYmxvYlxcXCIsXFxuICAgICAgICBcXFwiYnVmZmVyXFxcIjogXFxcImJ1ZmZlclxcXCJcXG4gICAgICB9XSxcXG4gICAgICBcXFwiZXJyXFxcIjoge1xcbiAgICAgICAgXFxcImVycmNvZGVcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJtZXNzYWdlXFxcIjogXFxcInN0cmluZ1xcXCJcXG4gICAgICB9XFxuICAgIH0sXFxuICAgIFxcXCJnZXRSZWFkeVN0YXRlXFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjogW10sXFxuICAgICAgLy8gMCAtPiBDT05ORUNUSU5HXFxuICAgICAgLy8gMSAtPiBPUEVOXFxuICAgICAgLy8gMiAtPiBDTE9TSU5HXFxuICAgICAgLy8gMyAtPiBDTE9TRURcXG4gICAgICBcXFwicmV0XFxcIjogXFxcIm51bWJlclxcXCJcXG4gICAgfSxcXG4gICAgXFxcImdldEJ1ZmZlcmVkQW1vdW50XFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxuICAgICAgICAgICAgICAgICAgICAgICAgICBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCJdLFxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXFxcInJldFxcXCI6IFxcXCJudW1iZXJcXFwifSxcXG4gICAgXFxcImNsb3NlXFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxuICAgICAgLy8gVGhlIGZpcnN0IGFyZ3VtZW50IGlzIGEgc3RhdHVzIGNvZGUgZnJvbVxcbiAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9DbG9zZUV2ZW50XFxuICAgICAgXFxcInZhbHVlXFxcIjogW1xcXCJudW1iZXJcXFwiLCBcXFwic3RyaW5nXFxcIl0sXFxuICAgICAgXFxcImVyclxcXCI6IHtcXG4gICAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgICAgfVxcbiAgICB9LFxcbiAgICBcXFwib25NZXNzYWdlXFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcImV2ZW50XFxcIixcXG4gICAgICAvLyBUaGUgZGF0YSB3aWxsIGJlIHN0b3JlZCBpbiBvbmUgb2YgdGhlIGtleXMsXFxuICAgICAgLy8gY29ycmVzcG9uZGluZyB3aXRoIHRoZSBcXFwidHlwZVxcXCIgcmVjZWl2ZWRcXG4gICAgICBcXFwidmFsdWVcXFwiOiB7XFxuICAgICAgICBcXFwidGV4dFxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcImJpbmFyeVxcXCI6IFxcXCJibG9iXFxcIixcXG4gICAgICAgIFxcXCJidWZmZXJcXFwiOiBcXFwiYnVmZmVyXFxcIlxcbiAgICAgIH1cXG4gICAgfSxcXG4gICAgXFxcIm9uT3BlblxcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjogW11cXG4gICAgfSxcXG4gICAgXFxcIm9uRXJyb3JcXFwiOiB7XFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwiZXZlbnRcXFwiLFxcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IHtcXG4gICAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgICAgfVxcbiAgICB9LFxcbiAgICBcXFwib25DbG9zZVxcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsXFxuICAgICAgLy8gXFxcInZhbHVlXFxcInMgZ2l2ZW4gYnkgV2ViU29ja2V0cyBzcGVjOlxcbiAgICAgIC8vIGh0dHA6Ly93d3cudzMub3JnL1RSL3dlYnNvY2tldHMvI2Nsb3NlZXZlbnRcXG4gICAgICBcXFwidmFsdWVcXFwiOiB7XFxuICAgICAgICBcXFwiY29kZVxcXCI6IFxcXCJudW1iZXJcXFwiLFxcbiAgICAgICAgXFxcInJlYXNvblxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcIndhc0NsZWFuXFxcIjogXFxcImJvb2xlYW5cXFwiXFxuICAgICAgfVxcbiAgICB9XFxuICB9XFxufVxcblwiO1xuc2VsZi5zb2NpYWwgPSBcIi8qKlxcbiAqIFNPQ0lBTCBBUElcXG4gKlxcbiAqIEFQSSBmb3IgY29ubmVjdGluZyB0byBzb2NpYWwgbmV0d29ya3MgYW5kIG1lc3NhZ2luZyBvZiB1c2Vycy5cXG4gKiBBbiBpbnN0YW5jZSBvZiBhIHNvY2lhbCBwcm92aWRlciBlbmNhcHN1bGF0ZXMgYSBzaW5nbGUgdXNlciBsb2dnaW5nIGludG9cXG4gKiBhIHNpbmdsZSBuZXR3b3JrLlxcbiAqXFxuICogVGhpcyBBUEkgZGlzdGluZ3Vpc2hlcyBiZXR3ZWVuIGEgXFxcInVzZXJcXFwiIGFuZCBhIFxcXCJjbGllbnRcXFwiLiBBIGNsaWVudCBpcyBhXFxuICogdXNlcidzIHBvaW50IG9mIGFjY2VzcyB0byB0aGUgc29jaWFsIHByb3ZpZGVyLiBUaHVzLCBhIHVzZXIgdGhhdCBoYXNcXG4gKiBtdWx0aXBsZSBjb25uZWN0aW9ucyB0byBhIHByb3ZpZGVyIChlLmcuLCBvbiBtdWx0aXBsZSBkZXZpY2VzIG9yIGluIG11bHRpcGxlXFxuICogYnJvd3NlcnMpIGhhcyBtdWx0aXBsZSBjbGllbnRzLlxcbiAqXFxuICogVGhlIHNlbWFudGljcyBvZiBzb21lIHByb3BlcnRpZXMgYXJlIGRlZmluZWQgYnkgdGhlIHNwZWNpZmljIHByb3ZpZGVyLCBlLmcuOlxcbiAqIC0gRWRnZXMgaW4gdGhlIHNvY2lhbCBuZXR3b3JrICh3aG8gaXMgb24geW91ciByb3N0ZXIpXFxuICogLSBSZWxpYWJsZSBtZXNzYWdlIHBhc3NpbmcgKG9yIHVucmVsaWFibGUpXFxuICogLSBJbi1vcmRlciBtZXNzYWdlIGRlbGl2ZXJ5IChvciBvdXQgb2Ygb3JkZXIpXFxuICogLSBQZXJzaXN0ZW50IGNsaWVudElkIC0gV2hldGhlciB5b3VyIGNsaWVudElkIGNoYW5nZXMgYmV0d2VlbiBsb2dpbnMgd2hlblxcbiAqICAgIGNvbm5lY3RpbmcgZnJvbSB0aGUgc2FtZSBkZXZpY2VcXG4gKlxcbiAqIEEgPGNsaWVudF9zdGF0ZT4sIHVzZWQgaW4gdGhpcyBBUEksIGlzIGRlZmluZWQgYXM6XFxuICogLSBJbmZvcm1hdGlvbiByZWxhdGVkIHRvIGEgc3BlY2lmaWMgY2xpZW50IG9mIGEgdXNlclxcbiAqIC0gVXNlIGNhc2VzOiBcXG4gKiAgIC0gUmV0dXJuZWQgb24gY2hhbmdlcyBmb3IgZnJpZW5kcyBvciBteSBpbnN0YW5jZSBpbiAnb25DbGllbnRTdGF0ZSdcXG4gKiAgIC0gUmV0dXJuZWQgaW4gYSBnbG9iYWwgbGlzdCBmcm9tICdnZXRDbGllbnRzJ1xcbiAqIHtcXG4gKiAgIC8vIE1hbmRhdG9yeVxcbiAqICAgJ3VzZXJJZCc6ICdzdHJpbmcnLCAgICAgIC8vIFVuaXF1ZSBJRCBvZiB1c2VyIChlLmcuIGFsaWNlQGdtYWlsLmNvbSlcXG4gKiAgICdjbGllbnRJZCc6ICdzdHJpbmcnLCAgICAvLyBVbmlxdWUgSUQgb2YgY2xpZW50XFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gKGUuZy4gYWxpY2VAZ21haWwuY29tL0FuZHJvaWQtMjNuYWRzdjMyZilcXG4gKiAgICdzdGF0dXMnOiAnc3RyaW5nJywgICAgICAvLyBTdGF0dXMgb2YgdGhlIGNsaWVudC4gJ1NUQVRVUycgbWVtYmVyLlxcbiAqICAgJ2xhc3RVcGRhdGVkJzogJ251bWJlcicsIC8vIFRpbWVzdGFtcCBvZiB0aGUgbGFzdCB0aW1lIGNsaWVudF9zdGF0ZSB3YXMgdXBkYXRlZFxcbiAqICAgJ2xhc3RTZWVuJzogJ251bWJlcicgICAgIC8vIFRpbWVzdGFtcCBvZiB0aGUgbGFzdCBzZWVuIHRpbWUgb2YgdGhpcyBkZXZpY2UuXFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm90ZTogJ2xhc3RTZWVuJyBET0VTIE5PVCB0cmlnZ2VyIGFuICdvbkNsaWVudFN0YXRlJyBldmVudFxcbiAqIH1cXG4gKiBcXG4gKiBBIDx1c2VyX3Byb2ZpbGU+LCB1c2VkIGluIHRoaXMgQVBJLCBpcyBkZWZpbmVkIGFzOlxcbiAqIC0gSW5mb3JtYXRpb24gcmVsYXRlZCB0byBhIHNwZWNpZmljIHVzZXIgKHByb2ZpbGUgaW5mb3JtYXRpb24pXFxuICogLSBVc2UgY2FzZXM6XFxuICogICAtIFJldHVybmVkIG9uIGNoYW5nZXMgZm9yIGZyaWVuZHMgb3IgbXlzZWxmIGluICdvblVzZXJQcm9maWxlJ1xcbiAqICAgLSBSZXR1cm5lZCBpbiBhIGdsb2JhbCBsaXN0IGZyb20gJ2dldFVzZXJzJ1xcbiAqIHtcXG4gKiAgIC8vIE1hbmRhdG9yeVxcbiAqICAgXFxcInVzZXJJZFxcXCI6IFxcXCJzdHJpbmdcXFwiLCAgICAvLyBVbmlxdWUgSUQgb2YgdXNlciAoZS5nLiBhbGljZUBnbWFpbC5jb20pXFxuICogICBcXFwibGFzdFVwZGF0ZWRcXFwiOiBcXFwibnVtYmVyXFxcIiAgLy8gVGltZXN0YW1wIG9mIGxhc3QgY2hhbmdlIHRvIHRoZSBwcm9maWxlXFxuICogICAvLyBPcHRpb25hbFxcbiAqICAgXFxcIm5hbWVcXFwiOiBcXFwic3RyaW5nXFxcIiwgICAgICAvLyBOYW1lIChlLmcuIEFsaWNlKVxcbiAqICAgXFxcInVybFxcXCI6IFxcXCJzdHJpbmdcXFwiLCAgICAgICAvLyBIb21lcGFnZSBVUkxcXG4gKiAgIFxcXCJpbWFnZURhdGFcXFwiOiBcXFwic3RyaW5nXFxcIiwgLy8gVVJJIG9mIGEgcHJvZmlsZSBpbWFnZS5cXG4gKiB9XFxuICoqL1xcbntcXG4gIFxcXCJuYW1lXFxcIjogXFxcInNvY2lhbFxcXCIsXFxuICBcXFwiYXBpXFxcIjoge1xcbiAgICAvKiogXFxuICAgICAqIGVycm9yIGNvZGVzIGFuZCBkZWZhdWx0IG1lc3NhZ2VzIHRoYXQgbWF5IGJlIHJldHVybmVkIG9uIGZhaWx1cmVzLlxcbiAgICAgKi9cXG4gICAgXFxcIkVSUkNPREVcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwiY29uc3RhbnRcXFwiLCBcXFwidmFsdWVcXFwiOiB7XFxuICAgICAgLyoqIEdFTkVSQUwgKiovXFxuICAgICAgXFxcIlNVQ0NFU1NcXFwiOiBcXFwiU3VjY2VzcyFcXFwiLFxcbiAgICAgIC8vIFVua25vd25cXG4gICAgICBcXFwiVU5LTk9XTlxcXCI6IFxcXCJVbmtub3duIGVycm9yXFxcIixcXG4gICAgICAvLyBVc2VyIGlzIGN1cnJlbnRseSBvZmZsaW5lXFxuICAgICAgXFxcIk9GRkxJTkVcXFwiOiBcXFwiVXNlciBpcyBjdXJyZW50bHkgb2ZmbGluZVxcXCIsXFxuICAgICAgLy8gSW1wcm9wZXIgcGFyYW1ldGVyc1xcbiAgICAgIFxcXCJNQUxGT1JNRURQQVJBTUVURVJTXFxcIjogXFxcIlBhcmFtZXRlcnMgYXJlIG1hbGZvcm1lZFxcXCIsXFxuICBcXG4gICAgICAvKiogTE9HSU4gKiovXFxuICAgICAgLy8gRXJyb3IgYXV0aGVudGljYXRpbmcgdG8gdGhlIHNlcnZlciAoZS5nLiBpbnZhbGlkIGNyZWRlbnRpYWxzKVxcbiAgICAgIFxcXCJMT0dJTl9CQURDUkVERU5USUFMU1xcXCI6IFxcXCJFcnJvciBhdXRoZW50aWNhdGluZyB3aXRoIHNlcnZlclxcXCIsXFxuICAgICAgLy8gRXJyb3Igd2l0aCBjb25uZWN0aW5nIHRvIHRoZSBzZXJ2ZXJcXG4gICAgICBcXFwiTE9HSU5fRkFJTEVEQ09OTkVDVElPTlxcXCI6IFxcXCJFcnJvciBjb25uZWN0aW5nIHRvIHNlcnZlclxcXCIsXFxuICAgICAgLy8gVXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpblxcbiAgICAgIFxcXCJMT0dJTl9BTFJFQURZT05MSU5FXFxcIjogXFxcIlVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW5cXFwiLFxcbiAgICAgIC8vIE9BdXRoIEVycm9yXFxuICAgICAgXFxcIkxPR0lOX09BVVRIRVJST1JcXFwiOiBcXFwiT0F1dGggRXJyb3JcXFwiLFxcbiAgXFxuICAgICAgLyoqIFNFTkRNRVNTQUdFICoqL1xcbiAgICAgIC8vIE1lc3NhZ2Ugc2VudCB0byBpbnZhbGlkIGRlc3RpbmF0aW9uIChlLmcuIG5vdCBpbiB1c2VyJ3Mgcm9zdGVyKVxcbiAgICAgIFxcXCJTRU5EX0lOVkFMSURERVNUSU5BVElPTlxcXCI6IFxcXCJNZXNzYWdlIHNlbnQgdG8gYW4gaW52YWxpZCBkZXN0aW5hdGlvblxcXCJcXG4gICAgfX0sXFxuICAgIFxcbiAgICAvKipcXG4gICAgICogTGlzdCBvZiBwb3NzaWJsZSBzdGF0dXNlcyBmb3IgPGNsaWVudF9zdGF0ZT4uc3RhdHVzXFxuICAgICAqKi9cXG4gICAgXFxcIlNUQVRVU1xcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJjb25zdGFudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IHtcXG4gICAgICAvLyBOb3QgbG9nZ2VkIGluXFxuICAgICAgXFxcIk9GRkxJTkVcXFwiOiBcXFwiT0ZGTElORVxcXCIsXFxuICAgICAgLy8gVGhpcyBjbGllbnQgcnVucyB0aGUgc2FtZSBmcmVlZG9tLmpzIGFwcCBhcyB5b3UgYW5kIGlzIG9ubGluZVxcbiAgICAgIFxcXCJPTkxJTkVcXFwiOiBcXFwiT05MSU5FXFxcIixcXG4gICAgICAvLyBUaGlzIGNsaWVudCBpcyBvbmxpbmUsIGJ1dCBkb2VzIG5vdCBydW4gdGhlIHNhbWUgYXBwIChjaGF0IGNsaWVudClcXG4gICAgICAvLyAoaS5lLiBjYW4gYmUgdXNlZnVsIHRvIGludml0ZSBvdGhlcnMgdG8geW91ciBmcmVlZG9tLmpzIGFwcClcXG4gICAgICBcXFwiT05MSU5FX1dJVEhfT1RIRVJfQVBQXFxcIjogXFxcIk9OTElORV9XSVRIX09USEVSX0FQUFxcXCJcXG4gICAgfX0sXFxuICBcXG4gICAgLyoqXFxuICAgICAqIExvZyBpbnRvIHRoZSBuZXR3b3JrIChTZWUgYmVsb3cgZm9yIHBhcmFtZXRlcnMpXFxuICAgICAqIGUuZy4gc29jaWFsLmxvZ2luKE9iamVjdCBvcHRpb25zKVxcbiAgICAgKlxcbiAgICAgKiBAbWV0aG9kIGxvZ2luXFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBsb2dpbk9wdGlvbnMgLSBTZWUgYmVsb3dcXG4gICAgICogQHJldHVybiB7T2JqZWN0fSA8Y2xpZW50X3N0YXRlPlxcbiAgICAgKiovXFxuICAgIFxcXCJsb2dpblxcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLFxcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IFt7XFxuICAgICAgICAvLyBPcHRpb25hbFxcbiAgICAgICAgXFxcImFnZW50XFxcIjogXFxcInN0cmluZ1xcXCIsICAgICAgICAgLy8gTmFtZSBvZiB0aGUgYXBwbGljYXRpb25cXG4gICAgICAgIFxcXCJ2ZXJzaW9uXFxcIjogXFxcInN0cmluZ1xcXCIsICAgICAgIC8vIFZlcnNpb24gb2YgYXBwbGljYXRpb25cXG4gICAgICAgIFxcXCJ1cmxcXFwiOiBcXFwic3RyaW5nXFxcIiwgICAgICAgICAgIC8vIFVSTCBvZiBhcHBsaWNhdGlvblxcbiAgICAgICAgXFxcImludGVyYWN0aXZlXFxcIjogXFxcImJvb2xlYW5cXFwiLCAgLy8gQWxsb3cgdXNlciBpbnRlcmFjdGlvbiBmcm9tIHByb3ZpZGVyLlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgbm90IHNldCwgaW50ZXJwcmV0ZWQgYXMgdHJ1ZS5cXG4gICAgICAgIFxcXCJyZW1lbWJlckxvZ2luXFxcIjogXFxcImJvb2xlYW5cXFwiIC8vIENhY2hlIGxvZ2luIGNyZWRlbnRpYWxzLiBJZiBub3Qgc2V0LFxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW50ZXJwcmV0ZWQgYXMgdHJ1ZS5cXG4gICAgICB9XSxcXG4gICAgICBcXFwicmV0XFxcIjogeyAgICAgICAgICAgICAgICAgICAgICAgLy8gPGNsaWVudF9zdGF0ZT4sIGRlZmluZWQgYWJvdmUuXFxuICAgICAgICBcXFwidXNlcklkXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwiY2xpZW50SWRcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJzdGF0dXNcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJsYXN0VXBkYXRlZFxcXCI6IFxcXCJudW1iZXJcXFwiLFxcbiAgICAgICAgXFxcImxhc3RTZWVuXFxcIjogXFxcIm51bWJlclxcXCJcXG4gICAgICB9LFxcbiAgICAgIFxcXCJlcnJcXFwiOiB7XFxuICAgICAgICBcXFwiZXJyY29kZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcIm1lc3NhZ2VcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICAgIH1cXG4gICAgfSxcXG4gIFxcbiAgICAvKipcXG4gICAgICogQ2xlYXJzIGNhY2hlZCBjcmVkZW50aWFscyBvZiB0aGUgcHJvdmlkZXIuXFxuICAgICAqXFxuICAgICAqIEBtZXRob2QgY2xlYXJDYWNoZWRDcmVkZW50aWFsc1xcbiAgICAgKiBAcmV0dXJuIG5vdGhpbmdcXG4gICAgICoqL1xcbiAgICBcXFwiY2xlYXJDYWNoZWRDcmVkZW50aWFsc1xcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXX0sXFxuICBcXG4gICAgLyoqXFxuICAgICAqIEdldCA8Y2xpZW50X3N0YXRlPnMgdGhhdCBoYXZlIGJlZW4gb2JzZXJ2ZWQuXFxuICAgICAqIFRoZSBwcm92aWRlciBpbXBsZW1lbnRhdGlvbiBtYXkgYWN0IGFzIGEgY2xpZW50LCBpbiB3aGljaCBjYXNlIGl0c1xcbiAgICAgKiA8Y2xpZW50X3N0YXRlPiB3aWxsIGJlIGluIHRoaXMgbGlzdC5cXG4gICAgICogZ2V0Q2xpZW50cyBtYXkgbm90IHJlcHJlc2VudCBhbiBlbnRpcmUgcm9zdGVyLCBzaW5jZSBpdCBtYXkgbm90IGJlXFxuICAgICAqIGVudW1lcmFibGUuXFxuICAgICAqIFxcbiAgICAgKiBAbWV0aG9kIGdldENsaWVudHNcXG4gICAgICogQHJldHVybiB7T2JqZWN0fSB7IFxcbiAgICAgKiAgICBcXFwiY2xpZW50SWQxXFxcIjogPGNsaWVudF9zdGF0ZT4sXFxuICAgICAqICAgIFxcXCJjbGllbnRJZDJcXFwiOiA8Y2xpZW50X3N0YXRlPixcXG4gICAgICogICAgIC4uLlxcbiAgICAgKiB9IExpc3Qgb2YgPGNsaWVudF9zdGF0ZT5zIGluZGV4ZWQgYnkgY2xpZW50SWRcXG4gICAgICogICBPbiBmYWlsdXJlLCByZWplY3RzIHdpdGggYW4gZXJyb3IgY29kZS5cXG4gICAgICoqL1xcbiAgICBcXFwiZ2V0Q2xpZW50c1xcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLFxcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IFtdLFxcbiAgICAgIFxcXCJyZXRcXFwiOiBcXFwib2JqZWN0XFxcIixcXG4gICAgICBcXFwiZXJyXFxcIjoge1xcbiAgICAgICAgXFxcImVycmNvZGVcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJtZXNzYWdlXFxcIjogXFxcInN0cmluZ1xcXCJcXG4gICAgICB9XFxuICAgIH0sXFxuICBcXG4gICAgLyoqXFxuICAgICAqIEdldCA8dXNlcl9wcm9maWxlPnMgdGhhdCBoYXZlIGJlZW4gb2JzZXJ2ZWQuXFxuICAgICAqIFRoZSBwcm92aWRlciBpbXBsZW1lbnRhdGlvbiBtYXkgYWN0IGFzIGEgY2xpZW50LCBpbiB3aGljaCBjYXNlIGl0c1xcbiAgICAgKiA8dXNlcl9wcm9maWxlPiB3aWxsIGJlIGluIHRoaXMgbGlzdC5cXG4gICAgICogZ2V0VXNlcnMgbWF5IG5vdCByZXByZXNlbnQgYW4gZW50aXJlIHJvc3Rlciwgc2luY2UgaXQgbWF5IG5vdCBiZVxcbiAgICAgKiBlbnVtZXJhYmxlLlxcbiAgICAgKlxcbiAgICAgKiBAbWV0aG9kIGdldFVzZXJzXFxuICAgICAqIEByZXR1cm4ge09iamVjdH0geyBcXG4gICAgICogICAgXFxcInVzZXJJZDFcXFwiOiA8dXNlcl9wcm9maWxlPixcXG4gICAgICogICAgXFxcInVzZXJJZDJcXFwiOiA8dXNlcl9wcm9maWxlPixcXG4gICAgICogICAgIC4uLlxcbiAgICAgKiB9IExpc3Qgb2YgPHVzZXJfcHJvZmlsZT5zIGluZGV4ZWQgYnkgdXNlcklkXFxuICAgICAqICAgT24gZmFpbHVyZSwgcmVqZWN0cyB3aXRoIGFuIGVycm9yIGNvZGUuXFxuICAgICAqKi9cXG4gICAgXFxcImdldFVzZXJzXFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjogW10sXFxuICAgICAgXFxcInJldFxcXCI6IFxcXCJvYmplY3RcXFwiLFxcbiAgICAgIFxcXCJlcnJcXFwiOiB7XFxuICAgICAgICBcXFwiZXJyY29kZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcIm1lc3NhZ2VcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICAgIH1cXG4gICAgfSxcXG4gIFxcbiAgICAvKiogXFxuICAgICAqIFNlbmQgYSBtZXNzYWdlLlxcbiAgICAgKiBEZXN0aW5hdGlvbiBtYXkgYmUgYSB1c2VySWQgb3IgYSBjbGllbnRJZC4gSWYgaXQgaXMgYSB1c2VySWQsIGFsbCBjbGllbnRzXFxuICAgICAqIGZvciB0aGF0IHVzZXIgc2hvdWxkIHJlY2VpdmUgdGhlIG1lc3NhZ2UuXFxuICAgICAqIFxcbiAgICAgKiBAbWV0aG9kIHNlbmRNZXNzYWdlXFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBkZXN0aW5hdGlvbl9pZCBUaGUgdXNlcklkIG9yIGNsaWVudElkIHRvIHNlbmQgdG9cXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gc2VuZC5cXG4gICAgICogQHJldHVybiBub3RoaW5nXFxuICAgICAqICBPbiBmYWlsdXJlLCByZWplY3RzIHdpdGggYW4gZXJyb3IgY29kZVxcbiAgICAgKiovXFxuICAgIFxcXCJzZW5kTWVzc2FnZVxcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLFxcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIiwgXFxcInN0cmluZ1xcXCJdLFxcbiAgICAgIFxcXCJlcnJcXFwiOiB7XFxuICAgICAgICBcXFwiZXJyY29kZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcIm1lc3NhZ2VcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICAgIH1cXG4gICAgfSxcXG4gIFxcbiAgICAvKipcXG4gICAgICogTG9nIG91dCBvZiB0aGUgbmV0d29yay5cXG4gICAgICogXFxuICAgICAqIEBtZXRob2QgbG9nb3V0XFxuICAgICAqIEByZXR1cm4gbm90aGluZ1xcbiAgICAgKiAgT24gZmFpbHVyZSwgcmVqZWN0cyB3aXRoIGFuIGVycm9yIGNvZGVcXG4gICAgICoqL1xcbiAgICBcXFwibG9nb3V0XFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjogW10sXFxuICAgICAgXFxcImVyclxcXCI6IHtcXG4gICAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgICAgfVxcbiAgICB9LFxcbiAgXFxuICAgIC8qKlxcbiAgICAgKiBSZWNlaXZlIGFuIGluY29taW5nIG1lc3NhZ2UuXFxuICAgICAqKi9cXG4gICAgXFxcIm9uTWVzc2FnZVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IHtcXG4gICAgICBcXFwiZnJvbVxcXCI6IHsgICAgICAgICAgICAgICAvLyA8Y2xpZW50X3N0YXRlPiwgZGVmaW5lZCBhYm92ZS5cXG4gICAgICAgIFxcXCJ1c2VySWRcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJjbGllbnRJZFxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcInN0YXR1c1xcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcImxhc3RVcGRhdGVkXFxcIjogXFxcIm51bWJlclxcXCIsXFxuICAgICAgICBcXFwibGFzdFNlZW5cXFwiOiBcXFwibnVtYmVyXFxcIlxcbiAgICAgIH0sXFxuICAgICAgXFxcIm1lc3NhZ2VcXFwiOiBcXFwic3RyaW5nXFxcIiAgICAgLy8gbWVzc2FnZSBjb250ZW50c1xcbiAgICB9fSxcXG4gIFxcbiAgICAvKipcXG4gICAgICogUmVjZWl2ZSBhIGNoYW5nZSB0byBhIDx1c2VyX3Byb2ZpbGU+LlxcbiAgICAgKiovXFxuICAgIFxcXCJvblVzZXJQcm9maWxlXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcImV2ZW50XFxcIiwgXFxcInZhbHVlXFxcIjogeyAvLyA8dXNlcl9wcm9maWxlPiwgZGVmaW5lZCBhYm92ZS5cXG4gICAgICBcXFwidXNlcklkXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgXFxcImxhc3RVcGRhdGVkXFxcIjogXFxcIm51bWJlclxcXCIsXFxuICAgICAgXFxcIm5hbWVcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICBcXFwidXJsXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgXFxcImltYWdlRGF0YVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgIH19LFxcbiAgXFxuICAgIC8qKlxcbiAgICAgKiBSZWNlaXZlIGEgY2hhbmdlIHRvIGEgPGNsaWVudF9zdGF0ZT4uXFxuICAgICAqKi9cXG4gICAgXFxcIm9uQ2xpZW50U3RhdGVcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwiZXZlbnRcXFwiLCBcXFwidmFsdWVcXFwiOiB7IC8vIDxjbGllbnRfc3RhdGU+LCBkZWZpbmVkIGFib3ZlLlxcbiAgICAgIFxcXCJ1c2VySWRcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICBcXFwiY2xpZW50SWRcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICBcXFwic3RhdHVzXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgXFxcImxhc3RVcGRhdGVkXFxcIjogXFxcIm51bWJlclxcXCIsXFxuICAgICAgXFxcImxhc3RTZWVuXFxcIjogXFxcIm51bWJlclxcXCJcXG4gICAgfX1cXG4gIH1cXG59XFxuXCI7XG5zZWxmLnN0b3JhZ2UgPSBcIi8qKlxcclxcbiAqIFNUT1JBR0UgQVBJXFxyXFxuICpcXHJcXG4gKiBBUEkgZm9yIFBlcnNpc3RlbnQgU3RvcmFnZVxcclxcbiAqIEV4cG9zZXMgYSBrZXktdmFsdWUgZ2V0L3B1dCBpbnRlcmZhY2VcXHJcXG4gKiovXFxyXFxue1xcclxcbiAgXFxcIm5hbWVcXFwiOiBcXFwic3RvcmFnZVxcXCIsXFxyXFxuICBcXFwiYXBpXFxcIjoge1xcclxcbiAgICAvKiogXFxyXFxuICAgICAqIExpc3Qgb2Ygc2NvcGVzIHRoYXQgY2FuIHByZWZlcnJlZCB3aGVuIGFjY2Vzc2luZyBzdG9yYWdlLlxcclxcbiAgICAqKi9cXHJcXG4gICAgXFxcInNjb3BlXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcImNvbnN0YW50XFxcIiwgXFxcInZhbHVlXFxcIjoge1xcclxcbiAgICAgIC8vIFN0b3JhZ2Ugc2hvdWxkIG9ubHkgbGFzdCB3aGlsZSB0aGUgYXBwIGlzIGFjdGl2ZS5cXHJcXG4gICAgICBcXFwiU0VTU0lPTlxcXCI6IDAsXFxyXFxuICAgICAgLy8gU3RvcmFnZSBzaG91bGQgYmUgbGltaXRlZCB0byBob3N0IHRoZSBhcHAgaXMgYm91bmQgdG8uXFxyXFxuICAgICAgXFxcIkRFVklDRV9MT0NBTFxcXCI6IDEsXFxyXFxuICAgICAgLy8gU3RvcmFnZSBzaG91bGQgYmUgc3luY2hyb25pemVkIGJldHdlZW4gdXNlciBkZXZpY2VzLlxcclxcbiAgICAgIFxcXCJVU0VSX0xPQ0FMXFxcIjogMixcXHJcXG4gICAgICAvLyBTdG9yYWdlIHNob3VsZCBiZSBzeW5jaHJvbml6ZWQgYWNyb3NzIHVzZXJzLlxcclxcbiAgICAgIFxcXCJTSEFSRURcXFwiOiAzXFxyXFxuICAgIH19LFxcclxcbiAgXFxyXFxuICAgIC8qKiBcXHJcXG4gICAgICogZXJyb3IgY29kZXMgYW5kIGRlZmF1bHQgbWVzc2FnZXMgdGhhdCBtYXkgYmUgcmV0dXJuZWQgb24gZmFpbHVyZXMuXFxyXFxuICAgICAqL1xcclxcbiAgICBcXFwiRVJSQ09ERVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJjb25zdGFudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IHtcXHJcXG4gICAgICAvKiogR0VORVJBTCAqKi9cXHJcXG4gICAgICBcXFwiU1VDQ0VTU1xcXCI6IFxcXCJTdWNjZXNzIVxcXCIsXFxyXFxuICAgICAgLy8gVW5rbm93blxcclxcbiAgICAgIFxcXCJVTktOT1dOXFxcIjogXFxcIlVua25vd24gZXJyb3JcXFwiLFxcclxcbiAgICAgIC8vIERhdGFiYXNlIG5vdCByZWFkeVxcclxcbiAgICAgIFxcXCJPRkZMSU5FXFxcIjogXFxcIkRhdGFiYXNlIG5vdCByZWFjaGFibGVcXFwiLFxcclxcbiAgICAgIC8vIEltcHJvcGVyIHBhcmFtZXRlcnNcXHJcXG4gICAgICBcXFwiTUFMRk9STUVEUEFSQU1FVEVSU1xcXCI6IFxcXCJQYXJhbWV0ZXJzIGFyZSBtYWxmb3JtZWRcXFwiXFxyXFxuICAgIH19LFxcclxcbiAgXFxyXFxuICAgIC8qKlxcclxcbiAgICAgKiBDcmVhdGUgYSBzdG9yYWdlIHByb3ZpZGVyLlxcclxcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xcclxcbiAgICAgKiAgICBzY29wZSB7c3RvcmFnZS5zY29wZX0gVGhlIHByZWZlcnJlZCBzdG9yYWdlIHNjb3BlLlxcclxcbiAgICAgKiBAY29uc3RydWN0b3JcXHJcXG4gICAgICovXFxyXFxuICAgIFxcXCJjb25zdHJ1Y3RvclxcXCI6IHsgXFxcInZhbHVlXFxcIjogW3tcXHJcXG4gICAgICBcXFwic2NvcGVcXFwiOiBcXFwibnVtYmVyXFxcIlxcclxcbiAgICB9XX0sXFxyXFxuICBcXHJcXG4gICAgLyoqXFxyXFxuICAgICAqIEZldGNoIGFuIGFycmF5IG9mIGFsbCBrZXlzXFxyXFxuICAgICAqIGUuZy4gc3RvcmFnZS5rZXlzKCkgPT4gW3N0cmluZ11cXHJcXG4gICAgICpcXHJcXG4gICAgICogQG1ldGhvZCBrZXlzXFxyXFxuICAgICAqIEByZXR1cm4gYW4gYXJyYXkgd2l0aCBhbGwga2V5cyBpbiB0aGUgc3RvcmUgXFxyXFxuICAgICAqKi9cXHJcXG4gICAgXFxcImtleXNcXFwiOiB7XFxyXFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIixcXHJcXG4gICAgICBcXFwidmFsdWVcXFwiOiBbXSxcXHJcXG4gICAgICBcXFwicmV0XFxcIjogW1xcXCJhcnJheVxcXCIsIFxcXCJzdHJpbmdcXFwiXSxcXHJcXG4gICAgICBcXFwiZXJyXFxcIjoge1xcclxcbiAgICAgICAgXFxcImVycmNvZGVcXFwiOiBcXFwic3RyaW5nXFxcIixcXHJcXG4gICAgICAgIFxcXCJtZXNzYWdlXFxcIjogXFxcInN0cmluZ1xcXCJcXHJcXG4gICAgICB9XFxyXFxuICAgIH0sXFxyXFxuICBcXHJcXG4gICAgLyoqXFxyXFxuICAgICAqIEZldGNoIGEgdmFsdWUgZm9yIGEga2V5XFxyXFxuICAgICAqIGUuZy4gc3RvcmFnZS5nZXQoU3RyaW5nIGtleSkgPT4gc3RyaW5nXFxyXFxuICAgICAqXFxyXFxuICAgICAqIEBtZXRob2QgZ2V0XFxyXFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgLSBrZXkgdG8gZmV0Y2hcXHJcXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBSZXR1cm5zIGEgc3RyaW5nIHdpdGggdGhlIHZhbHVlLCBudWxsIGlmIGRvZXNuJ3QgZXhpc3RcXHJcXG4gICAgICoqL1xcclxcbiAgICBcXFwiZ2V0XFxcIjoge1xcclxcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxyXFxuICAgICAgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiXSxcXHJcXG4gICAgICBcXFwicmV0XFxcIjogXFxcInN0cmluZ1xcXCIsXFxyXFxuICAgICAgXFxcImVyclxcXCI6IHtcXHJcXG4gICAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxyXFxuICAgICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxyXFxuICAgICAgfVxcclxcbiAgICB9LFxcclxcbiAgXFxyXFxuICAgIC8qKlxcclxcbiAgICAgKiBTZXRzIGEgdmFsdWUgdG8gYSBrZXlcXHJcXG4gICAgICogZS5nLiBzdG9yYWdlLnNldChTdHJpbmcga2V5LCBTdHJpbmcgdmFsdWUpXFxyXFxuICAgICAqXFxyXFxuICAgICAqIEBtZXRob2Qgc2V0XFxyXFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgLSBrZXkgb2YgdmFsdWUgdG8gc2V0XFxyXFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZSAtIHZhbHVlXFxyXFxuICAgICAqIEByZXR1cm4ge1N0cmluZ30gcHJldmlvdXMgdmFsdWUgb2Yga2V5IGlmIHRoZXJlIHdhcyBvbmUuXFxyXFxuICAgICAqKi9cXHJcXG4gICAgXFxcInNldFxcXCI6IHtcXHJcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLFxcclxcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIiwgXFxcInN0cmluZ1xcXCJdLFxcclxcbiAgICAgIFxcXCJyZXRcXFwiOiBcXFwic3RyaW5nXFxcIixcXHJcXG4gICAgICBcXFwiZXJyXFxcIjoge1xcclxcbiAgICAgICAgXFxcImVycmNvZGVcXFwiOiBcXFwic3RyaW5nXFxcIixcXHJcXG4gICAgICAgIFxcXCJtZXNzYWdlXFxcIjogXFxcInN0cmluZ1xcXCJcXHJcXG4gICAgICB9XFxyXFxuICAgIH0sXFxyXFxuICAgIFxcclxcbiAgICAvKipcXHJcXG4gICAgICogUmVtb3ZlcyBhIHNpbmdsZSBrZXlcXHJcXG4gICAgICogZS5nLiBzdG9yYWdlLnJlbW92ZShTdHJpbmcga2V5KVxcclxcbiAgICAgKlxcclxcbiAgICAgKiBAbWV0aG9kIHJlbW92ZVxcclxcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30ga2V5IC0ga2V5IHRvIHJlbW92ZVxcclxcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IHByZXZpb3VzIHZhbHVlIG9mIGtleSBpZiB0aGVyZSB3YXMgb25lLlxcclxcbiAgICAgKiovXFxyXFxuICAgIFxcXCJyZW1vdmVcXFwiOiB7XFxyXFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIixcXHJcXG4gICAgICBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCJdLFxcclxcbiAgICAgIFxcXCJyZXRcXFwiOiBcXFwic3RyaW5nXFxcIixcXHJcXG4gICAgICBcXFwiZXJyXFxcIjoge1xcclxcbiAgICAgICAgXFxcImVycmNvZGVcXFwiOiBcXFwic3RyaW5nXFxcIixcXHJcXG4gICAgICAgIFxcXCJtZXNzYWdlXFxcIjogXFxcInN0cmluZ1xcXCJcXHJcXG4gICAgICB9XFxyXFxuICAgIH0sXFxyXFxuICAgIFxcclxcbiAgICAvKipcXHJcXG4gICAgICogUmVtb3ZlcyBhbGwgZGF0YSBmcm9tIHN0b3JhZ2VcXHJcXG4gICAgICogZS5nLiBzdG9yYWdlLmNsZWFyKClcXHJcXG4gICAgICpcXHJcXG4gICAgICogQG1ldGhvZCBjbGVhclxcclxcbiAgICAgKiBAcmV0dXJuIG5vdGhpbmdcXHJcXG4gICAgICoqL1xcclxcbiAgICBcXFwiY2xlYXJcXFwiOiB7XFxyXFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIixcXHJcXG4gICAgICBcXFwidmFsdWVcXFwiOiBbXSxcXHJcXG4gICAgICBcXFwicmV0XFxcIjogW10sXFxyXFxuICAgICAgXFxcImVyclxcXCI6IHtcXHJcXG4gICAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxyXFxuICAgICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxyXFxuICAgICAgfVxcclxcbiAgICB9XFxyXFxuICB9XFxyXFxufVxcclxcblwiO1xuc2VsZi5zdG9yZWJ1ZmZlciA9IFwiXFxyXFxuLyoqXFxyXFxuICogU1RPUkFHRSBBUElcXHJcXG4gKlxcclxcbiAqIEFQSSBmb3IgUGVyc2lzdGVudCBTdG9yYWdlXFxyXFxuICogRXhwb3NlcyBhIGtleS12YWx1ZSBnZXQvcHV0IGludGVyZmFjZVxcclxcbiAqKi9cXHJcXG57XFxyXFxuICBcXFwibmFtZVxcXCI6IFxcXCJzdG9yZWJ1ZmZlclxcXCIsXFxyXFxuICBcXFwiYXBpXFxcIjoge1xcclxcbiAgICAvKiogXFxyXFxuICAgICAqIExpc3Qgb2Ygc2NvcGVzIHRoYXQgY2FuIHByZWZlcnJlZCB3aGVuIGFjY2Vzc2luZyBzdG9yYWdlLlxcclxcbiAgICAqKi9cXHJcXG4gICAgXFxcInNjb3BlXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcImNvbnN0YW50XFxcIiwgXFxcInZhbHVlXFxcIjoge1xcclxcbiAgICAgIC8vIFN0b3JhZ2Ugc2hvdWxkIG9ubHkgbGFzdCB3aGlsZSB0aGUgYXBwIGlzIGFjdGl2ZS5cXHJcXG4gICAgICBcXFwiU0VTU0lPTlxcXCI6IDAsXFxyXFxuICAgICAgLy8gU3RvcmFnZSBzaG91bGQgYmUgbGltaXRlZCB0byBob3N0IHRoZSBhcHAgaXMgYm91bmQgdG8uXFxyXFxuICAgICAgXFxcIkRFVklDRV9MT0NBTFxcXCI6IDEsXFxyXFxuICAgICAgLy8gU3RvcmFnZSBzaG91bGQgYmUgc3luY2hyb25pemVkIGJldHdlZW4gdXNlciBkZXZpY2VzLlxcclxcbiAgICAgIFxcXCJVU0VSX0xPQ0FMXFxcIjogMixcXHJcXG4gICAgICAvLyBTdG9yYWdlIHNob3VsZCBiZSBzeW5jaHJvbml6ZWQgYWNyb3NzIHVzZXJzLlxcclxcbiAgICAgIFxcXCJTSEFSRURcXFwiOiAzXFxyXFxuICAgIH19LFxcclxcbiAgXFxyXFxuICAgIC8qKiBcXHJcXG4gICAgICogZXJyb3IgY29kZXMgYW5kIGRlZmF1bHQgbWVzc2FnZXMgdGhhdCBtYXkgYmUgcmV0dXJuZWQgb24gZmFpbHVyZXMuXFxyXFxuICAgICAqL1xcclxcbiAgICBcXFwiRVJSQ09ERVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJjb25zdGFudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IHtcXHJcXG4gICAgICAvKiogR0VORVJBTCAqKi9cXHJcXG4gICAgICBcXFwiU1VDQ0VTU1xcXCI6IFxcXCJTdWNjZXNzIVxcXCIsXFxyXFxuICAgICAgLy8gVW5rbm93blxcclxcbiAgICAgIFxcXCJVTktOT1dOXFxcIjogXFxcIlVua25vd24gZXJyb3JcXFwiLFxcclxcbiAgICAgIC8vIERhdGFiYXNlIG5vdCByZWFkeVxcclxcbiAgICAgIFxcXCJPRkZMSU5FXFxcIjogXFxcIkRhdGFiYXNlIG5vdCByZWFjaGFibGVcXFwiLFxcclxcbiAgICAgIC8vIEltcHJvcGVyIHBhcmFtZXRlcnNcXHJcXG4gICAgICBcXFwiTUFMRk9STUVEUEFSQU1FVEVSU1xcXCI6IFxcXCJQYXJhbWV0ZXJzIGFyZSBtYWxmb3JtZWRcXFwiXFxyXFxuICAgIH19LFxcclxcbiAgXFxyXFxuICAgIC8qKlxcclxcbiAgICAgKiBDcmVhdGUgYSBzdG9yYWdlIHByb3ZpZGVyLlxcclxcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xcclxcbiAgICAgKiAgICBzY29wZSB7c3RvcmFnZS5zY29wZX0gVGhlIHByZWZlcnJlZCBzdG9yYWdlIHNjb3BlLlxcclxcbiAgICAgKiBAY29uc3RydWN0b3JcXHJcXG4gICAgICovXFxyXFxuICAgIFxcXCJjb25zdHJ1Y3RvclxcXCI6IHsgXFxcInZhbHVlXFxcIjogW3tcXHJcXG4gICAgICBcXFwic2NvcGVcXFwiOiBcXFwibnVtYmVyXFxcIlxcclxcbiAgICB9XX0sXFxyXFxuICBcXHJcXG4gICAgLyoqXFxyXFxuICAgICAqIEZldGNoIGFuIGFycmF5IG9mIGFsbCBrZXlzXFxyXFxuICAgICAqIGUuZy4gc3RvcmFnZS5rZXlzKCkgPT4gW3N0cmluZ11cXHJcXG4gICAgICpcXHJcXG4gICAgICogQG1ldGhvZCBrZXlzXFxyXFxuICAgICAqIEByZXR1cm4gYW4gYXJyYXkgd2l0aCBhbGwga2V5cyBpbiB0aGUgc3RvcmUgXFxyXFxuICAgICAqKi9cXHJcXG4gICAgXFxcImtleXNcXFwiOiB7XFxyXFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIixcXHJcXG4gICAgICBcXFwidmFsdWVcXFwiOiBbXSxcXHJcXG4gICAgICBcXFwicmV0XFxcIjogW1xcXCJhcnJheVxcXCIsIFxcXCJzdHJpbmdcXFwiXSxcXHJcXG4gICAgICBcXFwiZXJyXFxcIjoge1xcclxcbiAgICAgICAgXFxcImVycmNvZGVcXFwiOiBcXFwic3RyaW5nXFxcIixcXHJcXG4gICAgICAgIFxcXCJtZXNzYWdlXFxcIjogXFxcInN0cmluZ1xcXCJcXHJcXG4gICAgICB9XFxyXFxuICAgIH0sXFxyXFxuICBcXHJcXG4gICAgLyoqXFxyXFxuICAgICAqIEZldGNoIGEgdmFsdWUgZm9yIGEga2V5XFxyXFxuICAgICAqIGUuZy4gc3RvcmFnZS5nZXQoU3RyaW5nIGtleSkgPT4gc3RyaW5nXFxyXFxuICAgICAqXFxyXFxuICAgICAqIEBtZXRob2QgZ2V0XFxyXFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgLSBrZXkgdG8gZmV0Y2hcXHJcXG4gICAgICogQHJldHVybiB7QXJyYXlCdWZmZXJ9IFJldHVybnMgdmFsdWUsIG51bGwgaWYgZG9lc24ndCBleGlzdFxcclxcbiAgICAgKiovXFxyXFxuICAgIFxcXCJnZXRcXFwiOiB7XFxyXFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIixcXHJcXG4gICAgICBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCJdLFxcclxcbiAgICAgIFxcXCJyZXRcXFwiOiBcXFwiYnVmZmVyXFxcIixcXHJcXG4gICAgICBcXFwiZXJyXFxcIjoge1xcclxcbiAgICAgICAgXFxcImVycmNvZGVcXFwiOiBcXFwic3RyaW5nXFxcIixcXHJcXG4gICAgICAgIFxcXCJtZXNzYWdlXFxcIjogXFxcInN0cmluZ1xcXCJcXHJcXG4gICAgICB9XFxyXFxuICAgIH0sXFxyXFxuICBcXHJcXG4gICAgLyoqXFxyXFxuICAgICAqIFNldHMgYSB2YWx1ZSB0byBhIGtleVxcclxcbiAgICAgKiBlLmcuIHN0b3JhZ2Uuc2V0KFN0cmluZyBrZXksIFN0cmluZyB2YWx1ZSlcXHJcXG4gICAgICpcXHJcXG4gICAgICogQG1ldGhvZCBzZXRcXHJcXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGtleSAtIGtleSBvZiB2YWx1ZSB0byBzZXRcXHJcXG4gICAgICogQHBhcmFtIHtBcnJheUJ1ZmZlcn0gdmFsdWUgLSB2YWx1ZVxcclxcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IHByZXZpb3VzIHZhbHVlIG9mIGtleSBpZiB0aGVyZSB3YXMgb25lLlxcclxcbiAgICAgKiovXFxyXFxuICAgIFxcXCJzZXRcXFwiOiB7XFxyXFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIixcXHJcXG4gICAgICBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCIsIFxcXCJidWZmZXJcXFwiXSxcXHJcXG4gICAgICBcXFwicmV0XFxcIjogXFxcImJ1ZmZlclxcXCIsXFxyXFxuICAgICAgXFxcImVyclxcXCI6IHtcXHJcXG4gICAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxyXFxuICAgICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxyXFxuICAgICAgfVxcclxcbiAgICB9LFxcclxcbiAgICBcXHJcXG4gICAgLyoqXFxyXFxuICAgICAqIFJlbW92ZXMgYSBzaW5nbGUga2V5XFxyXFxuICAgICAqIGUuZy4gc3RvcmFnZS5yZW1vdmUoU3RyaW5nIGtleSlcXHJcXG4gICAgICpcXHJcXG4gICAgICogQG1ldGhvZCByZW1vdmVcXHJcXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGtleSAtIGtleSB0byByZW1vdmVcXHJcXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBwcmV2aW91cyB2YWx1ZSBvZiBrZXkgaWYgdGhlcmUgd2FzIG9uZS5cXHJcXG4gICAgICoqL1xcclxcbiAgICBcXFwicmVtb3ZlXFxcIjoge1xcclxcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxyXFxuICAgICAgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiXSxcXHJcXG4gICAgICBcXFwicmV0XFxcIjogXFxcImJ1ZmZlclxcXCIsXFxyXFxuICAgICAgXFxcImVyclxcXCI6IHtcXHJcXG4gICAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxyXFxuICAgICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxyXFxuICAgICAgfVxcclxcbiAgICB9LFxcclxcbiAgICBcXHJcXG4gICAgLyoqXFxyXFxuICAgICAqIFJlbW92ZXMgYWxsIGRhdGEgZnJvbSBzdG9yYWdlXFxyXFxuICAgICAqIGUuZy4gc3RvcmFnZS5jbGVhcigpXFxyXFxuICAgICAqXFxyXFxuICAgICAqIEBtZXRob2QgY2xlYXJcXHJcXG4gICAgICogQHJldHVybiBub3RoaW5nXFxyXFxuICAgICAqKi9cXHJcXG4gICAgXFxcImNsZWFyXFxcIjoge1xcclxcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxyXFxuICAgICAgXFxcInZhbHVlXFxcIjogW10sXFxyXFxuICAgICAgXFxcInJldFxcXCI6IFtdLFxcclxcbiAgICAgIFxcXCJlcnJcXFwiOiB7XFxyXFxuICAgICAgICBcXFwiZXJyY29kZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcclxcbiAgICAgICAgXFxcIm1lc3NhZ2VcXFwiOiBcXFwic3RyaW5nXFxcIlxcclxcbiAgICAgIH1cXHJcXG4gICAgfVxcclxcbiAgfVxcclxcbn1cXHJcXG5cIjtcbnNlbGYudHJhbnNwb3J0ID0gXCIvKipcXG4gKiBUUkFOU1BPUlQgQVBJXFxuICpcXG4gKiBBUEkgZm9yIHBlZXItdG8tcGVlciBjb21tdW5pY2F0aW9uXFxuICogVXNlZnVsIGZvciBzZW5kaW5nIGxhcmdlIGJpbmFyeSBkYXRhIGJldHdlZW4gaW5zdGFuY2VzXFxuICoqL1xcbntcXG4gIFxcXCJuYW1lXFxcIjogXFxcInRyYW5zcG9ydFxcXCIsXFxuICBcXFwiYXBpXFxcIjoge1xcbiAgICAvKiogXFxuICAgICAqIGVycm9yIGNvZGVzIGFuZCBkZWZhdWx0IG1lc3NhZ2VzIHRoYXQgbWF5IGJlIHJldHVybmVkIG9uIGZhaWx1cmVzLlxcbiAgICAgKi9cXG4gICAgXFxcIkVSUkNPREVcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwiY29uc3RhbnRcXFwiLCBcXFwidmFsdWVcXFwiOiB7XFxuICAgICAgLyoqIEdFTkVSQUwgKiovXFxuICAgICAgXFxcIlNVQ0NFU1NcXFwiOiBcXFwiU3VjY2VzcyFcXFwiLFxcbiAgICAgIC8vIFVua25vd25cXG4gICAgICBcXFwiVU5LTk9XTlxcXCI6IFxcXCJVbmtub3duIGVycm9yXFxcIixcXG4gICAgICAvLyBEYXRhYmFzZSBub3QgcmVhZHlcXG4gICAgICBcXFwiT0ZGTElORVxcXCI6IFxcXCJOb3QgcmVhY2hhYmxlXFxcIixcXG4gICAgICAvLyBJbXByb3BlciBwYXJhbWV0ZXJzXFxuICAgICAgXFxcIk1BTEZPUk1FRFBBUkFNRVRFUlNcXFwiOiBcXFwiUGFyYW1ldGVycyBhcmUgbWFsZm9ybWVkXFxcIlxcbiAgICB9fSxcXG4gIFxcbiAgICAvKipcXG4gICAgICogUHJlcGFyZSBhIFAyUCBjb25uZWN0aW9uIHdpdGggaW5pdGlhbGl6YXRpb24gcGFyYW1ldGVyc1xcbiAgICAgKiBUYWtlcyBpbiBhIHNpZ25hbGxpbmcgcGF0aHdheSAoZnJlZWRvbS5qcyBjaGFubmVsKSwgd2hpY2ggaXMgdXNlZFxcbiAgICAgKiBieSB0aGUgdHJhbnNwb3J0IHByb3ZpZGVyIHRvIHNlbmQvcmVjZWl2ZSBzaWduYWxsaW5nIG1lc3NhZ2VzXFxuICAgICAqIHRvIHRoZSBvdGhlciBzaWRlIG9mIHRoZSBQMlAgY29ubmVjdGlvbiBmb3Igc2V0dXAuXFxuICAgICAqXFxuICAgICAqIEBtZXRob2Qgc2V0dXBcXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSBnaXZlIHRoaXMgY29ubmVjdGlvbiBhIG5hbWUgZm9yIGxvZ2dpbmdcXG4gICAgICogQHBhcmFtIHtQcm94eX0gY2hhbm5lbCAtIHNpZ25hbGxpbmcgY2hhbm5lbFxcbiAgICAgKiBAcmV0dXJuIG5vdGhpbmcuXFxuICAgICAqKi9cXG4gICAgXFxcInNldHVwXFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiLCBcXFwicHJveHlcXFwiXSxcXG4gICAgICBcXFwicmV0XFxcIjogW10sXFxuICAgICAgXFxcImVyclxcXCI6IHtcXG4gICAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgICAgfVxcbiAgICB9LFxcbiAgXFxuICAgIC8qKlxcbiAgICAgKiBTZW5kIGJpbmFyeSBkYXRhIHRvIHRoZSBwZWVyXFxuICAgICAqIEFsbCBkYXRhIGlzIGxhYmVsbGVkIHdpdGggYSBzdHJpbmcgdGFnXFxuICAgICAqIEFueSBkYXRhIHNlbnQgd2l0aCB0aGUgc2FtZSB0YWcgaXMgc2VudCBpbiBvcmRlcixcXG4gICAgICogYnV0IHRoZXJlIGlzIG5vIGd1YXJhbnRlZXMgYmV0d2VlbiB0YWdzXFxuICAgICAqXFxuICAgICAqIEBtZXRob2Qgc2VuZFxcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnXFxuICAgICAqIEBwYXJhbSB7YnVmZmVyfSBkYXRhXFxuICAgICAqIEByZXR1cm4gbm90aGluZ1xcbiAgICAgKiovXFxuICAgIFxcXCJzZW5kXFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiLCBcXFwiYnVmZmVyXFxcIl0sXFxuICAgICAgXFxcInJldFxcXCI6IFtdLFxcbiAgICAgIFxcXCJlcnJcXFwiOiB7XFxuICAgICAgICBcXFwiZXJyY29kZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcIm1lc3NhZ2VcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICAgIH1cXG4gICAgfSxcXG4gIFxcbiAgICAvKipcXG4gICAgICogQ2xvc2UgdGhlIGNvbm5lY3Rpb24uIEFueSBkYXRhIHF1ZXVlZCBmb3Igc2VuZGluZywgb3IgaW4gdGhlXFxuICAgICAqIHByb2Nlc3Mgb2Ygc2VuZGluZywgbWF5IGJlIGRyb3BwZWQuIElmIHRoZSBzdGF0ZSBvZiB0aGUgcHJvbXNlIG9mXFxuICAgICAqIHRoZSBzZW5kIG1ldGhvZCBpcyBcXFwicGVuZGluZ1xcXCIgdGhlbiB0aGUgZGF0YSBmb3IgdGhhdCBzZW5kIGNhbGwgbWF5XFxuICAgICAqIGJlIHNlbmRpbmcgb3IgcXVldWVkLlxcbiAgICAgKiBcXG4gICAgICogQG1ldGhvZCBjbG9zZVxcbiAgICAgKiBAcmV0dXJuIG5vdGhpbmdcXG4gICAgICoqL1xcbiAgICBcXFwiY2xvc2VcXFwiOiB7XFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIixcXG4gICAgICBcXFwidmFsdWVcXFwiOiBbXSxcXG4gICAgICBcXFwicmV0XFxcIjogW10sXFxuICAgICAgXFxcImVyclxcXCI6IHtcXG4gICAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgICAgfVxcbiAgICB9LFxcbiAgXFxuICAgIC8qKlxcbiAgICAgKiBFdmVudCBvbiBpbmNvbWluZyBkYXRhIChBcnJheUJ1ZmZlcilcXG4gICAgICoqL1xcbiAgICBcXFwib25EYXRhXFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcImV2ZW50XFxcIixcXG4gICAgICBcXFwidmFsdWVcXFwiOiB7XFxuICAgICAgICBcXFwidGFnXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwiZGF0YVxcXCI6IFxcXCJidWZmZXJcXFwiXFxuICAgICAgfVxcbiAgICB9LFxcbiAgXFxuICAgIC8qKlxcbiAgICAgKiBFdmVudCBvbiBzdWNjZXNzZnVsIGNsb3Npbmcgb2YgdGhlIGNvbm5lY3Rpb25cXG4gICAgICoqL1xcbiAgICBcXFwib25DbG9zZVxcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjogW11cXG4gICAgfVxcbiAgfVxcbn1cXG5cIjtcbnJldHVybiBzZWxmfSkoKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIHBhc3MuXG4gIH1cbiAgLypqc2xpbnQgbm9tZW46IGZhbHNlICovXG4gIHV0aWwuZWFjaFByb3AoZm91bmQsIGZ1bmN0aW9uIChqc29uKSB7XG4gICAgdGhpcy5pbnRlcmZhY2VzLnB1c2goSlNPTi5wYXJzZShtaW5pZnkoanNvbikpKTtcbiAgfS5iaW5kKHRoaXMpKTtcbn07XG5cblxuLyoqXG4gKiBQb3B1bGF0ZSBhbiBBUEkgcmVnaXN0cnkgd2l0aCBwcm92aWRlZCBwcm92aWRlcnMsIGFuZCB3aXRoIGtub3duIEFQSVxuICogZGVmaW5pdGlvbnMuXG4gKiBAc3RhdGljXG4gKiBAbWV0aG9kIHJlZ2lzdGVyXG4gKiBAcGFyYW0ge3tuYW1lOiBzdHJpbmcsIHByb3ZpZGVyOiBGdW5jdGlvbiwgc3R5bGU/OiBzdHJpbmd9W119IHByb3ZpZGVyc1xuICogICBUaGUgY29yZSBwcm92aWRlcnMgbWFkZSBhdmFpbGFibGUgdG8gdGhpcyBmcmVlZG9tLmpzIGluc3RhbmNlLlxuICogQHBhcmFtIHtBcGl9IHJlZ2lzdHJ5IFRoZSBBUEkgcmVnaXN0cnkgdG8gcG9wdWxhdGUuXG4gKi9cbmV4cG9ydHMucmVnaXN0ZXIgPSBmdW5jdGlvbiAocHJvdmlkZXJzLCByZWdpc3RyeSkge1xuICAndXNlIHN0cmljdCc7XG4gIHZhciBidW5kbGUgPSBuZXcgQnVuZGxlKCk7XG4gIGJ1bmRsZS5pbnRlcmZhY2VzLmZvckVhY2goZnVuY3Rpb24gKGFwaSkge1xuICAgIGlmIChhcGkgJiYgYXBpLm5hbWUgJiYgYXBpLmFwaSkge1xuICAgICAgcmVnaXN0cnkuc2V0KGFwaS5uYW1lLCBhcGkuYXBpKTtcbiAgICB9XG4gIH0pO1xuXG4gIHByb3ZpZGVycy5mb3JFYWNoKGZ1bmN0aW9uIChwcm92aWRlcikge1xuICAgIGlmIChwcm92aWRlci5uYW1lKSB7XG4gICAgICByZWdpc3RyeS5yZWdpc3Rlcihwcm92aWRlci5uYW1lLCBwcm92aWRlci5wcm92aWRlciwgcHJvdmlkZXIuc3R5bGUpO1xuICAgIH1cbiAgfSk7XG59O1xuIiwiLypnbG9iYWxzIEJsb2IsIEFycmF5QnVmZmVyLCBEYXRhVmlldyAqL1xuLypqc2xpbnQgaW5kZW50OjIsIG5vZGU6dHJ1ZSwgc2xvcHB5OnRydWUgKi9cbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbi8qKlxuICogQSBmcmVlZG9tIHBvcnQgZm9yIGEgdXNlci1hY2Nlc3NhYmxlIGFwaS5cbiAqIEBjbGFzcyBDb25zdW1lclxuICogQGltcGxlbWVudHMgUG9ydFxuICogQHVzZXMgaGFuZGxlRXZlbnRzXG4gKiBAcGFyYW0ge09iamVjdH0gaW50ZXJmYWNlQ2xzIFRoZSBhcGkgaW50ZXJmYWNlIGV4cG9zZWQgYnkgdGhpcyBjb25zdW1lci5cbiAqIEBwYXJhbSB7RGVidWd9IGRlYnVnIFRoZSBkZWJ1Z2dlciB0byB1c2UgZm9yIGxvZ2dpbmcuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmFyIENvbnN1bWVyID0gZnVuY3Rpb24gKGludGVyZmFjZUNscywgZGVidWcpIHtcbiAgdGhpcy5pZCA9IENvbnN1bWVyLm5leHRJZCgpO1xuICB0aGlzLmludGVyZmFjZUNscyA9IGludGVyZmFjZUNscztcbiAgdGhpcy5kZWJ1ZyA9IGRlYnVnO1xuICB1dGlsLmhhbmRsZUV2ZW50cyh0aGlzKTtcbiAgXG4gIHRoaXMuaWZhY2VzID0ge307XG4gIHRoaXMuY2xvc2VIYW5kbGVycyA9IHt9O1xuICB0aGlzLmVycm9ySGFuZGxlcnMgPSB7fTtcbiAgdGhpcy5lbWl0cyA9IHt9O1xufTtcblxuLyoqXG4gKiBSZWNlaXZlIGluY29taW5nIG1lc3NhZ2VzIGZvciB0aGlzIGNvbnN1bWVyLlxuICogQG1ldGhvZCBvbk1lc3NhZ2VcbiAqIEBwYXJhbSB7U3RyaW5nfSBzb3VyY2UgVGhlIHNvdXJjZSBvZiB0aGUgbWVzc2FnZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBtZXNzYWdlIFRoZSByZWNlaXZlZCBtZXNzYWdlLlxuICovXG5Db25zdW1lci5wcm90b3R5cGUub25NZXNzYWdlID0gZnVuY3Rpb24gKHNvdXJjZSwgbWVzc2FnZSkge1xuICBpZiAoc291cmNlID09PSAnY29udHJvbCcgJiYgbWVzc2FnZS5yZXZlcnNlKSB7XG4gICAgdGhpcy5lbWl0Q2hhbm5lbCA9IG1lc3NhZ2UuY2hhbm5lbDtcbiAgICB0aGlzLmVtaXQodGhpcy5lbWl0Q2hhbm5lbCwge1xuICAgICAgdHlwZTogJ2NoYW5uZWwgYW5ub3VuY2VtZW50JyxcbiAgICAgIGNoYW5uZWw6IG1lc3NhZ2UucmV2ZXJzZVxuICAgIH0pO1xuICAgIHRoaXMuZW1pdCgnc3RhcnQnKTtcbiAgfSBlbHNlIGlmIChzb3VyY2UgPT09ICdjb250cm9sJyAmJiBtZXNzYWdlLnR5cGUgPT09ICdzZXR1cCcpIHtcbiAgICB0aGlzLmNvbnRyb2xDaGFubmVsID0gbWVzc2FnZS5jaGFubmVsO1xuICB9IGVsc2UgaWYgKHNvdXJjZSA9PT0gJ2NvbnRyb2wnICYmIG1lc3NhZ2UudHlwZSA9PT0gJ2Nsb3NlJykge1xuICAgIGRlbGV0ZSB0aGlzLmNvbnRyb2xDaGFubmVsO1xuICAgIHRoaXMuZG9DbG9zZSgpO1xuICB9IGVsc2Uge1xuICAgIGlmICghdGhpcy5lbWl0Q2hhbm5lbCAmJiBtZXNzYWdlLmNoYW5uZWwpIHtcbiAgICAgIHRoaXMuZW1pdENoYW5uZWwgPSBtZXNzYWdlLmNoYW5uZWw7XG4gICAgICB0aGlzLmVtaXQoJ3N0YXJ0Jyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChtZXNzYWdlLnR5cGUgPT09ICdjbG9zZScgJiYgbWVzc2FnZS50bykge1xuICAgICAgdGhpcy50ZWFyZG93bihtZXNzYWdlLnRvKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gJ2Vycm9yJykge1xuICAgICAgdGhpcy5lcnJvcihtZXNzYWdlLnRvLCBtZXNzYWdlLm1lc3NhZ2UpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobWVzc2FnZS50bykge1xuICAgICAgaWYgKHRoaXMuZW1pdHNbbWVzc2FnZS50b10pIHtcbiAgICAgICAgdGhpcy5lbWl0c1ttZXNzYWdlLnRvXSgnbWVzc2FnZScsIG1lc3NhZ2UubWVzc2FnZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmRlYnVnLndhcm4oJ0NvdWxkIG5vdCBkZWxpdmVyIG1lc3NhZ2UsIG5vIHN1Y2ggaW50ZXJmYWNlOiAnICsgbWVzc2FnZS50byk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBtc2cgPSBtZXNzYWdlLm1lc3NhZ2U7XG4gICAgICB1dGlsLmVhY2hQcm9wKHRoaXMuZW1pdHMsIGZ1bmN0aW9uIChpZmFjZSkge1xuICAgICAgICBpZmFjZSgnbWVzc2FnZScsIG1lc3NhZ2UubWVzc2FnZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlIGEgY29uc3VtZXIuSW50ZXJmYWNlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGNvbnN1bWVyLlxuICogQW4gaW50ZXJmYWNlIGlzIHJldHVybmVkLCB3aGljaCBpcyBzdXBwbGllZCB3aXRoIGltcG9ydGFudCBjb250cm9sIG9mIHRoZVxuICogYXBpIHZpYSBjb25zdHJ1Y3RvciBhcmd1bWVudHM6IChib3VuZCBiZWxvdyBpbiBnZXRJbnRlcmZhY2VDb25zdHJ1Y3RvcilcbiAqIFxuICogb25Nc2c6IGZ1bmN0aW9uKGJpbmRlcikgc2V0cyB0aGUgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIG1lc3NhZ2VzIGZvciB0aGlzXG4gKiAgICBpbnRlcmZhY2UgYXJyaXZlIG9uIHRoZSBjaGFubmVsLFxuICogZW1pdDogZnVuY3Rpb24obXNnKSBhbGxvd3MgdGhpcyBpbnRlcmZhY2UgdG8gZW1pdCBtZXNzYWdlcyxcbiAqIGlkOiBzdHJpbmcgaXMgdGhlIElkZW50aWZpZXIgZm9yIHRoaXMgaW50ZXJmYWNlLlxuICogQG1ldGhvZCBnZXRJbnRlcmZhY2VcbiAqL1xuQ29uc3VtZXIucHJvdG90eXBlLmdldEludGVyZmFjZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIElmYWNlID0gdGhpcy5nZXRJbnRlcmZhY2VDb25zdHJ1Y3RvcigpLFxuICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICBpZiAoYXJncy5sZW5ndGgpIHtcbiAgICBJZmFjZSA9IElmYWNlLmJpbmQuYXBwbHkoSWZhY2UsIFtJZmFjZV0uY29uY2F0KGFyZ3MpKTtcbiAgfVxuICByZXR1cm4gbmV3IElmYWNlKCk7XG59O1xuXG4vKipcbiAqIEF0dGFjaCBhbiAnb25FdmVudCcgbGlzdGVuZXIgdG8gYW4gaW50ZXJmYWNlLCBhbGxvd2luZyBleHRlcm5hbCBjb25zdW1lcnNcbiAqIHRvIGVpdGhlciBsaXN0ZW4gdG8gY2hhbm5lbCBzdGF0ZSwgb3IgcmVnaXN0ZXIgY2FsbGJhY2tzIG9uIGxpZmV0aW1lIGV2ZW50c1xuICogb2YgaW5kaXZpZHVhbCBpbnN0YW5jZXMgb2YgdGhlIGludGVyZmFjZS5cbiAqIEBtZXRob2QgZ2V0TGlzdGVuZXJcbiAqIEBwYXJtYSB7U3RyaW5nfSBuYW1lIFRoZSBldmVudCB0byBsaXN0ZW4gdG8uXG4gKiBAcHJpdmF0ZVxuICovXG5Db25zdW1lci5wcm90b3R5cGUuZ2V0TGlzdGVuZXIgPSBmdW5jdGlvbiAobmFtZSkge1xuICByZXR1cm4gZnVuY3Rpb24gKGluc3RhbmNlLCBoYW5kbGVyKSB7XG4gICAgLy8gTGlzdGVuIHRvIHRoZSBjaGFubmVsIGRpcmVjdGx5LlxuICAgIGlmICh0eXBlb2YgaW5zdGFuY2UgPT09ICdmdW5jdGlvbicgJiYgaGFuZGxlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm9uY2UobmFtZSwgaW5zdGFuY2UpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIExpc3RlbiB0byBhIHNwZWNpZmljIGluc3RhbmNlLlxuICAgIHZhciBoYW5kbGVycyA9IG5hbWUgKyAnSGFuZGxlcnMnO1xuICAgIHV0aWwuZWFjaFByb3AodGhpcy5pZmFjZXMsIGZ1bmN0aW9uIChjYW5kaWRhdGUsIGlkKSB7XG4gICAgICBpZiAoY2FuZGlkYXRlID09PSBpbnN0YW5jZSkge1xuICAgICAgICBpZiAodGhpc1toYW5kbGVyc11baWRdKSB7XG4gICAgICAgICAgdGhpc1toYW5kbGVyc11baWRdLnB1c2goaGFuZGxlcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpc1toYW5kbGVyc11baWRdID0gW2hhbmRsZXJdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG4gIH0uYmluZCh0aGlzKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlIGEgZnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB0byBnZXQgaW50ZXJmYWNlcyBmcm9tIHRoaXMgYXBpIGNvbnN1bWVyXG4gKiBmcm9tIGEgdXNlci12aXNpYmxlIHBvaW50LlxuICogQG1ldGhvZCBnZXRQcm94eUludGVyZmFjZVxuICovXG5Db25zdW1lci5wcm90b3R5cGUuZ2V0UHJveHlJbnRlcmZhY2UgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBmdW5jID0gZnVuY3Rpb24gKHApIHtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgaWYgKGFyZ3MubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIHAuZ2V0SW50ZXJmYWNlLmFwcGx5KHAsIGFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcC5nZXRJbnRlcmZhY2UoKTtcbiAgICB9XG4gIH0uYmluZCh7fSwgdGhpcyk7XG5cbiAgZnVuYy5jbG9zZSA9IGZ1bmN0aW9uIChpZmFjZSkge1xuICAgIGlmIChpZmFjZSkge1xuICAgICAgdXRpbC5lYWNoUHJvcCh0aGlzLmlmYWNlcywgZnVuY3Rpb24gKGNhbmRpZGF0ZSwgaWQpIHtcbiAgICAgICAgaWYgKGNhbmRpZGF0ZSA9PT0gaWZhY2UpIHtcbiAgICAgICAgICB0aGlzLnRlYXJkb3duKGlkKTtcbiAgICAgICAgICB0aGlzLmVtaXQodGhpcy5lbWl0Q2hhbm5lbCwge1xuICAgICAgICAgICAgdHlwZTogJ2Nsb3NlJyxcbiAgICAgICAgICAgIHRvOiBpZFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBDbG9zZSB0aGUgY2hhbm5lbC5cbiAgICAgIHRoaXMuZG9DbG9zZSgpO1xuICAgIH1cbiAgfS5iaW5kKHRoaXMpO1xuXG4gIGZ1bmMub25DbG9zZSA9IHRoaXMuZ2V0TGlzdGVuZXIoJ2Nsb3NlJyk7XG4gIGZ1bmMub25FcnJvciA9IHRoaXMuZ2V0TGlzdGVuZXIoJ2Vycm9yJyk7XG5cbiAgcmV0dXJuIGZ1bmM7XG59O1xuXG4vKipcbiAqIFByb3ZpZGVzIGEgYm91bmQgY2xhc3MgZm9yIGNyZWF0aW5nIGEgY29uc3VtZXIuSW50ZXJmYWNlIGFzc29jaWF0ZWRcbiAqIHdpdGggdGhpcyBhcGkuIFRoaXMgcGFydGlhbCBsZXZlbCBvZiBjb25zdHJ1Y3Rpb24gY2FuIGJlIHVzZWRcbiAqIHRvIGFsbG93IHRoZSBjb25zdW1lciB0byBiZSB1c2VkIGFzIGEgcHJvdmlkZXIgZm9yIGFub3RoZXIgQVBJLlxuICogQG1ldGhvZCBnZXRJbnRlcmZhY2VDb25zdHJ1Y3RvclxuICogQHByaXZhdGVcbiAqL1xuQ29uc3VtZXIucHJvdG90eXBlLmdldEludGVyZmFjZUNvbnN0cnVjdG9yID0gZnVuY3Rpb24gKCkge1xuICB2YXIgaWQgPSBDb25zdW1lci5uZXh0SWQoKTtcbiAgcmV0dXJuIHRoaXMuaW50ZXJmYWNlQ2xzLmJpbmQoXG4gICAge30sXG4gICAgZnVuY3Rpb24gKGlkLCBvYmosIGJpbmRlcikge1xuICAgICAgdGhpcy5pZmFjZXNbaWRdID0gb2JqO1xuICAgICAgdGhpcy5lbWl0c1tpZF0gPSBiaW5kZXI7XG4gICAgfS5iaW5kKHRoaXMsIGlkKSxcbiAgICB0aGlzLmRvRW1pdC5iaW5kKHRoaXMsIGlkKSxcbiAgICB0aGlzLmRlYnVnXG4gICk7XG59O1xuXG4vKipcbiAqIEVtaXQgYSBtZXNzYWdlIG9uIHRoZSBjaGFubmVsIG9uY2Ugc2V0dXAgaXMgY29tcGxldGUuXG4gKiBAbWV0aG9kIGRvRW1pdFxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7U3RyaW5nfSB0byBUaGUgSUQgb2YgdGhlIGZsb3cgc2VuZGluZyB0aGUgbWVzc2FnZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBtc2cgVGhlIG1lc3NhZ2UgdG8gZW1pdFxuICogQHBhcmFtIHtCb29sZWFufSBhbGwgU2VuZCBtZXNzYWdlIHRvIGFsbCByZWNpcGllbnRzLlxuICovXG5Db25zdW1lci5wcm90b3R5cGUuZG9FbWl0ID0gZnVuY3Rpb24gKHRvLCBtc2csIGFsbCkge1xuICBpZiAoYWxsKSB7XG4gICAgdG8gPSBmYWxzZTtcbiAgfVxuICBpZiAodGhpcy5lbWl0Q2hhbm5lbCkge1xuICAgIHRoaXMuZW1pdCh0aGlzLmVtaXRDaGFubmVsLCB7dG86IHRvLCB0eXBlOiAnbWVzc2FnZScsIG1lc3NhZ2U6IG1zZ30pO1xuICB9IGVsc2Uge1xuICAgIHRoaXMub25jZSgnc3RhcnQnLCB0aGlzLmRvRW1pdC5iaW5kKHRoaXMsIHRvLCBtc2cpKTtcbiAgfVxufTtcblxuLyoqXG4gKiBUZWFyZG93biBhIHNpbmdsZSBpbnRlcmZhY2Ugb2YgdGhpcyBhcGkuXG4gKiBAbWV0aG9kIHRlYXJkb3duXG4gKiBAcGFyYW0ge1N0cmluZ30gaWQgVGhlIGlkIG9mIHRoZSBpbnRlcmZhY2UgdG8gdGVhciBkb3duLlxuICovXG5Db25zdW1lci5wcm90b3R5cGUudGVhcmRvd24gPSBmdW5jdGlvbiAoaWQpIHtcbiAgZGVsZXRlIHRoaXMuZW1pdHNbaWRdO1xuICBpZiAodGhpcy5jbG9zZUhhbmRsZXJzW2lkXSkge1xuICAgIHV0aWwuZWFjaFByb3AodGhpcy5jbG9zZUhhbmRsZXJzW2lkXSwgZnVuY3Rpb24gKHByb3ApIHtcbiAgICAgIHByb3AoKTtcbiAgICB9KTtcbiAgfVxuICBkZWxldGUgdGhpcy5pZmFjZXNbaWRdO1xuICBkZWxldGUgdGhpcy5jbG9zZUhhbmRsZXJzW2lkXTtcbiAgZGVsZXRlIHRoaXMuZXJyb3JIYW5kbGVyc1tpZF07XG59O1xuXG4vKipcbiAqIEhhbmRsZSBhIG1lc3NhZ2UgZXJyb3IgcmVwb3J0ZWQgdG8gdGhpcyBhcGkuXG4gKiBAbWV0aG9kIGVycm9yXG4gKiBAcGFyYW0ge1N0cmluZz99IGlkIFRoZSBpZCBvZiB0aGUgaW50ZXJmYWNlIHdoZXJlIHRoZSBlcnJvciBvY2N1cmVkLlxuICogQHBhcmFtIHtPYmplY3R9IG1lc3NhZ2UgVGhlIG1lc3NhZ2Ugd2hpY2ggZmFpbGVkLCBpZiByZWxldmFudC5cbiAqL1xuQ29uc3VtZXIucHJvdG90eXBlLmVycm9yID0gZnVuY3Rpb24gKGlkLCBtZXNzYWdlKSB7XG4gIGlmIChpZCAmJiB0aGlzLmVycm9ySGFuZGxlcnNbaWRdKSB7XG4gICAgdXRpbC5lYWNoUHJvcCh0aGlzLmVycm9ySGFuZGxlcnNbaWRdLCBmdW5jdGlvbiAocHJvcCkge1xuICAgICAgcHJvcChtZXNzYWdlKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICghaWQpIHtcbiAgICB0aGlzLmVtaXQoJ2Vycm9yJywgbWVzc2FnZSk7XG4gIH1cbn07XG5cblxuLyoqXG4gKiBDbG9zZSAvIHRlYXJkb3duIHRoZSBmbG93IHRoaXMgYXBpIHRlcm1pbmF0ZXMuXG4gKiBAbWV0aG9kIGRvQ2xvc2VcbiAqL1xuQ29uc3VtZXIucHJvdG90eXBlLmRvQ2xvc2UgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLmNvbnRyb2xDaGFubmVsKSB7XG4gICAgdGhpcy5lbWl0KHRoaXMuY29udHJvbENoYW5uZWwsIHtcbiAgICAgIHR5cGU6ICdDaGFubmVsIENsb3NpbmcnLFxuICAgICAgcmVxdWVzdDogJ2Nsb3NlJ1xuICAgIH0pO1xuICB9XG5cbiAgdXRpbC5lYWNoUHJvcCh0aGlzLmVtaXRzLCBmdW5jdGlvbiAoZW1pdCwgaWQpIHtcbiAgICB0aGlzLnRlYXJkb3duKGlkKTtcbiAgfS5iaW5kKHRoaXMpKTtcblxuICB0aGlzLmVtaXQoJ2Nsb3NlJyk7XG4gIHRoaXMub2ZmKCk7XG5cbiAgdGhpcy5lbWl0Q2hhbm5lbCA9IG51bGw7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgdGV4dHVhbCBkZXNjcmlwdGlvbiBvZiB0aGlzIHBvcnQuXG4gKiBAbWV0aG9kIHRvU3RyaW5nXG4gKiBAcmV0dXJuIFRoZSBkZXNjcmlwdGlvbiBvZiB0aGlzIHBvcnQuXG4gKi9cbkNvbnN1bWVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuZW1pdENoYW5uZWwpIHtcbiAgICByZXR1cm4gXCJbQ29uc3VtZXIgXCIgKyB0aGlzLmVtaXRDaGFubmVsICsgXCJdXCI7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIFwiW3VuYm91bmQgQ29uc3VtZXJdXCI7XG4gIH1cbn07XG5cbi8qKlxuICogR2V0IHRoZSBuZXh0IElEIGZvciBhbiBhcGkgY2hhbm5lbC5cbiAqIEBtZXRob2QgbmV4dElkXG4gKiBAc3RhdGljXG4gKiBAcHJpdmF0ZVxuICovXG5Db25zdW1lci5uZXh0SWQgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICghQ29uc3VtZXIuaWQpIHtcbiAgICBDb25zdW1lci5pZCA9IDE7XG4gIH1cbiAgcmV0dXJuIChDb25zdW1lci5pZCArPSAxKTtcbn07XG5cbi8qKlxuICogQ29udmVydCBhIHN0cnVjdHVyZWQgZGF0YSBzdHJ1Y3R1cmUgaW50byBhIG1lc3NhZ2Ugc3RyZWFtIGNvbmZvcm1pbmcgdG9cbiAqIGEgdGVtcGxhdGUgYW5kIGFuIGFycmF5IG9mIGJpbmFyeSBkYXRhIGVsZW1lbnRzLlxuICogQHN0YXRpY1xuICogQG1ldGhvZCBtZXNzYWdlVG9Qb3J0YWJsZVxuICogQHBhcmFtIHtPYmplY3R9IHRlbXBsYXRlIFRoZSB0ZW1wbGF0ZSB0byBjb25mb3JtIHRvXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsdWUgVGhlIGluc3RhbmNlIG9mIHRoZSBkYXRhIHN0cnVjdHVyZSB0byBjb25mcm9tXG4gKiBAcGFyYW0ge0RlYnVnfSBkZWJ1ZyBBIGRlYnVnZ2VyIGZvciBlcnJvcnMuXG4gKiBAcmV0dXJuIHt7dGV4dDogT2JqZWN0LCBiaW5hcnk6IEFycmF5fX0gU2VwYXJhdGVkIGRhdGEgc3RyZWFtcy5cbiAqL1xuQ29uc3VtZXIubWVzc2FnZVRvUG9ydGFibGUgPSBmdW5jdGlvbiAodGVtcGxhdGUsIHZhbHVlLCBkZWJ1Zykge1xuICB2YXIgZXh0ZXJuYWxzID0gW10sXG4gICAgbWVzc2FnZSA9IENvbnN1bWVyLmNvbmZvcm0odGVtcGxhdGUsIHZhbHVlLCBleHRlcm5hbHMsIHRydWUsIGRlYnVnKTtcbiAgcmV0dXJuIHtcbiAgICB0ZXh0OiBtZXNzYWdlLFxuICAgIGJpbmFyeTogZXh0ZXJuYWxzXG4gIH07XG59O1xuXG4vKipcbiAqIENvbnZlcnQgU3RydWN0dXJlZCBEYXRhIHN0cmVhbXMgaW50byBhIGRhdGEgc3RydWN0dXJlIGNvbmZvcm1pbmcgdG8gYVxuICogdGVtcGxhdGUuXG4gKiBAc3RhdGljXG4gKiBAbWV0aG9kIHBvcnRhYmxlVG9NZXNzYWdlXG4gKiBAcGFyYW0ge09iamVjdH0gdGVtcGxhdGUgVGhlIHRlbXBsYXRlIHRvIGNvbmZvcm0gdG9cbiAqIEBwYXJhbSB7e3RleHQ6IE9iamVjdCwgYmluYXJ5OiBBcnJheX19IHN0cmVhbXMgVGhlIHN0cmVhbXMgdG8gY29uZm9ybVxuICogQHBhcmFtIHtEZWJ1Z30gZGVidWcgQSBkZWJ1Z2dlciBmb3IgZXJyb3JzLlxuICogQHJldHVybiB7T2JqZWN0fSBUaGUgZGF0YSBzdHJ1Y3R1cmUgbWF0Y2hpbmcgdGhlIHRlbXBsYXRlLlxuICovXG5Db25zdW1lci5wb3J0YWJsZVRvTWVzc2FnZSA9IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgc3RyZWFtcywgZGVidWcpIHtcbiAgcmV0dXJuIENvbnN1bWVyLmNvbmZvcm0odGVtcGxhdGUsIHN0cmVhbXMudGV4dCwgc3RyZWFtcy5iaW5hcnksIGZhbHNlLCBkZWJ1Zyk7XG59O1xuXG4vKipcbiAqIEZvcmNlIGEgY29sbGVjdGlvbiBvZiB2YWx1ZXMgdG8gbG9vayBsaWtlIHRoZSB0eXBlcyBhbmQgbGVuZ3RoIG9mIGFuIEFQSVxuICogdGVtcGxhdGUuXG4gKiBAc3RhdGljXG4gKiBAbWV0aG9kIGNvbmZvcm1cbiAqIEBwYXJhbSB7T2JqZWN0fSB0ZW1wbGF0ZSBUaGUgdGVtcGxhdGUgdG8gY29uZm9ybSB0b1xuICogQHBhcmFtIHtPYmplY3R9IGZyb20gVGhlIHZhbHVlIHRvIGNvbmZvcm1cbiAqIEBwYXJhbSB7QXJyYXl9IGV4dGVybmFscyBMaXN0aW5nIG9mIGJpbmFyeSBlbGVtZW50cyBpbiB0aGUgdGVtcGxhdGVcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gV2hldGhlciB0byB0byBzZXBhcmF0ZSBvciBjb21iaW5lIHN0cmVhbXMuXG4gKiBAYXBhcmFtIHtEZWJ1Z30gZGVidWcgQSBkZWJ1Z2dlciBmb3IgZXJyb3JzLlxuICovXG5Db25zdW1lci5jb25mb3JtID0gZnVuY3Rpb24gKHRlbXBsYXRlLCBmcm9tLCBleHRlcm5hbHMsIHNlcGFyYXRlLCBkZWJ1Zykge1xuICAvKiBqc2hpbnQgLVcwODYgKi9cbiAgaWYgKHR5cGVvZiAoZnJvbSkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAvL2Zyb20gPSB1bmRlZmluZWQ7XG4gICAgLy90aHJvdyBcIlRyeWluZyB0byBjb25mb3JtIGEgZnVuY3Rpb25cIjtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9IGVsc2UgaWYgKHR5cGVvZiAoZnJvbSkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfSBlbHNlIGlmIChmcm9tID09PSBudWxsKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0gZWxzZSBpZiAodGVtcGxhdGUgPT09IHVuZGVmaW5lZCkge1xuICAgIGRlYnVnLmVycm9yKFwiTWVzc2FnZSBkaXNjYXJkZWQgZm9yIG5vdCBtYXRjaGluZyBkZWNsYXJlZCB0eXBlIVwiLCBmcm9tKTtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgc3dpdGNoICh0ZW1wbGF0ZSkge1xuICBjYXNlICdzdHJpbmcnOlxuICAgIHJldHVybiBTdHJpbmcoJycpICsgZnJvbTtcbiAgY2FzZSAnbnVtYmVyJzpcbiAgICByZXR1cm4gTnVtYmVyKDEpICogZnJvbTtcbiAgY2FzZSAnYm9vbGVhbic6XG4gICAgcmV0dXJuIEJvb2xlYW4oZnJvbSA9PT0gdHJ1ZSk7XG4gIGNhc2UgJ29iamVjdCc6XG4gICAgLy8gVE9ETyh3aWxsc2NvdHQpOiBBbGxvdyByZW1vdmFsIGlmIHNhbmRib3hpbmcgZW5mb3JjZXMgdGhpcy5cbiAgICBpZiAodHlwZW9mIGZyb20gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShmcm9tKSk7XG4gICAgfVxuICBjYXNlICdibG9iJzpcbiAgICBpZiAoc2VwYXJhdGUpIHtcbiAgICAgIGlmIChmcm9tIGluc3RhbmNlb2YgQmxvYikge1xuICAgICAgICBleHRlcm5hbHMucHVzaChmcm9tKTtcbiAgICAgICAgcmV0dXJuIGV4dGVybmFscy5sZW5ndGggLSAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVidWcuZXJyb3IoJ2NvbmZvcm0gZXhwZWN0aW5nIEJsb2IsIGJ1dCBzYXcgJyArICh0eXBlb2YgZnJvbSkpO1xuICAgICAgICBleHRlcm5hbHMucHVzaChuZXcgQmxvYihbXSkpO1xuICAgICAgICByZXR1cm4gZXh0ZXJuYWxzLmxlbmd0aCAtIDE7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBleHRlcm5hbHNbZnJvbV07XG4gICAgfVxuICBjYXNlICdidWZmZXInOlxuICAgIGlmIChzZXBhcmF0ZSkge1xuICAgICAgZXh0ZXJuYWxzLnB1c2goQ29uc3VtZXIubWFrZUFycmF5QnVmZmVyKGZyb20sIGRlYnVnKSk7XG4gICAgICByZXR1cm4gZXh0ZXJuYWxzLmxlbmd0aCAtIDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBDb25zdW1lci5tYWtlQXJyYXlCdWZmZXIoZXh0ZXJuYWxzW2Zyb21dLCBkZWJ1Zyk7XG4gICAgfVxuICBjYXNlICdwcm94eSc6XG4gICAgcmV0dXJuIGZyb207XG4gIH1cbiAgdmFyIHZhbCwgaTtcbiAgaWYgKEFycmF5LmlzQXJyYXkodGVtcGxhdGUpICYmIGZyb20gIT09IHVuZGVmaW5lZCkge1xuICAgIHZhbCA9IFtdO1xuICAgIGkgPSAwO1xuICAgIGlmICh0ZW1wbGF0ZS5sZW5ndGggPT09IDIgJiYgdGVtcGxhdGVbMF0gPT09ICdhcnJheScpIHtcbiAgICAgIC8vY29uc29sZS5sb2coXCJ0ZW1wbGF0ZSBpcyBhcnJheSwgdmFsdWUgaXMgXCIgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkpO1xuICAgICAgZm9yIChpID0gMDsgaSA8IGZyb20ubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgdmFsLnB1c2goQ29uc3VtZXIuY29uZm9ybSh0ZW1wbGF0ZVsxXSwgZnJvbVtpXSwgZXh0ZXJuYWxzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlcGFyYXRlLCBkZWJ1ZykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgdGVtcGxhdGUubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKGZyb21baV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHZhbC5wdXNoKENvbnN1bWVyLmNvbmZvcm0odGVtcGxhdGVbaV0sIGZyb21baV0sIGV4dGVybmFscyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlcGFyYXRlLCBkZWJ1ZykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbC5wdXNoKHVuZGVmaW5lZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZhbDtcbiAgfSBlbHNlIGlmICh0eXBlb2YgdGVtcGxhdGUgPT09ICdvYmplY3QnICYmIGZyb20gIT09IHVuZGVmaW5lZCkge1xuICAgIHZhbCA9IHt9O1xuICAgIHV0aWwuZWFjaFByb3AodGVtcGxhdGUsIGZ1bmN0aW9uIChwcm9wLCBuYW1lKSB7XG4gICAgICBpZiAoZnJvbVtuYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHZhbFtuYW1lXSA9IENvbnN1bWVyLmNvbmZvcm0ocHJvcCwgZnJvbVtuYW1lXSwgZXh0ZXJuYWxzLCBzZXBhcmF0ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1Zyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHZhbDtcbiAgfVxuICBkZWJ1Zy5lcnJvcignVW5rbm93biB0ZW1wbGF0ZSBwcm92aWRlZDogJyArIHRlbXBsYXRlKTtcbn07XG5cbi8qKlxuICogTWFrZSBhIHRoaW5nIGludG8gYW4gQXJyYXkgQnVmZmVyXG4gKiBAc3RhdGljXG4gKiBAbWV0aG9kIG1ha2VBcnJheUJ1ZmZlclxuICogQHBhcmFtIHtPYmplY3R9IHRoaW5nXG4gKiBAcGFyYW0ge0RlYnVnfSBkZWJ1ZyBBIGRlYnVnZ2VyIGluIGNhc2Ugb2YgZXJyb3JzLlxuICogQHJldHVybiB7QXJyYXlCdWZmZXJ9IEFuIEFycmF5IEJ1ZmZlclxuICovXG5Db25zdW1lci5tYWtlQXJyYXlCdWZmZXIgPSBmdW5jdGlvbiAodGhpbmcsIGRlYnVnKSB7XG4gIGlmICghdGhpbmcpIHtcbiAgICByZXR1cm4gbmV3IEFycmF5QnVmZmVyKDApO1xuICB9XG5cbiAgaWYgKHRoaW5nIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICByZXR1cm4gdGhpbmc7XG4gIH0gZWxzZSBpZiAodGhpbmcuY29uc3RydWN0b3IubmFtZSA9PT0gXCJBcnJheUJ1ZmZlclwiICYmXG4gICAgICB0eXBlb2YgdGhpbmcucHJvdG90eXBlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgLy8gV29ya2Fyb3VuZCBmb3Igd2Via2l0IG9yaWdpbiBvd25lcnNoaXAgaXNzdWUuXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL1VXTmV0d29ya3NMYWIvZnJlZWRvbS9pc3N1ZXMvMjhcbiAgICByZXR1cm4gbmV3IERhdGFWaWV3KHRoaW5nKS5idWZmZXI7XG4gIH0gZWxzZSB7XG4gICAgZGVidWcuZXJyb3IoJ2V4cGVjdGluZyBBcnJheUJ1ZmZlciwgYnV0IHNhdyAnICtcbiAgICAgICAgKHR5cGVvZiB0aGluZykgKyAnOiAnICsgSlNPTi5zdHJpbmdpZnkodGhpbmcpKTtcbiAgICByZXR1cm4gbmV3IEFycmF5QnVmZmVyKDApO1xuICB9XG59O1xuXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IHRyYXZlcnNlIGEgW25lc3RlZF0gb2JqZWN0IGFuZCBmcmVlemUgaXRzIGtleXMgZnJvbSBiZWluZ1xuICogd3JpdGFibGUuIE5vdGUsIHRoZSByZXN1bHQgY2FuIGhhdmUgbmV3IGtleXMgYWRkZWQgdG8gaXQsIGJ1dCBleGlzdGluZyBvbmVzXG4gKiBjYW5ub3QgYmUgIG92ZXJ3cml0dGVuLiBEb2Vzbid0IGRvIGFueXRoaW5nIGZvciBhcnJheXMgb3Igb3RoZXIgY29sbGVjdGlvbnMuXG4gKlxuICogQG1ldGhvZCByZWN1cnNpdmVGcmVlemVPYmplY3RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogLSBvYmplY3QgdG8gYmUgZnJvemVuXG4gKiBAcmV0dXJuIHtPYmplY3R9IG9ialxuICoqL1xuQ29uc3VtZXIucmVjdXJzaXZlRnJlZXplT2JqZWN0ID0gZnVuY3Rpb24gKG9iaikge1xuICB2YXIgaywgcmV0ID0ge307XG4gIGlmICh0eXBlb2Ygb2JqICE9PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBvYmo7XG4gIH1cbiAgZm9yIChrIGluIG9iaikge1xuICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShyZXQsIGssIHtcbiAgICAgICAgdmFsdWU6IENvbnN1bWVyLnJlY3Vyc2l2ZUZyZWV6ZU9iamVjdChvYmpba10pLFxuICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6IHRydWVcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmV0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb25zdW1lcjtcbiIsIi8qanNsaW50IGluZGVudDoyLCBub2RlOnRydWUsIHNsb3BweTp0cnVlICovXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG4vKipcbiAqIEEgZnJlZWRvbSBlbnRyeSBwb2ludCBmb3IgZGVidWdnaW5nLlxuICogQHVzZXMgaGFuZGxlRXZlbnRzXG4gKiBAaW1wbGVtZW50cyBQb3J0XG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmFyIERlYnVnID0gZnVuY3Rpb24gKGxvZ2dlcikge1xuICB0aGlzLmlkID0gJ2RlYnVnJztcbiAgdGhpcy5lbWl0Q2hhbm5lbCA9IGZhbHNlO1xuICB0aGlzLmNvbmZpZyA9IGZhbHNlO1xuICB1dGlsLmhhbmRsZUV2ZW50cyh0aGlzKTtcbn07XG5cbi8qKlxuICogUHJvdmlkZSBhIHRleHR1YWwgZGVzY3JpcHRpb24gb2YgdGhpcyBwb3J0LlxuICogQG1ldGhvZCB0b1N0cmluZ1xuICogQHJldHVybiB7U3RyaW5nfSB0aGUgdGV4dHVhbCBkZXNjcmlwdGlvbi5cbiAqL1xuRGVidWcucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gJ1tDb25zb2xlXSc7XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVyIGEgbG9nZ2VyIGZvciBvdXRwdXR0aW5nIGRlYnVnZ2luZyBtZXNzYWdlcy5cbiAqIEBtZXRob2Qgc2V0TG9nZ2VyXG4gKiBAcGFyYW0ge0NvbnNvbGV9IGxvZ2dlciBUaGUgbG9nZ2VyIHRvIHJlZ2lzdGVyXG4gKi9cbkRlYnVnLnByb3RvdHlwZS5zZXRMb2dnZXIgPSBmdW5jdGlvbiAobG9nZ2VyKSB7XG4gIGlmICh0aGlzLmxvZ2dlcikge1xuICAgIHRoaXMuaW5mbygnUmVwbGFjaW5nIExvZ2dlci4nKTtcbiAgfVxuICB0aGlzLmxvZ2dlciA9IGxvZ2dlcjtcbiAgdGhpcy5lbWl0KCdsb2dnZXInKTtcbn07XG5cbi8qKlxuICogSGFuZGxlciBmb3IgcmVjZWl2aW5nIG1lc3NhZ2VzIHNlbnQgdG8gdGhlIGRlYnVnIHBvcnQuXG4gKiBUaGVzZSBtZXNzYWdlcyBhcmUgdXNlZCB0byByZXRyZWl2ZSBjb25maWcgZm9yIGV4cG9zaW5nIGNvbnNvbGUuXG4gKiBAbWV0aG9kIG9uTWVzc2FnZVxuICogQHBhcmFtIHtTdHJpbmd9IHNvdXJjZSB0aGUgc291cmNlIGlkZW50aWZpZXIgZm9yIHRoZSBtZXNzYWdlLlxuICogQHBhcmFtIHtPYmplY3R9IG1lc3NhZ2UgdGhlIHJlY2VpdmVkIG1lc3NhZ2UuXG4gKi9cbkRlYnVnLnByb3RvdHlwZS5vbk1lc3NhZ2UgPSBmdW5jdGlvbiAoc291cmNlLCBtZXNzYWdlKSB7XG4gIGlmIChzb3VyY2UgPT09ICdjb250cm9sJyAmJiBtZXNzYWdlLmNoYW5uZWwgJiYgIXRoaXMuZW1pdENoYW5uZWwpIHtcbiAgICB0aGlzLmVtaXRDaGFubmVsID0gbWVzc2FnZS5jaGFubmVsO1xuICAgIHRoaXMuY29uZmlnID0gbWVzc2FnZS5jb25maWc7XG4gICAgaWYgKCF0aGlzLmNvbmZpZy5nbG9iYWwuY29uc29sZSkge1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLmNvbmZpZy5nbG9iYWwuY29uc29sZSA9IGNvbnNvbGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNvbmZpZy5nbG9iYWwuY29uc29sZSA9IHRoaXMuZ2V0TG9nZ2VyKCdDb25zb2xlJyk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZW1pdCgncmVhZHknKTtcbiAgfVxufTtcblxuLyoqXG4gKiBEaXNwYXRjaCBhIGRlYnVnIG1lc3NhZ2Ugd2l0aCBhcmJpdHJhcnkgc2V2ZXJpdHkuXG4gKiBBbGwgZGVidWcgbWVzc2FnZXMgYXJlIHJvdXRlZCB0aHJvdWdoIHRoZSBtYW5hZ2VyLCB0byBhbGxvdyBmb3IgZGVsZWdhdGlvbi5cbiAqIEBtZXRob2QgZm9ybWF0XG4gKiBAcGFyYW0ge1N0cmluZ30gc2V2ZXJpdHkgdGhlIHNldmVyaXR5IG9mIHRoZSBtZXNzYWdlLlxuICogQHBhcmFtIHtTdHJpbmd9IHNvdXJjZSBUaGUgbG9jYXRpb24gb2YgbWVzc2FnZS5cbiAqIEBwYXJhbSB7U3RyaW5nW119IGFyZ3MgVGhlIGNvbnRlbnRzIG9mIHRoZSBtZXNzYWdlLlxuICogQHByaXZhdGVcbiAqL1xuRGVidWcucHJvdG90eXBlLmZvcm1hdCA9IGZ1bmN0aW9uIChzZXZlcml0eSwgc291cmNlLCBhcmdzKSB7XG4gIHZhciBpLCBhbGlzdCA9IFtdLCBhcmdhcnI7XG4gIGlmICh0eXBlb2YgYXJncyA9PT0gXCJzdHJpbmdcIiAmJiBzb3VyY2UpIHtcbiAgICB0cnkge1xuICAgICAgYXJnYXJyID0gSlNPTi5wYXJzZShhcmdzKTtcbiAgICAgIGlmIChhcmdhcnIgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICBhcmdzID0gYXJnYXJyO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vIHBhc3MuXG4gICAgfVxuICB9XG5cbiAgaWYgKHR5cGVvZiBhcmdzID09PSBcInN0cmluZ1wiKSB7XG4gICAgYWxpc3QucHVzaChhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgYWxpc3QucHVzaChhcmdzW2ldKTtcbiAgICB9XG4gIH1cbiAgaWYgKCF0aGlzLmVtaXRDaGFubmVsKSB7XG4gICAgdGhpcy5vbigncmVhZHknLCB0aGlzLmZvcm1hdC5iaW5kKHRoaXMsIHNldmVyaXR5LCBzb3VyY2UsIGFsaXN0KSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMuZW1pdCh0aGlzLmVtaXRDaGFubmVsLCB7XG4gICAgc2V2ZXJpdHk6IHNldmVyaXR5LFxuICAgIHNvdXJjZTogc291cmNlLFxuICAgIHF1aWV0OiB0cnVlLFxuICAgIHJlcXVlc3Q6ICdkZWJ1ZycsXG4gICAgbXNnOiBKU09OLnN0cmluZ2lmeShhbGlzdClcbiAgfSk7XG59O1xuXG4vKipcbiAqIFByaW50IHJlY2VpdmVkIG1lc3NhZ2VzIG9uIHRoZSBjb25zb2xlLlxuICogVGhpcyBpcyBjYWxsZWQgYnkgdGhlIG1hbmFnZXIgaW4gcmVzcG9uc2UgdG8gYW4gZW1pc3Npb24gZnJvbSBmb3JtYXQuXG4gKiBAbWV0aG9kIHByaW50XG4gKiBAcGFyYW0ge09iamVjdH0gbWVzc2FnZSBUaGUgbWVzc2FnZSBlbWl0dGVkIGJ5IHtAc2VlIGZvcm1hdH0gdG8gcHJpbnQuXG4gKi9cbkRlYnVnLnByb3RvdHlwZS5wcmludCA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gIGlmICghdGhpcy5sb2dnZXIpIHtcbiAgICB0aGlzLm9uY2UoJ2xvZ2dlcicsIHRoaXMucHJpbnQuYmluZCh0aGlzLCBtZXNzYWdlKSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGFyZ3MsIGFyciA9IFtdLCBpID0gMDtcbiAgYXJncyA9IEpTT04ucGFyc2UobWVzc2FnZS5tc2cpO1xuICBpZiAodHlwZW9mIGFyZ3MgPT09IFwic3RyaW5nXCIpIHtcbiAgICBhcnIucHVzaChhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICB3aGlsZSAoYXJnc1tpXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBhcnIucHVzaChhcmdzW2ldKTtcbiAgICAgIGkgKz0gMTtcbiAgICB9XG4gIH1cbiAgdGhpcy5sb2dnZXJbbWVzc2FnZS5zZXZlcml0eV0uY2FsbCh0aGlzLmxvZ2dlciwgbWVzc2FnZS5zb3VyY2UsIGFyciwgZnVuY3Rpb24gKCkge30pO1xufTtcblxuLyoqXG4gKiBQcmludCBhIGxvZyBtZXNzYWdlIHRvIHRoZSBjb25zb2xlLlxuICogQG1ldGhvZCBsb2dcbiAqL1xuRGVidWcucHJvdG90eXBlLmxvZyA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5mb3JtYXQoJ2xvZycsIHVuZGVmaW5lZCwgYXJndW1lbnRzKTtcbn07XG5cbi8qKlxuICogUHJpbnQgYW4gaW5mbyBtZXNzYWdlIHRvIHRoZSBjb25zb2xlLlxuICogQG1ldGhvZCBsb2dcbiAqL1xuRGVidWcucHJvdG90eXBlLmluZm8gPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuZm9ybWF0KCdpbmZvJywgdW5kZWZpbmVkLCBhcmd1bWVudHMpO1xufTtcblxuLyoqXG4gKiBQcmludCBhIGRlYnVnIG1lc3NhZ2UgdG8gdGhlIGNvbnNvbGUuXG4gKiBAbWV0aG9kIGxvZ1xuICovXG5EZWJ1Zy5wcm90b3R5cGUuZGVidWcgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuZm9ybWF0KCdkZWJ1ZycsIHVuZGVmaW5lZCwgYXJndW1lbnRzKTtcbn07XG5cbi8qKlxuICogUHJpbnQgYSB3YXJuaW5nIG1lc3NhZ2UgdG8gdGhlIGNvbnNvbGUuXG4gKiBAbWV0aG9kIHdhcm5cbiAqL1xuRGVidWcucHJvdG90eXBlLndhcm4gPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuZm9ybWF0KCd3YXJuJywgdW5kZWZpbmVkLCBhcmd1bWVudHMpO1xufTtcblxuLyoqXG4gKiBQcmludCBhbiBlcnJvciBtZXNzYWdlIHRvIHRoZSBjb25zb2xlLlxuICogQG1ldGhvZCBlcnJvclxuICovXG5EZWJ1Zy5wcm90b3R5cGUuZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuZm9ybWF0KCdlcnJvcicsIHVuZGVmaW5lZCwgYXJndW1lbnRzKTtcbn07XG5cbi8qKlxuICogR2V0IGEgbG9nZ2VyIHRoYXQgbG9ncyBtZXNzYWdlcyBwcmVmaXhlZCBieSBhIGdpdmVuIG5hbWUuXG4gKiBAbWV0aG9kIGdldExvZ2dlclxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgVGhlIHByZWZpeCBmb3IgbG9nZ2VkIG1lc3NhZ2VzLlxuICogQHJldHVybnMge0NvbnNvbGV9IEEgY29uc29sZS1saWtlIG9iamVjdC5cbiAqL1xuRGVidWcucHJvdG90eXBlLmdldExvZ2dlciA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gIHZhciBsb2cgPSBmdW5jdGlvbiAoc2V2ZXJpdHksIHNvdXJjZSkge1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNwbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgdGhpcy5mb3JtYXQoc2V2ZXJpdHksIHNvdXJjZSwgYXJncyk7XG4gIH0sXG4gICAgbG9nZ2VyID0ge1xuICAgICAgZnJlZWRvbTogdHJ1ZSxcbiAgICAgIGRlYnVnOiBsb2cuYmluZCh0aGlzLCAnZGVidWcnLCBuYW1lKSxcbiAgICAgIGluZm86IGxvZy5iaW5kKHRoaXMsICdpbmZvJywgbmFtZSksXG4gICAgICBsb2c6IGxvZy5iaW5kKHRoaXMsICdsb2cnLCBuYW1lKSxcbiAgICAgIHdhcm46IGxvZy5iaW5kKHRoaXMsICd3YXJuJywgbmFtZSksXG4gICAgICBlcnJvcjogbG9nLmJpbmQodGhpcywgJ2Vycm9yJywgbmFtZSlcbiAgICB9O1xuICByZXR1cm4gbG9nZ2VyO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBEZWJ1ZztcbiIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbi8qanNsaW50IGluZGVudDoyLG5vZGU6dHJ1ZSAqL1xyXG52YXIgUHJvbWlzZUNvbXBhdCA9IHJlcXVpcmUoJ2VzNi1wcm9taXNlJykuUHJvbWlzZTtcclxuXHJcbnZhciBBcGkgPSByZXF1aXJlKCcuL2FwaScpO1xyXG52YXIgRGVidWcgPSByZXF1aXJlKCcuL2RlYnVnJyk7XHJcbnZhciBIdWIgPSByZXF1aXJlKCcuL2h1YicpO1xyXG52YXIgTWFuYWdlciA9IHJlcXVpcmUoJy4vbWFuYWdlcicpO1xyXG52YXIgUG9saWN5ID0gcmVxdWlyZSgnLi9wb2xpY3knKTtcclxudmFyIFByb3h5QmluZGVyID0gcmVxdWlyZSgnLi9wcm94eWJpbmRlcicpO1xyXG52YXIgUmVzb3VyY2UgPSByZXF1aXJlKCcuL3Jlc291cmNlJyk7XHJcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XHJcbnZhciBCdW5kbGUgPSByZXF1aXJlKCcuL2J1bmRsZScpO1xyXG5cclxudmFyIGZyZWVkb21HbG9iYWw7XHJcbnZhciBnZXRHbG9iYWwgPSBmdW5jdGlvbiAoKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG4gIFxyXG4gIC8vIE5vZGUuanNcclxuICBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgJiYgZ2xvYmFsLnByb3RvdHlwZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBmcmVlZG9tR2xvYmFsID0gZ2xvYmFsO1xyXG4gIC8vIEJyb3dzZXJzXHJcbiAgfSBlbHNlIHtcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICBmcmVlZG9tR2xvYmFsID0gdGhpcztcclxuICAgIH0sIDApO1xyXG4gIH1cclxufTtcclxuZ2V0R2xvYmFsKCk7XHJcblxyXG4vKipcclxuICogQ3JlYXRlIGEgbmV3IGZyZWVkb20gY29udGV4dC5cclxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHQgSW5mb3JtYXRpb24gYWJvdXQgdGhlIGxvY2FsIGNvbnRleHQuXHJcbiAqIEBzZWUge3V0aWwvd29ya2VyRW50cnkuanN9XHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBtYW5pZmVzdCBUaGUgbWFuaWZlc3QgdG8gbG9hZC5cclxuICogQHBhcmFtIHtPYmplY3R9IGNvbmZpZyBDb25maWd1cmF0aW9uIGtleXMgc2V0IGJ5IHRoZSB1c2VyLlxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gQSBwcm9taXNlIGZvciB0aGUgbW9kdWxlIGRlZmluZWQgaW4gdGhlIG1hbmlmZXN0LlxyXG4gKi9cclxudmFyIHNldHVwID0gZnVuY3Rpb24gKGNvbnRleHQsIG1hbmlmZXN0LCBjb25maWcpIHtcclxuICAndXNlIHN0cmljdCc7XHJcbiAgdmFyIGRlYnVnID0gbmV3IERlYnVnKCksXHJcbiAgICBodWIgPSBuZXcgSHViKGRlYnVnKSxcclxuICAgIHJlc291cmNlID0gbmV3IFJlc291cmNlKGRlYnVnKSxcclxuICAgIGFwaSA9IG5ldyBBcGkoZGVidWcpLFxyXG4gICAgbWFuYWdlciA9IG5ldyBNYW5hZ2VyKGh1YiwgcmVzb3VyY2UsIGFwaSksXHJcbiAgICBiaW5kZXIgPSBuZXcgUHJveHlCaW5kZXIobWFuYWdlciksXHJcbiAgICBwb2xpY3ksXHJcbiAgICBzaXRlX2NmZyA9IHtcclxuICAgICAgJ2RlYnVnJzogJ2xvZycsXHJcbiAgICAgICdtYW5pZmVzdCc6IG1hbmlmZXN0LFxyXG4gICAgICAnbW9kdWxlQ29udGV4dCc6ICghY29udGV4dCB8fCB0eXBlb2YgKGNvbnRleHQuaXNNb2R1bGUpID09PSBcInVuZGVmaW5lZFwiKSA/XHJcbiAgICAgICAgICB1dGlsLmlzTW9kdWxlQ29udGV4dCgpIDpcclxuICAgICAgICAgIGNvbnRleHQuaXNNb2R1bGVcclxuICAgIH0sXHJcbiAgICBsaW5rLFxyXG4gICAgUG9ydDtcclxuXHJcbiAgaWYgKGNvbmZpZykge1xyXG4gICAgdXRpbC5taXhpbihzaXRlX2NmZywgY29uZmlnLCB0cnVlKTtcclxuICB9XHJcbiAgc2l0ZV9jZmcuZ2xvYmFsID0gZnJlZWRvbUdsb2JhbDtcclxuICBpZiAoY29udGV4dCkge1xyXG4gICAgdXRpbC5taXhpbihzaXRlX2NmZywgY29udGV4dCwgdHJ1ZSk7XHJcbiAgfVxyXG5cclxuICAvLyBSZWdpc3RlciB1c2VyLXN1cHBsaWVkIGV4dGVuc2lvbnMuXHJcbiAgLy8gRm9yIGV4YW1wbGUgdGhlICdjb3JlLm9hdXRoJyBwcm92aWRlciBkZWZpbmVzIGEgcmVnaXN0ZXIgZnVuY3Rpb24sXHJcbiAgLy8gd2hpY2ggZW5hYmxlcyBzaXRlX2NmZy5vYXV0aCB0byBiZSByZWdpc3RlcmVkIHdpdGggaXQuXHJcbiAgY29udGV4dC5wcm92aWRlcnMuZm9yRWFjaChmdW5jdGlvbiAocHJvdmlkZXIpIHtcclxuICAgIGlmIChwcm92aWRlci5uYW1lLmluZGV4T2YoJ2NvcmUuJykgPT09IDAgJiZcclxuICAgICAgICB0eXBlb2YgcHJvdmlkZXIucmVnaXN0ZXIgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgcHJvdmlkZXIucmVnaXN0ZXIoXHJcbiAgICAgICAgKHR5cGVvZiBzaXRlX2NmZ1twcm92aWRlci5uYW1lLnN1YnN0cig1KV0gIT09ICd1bmRlZmluZWQnKSA/XHJcbiAgICAgICAgICAgIHNpdGVfY2ZnW3Byb3ZpZGVyLm5hbWUuc3Vic3RyKDUpXSA6XHJcbiAgICAgICAgICAgIHVuZGVmaW5lZFxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIFxyXG4gIEJ1bmRsZS5yZWdpc3Rlcihjb250ZXh0LnByb3ZpZGVycywgYXBpKTtcclxuICByZXNvdXJjZS5yZWdpc3Rlcihjb250ZXh0LnJlc29sdmVycyB8fCBbXSk7XHJcblxyXG4gIHJldHVybiBuZXcgUHJvbWlzZUNvbXBhdChmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICBpZiAoc2l0ZV9jZmcubW9kdWxlQ29udGV4dCkge1xyXG4gICAgICBQb3J0ID0gc2l0ZV9jZmcucG9ydFR5cGU7XHJcbiAgICAgIGxpbmsgPSBuZXcgUG9ydCgnT3V0Ym91bmQnLCByZXNvdXJjZSk7XHJcbiAgICAgIG1hbmFnZXIuc2V0dXAobGluayk7XHJcblxyXG4gICAgICAvLyBEZWxheSBkZWJ1ZyBtZXNzYWdlcyB1bnRpbCBkZWxlZ2F0aW9uIHRvIHRoZSBwYXJlbnQgY29udGV4dCBpcyBzZXR1cC5cclxuICAgICAgbWFuYWdlci5vbmNlKCdkZWxlZ2F0ZScsIG1hbmFnZXIuc2V0dXAuYmluZChtYW5hZ2VyLCBkZWJ1ZykpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbWFuYWdlci5zZXR1cChkZWJ1Zyk7XHJcbiAgICAgIHBvbGljeSA9IG5ldyBQb2xpY3kobWFuYWdlciwgcmVzb3VyY2UsIHNpdGVfY2ZnKTtcclxuXHJcbiAgICAgIC8vIERlZmluZSBob3cgdG8gbG9hZCBhIHJvb3QgbW9kdWxlLlxyXG4gICAgICB2YXIgZmFsbGJhY2tMb2dnZXIsIGdldElmYWNlO1xyXG4gICAgICBmYWxsYmFja0xvZ2dlciA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XHJcbiAgICAgICAgYXBpLmdldENvcmUoJ2NvcmUuY29uc29sZScsIGRlYnVnKS50aGVuKGZ1bmN0aW9uIChMb2dnZXIpIHtcclxuICAgICAgICAgIGRlYnVnLnNldExvZ2dlcihuZXcgTG9nZ2VyKCkpO1xyXG4gICAgICAgICAgaWYgKG1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgZGVidWcuZXJyb3IobWVzc2FnZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH07XHJcbiAgICAgIGdldElmYWNlID0gZnVuY3Rpb24gKG1hbmlmZXN0KSB7XHJcbiAgICAgICAgcmV0dXJuIHJlc291cmNlLmdldChzaXRlX2NmZy5sb2NhdGlvbiwgbWFuaWZlc3QpLnRoZW4oXHJcbiAgICAgICAgICBmdW5jdGlvbiAoY2Fub25pY2FsX21hbmlmZXN0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwb2xpY3kuZ2V0KFtdLCBjYW5vbmljYWxfbWFuaWZlc3QpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICkudGhlbihmdW5jdGlvbiAoaW5zdGFuY2UpIHtcclxuICAgICAgICAgIG1hbmFnZXIuc2V0dXAoaW5zdGFuY2UpO1xyXG4gICAgICAgICAgcmV0dXJuIGJpbmRlci5iaW5kRGVmYXVsdChpbnN0YW5jZSwgYXBpLCBpbnN0YW5jZS5tYW5pZmVzdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICAvLyBMb2FkIGFwcHJvcHJpYXRlIExvZ2dlci5cclxuICAgICAgaWYgKHNpdGVfY2ZnLmxvZ2dlcikge1xyXG4gICAgICAgIGdldElmYWNlKHNpdGVfY2ZnLmxvZ2dlcikudGhlbihmdW5jdGlvbiAoaWZhY2UpIHtcclxuICAgICAgICAgIGlmIChpZmFjZS5leHRlcm5hbC5hcGkgIT09ICdjb25zb2xlJykge1xyXG4gICAgICAgICAgICBmYWxsYmFja0xvZ2dlcihcIlVud2lsbGluZyB0byB1c2UgbG9nZ2VyIHdpdGggdW5rbm93biBBUEk6XCIsXHJcbiAgICAgICAgICAgICAgaWZhY2UuZXh0ZXJuYWwuYXBpKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGRlYnVnLnNldExvZ2dlcihpZmFjZS5leHRlcm5hbCgpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LCBmYWxsYmFja0xvZ2dlcik7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZmFsbGJhY2tMb2dnZXIoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gTG9hZCByb290IG1vZHVsZS5cclxuICAgICAgZ2V0SWZhY2Uoc2l0ZV9jZmcubWFuaWZlc3QpLnRoZW4oZnVuY3Rpb24gKGlmYWNlKSB7XHJcbiAgICAgICAgcmV0dXJuIGlmYWNlLmV4dGVybmFsO1xyXG4gICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgZGVidWcuZXJyb3IoJ0ZhaWxlZCB0byByZXRyaWV2ZSBtYW5pZmVzdDogJyArIGVycik7XHJcbiAgICAgICAgdGhyb3cgZXJyO1xyXG4gICAgICB9KS50aGVuKHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICB9XHJcblxyXG4gICAgaHViLmVtaXQoJ2NvbmZpZycsIHNpdGVfY2ZnKTtcclxuICB9KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2V0dXA7XHJcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiLypqc2xpbnQgaW5kZW50OjIsc2xvcHB5OnRydWUsbm9kZTp0cnVlICovXHJcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XHJcblxyXG4vKipcclxuICogRGVmaW5lcyBmZG9tLkh1YiwgdGhlIGNvcmUgbWVzc2FnZSBodWIgYmV0d2VlbiBmcmVlZG9tIG1vZHVsZXMuXHJcbiAqIEluY29tbWluZyBtZXNzYWdlcyBmcm9tIGFwcHMgYXJlIHNlbnQgdG8gaHViLm9uTWVzc2FnZSgpXHJcbiAqIEBjbGFzcyBIdWJcclxuICogQHBhcmFtIHtEZWJ1Z30gZGVidWcgTG9nZ2VyIGZvciBkZWJ1Z2dpbmcuXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxudmFyIEh1YiA9IGZ1bmN0aW9uIChkZWJ1Zykge1xyXG4gIHRoaXMuZGVidWcgPSBkZWJ1ZztcclxuICB0aGlzLmNvbmZpZyA9IHt9O1xyXG4gIHRoaXMuYXBwcyA9IHt9O1xyXG4gIHRoaXMucm91dGVzID0ge307XHJcbiAgdGhpcy51bmJvdW5kID0gW107XHJcblxyXG4gIHV0aWwuaGFuZGxlRXZlbnRzKHRoaXMpO1xyXG4gIHRoaXMub24oJ2NvbmZpZycsIGZ1bmN0aW9uIChjb25maWcpIHtcclxuICAgIHV0aWwubWl4aW4odGhpcy5jb25maWcsIGNvbmZpZyk7XHJcbiAgfS5iaW5kKHRoaXMpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBIYW5kbGUgYW4gaW5jb21pbmcgbWVzc2FnZSBmcm9tIGEgZnJlZWRvbSBhcHAuXHJcbiAqIEBtZXRob2Qgb25NZXNzYWdlXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBzb3VyY2UgVGhlIGlkZW50aWZpeWluZyBzb3VyY2Ugb2YgdGhlIG1lc3NhZ2UuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBtZXNzYWdlIFRoZSBzZW50IG1lc3NhZ2UuXHJcbiAqL1xyXG5IdWIucHJvdG90eXBlLm9uTWVzc2FnZSA9IGZ1bmN0aW9uIChzb3VyY2UsIG1lc3NhZ2UpIHtcclxuICB2YXIgZGVzdGluYXRpb24gPSB0aGlzLnJvdXRlc1tzb3VyY2VdLCB0eXBlO1xyXG4gIGlmICghZGVzdGluYXRpb24gfHwgIWRlc3RpbmF0aW9uLmFwcCkge1xyXG4gICAgdGhpcy5kZWJ1Zy53YXJuKFwiTWVzc2FnZSBkcm9wcGVkIGZyb20gdW5yZWdpc3RlcmVkIHNvdXJjZSBcIiArIHNvdXJjZSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBpZiAoIXRoaXMuYXBwc1tkZXN0aW5hdGlvbi5hcHBdKSB7XHJcbiAgICB0aGlzLmRlYnVnLndhcm4oXCJNZXNzYWdlIGRyb3BwZWQgdG8gZGVzdGluYXRpb24gXCIgKyBkZXN0aW5hdGlvbi5hcHApO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgLy8gVGhlIGZpcmVob3NlIHRyYWNpbmcgYWxsIGludGVybmFsIGZyZWVkb20uanMgbWVzc2FnZXMuXHJcbiAgaWYgKCFtZXNzYWdlLnF1aWV0ICYmICFkZXN0aW5hdGlvbi5xdWlldCAmJiB0aGlzLmNvbmZpZyAmJiB0aGlzLmNvbmZpZy50cmFjZSkge1xyXG4gICAgdHlwZSA9IG1lc3NhZ2UudHlwZTtcclxuICAgIGlmIChtZXNzYWdlLnR5cGUgPT09ICdtZXNzYWdlJyAmJiBtZXNzYWdlLm1lc3NhZ2UgJiZcclxuICAgICAgICBtZXNzYWdlLm1lc3NhZ2UuYWN0aW9uID09PSAnbWV0aG9kJykge1xyXG4gICAgICB0eXBlID0gJ21ldGhvZC4nICsgbWVzc2FnZS5tZXNzYWdlLnR5cGU7XHJcbiAgICB9IGVsc2UgaWYgKG1lc3NhZ2UudHlwZSA9PT0gJ21ldGhvZCcgJiYgbWVzc2FnZS5tZXNzYWdlICYmXHJcbiAgICAgICAgbWVzc2FnZS5tZXNzYWdlLnR5cGUgPT09ICdtZXRob2QnKSB7XHJcbiAgICAgIHR5cGUgPSAncmV0dXJuLicgKyBtZXNzYWdlLm1lc3NhZ2UubmFtZTtcclxuICAgIH0gZWxzZSBpZiAobWVzc2FnZS50eXBlID09PSAnbWVzc2FnZScgJiYgbWVzc2FnZS5tZXNzYWdlICYmXHJcbiAgICAgICAgbWVzc2FnZS5tZXNzYWdlLnR5cGUgPT09ICdldmVudCcpIHtcclxuICAgICAgdHlwZSA9ICdldmVudC4nICsgbWVzc2FnZS5tZXNzYWdlLm5hbWU7XHJcbiAgICB9XHJcbiAgICB0aGlzLmRlYnVnLmRlYnVnKHRoaXMuYXBwc1tkZXN0aW5hdGlvbi5zb3VyY2VdLnRvU3RyaW5nKCkgK1xyXG4gICAgICAgIFwiIC1cIiArIHR5cGUgKyBcIi0+IFwiICtcclxuICAgICAgICB0aGlzLmFwcHNbZGVzdGluYXRpb24uYXBwXS50b1N0cmluZygpICsgXCIuXCIgKyBkZXN0aW5hdGlvbi5mbG93KTtcclxuICB9XHJcblxyXG4gIHRoaXMuYXBwc1tkZXN0aW5hdGlvbi5hcHBdLm9uTWVzc2FnZShkZXN0aW5hdGlvbi5mbG93LCBtZXNzYWdlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgdGhlIGxvY2FsIGRlc3RpbmF0aW9uIHBvcnQgb2YgYSBmbG93LlxyXG4gKiBAbWV0aG9kIGdldERlc3RpbmF0aW9uXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBzb3VyY2UgVGhlIGZsb3cgdG8gcmV0cmlldmUuXHJcbiAqIEByZXR1cm4ge1BvcnR9IFRoZSBkZXN0aW5hdGlvbiBwb3J0LlxyXG4gKi9cclxuSHViLnByb3RvdHlwZS5nZXREZXN0aW5hdGlvbiA9IGZ1bmN0aW9uIChzb3VyY2UpIHtcclxuICB2YXIgZGVzdGluYXRpb24gPSB0aGlzLnJvdXRlc1tzb3VyY2VdO1xyXG4gIGlmICghZGVzdGluYXRpb24pIHtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuICByZXR1cm4gdGhpcy5hcHBzW2Rlc3RpbmF0aW9uLmFwcF07XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IHRoZSBsb2NhbCBzb3VyY2UgcG9ydCBvZiBhIGZsb3cuXHJcbiAqIEBtZXRob2QgZ2V0U291cmNlXHJcbiAqIEBwYXJhbSB7UG9ydH0gc291cmNlIFRoZSBmbG93IGlkZW50aWZpZXIgdG8gcmV0cmlldmUuXHJcbiAqIEByZXR1cm4ge1BvcnR9IFRoZSBzb3VyY2UgcG9ydC5cclxuICovXHJcbkh1Yi5wcm90b3R5cGUuZ2V0U291cmNlID0gZnVuY3Rpb24gKHNvdXJjZSkge1xyXG4gIGlmICghc291cmNlKSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG4gIGlmICghdGhpcy5hcHBzW3NvdXJjZS5pZF0pIHtcclxuICAgIHRoaXMuZGVidWcud2FybihcIk5vIHJlZ2lzdGVyZWQgc291cmNlICdcIiArIHNvdXJjZS5pZCArIFwiJ1wiKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbiAgcmV0dXJuIHRoaXMuYXBwc1tzb3VyY2UuaWRdO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlZ2lzdGVyIGEgZGVzdGluYXRpb24gZm9yIG1lc3NhZ2VzIHdpdGggdGhpcyBodWIuXHJcbiAqIEBtZXRob2QgcmVnaXN0ZXJcclxuICogQHBhcmFtIHtQb3J0fSBhcHAgVGhlIFBvcnQgdG8gcmVnaXN0ZXIuXHJcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW2ZvcmNlXSBXaGV0aGVyIHRvIG92ZXJyaWRlIGFuIGV4aXN0aW5nIHBvcnQuXHJcbiAqIEByZXR1cm4ge0Jvb2xlYW59IFdoZXRoZXIgdGhlIGFwcCB3YXMgcmVnaXN0ZXJlZC5cclxuICovXHJcbkh1Yi5wcm90b3R5cGUucmVnaXN0ZXIgPSBmdW5jdGlvbiAoYXBwLCBmb3JjZSkge1xyXG4gIGlmICghdGhpcy5hcHBzW2FwcC5pZF0gfHwgZm9yY2UpIHtcclxuICAgIHRoaXMuYXBwc1thcHAuaWRdID0gYXBwO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogRGVyZWdpc3RlciBhIGRlc3RpbmF0aW9uIGZvciBtZXNzYWdlcyB3aXRoIHRoZSBodWIuXHJcbiAqIE5vdGU6IGRvZXMgbm90IHJlbW92ZSBhc3NvY2lhdGVkIHJvdXRlcy4gQXMgc3VjaCwgZGVyZWdpc3RlcmluZyB3aWxsXHJcbiAqIHByZXZlbnQgdGhlIGluc3RhbGxhdGlvbiBvZiBuZXcgcm91dGVzLCBidXQgd2lsbCBub3QgZGlzdHJ1cHQgZXhpc3RpbmdcclxuICogaHViIHJvdXRlcy5cclxuICogQG1ldGhvZCBkZXJlZ2lzdGVyXHJcbiAqIEBwYXJhbSB7UG9ydH0gYXBwIFRoZSBQb3J0IHRvIGRlcmVnaXN0ZXJcclxuICogQHJldHVybiB7Qm9vbGVhbn0gV2hldGhlciB0aGUgYXBwIHdhcyBkZXJlZ2lzdGVyZWQuXHJcbiAqL1xyXG5IdWIucHJvdG90eXBlLmRlcmVnaXN0ZXIgPSBmdW5jdGlvbiAoYXBwKSB7XHJcbiAgaWYgKCF0aGlzLmFwcHNbYXBwLmlkXSkge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuICBkZWxldGUgdGhpcy5hcHBzW2FwcC5pZF07XHJcbiAgcmV0dXJuIHRydWU7XHJcbn07XHJcblxyXG4vKipcclxuICogSW5zdGFsbCBhIG5ldyByb3V0ZSBpbiB0aGUgaHViLlxyXG4gKiBAbWV0aG9kIGluc3RhbGxcclxuICogQHBhcmFtIHtQb3J0fSBzb3VyY2UgVGhlIHNvdXJjZSBvZiB0aGUgcm91dGUuXHJcbiAqIEBwYXJhbSB7UG9ydH0gZGVzdGluYXRpb24gVGhlIGRlc3RpbmF0aW9uIG9mIHRoZSByb3V0ZS5cclxuICogQHBhcmFtIHtTdHJpbmd9IGZsb3cgVGhlIGZsb3cgd2hlcmUgdGhlIGRlc3RpbmF0aW9uIHdpbGwgcmVjZWl2ZSBtZXNzYWdlcy5cclxuICogQHBhcmFtIHtCb29sZWFufSBxdWlldCBXaGV0aGVyIG1lc3NhZ2VzIG9uIHRoaXMgcm91dGUgc2hvdWxkIGJlIHN1cHByZXNzZWQuXHJcbiAqIEByZXR1cm4ge1N0cmluZ30gQSByb3V0aW5nIHNvdXJjZSBpZGVudGlmaWVyIGZvciBzZW5kaW5nIG1lc3NhZ2VzLlxyXG4gKi9cclxuSHViLnByb3RvdHlwZS5pbnN0YWxsID0gZnVuY3Rpb24gKHNvdXJjZSwgZGVzdGluYXRpb24sIGZsb3csIHF1aWV0KSB7XHJcbiAgc291cmNlID0gdGhpcy5nZXRTb3VyY2Uoc291cmNlKTtcclxuICBpZiAoIXNvdXJjZSkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBpZiAoIWRlc3RpbmF0aW9uKSB7XHJcbiAgICB0aGlzLmRlYnVnLndhcm4oXCJVbndpbGxpbmcgdG8gZ2VuZXJhdGUgYmxhY2tob2xlIGZsb3cgZnJvbSBcIiArIHNvdXJjZS5pZCk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICB2YXIgcm91dGUgPSB0aGlzLmdlbmVyYXRlUm91dGUoKTtcclxuICB0aGlzLnJvdXRlc1tyb3V0ZV0gPSB7XHJcbiAgICBhcHA6IGRlc3RpbmF0aW9uLFxyXG4gICAgZmxvdzogZmxvdyxcclxuICAgIHNvdXJjZTogc291cmNlLmlkLFxyXG4gICAgcXVpZXQ6IHF1aWV0XHJcbiAgfTtcclxuICBpZiAodHlwZW9mIHNvdXJjZS5vbiA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgc291cmNlLm9uKHJvdXRlLCB0aGlzLm9uTWVzc2FnZS5iaW5kKHRoaXMsIHJvdXRlKSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcm91dGU7XHJcbn07XHJcblxyXG4vKipcclxuICogVW5pbnN0YWxsIGEgaHViIHJvdXRlLlxyXG4gKiBAbWV0aG9kIHVuaW5zdGFsbFxyXG4gKiBAcGFyYW0ge1BvcnR9IHNvdXJjZSBUaGUgc291cmNlIG9mIHRoZSByb3V0ZS5cclxuICogQHBhcmFtIHtTdHJpbmd9IGZsb3cgVGhlIHJvdXRlIHRvIHVuaW5zdGFsbC5cclxuICogQHJldHVybiB7Qm9vbGVhbn0gV2hldGhlciB0aGUgcm91dGUgd2FzIGFibGUgdG8gYmUgdW5pbnN0YWxsZWQuXHJcbiAqL1xyXG5IdWIucHJvdG90eXBlLnVuaW5zdGFsbCA9IGZ1bmN0aW9uIChzb3VyY2UsIGZsb3cpIHtcclxuICBzb3VyY2UgPSB0aGlzLmdldFNvdXJjZShzb3VyY2UpO1xyXG4gIGlmICghc291cmNlKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICB2YXIgcm91dGUgPSB0aGlzLnJvdXRlc1tmbG93XTtcclxuICBpZiAoIXJvdXRlKSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSBlbHNlIGlmIChyb3V0ZS5zb3VyY2UgIT09IHNvdXJjZS5pZCkge1xyXG4gICAgdGhpcy5kZWJ1Zy53YXJuKFwiRmxvdyBcIiArIGZsb3cgKyBcIiBkb2VzIG5vdCBiZWxvbmcgdG8gcG9ydCBcIiArIHNvdXJjZS5pZCk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICBkZWxldGUgdGhpcy5yb3V0ZXNbZmxvd107XHJcbiAgaWYgKHR5cGVvZiBzb3VyY2Uub2ZmID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICBzb3VyY2Uub2ZmKHJvdXRlKTtcclxuICB9XHJcbiAgcmV0dXJuIHRydWU7XHJcbn07XHJcblxyXG4vKipcclxuICogR2VuZXJhdGUgYSB1bmlxdWUgcm91dGluZyBpZGVudGlmaWVyLlxyXG4gKiBAbWV0aG9kIGdlbmVyYXRlUm91dGVcclxuICogQHJldHVybiB7U3RyaW5nfSBhIHJvdXRpbmcgc291cmNlIGlkZW50aWZpZXIuXHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG5IdWIucHJvdG90eXBlLmdlbmVyYXRlUm91dGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgcmV0dXJuIHV0aWwuZ2V0SWQoKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSHViO1xyXG4iLCIvKmpzbGludCBpbmRlbnQ6Miwgbm9kZTp0cnVlLCBzbG9wcHk6dHJ1ZSAqL1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuLyoqXG4gKiBBIGxpbmsgY29ubmVjdHMgdHdvIGZyZWVkb20gaHVicy4gVGhpcyBpcyBhbiBhYnN0cmFjdCBjbGFzc1xuICogcHJvdmlkaW5nIGNvbW1vbiBmdW5jdGlvbmFsaXR5IG9mIHRyYW5zbGF0aW5nIGNvbnRyb2wgY2hhbm5lbHMsXG4gKiBhbmQgaW50ZWdyYXRpbmcgY29uZmlnIGluZm9ybWF0aW9uLlxuICogQGNsYXNzIExpbmtcbiAqIEBpbXBsZW1lbnRzIFBvcnRcbiAqIEBjb25zdHJ1Y3RvclxuICovXG52YXIgTGluayA9IGZ1bmN0aW9uIChuYW1lLCByZXNvdXJjZSkge1xuICB0aGlzLmlkID0gJ0xpbmsnICsgTWF0aC5yYW5kb20oKTtcbiAgdGhpcy5uYW1lID0gbmFtZTtcbiAgdGhpcy5yZXNvdXJjZSA9IHJlc291cmNlO1xuICB0aGlzLmNvbmZpZyA9IHt9O1xuICB0aGlzLnNyYyA9IG51bGw7XG5cbiAgdXRpbC5oYW5kbGVFdmVudHModGhpcyk7XG4gIHV0aWwubWl4aW4odGhpcywgTGluay5wcm90b3R5cGUpO1xufTtcblxuLyoqXG4gKiBSZWNlaXZlIG1lc3NhZ2VzIGZyb20gdGhlIGh1YiB0byB0aGlzIHBvcnQuXG4gKiBNYW5hZ2VzIHN0YXJ0dXAsIGFuZCBwYXNzZXMgb3RoZXJzIHRvICdkZWxpdmVyTWVzc2FnZScgaW1wbGVtZW50ZWRcbiAqIGluIGRlcml2ZWQgY2xhc3Nlcy5cbiAqIEBtZXRob2Qgb25NZXNzYWdlXG4gKiBAcGFyYW0ge1N0cmluZ30gZmxvdyB0aGUgY2hhbm5lbC9mbG93IG9mIHRoZSBtZXNzYWdlLlxuICogQHBhcmFtIHtPYmplY3R9IG1lc3NhZ2UgVGhlIE1lc3NhZ2UuXG4gKi9cbkxpbmsucHJvdG90eXBlLm9uTWVzc2FnZSA9IGZ1bmN0aW9uIChmbG93LCBtZXNzYWdlKSB7XG4gIGlmIChmbG93ID09PSAnY29udHJvbCcgJiYgIXRoaXMuY29udHJvbENoYW5uZWwpIHtcbiAgICBpZiAoIXRoaXMuY29udHJvbENoYW5uZWwgJiYgbWVzc2FnZS5jaGFubmVsKSB7XG4gICAgICB0aGlzLmNvbnRyb2xDaGFubmVsID0gbWVzc2FnZS5jaGFubmVsO1xuICAgICAgdXRpbC5taXhpbih0aGlzLmNvbmZpZywgbWVzc2FnZS5jb25maWcpO1xuICAgICAgdGhpcy5zdGFydCgpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aGlzLmRlbGl2ZXJNZXNzYWdlKGZsb3csIG1lc3NhZ2UpO1xuICB9XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVyIGEgaGFuZGxlciB0byBhbGVydCBvZiBlcnJvcnMgb24gdGhpcyBwb3J0LlxuICogQG1ldGhvZCBhZGRFcnJvckhhbmRsZXJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIgTWV0aG9kIHRvIGNhbGwgd2l0aCBlcnJvcnMuXG4gKi9cbkxpbmsucHJvdG90eXBlLmFkZEVycm9ySGFuZGxlciA9IGZ1bmN0aW9uIChoYW5kbGVyKSB7XG4gIHRoaXMub25FcnJvciA9IGhhbmRsZXI7XG59O1xuXG4vKipcbiAqIFJlcG9ydCBhbiBlcnJvciBvbiB0aGlzIGxpbmsuXG4gKiBAbWV0aG9kIG9uZXJyb3JcbiAqIEBwYXJhbSB7RXJyb3J9IGVyciBUaGUgZXJyb3IgdGhhdCBvY2N1cnJlZC5cbiAqL1xuTGluay5wcm90b3R5cGUub25FcnJvciA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgLy9GaWxsZWQgaW4gYnkgYWRkRXJyb3JIYW5kbGVyXG59O1xuXG4vKipcbiAqIEVtaXQgbWVzc2FnZXMgdG8gdGhlIHRoZSBodWIsIG1hcHBpbmcgY29udHJvbCBjaGFubmVscy5cbiAqIEBtZXRob2QgZW1pdE1lc3NhZ2VcbiAqIEBwYXJhbSB7U3RyaW5nfSBmbG93IHRoZSBmbG93IHRvIGVtaXQgdGhlIG1lc3NhZ2Ugb24uXG4gKiBAcGFyYW0ge09iamVjdH0gbWVzc2dhZSBUaGUgbWVzc2FnZSB0byBlbWl0LlxuICovXG5MaW5rLnByb3RvdHlwZS5lbWl0TWVzc2FnZSA9IGZ1bmN0aW9uIChmbG93LCBtZXNzYWdlKSB7XG4gIGlmIChmbG93ID09PSAnY29udHJvbCcgJiYgdGhpcy5jb250cm9sQ2hhbm5lbCkge1xuICAgIGZsb3cgPSB0aGlzLmNvbnRyb2xDaGFubmVsO1xuICB9XG4gIHRoaXMuZW1pdChmbG93LCBtZXNzYWdlKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTGluaztcbiIsIi8qanNsaW50IGluZGVudDoyLCB3aGl0ZTp0cnVlLCBub2RlOnRydWUsIHNsb3BweTp0cnVlICovXG52YXIgTGluayA9IHJlcXVpcmUoJy4uL2xpbmsnKTtcbnZhciBlbnRyeSA9IHJlcXVpcmUoJy4uL2VudHJ5Jyk7XG5cbi8qKlxuICogQSBwb3J0IHByb3ZpZGluZyBtZXNzYWdlIHRyYW5zcG9ydCBiZXR3ZWVuIHR3byBmcmVlZG9tIGNvbnRleHRzIGluIHRoZSBzYW1lIG5hbWVzcGFjZS5cbiAqIE5vdGUgdGhhdCB1c2luZyBhIGRpcmVjdCBsaW5rIGRvZXMgbm90IHByb3ZpZGUgdGhlIGlzb2xhdGlvbiB0aGF0IGZyZWVkb20uanNcbiAqIGVuY291cmFnZXMuIFRvIHRoYXQgZW5kIGl0IHNob3VsZCBiZSBsaW1pdGVkIHRvIGEgbWV0aG9kIGZvciB0ZXN0aW5nIGFuZCBub3RcbiAqIHVzZWQgaW4gcHJvZHVjdGlvbiB3aXRob3V0IHNvbWUgc2VyaW91cyB0aG91Z2ggYWJvdXQgdGhlIGltcGxpY2F0aW9ucyBvZiB0aGF0IGRlY2lzaW9uLlxuICogQGNsYXNzIERpcmVjdFxuICogQGV4dGVuZHMgTGlua1xuICogQHVzZXMgaGFuZGxlRXZlbnRzXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmFyIERpcmVjdCA9IGZ1bmN0aW9uKGlkLCByZXNvdXJjZSkge1xuICBMaW5rLmNhbGwodGhpcywgaWQsIHJlc291cmNlKTtcbn07XG5cbi8qKlxuICogU3RhcnQgdGhpcyBwb3J0LlxuICogQG1ldGhvZCBzdGFydFxuICogQHByaXZhdGVcbiAqL1xuRGlyZWN0LnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5jb25maWcubW9kdWxlQ29udGV4dCkge1xuICAgIHRoaXMuY29uZmlnLmdsb2JhbC5kaXJlY3RMaW5rLm90aGVyID0gdGhpcztcbiAgICB0aGlzLm90aGVyID0gdGhpcy5jb25maWcuZ2xvYmFsLmRpcmVjdExpbms7XG4gICAgdGhpcy5vdGhlci5lbWl0KCdzdGFydGVkJyk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5jb25maWcuZ2xvYmFsLmRpcmVjdExpbmsgPSB0aGlzO1xuXG4gICAgLy8gS2VlcCBmZG9tLmRlYnVnIGNvbm5lY3RlZCB0byBwYXJlbnQgaHViLlxuICAgIHZhciBjaGlsZCA9IGVudHJ5KHVuZGVmaW5lZCwge1xuICAgICAgaXNNb2R1bGU6IHRydWUsXG4gICAgICBwb3J0VHlwZTogJ0RpcmVjdCdcbiAgICB9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBTdG9wIHRoaXMgcG9ydCBieSBkZWxldGluZyB0aGUgZnJhbWUuXG4gKiBAbWV0aG9kIHN0b3BcbiAqIEBwcml2YXRlXG4gKi9cbkRpcmVjdC5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcyA9PT0gdGhpcy5jb25maWcuZ2xvYmFsLmRpcmVjdExpbmspIHtcbiAgICBkZWxldGUgdGhpcy5jb25maWcuZ2xvYmFsLmRpcmVjdExpbms7XG4gIH1cbiAgZGVsZXRlIHRoaXMub3RoZXI7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgdGV4dHVhbCBkZXNjcmlwdGlvbiBvZiB0aGlzIHBvcnQuXG4gKiBAbWV0aG9kIHRvU3RyaW5nXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHRoZSBkZXNjcmlwdGlvbiBvZiB0aGlzIHBvcnQuXG4gKi9cbkRpcmVjdC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIFwiW0RpcmVjdFwiICsgdGhpcy5pZCArIFwiXVwiO1xufTtcblxuLyoqXG4gKiBSZWNlaXZlIG1lc3NhZ2VzIGZyb20gdGhlIGh1YiB0byB0aGlzIHBvcnQuXG4gKiBSZWNlaXZlZCBtZXNzYWdlcyB3aWxsIGJlIGVtaXR0ZWQgZnJvbSB0aGUgb3RoZXIgc2lkZSBvZiB0aGUgcG9ydC5cbiAqIEBtZXRob2QgZGVsaXZlck1lc3NhZ2VcbiAqIEBwYXJhbSB7U3RyaW5nfSBmbG93IHRoZSBjaGFubmVsL2Zsb3cgb2YgdGhlIG1lc3NhZ2UuXG4gKiBAcGFyYW0ge09iamVjdH0gbWVzc2FnZSBUaGUgTWVzc2FnZS5cbiAqL1xuRGlyZWN0LnByb3RvdHlwZS5kZWxpdmVyTWVzc2FnZSA9IGZ1bmN0aW9uKGZsb3csIG1lc3NhZ2UpIHtcbiAgaWYgKHRoaXMub3RoZXIpIHtcbiAgICAvKiAvLy0gRm9yIERlYnVnZ2luZyBQdXJwb3NlcyAtXG4gICAgaWYgKHRoaXMgPT09IHRoaXMuY29uZmlnLmdsb2JhbC5kaXJlY3RMaW5rKSB7XG4gICAgICBjb25zb2xlLndhcm4oJy0+WycgKyBmbG93ICsgJ10gJyArIEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS53YXJuKCc8LVsnICsgZmxvdyArICddICcgKyBKU09OLnN0cmluZ2lmeShtZXNzYWdlKSk7XG4gICAgfVxuICAgICovXG4gICAgaWYgKGZsb3cgPT09ICdjb250cm9sJykge1xuICAgICAgZmxvdyA9IHRoaXMub3RoZXIuY29udHJvbENoYW5uZWw7XG4gICAgfVxuICAgIHNldFRpbWVvdXQodGhpcy5vdGhlci5lbWl0LmJpbmQodGhpcy5vdGhlciwgZmxvdywgbWVzc2FnZSksIDApO1xuICB9IGVsc2Uge1xuICAgIHRoaXMub25jZSgnc3RhcnRlZCcsIHRoaXMub25NZXNzYWdlLmJpbmQodGhpcywgZmxvdywgbWVzc2FnZSkpO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IERpcmVjdDtcbiIsIi8qanNsaW50IGluZGVudDoyLCB3aGl0ZTp0cnVlLCBub2RlOnRydWUsIHNsb3BweTp0cnVlICovXG4vKmdsb2JhbHMgVVJMLHdlYmtpdFVSTCAqL1xudmFyIExpbmsgPSByZXF1aXJlKCcuLi9saW5rJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxuLyoqXG4gKiBBIHBvcnQgcHJvdmlkaW5nIG1lc3NhZ2UgdHJhbnNwb3J0IGJldHdlZW4gdHdvIGZyZWVkb20gY29udGV4dHMgdmlhIGlGcmFtZXMuXG4gKiBAY2xhc3MgRnJhbWVcbiAqIEBleHRlbmRzIExpbmtcbiAqIEB1c2VzIGhhbmRsZUV2ZW50c1xuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZhciBGcmFtZSA9IGZ1bmN0aW9uKGlkLCByZXNvdXJjZSkge1xuICBMaW5rLmNhbGwodGhpcywgaWQsIHJlc291cmNlKTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBkb2N1bWVudCB0byB1c2UgZm9yIHRoZSBmcmFtZS4gVGhpcyBhbGxvd3Mgb3ZlcnJpZGVzIGluIGRvd25zdHJlYW1cbiAqIGxpbmtzIHRoYXQgd2FudCB0byBlc3NlbnRpYWxseSBtYWtlIGFuIGlGcmFtZSwgYnV0IG5lZWQgdG8gZG8gaXQgaW4gYW5vdGhlclxuICogY29udGV4dC5cbiAqIEBtZXRob2QgZ2V0RG9jdW1lbnRcbiAqIEBwcm90ZWN0ZWRcbiAqL1xuRnJhbWUucHJvdG90eXBlLmdldERvY3VtZW50ID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmRvY3VtZW50ID0gZG9jdW1lbnQ7XG4gIGlmICghdGhpcy5kb2N1bWVudC5ib2R5KSB7XG4gICAgdGhpcy5kb2N1bWVudC5hcHBlbmRDaGlsZCh0aGlzLmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJib2R5XCIpKTtcbiAgfVxuICB0aGlzLnJvb3QgPSBkb2N1bWVudC5ib2R5O1xufTtcblxuLyoqXG4gKiBTdGFydCB0aGlzIHBvcnQgYnkgbGlzdGVuaW5nIG9yIGNyZWF0aW5nIGEgZnJhbWUuXG4gKiBAbWV0aG9kIHN0YXJ0XG4gKiBAcHJpdmF0ZVxuICovXG5GcmFtZS5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuY29uZmlnLm1vZHVsZUNvbnRleHQpIHtcbiAgICB0aGlzLmNvbmZpZy5nbG9iYWwuREVCVUcgPSB0cnVlO1xuICAgIHRoaXMuc2V0dXBMaXN0ZW5lcigpO1xuICAgIHRoaXMuc3JjID0gJ2luJztcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnNldHVwRnJhbWUoKTtcbiAgICB0aGlzLnNyYyA9ICdvdXQnO1xuICB9XG59O1xuXG4vKipcbiAqIFN0b3AgdGhpcyBwb3J0IGJ5IGRlbGV0aW5nIHRoZSBmcmFtZS5cbiAqIEBtZXRob2Qgc3RvcFxuICogQHByaXZhdGVcbiAqL1xuRnJhbWUucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgLy8gRnVuY3Rpb24gaXMgZGV0ZXJtaW5lZCBieSBzZXR1cExpc3RlbmVyIG9yIHNldHVwRnJhbWUgYXMgYXBwcm9wcmlhdGUuXG59O1xuXG4vKipcbiAqIEdldCB0aGUgdGV4dHVhbCBkZXNjcmlwdGlvbiBvZiB0aGlzIHBvcnQuXG4gKiBAbWV0aG9kIHRvU3RyaW5nXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHRoZSBkZXNjcmlwdGlvbiBvZiB0aGlzIHBvcnQuXG4gKi9cbkZyYW1lLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gXCJbRnJhbWVcIiArIHRoaXMuaWQgKyBcIl1cIjtcbn07XG5cbi8qKlxuICogU2V0IHVwIGEgZ2xvYmFsIGxpc3RlbmVyIHRvIGhhbmRsZSBpbmNvbWluZyBtZXNzYWdlcyB0byB0aGlzXG4gKiBmcmVlZG9tLmpzIGNvbnRleHQuXG4gKiBAbWV0aG9kIHNldHVwTGlzdGVuZXJcbiAqL1xuRnJhbWUucHJvdG90eXBlLnNldHVwTGlzdGVuZXIgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG9uTXNnID0gZnVuY3Rpb24obXNnKSB7XG4gICAgaWYgKG1zZy5kYXRhLnNyYyAhPT0gJ2luJykge1xuICAgICAgdGhpcy5lbWl0TWVzc2FnZShtc2cuZGF0YS5mbG93LCBtc2cuZGF0YS5tZXNzYWdlKTtcbiAgICB9XG4gIH0uYmluZCh0aGlzKTtcbiAgdGhpcy5vYmogPSB0aGlzLmNvbmZpZy5nbG9iYWw7XG4gIHRoaXMub2JqLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBvbk1zZywgdHJ1ZSk7XG4gIHRoaXMuc3RvcCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMub2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBvbk1zZywgdHJ1ZSk7XG4gICAgZGVsZXRlIHRoaXMub2JqO1xuICB9O1xuICB0aGlzLmVtaXQoJ3N0YXJ0ZWQnKTtcbiAgdGhpcy5vYmoucG9zdE1lc3NhZ2UoXCJSZWFkeSBGb3IgTWVzc2FnZXNcIiwgXCIqXCIpO1xufTtcblxuLyoqXG4gKiBHZXQgYSBVUkwgb2YgYSBibG9iIG9iamVjdCBmb3IgaW5jbHVzaW9uIGluIGEgZnJhbWUuXG4gKiBQb2x5ZmlsbHMgaW1wbGVtZW50YXRpb25zIHdoaWNoIGRvbid0IGhhdmUgYSBjdXJyZW50IFVSTCBvYmplY3QsIGxpa2VcbiAqIHBoYW50b21qcy5cbiAqIEBtZXRob2QgZ2V0VVJMXG4gKi9cbkZyYW1lLnByb3RvdHlwZS5nZXRVUkwgPSBmdW5jdGlvbihibG9iKSB7XG4gIGlmICh0eXBlb2YgVVJMICE9PSAnb2JqZWN0JyAmJiB0eXBlb2Ygd2Via2l0VVJMICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiB3ZWJraXRVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICB9XG59O1xuXG4vKipcbiAqIERlYWxsb2NhdGUgdGhlIFVSTCBvZiBhIGJsb2Igb2JqZWN0LlxuICogUG9seWZpbGxzIGltcGxlbWVudGF0aW9ucyB3aGljaCBkb24ndCBoYXZlIGEgY3VycmVudCBVUkwgb2JqZWN0LCBsaWtlXG4gKiBwaGFudG9tanMuXG4gKiBAbWV0aG9kIGdldFVSTFxuICovXG5GcmFtZS5wcm90b3R5cGUucmV2b2tlVVJMID0gZnVuY3Rpb24odXJsKSB7XG4gIGlmICh0eXBlb2YgVVJMICE9PSAnb2JqZWN0JyAmJiB0eXBlb2Ygd2Via2l0VVJMICE9PSAndW5kZWZpbmVkJykge1xuICAgIHdlYmtpdFVSTC5yZXZva2VPYmplY3RVUkwodXJsKTtcbiAgfSBlbHNlIHtcbiAgICBVUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XG4gIH1cbn07XG5cbi8qKlxuICogU2V0IHVwIGFuIGlGcmFtZSB3aXRoIGFuIGlzb2xhdGVkIGZyZWVkb20uanMgY29udGV4dCBpbnNpZGUuXG4gKiBAbWV0aG9kIHNldHVwRnJhbWVcbiAqL1xuRnJhbWUucHJvdG90eXBlLnNldHVwRnJhbWUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGZyYW1lLCBvbk1zZztcbiAgdGhpcy5nZXREb2N1bWVudCgpO1xuICBmcmFtZSA9IHRoaXMubWFrZUZyYW1lKHRoaXMuY29uZmlnLnNvdXJjZSwgdGhpcy5jb25maWcuaW5qZWN0KTtcbiAgXG4gIHRoaXMucm9vdC5hcHBlbmRDaGlsZChmcmFtZSk7XG5cbiAgb25Nc2cgPSBmdW5jdGlvbihmcmFtZSwgbXNnKSB7XG4gICAgaWYgKCF0aGlzLm9iaikge1xuICAgICAgdGhpcy5vYmogPSBmcmFtZTtcbiAgICAgIHRoaXMuZW1pdCgnc3RhcnRlZCcpO1xuICAgIH1cbiAgICBpZiAobXNnLmRhdGEuc3JjICE9PSAnb3V0Jykge1xuICAgICAgdGhpcy5lbWl0TWVzc2FnZShtc2cuZGF0YS5mbG93LCBtc2cuZGF0YS5tZXNzYWdlKTtcbiAgICB9XG4gIH0uYmluZCh0aGlzLCBmcmFtZS5jb250ZW50V2luZG93KTtcblxuICBmcmFtZS5jb250ZW50V2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBvbk1zZywgdHJ1ZSk7XG4gIHRoaXMuc3RvcCA9IGZ1bmN0aW9uKCkge1xuICAgIGZyYW1lLmNvbnRlbnRXaW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIG9uTXNnLCB0cnVlKTtcbiAgICBpZiAodGhpcy5vYmopIHtcbiAgICAgIGRlbGV0ZSB0aGlzLm9iajtcbiAgICB9XG4gICAgdGhpcy5yZXZva2VVUkwoZnJhbWUuc3JjKTtcbiAgICBmcmFtZS5zcmMgPSBcImFib3V0OmJsYW5rXCI7XG4gICAgdGhpcy5yb290LnJlbW92ZUNoaWxkKGZyYW1lKTtcbiAgfTtcbn07XG5cbi8qKlxuICogTWFrZSBmcmFtZXMgdG8gcmVwbGljYXRlIGZyZWVkb20gaXNvbGF0aW9uIHdpdGhvdXQgd2ViLXdvcmtlcnMuXG4gKiBpRnJhbWUgaXNvbGF0aW9uIGlzIG5vbi1zdGFuZGFyZGl6ZWQsIGFuZCBhY2Nlc3MgdG8gdGhlIERPTSB3aXRoaW4gZnJhbWVzXG4gKiBtZWFucyB0aGF0IHRoZXkgYXJlIGluc2VjdXJlLiBIb3dldmVyLCBkZWJ1Z2dpbmcgb2Ygd2Vid29ya2VycyBpc1xuICogcGFpbmZ1bCBlbm91Z2ggdGhhdCB0aGlzIG1vZGUgb2YgZXhlY3V0aW9uIGNhbiBiZSB2YWx1YWJsZSBmb3IgZGVidWdnaW5nLlxuICogQG1ldGhvZCBtYWtlRnJhbWVcbiAqL1xuRnJhbWUucHJvdG90eXBlLm1ha2VGcmFtZSA9IGZ1bmN0aW9uKHNyYywgaW5qZWN0KSB7XG4gIC8vIFRPRE8od2lsbHNjb3R0KTogYWRkIHNhbmRib3hpbmcgcHJvdGVjdGlvbi5cbiAgdmFyIGZyYW1lID0gdGhpcy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKSxcbiAgICAgIGV4dHJhID0gJycsXG4gICAgICBsb2FkZXIsXG4gICAgICBibG9iO1xuXG4gIGlmIChpbmplY3QpIHtcbiAgICBpZiAoIWluamVjdC5sZW5ndGgpIHtcbiAgICAgIGluamVjdCA9IFtpbmplY3RdO1xuICAgIH1cbiAgICBpbmplY3QuZm9yRWFjaChmdW5jdGlvbihzY3JpcHQpIHtcbiAgICAgIGV4dHJhICs9ICc8c2NyaXB0IHNyYz1cIicgKyBzY3JpcHQgKyAnXCIgb25lcnJvcj1cIicgK1xuICAgICAgJ3Rocm93IG5ldyBFcnJvcihcXCdJbmplY3Rpb24gb2YgJyArIHNjcmlwdCArJyBGYWlsZWQhXFwnKTsnICtcbiAgICAgICdcIj48L3NjcmlwdD4nO1xuICAgIH0pO1xuICB9XG4gIGxvYWRlciA9ICc8aHRtbD48bWV0YSBodHRwLWVxdWl2PVwiQ29udGVudC10eXBlXCIgY29udGVudD1cInRleHQvaHRtbDsnICtcbiAgICAnY2hhcnNldD1VVEYtOFwiPicgKyBleHRyYSArICc8c2NyaXB0IHNyYz1cIicgKyBzcmMgKyAnXCIgb25lcnJvcj1cIicgK1xuICAgICd0aHJvdyBuZXcgRXJyb3IoXFwnTG9hZGluZyBvZiAnICsgc3JjICsnIEZhaWxlZCFcXCcpOycgK1xuICAgICdcIj48L3NjcmlwdD48L2h0bWw+JztcbiAgYmxvYiA9IHV0aWwuZ2V0QmxvYihsb2FkZXIsICd0ZXh0L2h0bWwnKTtcbiAgZnJhbWUuc3JjID0gdGhpcy5nZXRVUkwoYmxvYik7XG5cbiAgcmV0dXJuIGZyYW1lO1xufTtcblxuLyoqXG4gKiBSZWNlaXZlIG1lc3NhZ2VzIGZyb20gdGhlIGh1YiB0byB0aGlzIHBvcnQuXG4gKiBSZWNlaXZlZCBtZXNzYWdlcyB3aWxsIGJlIGVtaXR0ZWQgZnJvbSB0aGUgb3RoZXIgc2lkZSBvZiB0aGUgcG9ydC5cbiAqIEBtZXRob2QgZGVsaXZlck1lc3NhZ2VcbiAqIEBwYXJhbSB7U3RyaW5nfSBmbG93IHRoZSBjaGFubmVsL2Zsb3cgb2YgdGhlIG1lc3NhZ2UuXG4gKiBAcGFyYW0ge09iamVjdH0gbWVzc2FnZSBUaGUgTWVzc2FnZS5cbiAqL1xuRnJhbWUucHJvdG90eXBlLmRlbGl2ZXJNZXNzYWdlID0gZnVuY3Rpb24oZmxvdywgbWVzc2FnZSkge1xuICBpZiAodGhpcy5vYmopIHtcbiAgICAvL2Zkb20uZGVidWcubG9nKCdtZXNzYWdlIHNlbnQgdG8gd29ya2VyOiAnLCBmbG93LCBtZXNzYWdlKTtcbiAgICB0aGlzLm9iai5wb3N0TWVzc2FnZSh7XG4gICAgICBzcmM6IHRoaXMuc3JjLFxuICAgICAgZmxvdzogZmxvdyxcbiAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VcbiAgICB9LCAnKicpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMub25jZSgnc3RhcnRlZCcsIHRoaXMub25NZXNzYWdlLmJpbmQodGhpcywgZmxvdywgbWVzc2FnZSkpO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZyYW1lO1xuXG4iLCIvKmpzbGludCBpbmRlbnQ6Mixub2RlOnRydWUsc2xvcHB5OnRydWUgKi9cbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG52YXIgTW9kdWxlSW50ZXJuYWwgPSByZXF1aXJlKCcuL21vZHVsZWludGVybmFsJyk7XG5cbi8qKlxuICogQSBmcmVlZG9tIHBvcnQgd2hpY2ggbWFuYWdlcyB0aGUgY29udHJvbCBwbGFuZSBvZiBvZiBjaGFuZ2luZyBodWIgcm91dGVzLlxuICogQGNsYXNzIE1hbmFnZXJcbiAqIEBpbXBsZW1lbnRzIFBvcnRcbiAqIEBwYXJhbSB7SHVifSBodWIgVGhlIHJvdXRpbmcgaHViIHRvIGNvbnRyb2wuXG4gKiBAcGFyYW0ge1Jlc291cmNlfSByZXNvdXJjZSBUaGUgcmVzb3VyY2UgbWFuYWdlciBmb3IgdGhlIHJ1bnRpbWUuXG4gKiBAcGFyYW0ge0FwaX0gYXBpIFRoZSBBUEkgbWFuYWdlciBmb3IgdGhlIHJ1bnRpbWUuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmFyIE1hbmFnZXIgPSBmdW5jdGlvbiAoaHViLCByZXNvdXJjZSwgYXBpKSB7XG4gIHRoaXMuaWQgPSAnY29udHJvbCc7XG4gIHRoaXMuY29uZmlnID0ge307XG4gIHRoaXMuY29udHJvbEZsb3dzID0ge307XG4gIHRoaXMuZGF0YUZsb3dzID0ge307XG4gIHRoaXMuZGF0YUZsb3dzW3RoaXMuaWRdID0gW107XG4gIHRoaXMucmV2ZXJzZUZsb3dNYXAgPSB7fTtcblxuICB0aGlzLmRlYnVnID0gaHViLmRlYnVnO1xuICB0aGlzLmh1YiA9IGh1YjtcbiAgdGhpcy5yZXNvdXJjZSA9IHJlc291cmNlO1xuICB0aGlzLmFwaSA9IGFwaTtcblxuICB0aGlzLmRlbGVnYXRlID0gbnVsbDtcbiAgdGhpcy50b0RlbGVnYXRlID0ge307XG4gIFxuICB0aGlzLmh1Yi5vbignY29uZmlnJywgZnVuY3Rpb24gKGNvbmZpZykge1xuICAgIHV0aWwubWl4aW4odGhpcy5jb25maWcsIGNvbmZpZyk7XG4gICAgdGhpcy5lbWl0KCdjb25maWcnKTtcbiAgfS5iaW5kKHRoaXMpKTtcbiAgXG4gIHV0aWwuaGFuZGxlRXZlbnRzKHRoaXMpO1xuICB0aGlzLmh1Yi5yZWdpc3Rlcih0aGlzKTtcbn07XG5cbi8qKlxuICogUHJvdmlkZSBhIHRleHR1YWwgZGVzY3JpcHRpb24gb2YgdGhpcyBwb3J0LlxuICogQG1ldGhvZCB0b1N0cmluZ1xuICogQHJldHVybiB7U3RyaW5nfSB0aGUgZGVzY3JpcHRpb24gb2YgdGhpcyBwb3J0LlxuICovXG5NYW5hZ2VyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIFwiW0xvY2FsIENvbnRyb2xsZXJdXCI7XG59O1xuXG4vKipcbiAqIFByb2Nlc3MgbWVzc2FnZXMgc2VudCB0byB0aGlzIHBvcnQuXG4gKiBUaGUgbWFuYWdlciwgb3IgJ2NvbnRyb2wnIGRlc3RpbmF0aW9uIGhhbmRsZXMgc2V2ZXJhbCB0eXBlcyBvZiBtZXNzYWdlcyxcbiAqIGlkZW50aWZpZWQgYnkgdGhlIHJlcXVlc3QgcHJvcGVydHkuICBUaGUgYWN0aW9ucyBhcmU6XG4gKiAxLiBkZWJ1Zy4gUHJpbnRzIHRoZSBtZXNzYWdlIHRvIHRoZSBjb25zb2xlLlxuICogMi4gbGluay4gQ3JlYXRlcyBhIGxpbmsgYmV0d2VlbiB0aGUgc291cmNlIGFuZCBhIHByb3ZpZGVkIGRlc3RpbmF0aW9uIHBvcnQuXG4gKiAzLiBlbnZpcm9ubWVudC4gSW5zdGFudGlhdGUgYSBtb2R1bGUgZW52aXJvbm1lbnQgZGVmaW5lZCBpbiBNb2R1bGVJbnRlcm5hbC5cbiAqIDQuIGRlbGVnYXRlLiBSb3V0ZXMgYSBkZWZpbmVkIHNldCBvZiBjb250cm9sIG1lc3NhZ2VzIHRvIGFub3RoZXIgbG9jYXRpb24uXG4gKiA1LiByZXNvdXJjZS4gUmVnaXN0ZXJzIHRoZSBzb3VyY2UgYXMgYSByZXNvdXJjZSByZXNvbHZlci5cbiAqIDYuIGNvcmUuIEdlbmVyYXRlcyBhIGNvcmUgcHJvdmlkZXIgZm9yIHRoZSByZXF1ZXN0ZXIuXG4gKiA3LiBjbG9zZS4gVGVhcnMgZG93biByb3V0ZXMgaW52b2xpbmcgdGhlIHJlcXVlc3RpbmcgcG9ydC5cbiAqIDguIHVubGluay4gVGVhcnMgZG93biBhIHJvdXRlIGZyb20gdGhlIHJlcXVlc3RpbmcgcG9ydC5cbiAqIEBtZXRob2Qgb25NZXNzYWdlXG4gKiBAcGFyYW0ge1N0cmluZ30gZmxvdyBUaGUgc291cmNlIGlkZW50aWZpZXIgb2YgdGhlIG1lc3NhZ2UuXG4gKiBAcGFyYW0ge09iamVjdH0gbWVzc2FnZSBUaGUgcmVjZWl2ZWQgbWVzc2FnZS5cbiAqL1xuTWFuYWdlci5wcm90b3R5cGUub25NZXNzYWdlID0gZnVuY3Rpb24gKGZsb3csIG1lc3NhZ2UpIHtcbiAgdmFyIHJldmVyc2VGbG93ID0gdGhpcy5jb250cm9sRmxvd3NbZmxvd10sIG9yaWdpbjtcbiAgaWYgKCFyZXZlcnNlRmxvdykge1xuICAgIHRoaXMuZGVidWcud2FybihcIlVua25vd24gbWVzc2FnZSBzb3VyY2U6IFwiICsgZmxvdyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIG9yaWdpbiA9IHRoaXMuaHViLmdldERlc3RpbmF0aW9uKHJldmVyc2VGbG93KTtcblxuICBpZiAodGhpcy5kZWxlZ2F0ZSAmJiByZXZlcnNlRmxvdyAhPT0gdGhpcy5kZWxlZ2F0ZSAmJlxuICAgICAgdGhpcy50b0RlbGVnYXRlW2Zsb3ddKSB7XG4gICAgLy8gU2hpcCBvZmYgdG8gdGhlIGRlbGVnZWVcbiAgICB0aGlzLmVtaXQodGhpcy5kZWxlZ2F0ZSwge1xuICAgICAgdHlwZTogJ0RlbGVnYXRpb24nLFxuICAgICAgcmVxdWVzdDogJ2hhbmRsZScsXG4gICAgICBxdWlldDogdHJ1ZSxcbiAgICAgIGZsb3c6IGZsb3csXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKG1lc3NhZ2UucmVxdWVzdCA9PT0gJ2RlYnVnJykge1xuICAgIHRoaXMuZGVidWcucHJpbnQobWVzc2FnZSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKG1lc3NhZ2UucmVxdWVzdCA9PT0gJ2xpbmsnKSB7XG4gICAgdGhpcy5jcmVhdGVMaW5rKG9yaWdpbiwgbWVzc2FnZS5uYW1lLCBtZXNzYWdlLnRvLCBtZXNzYWdlLm92ZXJyaWRlRGVzdCk7XG4gIH0gZWxzZSBpZiAobWVzc2FnZS5yZXF1ZXN0ID09PSAnZW52aXJvbm1lbnQnKSB7XG4gICAgdGhpcy5jcmVhdGVMaW5rKG9yaWdpbiwgbWVzc2FnZS5uYW1lLCBuZXcgTW9kdWxlSW50ZXJuYWwodGhpcykpO1xuICB9IGVsc2UgaWYgKG1lc3NhZ2UucmVxdWVzdCA9PT0gJ2RlbGVnYXRlJykge1xuICAgIC8vIEluaXRhdGUgRGVsZWdhdGlvbi5cbiAgICBpZiAodGhpcy5kZWxlZ2F0ZSA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5kZWxlZ2F0ZSA9IHJldmVyc2VGbG93O1xuICAgIH1cbiAgICB0aGlzLnRvRGVsZWdhdGVbbWVzc2FnZS5mbG93XSA9IHRydWU7XG4gICAgdGhpcy5lbWl0KCdkZWxlZ2F0ZScpO1xuICB9IGVsc2UgaWYgKG1lc3NhZ2UucmVxdWVzdCA9PT0gJ3Jlc291cmNlJykge1xuICAgIHRoaXMucmVzb3VyY2UuYWRkUmVzb2x2ZXIobWVzc2FnZS5hcmdzWzBdKTtcbiAgICB0aGlzLnJlc291cmNlLmFkZFJldHJpZXZlcihtZXNzYWdlLnNlcnZpY2UsIG1lc3NhZ2UuYXJnc1sxXSk7XG4gIH0gZWxzZSBpZiAobWVzc2FnZS5yZXF1ZXN0ID09PSAnY29yZScpIHtcbiAgICBpZiAodGhpcy5jb3JlICYmIHJldmVyc2VGbG93ID09PSB0aGlzLmRlbGVnYXRlKSB7XG4gICAgICAobmV3IHRoaXMuY29yZSgpKS5vbk1lc3NhZ2Uob3JpZ2luLCBtZXNzYWdlLm1lc3NhZ2UpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmdldENvcmUoZnVuY3Rpb24gKHRvLCBjb3JlKSB7XG4gICAgICB0aGlzLmh1Yi5vbk1lc3NhZ2UodG8sIHtcbiAgICAgICAgdHlwZTogJ2NvcmUnLFxuICAgICAgICBjb3JlOiBjb3JlXG4gICAgICB9KTtcbiAgICB9LmJpbmQodGhpcywgcmV2ZXJzZUZsb3cpKTtcbiAgfSBlbHNlIGlmIChtZXNzYWdlLnJlcXVlc3QgPT09ICdjbG9zZScpIHtcbiAgICB0aGlzLmRlc3Ryb3kob3JpZ2luKTtcbiAgfSBlbHNlIGlmIChtZXNzYWdlLnJlcXVlc3QgPT09ICd1bmxpbmsnKSB7XG4gICAgdGhpcy5yZW1vdmVMaW5rKG9yaWdpbiwgbWVzc2FnZS50byk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5kZWJ1Zy53YXJuKFwiVW5rbm93biBjb250cm9sIHJlcXVlc3Q6IFwiICsgbWVzc2FnZS5yZXF1ZXN0KTtcbiAgICB0aGlzLmRlYnVnLmxvZyhKU09OLnN0cmluZ2lmeShtZXNzYWdlKSk7XG4gICAgcmV0dXJuO1xuICB9XG59O1xuXG4vKipcbiAqIEdldCB0aGUgcG9ydCBtZXNzYWdlcyB3aWxsIGJlIHJvdXRlZCB0byBnaXZlbiBpdHMgaWQuXG4gKiBAbWV0aG9kIGdldFBvcnRcbiAqIEBwYXJhbSB7U3RyaW5nfSBwb3J0SWQgVGhlIElEIG9mIHRoZSBwb3J0LlxuICogQHJldHVybnMge2Zkb20uUG9ydH0gVGhlIHBvcnQgd2l0aCB0aGF0IElELlxuICovXG5NYW5hZ2VyLnByb3RvdHlwZS5nZXRQb3J0ID0gZnVuY3Rpb24gKHBvcnRJZCkge1xuICByZXR1cm4gdGhpcy5odWIuZ2V0RGVzdGluYXRpb24odGhpcy5jb250cm9sRmxvd3NbcG9ydElkXSk7XG59O1xuXG4vKipcbiAqIFNldCB1cCBhIHBvcnQgd2l0aCB0aGUgaHViLlxuICogQG1ldGhvZCBzZXR1cFxuICogQHBhcmFtIHtQb3J0fSBwb3J0IFRoZSBwb3J0IHRvIHJlZ2lzdGVyLlxuICovXG5NYW5hZ2VyLnByb3RvdHlwZS5zZXR1cCA9IGZ1bmN0aW9uIChwb3J0KSB7XG4gIGlmICghcG9ydC5pZCkge1xuICAgIHRoaXMuZGVidWcud2FybihcIlJlZnVzaW5nIHRvIHNldHVwIHVuaWRlbnRpZmllZCBwb3J0IFwiKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAodGhpcy5jb250cm9sRmxvd3NbcG9ydC5pZF0pIHtcbiAgICB0aGlzLmRlYnVnLndhcm4oXCJSZWZ1c2luZyB0byByZS1pbml0aWFsaXplIHBvcnQgXCIgKyBwb3J0LmlkKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoIXRoaXMuY29uZmlnLmdsb2JhbCkge1xuICAgIHRoaXMub25jZSgnY29uZmlnJywgdGhpcy5zZXR1cC5iaW5kKHRoaXMsIHBvcnQpKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLmh1Yi5yZWdpc3Rlcihwb3J0KTtcbiAgdmFyIGZsb3cgPSB0aGlzLmh1Yi5pbnN0YWxsKHRoaXMsIHBvcnQuaWQsIFwiY29udHJvbFwiKSxcbiAgICByZXZlcnNlID0gdGhpcy5odWIuaW5zdGFsbChwb3J0LCB0aGlzLmlkLCBwb3J0LmlkKTtcbiAgdGhpcy5jb250cm9sRmxvd3NbcG9ydC5pZF0gPSBmbG93O1xuICB0aGlzLmRhdGFGbG93c1twb3J0LmlkXSA9IFtyZXZlcnNlXTtcbiAgdGhpcy5yZXZlcnNlRmxvd01hcFtmbG93XSA9IHJldmVyc2U7XG4gIHRoaXMucmV2ZXJzZUZsb3dNYXBbcmV2ZXJzZV0gPSBmbG93O1xuXG4gIGlmIChwb3J0LmxpbmVhZ2UpIHtcbiAgICB0aGlzLmVtaXQoJ21vZHVsZUFkZCcsIHtpZDogcG9ydC5pZCwgbGluZWFnZTogcG9ydC5saW5lYWdlfSk7XG4gIH1cbiAgXG4gIHRoaXMuaHViLm9uTWVzc2FnZShmbG93LCB7XG4gICAgdHlwZTogJ3NldHVwJyxcbiAgICBjaGFubmVsOiByZXZlcnNlLFxuICAgIGNvbmZpZzogdGhpcy5jb25maWdcbiAgfSk7XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIFRlYXIgZG93biBhIHBvcnQgb24gdGhlIGh1Yi5cbiAqIEBtZXRob2QgZGVzdHJveVxuICogQGFwcmFtIHtQb3J0fSBwb3J0IFRoZSBwb3J0IHRvIHVucmVnaXN0ZXIuXG4gKi9cbk1hbmFnZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAocG9ydCkge1xuICBpZiAoIXBvcnQuaWQpIHtcbiAgICB0aGlzLmRlYnVnLndhcm4oXCJVbmFibGUgdG8gdGVhciBkb3duIHVuaWRlbnRpZmllZCBwb3J0XCIpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChwb3J0LmxpbmVhZ2UpIHtcbiAgICB0aGlzLmVtaXQoJ21vZHVsZVJlbW92ZScsIHtpZDogcG9ydC5pZCwgbGluZWFnZTogcG9ydC5saW5lYWdlfSk7XG4gIH1cblxuICAvLyBSZW1vdmUgdGhlIHBvcnQuXG4gIGRlbGV0ZSB0aGlzLmNvbnRyb2xGbG93c1twb3J0LmlkXTtcblxuICAvLyBSZW1vdmUgYXNzb2NpYXRlZCBsaW5rcy5cbiAgdmFyIGk7XG4gIGZvciAoaSA9IHRoaXMuZGF0YUZsb3dzW3BvcnQuaWRdLmxlbmd0aCAtIDE7IGkgPj0gMDsgaSAtPSAxKSB7XG4gICAgdGhpcy5yZW1vdmVMaW5rKHBvcnQsIHRoaXMuZGF0YUZsb3dzW3BvcnQuaWRdW2ldKTtcbiAgfVxuXG4gIC8vIFJlbW92ZSB0aGUgcG9ydC5cbiAgZGVsZXRlIHRoaXMuZGF0YUZsb3dzW3BvcnQuaWRdO1xuICB0aGlzLmh1Yi5kZXJlZ2lzdGVyKHBvcnQpO1xufTtcblxuLyoqXG4gKiBDcmVhdGUgYSBsaW5rIGJldHdlZW4gdHdvIHBvcnRzLiAgTGlua3MgYXJlIGNyZWF0ZWQgaW4gYm90aCBkaXJlY3Rpb25zLFxuICogYW5kIGEgbWVzc2FnZSB3aXRoIHRob3NlIGNhcGFiaWxpdGllcyBpcyBzZW50IHRvIHRoZSBzb3VyY2UgcG9ydC5cbiAqIEBtZXRob2QgY3JlYXRlTGlua1xuICogQHBhcmFtIHtQb3J0fSBwb3J0IFRoZSBzb3VyY2UgcG9ydC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBmbG93IGZvciBtZXNzYWdlcyBmcm9tIGRlc3RpbmF0aW9uIHRvIHBvcnQuXG4gKiBAcGFyYW0ge1BvcnR9IGRlc3RpbmF0aW9uIFRoZSBkZXN0aW5hdGlvbiBwb3J0LlxuICogQHBhcmFtIHtTdHJpbmd9IFtkZXN0TmFtZV0gVGhlIGZsb3cgbmFtZSBmb3IgbWVzc2FnZXMgdG8gdGhlIGRlc3RpbmF0aW9uLlxuICogQHBhcmFtIHtCb29sZWFufSBbdG9EZXN0XSBUZWxsIHRoZSBkZXN0aW5hdGlvbiBhYm91dCB0aGUgbGluay5cbiAqL1xuTWFuYWdlci5wcm90b3R5cGUuY3JlYXRlTGluayA9IGZ1bmN0aW9uIChwb3J0LCBuYW1lLCBkZXN0aW5hdGlvbiwgZGVzdE5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvRGVzdCkge1xuICBpZiAoIXRoaXMuY29uZmlnLmdsb2JhbCkge1xuICAgIHRoaXMub25jZSgnY29uZmlnJyxcbiAgICAgIHRoaXMuY3JlYXRlTGluay5iaW5kKHRoaXMsIHBvcnQsIG5hbWUsIGRlc3RpbmF0aW9uLCBkZXN0TmFtZSkpO1xuICAgIHJldHVybjtcbiAgfVxuICBcbiAgaWYgKCF0aGlzLmNvbnRyb2xGbG93c1twb3J0LmlkXSkge1xuICAgIHRoaXMuZGVidWcud2FybignVW53aWxsaW5nIHRvIGxpbmsgZnJvbSBub24tcmVnaXN0ZXJlZCBzb3VyY2UuJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKCF0aGlzLmNvbnRyb2xGbG93c1tkZXN0aW5hdGlvbi5pZF0pIHtcbiAgICBpZiAodGhpcy5zZXR1cChkZXN0aW5hdGlvbikgPT09IGZhbHNlKSB7XG4gICAgICB0aGlzLmRlYnVnLndhcm4oJ0NvdWxkIG5vdCBmaW5kIG9yIHNldHVwIGRlc3RpbmF0aW9uLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuICB2YXIgcXVpZXQgPSBkZXN0aW5hdGlvbi5xdWlldCB8fCBmYWxzZSxcbiAgICBvdXRnb2luZ05hbWUgPSBkZXN0TmFtZSB8fCAnZGVmYXVsdCcsXG4gICAgb3V0Z29pbmcgPSB0aGlzLmh1Yi5pbnN0YWxsKHBvcnQsIGRlc3RpbmF0aW9uLmlkLCBvdXRnb2luZ05hbWUsIHF1aWV0KSxcbiAgICByZXZlcnNlO1xuXG4gIC8vIFJlY292ZXIgdGhlIHBvcnQgc28gdGhhdCBsaXN0ZW5lcnMgYXJlIGluc3RhbGxlZC5cbiAgZGVzdGluYXRpb24gPSB0aGlzLmh1Yi5nZXREZXN0aW5hdGlvbihvdXRnb2luZyk7XG4gIHJldmVyc2UgPSB0aGlzLmh1Yi5pbnN0YWxsKGRlc3RpbmF0aW9uLCBwb3J0LmlkLCBuYW1lLCBxdWlldCk7XG5cbiAgdGhpcy5yZXZlcnNlRmxvd01hcFtvdXRnb2luZ10gPSByZXZlcnNlO1xuICB0aGlzLmRhdGFGbG93c1twb3J0LmlkXS5wdXNoKG91dGdvaW5nKTtcbiAgdGhpcy5yZXZlcnNlRmxvd01hcFtyZXZlcnNlXSA9IG91dGdvaW5nO1xuICB0aGlzLmRhdGFGbG93c1tkZXN0aW5hdGlvbi5pZF0ucHVzaChyZXZlcnNlKTtcblxuICBpZiAodG9EZXN0KSB7XG4gICAgdGhpcy5odWIub25NZXNzYWdlKHRoaXMuY29udHJvbEZsb3dzW2Rlc3RpbmF0aW9uLmlkXSwge1xuICAgICAgdHlwZTogJ2NyZWF0ZUxpbmsnLFxuICAgICAgbmFtZTogb3V0Z29pbmdOYW1lLFxuICAgICAgY2hhbm5lbDogcmV2ZXJzZSxcbiAgICAgIHJldmVyc2U6IG91dGdvaW5nXG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5odWIub25NZXNzYWdlKHRoaXMuY29udHJvbEZsb3dzW3BvcnQuaWRdLCB7XG4gICAgICBuYW1lOiBuYW1lLFxuICAgICAgdHlwZTogJ2NyZWF0ZUxpbmsnLFxuICAgICAgY2hhbm5lbDogb3V0Z29pbmcsXG4gICAgICByZXZlcnNlOiByZXZlcnNlXG4gICAgfSk7XG4gIH1cbn07XG5cbi8qKlxuICogUmVtb3ZlIGEgbGluayBiZXR3ZWVuIHRvIHBvcnRzLiBUaGUgcmV2ZXJzZSBsaW5rIHdpbGwgYWxzbyBiZSByZW1vdmVkLlxuICogQG1ldGhvZCByZW1vdmVMaW5rXG4gKiBAcGFyYW0ge1BvcnR9IHBvcnQgVGhlIHNvdXJjZSBwb3J0LlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgVGhlIGZsb3cgdG8gYmUgcmVtb3ZlZC5cbiAqL1xuTWFuYWdlci5wcm90b3R5cGUucmVtb3ZlTGluayA9IGZ1bmN0aW9uIChwb3J0LCBuYW1lKSB7XG4gIHZhciByZXZlcnNlID0gdGhpcy5odWIuZ2V0RGVzdGluYXRpb24obmFtZSksXG4gICAgcmZsb3cgPSB0aGlzLnJldmVyc2VGbG93TWFwW25hbWVdLFxuICAgIGk7XG5cbiAgaWYgKCFyZXZlcnNlIHx8ICFyZmxvdykge1xuICAgIHRoaXMuZGVidWcud2FybihcIkNvdWxkIG5vdCBmaW5kIG1ldGFkYXRhIHRvIHJlbW92ZSBmbG93OiBcIiArIG5hbWUpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICh0aGlzLmh1Yi5nZXREZXN0aW5hdGlvbihyZmxvdykuaWQgIT09IHBvcnQuaWQpIHtcbiAgICB0aGlzLmRlYnVnLndhcm4oXCJTb3VyY2UgcG9ydCBkb2VzIG5vdCBvd24gZmxvdyBcIiArIG5hbWUpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIE5vdGlmeSBwb3J0cyB0aGF0IGEgY2hhbm5lbCBpcyBjbG9zaW5nLlxuICBpID0gdGhpcy5jb250cm9sRmxvd3NbcG9ydC5pZF07XG4gIGlmIChpKSB7XG4gICAgdGhpcy5odWIub25NZXNzYWdlKGksIHtcbiAgICAgIHR5cGU6ICdjbG9zZScsXG4gICAgICBjaGFubmVsOiBuYW1lXG4gICAgfSk7XG4gIH1cbiAgaSA9IHRoaXMuY29udHJvbEZsb3dzW3JldmVyc2UuaWRdO1xuICBpZiAoaSkge1xuICAgIHRoaXMuaHViLm9uTWVzc2FnZShpLCB7XG4gICAgICB0eXBlOiAnY2xvc2UnLFxuICAgICAgY2hhbm5lbDogcmZsb3dcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFVuaW5zdGFsbCB0aGUgY2hhbm5lbC5cbiAgdGhpcy5odWIudW5pbnN0YWxsKHBvcnQsIG5hbWUpO1xuICB0aGlzLmh1Yi51bmluc3RhbGwocmV2ZXJzZSwgcmZsb3cpO1xuXG4gIGRlbGV0ZSB0aGlzLnJldmVyc2VGbG93TWFwW25hbWVdO1xuICBkZWxldGUgdGhpcy5yZXZlcnNlRmxvd01hcFtyZmxvd107XG4gIHRoaXMuZm9yZ2V0RmxvdyhyZXZlcnNlLmlkLCByZmxvdyk7XG4gIHRoaXMuZm9yZ2V0Rmxvdyhwb3J0LmlkLCBuYW1lKTtcbn07XG5cbi8qKlxuICogRm9yZ2V0IHRoZSBmbG93IGZyb20gaWQgd2l0aCBhIGdpdmVuIG5hbWUuXG4gKiBAbWV0aG9kIGZvcmdldEZsb3dcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge1N0cmluZ30gaWQgVGhlIHBvcnQgSUQgb2YgdGhlIHNvdXJjZS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBmbG93IG5hbWUuXG4gKi9cbk1hbmFnZXIucHJvdG90eXBlLmZvcmdldEZsb3cgPSBmdW5jdGlvbiAoaWQsIG5hbWUpIHtcbiAgdmFyIGk7XG4gIGlmICh0aGlzLmRhdGFGbG93c1tpZF0pIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5kYXRhRmxvd3NbaWRdLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBpZiAodGhpcy5kYXRhRmxvd3NbaWRdW2ldID09PSBuYW1lKSB7XG4gICAgICAgIHRoaXMuZGF0YUZsb3dzW2lkXS5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBHZXQgdGhlIGNvcmUgZnJlZWRvbS5qcyBBUEkgYWN0aXZlIG9uIHRoZSBjdXJyZW50IGh1Yi5cbiAqIEBtZXRob2QgZ2V0Q29yZVxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIENhbGxiYWNrIHRvIGZpcmUgd2l0aCB0aGUgY29yZSBvYmplY3QuXG4gKi9cbk1hbmFnZXIucHJvdG90eXBlLmdldENvcmUgPSBmdW5jdGlvbiAoY2IpIHtcbiAgaWYgKHRoaXMuY29yZSkge1xuICAgIGNiKHRoaXMuY29yZSk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5hcGkuZ2V0Q29yZSgnY29yZScsIHRoaXMpLnRoZW4oZnVuY3Rpb24gKGNvcmUpIHtcbiAgICAgIHRoaXMuY29yZSA9IGNvcmU7XG4gICAgICBjYih0aGlzLmNvcmUpO1xuICAgIH0uYmluZCh0aGlzKSk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTWFuYWdlcjtcbiIsIi8qanNsaW50IGluZGVudDoyLG5vZGU6dHJ1ZSxzbG9wcHk6dHJ1ZSAqL1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcbnZhciBQcm92aWRlciA9IHJlcXVpcmUoJy4vcHJvdmlkZXInKTtcblxuLyoqXG4gKiBUaGUgZXh0ZXJuYWwgUG9ydCBmYWNlIG9mIGEgbW9kdWxlIG9uIGEgaHViLlxuICogQGNsYXNzIE1vZHVsZVxuICogQGV4dGVuZHMgUG9ydFxuICogQHBhcmFtIHtTdHJpbmd9IG1hbmlmZXN0VVJMIFRoZSBtYW5pZmVzdCB0aGlzIG1vZHVsZSBsb2Fkcy5cbiAqIEBwYXJhbSB7U3RyaW5nW119IGNyZWF0b3IgVGhlIGxpbmVhZ2Ugb2YgY3JlYXRpb24gZm9yIHRoaXMgbW9kdWxlLlxuICogQHBhcmFtIHtQb2xpY3l9IFBvbGljeSBUaGUgcG9saWN5IGxvYWRlciBmb3IgZGVwZW5kZW5jaWVzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZhciBNb2R1bGUgPSBmdW5jdGlvbiAobWFuaWZlc3RVUkwsIG1hbmlmZXN0LCBjcmVhdG9yLCBwb2xpY3kpIHtcbiAgdGhpcy5hcGkgPSBwb2xpY3kuYXBpO1xuICB0aGlzLnBvbGljeSA9IHBvbGljeTtcbiAgdGhpcy5yZXNvdXJjZSA9IHBvbGljeS5yZXNvdXJjZTtcbiAgdGhpcy5kZWJ1ZyA9IHBvbGljeS5kZWJ1ZztcblxuICB0aGlzLmNvbmZpZyA9IHt9O1xuXG4gIHRoaXMuaWQgPSBtYW5pZmVzdFVSTCArIE1hdGgucmFuZG9tKCk7XG4gIHRoaXMubWFuaWZlc3RJZCA9IG1hbmlmZXN0VVJMO1xuICB0aGlzLm1hbmlmZXN0ID0gbWFuaWZlc3Q7XG4gIHRoaXMubGluZWFnZSA9IFt0aGlzLm1hbmlmZXN0SWRdLmNvbmNhdChjcmVhdG9yKTtcblxuICB0aGlzLnF1aWV0ID0gdGhpcy5tYW5pZmVzdC5xdWlldCB8fCBmYWxzZTtcblxuICB0aGlzLmV4dGVybmFsUG9ydE1hcCA9IHt9O1xuICB0aGlzLmludGVybmFsUG9ydE1hcCA9IHt9O1xuICB0aGlzLmRlcGVuZGFudENoYW5uZWxzID0gW107XG4gIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xuXG4gIHV0aWwuaGFuZGxlRXZlbnRzKHRoaXMpO1xufTtcblxuLyoqXG4gKiBSZWNlaXZlIGEgbWVzc2FnZSBmb3IgdGhlIE1vZHVsZS5cbiAqIEBtZXRob2Qgb25NZXNzYWdlXG4gKiBAcGFyYW0ge1N0cmluZ30gZmxvdyBUaGUgb3JpZ2luIG9mIHRoZSBtZXNzYWdlLlxuICogQHBhcmFtIHtPYmplY3R9IG1lc3NhZ2UgVGhlIG1lc3NhZ2UgcmVjZWl2ZWQuXG4gKi9cbk1vZHVsZS5wcm90b3R5cGUub25NZXNzYWdlID0gZnVuY3Rpb24gKGZsb3csIG1lc3NhZ2UpIHtcbiAgaWYgKGZsb3cgPT09ICdjb250cm9sJykge1xuICAgIGlmIChtZXNzYWdlLnR5cGUgPT09ICdzZXR1cCcpIHtcbiAgICAgIHRoaXMuY29udHJvbENoYW5uZWwgPSBtZXNzYWdlLmNoYW5uZWw7XG4gICAgICB1dGlsLm1peGluKHRoaXMuY29uZmlnLCBtZXNzYWdlLmNvbmZpZyk7XG4gICAgICB0aGlzLmVtaXQodGhpcy5jb250cm9sQ2hhbm5lbCwge1xuICAgICAgICB0eXBlOiAnQ29yZSBQcm92aWRlcicsXG4gICAgICAgIHJlcXVlc3Q6ICdjb3JlJ1xuICAgICAgfSk7XG4gICAgICB0aGlzLnN0YXJ0KCk7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmIChtZXNzYWdlLnR5cGUgPT09ICdjcmVhdGVMaW5rJyAmJiBtZXNzYWdlLmNoYW5uZWwpIHtcbiAgICAgIHRoaXMuZGVidWcuZGVidWcodGhpcyArICdnb3QgY3JlYXRlIGxpbmsgZm9yICcgKyBtZXNzYWdlLm5hbWUpO1xuICAgICAgdGhpcy5leHRlcm5hbFBvcnRNYXBbbWVzc2FnZS5uYW1lXSA9IG1lc3NhZ2UuY2hhbm5lbDtcbiAgICAgIGlmICh0aGlzLmludGVybmFsUG9ydE1hcFttZXNzYWdlLm5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5pbnRlcm5hbFBvcnRNYXBbbWVzc2FnZS5uYW1lXSA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgdmFyIG1zZyA9IHtcbiAgICAgICAgdHlwZTogJ2RlZmF1bHQgY2hhbm5lbCBhbm5vdW5jZW1lbnQnLFxuICAgICAgICBjaGFubmVsOiBtZXNzYWdlLnJldmVyc2VcbiAgICAgIH07XG4gICAgICBpZiAodGhpcy5tYW5pZmVzdC5kZXBlbmRlbmNpZXMgJiZcbiAgICAgICAgICB0aGlzLm1hbmlmZXN0LmRlcGVuZGVuY2llc1ttZXNzYWdlLm5hbWVdKSB7XG4gICAgICAgIG1zZy5hcGkgPSB0aGlzLm1hbmlmZXN0LmRlcGVuZGVuY2llc1ttZXNzYWdlLm5hbWVdLmFwaTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZW1pdChtZXNzYWdlLmNoYW5uZWwsIG1zZyk7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmIChtZXNzYWdlLmNvcmUpIHtcbiAgICAgIHRoaXMuY29yZSA9IG5ldyBtZXNzYWdlLmNvcmUoKTtcbiAgICAgIHRoaXMuZW1pdCgnY29yZScsIG1lc3NhZ2UuY29yZSk7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmIChtZXNzYWdlLnR5cGUgPT09ICdjbG9zZScpIHtcbiAgICAgIC8vIENsb3NpbmcgY2hhbm5lbC5cbiAgICAgIGlmIChtZXNzYWdlLmNoYW5uZWwgPT09ICdjb250cm9sJykge1xuICAgICAgICB0aGlzLnN0b3AoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZGVyZWdpc3RlckZsb3cobWVzc2FnZS5jaGFubmVsLCBmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucG9ydC5vbk1lc3NhZ2UoZmxvdywgbWVzc2FnZSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmICgodGhpcy5leHRlcm5hbFBvcnRNYXBbZmxvd10gPT09IGZhbHNlIHx8XG4gICAgICAgICF0aGlzLmV4dGVybmFsUG9ydE1hcFtmbG93XSkgJiYgbWVzc2FnZS5jaGFubmVsKSB7XG4gICAgICB0aGlzLmRlYnVnLmRlYnVnKHRoaXMgKyAnaGFuZGxpbmcgY2hhbm5lbCBhbm5vdW5jZW1lbnQgZm9yICcgKyBmbG93KTtcbiAgICAgIHRoaXMuZXh0ZXJuYWxQb3J0TWFwW2Zsb3ddID0gbWVzc2FnZS5jaGFubmVsO1xuICAgICAgaWYgKHRoaXMuaW50ZXJuYWxQb3J0TWFwW2Zsb3ddID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5pbnRlcm5hbFBvcnRNYXBbZmxvd10gPSBmYWxzZTtcblxuICAgICAgICAvLyBOZXcgaW5jb21pbmcgY29ubmVjdGlvbiBhdHRlbXB0cyBzaG91bGQgZ2V0IHJvdXRlZCB0byBtb2RJbnRlcm5hbC5cbiAgICAgICAgaWYgKHRoaXMubWFuaWZlc3QucHJvdmlkZXMgJiYgdGhpcy5tb2RJbnRlcm5hbCkge1xuICAgICAgICAgIHRoaXMucG9ydC5vbk1lc3NhZ2UodGhpcy5tb2RJbnRlcm5hbCwge1xuICAgICAgICAgICAgdHlwZTogJ0Nvbm5lY3Rpb24nLFxuICAgICAgICAgICAgY2hhbm5lbDogZmxvdyxcbiAgICAgICAgICAgIGFwaTogbWVzc2FnZS5hcGlcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLm1hbmlmZXN0LnByb3ZpZGVzKSB7XG4gICAgICAgICAgdGhpcy5vbmNlKCdtb2RJbnRlcm5hbCcsIGZ1bmN0aW9uIChmbG93LCBhcGkpIHtcbiAgICAgICAgICAgIHRoaXMucG9ydC5vbk1lc3NhZ2UodGhpcy5tb2RJbnRlcm5hbCwge1xuICAgICAgICAgICAgICB0eXBlOiAnQ29ubmVjdGlvbicsXG4gICAgICAgICAgICAgIGNoYW5uZWw6IGZsb3csXG4gICAgICAgICAgICAgIGFwaTogYXBpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LmJpbmQodGhpcywgZmxvdywgbWVzc2FnZS5hcGkpKTtcbiAgICAgICAgLy8gRmlyc3QgY29ubmVjdGlvbiByZXRhaW5zIGxlZ2FjeSBtYXBwaW5nIGFzICdkZWZhdWx0Jy5cbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5leHRlcm5hbFBvcnRNYXBbJ2RlZmF1bHQnXSAmJiBtZXNzYWdlLmNoYW5uZWwpIHtcbiAgICAgICAgICB0aGlzLmV4dGVybmFsUG9ydE1hcFsnZGVmYXVsdCddID0gbWVzc2FnZS5jaGFubmVsO1xuICAgICAgICAgIHRoaXMub25jZSgnaW50ZXJuYWxDaGFubmVsUmVhZHknLCBmdW5jdGlvbiAoZmxvdykge1xuICAgICAgICAgICAgdGhpcy5pbnRlcm5hbFBvcnRNYXBbZmxvd10gPSB0aGlzLmludGVybmFsUG9ydE1hcFsnZGVmYXVsdCddO1xuICAgICAgICAgIH0uYmluZCh0aGlzLCBmbG93KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYgKCF0aGlzLnN0YXJ0ZWQpIHtcbiAgICAgIHRoaXMub25jZSgnc3RhcnQnLCB0aGlzLm9uTWVzc2FnZS5iaW5kKHRoaXMsIGZsb3csIG1lc3NhZ2UpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMuaW50ZXJuYWxQb3J0TWFwW2Zsb3ddID09PSBmYWxzZSkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ3dhaXRpbmcgb24gaW50ZXJuYWwgY2hhbm5lbCBmb3IgbXNnJyk7XG4gICAgICAgIHRoaXMub25jZSgnaW50ZXJuYWxDaGFubmVsUmVhZHknLCB0aGlzLm9uTWVzc2FnZS5iaW5kKHRoaXMsIGZsb3csIG1lc3NhZ2UpKTtcbiAgICAgIH0gZWxzZSBpZiAoIXRoaXMuaW50ZXJuYWxQb3J0TWFwW2Zsb3ddKSB7XG4gICAgICAgIHRoaXMuZGVidWcuZXJyb3IoJ1VuZXhwZWN0ZWQgbWVzc2FnZSBmcm9tICcgKyBmbG93KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5wb3J0Lm9uTWVzc2FnZSh0aGlzLmludGVybmFsUG9ydE1hcFtmbG93XSwgbWVzc2FnZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIENsZWFuIHVwIGFmdGVyIGEgZmxvdyB3aGljaCBpcyBubyBsb25nZXIgdXNlZCAvIG5lZWRlZC5cbiAqIEBtZXRob2QgZGVyZWdpc3RlckZMb3dcbiAqIEBwYXJhbSB7U3RyaW5nfSBmbG93IFRoZSBmbG93IHRvIHJlbW92ZSBtYXBwaW5ncyBmb3IuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGludGVybmFsIElmIHRoZSBmbG93IG5hbWUgaXMgdGhlIGludGVybmFsIGlkZW50aWZpZXIuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gV2hldGhlciB0aGUgZmxvdyB3YXMgc3VjY2Vzc2Z1bGx5IGRlcmVnaXN0ZXJlZC5cbiAqIEBwcml2YXRlXG4gKi9cbk1vZHVsZS5wcm90b3R5cGUuZGVyZWdpc3RlckZsb3cgPSBmdW5jdGlvbiAoZmxvdywgaW50ZXJuYWwpIHtcbiAgdmFyIGtleSxcbiAgICBtYXAgPSBpbnRlcm5hbCA/IHRoaXMuaW50ZXJuYWxQb3J0TWFwIDogdGhpcy5leHRlcm5hbFBvcnRNYXA7XG4gIC8vIFRPRE86IHRoaXMgaXMgaW5lZmZpY2llbnQsIGJ1dCBzZWVtcyBsZXNzIGNvbmZ1c2luZyB0aGFuIGEgM3JkXG4gIC8vIHJldmVyc2UgbG9va3VwIG1hcC5cbiAgZm9yIChrZXkgaW4gbWFwKSB7XG4gICAgaWYgKG1hcFtrZXldID09PSBmbG93KSB7XG4gICAgICBpZiAoaW50ZXJuYWwpIHtcbiAgICAgICAgdGhpcy5lbWl0KHRoaXMuY29udHJvbENoYW5uZWwsIHtcbiAgICAgICAgICB0eXBlOiAnQ2hhbm5lbCBUZWFyZG93bicsXG4gICAgICAgICAgcmVxdWVzdDogJ3VubGluaycsXG4gICAgICAgICAgdG86IHRoaXMuZXh0ZXJuYWxQb3J0TWFwW2tleV1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnBvcnQub25NZXNzYWdlKCdjb250cm9sJywge1xuICAgICAgICAgIHR5cGU6ICdjbG9zZScsXG4gICAgICAgICAgY2hhbm5lbDogdGhpcy5pbnRlcm5hbFBvcnRNYXBba2V5XVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGRlbGV0ZSB0aGlzLmV4dGVybmFsUG9ydE1hcFtrZXldO1xuICAgICAgZGVsZXRlIHRoaXMuaW50ZXJuYWxQb3J0TWFwW2tleV07XG5cbiAgICAgIC8vIFdoZW4gdGhlcmUgYXJlIHN0aWxsIG5vbi1kZXBlbmRhbnQgY2hhbm5lbHMsIGtlZXAgcnVubmluZ1xuICAgICAgZm9yIChrZXkgaW4gdGhpcy5leHRlcm5hbFBvcnRNYXApIHtcbiAgICAgICAgaWYgKHRoaXMuZXh0ZXJuYWxQb3J0TWFwLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICBpZiAodGhpcy5kZXBlbmRhbnRDaGFubmVscy5pbmRleE9mKGtleSkgPCAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIE90aGVyd2lzZSBzaHV0IGRvd24gdGhlIG1vZHVsZS5cbiAgICAgIHRoaXMuc3RvcCgpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbi8qKlxuICogQXR0ZW1wdCB0byBzdGFydCB0aGUgbW9kdWxlIG9uY2UgdGhlIHJlbW90ZSBmcmVlZG9tIGNvbnRleHRcbiAqIGV4aXN0cy5cbiAqIEBtZXRob2Qgc3RhcnRcbiAqIEBwcml2YXRlXG4gKi9cbk1vZHVsZS5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBQb3J0O1xuICBpZiAodGhpcy5zdGFydGVkIHx8IHRoaXMucG9ydCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodGhpcy5jb250cm9sQ2hhbm5lbCkge1xuICAgIHRoaXMubG9hZExpbmtzKCk7XG4gICAgUG9ydCA9IHRoaXMuY29uZmlnLnBvcnRUeXBlO1xuICAgIHRoaXMucG9ydCA9IG5ldyBQb3J0KHRoaXMubWFuaWZlc3QubmFtZSwgdGhpcy5yZXNvdXJjZSk7XG4gICAgLy8gTGlzdGVuIHRvIGFsbCBwb3J0IG1lc3NhZ2VzLlxuICAgIHRoaXMucG9ydC5vbih0aGlzLmVtaXRNZXNzYWdlLmJpbmQodGhpcykpO1xuICAgIHRoaXMucG9ydC5hZGRFcnJvckhhbmRsZXIoZnVuY3Rpb24gKGVycikge1xuICAgICAgdGhpcy5kZWJ1Zy53YXJuKCdNb2R1bGUgRmFpbGVkJywgZXJyKTtcbiAgICAgIHRoaXMuc3RvcCgpO1xuICAgIH0uYmluZCh0aGlzKSk7XG4gICAgLy8gVGVsbCB0aGUgbG9jYWwgcG9ydCB0byBhc2sgdXMgZm9yIGhlbHAuXG4gICAgdGhpcy5wb3J0Lm9uTWVzc2FnZSgnY29udHJvbCcsIHtcbiAgICAgIGNoYW5uZWw6ICdjb250cm9sJyxcbiAgICAgIGNvbmZpZzogdGhpcy5jb25maWdcbiAgICB9KTtcblxuICAgIC8vIFRlbGwgdGhlIHJlbW90ZSBsb2NhdGlvbiB0byBkZWxlZ2F0ZSBkZWJ1Z2dpbmcuXG4gICAgdGhpcy5wb3J0Lm9uTWVzc2FnZSgnY29udHJvbCcsIHtcbiAgICAgIHR5cGU6ICdSZWRpcmVjdCcsXG4gICAgICByZXF1ZXN0OiAnZGVsZWdhdGUnLFxuICAgICAgZmxvdzogJ2RlYnVnJ1xuICAgIH0pO1xuICAgIHRoaXMucG9ydC5vbk1lc3NhZ2UoJ2NvbnRyb2wnLCB7XG4gICAgICB0eXBlOiAnUmVkaXJlY3QnLFxuICAgICAgcmVxdWVzdDogJ2RlbGVnYXRlJyxcbiAgICAgIGZsb3c6ICdjb3JlJ1xuICAgIH0pO1xuICAgIFxuICAgIC8vIFRlbGwgdGhlIGNvbnRhaW5lciB0byBpbnN0YW50aWF0ZSB0aGUgY291bnRlcnBhcnQgdG8gdGhpcyBleHRlcm5hbCB2aWV3LlxuICAgIHRoaXMucG9ydC5vbk1lc3NhZ2UoJ2NvbnRyb2wnLCB7XG4gICAgICB0eXBlOiAnRW52aXJvbm1lbnQgQ29uZmlndXJhdGlvbicsXG4gICAgICByZXF1ZXN0OiAnZW52aXJvbm1lbnQnLFxuICAgICAgbmFtZTogJ01vZEludGVybmFsJ1xuICAgIH0pO1xuICB9XG59O1xuXG4vKipcbiAqIFN0b3AgdGhlIG1vZHVsZSB3aGVuIGl0IGlzIG5vIGxvbmdlciBuZWVkZWQsIGFuZCB0ZWFyLWRvd24gc3RhdGUuXG4gKiBAbWV0aG9kIHN0b3BcbiAqIEBwcml2YXRlXG4gKi9cbk1vZHVsZS5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKCF0aGlzLnN0YXJ0ZWQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5lbWl0KCdjbG9zZScpO1xuICBpZiAodGhpcy5wb3J0KSB7XG4gICAgdGhpcy5wb3J0Lm9mZigpO1xuICAgIHRoaXMucG9ydC5vbk1lc3NhZ2UoJ2NvbnRyb2wnLCB7XG4gICAgICB0eXBlOiAnY2xvc2UnLFxuICAgICAgY2hhbm5lbDogJ2NvbnRyb2wnXG4gICAgfSk7XG4gICAgdGhpcy5wb3J0LnN0b3AoKTtcbiAgICBkZWxldGUgdGhpcy5wb3J0O1xuICB9XG4gIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xufTtcblxuLyoqXG4gKiBUZXh0dWFsIERlc2NyaXB0aW9uIG9mIHRoZSBQb3J0XG4gKiBAbWV0aG9kIHRvU3RyaW5nXG4gKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBkZXNjcmlwdGlvbiBvZiB0aGlzIFBvcnQuXG4gKi9cbk1vZHVsZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBcIltNb2R1bGUgXCIgKyB0aGlzLm1hbmlmZXN0Lm5hbWUgKyBcIl1cIjtcbn07XG5cbi8qKlxuICogSW50ZXJjZXB0IG1lc3NhZ2VzIGFzIHRoZXkgYXJyaXZlIGZyb20gdGhlIG1vZHVsZSxcbiAqIG1hcHBpbmcgdGhlbSBiZXR3ZWVuIGludGVybmFsIGFuZCBleHRlcm5hbCBmbG93IG5hbWVzLlxuICogQG1ldGhvZCBlbWl0TWVzc2FnZVxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgVGhlIGRlc3RpbmF0aW9uIHRoZSBtb2R1bGUgd2FudHMgdG8gc2VuZCB0by5cbiAqIEBwYXJhbSB7T2JqZWN0fSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIHNlbmQuXG4gKiBAcHJpdmF0ZVxuICovXG5Nb2R1bGUucHJvdG90eXBlLmVtaXRNZXNzYWdlID0gZnVuY3Rpb24gKG5hbWUsIG1lc3NhZ2UpIHtcbiAgaWYgKHRoaXMuaW50ZXJuYWxQb3J0TWFwW25hbWVdID09PSBmYWxzZSAmJiBtZXNzYWdlLmNoYW5uZWwpIHtcbiAgICB0aGlzLmludGVybmFsUG9ydE1hcFtuYW1lXSA9IG1lc3NhZ2UuY2hhbm5lbDtcbiAgICB0aGlzLmVtaXQoJ2ludGVybmFsQ2hhbm5lbFJlYWR5Jyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIC8vIFRlcm1pbmF0ZSBkZWJ1ZyByZWRpcmVjdGlvbiByZXF1ZXN0ZWQgaW4gc3RhcnQoKS5cbiAgaWYgKG5hbWUgPT09ICdjb250cm9sJykge1xuICAgIGlmIChtZXNzYWdlLmZsb3cgPT09ICdkZWJ1ZycgJiYgbWVzc2FnZS5tZXNzYWdlKSB7XG4gICAgICB0aGlzLmRlYnVnLmZvcm1hdChtZXNzYWdlLm1lc3NhZ2Uuc2V2ZXJpdHksXG4gICAgICAgICAgbWVzc2FnZS5tZXNzYWdlLnNvdXJjZSB8fCB0aGlzLnRvU3RyaW5nKCksXG4gICAgICAgICAgbWVzc2FnZS5tZXNzYWdlLm1zZyk7XG4gICAgfSBlbHNlIGlmIChtZXNzYWdlLmZsb3cgPT09ICdjb3JlJyAmJiBtZXNzYWdlLm1lc3NhZ2UpIHtcbiAgICAgIGlmICghdGhpcy5jb3JlKSB7XG4gICAgICAgIHRoaXMub25jZSgnY29yZScsIHRoaXMuZW1pdE1lc3NhZ2UuYmluZCh0aGlzLCBuYW1lLCBtZXNzYWdlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChtZXNzYWdlLm1lc3NhZ2UudHlwZSA9PT0gJ3JlZ2lzdGVyJykge1xuICAgICAgICBtZXNzYWdlLm1lc3NhZ2UucmVwbHkgPSB0aGlzLnBvcnQub25NZXNzYWdlLmJpbmQodGhpcy5wb3J0LCAnY29udHJvbCcpO1xuICAgICAgICB0aGlzLmV4dGVybmFsUG9ydE1hcFttZXNzYWdlLm1lc3NhZ2UuaWRdID0gZmFsc2U7XG4gICAgICB9XG4gICAgICB0aGlzLmNvcmUub25NZXNzYWdlKHRoaXMsIG1lc3NhZ2UubWVzc2FnZSk7XG4gICAgfSBlbHNlIGlmIChtZXNzYWdlLm5hbWUgPT09ICdNb2RJbnRlcm5hbCcgJiYgIXRoaXMubW9kSW50ZXJuYWwpIHtcbiAgICAgIHRoaXMubW9kSW50ZXJuYWwgPSBtZXNzYWdlLmNoYW5uZWw7XG4gICAgICB0aGlzLnBvcnQub25NZXNzYWdlKHRoaXMubW9kSW50ZXJuYWwsIHtcbiAgICAgICAgdHlwZTogJ0luaXRpYWxpemF0aW9uJyxcbiAgICAgICAgaWQ6IHRoaXMubWFuaWZlc3RJZCxcbiAgICAgICAgYXBwSWQ6IHRoaXMuaWQsXG4gICAgICAgIG1hbmlmZXN0OiB0aGlzLm1hbmlmZXN0LFxuICAgICAgICBsaW5lYWdlOiB0aGlzLmxpbmVhZ2UsXG4gICAgICAgIGNoYW5uZWw6IG1lc3NhZ2UucmV2ZXJzZVxuICAgICAgfSk7XG4gICAgICB0aGlzLmVtaXQoJ21vZEludGVybmFsJyk7XG4gICAgfSBlbHNlIGlmIChtZXNzYWdlLnR5cGUgPT09ICdjcmVhdGVMaW5rJykge1xuICAgICAgdGhpcy5pbnRlcm5hbFBvcnRNYXBbbWVzc2FnZS5uYW1lXSA9IG1lc3NhZ2UuY2hhbm5lbDtcbiAgICAgIHRoaXMucG9ydC5vbk1lc3NhZ2UobWVzc2FnZS5jaGFubmVsLCB7XG4gICAgICAgIHR5cGU6ICdjaGFubmVsIGFubm91bmNlbWVudCcsXG4gICAgICAgIGNoYW5uZWw6IG1lc3NhZ2UucmV2ZXJzZVxuICAgICAgfSk7XG4gICAgICB0aGlzLmVtaXQoJ2ludGVybmFsQ2hhbm5lbFJlYWR5Jyk7XG4gICAgfSBlbHNlIGlmIChtZXNzYWdlLnR5cGUgPT09ICdjbG9zZScpIHtcbiAgICAgIHRoaXMuZGVyZWdpc3RlckZsb3cobWVzc2FnZS5jaGFubmVsLCB0cnVlKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAobmFtZSA9PT0gJ01vZEludGVybmFsJyAmJiBtZXNzYWdlLnR5cGUgPT09ICdyZWFkeScgJiYgIXRoaXMuc3RhcnRlZCkge1xuICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XG4gICAgdGhpcy5lbWl0KCdzdGFydCcpO1xuICB9IGVsc2UgaWYgKG5hbWUgPT09ICdNb2RJbnRlcm5hbCcgJiYgbWVzc2FnZS50eXBlID09PSAncmVzb2x2ZScpIHtcbiAgICB0aGlzLnJlc291cmNlLmdldCh0aGlzLm1hbmlmZXN0SWQsIG1lc3NhZ2UuZGF0YSkudGhlbihmdW5jdGlvbiAoaWQsIGRhdGEpIHtcbiAgICAgIHRoaXMucG9ydC5vbk1lc3NhZ2UodGhpcy5tb2RJbnRlcm5hbCwge1xuICAgICAgICB0eXBlOiAncmVzb2x2ZSByZXNwb25zZScsXG4gICAgICAgIGlkOiBpZCxcbiAgICAgICAgZGF0YTogZGF0YVxuICAgICAgfSk7XG4gICAgfS5iaW5kKHRoaXMsIG1lc3NhZ2UuaWQpLCBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmRlYnVnLndhcm4oJ0Vycm9yIFJlc29sdmluZyBVUkwgZm9yIE1vZHVsZS4nKTtcbiAgICB9LmJpbmQodGhpcykpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuZW1pdCh0aGlzLmV4dGVybmFsUG9ydE1hcFtuYW1lXSwgbWVzc2FnZSk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBSZXF1ZXN0IHRoZSBleHRlcm5hbCByb3V0ZXMgdXNlZCBieSB0aGlzIG1vZHVsZS5cbiAqIEBtZXRob2QgbG9hZExpbmtzXG4gKiBAcHJpdmF0ZVxuICovXG5Nb2R1bGUucHJvdG90eXBlLmxvYWRMaW5rcyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGksIGNoYW5uZWxzID0gWydkZWZhdWx0J10sIG5hbWUsIGRlcCxcbiAgICBmaW5pc2hMaW5rID0gZnVuY3Rpb24gKGRlcCwgbmFtZSwgcHJvdmlkZXIpIHtcbiAgICAgIHZhciBzdHlsZSA9IHRoaXMuYXBpLmdldEludGVyZmFjZVN0eWxlKG5hbWUpO1xuICAgICAgZGVwLmdldEludGVyZmFjZSgpW3N0eWxlXShwcm92aWRlcik7XG4gICAgfTtcbiAgaWYgKHRoaXMubWFuaWZlc3QucGVybWlzc2lvbnMpIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5tYW5pZmVzdC5wZXJtaXNzaW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgbmFtZSA9IHRoaXMubWFuaWZlc3QucGVybWlzc2lvbnNbaV07XG4gICAgICBpZiAoY2hhbm5lbHMuaW5kZXhPZihuYW1lKSA8IDAgJiYgbmFtZS5pbmRleE9mKCdjb3JlLicpID09PSAwKSB7XG4gICAgICAgIGNoYW5uZWxzLnB1c2gobmFtZSk7XG4gICAgICAgIHRoaXMuZGVwZW5kYW50Q2hhbm5lbHMucHVzaChuYW1lKTtcbiAgICAgICAgZGVwID0gbmV3IFByb3ZpZGVyKHRoaXMuYXBpLmdldChuYW1lKS5kZWZpbml0aW9uLCB0aGlzLmRlYnVnKTtcbiAgICAgICAgdGhpcy5hcGkuZ2V0Q29yZShuYW1lLCB0aGlzKS50aGVuKGZpbmlzaExpbmsuYmluZCh0aGlzLCBkZXAsIG5hbWUpKTtcblxuICAgICAgICB0aGlzLmVtaXQodGhpcy5jb250cm9sQ2hhbm5lbCwge1xuICAgICAgICAgIHR5cGU6ICdDb3JlIExpbmsgdG8gJyArIG5hbWUsXG4gICAgICAgICAgcmVxdWVzdDogJ2xpbmsnLFxuICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgdG86IGRlcFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKHRoaXMubWFuaWZlc3QuZGVwZW5kZW5jaWVzKSB7XG4gICAgdXRpbC5lYWNoUHJvcCh0aGlzLm1hbmlmZXN0LmRlcGVuZGVuY2llcywgZnVuY3Rpb24gKGRlc2MsIG5hbWUpIHtcbiAgICAgIGlmIChjaGFubmVscy5pbmRleE9mKG5hbWUpIDwgMCkge1xuICAgICAgICBjaGFubmVscy5wdXNoKG5hbWUpO1xuICAgICAgICB0aGlzLmRlcGVuZGFudENoYW5uZWxzLnB1c2gobmFtZSk7XG4gICAgICB9XG4gICAgICB0aGlzLnJlc291cmNlLmdldCh0aGlzLm1hbmlmZXN0SWQsIGRlc2MudXJsKS50aGVuKGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgICAgdGhpcy5wb2xpY3kuZ2V0KHRoaXMubGluZWFnZSwgdXJsKS50aGVuKGZ1bmN0aW9uIChkZXApIHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUVudihuYW1lLCBkZXAubWFuaWZlc3QpO1xuICAgICAgICAgIHRoaXMuZW1pdCh0aGlzLmNvbnRyb2xDaGFubmVsLCB7XG4gICAgICAgICAgICB0eXBlOiAnTGluayB0byAnICsgbmFtZSxcbiAgICAgICAgICAgIHJlcXVlc3Q6ICdsaW5rJyxcbiAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICBvdmVycmlkZURlc3Q6IG5hbWUgKyAnLicgKyB0aGlzLmlkLFxuICAgICAgICAgICAgdG86IGRlcFxuICAgICAgICAgIH0pO1xuICAgICAgICB9LmJpbmQodGhpcyksIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICB0aGlzLmRlYnVnLndhcm4oJ2ZhaWxlZCB0byBsb2FkIGRlcDogJywgbmFtZSwgZXJyKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfVxuICAvLyBOb3RlIHRoYXQgbWVzc2FnZXMgY2FuIGJlIHN5bmNocm9ub3VzLCBzbyBzb21lIHBvcnRzIG1heSBhbHJlYWR5IGJlIGJvdW5kLlxuICBmb3IgKGkgPSAwOyBpIDwgY2hhbm5lbHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICB0aGlzLmV4dGVybmFsUG9ydE1hcFtjaGFubmVsc1tpXV0gPSB0aGlzLmV4dGVybmFsUG9ydE1hcFtjaGFubmVsc1tpXV0gfHwgZmFsc2U7XG4gICAgdGhpcy5pbnRlcm5hbFBvcnRNYXBbY2hhbm5lbHNbaV1dID0gZmFsc2U7XG4gIH1cbn07XG5cbi8qKlxuICogVXBkYXRlIHRoZSBtb2R1bGUgZW52aXJvbm1lbnQgd2l0aCBpbmZvcm1hdGlvbiBhYm91dCBhIGRlcGVuZGVudCBtYW5pZmVzdC5cbiAqIEBtZXRob2QgdXBkYXRlRW52XG4gKiBAcGFyYW0ge1N0cmluZ30gZGVwIFRoZSBkZXBlbmRlbmN5XG4gKiBAcGFyYW0ge09iamVjdH0gbWFuaWZlc3QgVGhlIG1hbmlmZXN0IG9mIHRoZSBkZXBlbmRlbmN5XG4gKi9cbk1vZHVsZS5wcm90b3R5cGUudXBkYXRlRW52ID0gZnVuY3Rpb24gKGRlcCwgbWFuaWZlc3QpIHtcbiAgaWYgKCFtYW5pZmVzdCkge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoIXRoaXMubW9kSW50ZXJuYWwpIHtcbiAgICB0aGlzLm9uY2UoJ21vZEludGVybmFsJywgdGhpcy51cGRhdGVFbnYuYmluZCh0aGlzLCBkZXAsIG1hbmlmZXN0KSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIFxuICB2YXIgbWV0YWRhdGE7XG5cbiAgLy8gRGVjaWRlIGlmL3doYXQgb3RoZXIgcHJvcGVydGllcyBzaG91bGQgYmUgZXhwb3J0ZWQuXG4gIC8vIEtlZXAgaW4gc3luYyB3aXRoIE1vZHVsZUludGVybmFsLnVwZGF0ZUVudlxuICBtZXRhZGF0YSA9IHtcbiAgICBuYW1lOiBtYW5pZmVzdC5uYW1lLFxuICAgIGljb246IG1hbmlmZXN0Lmljb24sXG4gICAgZGVzY3JpcHRpb246IG1hbmlmZXN0LmRlc2NyaXB0aW9uLFxuICAgIGFwaTogbWFuaWZlc3QuYXBpXG4gIH07XG4gIFxuICB0aGlzLnBvcnQub25NZXNzYWdlKHRoaXMubW9kSW50ZXJuYWwsIHtcbiAgICB0eXBlOiAnbWFuaWZlc3QnLFxuICAgIG5hbWU6IGRlcCxcbiAgICBtYW5pZmVzdDogbWV0YWRhdGFcbiAgfSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZHVsZTtcbiIsIi8qanNsaW50IGluZGVudDoyLCBub2RlOnRydWUsc2xvcHB5OnRydWUgKi9cbnZhciBQcm9taXNlQ29tcGF0ID0gcmVxdWlyZSgnZXM2LXByb21pc2UnKS5Qcm9taXNlO1xuXG52YXIgQXBpSW50ZXJmYWNlID0gcmVxdWlyZSgnLi9wcm94eS9hcGlJbnRlcmZhY2UnKTtcbnZhciBQcm92aWRlciA9IHJlcXVpcmUoJy4vcHJvdmlkZXInKTtcbnZhciBQcm94eUJpbmRlciA9IHJlcXVpcmUoJy4vcHJveHliaW5kZXInKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbi8qKlxuICogVGhlIGludGVybmFsIGxvZ2ljIGZvciBtb2R1bGUgc2V0dXAsIHdoaWNoIG1ha2VzIHN1cmUgdGhlIHB1YmxpY1xuICogZmFjaW5nIGV4cG9ydHMgaGF2ZSBhcHByb3ByaWF0ZSBwcm9wZXJ0aWVzLCBhbmQgbG9hZCB1c2VyIHNjcmlwdHMuXG4gKiBAY2xhc3MgTW9kdWxlSW50ZXJuYWxcbiAqIEBleHRlbmRzIFBvcnRcbiAqIEBwYXJhbSB7UG9ydH0gbWFuYWdlciBUaGUgbWFuYWdlciBpbiB0aGlzIG1vZHVsZSB0byB1c2UgZm9yIHJvdXRpbmcgc2V0dXAuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmFyIE1vZHVsZUludGVybmFsID0gZnVuY3Rpb24gKG1hbmFnZXIpIHtcbiAgdGhpcy5jb25maWcgPSB7fTtcbiAgdGhpcy5tYW5hZ2VyID0gbWFuYWdlcjtcbiAgdGhpcy5kZWJ1ZyA9IG1hbmFnZXIuZGVidWc7XG4gIHRoaXMuYmluZGVyID0gbmV3IFByb3h5QmluZGVyKHRoaXMubWFuYWdlcik7XG4gIHRoaXMuYXBpID0gdGhpcy5tYW5hZ2VyLmFwaTtcbiAgdGhpcy5tYW5pZmVzdHMgPSB7fTtcbiAgdGhpcy5wcm92aWRlcnMgPSB7fTtcbiAgXG4gIHRoaXMuaWQgPSAnTW9kdWxlSW50ZXJuYWwnO1xuICB0aGlzLnBlbmRpbmdQb3J0cyA9IDA7XG4gIHRoaXMucmVxdWVzdHMgPSB7fTtcblxuICB1dGlsLmhhbmRsZUV2ZW50cyh0aGlzKTtcbn07XG5cbi8qKlxuICogTWVzc2FnZSBoYW5kbGVyIGZvciB0aGlzIHBvcnQuXG4gKiBUaGlzIHBvcnQgb25seSBoYW5kbGVzIHR3byBtZXNzYWdlczpcbiAqIFRoZSBmaXJzdCBpcyBpdHMgc2V0dXAgZnJvbSB0aGUgbWFuYWdlciwgd2hpY2ggaXQgdXNlcyBmb3IgY29uZmlndXJhdGlvbi5cbiAqIFRoZSBzZWNvbmQgaXMgZnJvbSB0aGUgbW9kdWxlIGNvbnRyb2xsZXIgKGZkb20ucG9ydC5Nb2R1bGUpLCB3aGljaCBwcm92aWRlc1xuICogdGhlIG1hbmlmZXN0IGluZm8gZm9yIHRoZSBtb2R1bGUuXG4gKiBAbWV0aG9kIG9uTWVzc2FnZVxuICogQHBhcmFtIHtTdHJpbmd9IGZsb3cgVGhlIGRldGluYXRpb24gb2YgdGhlIG1lc3NhZ2UuXG4gKiBAcGFyYW0ge09iamVjdH0gbWVzc2FnZSBUaGUgbWVzc2FnZS5cbiAqL1xuTW9kdWxlSW50ZXJuYWwucHJvdG90eXBlLm9uTWVzc2FnZSA9IGZ1bmN0aW9uIChmbG93LCBtZXNzYWdlKSB7XG4gIGlmIChmbG93ID09PSAnY29udHJvbCcpIHtcbiAgICBpZiAoIXRoaXMuY29udHJvbENoYW5uZWwgJiYgbWVzc2FnZS5jaGFubmVsKSB7XG4gICAgICB0aGlzLmNvbnRyb2xDaGFubmVsID0gbWVzc2FnZS5jaGFubmVsO1xuICAgICAgdXRpbC5taXhpbih0aGlzLmNvbmZpZywgbWVzc2FnZS5jb25maWcpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChmbG93ID09PSAnZGVmYXVsdCcgJiYgIXRoaXMuYXBwSWQpIHtcbiAgICAvLyBSZWNvdmVyIHRoZSBJRCBvZiB0aGlzIG1vZHVsZTpcbiAgICB0aGlzLnBvcnQgPSB0aGlzLm1hbmFnZXIuaHViLmdldERlc3RpbmF0aW9uKG1lc3NhZ2UuY2hhbm5lbCk7XG4gICAgdGhpcy5leHRlcm5hbENoYW5uZWwgPSBtZXNzYWdlLmNoYW5uZWw7XG4gICAgdGhpcy5hcHBJZCA9IG1lc3NhZ2UuYXBwSWQ7XG4gICAgdGhpcy5saW5lYWdlID0gbWVzc2FnZS5saW5lYWdlO1xuXG4gICAgdmFyIG9iamVjdHMgPSB0aGlzLm1hcFByb3hpZXMobWVzc2FnZS5tYW5pZmVzdCk7XG5cbiAgICB0aGlzLmdlbmVyYXRlRW52KG1lc3NhZ2UubWFuaWZlc3QsIG9iamVjdHMpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHRoaXMubG9hZExpbmtzKG9iamVjdHMpO1xuICAgIH0uYmluZCh0aGlzKSkudGhlbih0aGlzLmxvYWRTY3JpcHRzLmJpbmQodGhpcywgbWVzc2FnZS5pZCxcbiAgICAgICAgbWVzc2FnZS5tYW5pZmVzdC5hcHAuc2NyaXB0KSk7XG4gIH0gZWxzZSBpZiAoZmxvdyA9PT0gJ2RlZmF1bHQnICYmIHRoaXMucmVxdWVzdHNbbWVzc2FnZS5pZF0pIHtcbiAgICB0aGlzLnJlcXVlc3RzW21lc3NhZ2UuaWRdKG1lc3NhZ2UuZGF0YSk7XG4gICAgZGVsZXRlIHRoaXMucmVxdWVzdHNbbWVzc2FnZS5pZF07XG4gIH0gZWxzZSBpZiAoZmxvdyA9PT0gJ2RlZmF1bHQnICYmIG1lc3NhZ2UudHlwZSA9PT0gJ21hbmlmZXN0Jykge1xuICAgIHRoaXMuZW1pdCgnbWFuaWZlc3QnLCBtZXNzYWdlKTtcbiAgICB0aGlzLnVwZGF0ZU1hbmlmZXN0KG1lc3NhZ2UubmFtZSwgbWVzc2FnZS5tYW5pZmVzdCk7XG4gIH0gZWxzZSBpZiAoZmxvdyA9PT0gJ2RlZmF1bHQnICYmIG1lc3NhZ2UudHlwZSA9PT0gJ0Nvbm5lY3Rpb24nKSB7XG4gICAgLy8gTXVsdGlwbGUgY29ubmVjdGlvbnMgY2FuIGJlIG1hZGUgdG8gdGhlIGRlZmF1bHQgcHJvdmlkZXIuXG4gICAgaWYgKG1lc3NhZ2UuYXBpICYmIHRoaXMucHJvdmlkZXJzW21lc3NhZ2UuYXBpXSkge1xuICAgICAgdGhpcy5tYW5hZ2VyLmNyZWF0ZUxpbmsodGhpcy5wcm92aWRlcnNbbWVzc2FnZS5hcGldLCBtZXNzYWdlLmNoYW5uZWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9ydCwgbWVzc2FnZS5jaGFubmVsKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZGVmYXVsdFBvcnQgJiZcbiAgICAgICAgICAgICAgIChtZXNzYWdlLmFwaSA9PT0gdGhpcy5kZWZhdWx0UG9ydC5hcGkgfHwgIW1lc3NhZ2UuYXBpKSkge1xuICAgICAgdGhpcy5tYW5hZ2VyLmNyZWF0ZUxpbmsodGhpcy5kZWZhdWx0UG9ydCwgbWVzc2FnZS5jaGFubmVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3J0LCBtZXNzYWdlLmNoYW5uZWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm9uY2UoJ3N0YXJ0JywgdGhpcy5vbk1lc3NhZ2UuYmluZCh0aGlzLCBmbG93LCBtZXNzYWdlKSk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIEdldCBhIHRleHR1YWwgZGVzY3JpcHRpb24gb2YgdGhpcyBQb3J0LlxuICogQG1ldGhvZCB0b1N0cmluZ1xuICogQHJldHVybiB7U3RyaW5nfSBhIGRlc2NyaXB0aW9uIG9mIHRoaXMgUG9ydC5cbiAqL1xuTW9kdWxlSW50ZXJuYWwucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gXCJbRW52aXJvbm1lbnQgSGVscGVyXVwiO1xufTtcblxuLyoqXG4gKiBHZW5lcmF0ZSBhbiBleHRlcm5hbHkgdmlzaXNibGUgbmFtZXNwYWNlXG4gKiBAbWV0aG9kIGdlbmVyYXRlRW52XG4gKiBAcGFyYW0ge09iamVjdH0gbWFuaWZlc3QgVGhlIG1hbmlmZXN0IG9mIHRoZSBtb2R1bGUuXG4gKiBAcGFyYW0ge09iamVjdFtdfSBpdGVtcyBPdGhlciBpbnRlcmZhY2VzIHRvIGxvYWQuXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gQSBwcm9taXNlIHdoZW4gdGhlIGV4dGVybmFsIG5hbWVzcGFjZSBpcyB2aXNpYmxlLlxuICogQHByaXZhdGVcbiAqL1xuTW9kdWxlSW50ZXJuYWwucHJvdG90eXBlLmdlbmVyYXRlRW52ID0gZnVuY3Rpb24gKG1hbmlmZXN0LCBpdGVtcykge1xuICByZXR1cm4gdGhpcy5iaW5kZXIuYmluZERlZmF1bHQodGhpcy5wb3J0LCB0aGlzLmFwaSwgbWFuaWZlc3QsIHRydWUpLnRoZW4oXG4gICAgZnVuY3Rpb24gKGJpbmRpbmcpIHtcbiAgICAgIHZhciBpID0gMDtcbiAgICAgIGJpbmRpbmcucG9ydC5hcGkgPSBiaW5kaW5nLmV4dGVybmFsLmFwaTtcbiAgICAgIHRoaXMuZGVmYXVsdFBvcnQgPSBiaW5kaW5nLnBvcnQ7XG4gICAgICBpZiAoYmluZGluZy5leHRlcm5hbC5hcGkpIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgaWYgKGl0ZW1zW2ldLm5hbWUgPT09IGJpbmRpbmcuZXh0ZXJuYWwuYXBpICYmIGl0ZW1zW2ldLmRlZi5wcm92aWRlcykge1xuICAgICAgICAgICAgaXRlbXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLmNvbmZpZy5nbG9iYWwuZnJlZWRvbSA9IGJpbmRpbmcuZXh0ZXJuYWw7XG4gICAgfS5iaW5kKHRoaXMpXG4gICk7XG59O1xuXG4vKipcbiAqIEF0dGFjaCBhIHByb3h5IHRvIHRoZSBleHRlcm5hbGx5IHZpc2libGUgbmFtZXNwYWNlLlxuICogQG1ldGhvZCBhdHRhY2hcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBwcm94eS5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gcHJvdmlkZXMgSWYgdGhpcyBwcm94eSBpcyBhIHByb3ZpZGVyLlxuICogQHBhcmFtIHtQcm94eUludGVyZmFjZX0gcHJveHkgVGhlIHByb3h5IHRvIGF0dGFjaC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBhcGkgVGhlIEFQSSB0aGUgcHJveHkgaW1wbGVtZW50cy5cbiAqIEBwcml2YXRlLlxuICovXG5Nb2R1bGVJbnRlcm5hbC5wcm90b3R5cGUuYXR0YWNoID0gZnVuY3Rpb24gKG5hbWUsIHByb3ZpZGVzLCBwcm94eSkge1xuICB2YXIgZXhwID0gdGhpcy5jb25maWcuZ2xvYmFsLmZyZWVkb207XG4gIFxuICBpZiAocHJvdmlkZXMpIHtcbiAgICB0aGlzLnByb3ZpZGVyc1tuYW1lXSA9IHByb3h5LnBvcnQ7XG4gIH1cblxuICBpZiAoIWV4cFtuYW1lXSkge1xuICAgIGV4cFtuYW1lXSA9IHByb3h5LmV4dGVybmFsO1xuICAgIGlmICh0aGlzLm1hbmlmZXN0c1tuYW1lXSkge1xuICAgICAgZXhwW25hbWVdLm1hbmlmZXN0ID0gdGhpcy5tYW5pZmVzdHNbbmFtZV07XG4gICAgfVxuICB9XG5cbiAgdGhpcy5wZW5kaW5nUG9ydHMgLT0gMTtcbiAgaWYgKHRoaXMucGVuZGluZ1BvcnRzID09PSAwKSB7XG4gICAgdGhpcy5lbWl0KCdzdGFydCcpO1xuICB9XG59O1xuXG4vKipcbiAqIFJlcXVlc3QgYSBzZXQgb2YgcHJveHkgaW50ZXJmYWNlcywgYW5kIGJpbmQgdGhlbSB0byB0aGUgZXh0ZXJuYWxcbiAqIG5hbWVzcGFjZS5cbiAqIEBtZXRob2QgbG9hZExpbmtzXG4gKiBAcGFyYW0ge09iamVjdFtdfSBpdGVtcyBEZXNjcmlwdG9ycyBvZiB0aGUgcHJveHkgcG9ydHMgdG8gbG9hZC5cbiAqIEBwcml2YXRlXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSBmb3Igd2hlbiBhbGwgbGlua3MgYXJlIGxvYWRlZC5cbiAqL1xuLy9UT0RPKHdpbGxzY290dCk6IHByb21pc2Ugc2hvdWxkIGJlIGNoYWluZWQsIHJhdGhlciB0aGFuIGdvaW5nIHRocm91Z2ggZXZlbnRzLlxuTW9kdWxlSW50ZXJuYWwucHJvdG90eXBlLmxvYWRMaW5rcyA9IGZ1bmN0aW9uIChpdGVtcykge1xuICB2YXIgaSwgcHJveHksIHByb3ZpZGVyLCBjb3JlLFxuICAgIG1hbmlmZXN0UHJlZGljYXRlID0gZnVuY3Rpb24gKG5hbWUsIGZsb3csIG1zZykge1xuICAgICAgcmV0dXJuIGZsb3cgPT09ICdtYW5pZmVzdCcgJiYgbXNnLm5hbWUgPT09IG5hbWU7XG4gICAgfSxcbiAgICBvbk1hbmlmZXN0ID0gZnVuY3Rpb24gKGl0ZW0sIG1zZykge1xuICAgICAgdmFyIGRlZmluaXRpb24gPSB7XG4gICAgICAgIG5hbWU6IGl0ZW0uYXBpXG4gICAgICB9O1xuICAgICAgaWYgKCFtc2cubWFuaWZlc3QuYXBpIHx8ICFtc2cubWFuaWZlc3QuYXBpW2l0ZW0uYXBpXSkge1xuICAgICAgICBkZWZpbml0aW9uLmRlZmluaXRpb24gPSBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVmaW5pdGlvbi5kZWZpbml0aW9uID0gbXNnLm1hbmlmZXN0LmFwaVtpdGVtLmFwaV07XG4gICAgICB9XG4gICAgICB0aGlzLmJpbmRlci5nZXRFeHRlcm5hbCh0aGlzLnBvcnQsIGl0ZW0ubmFtZSwgZGVmaW5pdGlvbikudGhlbihcbiAgICAgICAgdGhpcy5hdHRhY2guYmluZCh0aGlzLCBpdGVtLm5hbWUsIGZhbHNlKVxuICAgICAgKTtcbiAgICB9LmJpbmQodGhpcyksXG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlQ29tcGF0KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHRoaXMub25jZSgnc3RhcnQnLCByZXNvbHZlKTtcbiAgICB9LmJpbmQodGhpcykpO1xuXG4gIGZvciAoaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgIGlmIChpdGVtc1tpXS5hcGkgJiYgIWl0ZW1zW2ldLmRlZikge1xuICAgICAgaWYgKHRoaXMubWFuaWZlc3RzW2l0ZW1zW2ldLm5hbWVdKSB7XG4gICAgICAgIG9uTWFuaWZlc3QoaXRlbXNbaV0sIHtcbiAgICAgICAgICBtYW5pZmVzdDogdGhpcy5tYW5pZmVzdHNbaXRlbXNbaV0ubmFtZV1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm9uY2UobWFuaWZlc3RQcmVkaWNhdGUuYmluZCh7fSwgaXRlbXNbaV0ubmFtZSksXG4gICAgICAgICAgICAgICAgICBvbk1hbmlmZXN0LmJpbmQodGhpcywgaXRlbXNbaV0pKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5iaW5kZXIuZ2V0RXh0ZXJuYWwodGhpcy5wb3J0LCBpdGVtc1tpXS5uYW1lLCBpdGVtc1tpXS5kZWYpLnRoZW4oXG4gICAgICAgIHRoaXMuYXR0YWNoLmJpbmQodGhpcywgaXRlbXNbaV0ubmFtZSwgaXRlbXNbaV0uZGVmICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXNbaV0uZGVmLnByb3ZpZGVzKVxuICAgICAgKTtcbiAgICB9XG4gICAgdGhpcy5wZW5kaW5nUG9ydHMgKz0gMTtcbiAgfVxuICBcbiAgLy8gQWxsb3cgcmVzb2x1dGlvbiBvZiBmaWxlcyBieSBwYXJlbnQuXG4gIHRoaXMubWFuYWdlci5yZXNvdXJjZS5hZGRSZXNvbHZlcihmdW5jdGlvbiAobWFuaWZlc3QsIHVybCwgcmVzb2x2ZSkge1xuICAgIHZhciBpZCA9IHV0aWwuZ2V0SWQoKTtcbiAgICB0aGlzLnJlcXVlc3RzW2lkXSA9IHJlc29sdmU7XG4gICAgdGhpcy5lbWl0KHRoaXMuZXh0ZXJuYWxDaGFubmVsLCB7XG4gICAgICB0eXBlOiAncmVzb2x2ZScsXG4gICAgICBpZDogaWQsXG4gICAgICBkYXRhOiB1cmxcbiAgICB9KTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfS5iaW5kKHRoaXMpKTtcblxuICAvLyBBdHRhY2ggQ29yZS5cbiAgdGhpcy5wZW5kaW5nUG9ydHMgKz0gMTtcblxuICBjb3JlID0gdGhpcy5hcGkuZ2V0KCdjb3JlJykuZGVmaW5pdGlvbjtcbiAgcHJvdmlkZXIgPSBuZXcgUHJvdmlkZXIoY29yZSwgdGhpcy5kZWJ1Zyk7XG4gIHRoaXMubWFuYWdlci5nZXRDb3JlKGZ1bmN0aW9uIChDb3JlUHJvdikge1xuICAgIG5ldyBDb3JlUHJvdih0aGlzLm1hbmFnZXIpLnNldElkKHRoaXMubGluZWFnZSk7XG4gICAgcHJvdmlkZXIuZ2V0SW50ZXJmYWNlKCkucHJvdmlkZUFzeW5jaHJvbm91cyhDb3JlUHJvdik7XG4gIH0uYmluZCh0aGlzKSk7XG5cbiAgdGhpcy5lbWl0KHRoaXMuY29udHJvbENoYW5uZWwsIHtcbiAgICB0eXBlOiAnTGluayB0byBjb3JlJyxcbiAgICByZXF1ZXN0OiAnbGluaycsXG4gICAgbmFtZTogJ2NvcmUnLFxuICAgIHRvOiBwcm92aWRlclxuICB9KTtcbiAgXG4gIHRoaXMuYmluZGVyLmdldEV4dGVybmFsKHByb3ZpZGVyLCAnZGVmYXVsdCcsIHtcbiAgICBuYW1lOiAnY29yZScsXG4gICAgZGVmaW5pdGlvbjogY29yZVxuICB9KS50aGVuKFxuICAgIHRoaXMuYXR0YWNoLmJpbmQodGhpcywgJ2NvcmUnLCBmYWxzZSlcbiAgKTtcblxuXG4vLyAgcHJveHkgPSBuZXcgUHJveHkoQXBpSW50ZXJmYWNlLmJpbmQoe30sIGNvcmUpLCB0aGlzLmRlYnVnKTtcbi8vICB0aGlzLm1hbmFnZXIuY3JlYXRlTGluayhwcm92aWRlciwgJ2RlZmF1bHQnLCBwcm94eSk7XG4vLyAgdGhpcy5hdHRhY2goJ2NvcmUnLCB7cG9ydDogcHIsIGV4dGVybmFsOiBwcm94eX0pO1xuXG4gIGlmICh0aGlzLnBlbmRpbmdQb3J0cyA9PT0gMCkge1xuICAgIHRoaXMuZW1pdCgnc3RhcnQnKTtcbiAgfVxuXG4gIHJldHVybiBwcm9taXNlO1xufTtcblxuLyoqXG4gKiBVcGRhdGUgdGhlIGV4cG9ydGVkIG1hbmlmZXN0IG9mIGEgZGVwZW5kZW5jeS5cbiAqIFNldHMgaXQgaW50ZXJuYWxseSBpZiBub3QgeWV0IGV4cG9ydGVkLCBvciBhdHRhY2hlcyB0aGUgcHJvcGVydHkgaWYgaXRcbiAqIGlzIGxvYWRlZCBhZnRlciB0aGUgbW9kdWxlIGhhcyBzdGFydGVkICh3ZSBkb24ndCBkZWxheSBzdGFydCB0byByZXRyZWl2ZVxuICogdGhlIG1hbmlmZXN0IG9mIHRoZSBkZXBlbmRlbmN5LilcbiAqIEBtZXRob2QgdXBkYXRlTWFuaWZlc3RcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBEZXBlbmRlbmN5XG4gKiBAcGFyYW0ge09iamVjdH0gbWFuaWZlc3QgVGhlIG1hbmlmZXN0IG9mIHRoZSBkZXBlbmRlbmN5XG4gKi9cbk1vZHVsZUludGVybmFsLnByb3RvdHlwZS51cGRhdGVNYW5pZmVzdCA9IGZ1bmN0aW9uIChuYW1lLCBtYW5pZmVzdCkge1xuICB2YXIgZXhwID0gdGhpcy5jb25maWcuZ2xvYmFsLmZyZWVkb207XG5cbiAgaWYgKGV4cCAmJiBleHBbbmFtZV0pIHtcbiAgICBleHBbbmFtZV0ubWFuaWZlc3QgPSBtYW5pZmVzdDtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm1hbmlmZXN0c1tuYW1lXSA9IG1hbmlmZXN0O1xuICB9XG59O1xuXG4vKipcbiAqIERldGVybWluZSB3aGljaCBwcm94eSBwb3J0cyBzaG91bGQgYmUgZXhwb3NlZCBieSB0aGlzIG1vZHVsZS5cbiAqIEBtZXRob2QgbWFwUHJveGllc1xuICogQHBhcmFtIHtPYmplY3R9IG1hbmlmZXN0IHRoZSBtb2R1bGUgSlNPTiBtYW5pZmVzdC5cbiAqIEByZXR1cm4ge09iamVjdFtdfSBwcm94eSBkZXNjcmlwdG9ycyBkZWZpbmVkIGluIHRoZSBtYW5pZmVzdC5cbiAqL1xuTW9kdWxlSW50ZXJuYWwucHJvdG90eXBlLm1hcFByb3hpZXMgPSBmdW5jdGlvbiAobWFuaWZlc3QpIHtcbiAgdmFyIHByb3hpZXMgPSBbXSwgc2VlbiA9IFsnY29yZSddLCBpLCBvYmo7XG4gIFxuICBpZiAobWFuaWZlc3QucGVybWlzc2lvbnMpIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbWFuaWZlc3QucGVybWlzc2lvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIG9iaiA9IHtcbiAgICAgICAgbmFtZTogbWFuaWZlc3QucGVybWlzc2lvbnNbaV0sXG4gICAgICAgIGRlZjogdW5kZWZpbmVkXG4gICAgICB9O1xuICAgICAgb2JqLmRlZiA9IHRoaXMuYXBpLmdldChvYmoubmFtZSk7XG4gICAgICBpZiAoc2Vlbi5pbmRleE9mKG9iai5uYW1lKSA8IDAgJiYgb2JqLmRlZikge1xuICAgICAgICBwcm94aWVzLnB1c2gob2JqKTtcbiAgICAgICAgc2Vlbi5wdXNoKG9iai5uYW1lKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgXG4gIGlmIChtYW5pZmVzdC5kZXBlbmRlbmNpZXMpIHtcbiAgICB1dGlsLmVhY2hQcm9wKG1hbmlmZXN0LmRlcGVuZGVuY2llcywgZnVuY3Rpb24gKGRlc2MsIG5hbWUpIHtcbiAgICAgIG9iaiA9IHtcbiAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgYXBpOiBkZXNjLmFwaVxuICAgICAgfTtcbiAgICAgIGlmIChzZWVuLmluZGV4T2YobmFtZSkgPCAwKSB7XG4gICAgICAgIGlmIChkZXNjLmFwaSkge1xuICAgICAgICAgIG9iai5kZWYgPSB0aGlzLmFwaS5nZXQoZGVzYy5hcGkpO1xuICAgICAgICB9XG4gICAgICAgIHByb3hpZXMucHVzaChvYmopO1xuICAgICAgICBzZWVuLnB1c2gobmFtZSk7XG4gICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfVxuICBcbiAgaWYgKG1hbmlmZXN0LnByb3ZpZGVzKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IG1hbmlmZXN0LnByb3ZpZGVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBvYmogPSB7XG4gICAgICAgIG5hbWU6IG1hbmlmZXN0LnByb3ZpZGVzW2ldLFxuICAgICAgICBkZWY6IHVuZGVmaW5lZFxuICAgICAgfTtcbiAgICAgIG9iai5kZWYgPSB0aGlzLmFwaS5nZXQob2JqLm5hbWUpO1xuICAgICAgaWYgKG9iai5kZWYpIHtcbiAgICAgICAgb2JqLmRlZi5wcm92aWRlcyA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKG1hbmlmZXN0LmFwaSAmJiBtYW5pZmVzdC5hcGlbb2JqLm5hbWVdKSB7XG4gICAgICAgIG9iai5kZWYgPSB7XG4gICAgICAgICAgbmFtZTogb2JqLm5hbWUsXG4gICAgICAgICAgZGVmaW5pdGlvbjogbWFuaWZlc3QuYXBpW29iai5uYW1lXSxcbiAgICAgICAgICBwcm92aWRlczogdHJ1ZVxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5kZWJ1Zy53YXJuKCdNb2R1bGUgd2lsbCBub3QgcHJvdmlkZSBcIicgKyBvYmoubmFtZSArXG4gICAgICAgICAgJ1wiLCBzaW5jZSBubyBkZWNsYXJhdGlvbiBjYW4gYmUgZm91bmQuJyk7XG4gICAgICAgIC8qanNsaW50IGNvbnRpbnVlOnRydWUqL1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8qanNsaW50IGNvbnRpbnVlOmZhbHNlKi9cbiAgICAgIGlmIChzZWVuLmluZGV4T2Yob2JqLm5hbWUpIDwgMCkge1xuICAgICAgICBwcm94aWVzLnB1c2gob2JqKTtcbiAgICAgICAgc2Vlbi5wdXNoKG9iai5uYW1lKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gcHJveGllcztcbn07XG5cbi8qKlxuICogTG9hZCBleHRlcm5hbCBzY3JpcHRzIGludG8gdGhpcyBuYW1lc3BhY2UuXG4gKiBAbWV0aG9kIGxvYWRTY3JpcHRzXG4gKiBAcGFyYW0ge1N0cmluZ30gZnJvbSBUaGUgVVJMIG9mIHRoaXMgbW9kdWxlcydzIG1hbmlmZXN0LlxuICogQHBhcmFtIHtTdHJpbmdbXX0gc2NyaXB0cyBUaGUgVVJMcyBvZiB0aGUgc2NyaXB0cyB0byBsb2FkLlxuICovXG5Nb2R1bGVJbnRlcm5hbC5wcm90b3R5cGUubG9hZFNjcmlwdHMgPSBmdW5jdGlvbiAoZnJvbSwgc2NyaXB0cykge1xuICAvLyBUT0RPKHNhbG9tZWdlbyk6IGFkZCBhIHRlc3QgZm9yIGZhaWx1cmUuXG4gIHZhciBpbXBvcnRlciA9IGZ1bmN0aW9uIChzY3JpcHQsIHJlc29sdmUsIHJlamVjdCkge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLmNvbmZpZy5nbG9iYWwuaW1wb3J0U2NyaXB0cyhzY3JpcHQpO1xuICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZWplY3QoZSk7XG4gICAgfVxuICB9LmJpbmQodGhpcyksXG4gICAgc2NyaXB0c19jb3VudCxcbiAgICBsb2FkO1xuICBpZiAodHlwZW9mIHNjcmlwdHMgPT09ICdzdHJpbmcnKSB7XG4gICAgc2NyaXB0c19jb3VudCA9IDE7XG4gIH0gZWxzZSB7XG4gICAgc2NyaXB0c19jb3VudCA9IHNjcmlwdHMubGVuZ3RoO1xuICB9XG5cbiAgbG9hZCA9IGZ1bmN0aW9uIChuZXh0KSB7XG4gICAgaWYgKG5leHQgPT09IHNjcmlwdHNfY291bnQpIHtcbiAgICAgIHRoaXMuZW1pdCh0aGlzLmV4dGVybmFsQ2hhbm5lbCwge1xuICAgICAgICB0eXBlOiBcInJlYWR5XCJcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBzY3JpcHQ7XG4gICAgaWYgKHR5cGVvZiBzY3JpcHRzID09PSAnc3RyaW5nJykge1xuICAgICAgc2NyaXB0ID0gc2NyaXB0cztcbiAgICB9IGVsc2Uge1xuICAgICAgc2NyaXB0ID0gc2NyaXB0c1tuZXh0XTtcbiAgICB9XG5cbiAgICB0aGlzLm1hbmFnZXIucmVzb3VyY2UuZ2V0KGZyb20sIHNjcmlwdCkudGhlbihmdW5jdGlvbiAodXJsKSB7XG4gICAgICB0aGlzLnRyeUxvYWQoaW1wb3J0ZXIsIHVybCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxvYWQobmV4dCArIDEpO1xuICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LmJpbmQodGhpcykpO1xuICB9LmJpbmQodGhpcyk7XG5cblxuXG4gIGlmICghdGhpcy5jb25maWcuZ2xvYmFsLmltcG9ydFNjcmlwdHMpIHtcbiAgICBpbXBvcnRlciA9IGZ1bmN0aW9uICh1cmwsIHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgdmFyIHNjcmlwdCA9IHRoaXMuY29uZmlnLmdsb2JhbC5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgIHNjcmlwdC5zcmMgPSB1cmw7XG4gICAgICBzY3JpcHQuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIHJlc29sdmUsIHRydWUpO1xuICAgICAgdGhpcy5jb25maWcuZ2xvYmFsLmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbiAgICB9LmJpbmQodGhpcyk7XG4gIH1cblxuICBsb2FkKDApO1xufTtcblxuLyoqXG4gKiBBdHRlbXB0IHRvIGxvYWQgcmVzb2x2ZWQgc2NyaXB0cyBpbnRvIHRoZSBuYW1lc3BhY2UuXG4gKiBAbWV0aG9kIHRyeUxvYWRcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpbXBvcnRlciBUaGUgYWN0dWFsIGltcG9ydCBmdW5jdGlvblxuICogQHBhcmFtIHtTdHJpbmdbXX0gdXJscyBUaGUgcmVzb3ZlZCBVUkxzIHRvIGxvYWQuXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gY29tcGxldGlvbiBvZiBsb2FkXG4gKi9cbk1vZHVsZUludGVybmFsLnByb3RvdHlwZS50cnlMb2FkID0gZnVuY3Rpb24gKGltcG9ydGVyLCB1cmwpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlQ29tcGF0KGltcG9ydGVyLmJpbmQoe30sIHVybCkpLnRoZW4oZnVuY3Rpb24gKHZhbCkge1xuICAgIHJldHVybiB2YWw7XG4gIH0sIGZ1bmN0aW9uIChlKSB7XG4gICAgdGhpcy5kZWJ1Zy53YXJuKGUuc3RhY2spO1xuICAgIHRoaXMuZGVidWcuZXJyb3IoXCJFcnJvciBsb2FkaW5nIFwiICsgdXJsLCBlKTtcbiAgICB0aGlzLmRlYnVnLmVycm9yKFwiSWYgdGhlIHN0YWNrIHRyYWNlIGlzIG5vdCB1c2VmdWwsIHNlZSBodHRwczovL1wiICtcbiAgICAgICAgXCJnaXRodWIuY29tL2ZyZWVkb21qcy9mcmVlZG9tL3dpa2kvRGVidWdnaW5nLVNjcmlwdC1QYXJzZS1FcnJvcnNcIik7XG4gIH0uYmluZCh0aGlzKSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZHVsZUludGVybmFsO1xuIiwiLypnbG9iYWxzIFhNTEh0dHBSZXF1ZXN0ICovXG4vKmpzbGludCBpbmRlbnQ6Mix3aGl0ZTp0cnVlLG5vZGU6dHJ1ZSxzbG9wcHk6dHJ1ZSAqL1xudmFyIFByb21pc2VDb21wYXQgPSByZXF1aXJlKCdlczYtcHJvbWlzZScpLlByb21pc2U7XG52YXIgTW9kdWxlID0gcmVxdWlyZSgnLi9tb2R1bGUnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbi8qKlxuICogVGhlIFBvbGljeSByZWdpc3RyeSBmb3IgZnJlZWRvbS5qcy4gIFVzZWQgdG8gbG9vayB1cCBtb2R1bGVzIGFuZCBwcm92aWRlXG4gKiBtaWdyYXRpb24gYW5kIGNvYWxsZXNpbmcgb2YgZXhlY3V0aW9uLlxuICogQENsYXNzIFBvbGljeVxuICogQHBhcmFtIHtNYW5hZ2VyfSBtYW5hZ2VyIFRoZSBtYW5hZ2VyIG9mIHRoZSBhY3RpdmUgcnVudGltZS5cbiAqIEBwYXJhbSB7UmVzb3VyY2V9IHJlc291cmNlIFRoZSByZXNvdXJjZSBsb2FkZXIgb2YgdGhlIGFjdGl2ZSBydW50aW1lLlxuICogQHBhcmFtIHtPYmplY3R9IGNvbmZpZyBUaGUgbG9jYWwgY29uZmlnLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZhciBQb2xpY3kgPSBmdW5jdGlvbihtYW5hZ2VyLCByZXNvdXJjZSwgY29uZmlnKSB7XG4gIHRoaXMuYXBpID0gbWFuYWdlci5hcGk7XG4gIHRoaXMuZGVidWcgPSBtYW5hZ2VyLmRlYnVnO1xuICB0aGlzLmxvY2F0aW9uID0gY29uZmlnLmxvY2F0aW9uO1xuICB0aGlzLnJlc291cmNlID0gcmVzb3VyY2U7XG5cbiAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gIHRoaXMucnVudGltZXMgPSBbXTtcbiAgdGhpcy5wb2xpY2llcyA9IFtdO1xuICB0aGlzLnBlbmRpbmcgPSB7fTtcbiAgdXRpbC5oYW5kbGVFdmVudHModGhpcyk7XG5cbiAgdGhpcy5hZGQobWFuYWdlciwgY29uZmlnLnBvbGljeSk7XG4gIHRoaXMucnVudGltZXNbMF0ubG9jYWwgPSB0cnVlO1xufTtcblxuLyoqXG4gKiBUaGUgcG9saWN5IGEgcnVudGltZSBpcyBleHBlY3RlZCB0byBoYXZlIHVubGVzcyBpdCBzcGVjaWZpZXNcbiAqIG90aGVyd2lzZS5cbiAqIFRPRE86IGNvbnNpZGVyIG1ha2luZyBzdGF0aWNcbiAqIEBwcm9wZXJ0eSBkZWZhdWx0UG9saWN5XG4gKi9cblBvbGljeS5wcm90b3R5cGUuZGVmYXVsdFBvbGljeSA9IHtcbiAgYmFja2dyb3VuZDogZmFsc2UsIC8vIENhbiB0aGlzIHJ1bnRpbWUgcnVuICdiYWNrZ3JvdW5kJyBtb2R1bGVzP1xuICBpbnRlcmFjdGl2ZTogdHJ1ZSAvLyBJcyB0aGVyZSBhIHZpZXcgYXNzb2NpYXRlZCB3aXRoIHRoaXMgcnVudGltZT9cbiAgLy8gVE9ETzogcmVtYWluaW5nIHJ1bnRpbWUgcG9saWN5LlxufTtcblxuLyoqXG4gKiBUaGUgY29uc3RyYWludHMgYSBjb2RlIG1vZHVsZXMgaXMgZXhwZWN0ZWQgdG8gaGF2ZSB1bmxlc3MgaXQgc3BlY2lmaWVzXG4gKiBvdGhlcndpc2UuXG4gKiBUT0RPOiBjb25zaWRlciBtYWtpbmcgc3RhdGljXG4gKiBAcHJvcGVydHkgZGVmYXVsdENvbnN0cmFpbnRzXG4gKi9cblBvbGljeS5wcm90b3R5cGUuZGVmYXVsdENvbnN0cmFpbnRzID0ge1xuICBpc29sYXRpb246IFwiYWx3YXlzXCIsIC8vIHZhbHVlczogYWx3YXlzLCBhcHAsIG5ldmVyXG4gIHBsYWNlbWVudDogXCJsb2NhbFwiIC8vIHZhbHVlczogbG9jYWwsIHN0YWJsZSwgcmVkdW5kYW50XG4gIC8vIFRPRE86IHJlbWFpbmluZyBjb25zdHJhaW50cywgZXhwcmVzcyBwbGF0Zm9ybS1zcGVjaWZpYyBkZXBlbmRlbmNpZXMuXG59O1xuXG4vKipcbiAqIFJlc29sdmUgYSBtb2R1bGUgZnJvbSBpdHMgY2Fub25pY2FsIFVSTC5cbiAqIFJlcG9uZHMgd2l0aCB0aGUgcHJvbWlzZSBvZiBhIHBvcnQgcmVwcmVzZW50aW5nIHRoZSBtb2R1bGUsIFxuICogQG1ldGhvZCBnZXRcbiAqIEBwYXJhbSB7U3RyaW5nW119IGxpbmVhZ2UgVGhlIGxpbmVhZ2Ugb2YgdGhlIHJlcXVlc3RpbmcgbW9kdWxlLlxuICogQHBhcmFtIHtTdHJpbmd9IGlkIFRoZSBjYW5vbmljYWwgSUQgb2YgdGhlIG1vZHVsZSB0byBnZXQuXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gQSBwcm9taXNlIGZvciB0aGUgbG9jYWwgcG9ydCB0b3dhcmRzIHRoZSBtb2R1bGUuXG4gKi9cblBvbGljeS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24obGluZWFnZSwgaWQpIHtcbiAgXG4gIC8vIE1ha2Ugc3VyZSB0aGF0IGEgbW9kdWxlIGlzbid0IGdldHRpbmcgbG9jYXRlZCB0d2ljZSBhdCB0aGUgc2FtZSB0aW1lLlxuICAvLyBUaGlzIGlzIHJlc29sdmVkIGJ5IGRlbGF5aW5nIGlmIGl0IHVudGlsIHdlIHNlZSBpdCBpbiBhICdtb2R1bGVBZGQnIGV2ZW50LlxuICBpZiAodGhpcy5wZW5kaW5nW2lkXSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZUNvbXBhdChmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICB0aGlzLm9uY2UoJ3BsYWNlZCcsIGZ1bmN0aW9uKGwsIGkpIHtcbiAgICAgICAgdGhpcy5nZXQobCwgaSkudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgfS5iaW5kKHRoaXMsIGxpbmVhZ2UsIGlkKSk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnBlbmRpbmdbaWRdID0gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiB0aGlzLmxvYWRNYW5pZmVzdChpZCkudGhlbihmdW5jdGlvbihtYW5pZmVzdCkge1xuICAgIHZhciBjb25zdHJhaW50cyA9IHRoaXMub3ZlcmxheSh0aGlzLmRlZmF1bHRDb25zdHJhaW50cywgbWFuaWZlc3QuY29uc3RyYWludHMpLFxuICAgICAgICBydW50aW1lID0gdGhpcy5maW5kRGVzdGluYXRpb24obGluZWFnZSwgaWQsIGNvbnN0cmFpbnRzKSxcbiAgICAgICAgcG9ydElkO1xuICAgIGlmIChydW50aW1lLmxvY2FsKSB7XG4gICAgICBwb3J0SWQgPSB0aGlzLmlzUnVubmluZyhydW50aW1lLCBpZCwgbGluZWFnZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3RyYWludHMuaXNvbGF0aW9uICE9PSAnbmV2ZXInKTtcbiAgICAgIGlmKGNvbnN0cmFpbnRzLmlzb2xhdGlvbiAhPT0gJ2Fsd2F5cycgJiYgcG9ydElkKSB7XG4gICAgICAgIHRoaXMuZGVidWcuaW5mbygnUmV1c2VkIHBvcnQgJyArIHBvcnRJZCk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnBlbmRpbmdbaWRdO1xuICAgICAgICB0aGlzLmVtaXQoJ3BsYWNlZCcpO1xuICAgICAgICByZXR1cm4gcnVudGltZS5tYW5hZ2VyLmdldFBvcnQocG9ydElkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBuZXcgTW9kdWxlKGlkLCBtYW5pZmVzdCwgbGluZWFnZSwgdGhpcyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRPRE86IENyZWF0ZSBhIHBvcnQgdG8gZ28gdG8gdGhlIHJlbW90ZSBydW50aW1lLlxuICAgICAgdGhpcy5kZWJ1Zy5lcnJvcignVW5leHBlY3RlZCBsb2NhdGlvbiBzZWxlY3RlZCBmb3IgbW9kdWxlIHBsYWNlbWVudCcpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfS5iaW5kKHRoaXMpLCBmdW5jdGlvbihlcnIpIHtcbiAgICB0aGlzLmRlYnVnLmVycm9yKCdQb2xpY3kgRXJyb3IgUmVzb2x2aW5nICcgKyBpZCwgZXJyKTtcbiAgICB0aHJvdyhlcnIpO1xuICB9LmJpbmQodGhpcykpO1xufTtcblxuLyoqXG4gKiBGaW5kIHRoZSBydW50aW1lIGRlc3RpbmF0aW9uIGZvciBhIG1vZHVsZSBnaXZlbiBpdHMgY29uc3RyYWludHMgYW5kIHRoZVxuICogbW9kdWxlIGNyZWF0aW5nIGl0LlxuICogQG1ldGhvZCBmaW5kRGVzdGluYXRpb25cbiAqIEBwYXJhbSB7U3RyaW5nW119IGxpbmVhZ2UgVGhlIGlkZW50aXR5IG9mIHRoZSBtb2R1bGUgY3JlYXRpbmcgdGhpcyBtb2R1bGUuXG4gKiBAcGFyYW0ge1N0cmluZ10gaWQgVGhlIGNhbm9uaWNhbCB1cmwgb2YgdGhlIG1vZHVsZVxuICogQHBhcmFtIHtPYmplY3R9IGNvbnN0cmFpbnRzIENvbnN0cmFpbnRzIGZvciB0aGUgbW9kdWxlLlxuICogQHJldHVybnMge09iamVjdH0gVGhlIGVsZW1lbnQgb2YgdGhpcy5ydW50aW1lcyB3aGVyZSB0aGUgbW9kdWxlIHNob3VsZCBydW4uXG4gKi9cblBvbGljeS5wcm90b3R5cGUuZmluZERlc3RpbmF0aW9uID0gZnVuY3Rpb24obGluZWFnZSwgaWQsIGNvbnN0cmFpbnRzKSB7XG4gIHZhciBpO1xuXG4gIC8vIFN0ZXAgMTogaWYgYW4gaW5zdGFuY2UgYWxyZWFkeSBleGlzdHMsIHRoZSBtXG4gIGlmIChjb25zdHJhaW50cy5pc29sYXRpb24gIT09ICdhbHdheXMnKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMucG9saWNpZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIGlmICh0aGlzLmlzUnVubmluZyh0aGlzLnJ1bnRpbWVzW2ldLCBpZCwgbGluZWFnZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdHJhaW50cy5pc29sYXRpb24gIT09ICduZXZlcicpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1bnRpbWVzW2ldO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFN0ZXAgMjogaWYgdGhlIG1vZHVsZSB3YW50cyBzdGFiaWxpdHksIGl0IG1heSBuZWVkIHRvIGJlIHJlbW90ZS5cbiAgaWYgKGNvbnN0cmFpbnRzLnBsYWNlbWVudCA9PT0gJ2xvY2FsJykge1xuICAgIHJldHVybiB0aGlzLnJ1bnRpbWVzWzBdO1xuICB9IGVsc2UgaWYgKGNvbnN0cmFpbnRzLnBsYWNlbWVudCA9PT0gJ3N0YWJsZScpIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5wb2xpY2llcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgaWYgKHRoaXMucG9saWNpZXNbaV0uYmFja2dyb3VuZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW50aW1lc1tpXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBTdGVwIDM6IGlmIHRoZSBtb2R1bGUgbmVlZHMgbG9uZ2V2aXR5IC8gaW50ZXJhY3Rpdml0eSwgaXQgbWF5IHdhbnQgdG8gYmUgcmVtb3RlLlxuICByZXR1cm4gdGhpcy5ydW50aW1lc1swXTtcbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lIGlmIGEga25vd24gcnVudGltZSBpcyBydW5uaW5nIGFuIGFwcHJvcHJpYXRlIGluc3RhbmNlIG9mIGEgbW9kdWxlLlxuICogQG1ldGhvZCBpc1J1bm5pbmdcbiAqIEBwYXJhbSB7T2JqZWN0fSBydW50aW1lIFRoZSBydW50aW1lIHRvIGNoZWNrLlxuICogQHBhcmFtIHtTdHJpbmd9IGlkIFRoZSBtb2R1bGUgdG8gbG9vayBmb3IuXG4gKiBAcGFyYW0ge1N0cmluZ1tdfSBmcm9tIFRoZSBpZGVudGlmaWVyIG9mIHRoZSByZXF1ZXN0aW5nIG1vZHVsZS5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gZnVsbE1hdGNoIElmIHRoZSBtb2R1bGUgbmVlZHMgdG8gYmUgaW4gdGhlIHNhbWUgYXBwLlxuICogQHJldHVybnMge1N0cmluZ3xCb29sZWFufSBUaGUgTW9kdWxlIGlkIGlmIGl0IGlzIHJ1bm5pbmcsIG9yIGZhbHNlIGlmIG5vdC5cbiAqL1xuUG9saWN5LnByb3RvdHlwZS5pc1J1bm5pbmcgPSBmdW5jdGlvbihydW50aW1lLCBpZCwgZnJvbSwgZnVsbE1hdGNoKSB7XG4gIHZhciBpID0gMCwgaiA9IDAsIG9rYXk7XG4gIGZvciAoaSA9IDA7IGkgPCBydW50aW1lLm1vZHVsZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICBpZiAoZnVsbE1hdGNoICYmIHJ1bnRpbWUubW9kdWxlc1tpXS5sZW5ndGggPT09IGZyb20ubGVuZ3RoICsgMSkge1xuICAgICAgb2theSA9IHRydWU7XG4gICAgICBmb3IgKGogPSAwOyBqIDwgZnJvbS5sZW5ndGg7IGogKz0gMSkge1xuICAgICAgICBpZiAocnVudGltZS5tb2R1bGVzW2ldW2ogKyAxXS5pbmRleE9mKGZyb21bal0pICE9PSAwKSB7XG4gICAgICAgICAgb2theSA9IGZhbHNlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAocnVudGltZS5tb2R1bGVzW2ldWzBdLmluZGV4T2YoaWQpICE9PSAwKSB7XG4gICAgICAgIG9rYXkgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9rYXkpIHtcbiAgICAgICAgcmV0dXJuIHJ1bnRpbWUubW9kdWxlc1tpXVswXTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCFmdWxsTWF0Y2ggJiYgcnVudGltZS5tb2R1bGVzW2ldWzBdLmluZGV4T2YoaWQpID09PSAwKSB7XG4gICAgICByZXR1cm4gcnVudGltZS5tb2R1bGVzW2ldWzBdO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59O1xuXG4vKipcbiAqIEdldCBhIHByb21pc2Ugb2YgdGhlIG1hbmlmZXN0IGZvciBhIG1vZHVsZSBJRC5cbiAqIEBtZXRob2QgbG9hZE1hbmlmZXN0XG4gKiBAcGFyYW0ge1N0cmluZ30gbWFuaWZlc3QgVGhlIGNhbm9uaWNhbCBJRCBvZiB0aGUgbWFuaWZlc3RcbiAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIGZvciB0aGUganNvbiBjb250ZW50cyBvZiB0aGUgbWFuaWZlc3QuXG4gKi9cblBvbGljeS5wcm90b3R5cGUubG9hZE1hbmlmZXN0ID0gZnVuY3Rpb24obWFuaWZlc3QpIHtcbiAgcmV0dXJuIHRoaXMucmVzb3VyY2UuZ2V0Q29udGVudHMobWFuaWZlc3QpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciByZXNwID0ge307XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBKU09OLnBhcnNlKGRhdGEpO1xuICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICB0aGlzLmRlYnVnLmVycm9yKFwiRmFpbGVkIHRvIGxvYWQgXCIgKyBtYW5pZmVzdCArIFwiOiBcIiArIGVycik7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBNYW5pZmVzdCBBdmFpbGFibGVcIik7XG4gICAgfVxuICB9LmJpbmQodGhpcykpO1xufTtcblxuLyoqXG4gKiBBZGQgYSBydW50aW1lIHRvIGtlZXAgdHJhY2sgb2YgaW4gdGhpcyBwb2xpY3kuXG4gKiBAbWV0aG9kIGFkZFxuICogQHBhcmFtIHtmZG9tLnBvcnR9IHBvcnQgVGhlIHBvcnQgdG8gdXNlIGZvciBtb2R1bGUgbGlmZXRpbWUgaW5mb1xuICogQHBhcmFtIHtPYmplY3R9IHBvbGljeSBUaGUgcG9saWN5IG9mIHRoZSBydW50aW1lLlxuICovXG5Qb2xpY3kucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKHBvcnQsIHBvbGljeSkge1xuICB2YXIgcnVudGltZSA9IHtcbiAgICBtYW5hZ2VyOiBwb3J0LFxuICAgIG1vZHVsZXM6IFtdXG4gIH07XG4gIHRoaXMucnVudGltZXMucHVzaChydW50aW1lKTtcbiAgdGhpcy5wb2xpY2llcy5wdXNoKHRoaXMub3ZlcmxheSh0aGlzLmRlZmF1bHRQb2xpY3ksIHBvbGljeSkpO1xuXG4gIHBvcnQub24oJ21vZHVsZUFkZCcsIGZ1bmN0aW9uKHJ1bnRpbWUsIGluZm8pIHtcbiAgICB2YXIgbGluZWFnZSA9IFtdO1xuICAgIGxpbmVhZ2UgPSBsaW5lYWdlLmNvbmNhdChpbmZvLmxpbmVhZ2UpO1xuICAgIGxpbmVhZ2VbMF0gPSBpbmZvLmlkO1xuICAgIHJ1bnRpbWUubW9kdWxlcy5wdXNoKGxpbmVhZ2UpO1xuICAgIGlmICh0aGlzLnBlbmRpbmdbaW5mby5saW5lYWdlWzBdXSkge1xuICAgICAgZGVsZXRlIHRoaXMucGVuZGluZ1tpbmZvLmxpbmVhZ2VbMF1dO1xuICAgICAgdGhpcy5lbWl0KCdwbGFjZWQnKTtcbiAgICB9XG4gIH0uYmluZCh0aGlzLCBydW50aW1lKSk7XG4gIHBvcnQub24oJ21vZHVsZVJlbW92ZScsIGZ1bmN0aW9uKHJ1bnRpbWUsIGluZm8pIHtcbiAgICB2YXIgbGluZWFnZSA9IFtdLCBpLCBtb2RGaW5nZXJwcmludDtcbiAgICBsaW5lYWdlID0gbGluZWFnZS5jb25jYXQoaW5mby5saW5lYWdlKTtcbiAgICBsaW5lYWdlWzBdID0gaW5mby5pZDtcbiAgICBtb2RGaW5nZXJwcmludCA9IGxpbmVhZ2UudG9TdHJpbmcoKTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBydW50aW1lLm1vZHVsZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIGlmIChydW50aW1lLm1vZHVsZXNbaV0udG9TdHJpbmcoKSA9PT0gbW9kRmluZ2VycHJpbnQpIHtcbiAgICAgICAgcnVudGltZS5tb2R1bGVzLnNwbGljZShpLCAxKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmRlYnVnLndhcm4oJ1Vua25vd24gbW9kdWxlIHRvIHJlbW92ZTogJywgaW5mby5pZCk7XG4gIH0uYmluZCh0aGlzLCBydW50aW1lKSk7XG59O1xuXG4vKipcbiAqIE92ZXJsYXkgYSBzcGVjaWZpYyBwb2xpY3kgb3IgY29uc3RyYWludCBpbnN0YW5jZSBvbiBkZWZhdWx0IHNldHRpbmdzLlxuICogVE9ETzogY29uc2lkZXIgbWFraW5nIHN0YXRpYy5cbiAqIEBtZXRob2Qgb3ZlcmxheVxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBiYXNlIFRoZSBkZWZhdWx0IG9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IG92ZXJsYXkgVGhlIHN1cGVyY2VlZGluZyBvYmplY3RcbiAqIEByZXR1cm5zIHtPYmplY3R9IEEgbmV3IG9iamVjdCB3aXRoIGJhc2UgcGFyYW1ldGVycyB3aGVuIG5vdCBzZXQgaW4gb3ZlcmxheS5cbiAqL1xuUG9saWN5LnByb3RvdHlwZS5vdmVybGF5ID0gZnVuY3Rpb24oYmFzZSwgb3ZlcmxheSkge1xuICB2YXIgcmV0ID0ge307XG5cbiAgdXRpbC5taXhpbihyZXQsIGJhc2UpO1xuICBpZiAob3ZlcmxheSkge1xuICAgIHV0aWwubWl4aW4ocmV0LCBvdmVybGF5LCB0cnVlKTtcbiAgfVxuICByZXR1cm4gcmV0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQb2xpY3k7XG4iLCIvKmpzbGludCBpbmRlbnQ6Miwgbm9kZTp0cnVlLCBzbG9wcHk6dHJ1ZSwgYnJvd3Nlcjp0cnVlICovXG52YXIgQ29uc3VtZXIgPSByZXF1aXJlKCcuL2NvbnN1bWVyJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG4vKipcbiAqIEEgZnJlZWRvbSBwb3J0IGZvciBhIHVzZXItYWNjZXNzYWJsZSBwcm92aWRlci5cbiAqIEBjbGFzcyBQcm92aWRlclxuICogQGltcGxlbWVudHMgUG9ydFxuICogQHVzZXMgaGFuZGxlRXZlbnRzXG4gKiBAcGFyYW0ge09iamVjdH0gZGVmIFRoZSBpbnRlcmZhY2Ugb2YgdGhlIHByb3ZpZGVyLlxuICogQHBhcmFtIHtEZWJ1Z30gZGVidWcgVGhlIGRlYnVnZ2VyIHRvIHVzZSBmb3IgbG9nZ2luZy5cbiAqIEBjb250cnVjdG9yXG4gKi9cbnZhciBQcm92aWRlciA9IGZ1bmN0aW9uIChkZWYsIGRlYnVnKSB7XG4gIHRoaXMuaWQgPSBDb25zdW1lci5uZXh0SWQoKTtcbiAgdXRpbC5oYW5kbGVFdmVudHModGhpcyk7XG4gIHRoaXMuZGVidWcgPSBkZWJ1ZztcbiAgXG4gIHRoaXMuZGVmaW5pdGlvbiA9IGRlZjtcbiAgdGhpcy5tb2RlID0gUHJvdmlkZXIubW9kZS5zeW5jaHJvbm91cztcbiAgdGhpcy5jaGFubmVscyA9IHt9O1xuICB0aGlzLmlmYWNlID0gbnVsbDtcbiAgdGhpcy5wcm92aWRlckNscyA9IG51bGw7XG4gIHRoaXMucHJvdmlkZXJJbnN0YW5jZXMgPSB7fTtcbn07XG5cbi8qKlxuICogUHJvdmlkZXIgbW9kZXMgb2Ygb3BlcmF0aW9uLlxuICogQHByb3BlcnR5IG1vZGVcbiAqIEBzdGF0aWNcbiAqIEB0eXBlIG51bWJlclxuICovXG5Qcm92aWRlci5tb2RlID0ge1xuICBzeW5jaHJvbm91czogMCxcbiAgYXN5bmNocm9ub3VzOiAxLFxuICBwcm9taXNlczogMlxufTtcblxuLyoqXG4gKiBSZWNlaXZlIGV4dGVybmFsIG1lc3NhZ2VzIGZvciB0aGUgcHJvdmlkZXIuXG4gKiBAbWV0aG9kIG9uTWVzc2FnZVxuICogQHBhcmFtIHtTdHJpbmd9IHNvdXJjZSB0aGUgc291cmNlIGlkZW50aWZpZXIgb2YgdGhlIG1lc3NhZ2UuXG4gKiBAcGFyYW0ge09iamVjdH0gbWVzc2FnZSBUaGUgcmVjZWl2ZWQgbWVzc2FnZS5cbiAqL1xuUHJvdmlkZXIucHJvdG90eXBlLm9uTWVzc2FnZSA9IGZ1bmN0aW9uIChzb3VyY2UsIG1lc3NhZ2UpIHtcbiAgaWYgKHNvdXJjZSA9PT0gJ2NvbnRyb2wnICYmIG1lc3NhZ2UucmV2ZXJzZSkge1xuICAgIHRoaXMuY2hhbm5lbHNbbWVzc2FnZS5uYW1lXSA9IG1lc3NhZ2UuY2hhbm5lbDtcbiAgICB0aGlzLmVtaXQobWVzc2FnZS5jaGFubmVsLCB7XG4gICAgICB0eXBlOiAnY2hhbm5lbCBhbm5vdW5jZW1lbnQnLFxuICAgICAgY2hhbm5lbDogbWVzc2FnZS5yZXZlcnNlXG4gICAgfSk7XG4gICAgdGhpcy5lbWl0KCdzdGFydCcpO1xuICB9IGVsc2UgaWYgKHNvdXJjZSA9PT0gJ2NvbnRyb2wnICYmIG1lc3NhZ2UudHlwZSA9PT0gJ3NldHVwJykge1xuICAgIHRoaXMuY29udHJvbENoYW5uZWwgPSBtZXNzYWdlLmNoYW5uZWw7XG4gIH0gZWxzZSBpZiAoc291cmNlID09PSAnY29udHJvbCcgJiYgbWVzc2FnZS50eXBlID09PSAnY2xvc2UnKSB7XG4gICAgaWYgKG1lc3NhZ2UuY2hhbm5lbCA9PT0gdGhpcy5jb250cm9sQ2hhbm5lbCkge1xuICAgICAgZGVsZXRlIHRoaXMuY29udHJvbENoYW5uZWw7XG4gICAgfVxuICAgIHRoaXMuY2xvc2UoKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAoIXRoaXMuY2hhbm5lbHNbc291cmNlXSAmJiBtZXNzYWdlLmNoYW5uZWwpIHtcbiAgICAgIHRoaXMuY2hhbm5lbHNbc291cmNlXSA9IG1lc3NhZ2UuY2hhbm5lbDtcbiAgICAgIHRoaXMuZW1pdCgnc3RhcnQnKTtcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYgKCF0aGlzLmNoYW5uZWxzW3NvdXJjZV0pIHtcbiAgICAgIHRoaXMuZGVidWcud2FybignTWVzc2FnZSBmcm9tIHVuY29uZmlndXJlZCBzb3VyY2U6ICcgKyBzb3VyY2UpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChtZXNzYWdlLnR5cGUgPT09ICdjbG9zZScgJiYgbWVzc2FnZS50bykge1xuICAgICAgZGVsZXRlIHRoaXMucHJvdmlkZXJJbnN0YW5jZXNbc291cmNlXVttZXNzYWdlLnRvXTtcbiAgICB9IGVsc2UgaWYgKG1lc3NhZ2UudG8gJiYgdGhpcy5wcm92aWRlckluc3RhbmNlc1tzb3VyY2VdICYmXG4gICAgICAgICAgICAgICB0aGlzLnByb3ZpZGVySW5zdGFuY2VzW3NvdXJjZV1bbWVzc2FnZS50b10pIHtcbiAgICAgIG1lc3NhZ2UubWVzc2FnZS50byA9IG1lc3NhZ2UudG87XG4gICAgICB0aGlzLnByb3ZpZGVySW5zdGFuY2VzW3NvdXJjZV1bbWVzc2FnZS50b10obWVzc2FnZS5tZXNzYWdlKTtcbiAgICB9IGVsc2UgaWYgKG1lc3NhZ2UudG8gJiYgbWVzc2FnZS5tZXNzYWdlICYmXG4gICAgICAgIG1lc3NhZ2UubWVzc2FnZS50eXBlID09PSAnY29uc3RydWN0Jykge1xuICAgICAgdmFyIGFyZ3MgPSBDb25zdW1lci5wb3J0YWJsZVRvTWVzc2FnZShcbiAgICAgICAgICAodGhpcy5kZWZpbml0aW9uLmNvbnN0cnVjdG9yICYmIHRoaXMuZGVmaW5pdGlvbi5jb25zdHJ1Y3Rvci52YWx1ZSkgP1xuICAgICAgICAgICAgICB0aGlzLmRlZmluaXRpb24uY29uc3RydWN0b3IudmFsdWUgOiBbXSxcbiAgICAgICAgICBtZXNzYWdlLm1lc3NhZ2UsXG4gICAgICAgICAgdGhpcy5kZWJ1Z1xuICAgICAgICApO1xuICAgICAgaWYgKCF0aGlzLnByb3ZpZGVySW5zdGFuY2VzW3NvdXJjZV0pIHtcbiAgICAgICAgdGhpcy5wcm92aWRlckluc3RhbmNlc1tzb3VyY2VdID0ge307XG4gICAgICB9XG4gICAgICB0aGlzLnByb3ZpZGVySW5zdGFuY2VzW3NvdXJjZV1bbWVzc2FnZS50b10gPSB0aGlzLmdldFByb3ZpZGVyKHNvdXJjZSwgbWVzc2FnZS50bywgYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGVidWcud2Fybih0aGlzLnRvU3RyaW5nKCkgKyAnIGRyb3BwaW5nIG1lc3NhZ2UgJyArXG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkobWVzc2FnZSkpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDbG9zZSAvIHRlYXJkb3duIHRoZSBmbG93IHRoaXMgcHJvdmlkZXIgdGVybWluYXRlcy5cbiAqIEBtZXRob2QgY2xvc2VcbiAqL1xuUHJvdmlkZXIucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5jb250cm9sQ2hhbm5lbCkge1xuICAgIHRoaXMuZW1pdCh0aGlzLmNvbnRyb2xDaGFubmVsLCB7XG4gICAgICB0eXBlOiAnUHJvdmlkZXIgQ2xvc2luZycsXG4gICAgICByZXF1ZXN0OiAnY2xvc2UnXG4gICAgfSk7XG4gICAgZGVsZXRlIHRoaXMuY29udHJvbENoYW5uZWw7XG4gIH1cbiAgdGhpcy5lbWl0KCdjbG9zZScpO1xuXG4gIHRoaXMucHJvdmlkZXJJbnN0YW5jZXMgPSB7fTtcbiAgdGhpcy5lbWl0Q2hhbm5lbCA9IG51bGw7XG59O1xuXG4vKipcbiAqIEdldCBhbiBpbnRlcmZhY2UgdG8gZXhwb3NlIGV4dGVybmFsbHkgcmVwcmVzZW50aW5nIHRoaXMgcG9ydC5cbiAqIFByb3ZpZGVycyBhcmUgcmVnaXN0ZXJlZCB3aXRoIHRoZSBwb3J0IHVzaW5nIGVpdGhlclxuICogcHJvdmlkZVN5bmNocm9ub3VzIG9yIHByb3ZpZGVBc3luY2hyb25vdXMgZGVwZW5kaW5nIG9uIHRoZSBkZXNpcmVkXG4gKiByZXR1cm4gaW50ZXJmYWNlLlxuICogQG1ldGhvZCBnZXRJbnRlcmZhY2VcbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIGV4dGVybmFsIGludGVyZmFjZSBvZiB0aGlzIFByb3ZpZGVyLlxuICovXG5Qcm92aWRlci5wcm90b3R5cGUuZ2V0SW50ZXJmYWNlID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5pZmFjZSkge1xuICAgIHJldHVybiB0aGlzLmlmYWNlO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuaWZhY2UgPSB7XG4gICAgICBwcm92aWRlU3luY2hyb25vdXM6IGZ1bmN0aW9uIChwcm92KSB7XG4gICAgICAgIHRoaXMucHJvdmlkZXJDbHMgPSBwcm92O1xuICAgICAgICB0aGlzLm1vZGUgPSBQcm92aWRlci5tb2RlLnN5bmNocm9ub3VzO1xuICAgICAgfS5iaW5kKHRoaXMpLFxuICAgICAgcHJvdmlkZUFzeW5jaHJvbm91czogZnVuY3Rpb24gKHByb3YpIHtcbiAgICAgICAgdGhpcy5wcm92aWRlckNscyA9IHByb3Y7XG4gICAgICAgIHRoaXMubW9kZSA9IFByb3ZpZGVyLm1vZGUuYXN5bmNocm9ub3VzO1xuICAgICAgfS5iaW5kKHRoaXMpLFxuICAgICAgcHJvdmlkZVByb21pc2VzOiBmdW5jdGlvbiAocHJvdikge1xuICAgICAgICB0aGlzLnByb3ZpZGVyQ2xzID0gcHJvdjtcbiAgICAgICAgdGhpcy5tb2RlID0gUHJvdmlkZXIubW9kZS5wcm9taXNlcztcbiAgICAgIH0uYmluZCh0aGlzKSxcbiAgICAgIGNsb3NlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIH0uYmluZCh0aGlzKVxuICAgIH07XG5cbiAgICB1dGlsLmVhY2hQcm9wKHRoaXMuZGVmaW5pdGlvbiwgZnVuY3Rpb24gKHByb3AsIG5hbWUpIHtcbiAgICAgIHN3aXRjaCAocHJvcC50eXBlKSB7XG4gICAgICBjYXNlIFwiY29uc3RhbnRcIjpcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMuaWZhY2UsIG5hbWUsIHtcbiAgICAgICAgICB2YWx1ZTogQ29uc3VtZXIucmVjdXJzaXZlRnJlZXplT2JqZWN0KHByb3AudmFsdWUpLFxuICAgICAgICAgIHdyaXRhYmxlOiBmYWxzZVxuICAgICAgICB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcblxuICAgIHJldHVybiB0aGlzLmlmYWNlO1xuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZSBhIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gZ2V0IGludGVyZmFjZXMgZnJvbSB0aGlzIHByb3ZpZGVyIGZyb21cbiAqIGEgdXNlci12aXNpYmxlIHBvaW50LlxuICogQG1ldGhvZCBnZXRQcm94eUludGVyZmFjZVxuICovXG5Qcm92aWRlci5wcm90b3R5cGUuZ2V0UHJveHlJbnRlcmZhY2UgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBmdW5jID0gZnVuY3Rpb24gKHApIHtcbiAgICByZXR1cm4gcC5nZXRJbnRlcmZhY2UoKTtcbiAgfS5iaW5kKHt9LCB0aGlzKTtcblxuICBmdW5jLmNsb3NlID0gZnVuY3Rpb24gKGlmYWNlKSB7XG4gICAgaWYgKGlmYWNlKSB7XG4gICAgICB1dGlsLmVhY2hQcm9wKHRoaXMuaWZhY2VzLCBmdW5jdGlvbiAoY2FuZGlkYXRlLCBpZCkge1xuICAgICAgICBpZiAoY2FuZGlkYXRlID09PSBpZmFjZSkge1xuICAgICAgICAgIHRoaXMudGVhcmRvd24oaWQpO1xuICAgICAgICAgIHRoaXMuZW1pdCh0aGlzLmVtaXRDaGFubmVsLCB7XG4gICAgICAgICAgICB0eXBlOiAnY2xvc2UnLFxuICAgICAgICAgICAgdG86IGlkXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIENsb3NlIHRoZSBjaGFubmVsLlxuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH1cbiAgfS5iaW5kKHRoaXMpO1xuXG4gIGZ1bmMub25DbG9zZSA9IGZ1bmN0aW9uIChpZmFjZSwgaGFuZGxlcikge1xuICAgIGlmICh0eXBlb2YgaWZhY2UgPT09ICdmdW5jdGlvbicgJiYgaGFuZGxlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBBZGQgYW4gb24tY2hhbm5lbC1jbG9zZWQgaGFuZGxlci5cbiAgICAgIHRoaXMub25jZSgnY2xvc2UnLCBpZmFjZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdXRpbC5lYWNoUHJvcCh0aGlzLmlmYWNlcywgZnVuY3Rpb24gKGNhbmRpZGF0ZSwgaWQpIHtcbiAgICAgIGlmIChjYW5kaWRhdGUgPT09IGlmYWNlKSB7XG4gICAgICAgIGlmICh0aGlzLmhhbmRsZXJzW2lkXSkge1xuICAgICAgICAgIHRoaXMuaGFuZGxlcnNbaWRdLnB1c2goaGFuZGxlcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5oYW5kbGVyc1tpZF0gPSBbaGFuZGxlcl07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfS5iaW5kKHRoaXMpO1xuXG4gIHJldHVybiBmdW5jO1xufTtcblxuLyoqXG4gKiBHZXQgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIHJlZ2lzdGVyZWQgcHJvdmlkZXIuXG4gKiBAbWV0aG9kIGdldFByb3ZpZGVyXG4gKiBAcGFyYW0ge1N0cmluZ30gc291cmNlIFRoZSBwb3J0IHRoaXMgaW5zdGFuY2UgaXMgaW50ZXJhY3RpZ24gd2l0aC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBpZGVudGlmaWVyIHRoZSBtZXNzYWdhYmxlIGFkZHJlc3MgZm9yIHRoaXMgcHJvdmlkZXIuXG4gKiBAcGFyYW0ge0FycmF5fSBhcmdzIENvbnN0cnVjdG9yIGFyZ3VtZW50cyBmb3IgdGhlIHByb3ZpZGVyLlxuICogQHJldHVybiB7RnVuY3Rpb259IEEgZnVuY3Rpb24gdG8gc2VuZCBtZXNzYWdlcyB0byB0aGUgcHJvdmlkZXIuXG4gKi9cblByb3ZpZGVyLnByb3RvdHlwZS5nZXRQcm92aWRlciA9IGZ1bmN0aW9uIChzb3VyY2UsIGlkZW50aWZpZXIsIGFyZ3MpIHtcbiAgaWYgKCF0aGlzLnByb3ZpZGVyQ2xzKSB7XG4gICAgdGhpcy5kZWJ1Zy53YXJuKCdDYW5ub3QgaW5zdGFudGlhdGUgcHJvdmlkZXIsIHNpbmNlIGl0IGlzIG5vdCBwcm92aWRlZCcpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgdmFyIGV2ZW50cyA9IHt9LFxuICAgIGRpc3BhdGNoRXZlbnQsXG4gICAgQm91bmRDbGFzcyxcbiAgICBpbnN0YW5jZTtcblxuICB1dGlsLmVhY2hQcm9wKHRoaXMuZGVmaW5pdGlvbiwgZnVuY3Rpb24gKHByb3AsIG5hbWUpIHtcbiAgICBpZiAocHJvcC50eXBlID09PSAnZXZlbnQnKSB7XG4gICAgICBldmVudHNbbmFtZV0gPSBwcm9wO1xuICAgIH1cbiAgfSk7XG5cbiAgZGlzcGF0Y2hFdmVudCA9IGZ1bmN0aW9uIChzcmMsIGV2LCBpZCwgbmFtZSwgdmFsdWUpIHtcbiAgICBpZiAoZXZbbmFtZV0pIHtcbiAgICAgIHZhciBzdHJlYW1zID0gQ29uc3VtZXIubWVzc2FnZVRvUG9ydGFibGUoZXZbbmFtZV0udmFsdWUsIHZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kZWJ1Zyk7XG4gICAgICB0aGlzLmVtaXQodGhpcy5jaGFubmVsc1tzcmNdLCB7XG4gICAgICAgIHR5cGU6ICdtZXNzYWdlJyxcbiAgICAgICAgdG86IGlkLFxuICAgICAgICBtZXNzYWdlOiB7XG4gICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICB0eXBlOiAnZXZlbnQnLFxuICAgICAgICAgIHRleHQ6IHN0cmVhbXMudGV4dCxcbiAgICAgICAgICBiaW5hcnk6IHN0cmVhbXMuYmluYXJ5XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfS5iaW5kKHRoaXMsIHNvdXJjZSwgZXZlbnRzLCBpZGVudGlmaWVyKTtcblxuICAvLyB0aGlzIGlzIGFsbCB0byBzYXk6IG5ldyBwcm92aWRlckNscyhkaXNwYXRjaEV2ZW50LCBhcmdzWzBdLCBhcmdzWzFdLC4uLilcbiAgQm91bmRDbGFzcyA9IHRoaXMucHJvdmlkZXJDbHMuYmluZC5hcHBseSh0aGlzLnByb3ZpZGVyQ2xzLFxuICAgICAgW3RoaXMucHJvdmlkZXJDbHMsIGRpc3BhdGNoRXZlbnRdLmNvbmNhdChhcmdzIHx8IFtdKSk7XG4gIGluc3RhbmNlID0gbmV3IEJvdW5kQ2xhc3MoKTtcblxuICByZXR1cm4gZnVuY3Rpb24gKHBvcnQsIHNyYywgbXNnKSB7XG4gICAgaWYgKG1zZy5hY3Rpb24gPT09ICdtZXRob2QnKSB7XG4gICAgICBpZiAodHlwZW9mIHRoaXNbbXNnLnR5cGVdICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHBvcnQuZGVidWcud2FybihcIlByb3ZpZGVyIGRvZXMgbm90IGltcGxlbWVudCBcIiArIG1zZy50eXBlICsgXCIoKSFcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBwcm9wID0gcG9ydC5kZWZpbml0aW9uW21zZy50eXBlXSxcbiAgICAgICAgZGVidWcgPSBwb3J0LmRlYnVnLFxuICAgICAgICBhcmdzID0gQ29uc3VtZXIucG9ydGFibGVUb01lc3NhZ2UocHJvcC52YWx1ZSwgbXNnLCBkZWJ1ZyksXG4gICAgICAgIHJldCA9IGZ1bmN0aW9uIChzcmMsIG1zZywgcHJvcCwgcmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgdmFyIHN0cmVhbXMgPSBDb25zdW1lci5tZXNzYWdlVG9Qb3J0YWJsZShwcm9wLnJldCwgcmVzb2x2ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1Zyk7XG4gICAgICAgICAgdGhpcy5lbWl0KHRoaXMuY2hhbm5lbHNbc3JjXSwge1xuICAgICAgICAgICAgdHlwZTogJ21ldGhvZCcsXG4gICAgICAgICAgICB0bzogbXNnLnRvLFxuICAgICAgICAgICAgbWVzc2FnZToge1xuICAgICAgICAgICAgICB0bzogbXNnLnRvLFxuICAgICAgICAgICAgICB0eXBlOiAnbWV0aG9kJyxcbiAgICAgICAgICAgICAgcmVxSWQ6IG1zZy5yZXFJZCxcbiAgICAgICAgICAgICAgbmFtZTogbXNnLnR5cGUsXG4gICAgICAgICAgICAgIHRleHQ6IHN0cmVhbXMudGV4dCxcbiAgICAgICAgICAgICAgYmluYXJ5OiBzdHJlYW1zLmJpbmFyeSxcbiAgICAgICAgICAgICAgZXJyb3I6IHJlamVjdFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9LmJpbmQocG9ydCwgc3JjLCBtc2csIHByb3ApO1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGFyZ3MpKSB7XG4gICAgICAgIGFyZ3MgPSBbYXJnc107XG4gICAgICB9XG4gICAgICBpZiAocG9ydC5tb2RlID09PSBQcm92aWRlci5tb2RlLnN5bmNocm9ub3VzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0KHRoaXNbbXNnLnR5cGVdLmFwcGx5KHRoaXMsIGFyZ3MpKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHJldCh1bmRlZmluZWQsIGUubWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAocG9ydC5tb2RlID09PSBQcm92aWRlci5tb2RlLmFzeW5jaHJvbm91cykge1xuICAgICAgICB0aGlzW21zZy50eXBlXS5hcHBseShpbnN0YW5jZSwgYXJncy5jb25jYXQocmV0KSk7XG4gICAgICB9IGVsc2UgaWYgKHBvcnQubW9kZSA9PT0gUHJvdmlkZXIubW9kZS5wcm9taXNlcykge1xuICAgICAgICB0aGlzW21zZy50eXBlXS5hcHBseSh0aGlzLCBhcmdzKS50aGVuKHJldCwgcmV0LmJpbmQoe30sIHVuZGVmaW5lZCkpO1xuICAgICAgfVxuICAgIH1cbiAgfS5iaW5kKGluc3RhbmNlLCB0aGlzLCBzb3VyY2UpO1xufTtcblxuLyoqXG4gKiBHZXQgYSB0ZXh0dWFsIGRlc2NyaXB0aW9uIG9mIHRoaXMgcG9ydC5cbiAqIEBtZXRob2QgdG9TdHJpbmdcbiAqIEByZXR1cm4ge1N0cmluZ30gdGhlIGRlc2NyaXB0aW9uIG9mIHRoaXMgcG9ydC5cbiAqL1xuUHJvdmlkZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5lbWl0Q2hhbm5lbCkge1xuICAgIHJldHVybiBcIltQcm92aWRlciBcIiArIHRoaXMuZW1pdENoYW5uZWwgKyBcIl1cIjtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gXCJbdW5ib3VuZCBQcm92aWRlcl1cIjtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQcm92aWRlcjtcbiIsIi8qanNsaW50IGluZGVudDoyLCB3aGl0ZTp0cnVlLCBub2RlOnRydWUsIHNsb3BweTp0cnVlLCBicm93c2VyOnRydWUgKi9cbnZhciBQcm9taXNlQ29tcGF0ID0gcmVxdWlyZSgnZXM2LXByb21pc2UnKS5Qcm9taXNlO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcbnZhciBDb25zdW1lciA9IHJlcXVpcmUoJy4uL2NvbnN1bWVyJyk7XG5cbnZhciBBcGlJbnRlcmZhY2UgPSBmdW5jdGlvbihkZWYsIG9uTXNnLCBlbWl0LCBkZWJ1Zykge1xuICB2YXIgaW5mbGlnaHQgPSB7fSxcbiAgICAgIGV2ZW50cyA9IG51bGwsXG4gICAgICBlbWl0dGVyID0gbnVsbCxcbiAgICAgIHJlcUlkID0gMCxcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG5cbiAgdXRpbC5lYWNoUHJvcChkZWYsIGZ1bmN0aW9uKHByb3AsIG5hbWUpIHtcbiAgICBzd2l0Y2gocHJvcC50eXBlKSB7XG4gICAgY2FzZSAnbWV0aG9kJzpcbiAgICAgIHRoaXNbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gTm90ZTogaW5mbGlnaHQgc2hvdWxkIGJlIHJlZ2lzdGVyZWQgYmVmb3JlIG1lc3NhZ2UgaXMgcGFzc2VkXG4gICAgICAgIC8vIGluIG9yZGVyIHRvIHByZXBhcmUgZm9yIHN5bmNocm9ub3VzIGluLXdpbmRvdyBwaXBlcy5cbiAgICAgICAgdmFyIHRoaXNSZXEgPSByZXFJZCxcbiAgICAgICAgICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZUNvbXBhdChmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgaW5mbGlnaHRbdGhpc1JlcV0gPSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZTpyZXNvbHZlLFxuICAgICAgICAgICAgICAgIHJlamVjdDpyZWplY3QsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6IHByb3AucmV0XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHN0cmVhbXMgPSBDb25zdW1lci5tZXNzYWdlVG9Qb3J0YWJsZShwcm9wLnZhbHVlLFxuICAgICAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCksXG4gICAgICAgICAgICAgICAgZGVidWcpO1xuICAgICAgICByZXFJZCArPSAxO1xuICAgICAgICBlbWl0KHtcbiAgICAgICAgICBhY3Rpb246ICdtZXRob2QnLFxuICAgICAgICAgIHR5cGU6IG5hbWUsXG4gICAgICAgICAgcmVxSWQ6IHRoaXNSZXEsXG4gICAgICAgICAgdGV4dDogc3RyZWFtcy50ZXh0LFxuICAgICAgICAgIGJpbmFyeTogc3RyZWFtcy5iaW5hcnlcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgfTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2V2ZW50JzpcbiAgICAgIGlmKCFldmVudHMpIHtcbiAgICAgICAgdXRpbC5oYW5kbGVFdmVudHModGhpcyk7XG4gICAgICAgIGVtaXR0ZXIgPSB0aGlzLmVtaXQ7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmVtaXQ7XG4gICAgICAgIGV2ZW50cyA9IHt9O1xuICAgICAgfVxuICAgICAgZXZlbnRzW25hbWVdID0gcHJvcDtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NvbnN0YW50JzpcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBuYW1lLCB7XG4gICAgICAgIHZhbHVlOiBDb25zdW1lci5yZWN1cnNpdmVGcmVlemVPYmplY3QocHJvcC52YWx1ZSksXG4gICAgICAgIHdyaXRhYmxlOiBmYWxzZVxuICAgICAgfSk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH0uYmluZCh0aGlzKSk7XG5cbiAgb25Nc2codGhpcywgZnVuY3Rpb24odHlwZSwgbXNnKSB7XG4gICAgaWYgKHR5cGUgPT09ICdjbG9zZScpIHtcbiAgICAgIHRoaXMub2ZmKCk7XG4gICAgICBkZWxldGUgdGhpcy5pbmZsaWdodDtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCFtc2cpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKG1zZy50eXBlID09PSAnbWV0aG9kJykge1xuICAgICAgaWYgKGluZmxpZ2h0W21zZy5yZXFJZF0pIHtcbiAgICAgICAgdmFyIHJlc29sdmVyID0gaW5mbGlnaHRbbXNnLnJlcUlkXSxcbiAgICAgICAgICAgIHRlbXBsYXRlID0gcmVzb2x2ZXIudGVtcGxhdGU7XG4gICAgICAgIGRlbGV0ZSBpbmZsaWdodFttc2cucmVxSWRdO1xuICAgICAgICBpZiAobXNnLmVycm9yKSB7XG4gICAgICAgICAgcmVzb2x2ZXIucmVqZWN0KG1zZy5lcnJvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzb2x2ZXIucmVzb2x2ZShDb25zdW1lci5wb3J0YWJsZVRvTWVzc2FnZSh0ZW1wbGF0ZSwgbXNnLCBkZWJ1ZykpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWJ1Zy5lcnJvcignSW5jb21pbmcgbWVzc2FnZSBjbGFpbWVkIHRvIGJlIGFuIFJQQyAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAncmV0dXJuaW5nIGZvciB1bnJlZ2lzdGVyZWQgY2FsbCcsIG1zZy5yZXFJZCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChtc2cudHlwZSA9PT0gJ2V2ZW50Jykge1xuICAgICAgaWYgKGV2ZW50c1ttc2cubmFtZV0pIHtcbiAgICAgICAgZW1pdHRlcihtc2cubmFtZSwgQ29uc3VtZXIucG9ydGFibGVUb01lc3NhZ2UoZXZlbnRzW21zZy5uYW1lXS52YWx1ZSxcbiAgICAgICAgICAgICAgICBtc2csIGRlYnVnKSk7XG4gICAgICB9XG4gICAgfVxuICB9LmJpbmQodGhpcykpO1xuXG4gIGFyZ3MgPSBDb25zdW1lci5tZXNzYWdlVG9Qb3J0YWJsZShcbiAgICAgIChkZWYuY29uc3RydWN0b3IgJiYgZGVmLmNvbnN0cnVjdG9yLnZhbHVlKSA/IGRlZi5jb25zdHJ1Y3Rvci52YWx1ZSA6IFtdLFxuICAgICAgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJncywgNCksXG4gICAgICBkZWJ1Zyk7XG5cbiAgZW1pdCh7XG4gICAgdHlwZTogJ2NvbnN0cnVjdCcsXG4gICAgdGV4dDogYXJncy50ZXh0LFxuICAgIGJpbmFyeTogYXJncy5iaW5hcnlcbiAgfSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFwaUludGVyZmFjZTtcbiIsIi8qanNsaW50IGluZGVudDoyLCB3aGl0ZTp0cnVlLCBub2RlOnRydWUsIHNsb3BweTp0cnVlLCBicm93c2VyOnRydWUgKi9cbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG52YXIgRXZlbnRJbnRlcmZhY2UgPSBmdW5jdGlvbihvbk1zZywgZW1pdCwgZGVidWcpIHtcbiAgdXRpbC5oYW5kbGVFdmVudHModGhpcyk7XG4gIFxuICBvbk1zZyh0aGlzLCBmdW5jdGlvbihlbWl0LCB0eXBlLCBtc2cpIHtcbiAgICBlbWl0KG1zZy50eXBlLCBtc2cubWVzc2FnZSk7XG4gIH0uYmluZCh0aGlzLCB0aGlzLmVtaXQpKTtcblxuICB0aGlzLmVtaXQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlLCBtc2cpIHtcbiAgICBlbWl0dGVyKHt0eXBlOiB0eXBlLCBtZXNzYWdlOiBtc2d9LCB0cnVlKTtcbiAgfS5iaW5kKHt9LCBlbWl0KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRJbnRlcmZhY2U7XG4iLCIvKmpzbGludCBpbmRlbnQ6Miwgbm9kZTp0cnVlICovXG52YXIgUHJvbWlzZUNvbXBhdCA9IHJlcXVpcmUoJ2VzNi1wcm9taXNlJykuUHJvbWlzZTtcblxudmFyIEFwaUludGVyZmFjZSA9IHJlcXVpcmUoJy4vcHJveHkvYXBpSW50ZXJmYWNlJyk7XG52YXIgRXZlbnRJbnRlcmZhY2UgPSByZXF1aXJlKCcuL3Byb3h5L2V2ZW50SW50ZXJmYWNlJyk7XG52YXIgQ29uc3VtZXIgPSByZXF1aXJlKCcuL2NvbnN1bWVyJyk7XG52YXIgUHJvdmlkZXIgPSByZXF1aXJlKCcuL3Byb3ZpZGVyJyk7XG5cbi8qKlxuICogQSBQcm94eSBCaW5kZXIgbWFuYWdlcyB0aGUgZXh0ZXJuYWwgaW50ZXJmYWNlLCBhbmQgY3JlYXRlcyBvbmUgb2ZcbiAqIHRoZSBkaWZmZXJlbnQgdHlwZXMgb2Ygb2JqZWN0cyBleHBvc2VkIGJ5IGZyZWVkb20gZWl0aGVyIGFzIGEgZ2xvYmFsXG4gKiB3aXRoaW4gYSB3b3JrZXIgLyBtb2R1bGUgY29udGV4dCwgb3IgcmV0dXJuZWQgYnkgYW4gZXh0ZXJuYWwgY2FsbCB0b1xuICogY3JlYXRlIGEgZnJlZWRvbSBydW50aW1lLlxuICogQENsYXNzIFByb3h5QmluZGVyXG4gKiBAcGFyYW0ge01hbmFnZXJ9IG1hbmFnZXIgVGhlIG1hbmFnZXIgZm9yIHRoZSBhY3RpdmUgcnVudGltZS5cbiAqL1xudmFyIFByb3h5QmluZGVyID0gZnVuY3Rpb24gKG1hbmFnZXIpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICB0aGlzLm1hbmFnZXIgPSBtYW5hZ2VyO1xufTtcblxuLyoqXG4gKiBDcmVhdGUgYSBwcm94eSBmb3IgYSBmcmVlZG9tIHBvcnQsIGFuZCByZXR1cm4gaXQgb25jZSBsb2FkZWQuXG4gKiBAbWV0aG9kIGdldEV4dGVybmFsXG4gKiBAcGFyYW0ge1BvcnR9IHBvcnQgVGhlIHBvcnQgZm9yIHRoZSBwcm94eSB0byBjb21tdW5pY2F0ZSB3aXRoLlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHByb3h5LlxuICogQHBhcmFtIHtPYmplY3R9IFtkZWZpbml0aW9uXSBUaGUgZGVmaW5pdGlvbiBvZiB0aGUgQVBJIHRvIGV4cG9zZS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBkZWZpbml0aW9uLm5hbWUgVGhlIG5hbWUgb2YgdGhlIEFQSS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBkZWZpbml0aW9uLmRlZmluaXRpb24gVGhlIGRlZmluaXRpb24gb2YgdGhlIEFQSS5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gZGVmaW5pdGlvbi5wcm92aWRlcyBXaGV0aGVyIHRoaXMgaXMgYSBjb25zdW1lciBvciBwcm92aWRlci5cbiAqIEByZXR1cm5zIHtQcm9taXNlfSBBIHByb21pc2UgZm9yIHRoZSBhY3RpdmUgcHJveHkgaW50ZXJmYWNlLlxuICovXG5Qcm94eUJpbmRlci5wcm90b3R5cGUuZ2V0RXh0ZXJuYWwgPSBmdW5jdGlvbiAocG9ydCwgbmFtZSwgZGVmaW5pdGlvbikge1xuICAndXNlIHN0cmljdCc7XG4gIHZhciBwcm94eSwgYXBpO1xuICByZXR1cm4gbmV3IFByb21pc2VDb21wYXQoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgIGlmIChkZWZpbml0aW9uKSB7XG4gICAgICBhcGkgPSBkZWZpbml0aW9uLm5hbWU7XG4gICAgICBpZiAoZGVmaW5pdGlvbi5wcm92aWRlcykge1xuICAgICAgICBwcm94eSA9IG5ldyBQcm92aWRlcihkZWZpbml0aW9uLmRlZmluaXRpb24sIHRoaXMubWFuYWdlci5kZWJ1Zyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcm94eSA9IG5ldyBDb25zdW1lcihBcGlJbnRlcmZhY2UuYmluZCh7fSxcbiAgICAgICAgICAgIGRlZmluaXRpb24uZGVmaW5pdGlvbiksXG4gICAgICAgICAgICB0aGlzLm1hbmFnZXIuZGVidWcpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwcm94eSA9IG5ldyBDb25zdW1lcihFdmVudEludGVyZmFjZSwgdGhpcy5tYW5hZ2VyLmRlYnVnKTtcbiAgICB9XG5cbiAgICBwcm94eS5vbmNlKCdzdGFydCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBpZmFjZSA9IHByb3h5LmdldFByb3h5SW50ZXJmYWNlKCk7XG4gICAgICBpZiAoYXBpKSB7XG4gICAgICAgIGlmYWNlLmFwaSA9IGFwaTtcbiAgICAgIH1cbiAgICAgIHJlc29sdmUoe1xuICAgICAgICBwb3J0OiBwcm94eSxcbiAgICAgICAgZXh0ZXJuYWw6IGlmYWNlXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRoaXMubWFuYWdlci5jcmVhdGVMaW5rKHBvcnQsIG5hbWUsIHByb3h5KTtcbiAgfS5iaW5kKHRoaXMpKTtcbn07XG5cbi8qKlxuICogQmluZCB0aGUgZGVmYXVsdCBwcm94eSBmb3IgYSBmcmVlZG9tIHBvcnQuXG4gKiBAbWV0aG9kIGJpbmREZWZhdWx0XG4gKiBAcGFyYW0ge1BvcnR9IHBvcnQgVGhlIHBvcnQgZm9yIHRoZSBwcm94eSB0byBjb21tdW5pY2F0ZSB3aXRoLlxuICogQHBhcmFtIHtBcGl9IGFwaSBUaGUgQVBJIGxvYWRlciB3aXRoIEFQSSBkZWZpbml0aW9ucy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBtYW5pZmVzdCBUaGUgbWFuaWZlc3Qgb2YgdGhlIG1vZHVsZSB0byBleHBvc2UuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGludGVybmFsIFdoZXRoZXIgdGhlIGludGVyZmFjZSBpcyBmb3IgaW5zaWRlIHRoZSBtb2R1bGUuXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gQSBwcm9taXNlIGZvciBhIHByb3h5IGludGVyZmFjZS5cbiAqIEBwcml2YXRlXG4gKi9cblByb3h5QmluZGVyLnByb3RvdHlwZS5iaW5kRGVmYXVsdCA9IGZ1bmN0aW9uIChwb3J0LCBhcGksIG1hbmlmZXN0LCBpbnRlcm5hbCkge1xuICAndXNlIHN0cmljdCc7XG4gIHZhciBtZXRhZGF0YSA9IHtcbiAgICBuYW1lOiBtYW5pZmVzdC5uYW1lLFxuICAgIGljb246IG1hbmlmZXN0Lmljb24sXG4gICAgZGVzY3JpcHRpb246IG1hbmlmZXN0LmRlc2NyaXB0aW9uXG4gIH0sIGRlZjtcblxuICBpZiAobWFuaWZlc3RbJ2RlZmF1bHQnXSkge1xuICAgIGRlZiA9IGFwaS5nZXQobWFuaWZlc3RbJ2RlZmF1bHQnXSk7XG4gICAgaWYgKCFkZWYgJiYgbWFuaWZlc3QuYXBpICYmIG1hbmlmZXN0LmFwaVttYW5pZmVzdFsnZGVmYXVsdCddXSkge1xuICAgICAgZGVmID0ge1xuICAgICAgICBuYW1lOiBtYW5pZmVzdFsnZGVmYXVsdCddLFxuICAgICAgICBkZWZpbml0aW9uOiBtYW5pZmVzdC5hcGlbbWFuaWZlc3RbJ2RlZmF1bHQnXV1cbiAgICAgIH07XG4gICAgfVxuICAgIGlmIChpbnRlcm5hbCAmJiBtYW5pZmVzdC5wcm92aWRlcyAmJlxuICAgICAgICBtYW5pZmVzdC5wcm92aWRlcy5pbmRleE9mKG1hbmlmZXN0WydkZWZhdWx0J10pICE9PSBmYWxzZSkge1xuICAgICAgZGVmLnByb3ZpZGVzID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKGludGVybmFsKSB7XG4gICAgICBhcGkuZGVidWcud2FybihcImRlZmF1bHQgQVBJIG5vdCBwcm92aWRlZCwgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgXCJhcmUgeW91IG1pc3NpbmcgYSBwcm92aWRlcyBrZXkgaW4geW91ciBtYW5pZmVzdD9cIik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXMuZ2V0RXh0ZXJuYWwocG9ydCwgJ2RlZmF1bHQnLCBkZWYpLnRoZW4oXG4gICAgZnVuY3Rpb24gKG1ldGFkYXRhLCBpbmZvKSB7XG4gICAgICBpbmZvLmV4dGVybmFsLm1hbmlmZXN0ID0gbWV0YWRhdGE7XG4gICAgICByZXR1cm4gaW5mbztcbiAgICB9LmJpbmQodGhpcywgbWV0YWRhdGEpXG4gICk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByb3h5QmluZGVyO1xuIiwiLypnbG9iYWxzIFhNTEh0dHBSZXF1ZXN0ICovXG4vKmpzbGludCBpbmRlbnQ6Mixub2RlOnRydWUsc2xvcHB5OnRydWUgKi9cbnZhciBQcm9taXNlQ29tcGF0ID0gcmVxdWlyZSgnZXM2LXByb21pc2UnKS5Qcm9taXNlO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG4vKipcbiAqIFRoZSBSZXNvdXJjZSByZWdpc3RyeSBmb3IgRnJlZURPTS4gIFVzZWQgdG8gbG9vayB1cCByZXF1ZXN0ZWQgUmVzb3VyY2VzLFxuICogYW5kIHByb3ZpZGUgbG9va3VwIGFuZCBtaWdyYXRpb24gb2YgcmVzb3VyY2VzLlxuICogQENsYXNzIFJlc291cmNlXG4gKiBAcGFyYW0ge0RlYnVnfSBkZWJ1ZyBUaGUgbG9nZ2VyIHRvIHVzZSBmb3IgZGVidWdnaW5nLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZhciBSZXNvdXJjZSA9IGZ1bmN0aW9uIChkZWJ1Zykge1xuICB0aGlzLmRlYnVnID0gZGVidWc7XG4gIHRoaXMuZmlsZXMgPSB7fTtcbiAgdGhpcy5yZXNvbHZlcnMgPSBbdGhpcy5odHRwUmVzb2x2ZXIsIHRoaXMubnVsbFJlc29sdmVyXTtcbiAgdGhpcy5jb250ZW50UmV0cmlldmVycyA9IHtcbiAgICAnaHR0cCc6IHRoaXMueGhyUmV0cmlldmVyLFxuICAgICdodHRwcyc6IHRoaXMueGhyUmV0cmlldmVyLFxuICAgICdjaHJvbWUtZXh0ZW5zaW9uJzogdGhpcy54aHJSZXRyaWV2ZXIsXG4gICAgJ3Jlc291cmNlJzogdGhpcy54aHJSZXRyaWV2ZXIsXG4gICAgJ2Nocm9tZSc6IHRoaXMueGhyUmV0cmlldmVyLFxuICAgICdhcHAnOiB0aGlzLnhoclJldHJpZXZlcixcbiAgICAnbWFuaWZlc3QnOiB0aGlzLm1hbmlmZXN0UmV0cmlldmVyXG4gIH07XG59O1xuXG4vKipcbiAqIFJlc29sdmUgYSByZXN1cmNlIFVSTCByZXF1ZXN0ZWQgZnJvbSBhIG1vZHVsZS5cbiAqIEBtZXRob2QgZ2V0XG4gKiBAcGFyYW0ge1N0cmluZ30gbWFuaWZlc3QgVGhlIGNhbm9uaWNhbCBhZGRyZXNzIG9mIHRoZSBtb2R1bGUgcmVxdWVzdGluZy5cbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmwgVGhlIHJlc291cmNlIHRvIGdldC5cbiAqIEByZXR1cm5zIHtQcm9taXNlfSBBIHByb21pc2UgZm9yIHRoZSByZXNvdXJjZSBhZGRyZXNzLlxuICovXG5SZXNvdXJjZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKG1hbmlmZXN0LCB1cmwpIHtcbiAgdmFyIGtleSA9IEpTT04uc3RyaW5naWZ5KFttYW5pZmVzdCwgdXJsXSk7XG4gIFxuICByZXR1cm4gbmV3IFByb21pc2VDb21wYXQoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgIGlmICh0aGlzLmZpbGVzW2tleV0pIHtcbiAgICAgIHJlc29sdmUodGhpcy5maWxlc1trZXldKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5yZXNvbHZlKG1hbmlmZXN0LCB1cmwpLnRoZW4oZnVuY3Rpb24gKGtleSwgcmVzb2x2ZSwgYWRkcmVzcykge1xuICAgICAgICB0aGlzLmZpbGVzW2tleV0gPSBhZGRyZXNzO1xuICAgICAgICAvL2Zkb20uZGVidWcubG9nKCdSZXNvbHZlZCAnICsga2V5ICsgJyB0byAnICsgYWRkcmVzcyk7XG4gICAgICAgIHJlc29sdmUoYWRkcmVzcyk7XG4gICAgICB9LmJpbmQodGhpcywga2V5LCByZXNvbHZlKSwgcmVqZWN0KTtcbiAgICB9XG4gIH0uYmluZCh0aGlzKSk7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgY29udGVudHMgb2YgYSByZXNvdXJjZS5cbiAqIEBtZXRob2QgZ2V0Q29udGVudHNcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmwgVGhlIHJlc291cmNlIHRvIHJlYWQuXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gQSBwcm9taXNlIGZvciB0aGUgcmVzb3VyY2UgY29udGVudHMuXG4gKi9cblJlc291cmNlLnByb3RvdHlwZS5nZXRDb250ZW50cyA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlQ29tcGF0KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICB2YXIgcHJvcDtcbiAgICBpZiAoIXVybCkge1xuICAgICAgdGhpcy5kZWJ1Zy53YXJuKFwiQXNrZWQgdG8gZ2V0IGNvbnRlbnRzIG9mIHVuZGVmaW5lZCBVUkwuXCIpO1xuICAgICAgcmV0dXJuIHJlamVjdCgpO1xuICAgIH1cbiAgICBmb3IgKHByb3AgaW4gdGhpcy5jb250ZW50UmV0cmlldmVycykge1xuICAgICAgaWYgKHRoaXMuY29udGVudFJldHJpZXZlcnMuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcbiAgICAgICAgaWYgKHVybC5pbmRleE9mKHByb3AgKyBcIjovL1wiKSA9PT0gMCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNvbnRlbnRSZXRyaWV2ZXJzW3Byb3BdLmNhbGwodGhpcywgdXJsLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9IGVsc2UgaWYgKHVybC5pbmRleE9mKFwiOi8vXCIpID09PSAtMSAmJiBwcm9wID09PSBcIm51bGxcIikge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNvbnRlbnRSZXRyaWV2ZXJzW3Byb3BdLmNhbGwodGhpcywgdXJsLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJlamVjdCgpO1xuICB9LmJpbmQodGhpcykpO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgZmlyc3Qgb2YgYW4gYXJyYXkgb2YgcHJvbWlzZXNcbiAqIHJlc29sdmVzLCBvciByZWplY3RzIGFmdGVyIGFsbCBwcm9taXNlcyByZWplY3QuIENhbiBiZSB0aG91Z2h0IG9mIGFzXG4gKiB0aGUgbWlzc2luZyAnUHJvbWlzZS5hbnknIC0gcmFjZSBpcyBubyBnb29kLCBzaW5jZSBlYXJseSByZWplY3Rpb25zXG4gKiBwcmVlbXB0IGEgc3Vic2VxdWVudCByZXNvbHV0aW9uLlxuICogQHByaXZhdGVcbiAqIEBzdGF0aWNcbiAqIEBtZXRob2QgRmlyc3RQcm9taXNlXG4gKiBAcGFyYW0ge1Byb21pc2VbXX0gUHJvbWlzZXMgdG8gc2VsZWN0IGZyb21cbiAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHJlc29sdmluZyB3aXRoIGEgdmFsdWUgZnJvbSBhcmd1bWVudHMuXG4gKi9cbnZhciBmaXJzdFByb21pc2UgPSBmdW5jdGlvbihwcm9taXNlcykge1xuICByZXR1cm4gbmV3IFByb21pc2VDb21wYXQoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdmFyIGVycm9ycyA9IFtdO1xuICAgIHByb21pc2VzLmZvckVhY2goZnVuY3Rpb24ocHJvbWlzZSkge1xuICAgICAgcHJvbWlzZS50aGVuKHJlc29sdmUsIGZ1bmN0aW9uKGVycikge1xuICAgICAgICBlcnJvcnMucHVzaChlcnIpO1xuICAgICAgICBpZiAoZXJyb3JzLmxlbmd0aCA9PT0gcHJvbWlzZXMubGVuZ3RoKSB7XG4gICAgICAgICAgcmVqZWN0KGVycm9ycyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn07XG5cbi8qKlxuICogUmVzb2x2ZSBhIHJlc291cmNlIHVzaW5nIGtub3duIHJlc29sdmVycy4gVW5saWtlIGdldCwgcmVzb2x2ZSBkb2VzXG4gKiBub3QgY2FjaGUgcmVzb2x2ZWQgcmVzb3VyY2VzLlxuICogQG1ldGhvZCByZXNvbHZlXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtTdHJpbmd9IG1hbmlmZXN0IFRoZSBtb2R1bGUgcmVxdWVzdGluZyB0aGUgcmVzb3VyY2UuXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsIFRoZSByZXNvdXJjZSB0byByZXNvbHZlO1xuICogQHJldHVybnMge1Byb21pc2V9IEEgcHJvbWlzZSBmb3IgdGhlIHJlc291cmNlIGFkZHJlc3MuXG4gKi9cblJlc291cmNlLnByb3RvdHlwZS5yZXNvbHZlID0gZnVuY3Rpb24gKG1hbmlmZXN0LCB1cmwpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlQ29tcGF0KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICB2YXIgcHJvbWlzZXMgPSBbXTtcbiAgICBpZiAodXJsID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiByZWplY3QoKTtcbiAgICB9XG4gICAgdXRpbC5lYWNoUmV2ZXJzZSh0aGlzLnJlc29sdmVycywgZnVuY3Rpb24gKHJlc29sdmVyKSB7XG4gICAgICBwcm9taXNlcy5wdXNoKG5ldyBQcm9taXNlQ29tcGF0KHJlc29sdmVyLmJpbmQoe30sIG1hbmlmZXN0LCB1cmwpKSk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgICBmaXJzdFByb21pc2UocHJvbWlzZXMpLnRoZW4ocmVzb2x2ZSwgZnVuY3Rpb24oKSB7XG4gICAgICByZWplY3QoJ05vIHJlc29sdmVycyB0byBoYW5kbGUgdXJsOiAnICsgSlNPTi5zdHJpbmdpZnkoW21hbmlmZXN0LCB1cmxdKSk7XG4gICAgfSk7XG4gIH0uYmluZCh0aGlzKSk7XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVyIHJlc29sdmVyczogY29kZSB0aGF0IGtub3dzIGhvdyB0byBnZXQgcmVzb3VyY2VzXG4gKiBuZWVkZWQgYnkgdGhlIHJ1bnRpbWUuIEEgcmVzb2x2ZXIgd2lsbCBiZSBjYWxsZWQgd2l0aCBmb3VyXG4gKiBhcmd1bWVudHM6IHRoZSBhYnNvbHV0ZSBtYW5pZmVzdCBvZiB0aGUgcmVxdWVzdGVyLCB0aGVcbiAqIHJlc291cmNlIGJlaW5nIHJlcXVlc3RlZCwgYW5kIGEgcmVzb2x2ZSAvIHJlamVjdCBwYWlyIHRvXG4gKiBmdWxmaWxsIGEgcHJvbWlzZS5cbiAqIEBtZXRob2QgYWRkUmVzb2x2ZXJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IHJlc29sdmVyIFRoZSByZXNvbHZlciB0byBhZGQuXG4gKi9cblJlc291cmNlLnByb3RvdHlwZS5hZGRSZXNvbHZlciA9IGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICB0aGlzLnJlc29sdmVycy5wdXNoKHJlc29sdmVyKTtcbn07XG5cbi8qKlxuICogUmVnaXN0ZXIgcmV0cmlldmVyczogY29kZSB0aGF0IGtub3dzIGhvdyB0byBsb2FkIHJlc291cmNlc1xuICogbmVlZGVkIGJ5IHRoZSBydW50aW1lLiBBIHJldHJpZXZlciB3aWxsIGJlIGNhbGxlZCB3aXRoIGEgVVJMXG4gKiB0byByZXRyaWV2ZSB3aXRoIGEgcHJvdG9jb2wgdGhhdCBpdCBpcyBhYmxlIHRvIGhhbmRsZS5cbiAqIEBtZXRob2QgYWRkUmV0cmlldmVyXG4gKiBAcGFyYW0ge1N0cmluZ30gcHJvdG8gVGhlIHByb3RvY29sIHRvIHJlZ2lzdGVyIGZvci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHJldHJpZXZlciBUaGUgcmV0cmlldmVyIHRvIGFkZC5cbiAqL1xuUmVzb3VyY2UucHJvdG90eXBlLmFkZFJldHJpZXZlciA9IGZ1bmN0aW9uIChwcm90bywgcmV0cmlldmVyKSB7XG4gIGlmICh0aGlzLmNvbnRlbnRSZXRyaWV2ZXJzW3Byb3RvXSkge1xuICAgIHRoaXMuZGVidWcud2FybihcIlVud2lsbGluZyB0byBvdmVycmlkZSBmaWxlIHJldHJpZXZhbCBmb3IgXCIgKyBwcm90byk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMuY29udGVudFJldHJpZXZlcnNbcHJvdG9dID0gcmV0cmlldmVyO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlciBleHRlcm5hbCByZXNvbHZlcnMgYW5kIHJldHJlYXZlcnNcbiAqIEBtZXRob2QgcmVnaXN0ZXJcbiAqIEBwYXJhbSB7e1wicHJvdG9cIjpTdHJpbmcsIFwicmVzb2x2ZXJcIjpGdW5jdGlvbiwgXCJyZXRyZWF2ZXJcIjpGdW5jdGlvbn1bXX1cbiAqICAgICByZXNvbHZlcnMgVGhlIGxpc3Qgb2YgcmV0cmVpdmVycyBhbmQgcmVzb2x2ZXJzLlxuICovXG5SZXNvdXJjZS5wcm90b3R5cGUucmVnaXN0ZXIgPSBmdW5jdGlvbiAocmVzb2x2ZXJzKSB7XG4gIGlmICghcmVzb2x2ZXJzLmxlbmd0aCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHJlc29sdmVycy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgaWYgKGl0ZW0ucmVzb2x2ZXIpIHtcbiAgICAgIHRoaXMuYWRkUmVzb2x2ZXIoaXRlbS5yZXNvbHZlcik7XG4gICAgfSBlbHNlIGlmIChpdGVtLnByb3RvICYmIGl0ZW0ucmV0cmlldmVyKSB7XG4gICAgICB0aGlzLmFkZFJldHJpZXZlcihpdGVtLnByb3RvLCBpdGVtLnJldHJpZXZlcik7XG4gICAgfVxuICB9LmJpbmQodGhpcykpO1xufTtcblxuLyoqXG4gKiBEZXRlcm1pbmUgaWYgYSBVUkwgaXMgYW4gYWJzb2x1dGUgVVJMIG9mIGEgZ2l2ZW4gU2NoZW1lLlxuICogQG1ldGhvZCBoYXNTY2hlbWVcbiAqIEBzdGF0aWNcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge1N0cmluZ1tdfSBwcm90b2NvbHMgV2hpdGVsaXN0ZWQgcHJvdG9jb2xzXG4gKiBAcGFyYW0ge1N0cmluZ30gVVJMIHRoZSBVUkwgdG8gbWF0Y2guXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gSWYgdGhlIFVSTCBpcyBhbiBhYnNvbHV0ZSBleGFtcGxlIG9mIG9uZSBvZiB0aGUgc2NoZW1lcy5cbiAqL1xuUmVzb3VyY2UuaGFzU2NoZW1lID0gZnVuY3Rpb24gKHByb3RvY29scywgdXJsKSB7XG4gIHZhciBpO1xuICBmb3IgKGkgPSAwOyBpIDwgcHJvdG9jb2xzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgaWYgKHVybC5pbmRleE9mKHByb3RvY29sc1tpXSArIFwiOi8vXCIpID09PSAwKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgJy4vJyBhbmQgJy4uLycgZnJvbSBhIFVSTFxuICogUmVxdWlyZWQgYmVjYXVzZSBDaHJvbWUgQXBwcyBmb3IgTW9iaWxlIChjY2EpIGRvZXNuJ3QgdW5kZXJzdGFuZFxuICogWEhSIHBhdGhzIHdpdGggdGhlc2UgcmVsYXRpdmUgY29tcG9uZW50cyBpbiB0aGUgVVJMLlxuICogQG1ldGhvZCByZW1vdmVSZWxhdGl2ZVBhdGhcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmwgVGhlIFVSTCB0byBtb2RpZnlcbiAqIEByZXR1cm5zIHtTdHJpbmd9IHVybCB3aXRob3V0ICcuLycgYW5kICcuLi8nXG4gKiovXG5SZXNvdXJjZS5yZW1vdmVSZWxhdGl2ZVBhdGggPSBmdW5jdGlvbiAodXJsKSB7XG4gIHZhciBpZHggPSB1cmwuaW5kZXhPZihcIjovL1wiKSArIDMsXG4gICAgc3RhY2ssXG4gICAgdG9SZW1vdmUsXG4gICAgcmVzdWx0O1xuICAvLyBSZW1vdmUgYWxsIGluc3RhbmNlcyBvZiAvLi9cbiAgdXJsID0gdXJsLnJlcGxhY2UoL1xcL1xcLlxcLy9nLCBcIi9cIik7XG4gIC8vV2VpcmQgYnVnIHdoZXJlIGluIGNjYSwgbWFuaWZlc3Qgc3RhcnRzIHdpdGggJ2Nocm9tZTovLy8vJ1xuICAvL1RoaXMgZm9yY2VzIHRoZXJlIHRvIG9ubHkgYmUgMiBzbGFzaGVzXG4gIHdoaWxlICh1cmwuY2hhckF0KGlkeCkgPT09IFwiL1wiKSB7XG4gICAgdXJsID0gdXJsLnNsaWNlKDAsIGlkeCkgKyB1cmwuc2xpY2UoaWR4ICsgMSwgdXJsLmxlbmd0aCk7XG4gIH1cblxuICAvLyBBZHZhbmNlIHRvIG5leHQgL1xuICBpZHggPSB1cmwuaW5kZXhPZihcIi9cIiwgaWR4KTtcbiAgLy8gUmVtb3ZpbmcgLi4vXG4gIHN0YWNrID0gdXJsLnN1YnN0cihpZHggKyAxKS5zcGxpdChcIi9cIik7XG4gIHdoaWxlIChzdGFjay5pbmRleE9mKFwiLi5cIikgIT09IC0xKSB7XG4gICAgdG9SZW1vdmUgPSBzdGFjay5pbmRleE9mKFwiLi5cIik7XG4gICAgaWYgKHRvUmVtb3ZlID09PSAwKSB7XG4gICAgICBzdGFjay5zaGlmdCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGFjay5zcGxpY2UoKHRvUmVtb3ZlIC0gMSksIDIpO1xuICAgIH1cbiAgfVxuICBcbiAgLy9SZWJ1aWxkIHN0cmluZ1xuICByZXN1bHQgPSB1cmwuc3Vic3RyKDAsIGlkeCk7XG4gIGZvciAoaWR4ID0gMDsgaWR4IDwgc3RhY2subGVuZ3RoOyBpZHggKz0gMSkge1xuICAgIHJlc3VsdCArPSBcIi9cIiArIHN0YWNrW2lkeF07XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogUmVzb2x2ZSBVUkxzIHdoaWNoIGNhbiBiZSBhY2Nlc3NlZCB1c2luZyBzdGFuZGFyZCBIVFRQIHJlcXVlc3RzLlxuICogQG1ldGhvZCBodHRwUmVzb2x2ZXJcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge1N0cmluZ30gbWFuaWZlc3QgVGhlIE1hbmlmZXN0IFVSTC5cbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmwgVGhlIFVSTCB0byByZXNvbHZlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gcmVzb2x2ZSBUaGUgcHJvbWlzZSB0byBjb21wbGV0ZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHJlamVjdCBUaGUgcHJvbWlzZSB0byByZWplY3QuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gVHJ1ZSBpZiB0aGUgVVJMIGNvdWxkIGJlIHJlc29sdmVkLlxuICovXG5SZXNvdXJjZS5wcm90b3R5cGUuaHR0cFJlc29sdmVyID0gZnVuY3Rpb24gKG1hbmlmZXN0LCB1cmwsIHJlc29sdmUsIHJlamVjdCkge1xuICB2YXIgcHJvdG9jb2xzID0gW1wiaHR0cFwiLCBcImh0dHBzXCIsIFwiY2hyb21lXCIsIFwiY2hyb21lLWV4dGVuc2lvblwiLCBcInJlc291cmNlXCIsXG4gICAgICAgICAgICAgICAgICAgXCJhcHBcIl0sXG4gICAgZGlybmFtZSxcbiAgICBwcm90b2NvbElkeCxcbiAgICBwYXRoSWR4LFxuICAgIHBhdGgsXG4gICAgYmFzZSxcbiAgICByZXN1bHQ7XG5cbiAgaWYgKFJlc291cmNlLmhhc1NjaGVtZShwcm90b2NvbHMsIHVybCkpIHtcbiAgICByZXNvbHZlKFJlc291cmNlLnJlbW92ZVJlbGF0aXZlUGF0aCh1cmwpKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBcbiAgaWYgKCFtYW5pZmVzdCkge1xuICAgIHJlamVjdCgpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoUmVzb3VyY2UuaGFzU2NoZW1lKHByb3RvY29scywgbWFuaWZlc3QpICYmXG4gICAgICB1cmwuaW5kZXhPZihcIjovL1wiKSA9PT0gLTEpIHtcbiAgICBkaXJuYW1lID0gbWFuaWZlc3Quc3Vic3RyKDAsIG1hbmlmZXN0Lmxhc3RJbmRleE9mKFwiL1wiKSk7XG4gICAgcHJvdG9jb2xJZHggPSBkaXJuYW1lLmluZGV4T2YoXCI6Ly9cIik7XG4gICAgcGF0aElkeCA9IHByb3RvY29sSWR4ICsgMyArIGRpcm5hbWUuc3Vic3RyKHByb3RvY29sSWR4ICsgMykuaW5kZXhPZihcIi9cIik7XG4gICAgcGF0aCA9IGRpcm5hbWUuc3Vic3RyKHBhdGhJZHgpO1xuICAgIGJhc2UgPSBkaXJuYW1lLnN1YnN0cigwLCBwYXRoSWR4KTtcbiAgICBpZiAodXJsLmluZGV4T2YoXCIvXCIpID09PSAwKSB7XG4gICAgICByZXNvbHZlKFJlc291cmNlLnJlbW92ZVJlbGF0aXZlUGF0aChiYXNlICsgdXJsKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc29sdmUoUmVzb3VyY2UucmVtb3ZlUmVsYXRpdmVQYXRoKGJhc2UgKyBwYXRoICsgXCIvXCIgKyB1cmwpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmVqZWN0KCk7XG59O1xuXG4vKipcbiAqIFJlc29sdmUgVVJMcyB3aGljaCBhcmUgc2VsZi1kZXNjcmliaW5nLlxuICogQG1ldGhvZCBudWxsUmVzb2x2ZXJcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge1N0cmluZ30gbWFuaWZlc3QgVGhlIE1hbmlmZXN0IFVSTC5cbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmwgVGhlIFVSTCB0byByZXNvbHZlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gcmVzb2x2ZSBUaGUgcHJvbWlzZSB0byBjb21wbGV0ZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHJlamVjdCBUaGUgcHJvbWlzZSB0byByZWplY3QuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gVHJ1ZSBpZiB0aGUgVVJMIGNvdWxkIGJlIHJlc29sdmVkLlxuICovXG5SZXNvdXJjZS5wcm90b3R5cGUubnVsbFJlc29sdmVyID0gZnVuY3Rpb24gKG1hbmlmZXN0LCB1cmwsIHJlc29sdmUsIHJlamVjdCkge1xuICB2YXIgcHJvdG9jb2xzID0gW1wibWFuaWZlc3RcIl07XG4gIGlmIChSZXNvdXJjZS5oYXNTY2hlbWUocHJvdG9jb2xzLCB1cmwpKSB7XG4gICAgcmVzb2x2ZSh1cmwpO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKHVybC5pbmRleE9mKCdkYXRhOicpID09PSAwKSB7XG4gICAgcmVzb2x2ZSh1cmwpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJlamVjdCgpO1xufTtcblxuLyoqXG4gKiBSZXRyaWV2ZSBtYW5pZmVzdCBjb250ZW50IGZyb20gYSBzZWxmLWRlc2NyaXB0aXZlIG1hbmlmZXN0IHVybC5cbiAqIFRoZXNlIHVybHMgYXJlIHVzZWQgdG8gcmVmZXJlbmNlIGEgbWFuaWZlc3Qgd2l0aG91dCByZXF1aXJpbmcgc3Vic2VxdWVudCxcbiAqIHBvdGVudGlhbGx5IG5vbi1DT1JTIHJlcXVlc3RzLlxuICogQG1ldGhvZCBtYW5pZmVzdFJldHJpZXZlclxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBtYW5pZmVzdCBUaGUgTWFuaWZlc3QgVVJMXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSByZXNvbHZlIFRoZSBwcm9taXNlIHRvIGNvbXBsZXRlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gcmVqZWN0IFRoZSBwcm9taXNlIHRvIHJlamVjdC5cbiAqL1xuUmVzb3VyY2UucHJvdG90eXBlLm1hbmlmZXN0UmV0cmlldmVyID0gZnVuY3Rpb24gKG1hbmlmZXN0LCByZXNvbHZlLCByZWplY3QpIHtcbiAgdmFyIGRhdGE7XG4gIHRyeSB7XG4gICAgZGF0YSA9IG1hbmlmZXN0LnN1YnN0cigxMSk7XG4gICAgSlNPTi5wYXJzZShkYXRhKTtcbiAgICByZXNvbHZlKGRhdGEpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhpcy5kZWJ1Zy53YXJuKFwiSW52YWxpZCBtYW5pZmVzdCBVUkwgcmVmZXJlbmNlZDpcIiArIG1hbmlmZXN0KTtcbiAgICByZWplY3QoKTtcbiAgfVxufTtcblxuLyoqXG4gKiBSZXRyaWV2ZSByZXNvdXJjZSBjb250ZW50cyB1c2luZyBhbiBYSFIgcmVxdWVzdC5cbiAqIEBtZXRob2QgeGhyUmV0cmlldmVyXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtTdHJpbmd9IHVybCBUaGUgcmVzb3VyY2UgdG8gZmV0Y2guXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSByZXNvbHZlIFRoZSBwcm9taXNlIHRvIGNvbXBsZXRlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gcmVqZWN0IFRoZSBwcm9taXNlIHRvIHJlamVjdC5cbiAqL1xuUmVzb3VyY2UucHJvdG90eXBlLnhoclJldHJpZXZlciA9IGZ1bmN0aW9uICh1cmwsIHJlc29sdmUsIHJlamVjdCkge1xuICB2YXIgcmVmID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gIHJlZi5hZGRFdmVudExpc3RlbmVyKFwicmVhZHlzdGF0ZWNoYW5nZVwiLCBmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgaWYgKHJlZi5yZWFkeVN0YXRlID09PSA0ICYmIHJlZi5yZXNwb25zZVRleHQpIHtcbiAgICAgIHJlc29sdmUocmVmLnJlc3BvbnNlVGV4dCk7XG4gICAgfSBlbHNlIGlmIChyZWYucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgdGhpcy5kZWJ1Zy53YXJuKFwiRmFpbGVkIHRvIGxvYWQgZmlsZSBcIiArIHVybCArIFwiOiBcIiArIHJlZi5zdGF0dXMpO1xuICAgICAgcmVqZWN0KHJlZi5zdGF0dXMpO1xuICAgIH1cbiAgfS5iaW5kKHRoaXMsIHJlc29sdmUsIHJlamVjdCksIGZhbHNlKTtcbiAgcmVmLm92ZXJyaWRlTWltZVR5cGUoXCJhcHBsaWNhdGlvbi9qc29uXCIpO1xuICByZWYub3BlbihcIkdFVFwiLCB1cmwsIHRydWUpO1xuICByZWYuc2VuZCgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZXNvdXJjZTtcbiIsIi8qZ2xvYmFscyBjcnlwdG8sIFdlYktpdEJsb2JCdWlsZGVyLCBCbG9iLCBVUkwgKi9cbi8qZ2xvYmFscyB3ZWJraXRVUkwsIFVpbnQ4QXJyYXksIFVpbnQxNkFycmF5LCBBcnJheUJ1ZmZlciAqL1xuLypqc2xpbnQgaW5kZW50OjIsd2hpdGU6dHJ1ZSxicm93c2VyOnRydWUsbm9kZTp0cnVlLHNsb3BweTp0cnVlICovXG5cbi8qKlxuICogVXRpbGl0eSBtZXRob2QgdXNlZCB3aXRoaW4gdGhlIGZyZWVkb20gTGlicmFyeS5cbiAqIEBjbGFzcyB1dGlsXG4gKiBAc3RhdGljXG4gKi9cbnZhciB1dGlsID0ge307XG5cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gZm9yIGl0ZXJhdGluZyBvdmVyIGFuIGFycmF5IGJhY2t3YXJkcy4gSWYgdGhlIGZ1bmNcbiAqIHJldHVybnMgYSB0cnVlIHZhbHVlLCBpdCB3aWxsIGJyZWFrIG91dCBvZiB0aGUgbG9vcC5cbiAqIEBtZXRob2QgZWFjaFJldmVyc2VcbiAqIEBzdGF0aWNcbiAqL1xudXRpbC5lYWNoUmV2ZXJzZSA9IGZ1bmN0aW9uKGFyeSwgZnVuYykge1xuICBpZiAoYXJ5KSB7XG4gICAgdmFyIGk7XG4gICAgZm9yIChpID0gYXJ5Lmxlbmd0aCAtIDE7IGkgPiAtMTsgaSAtPSAxKSB7XG4gICAgICBpZiAoYXJ5W2ldICYmIGZ1bmMoYXJ5W2ldLCBpLCBhcnkpKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBAbWV0aG9kIGhhc1Byb3BcbiAqIEBzdGF0aWNcbiAqL1xudXRpbC5oYXNQcm9wID0gZnVuY3Rpb24ob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn07XG5cbi8qKlxuICogQ3ljbGVzIG92ZXIgcHJvcGVydGllcyBpbiBhbiBvYmplY3QgYW5kIGNhbGxzIGEgZnVuY3Rpb24gZm9yIGVhY2hcbiAqIHByb3BlcnR5IHZhbHVlLiBJZiB0aGUgZnVuY3Rpb24gcmV0dXJucyBhIHRydXRoeSB2YWx1ZSwgdGhlbiB0aGVcbiAqIGl0ZXJhdGlvbiBpcyBzdG9wcGVkLlxuICogQG1ldGhvZCBlYWNoUHJvcFxuICogQHN0YXRpY1xuICovXG51dGlsLmVhY2hQcm9wID0gZnVuY3Rpb24ob2JqLCBmdW5jKSB7XG4gIHZhciBwcm9wO1xuICBmb3IgKHByb3AgaW4gb2JqKSB7XG4gICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgaWYgKGZ1bmMob2JqW3Byb3BdLCBwcm9wKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogU2ltcGxlIGZ1bmN0aW9uIHRvIG1peCBpbiBwcm9wZXJ0aWVzIGZyb20gc291cmNlIGludG8gdGFyZ2V0LFxuICogYnV0IG9ubHkgaWYgdGFyZ2V0IGRvZXMgbm90IGFscmVhZHkgaGF2ZSBhIHByb3BlcnR5IG9mIHRoZSBzYW1lIG5hbWUuXG4gKiBUaGlzIGlzIG5vdCByb2J1c3QgaW4gSUUgZm9yIHRyYW5zZmVycmluZyBtZXRob2RzIHRoYXQgbWF0Y2hcbiAqIE9iamVjdC5wcm90b3R5cGUgbmFtZXMsIGJ1dCB0aGUgdXNlcyBvZiBtaXhpbiBoZXJlIHNlZW0gdW5saWtlbHkgdG9cbiAqIHRyaWdnZXIgYSBwcm9ibGVtIHJlbGF0ZWQgdG8gdGhhdC5cbiAqIEBtZXRob2QgbWl4aW5cbiAqIEBzdGF0aWNcbiAqL1xudXRpbC5taXhpbiA9IGZ1bmN0aW9uKHRhcmdldCwgc291cmNlLCBmb3JjZSkge1xuICBpZiAoc291cmNlKSB7XG4gICAgdXRpbC5lYWNoUHJvcChzb3VyY2UsIGZ1bmN0aW9uICh2YWx1ZSwgcHJvcCkge1xuICAgICAgaWYgKGZvcmNlIHx8ICF1dGlsLmhhc1Byb3AodGFyZ2V0LCBwcm9wKSkge1xuICAgICAgICB0YXJnZXRbcHJvcF0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICByZXR1cm4gdGFyZ2V0O1xufTtcblxuLyoqXG4gKiBHZXQgYSB1bmlxdWUgSUQuXG4gKiBAbWV0aG9kIGdldElkXG4gKiBAc3RhdGljXG4gKi9cbnV0aWwuZ2V0SWQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGd1aWQgPSAnZ3VpZCcsXG4gICAgICBkb21haW4gPSAxMixcbiAgICAgIGJ1ZmZlcjtcbiAgLy8gQ2hyb21lIC8gRmlyZWZveC5cbiAgaWYgKHR5cGVvZiBjcnlwdG8gPT09ICdvYmplY3QnICYmIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMpIHtcbiAgICBidWZmZXIgPSBuZXcgVWludDhBcnJheShkb21haW4pO1xuICAgIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMoYnVmZmVyKTtcbiAgICB1dGlsLmVhY2hSZXZlcnNlKGJ1ZmZlciwgZnVuY3Rpb24obikge1xuICAgICAgZ3VpZCArPSAnLScgKyBuO1xuICAgIH0pO1xuICAvLyBOb2RlXG4gIH0gZWxzZSBpZiAodHlwZW9mIGNyeXB0byA9PT0gJ29iamVjdCcgJiYgY3J5cHRvLnJhbmRvbUJ5dGVzKSB7XG4gICAgYnVmZmVyID0gY3J5cHRvLnJhbmRvbUJ5dGVzKGRvbWFpbik7XG4gICAgdXRpbC5lYWNoUmV2ZXJzZShidWZmZXIsIGZ1bmN0aW9uKG4pIHtcbiAgICAgIGd1aWQgKz0gJy0nICsgbjtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICB3aGlsZSAoZG9tYWluID4gMCkge1xuICAgICAgZ3VpZCArPSAnLScgKyBNYXRoLmNlaWwoMjU1ICogTWF0aC5yYW5kb20oKSk7XG4gICAgICBkb21haW4gLT0gMTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZ3VpZDtcbn07XG5cbi8qKlxuICogRW5jb2RlIGEgc3RyaW5nIGludG8gYSBiaW5hcnkgYXJyYXkgYnVmZmVyLCBieSB0cmVhdGluZyBlYWNoIGNoYXJhY3RlciBhcyBhXG4gKiB1dGYxNiBlbmNvZGVkIGNoYXJhY3RlciAtIHRoZSBuYXRpdmUgamF2YXNjcmlwdCBlbmNvZGluZy5cbiAqIEBtZXRob2Qgc3RyMmFiXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyIFRoZSBzdHJpbmcgdG8gZW5jb2RlLlxuICogQHJldHVybnMge0FycmF5QnVmZmVyfSBUaGUgZW5jb2RlZCBzdHJpbmcuXG4gKi9cbnV0aWwuc3RyMmFiID0gZnVuY3Rpb24oc3RyKSB7XG4gIHZhciBsZW5ndGggPSBzdHIubGVuZ3RoLFxuICAgICAgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKGxlbmd0aCAqIDIpLCAvLyAyIGJ5dGVzIGZvciBlYWNoIGNoYXJcbiAgICAgIGJ1ZmZlclZpZXcgPSBuZXcgVWludDE2QXJyYXkoYnVmZmVyKSxcbiAgICAgIGk7XG4gIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIGJ1ZmZlclZpZXdbaV0gPSBzdHIuY2hhckNvZGVBdChpKTtcbiAgfVxuXG4gIHJldHVybiBidWZmZXI7XG59O1xuXG4vKipcbiAqIENvbnZlcnQgYW4gYXJyYXkgYnVmZmVyIGNvbnRhaW5pbmcgYW4gZW5jb2RlZCBzdHJpbmcgYmFjayBpbnRvIGEgc3RyaW5nLlxuICogQG1ldGhvZCBhYjJzdHJcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7QXJyYXlCdWZmZXJ9IGJ1ZmZlciBUaGUgYnVmZmVyIHRvIHVud3JhcC5cbiAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBkZWNvZGVkIGJ1ZmZlci5cbiAqL1xudXRpbC5hYjJzdHIgPSBmdW5jdGlvbihidWZmZXIpIHtcbiAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgbmV3IFVpbnQxNkFycmF5KGJ1ZmZlcikpO1xufTtcblxuLyoqXG4gKiBBZGQgJ29uJyBhbmQgJ2VtaXQnIG1ldGhvZHMgdG8gYW4gb2JqZWN0LCB3aGljaCBhY3QgYXMgYSBsaWdodCB3ZWlnaHRcbiAqIGV2ZW50IGhhbmRsaW5nIHN0cnVjdHVyZS5cbiAqIEBjbGFzcyBoYW5kbGVFdmVudHNcbiAqIEBzdGF0aWNcbiAqL1xudXRpbC5oYW5kbGVFdmVudHMgPSBmdW5jdGlvbihvYmopIHtcbiAgdmFyIGV2ZW50U3RhdGUgPSB7XG4gICAgbXVsdGlwbGU6IHt9LFxuICAgIG1heWJlbXVsdGlwbGU6IFtdLFxuICAgIHNpbmdsZToge30sXG4gICAgbWF5YmVzaW5nbGU6IFtdXG4gIH0sIGZpbHRlciwgcHVzaDtcblxuICAvKipcbiAgICogRmlsdGVyIGEgbGlzdCBiYXNlZCBvbiBhIHByZWRpY2F0ZS4gVGhlIGxpc3QgaXMgZmlsdGVyZWQgaW4gcGxhY2UsIHdpdGhcbiAgICogc2VsZWN0ZWQgaXRlbXMgcmVtb3ZlZCBhbmQgcmV0dXJuZWQgYnkgdGhlIGZ1bmN0aW9uLlxuICAgKiBAbWV0aG9kXG4gICAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGxpc3QgdG8gZmlsdGVyXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWRpY2F0ZSBUaGUgbWV0aG9kIHRvIHJ1biBvbiBlYWNoIGl0ZW0uXG4gICAqIEByZXR1cm5zIHtBcnJheX0gU2VsZWN0ZWQgaXRlbXNcbiAgICovXG4gIGZpbHRlciA9IGZ1bmN0aW9uKGxpc3QsIHByZWRpY2F0ZSkge1xuICAgIHZhciByZXQgPSBbXSwgaTtcblxuICAgIGlmICghbGlzdCB8fCAhbGlzdC5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSBsaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaSAtPSAxKSB7XG4gICAgICBpZiAocHJlZGljYXRlKGxpc3RbaV0pKSB7XG4gICAgICAgIHJldC5wdXNoKGxpc3Quc3BsaWNlKGksIDEpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfTtcblxuICAvKipcbiAgICogRW5xdWV1ZSBhIGhhbmRsZXIgZm9yIGEgc3BlY2lmaWMgdHlwZS5cbiAgICogQG1ldGhvZFxuICAgKiBAcGFyYW0ge1N0cmluZ30gdG8gVGhlIHF1ZXVlICgnc2luZ2xlJyBvciAnbXVsdGlwbGUnKSB0byBxdWV1ZSBvbi5cbiAgICogQHBhcmFtIHtTdHJpbmd9IHR5cGUgVGhlIHR5cGUgb2YgZXZlbnQgdG8gd2FpdCBmb3IuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIgVGhlIGhhbmRsZXIgdG8gZW5xdWV1ZS5cbiAgICovXG4gIHB1c2ggPSBmdW5jdGlvbih0bywgdHlwZSwgaGFuZGxlcikge1xuICAgIGlmICh0eXBlb2YgdHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpc1snbWF5YmUnICsgdG9dLnB1c2goW3R5cGUsIGhhbmRsZXJdKTtcbiAgICB9IGVsc2UgaWYgKHRoaXNbdG9dW3R5cGVdKSB7XG4gICAgICB0aGlzW3RvXVt0eXBlXS5wdXNoKGhhbmRsZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzW3RvXVt0eXBlXSA9IFtoYW5kbGVyXTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgbWV0aG9kIHRvIGJlIGV4ZWN1dGVkIHdoZW4gYW4gZXZlbnQgb2YgYSBzcGVjaWZpYyB0eXBlIG9jY3Vycy5cbiAgICogQG1ldGhvZCBvblxuICAgKiBAcGFyYW0ge1N0cmluZ3xGdW5jdGlvbn0gdHlwZSBUaGUgdHlwZSBvZiBldmVudCB0byByZWdpc3RlciBhZ2FpbnN0LlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyIFRoZSBoYW5kbGVyIHRvIHJ1biB3aGVuIHRoZSBldmVudCBvY2N1cnMuXG4gICAqL1xuICBvYmoub24gPSBwdXNoLmJpbmQoZXZlbnRTdGF0ZSwgJ211bHRpcGxlJyk7XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgbWV0aG9kIHRvIGJlIGV4ZWN1dGUgdGhlIG5leHQgdGltZSBhbiBldmVudCBvY2N1cnMuXG4gICAqIEBtZXRob2Qgb25jZVxuICAgKiBAcGFyYW0ge1N0cmluZ3xGdW5jdGlvbn0gdHlwZSBUaGUgdHlwZSBvZiBldmVudCB0byB3YWl0IGZvci5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciBUaGUgaGFuZGxlciB0byBydW4gdGhlIG5leHQgdGltZSBhIG1hdGNoaW5nIGV2ZW50XG4gICAqICAgICBpcyByYWlzZWQuXG4gICAqL1xuICBvYmoub25jZSA9IHB1c2guYmluZChldmVudFN0YXRlLCAnc2luZ2xlJyk7XG5cbiAgLyoqXG4gICAqIEVtaXQgYW4gZXZlbnQgb24gdGhpcyBvYmplY3QuXG4gICAqIEBtZXRob2QgZW1pdFxuICAgKiBAcGFyYW0ge1N0cmluZ30gdHlwZSBUaGUgdHlwZSBvZiBldmVudCB0byByYWlzZS5cbiAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgVGhlIHBheWxvYWQgb2YgdGhlIGV2ZW50LlxuICAgKi9cbiAgb2JqLmVtaXQgPSBmdW5jdGlvbih0eXBlLCBkYXRhKSB7XG4gICAgdmFyIGksIHF1ZXVlO1xuICAgIGlmICh0aGlzLm11bHRpcGxlW3R5cGVdKSB7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5tdWx0aXBsZVt0eXBlXS5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBpZiAodGhpcy5tdWx0aXBsZVt0eXBlXVtpXShkYXRhKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMuc2luZ2xlW3R5cGVdKSB7XG4gICAgICBxdWV1ZSA9IHRoaXMuc2luZ2xlW3R5cGVdO1xuICAgICAgdGhpcy5zaW5nbGVbdHlwZV0gPSBbXTtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBxdWV1ZS5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBxdWV1ZVtpXShkYXRhKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMubWF5YmVtdWx0aXBsZS5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgaWYgKHRoaXMubWF5YmVtdWx0aXBsZVtpXVswXSh0eXBlLCBkYXRhKSkge1xuICAgICAgICB0aGlzLm1heWJlbXVsdGlwbGVbaV1bMV0oZGF0YSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoaSA9IHRoaXMubWF5YmVzaW5nbGUubGVuZ3RoIC0gMTsgaSA+PSAwOyBpIC09IDEpIHtcbiAgICAgIGlmICh0aGlzLm1heWJlc2luZ2xlW2ldWzBdKHR5cGUsIGRhdGEpKSB7XG4gICAgICAgIHF1ZXVlID0gdGhpcy5tYXliZXNpbmdsZS5zcGxpY2UoaSwgMSk7XG4gICAgICAgIHF1ZXVlWzBdWzFdKGRhdGEpO1xuICAgICAgfVxuICAgIH1cbiAgfS5iaW5kKGV2ZW50U3RhdGUpO1xuXG4gIC8qKlxuICAgKiBSZW1vdmUgYW4gZXZlbnQgaGFuZGxlclxuICAgKiBAbWV0aG9kIG9mZlxuICAgKiBAcGFyYW0ge1N0cmluZ30gdHlwZSBUaGUgdHlwZSBvZiBldmVudCB0byByZW1vdmUuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb24/fSBoYW5kbGVyIFRoZSBoYW5kbGVyIHRvIHJlbW92ZS5cbiAgICovXG4gIG9iai5vZmYgPSBmdW5jdGlvbih0eXBlLCBoYW5kbGVyKSB7XG4gICAgaWYgKCF0eXBlKSB7XG4gICAgICB0aGlzLm11bHRpcGxlID0ge307XG4gICAgICB0aGlzLm1heWJlbXVsdGlwbGUgPSBbXTtcbiAgICAgIHRoaXMuc2luZ2xlID0ge307XG4gICAgICB0aGlzLm1heWJlc2luZ2xlID0gW107XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB0eXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBmaWx0ZXIodGhpcy5tYXliZXNpbmdsZSwgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICByZXR1cm4gaXRlbVswXSA9PT0gdHlwZSAmJiAoIWhhbmRsZXIgfHwgaXRlbVsxXSA9PT0gaGFuZGxlcik7XG4gICAgICB9KTtcbiAgICAgIGZpbHRlcih0aGlzLm1heWJlbXVsdGlwbGUsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIGl0ZW1bMF0gPT09IHR5cGUgJiYgKCFoYW5kbGVyIHx8IGl0ZW1bMV0gPT09IGhhbmRsZXIpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKCFoYW5kbGVyKSB7XG4gICAgICBkZWxldGUgdGhpcy5tdWx0aXBsZVt0eXBlXTtcbiAgICAgIGRlbGV0ZSB0aGlzLnNpbmdsZVt0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgZmlsdGVyKHRoaXMubXVsdGlwbGVbdHlwZV0sIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIGl0ZW0gPT09IGhhbmRsZXI7XG4gICAgICB9KTtcbiAgICAgIGZpbHRlcih0aGlzLnNpbmdsZVt0eXBlXSwgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICByZXR1cm4gaXRlbSA9PT0gaGFuZGxlcjtcbiAgICAgIH0pO1xuICAgIH1cbiAgfS5iaW5kKGV2ZW50U3RhdGUpO1xufTtcblxuLyoqXG4gKiBXaGVuIHJ1biB3aXRob3V0IGEgd2luZG93LCBvciBzcGVjaWZpY2FsbHkgcmVxdWVzdGVkLlxuICogTm90ZTogRGVjbGFyYXRpb24gY2FuIGJlIHJlZGVmaW5lZCBpbiBmb3JjZU1vZHVsZUNvbnRleHQgYmVsb3cuXG4gKiBAbWV0aG9kIGlzTW9kdWxlQ29udGV4dFxuICogQGZvciB1dGlsXG4gKiBAc3RhdGljXG4gKi9cbi8qIUBwcmVzZXJ2ZSBTdGFydE1vZHVsZUNvbnRleHREZWNsYXJhdGlvbiovXG51dGlsLmlzTW9kdWxlQ29udGV4dCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcpO1xufTtcblxuLyoqXG4gKiBHZXQgYSBCbG9iIG9iamVjdCBvZiBhIHN0cmluZy5cbiAqIFBvbHlmaWxscyBpbXBsZW1lbnRhdGlvbnMgd2hpY2ggZG9uJ3QgaGF2ZSBhIGN1cnJlbnQgQmxvYiBjb25zdHJ1Y3RvciwgbGlrZVxuICogcGhhbnRvbWpzLlxuICogQG1ldGhvZCBnZXRCbG9iXG4gKiBAc3RhdGljXG4gKi9cbnV0aWwuZ2V0QmxvYiA9IGZ1bmN0aW9uKGRhdGEsIHR5cGUpIHtcbiAgaWYgKHR5cGVvZiBCbG9iICE9PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBXZWJLaXRCbG9iQnVpbGRlciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB2YXIgYnVpbGRlciA9IG5ldyBXZWJLaXRCbG9iQnVpbGRlcigpO1xuICAgIGJ1aWxkZXIuYXBwZW5kKGRhdGEpO1xuICAgIHJldHVybiBidWlsZGVyLmdldEJsb2IodHlwZSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBCbG9iKFtkYXRhXSwge3R5cGU6IHR5cGV9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBGaW5kIGFsbCBzY3JpcHRzIG9uIHRoZSBnaXZlbiBwYWdlLlxuICogQG1ldGhvZCBzY3JpcHRzXG4gKiBAc3RhdGljXG4gKi9cbnV0aWwuc2NyaXB0cyA9IGZ1bmN0aW9uKGdsb2JhbCkge1xuICByZXR1cm4gZ2xvYmFsLmRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdXRpbDtcbiJdfQ==
