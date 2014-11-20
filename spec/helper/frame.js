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

},{"../../src/consumer":17,"../../src/proxy/eventInterface":29,"../../src/util":32}],15:[function(require,module,exports){
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

},{"es6-promise":1}],16:[function(require,module,exports){
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

},{"./util":32,"fs":11,"node-json-minify":13}],17:[function(require,module,exports){
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

},{"./util":32}],18:[function(require,module,exports){
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

},{"./util":32}],19:[function(require,module,exports){
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
},{"./api":15,"./bundle":16,"./debug":18,"./hub":20,"./manager":23,"./policy":26,"./proxybinder":30,"./resource":31,"./util":32,"es6-promise":1}],20:[function(require,module,exports){
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

},{"./util":32}],21:[function(require,module,exports){
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

},{"./util":32}],22:[function(require,module,exports){
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


},{"../link":21,"../util":32}],23:[function(require,module,exports){
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

},{"./moduleinternal":25,"./util":32}],24:[function(require,module,exports){
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

},{"./provider":27,"./util":32}],25:[function(require,module,exports){
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

},{"./provider":27,"./proxy/apiInterface":28,"./proxybinder":30,"./util":32,"es6-promise":1}],26:[function(require,module,exports){
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

},{"./module":24,"./util":32,"es6-promise":1}],27:[function(require,module,exports){
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

},{"./consumer":17,"./util":32}],28:[function(require,module,exports){
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

},{"../consumer":17,"../util":32,"es6-promise":1}],29:[function(require,module,exports){
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

},{"../util":32}],30:[function(require,module,exports){
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

},{"./consumer":17,"./provider":27,"./proxy/apiInterface":28,"./proxy/eventInterface":29,"es6-promise":1}],31:[function(require,module,exports){
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

},{"./util":32,"es6-promise":1}],32:[function(require,module,exports){
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

},{}],33:[function(require,module,exports){
(function (global){
/*jslint node:true*/
// This alternative entry point can be used to build the contents of an iFrame,
// when using the frame link of freedom (specifically for unit testing since
// phantomJS doesn't support web workers.).

var providers = [
  require('../../providers/core/core.unprivileged')
];

require('../entry')({
  isModule: true,
  portType: require('../link/frame'),
  providers: providers,
  global: global
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../../providers/core/core.unprivileged":14,"../entry":19,"../link/frame":22}]},{},[33])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9jb21tb25qcy9tYWluLmpzIiwibm9kZV9tb2R1bGVzL2VzNi1wcm9taXNlL2Rpc3QvY29tbW9uanMvcHJvbWlzZS9hbGwuanMiLCJub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9jb21tb25qcy9wcm9taXNlL2FzYXAuanMiLCJub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9jb21tb25qcy9wcm9taXNlL2NvbmZpZy5qcyIsIm5vZGVfbW9kdWxlcy9lczYtcHJvbWlzZS9kaXN0L2NvbW1vbmpzL3Byb21pc2UvcG9seWZpbGwuanMiLCJub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9jb21tb25qcy9wcm9taXNlL3Byb21pc2UuanMiLCJub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9jb21tb25qcy9wcm9taXNlL3JhY2UuanMiLCJub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9jb21tb25qcy9wcm9taXNlL3JlamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9lczYtcHJvbWlzZS9kaXN0L2NvbW1vbmpzL3Byb21pc2UvcmVzb2x2ZS5qcyIsIm5vZGVfbW9kdWxlcy9lczYtcHJvbWlzZS9kaXN0L2NvbW1vbmpzL3Byb21pc2UvdXRpbHMuanMiLCJub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9ub2RlLWpzb24tbWluaWZ5L2pzb24ubWluaWZ5LmpzIiwicHJvdmlkZXJzL2NvcmUvY29yZS51bnByaXZpbGVnZWQuanMiLCJzcmMvYXBpLmpzIiwic3JjL2J1bmRsZS5qcyIsInNyYy9jb25zdW1lci5qcyIsInNyYy9kZWJ1Zy5qcyIsInNyYy9lbnRyeS5qcyIsInNyYy9odWIuanMiLCJzcmMvbGluay5qcyIsInNyYy9saW5rL2ZyYW1lLmpzIiwic3JjL21hbmFnZXIuanMiLCJzcmMvbW9kdWxlLmpzIiwic3JjL21vZHVsZWludGVybmFsLmpzIiwic3JjL3BvbGljeS5qcyIsInNyYy9wcm92aWRlci5qcyIsInNyYy9wcm94eS9hcGlJbnRlcmZhY2UuanMiLCJzcmMvcHJveHkvZXZlbnRJbnRlcmZhY2UuanMiLCJzcmMvcHJveHliaW5kZXIuanMiLCJzcmMvcmVzb3VyY2UuanMiLCJzcmMvdXRpbC5qcyIsInNyYy91dGlsL2ZyYW1lRW50cnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9OQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM01BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5VkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDamFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5VkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBQcm9taXNlID0gcmVxdWlyZShcIi4vcHJvbWlzZS9wcm9taXNlXCIpLlByb21pc2U7XG52YXIgcG9seWZpbGwgPSByZXF1aXJlKFwiLi9wcm9taXNlL3BvbHlmaWxsXCIpLnBvbHlmaWxsO1xuZXhwb3J0cy5Qcm9taXNlID0gUHJvbWlzZTtcbmV4cG9ydHMucG9seWZpbGwgPSBwb2x5ZmlsbDsiLCJcInVzZSBzdHJpY3RcIjtcbi8qIGdsb2JhbCB0b1N0cmluZyAqL1xuXG52YXIgaXNBcnJheSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLmlzQXJyYXk7XG52YXIgaXNGdW5jdGlvbiA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLmlzRnVuY3Rpb247XG5cbi8qKlxuICBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGlzIGZ1bGZpbGxlZCB3aGVuIGFsbCB0aGUgZ2l2ZW4gcHJvbWlzZXMgaGF2ZSBiZWVuXG4gIGZ1bGZpbGxlZCwgb3IgcmVqZWN0ZWQgaWYgYW55IG9mIHRoZW0gYmVjb21lIHJlamVjdGVkLiBUaGUgcmV0dXJuIHByb21pc2VcbiAgaXMgZnVsZmlsbGVkIHdpdGggYW4gYXJyYXkgdGhhdCBnaXZlcyBhbGwgdGhlIHZhbHVlcyBpbiB0aGUgb3JkZXIgdGhleSB3ZXJlXG4gIHBhc3NlZCBpbiB0aGUgYHByb21pc2VzYCBhcnJheSBhcmd1bWVudC5cblxuICBFeGFtcGxlOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgdmFyIHByb21pc2UxID0gUlNWUC5yZXNvbHZlKDEpO1xuICB2YXIgcHJvbWlzZTIgPSBSU1ZQLnJlc29sdmUoMik7XG4gIHZhciBwcm9taXNlMyA9IFJTVlAucmVzb2x2ZSgzKTtcbiAgdmFyIHByb21pc2VzID0gWyBwcm9taXNlMSwgcHJvbWlzZTIsIHByb21pc2UzIF07XG5cbiAgUlNWUC5hbGwocHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24oYXJyYXkpe1xuICAgIC8vIFRoZSBhcnJheSBoZXJlIHdvdWxkIGJlIFsgMSwgMiwgMyBdO1xuICB9KTtcbiAgYGBgXG5cbiAgSWYgYW55IG9mIHRoZSBgcHJvbWlzZXNgIGdpdmVuIHRvIGBSU1ZQLmFsbGAgYXJlIHJlamVjdGVkLCB0aGUgZmlyc3QgcHJvbWlzZVxuICB0aGF0IGlzIHJlamVjdGVkIHdpbGwgYmUgZ2l2ZW4gYXMgYW4gYXJndW1lbnQgdG8gdGhlIHJldHVybmVkIHByb21pc2VzJ3NcbiAgcmVqZWN0aW9uIGhhbmRsZXIuIEZvciBleGFtcGxlOlxuXG4gIEV4YW1wbGU6XG5cbiAgYGBgamF2YXNjcmlwdFxuICB2YXIgcHJvbWlzZTEgPSBSU1ZQLnJlc29sdmUoMSk7XG4gIHZhciBwcm9taXNlMiA9IFJTVlAucmVqZWN0KG5ldyBFcnJvcihcIjJcIikpO1xuICB2YXIgcHJvbWlzZTMgPSBSU1ZQLnJlamVjdChuZXcgRXJyb3IoXCIzXCIpKTtcbiAgdmFyIHByb21pc2VzID0gWyBwcm9taXNlMSwgcHJvbWlzZTIsIHByb21pc2UzIF07XG5cbiAgUlNWUC5hbGwocHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24oYXJyYXkpe1xuICAgIC8vIENvZGUgaGVyZSBuZXZlciBydW5zIGJlY2F1c2UgdGhlcmUgYXJlIHJlamVjdGVkIHByb21pc2VzIVxuICB9LCBmdW5jdGlvbihlcnJvcikge1xuICAgIC8vIGVycm9yLm1lc3NhZ2UgPT09IFwiMlwiXG4gIH0pO1xuICBgYGBcblxuICBAbWV0aG9kIGFsbFxuICBAZm9yIFJTVlBcbiAgQHBhcmFtIHtBcnJheX0gcHJvbWlzZXNcbiAgQHBhcmFtIHtTdHJpbmd9IGxhYmVsXG4gIEByZXR1cm4ge1Byb21pc2V9IHByb21pc2UgdGhhdCBpcyBmdWxmaWxsZWQgd2hlbiBhbGwgYHByb21pc2VzYCBoYXZlIGJlZW5cbiAgZnVsZmlsbGVkLCBvciByZWplY3RlZCBpZiBhbnkgb2YgdGhlbSBiZWNvbWUgcmVqZWN0ZWQuXG4qL1xuZnVuY3Rpb24gYWxsKHByb21pc2VzKSB7XG4gIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gIHZhciBQcm9taXNlID0gdGhpcztcblxuICBpZiAoIWlzQXJyYXkocHJvbWlzZXMpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhbiBhcnJheSB0byBhbGwuJyk7XG4gIH1cblxuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXSwgcmVtYWluaW5nID0gcHJvbWlzZXMubGVuZ3RoLFxuICAgIHByb21pc2U7XG5cbiAgICBpZiAocmVtYWluaW5nID09PSAwKSB7XG4gICAgICByZXNvbHZlKFtdKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXNvbHZlcihpbmRleCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJlc29sdmVBbGwoaW5kZXgsIHZhbHVlKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVzb2x2ZUFsbChpbmRleCwgdmFsdWUpIHtcbiAgICAgIHJlc3VsdHNbaW5kZXhdID0gdmFsdWU7XG4gICAgICBpZiAoLS1yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgcmVzb2x2ZShyZXN1bHRzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb21pc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBwcm9taXNlID0gcHJvbWlzZXNbaV07XG5cbiAgICAgIGlmIChwcm9taXNlICYmIGlzRnVuY3Rpb24ocHJvbWlzZS50aGVuKSkge1xuICAgICAgICBwcm9taXNlLnRoZW4ocmVzb2x2ZXIoaSksIHJlamVjdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXNvbHZlQWxsKGksIHByb21pc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59XG5cbmV4cG9ydHMuYWxsID0gYWxsOyIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwpe1xuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgYnJvd3Nlckdsb2JhbCA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykgPyB3aW5kb3cgOiB7fTtcbnZhciBCcm93c2VyTXV0YXRpb25PYnNlcnZlciA9IGJyb3dzZXJHbG9iYWwuTXV0YXRpb25PYnNlcnZlciB8fCBicm93c2VyR2xvYmFsLldlYktpdE11dGF0aW9uT2JzZXJ2ZXI7XG52YXIgbG9jYWwgPSAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpID8gZ2xvYmFsIDogKHRoaXMgPT09IHVuZGVmaW5lZD8gd2luZG93OnRoaXMpO1xuXG4vLyBub2RlXG5mdW5jdGlvbiB1c2VOZXh0VGljaygpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHByb2Nlc3MubmV4dFRpY2soZmx1c2gpO1xuICB9O1xufVxuXG5mdW5jdGlvbiB1c2VNdXRhdGlvbk9ic2VydmVyKCkge1xuICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gIHZhciBvYnNlcnZlciA9IG5ldyBCcm93c2VyTXV0YXRpb25PYnNlcnZlcihmbHVzaCk7XG4gIHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJycpO1xuICBvYnNlcnZlci5vYnNlcnZlKG5vZGUsIHsgY2hhcmFjdGVyRGF0YTogdHJ1ZSB9KTtcblxuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgbm9kZS5kYXRhID0gKGl0ZXJhdGlvbnMgPSArK2l0ZXJhdGlvbnMgJSAyKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gdXNlU2V0VGltZW91dCgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIGxvY2FsLnNldFRpbWVvdXQoZmx1c2gsIDEpO1xuICB9O1xufVxuXG52YXIgcXVldWUgPSBbXTtcbmZ1bmN0aW9uIGZsdXNoKCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHF1ZXVlLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHR1cGxlID0gcXVldWVbaV07XG4gICAgdmFyIGNhbGxiYWNrID0gdHVwbGVbMF0sIGFyZyA9IHR1cGxlWzFdO1xuICAgIGNhbGxiYWNrKGFyZyk7XG4gIH1cbiAgcXVldWUgPSBbXTtcbn1cblxudmFyIHNjaGVkdWxlRmx1c2g7XG5cbi8vIERlY2lkZSB3aGF0IGFzeW5jIG1ldGhvZCB0byB1c2UgdG8gdHJpZ2dlcmluZyBwcm9jZXNzaW5nIG9mIHF1ZXVlZCBjYWxsYmFja3M6XG5pZiAodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHt9LnRvU3RyaW5nLmNhbGwocHJvY2VzcykgPT09ICdbb2JqZWN0IHByb2Nlc3NdJykge1xuICBzY2hlZHVsZUZsdXNoID0gdXNlTmV4dFRpY2soKTtcbn0gZWxzZSBpZiAoQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIpIHtcbiAgc2NoZWR1bGVGbHVzaCA9IHVzZU11dGF0aW9uT2JzZXJ2ZXIoKTtcbn0gZWxzZSB7XG4gIHNjaGVkdWxlRmx1c2ggPSB1c2VTZXRUaW1lb3V0KCk7XG59XG5cbmZ1bmN0aW9uIGFzYXAoY2FsbGJhY2ssIGFyZykge1xuICB2YXIgbGVuZ3RoID0gcXVldWUucHVzaChbY2FsbGJhY2ssIGFyZ10pO1xuICBpZiAobGVuZ3RoID09PSAxKSB7XG4gICAgLy8gSWYgbGVuZ3RoIGlzIDEsIHRoYXQgbWVhbnMgdGhhdCB3ZSBuZWVkIHRvIHNjaGVkdWxlIGFuIGFzeW5jIGZsdXNoLlxuICAgIC8vIElmIGFkZGl0aW9uYWwgY2FsbGJhY2tzIGFyZSBxdWV1ZWQgYmVmb3JlIHRoZSBxdWV1ZSBpcyBmbHVzaGVkLCB0aGV5XG4gICAgLy8gd2lsbCBiZSBwcm9jZXNzZWQgYnkgdGhpcyBmbHVzaCB0aGF0IHdlIGFyZSBzY2hlZHVsaW5nLlxuICAgIHNjaGVkdWxlRmx1c2goKTtcbiAgfVxufVxuXG5leHBvcnRzLmFzYXAgPSBhc2FwO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoJ19wcm9jZXNzJyksdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBjb25maWcgPSB7XG4gIGluc3RydW1lbnQ6IGZhbHNlXG59O1xuXG5mdW5jdGlvbiBjb25maWd1cmUobmFtZSwgdmFsdWUpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcbiAgICBjb25maWdbbmFtZV0gPSB2YWx1ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gY29uZmlnW25hbWVdO1xuICB9XG59XG5cbmV4cG9ydHMuY29uZmlnID0gY29uZmlnO1xuZXhwb3J0cy5jb25maWd1cmUgPSBjb25maWd1cmU7IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuXCJ1c2Ugc3RyaWN0XCI7XG4vKmdsb2JhbCBzZWxmKi9cbnZhciBSU1ZQUHJvbWlzZSA9IHJlcXVpcmUoXCIuL3Byb21pc2VcIikuUHJvbWlzZTtcbnZhciBpc0Z1bmN0aW9uID0gcmVxdWlyZShcIi4vdXRpbHNcIikuaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gcG9seWZpbGwoKSB7XG4gIHZhciBsb2NhbDtcblxuICBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBsb2NhbCA9IGdsb2JhbDtcbiAgfSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuZG9jdW1lbnQpIHtcbiAgICBsb2NhbCA9IHdpbmRvdztcbiAgfSBlbHNlIHtcbiAgICBsb2NhbCA9IHNlbGY7XG4gIH1cblxuICB2YXIgZXM2UHJvbWlzZVN1cHBvcnQgPSBcbiAgICBcIlByb21pc2VcIiBpbiBsb2NhbCAmJlxuICAgIC8vIFNvbWUgb2YgdGhlc2UgbWV0aG9kcyBhcmUgbWlzc2luZyBmcm9tXG4gICAgLy8gRmlyZWZveC9DaHJvbWUgZXhwZXJpbWVudGFsIGltcGxlbWVudGF0aW9uc1xuICAgIFwicmVzb2x2ZVwiIGluIGxvY2FsLlByb21pc2UgJiZcbiAgICBcInJlamVjdFwiIGluIGxvY2FsLlByb21pc2UgJiZcbiAgICBcImFsbFwiIGluIGxvY2FsLlByb21pc2UgJiZcbiAgICBcInJhY2VcIiBpbiBsb2NhbC5Qcm9taXNlICYmXG4gICAgLy8gT2xkZXIgdmVyc2lvbiBvZiB0aGUgc3BlYyBoYWQgYSByZXNvbHZlciBvYmplY3RcbiAgICAvLyBhcyB0aGUgYXJnIHJhdGhlciB0aGFuIGEgZnVuY3Rpb25cbiAgICAoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcmVzb2x2ZTtcbiAgICAgIG5ldyBsb2NhbC5Qcm9taXNlKGZ1bmN0aW9uKHIpIHsgcmVzb2x2ZSA9IHI7IH0pO1xuICAgICAgcmV0dXJuIGlzRnVuY3Rpb24ocmVzb2x2ZSk7XG4gICAgfSgpKTtcblxuICBpZiAoIWVzNlByb21pc2VTdXBwb3J0KSB7XG4gICAgbG9jYWwuUHJvbWlzZSA9IFJTVlBQcm9taXNlO1xuICB9XG59XG5cbmV4cG9ydHMucG9seWZpbGwgPSBwb2x5ZmlsbDtcbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIlwidXNlIHN0cmljdFwiO1xudmFyIGNvbmZpZyA9IHJlcXVpcmUoXCIuL2NvbmZpZ1wiKS5jb25maWc7XG52YXIgY29uZmlndXJlID0gcmVxdWlyZShcIi4vY29uZmlnXCIpLmNvbmZpZ3VyZTtcbnZhciBvYmplY3RPckZ1bmN0aW9uID0gcmVxdWlyZShcIi4vdXRpbHNcIikub2JqZWN0T3JGdW5jdGlvbjtcbnZhciBpc0Z1bmN0aW9uID0gcmVxdWlyZShcIi4vdXRpbHNcIikuaXNGdW5jdGlvbjtcbnZhciBub3cgPSByZXF1aXJlKFwiLi91dGlsc1wiKS5ub3c7XG52YXIgYWxsID0gcmVxdWlyZShcIi4vYWxsXCIpLmFsbDtcbnZhciByYWNlID0gcmVxdWlyZShcIi4vcmFjZVwiKS5yYWNlO1xudmFyIHN0YXRpY1Jlc29sdmUgPSByZXF1aXJlKFwiLi9yZXNvbHZlXCIpLnJlc29sdmU7XG52YXIgc3RhdGljUmVqZWN0ID0gcmVxdWlyZShcIi4vcmVqZWN0XCIpLnJlamVjdDtcbnZhciBhc2FwID0gcmVxdWlyZShcIi4vYXNhcFwiKS5hc2FwO1xuXG52YXIgY291bnRlciA9IDA7XG5cbmNvbmZpZy5hc3luYyA9IGFzYXA7IC8vIGRlZmF1bHQgYXN5bmMgaXMgYXNhcDtcblxuZnVuY3Rpb24gUHJvbWlzZShyZXNvbHZlcikge1xuICBpZiAoIWlzRnVuY3Rpb24ocmVzb2x2ZXIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhIHJlc29sdmVyIGZ1bmN0aW9uIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byB0aGUgcHJvbWlzZSBjb25zdHJ1Y3RvcicpO1xuICB9XG5cbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFByb21pc2UpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkZhaWxlZCB0byBjb25zdHJ1Y3QgJ1Byb21pc2UnOiBQbGVhc2UgdXNlIHRoZSAnbmV3JyBvcGVyYXRvciwgdGhpcyBvYmplY3QgY29uc3RydWN0b3IgY2Fubm90IGJlIGNhbGxlZCBhcyBhIGZ1bmN0aW9uLlwiKTtcbiAgfVxuXG4gIHRoaXMuX3N1YnNjcmliZXJzID0gW107XG5cbiAgaW52b2tlUmVzb2x2ZXIocmVzb2x2ZXIsIHRoaXMpO1xufVxuXG5mdW5jdGlvbiBpbnZva2VSZXNvbHZlcihyZXNvbHZlciwgcHJvbWlzZSkge1xuICBmdW5jdGlvbiByZXNvbHZlUHJvbWlzZSh2YWx1ZSkge1xuICAgIHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVqZWN0UHJvbWlzZShyZWFzb24pIHtcbiAgICByZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgcmVzb2x2ZXIocmVzb2x2ZVByb21pc2UsIHJlamVjdFByb21pc2UpO1xuICB9IGNhdGNoKGUpIHtcbiAgICByZWplY3RQcm9taXNlKGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGludm9rZUNhbGxiYWNrKHNldHRsZWQsIHByb21pc2UsIGNhbGxiYWNrLCBkZXRhaWwpIHtcbiAgdmFyIGhhc0NhbGxiYWNrID0gaXNGdW5jdGlvbihjYWxsYmFjayksXG4gICAgICB2YWx1ZSwgZXJyb3IsIHN1Y2NlZWRlZCwgZmFpbGVkO1xuXG4gIGlmIChoYXNDYWxsYmFjaykge1xuICAgIHRyeSB7XG4gICAgICB2YWx1ZSA9IGNhbGxiYWNrKGRldGFpbCk7XG4gICAgICBzdWNjZWVkZWQgPSB0cnVlO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgZmFpbGVkID0gdHJ1ZTtcbiAgICAgIGVycm9yID0gZTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFsdWUgPSBkZXRhaWw7XG4gICAgc3VjY2VlZGVkID0gdHJ1ZTtcbiAgfVxuXG4gIGlmIChoYW5kbGVUaGVuYWJsZShwcm9taXNlLCB2YWx1ZSkpIHtcbiAgICByZXR1cm47XG4gIH0gZWxzZSBpZiAoaGFzQ2FsbGJhY2sgJiYgc3VjY2VlZGVkKSB7XG4gICAgcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gIH0gZWxzZSBpZiAoZmFpbGVkKSB7XG4gICAgcmVqZWN0KHByb21pc2UsIGVycm9yKTtcbiAgfSBlbHNlIGlmIChzZXR0bGVkID09PSBGVUxGSUxMRUQpIHtcbiAgICByZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgfSBlbHNlIGlmIChzZXR0bGVkID09PSBSRUpFQ1RFRCkge1xuICAgIHJlamVjdChwcm9taXNlLCB2YWx1ZSk7XG4gIH1cbn1cblxudmFyIFBFTkRJTkcgICA9IHZvaWQgMDtcbnZhciBTRUFMRUQgICAgPSAwO1xudmFyIEZVTEZJTExFRCA9IDE7XG52YXIgUkVKRUNURUQgID0gMjtcblxuZnVuY3Rpb24gc3Vic2NyaWJlKHBhcmVudCwgY2hpbGQsIG9uRnVsZmlsbG1lbnQsIG9uUmVqZWN0aW9uKSB7XG4gIHZhciBzdWJzY3JpYmVycyA9IHBhcmVudC5fc3Vic2NyaWJlcnM7XG4gIHZhciBsZW5ndGggPSBzdWJzY3JpYmVycy5sZW5ndGg7XG5cbiAgc3Vic2NyaWJlcnNbbGVuZ3RoXSA9IGNoaWxkO1xuICBzdWJzY3JpYmVyc1tsZW5ndGggKyBGVUxGSUxMRURdID0gb25GdWxmaWxsbWVudDtcbiAgc3Vic2NyaWJlcnNbbGVuZ3RoICsgUkVKRUNURURdICA9IG9uUmVqZWN0aW9uO1xufVxuXG5mdW5jdGlvbiBwdWJsaXNoKHByb21pc2UsIHNldHRsZWQpIHtcbiAgdmFyIGNoaWxkLCBjYWxsYmFjaywgc3Vic2NyaWJlcnMgPSBwcm9taXNlLl9zdWJzY3JpYmVycywgZGV0YWlsID0gcHJvbWlzZS5fZGV0YWlsO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3Vic2NyaWJlcnMubGVuZ3RoOyBpICs9IDMpIHtcbiAgICBjaGlsZCA9IHN1YnNjcmliZXJzW2ldO1xuICAgIGNhbGxiYWNrID0gc3Vic2NyaWJlcnNbaSArIHNldHRsZWRdO1xuXG4gICAgaW52b2tlQ2FsbGJhY2soc2V0dGxlZCwgY2hpbGQsIGNhbGxiYWNrLCBkZXRhaWwpO1xuICB9XG5cbiAgcHJvbWlzZS5fc3Vic2NyaWJlcnMgPSBudWxsO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZSA9IHtcbiAgY29uc3RydWN0b3I6IFByb21pc2UsXG5cbiAgX3N0YXRlOiB1bmRlZmluZWQsXG4gIF9kZXRhaWw6IHVuZGVmaW5lZCxcbiAgX3N1YnNjcmliZXJzOiB1bmRlZmluZWQsXG5cbiAgdGhlbjogZnVuY3Rpb24ob25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pIHtcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXM7XG5cbiAgICB2YXIgdGhlblByb21pc2UgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcihmdW5jdGlvbigpIHt9KTtcblxuICAgIGlmICh0aGlzLl9zdGF0ZSkge1xuICAgICAgdmFyIGNhbGxiYWNrcyA9IGFyZ3VtZW50cztcbiAgICAgIGNvbmZpZy5hc3luYyhmdW5jdGlvbiBpbnZva2VQcm9taXNlQ2FsbGJhY2soKSB7XG4gICAgICAgIGludm9rZUNhbGxiYWNrKHByb21pc2UuX3N0YXRlLCB0aGVuUHJvbWlzZSwgY2FsbGJhY2tzW3Byb21pc2UuX3N0YXRlIC0gMV0sIHByb21pc2UuX2RldGFpbCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3Vic2NyaWJlKHRoaXMsIHRoZW5Qcm9taXNlLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoZW5Qcm9taXNlO1xuICB9LFxuXG4gICdjYXRjaCc6IGZ1bmN0aW9uKG9uUmVqZWN0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihudWxsLCBvblJlamVjdGlvbik7XG4gIH1cbn07XG5cblByb21pc2UuYWxsID0gYWxsO1xuUHJvbWlzZS5yYWNlID0gcmFjZTtcblByb21pc2UucmVzb2x2ZSA9IHN0YXRpY1Jlc29sdmU7XG5Qcm9taXNlLnJlamVjdCA9IHN0YXRpY1JlamVjdDtcblxuZnVuY3Rpb24gaGFuZGxlVGhlbmFibGUocHJvbWlzZSwgdmFsdWUpIHtcbiAgdmFyIHRoZW4gPSBudWxsLFxuICByZXNvbHZlZDtcblxuICB0cnkge1xuICAgIGlmIChwcm9taXNlID09PSB2YWx1ZSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkEgcHJvbWlzZXMgY2FsbGJhY2sgY2Fubm90IHJldHVybiB0aGF0IHNhbWUgcHJvbWlzZS5cIik7XG4gICAgfVxuXG4gICAgaWYgKG9iamVjdE9yRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB0aGVuID0gdmFsdWUudGhlbjtcblxuICAgICAgaWYgKGlzRnVuY3Rpb24odGhlbikpIHtcbiAgICAgICAgdGhlbi5jYWxsKHZhbHVlLCBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgICBpZiAocmVzb2x2ZWQpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICByZXNvbHZlZCA9IHRydWU7XG5cbiAgICAgICAgICBpZiAodmFsdWUgIT09IHZhbCkge1xuICAgICAgICAgICAgcmVzb2x2ZShwcm9taXNlLCB2YWwpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmdWxmaWxsKHByb21pc2UsIHZhbCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgICBpZiAocmVzb2x2ZWQpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICByZXNvbHZlZCA9IHRydWU7XG5cbiAgICAgICAgICByZWplY3QocHJvbWlzZSwgdmFsKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGlmIChyZXNvbHZlZCkgeyByZXR1cm4gdHJ1ZTsgfVxuICAgIHJlamVjdChwcm9taXNlLCBlcnJvcik7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmUocHJvbWlzZSwgdmFsdWUpIHtcbiAgaWYgKHByb21pc2UgPT09IHZhbHVlKSB7XG4gICAgZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gIH0gZWxzZSBpZiAoIWhhbmRsZVRoZW5hYmxlKHByb21pc2UsIHZhbHVlKSkge1xuICAgIGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpIHtcbiAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBQRU5ESU5HKSB7IHJldHVybjsgfVxuICBwcm9taXNlLl9zdGF0ZSA9IFNFQUxFRDtcbiAgcHJvbWlzZS5fZGV0YWlsID0gdmFsdWU7XG5cbiAgY29uZmlnLmFzeW5jKHB1Ymxpc2hGdWxmaWxsbWVudCwgcHJvbWlzZSk7XG59XG5cbmZ1bmN0aW9uIHJlamVjdChwcm9taXNlLCByZWFzb24pIHtcbiAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBQRU5ESU5HKSB7IHJldHVybjsgfVxuICBwcm9taXNlLl9zdGF0ZSA9IFNFQUxFRDtcbiAgcHJvbWlzZS5fZGV0YWlsID0gcmVhc29uO1xuXG4gIGNvbmZpZy5hc3luYyhwdWJsaXNoUmVqZWN0aW9uLCBwcm9taXNlKTtcbn1cblxuZnVuY3Rpb24gcHVibGlzaEZ1bGZpbGxtZW50KHByb21pc2UpIHtcbiAgcHVibGlzaChwcm9taXNlLCBwcm9taXNlLl9zdGF0ZSA9IEZVTEZJTExFRCk7XG59XG5cbmZ1bmN0aW9uIHB1Ymxpc2hSZWplY3Rpb24ocHJvbWlzZSkge1xuICBwdWJsaXNoKHByb21pc2UsIHByb21pc2UuX3N0YXRlID0gUkVKRUNURUQpO1xufVxuXG5leHBvcnRzLlByb21pc2UgPSBQcm9taXNlOyIsIlwidXNlIHN0cmljdFwiO1xuLyogZ2xvYmFsIHRvU3RyaW5nICovXG52YXIgaXNBcnJheSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLmlzQXJyYXk7XG5cbi8qKlxuICBgUlNWUC5yYWNlYCBhbGxvd3MgeW91IHRvIHdhdGNoIGEgc2VyaWVzIG9mIHByb21pc2VzIGFuZCBhY3QgYXMgc29vbiBhcyB0aGVcbiAgZmlyc3QgcHJvbWlzZSBnaXZlbiB0byB0aGUgYHByb21pc2VzYCBhcmd1bWVudCBmdWxmaWxscyBvciByZWplY3RzLlxuXG4gIEV4YW1wbGU6XG5cbiAgYGBgamF2YXNjcmlwdFxuICB2YXIgcHJvbWlzZTEgPSBuZXcgUlNWUC5Qcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgcmVzb2x2ZShcInByb21pc2UgMVwiKTtcbiAgICB9LCAyMDApO1xuICB9KTtcblxuICB2YXIgcHJvbWlzZTIgPSBuZXcgUlNWUC5Qcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgcmVzb2x2ZShcInByb21pc2UgMlwiKTtcbiAgICB9LCAxMDApO1xuICB9KTtcblxuICBSU1ZQLnJhY2UoW3Byb21pc2UxLCBwcm9taXNlMl0pLnRoZW4oZnVuY3Rpb24ocmVzdWx0KXtcbiAgICAvLyByZXN1bHQgPT09IFwicHJvbWlzZSAyXCIgYmVjYXVzZSBpdCB3YXMgcmVzb2x2ZWQgYmVmb3JlIHByb21pc2UxXG4gICAgLy8gd2FzIHJlc29sdmVkLlxuICB9KTtcbiAgYGBgXG5cbiAgYFJTVlAucmFjZWAgaXMgZGV0ZXJtaW5pc3RpYyBpbiB0aGF0IG9ubHkgdGhlIHN0YXRlIG9mIHRoZSBmaXJzdCBjb21wbGV0ZWRcbiAgcHJvbWlzZSBtYXR0ZXJzLiBGb3IgZXhhbXBsZSwgZXZlbiBpZiBvdGhlciBwcm9taXNlcyBnaXZlbiB0byB0aGUgYHByb21pc2VzYFxuICBhcnJheSBhcmd1bWVudCBhcmUgcmVzb2x2ZWQsIGJ1dCB0aGUgZmlyc3QgY29tcGxldGVkIHByb21pc2UgaGFzIGJlY29tZVxuICByZWplY3RlZCBiZWZvcmUgdGhlIG90aGVyIHByb21pc2VzIGJlY2FtZSBmdWxmaWxsZWQsIHRoZSByZXR1cm5lZCBwcm9taXNlXG4gIHdpbGwgYmVjb21lIHJlamVjdGVkOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgdmFyIHByb21pc2UxID0gbmV3IFJTVlAuUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIHJlc29sdmUoXCJwcm9taXNlIDFcIik7XG4gICAgfSwgMjAwKTtcbiAgfSk7XG5cbiAgdmFyIHByb21pc2UyID0gbmV3IFJTVlAuUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJwcm9taXNlIDJcIikpO1xuICAgIH0sIDEwMCk7XG4gIH0pO1xuXG4gIFJTVlAucmFjZShbcHJvbWlzZTEsIHByb21pc2UyXSkudGhlbihmdW5jdGlvbihyZXN1bHQpe1xuICAgIC8vIENvZGUgaGVyZSBuZXZlciBydW5zIGJlY2F1c2UgdGhlcmUgYXJlIHJlamVjdGVkIHByb21pc2VzIVxuICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgIC8vIHJlYXNvbi5tZXNzYWdlID09PSBcInByb21pc2UyXCIgYmVjYXVzZSBwcm9taXNlIDIgYmVjYW1lIHJlamVjdGVkIGJlZm9yZVxuICAgIC8vIHByb21pc2UgMSBiZWNhbWUgZnVsZmlsbGVkXG4gIH0pO1xuICBgYGBcblxuICBAbWV0aG9kIHJhY2VcbiAgQGZvciBSU1ZQXG4gIEBwYXJhbSB7QXJyYXl9IHByb21pc2VzIGFycmF5IG9mIHByb21pc2VzIHRvIG9ic2VydmVcbiAgQHBhcmFtIHtTdHJpbmd9IGxhYmVsIG9wdGlvbmFsIHN0cmluZyBmb3IgZGVzY3JpYmluZyB0aGUgcHJvbWlzZSByZXR1cm5lZC5cbiAgVXNlZnVsIGZvciB0b29saW5nLlxuICBAcmV0dXJuIHtQcm9taXNlfSBhIHByb21pc2UgdGhhdCBiZWNvbWVzIGZ1bGZpbGxlZCB3aXRoIHRoZSB2YWx1ZSB0aGUgZmlyc3RcbiAgY29tcGxldGVkIHByb21pc2VzIGlzIHJlc29sdmVkIHdpdGggaWYgdGhlIGZpcnN0IGNvbXBsZXRlZCBwcm9taXNlIHdhc1xuICBmdWxmaWxsZWQsIG9yIHJlamVjdGVkIHdpdGggdGhlIHJlYXNvbiB0aGF0IHRoZSBmaXJzdCBjb21wbGV0ZWQgcHJvbWlzZVxuICB3YXMgcmVqZWN0ZWQgd2l0aC5cbiovXG5mdW5jdGlvbiByYWNlKHByb21pc2VzKSB7XG4gIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gIHZhciBQcm9taXNlID0gdGhpcztcblxuICBpZiAoIWlzQXJyYXkocHJvbWlzZXMpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhbiBhcnJheSB0byByYWNlLicpO1xuICB9XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICB2YXIgcmVzdWx0cyA9IFtdLCBwcm9taXNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9taXNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgcHJvbWlzZSA9IHByb21pc2VzW2ldO1xuXG4gICAgICBpZiAocHJvbWlzZSAmJiB0eXBlb2YgcHJvbWlzZS50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHByb21pc2UudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzb2x2ZShwcm9taXNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufVxuXG5leHBvcnRzLnJhY2UgPSByYWNlOyIsIlwidXNlIHN0cmljdFwiO1xuLyoqXG4gIGBSU1ZQLnJlamVjdGAgcmV0dXJucyBhIHByb21pc2UgdGhhdCB3aWxsIGJlY29tZSByZWplY3RlZCB3aXRoIHRoZSBwYXNzZWRcbiAgYHJlYXNvbmAuIGBSU1ZQLnJlamVjdGAgaXMgZXNzZW50aWFsbHkgc2hvcnRoYW5kIGZvciB0aGUgZm9sbG93aW5nOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgdmFyIHByb21pc2UgPSBuZXcgUlNWUC5Qcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgcmVqZWN0KG5ldyBFcnJvcignV0hPT1BTJykpO1xuICB9KTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpe1xuICAgIC8vIENvZGUgaGVyZSBkb2Vzbid0IHJ1biBiZWNhdXNlIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkIVxuICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgIC8vIHJlYXNvbi5tZXNzYWdlID09PSAnV0hPT1BTJ1xuICB9KTtcbiAgYGBgXG5cbiAgSW5zdGVhZCBvZiB3cml0aW5nIHRoZSBhYm92ZSwgeW91ciBjb2RlIG5vdyBzaW1wbHkgYmVjb21lcyB0aGUgZm9sbG93aW5nOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgdmFyIHByb21pc2UgPSBSU1ZQLnJlamVjdChuZXcgRXJyb3IoJ1dIT09QUycpKTtcblxuICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpe1xuICAgIC8vIENvZGUgaGVyZSBkb2Vzbid0IHJ1biBiZWNhdXNlIHRoZSBwcm9taXNlIGlzIHJlamVjdGVkIVxuICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgIC8vIHJlYXNvbi5tZXNzYWdlID09PSAnV0hPT1BTJ1xuICB9KTtcbiAgYGBgXG5cbiAgQG1ldGhvZCByZWplY3RcbiAgQGZvciBSU1ZQXG4gIEBwYXJhbSB7QW55fSByZWFzb24gdmFsdWUgdGhhdCB0aGUgcmV0dXJuZWQgcHJvbWlzZSB3aWxsIGJlIHJlamVjdGVkIHdpdGguXG4gIEBwYXJhbSB7U3RyaW5nfSBsYWJlbCBvcHRpb25hbCBzdHJpbmcgZm9yIGlkZW50aWZ5aW5nIHRoZSByZXR1cm5lZCBwcm9taXNlLlxuICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gIEByZXR1cm4ge1Byb21pc2V9IGEgcHJvbWlzZSB0aGF0IHdpbGwgYmVjb21lIHJlamVjdGVkIHdpdGggdGhlIGdpdmVuXG4gIGByZWFzb25gLlxuKi9cbmZ1bmN0aW9uIHJlamVjdChyZWFzb24pIHtcbiAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgdmFyIFByb21pc2UgPSB0aGlzO1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgcmVqZWN0KHJlYXNvbik7XG4gIH0pO1xufVxuXG5leHBvcnRzLnJlamVjdCA9IHJlamVjdDsiLCJcInVzZSBzdHJpY3RcIjtcbmZ1bmN0aW9uIHJlc29sdmUodmFsdWUpIHtcbiAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUuY29uc3RydWN0b3IgPT09IHRoaXMpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICB2YXIgUHJvbWlzZSA9IHRoaXM7XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICByZXNvbHZlKHZhbHVlKTtcbiAgfSk7XG59XG5cbmV4cG9ydHMucmVzb2x2ZSA9IHJlc29sdmU7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5mdW5jdGlvbiBvYmplY3RPckZ1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIGlzRnVuY3Rpb24oeCkgfHwgKHR5cGVvZiB4ID09PSBcIm9iamVjdFwiICYmIHggIT09IG51bGwpO1xufVxuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIHR5cGVvZiB4ID09PSBcImZ1bmN0aW9uXCI7XG59XG5cbmZ1bmN0aW9uIGlzQXJyYXkoeCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHgpID09PSBcIltvYmplY3QgQXJyYXldXCI7XG59XG5cbi8vIERhdGUubm93IGlzIG5vdCBhdmFpbGFibGUgaW4gYnJvd3NlcnMgPCBJRTlcbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0RhdGUvbm93I0NvbXBhdGliaWxpdHlcbnZhciBub3cgPSBEYXRlLm5vdyB8fCBmdW5jdGlvbigpIHsgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpOyB9O1xuXG5cbmV4cG9ydHMub2JqZWN0T3JGdW5jdGlvbiA9IG9iamVjdE9yRnVuY3Rpb247XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcbmV4cG9ydHMubm93ID0gbm93OyIsbnVsbCwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuTXV0YXRpb25PYnNlcnZlciA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93Lk11dGF0aW9uT2JzZXJ2ZXI7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgdmFyIHF1ZXVlID0gW107XG5cbiAgICBpZiAoY2FuTXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgICB2YXIgaGlkZGVuRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHF1ZXVlTGlzdCA9IHF1ZXVlLnNsaWNlKCk7XG4gICAgICAgICAgICBxdWV1ZS5sZW5ndGggPSAwO1xuICAgICAgICAgICAgcXVldWVMaXN0LmZvckVhY2goZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBvYnNlcnZlci5vYnNlcnZlKGhpZGRlbkRpdiwgeyBhdHRyaWJ1dGVzOiB0cnVlIH0pO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBoaWRkZW5EaXYuc2V0QXR0cmlidXRlKCd5ZXMnLCAnbm8nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbiIsIi8qISBKU09OLm1pbmlmeSgpXG5cdHYwLjEuMy1hIChjKSBLeWxlIFNpbXBzb25cblx0TUlUIExpY2Vuc2VcbiovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oanNvbikge1xuXHRcblx0dmFyIHRva2VuaXplciA9IC9cInwoXFwvXFwqKXwoXFwqXFwvKXwoXFwvXFwvKXxcXG58XFxyL2csXG5cdFx0aW5fc3RyaW5nID0gZmFsc2UsXG5cdFx0aW5fbXVsdGlsaW5lX2NvbW1lbnQgPSBmYWxzZSxcblx0XHRpbl9zaW5nbGVsaW5lX2NvbW1lbnQgPSBmYWxzZSxcblx0XHR0bXAsIHRtcDIsIG5ld19zdHIgPSBbXSwgbnMgPSAwLCBmcm9tID0gMCwgbGMsIHJjXG5cdDtcblx0XG5cdHRva2VuaXplci5sYXN0SW5kZXggPSAwO1xuXHRcblx0d2hpbGUgKHRtcCA9IHRva2VuaXplci5leGVjKGpzb24pKSB7XG5cdFx0bGMgPSBSZWdFeHAubGVmdENvbnRleHQ7XG5cdFx0cmMgPSBSZWdFeHAucmlnaHRDb250ZXh0O1xuXHRcdGlmICghaW5fbXVsdGlsaW5lX2NvbW1lbnQgJiYgIWluX3NpbmdsZWxpbmVfY29tbWVudCkge1xuXHRcdFx0dG1wMiA9IGxjLnN1YnN0cmluZyhmcm9tKTtcblx0XHRcdGlmICghaW5fc3RyaW5nKSB7XG5cdFx0XHRcdHRtcDIgPSB0bXAyLnJlcGxhY2UoLyhcXG58XFxyfFxccykqL2csXCJcIik7XG5cdFx0XHR9XG5cdFx0XHRuZXdfc3RyW25zKytdID0gdG1wMjtcblx0XHR9XG5cdFx0ZnJvbSA9IHRva2VuaXplci5sYXN0SW5kZXg7XG5cdFx0XG5cdFx0aWYgKHRtcFswXSA9PSBcIlxcXCJcIiAmJiAhaW5fbXVsdGlsaW5lX2NvbW1lbnQgJiYgIWluX3NpbmdsZWxpbmVfY29tbWVudCkge1xuXHRcdFx0dG1wMiA9IGxjLm1hdGNoKC8oXFxcXCkqJC8pO1xuXHRcdFx0aWYgKCFpbl9zdHJpbmcgfHwgIXRtcDIgfHwgKHRtcDJbMF0ubGVuZ3RoICUgMikgPT0gMCkge1x0Ly8gc3RhcnQgb2Ygc3RyaW5nIHdpdGggXCIsIG9yIHVuZXNjYXBlZCBcIiBjaGFyYWN0ZXIgZm91bmQgdG8gZW5kIHN0cmluZ1xuXHRcdFx0XHRpbl9zdHJpbmcgPSAhaW5fc3RyaW5nO1xuXHRcdFx0fVxuXHRcdFx0ZnJvbS0tOyAvLyBpbmNsdWRlIFwiIGNoYXJhY3RlciBpbiBuZXh0IGNhdGNoXG5cdFx0XHRyYyA9IGpzb24uc3Vic3RyaW5nKGZyb20pO1xuXHRcdH1cblx0XHRlbHNlIGlmICh0bXBbMF0gPT0gXCIvKlwiICYmICFpbl9zdHJpbmcgJiYgIWluX211bHRpbGluZV9jb21tZW50ICYmICFpbl9zaW5nbGVsaW5lX2NvbW1lbnQpIHtcblx0XHRcdGluX211bHRpbGluZV9jb21tZW50ID0gdHJ1ZTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAodG1wWzBdID09IFwiKi9cIiAmJiAhaW5fc3RyaW5nICYmIGluX211bHRpbGluZV9jb21tZW50ICYmICFpbl9zaW5nbGVsaW5lX2NvbW1lbnQpIHtcblx0XHRcdGluX211bHRpbGluZV9jb21tZW50ID0gZmFsc2U7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKHRtcFswXSA9PSBcIi8vXCIgJiYgIWluX3N0cmluZyAmJiAhaW5fbXVsdGlsaW5lX2NvbW1lbnQgJiYgIWluX3NpbmdsZWxpbmVfY29tbWVudCkge1xuXHRcdFx0aW5fc2luZ2xlbGluZV9jb21tZW50ID0gdHJ1ZTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoKHRtcFswXSA9PSBcIlxcblwiIHx8IHRtcFswXSA9PSBcIlxcclwiKSAmJiAhaW5fc3RyaW5nICYmICFpbl9tdWx0aWxpbmVfY29tbWVudCAmJiBpbl9zaW5nbGVsaW5lX2NvbW1lbnQpIHtcblx0XHRcdGluX3NpbmdsZWxpbmVfY29tbWVudCA9IGZhbHNlO1xuXHRcdH1cblx0XHRlbHNlIGlmICghaW5fbXVsdGlsaW5lX2NvbW1lbnQgJiYgIWluX3NpbmdsZWxpbmVfY29tbWVudCAmJiAhKC9cXG58XFxyfFxccy8udGVzdCh0bXBbMF0pKSkge1xuXHRcdFx0bmV3X3N0cltucysrXSA9IHRtcFswXTtcblx0XHR9XG5cdH1cblx0bmV3X3N0cltucysrXSA9IHJjO1xuXHRyZXR1cm4gbmV3X3N0ci5qb2luKFwiXCIpO1xufTtcblxuIiwiLypqc2xpbnQgaW5kZW50OjIsd2hpdGU6dHJ1ZSxzbG9wcHk6dHJ1ZSxub2RlOnRydWUgKi9cbnZhciBFdmVudEludGVyZmFjZSA9IHJlcXVpcmUoJy4uLy4uL3NyYy9wcm94eS9ldmVudEludGVyZmFjZScpO1xudmFyIENvbnN1bWVyID0gcmVxdWlyZSgnLi4vLi4vc3JjL2NvbnN1bWVyJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uLy4uL3NyYy91dGlsJyk7XG5cbi8qKlxuICogQ29yZSBmcmVlZG9tIHNlcnZpY2VzIGF2YWlsYWJsZSB0byBhbGwgbW9kdWxlcy5cbiAqIENyZWF0ZWQgYnkgdGhlIGVudmlyb25tZW50IGhlbHBlciBpbiByZXNwb25zZSB0byBhICdjb3JlJyByZXF1ZXN0LlxuICogQENsYXNzIENvcmVfdW5wcml2aWxlZ2VkXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7TWFuYWdlcn0gbWFuYWdlciBUaGUgbWFuYWdlciB0aGlzIGNvcmUgaXMgY29ubmVjdGVkIHdpdGguXG4gKiBAcHJpdmF0ZVxuICovXG52YXIgQ29yZV91bnByaXZpbGVnZWQgPSBmdW5jdGlvbihtYW5hZ2VyLCBwb3N0TWVzc2FnZSkge1xuICB0aGlzLm1hbmFnZXIgPSBtYW5hZ2VyO1xuICB0aGlzLmRlYnVnID0gdGhpcy5tYW5hZ2VyLmRlYnVnO1xufTtcblxuQ29yZV91bnByaXZpbGVnZWQudW5ib3VuZENoYW5uZWxzID0ge307XG5cbkNvcmVfdW5wcml2aWxlZ2VkLmNvbnRleHRJZCA9IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBDcmVhdGUgYSBjdXN0b20gY2hhbm5lbC5cbiAqIFJldHVybnMgdGhlIHN0cnVjdHVyZSB7Y2hhbm5lbDogUHJveHksIGlkZW50aWZpZXI6IE9iamVjdH0sXG4gKiB3aGVyZSB0aGUgaWRlbnRpZmllciBjYW4gYmUgJ3JlZGVlbWVkJyBieSBhbm90aGVyIG1vZHVsZSBvciBwcm92aWRlciB1c2luZ1xuICogYmluZCBjaGFubmVsLCBhdCB3aGljaCBwb2ludCB0aGUgZGVmZXJyZWQgb2JqZWN0IHdpbGwgcmVzb2x2ZSB3aXRoIGEgY2hhbm5lbFxuICogYmV0d2VlbiB0aGUgdHdvIGVuZHBvaW50cy5cbiAqIEBtZXRob2QgY3JlYXRlQ2hhbm5lbFxuICogQHBhcmFtcyB7RnVuY3Rpb259IGNvbnRpbnVhdGlvbiBNZXRob2QgdG8gY2FsbCB3aXRoIHRoZSBjb3NudHJ1Y3RlZCBzdHJ1Y3R1cmUuXG4gKi9cbkNvcmVfdW5wcml2aWxlZ2VkLnByb3RvdHlwZS5jcmVhdGVDaGFubmVsID0gZnVuY3Rpb24oY29udGludWF0aW9uKSB7XG4gIHZhciBwcm94eSA9IG5ldyBDb25zdW1lcihFdmVudEludGVyZmFjZSwgdGhpcy5tYW5hZ2VyLmRlYnVnKSxcbiAgICAgIGlkID0gdXRpbC5nZXRJZCgpLFxuICAgICAgY2hhbiA9IHRoaXMuZ2V0Q2hhbm5lbChwcm94eSk7XG4gIHRoaXMubWFuYWdlci5zZXR1cChwcm94eSk7XG5cbiAgaWYgKHRoaXMubWFuYWdlci5kZWxlZ2F0ZSAmJiB0aGlzLm1hbmFnZXIudG9EZWxlZ2F0ZS5jb3JlKSB7XG4gICAgdGhpcy5tYW5hZ2VyLmVtaXQodGhpcy5tYW5hZ2VyLmRlbGVnYXRlLCB7XG4gICAgICB0eXBlOiAnRGVsZWdhdGlvbicsXG4gICAgICByZXF1ZXN0OiAnaGFuZGxlJyxcbiAgICAgIGZsb3c6ICdjb3JlJyxcbiAgICAgIG1lc3NhZ2U6IHtcbiAgICAgICAgdHlwZTogJ3JlZ2lzdGVyJyxcbiAgICAgICAgaWQ6IGlkXG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgQ29yZV91bnByaXZpbGVnZWQudW5ib3VuZENoYW5uZWxzW2lkXSA9IHtcbiAgICBsb2NhbDogdHJ1ZSxcbiAgICBwcm94eTogcHJveHlcbiAgfTtcblxuICBwcm94eS5vbmNlKCdzdGFydCcsIHRoaXMuZ2V0Q2hhbm5lbC5iaW5kKHRoaXMsIHByb3h5KSk7XG5cbiAgY29udGludWF0aW9uKHtcbiAgICBjaGFubmVsOiBjaGFuLFxuICAgIGlkZW50aWZpZXI6IGlkXG4gIH0pO1xufTtcblxuQ29yZV91bnByaXZpbGVnZWQucHJvdG90eXBlLmdldENoYW5uZWwgPSBmdW5jdGlvbihwcm94eSkge1xuICB2YXIgaWZhY2UgPSBwcm94eS5nZXRQcm94eUludGVyZmFjZSgpLFxuICAgICAgY2hhbiA9IGlmYWNlKCk7XG4gIGNoYW4uY2xvc2UgPSBpZmFjZS5jbG9zZTtcbiAgY2hhbi5vbkNsb3NlID0gaWZhY2Uub25DbG9zZTtcbiAgaWZhY2Uub25DbG9zZShjaGFuLCBmdW5jdGlvbigpIHtcbiAgICBwcm94eS5kb0Nsb3NlKCk7XG4gIH0pO1xuICByZXR1cm4gY2hhbjtcbn07XG5cbi8qKlxuICogUmVjZWl2ZSBhIG1lc3NhZ2UgZnJvbSBhbm90aGVyIGNvcmUgaW5zdGFuY2UuXG4gKiBOb3RlOiBDb3JlX3VucHJpdmlsZWdlZCBpcyBub3QgcmVnaXN0ZXJlZCBvbiB0aGUgaHViLiBpdCBpcyBhIHByb3ZpZGVyLFxuICogICAgIGFzIGl0J3MgbG9jYXRpb24gYW5kIG5hbWUgd291bGQgaW5kaWNhdGUuIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGJ5XG4gKiAgICAgcG9ydC1hcHAgdG8gcmVsYXkgbWVzc2FnZXMgdXAgdG8gaGlnaGVyIGxldmVscy4gIE1vcmUgZ2VuZXJhbGx5LCB0aGVcbiAqICAgICBtZXNzYWdlcyBlbWl0dGVkIGJ5IHRoZSBjb3JlIHRvICd0aGlzLm1hbmFnZXIuZW1pdCh0aGlzLm1hbmFuYWdlLmRlbGVnYXRlJ1xuICogICAgIFNob3VsZCBiZSBvbk1lc3NhZ2VkIHRvIHRoZSBjb250cm9sbGluZyBjb3JlLlxuICogQHBhcmFtIHtTdHJpbmd9IHNvdXJjZSBUaGUgc291cmNlIG9mIHRoZSBtZXNzYWdlLlxuICogQHBhcmFtIHtPYmplY3R9IG1zZyBUaGUgbWVzc3NhZ2UgZnJvbSBhbiBpc29sYXRlZCBjb3JlIHByb3ZpZGVyLlxuICovXG5Db3JlX3VucHJpdmlsZWdlZC5wcm90b3R5cGUub25NZXNzYWdlID0gZnVuY3Rpb24oc291cmNlLCBtc2cpIHtcbiAgaWYgKG1zZy50eXBlID09PSAncmVnaXN0ZXInKSB7XG4gICAgQ29yZV91bnByaXZpbGVnZWQudW5ib3VuZENoYW5uZWxzW21zZy5pZF0gPSB7XG4gICAgICByZW1vdGU6IHRydWUsXG4gICAgICByZXNvbHZlOiBtc2cucmVwbHksXG4gICAgICBzb3VyY2U6IHNvdXJjZVxuICAgIH07XG4gIH0gZWxzZSBpZiAobXNnLnR5cGUgPT09ICdjbGVhcicpIHtcbiAgICBkZWxldGUgQ29yZV91bnByaXZpbGVnZWQudW5ib3VuZENoYW5uZWxzW21zZy5pZF07XG4gIH0gZWxzZSBpZiAobXNnLnR5cGUgPT09ICdiaW5kJykge1xuICAgIGlmIChDb3JlX3VucHJpdmlsZWdlZC51bmJvdW5kQ2hhbm5lbHNbbXNnLmlkXSkge1xuICAgICAgdGhpcy5iaW5kQ2hhbm5lbChtc2cuaWQsIGZ1bmN0aW9uKCkge30sIHNvdXJjZSk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIEJpbmQgYSBjdXN0b20gY2hhbm5lbC5cbiAqIENyZWF0ZXMgYSBwcm94eSBpbnRlcmZhY2UgdG8gdGhlIGN1c3RvbSBjaGFubmVsLCB3aGljaCB3aWxsIGJlIGJvdW5kIHRvXG4gKiB0aGUgcHJveHkgb2J0YWluZWQgdGhyb3VnaCBhbiBlYXJsaWVyIGNyZWF0ZUNoYW5uZWwgY2FsbC5cbiAqIGNoYW5uZWwgdG8gYSBwcm94eS5cbiAqIEBtZXRob2QgYmluZENoYW5uZWxcbiAqIEBwYXJhbSB7T2JqZWN0fSBpZGVudGlmaWVyIEFuIGlkZW50aWZpZXIgb2J0YWluZWQgdGhyb3VnaCBjcmVhdGVDaGFubmVsLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY29udGludWF0aW9uIEEgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdpdGggdGhlIHByb3h5LlxuICovXG5Db3JlX3VucHJpdmlsZWdlZC5wcm90b3R5cGUuYmluZENoYW5uZWwgPSBmdW5jdGlvbihpZGVudGlmaWVyLCBjb250aW51YXRpb24sIHNvdXJjZSkge1xuICB2YXIgdG9CaW5kID0gQ29yZV91bnByaXZpbGVnZWQudW5ib3VuZENoYW5uZWxzW2lkZW50aWZpZXJdLFxuICAgICAgbmV3U291cmNlID0gIXNvdXJjZTtcblxuICAvLyB3aGVuIGJpbmRDaGFubmVsIGlzIGNhbGxlZCBkaXJlY3RseSwgc291cmNlIHdpbGwgYmUgdW5kZWZpbmVkLlxuICAvLyBXaGVuIGl0IGlzIHByb3BvZ2F0ZWQgYnkgb25NZXNzYWdlLCBhIHNvdXJjZSBmb3IgYmluZGluZyB3aWxsIGFscmVhZHkgZXhpc3QuXG4gIGlmIChuZXdTb3VyY2UpIHtcbiAgICB0aGlzLmRlYnVnLmRlYnVnKCdtYWtpbmcgbG9jYWwgcHJveHkgZm9yIGNvcmUgYmluZGluZycpO1xuICAgIHNvdXJjZSA9IG5ldyBDb25zdW1lcihFdmVudEludGVyZmFjZSwgdGhpcy5kZWJ1Zyk7XG4gICAgdGhpcy5tYW5hZ2VyLnNldHVwKHNvdXJjZSk7XG4gIH1cblxuICAvLyBJZiB0aGlzIGlzIGEga25vd24gaWRlbnRpZmllciBhbmQgaXMgaW4gdGhlIHNhbWUgY29udGV4dCwgYmluZGluZyBpcyBlYXN5LlxuICBpZiAodG9CaW5kICYmIHRvQmluZC5sb2NhbCkge1xuICAgIHRoaXMuZGVidWcuZGVidWcoJ0JpbmRpbmcgYSBjaGFubmVsIHRvIHBvcnQgb24gdGhpcyBodWI6JyArIHNvdXJjZSk7XG4gICAgdGhpcy5tYW5hZ2VyLmNyZWF0ZUxpbmsoc291cmNlLCBpZGVudGlmaWVyLCB0b0JpbmQucHJveHksICdkZWZhdWx0Jyk7XG4gICAgZGVsZXRlIENvcmVfdW5wcml2aWxlZ2VkLnVuYm91bmRDaGFubmVsc1tpZGVudGlmaWVyXTtcbiAgICBpZiAodGhpcy5tYW5hZ2VyLmRlbGVnYXRlICYmIHRoaXMubWFuYWdlci50b0RlbGVnYXRlLmNvcmUpIHtcbiAgICAgIHRoaXMubWFuYWdlci5lbWl0KHRoaXMubWFuYWdlci5kZWxlZ2F0ZSwge1xuICAgICAgICB0eXBlOiAnRGVsZWdhdGlvbicsXG4gICAgICAgIHJlcXVlc3Q6ICdoYW5kbGUnLFxuICAgICAgICBmbG93OiAnY29yZScsXG4gICAgICAgIG1lc3NhZ2U6IHtcbiAgICAgICAgICB0eXBlOiAnY2xlYXInLFxuICAgICAgICAgIGlkOiBpZGVudGlmaWVyXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0b0JpbmQgJiYgdG9CaW5kLnJlbW90ZSkge1xuICAgIHRoaXMuZGVidWcuZGVidWcoJ0JpbmRpbmcgYSBjaGFubmVsIGludG8gYSBtb2R1bGUuJyk7XG4gICAgdGhpcy5tYW5hZ2VyLmNyZWF0ZUxpbmsoXG4gICAgICAgIHNvdXJjZSxcbiAgICAgICAgbmV3U291cmNlID8gJ2RlZmF1bHQnIDogaWRlbnRpZmllcixcbiAgICAgICAgdG9CaW5kLnNvdXJjZSxcbiAgICAgICAgaWRlbnRpZmllcik7XG4gICAgdG9CaW5kLnJlc29sdmUoe1xuICAgICAgdHlwZTogJ0JpbmQgQ2hhbm5lbCcsXG4gICAgICByZXF1ZXN0Oidjb3JlJyxcbiAgICAgIGZsb3c6ICdjb3JlJyxcbiAgICAgIG1lc3NhZ2U6IHtcbiAgICAgICAgdHlwZTogJ2JpbmQnLFxuICAgICAgICBpZDogaWRlbnRpZmllclxuICAgICAgfVxuICAgIH0pO1xuICAgIGRlbGV0ZSBDb3JlX3VucHJpdmlsZWdlZC51bmJvdW5kQ2hhbm5lbHNbaWRlbnRpZmllcl07XG4gIH0gZWxzZSBpZiAodGhpcy5tYW5hZ2VyLmRlbGVnYXRlICYmIHRoaXMubWFuYWdlci50b0RlbGVnYXRlLmNvcmUpIHtcbiAgICB0aGlzLmRlYnVnLmluZm8oJ2RlbGVnYXRpbmcgY2hhbm5lbCBiaW5kIGZvciBhbiB1bmtub3duIElEOicgKyBpZGVudGlmaWVyKTtcbiAgICB0aGlzLm1hbmFnZXIuZW1pdCh0aGlzLm1hbmFnZXIuZGVsZWdhdGUsIHtcbiAgICAgIHR5cGU6ICdEZWxlZ2F0aW9uJyxcbiAgICAgIHJlcXVlc3Q6ICdoYW5kbGUnLFxuICAgICAgZmxvdzogJ2NvcmUnLFxuICAgICAgbWVzc2FnZToge1xuICAgICAgICB0eXBlOiAnYmluZCcsXG4gICAgICAgIGlkOiBpZGVudGlmaWVyXG4gICAgICB9XG4gICAgfSk7XG4gICAgc291cmNlLm9uY2UoJ3N0YXJ0JywgZnVuY3Rpb24ocCwgY2IpIHtcbiAgICAgIGNiKHRoaXMuZ2V0Q2hhbm5lbChwKSk7XG4gICAgfS5iaW5kKHRoaXMsIHNvdXJjZSwgY29udGludWF0aW9uKSk7XG4gICAgdGhpcy5tYW5hZ2VyLmNyZWF0ZUxpbmsoc291cmNlLFxuICAgICAgICAnZGVmYXVsdCcsXG4gICAgICAgIHRoaXMubWFuYWdlci5odWIuZ2V0RGVzdGluYXRpb24odGhpcy5tYW5hZ2VyLmRlbGVnYXRlKSxcbiAgICAgICAgaWRlbnRpZmllcik7XG4gICAgZGVsZXRlIENvcmVfdW5wcml2aWxlZ2VkLnVuYm91bmRDaGFubmVsc1tpZGVudGlmaWVyXTtcbiAgICByZXR1cm47XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5kZWJ1Zy53YXJuKCdBc2tlZCB0byBiaW5kIHVua25vd24gY2hhbm5lbDogJyArIGlkZW50aWZpZXIpO1xuICAgIHRoaXMuZGVidWcubG9nKENvcmVfdW5wcml2aWxlZ2VkLnVuYm91bmRDaGFubmVscyk7XG4gICAgY29udGludWF0aW9uKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHNvdXJjZS5nZXRJbnRlcmZhY2UpIHtcbiAgICBjb250aW51YXRpb24odGhpcy5nZXRDaGFubmVsKHNvdXJjZSkpO1xuICB9IGVsc2Uge1xuICAgIGNvbnRpbnVhdGlvbigpO1xuICB9XG59O1xuXG4vKipcbiAqIEdldCB0aGUgSUQgb2YgdGhlIGN1cnJlbnQgZnJlZWRvbS5qcyBjb250ZXh0LiAgUHJvdmlkZXMgYW5cbiAqIGFycmF5IG9mIG1vZHVsZSBVUkxzLCB0aGUgbGluZWFnZSBvZiB0aGUgY3VycmVudCBjb250ZXh0LlxuICogV2hlbiBub3QgaW4gYW4gYXBwbGljYXRpb24gY29udGV4dCwgdGhlIElEIGlzIHRoZSBsaW5lYWdlXG4gKiBvZiB0aGUgY3VycmVudCBWaWV3LlxuICogQG1ldGhvZCBnZXRJZFxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIGNhbGxlZCB3aXRoIElEIGluZm9ybWF0aW9uLlxuICovXG5Db3JlX3VucHJpdmlsZWdlZC5wcm90b3R5cGUuZ2V0SWQgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAvLyBUT0RPOiBtYWtlIHN1cmUgY29udGV4dElEIGlzIHByb3Blcmx5IGZyb3plbi5cbiAgY2FsbGJhY2soQ29yZV91bnByaXZpbGVnZWQuY29udGV4dElkKTtcbn07XG5cbi8qKlxuICogR2V0IGEgbG9nZ2VyIGZvciBsb2dnaW5nIHRvIHRoZSBmcmVlZG9tLmpzIGxvZ2dlci4gUHJvdmlkZXMgYVxuICogbG9nIG9iamVjdCB3aXRoIGFuIGludGVyZmFjZSBzaW1pbGFyIHRvIHRoZSBzdGFuZGFyZCBqYXZhc2NyaXB0IGNvbnNvbGUsXG4gKiB3aGljaCBsb2dzIHZpYSBkZWJ1Zy5cbiAqIEBtZXRob2QgZ2V0TG9nZ2VyXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgbG9nZ2VyLCB1c2VkIGFzIGl0cyAnc291cmNlJ1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2l0aCB0aGUgbG9nZ2VyLlxuICovXG5Db3JlX3VucHJpdmlsZWdlZC5wcm90b3R5cGUuZ2V0TG9nZ2VyID0gZnVuY3Rpb24obmFtZSwgY2FsbGJhY2spIHtcbiAgY2FsbGJhY2sodGhpcy5tYW5hZ2VyLmRlYnVnLmdldExvZ2dlcihuYW1lKSk7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgSUQgb2YgdGhlIGN1cnJlbnQgZnJlZWRvbS5qcyBjb250ZXh0LlxuICogQG1ldGhvZCBzZXRJZFxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7U3RyaW5nW119IGlkIFRoZSBsaW5lYWdlIG9mIHRoZSBjdXJyZW50IGNvbnRleHQuXG4gKi9cbkNvcmVfdW5wcml2aWxlZ2VkLnByb3RvdHlwZS5zZXRJZCA9IGZ1bmN0aW9uKGlkKSB7XG4gIENvcmVfdW5wcml2aWxlZ2VkLmNvbnRleHRJZCA9IGlkO1xufTtcblxuZXhwb3J0cy5wcm92aWRlciA9IENvcmVfdW5wcml2aWxlZ2VkO1xuZXhwb3J0cy5uYW1lID0gXCJjb3JlXCI7XG4iLCIvKmpzbGludCBpbmRlbnQ6Mix3aGl0ZTp0cnVlLG5vZGU6dHJ1ZSxzbG9wcHk6dHJ1ZSAqL1xudmFyIFByb21pc2VDb21wYXQgPSByZXF1aXJlKCdlczYtcHJvbWlzZScpLlByb21pc2U7XG5cbi8qKlxuICogVGhlIEFQSSByZWdpc3RyeSBmb3IgZnJlZWRvbS5qcy4gIFVzZWQgdG8gbG9vayB1cCByZXF1ZXN0ZWQgQVBJcyxcbiAqIGFuZCBwcm92aWRlcyBhIGJyaWRnZSBmb3IgY29yZSBBUElzIHRvIGFjdCBsaWtlIG5vcm1hbCBBUElzLlxuICogQENsYXNzIEFQSVxuICogQHBhcmFtIHtEZWJ1Z30gZGVidWcgVGhlIGRlYnVnZ2VyIHRvIHVzZSBmb3IgbG9nZ2luZy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG52YXIgQXBpID0gZnVuY3Rpb24oZGVidWcpIHtcbiAgdGhpcy5kZWJ1ZyA9IGRlYnVnO1xuICB0aGlzLmFwaXMgPSB7fTtcbiAgdGhpcy5wcm92aWRlcnMgPSB7fTtcbiAgdGhpcy53YWl0ZXJzID0ge307XG59O1xuXG4vKipcbiAqIEdldCBhbiBBUEkuXG4gKiBAbWV0aG9kIGdldFxuICogQHBhcmFtIHtTdHJpbmd9IGFwaSBUaGUgQVBJIG5hbWUgdG8gZ2V0LlxuICogQHJldHVybnMge3tuYW1lOlN0cmluZywgZGVmaW5pdGlvbjpBUEl9fSBUaGUgQVBJIGlmIHJlZ2lzdGVyZWQuXG4gKi9cbkFwaS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oYXBpKSB7XG4gIGlmICghdGhpcy5hcGlzW2FwaV0pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBhcGksXG4gICAgZGVmaW5pdGlvbjogdGhpcy5hcGlzW2FwaV1cbiAgfTtcbn07XG5cbi8qKlxuICogU2V0IGFuIEFQSSB0byBhIGRlZmluaXRpb24uXG4gKiBAbWV0aG9kIHNldFxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgVGhlIEFQSSBuYW1lLlxuICogQHBhcmFtIHtBUEl9IGRlZmluaXRpb24gVGhlIEpTT04gb2JqZWN0IGRlZmluaW5nIHRoZSBBUEkuXG4gKi9cbkFwaS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24obmFtZSwgZGVmaW5pdGlvbikge1xuICB0aGlzLmFwaXNbbmFtZV0gPSBkZWZpbml0aW9uO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlciBhIGNvcmUgQVBJIHByb3ZpZGVyLlxuICogQG1ldGhvZCByZWdpc3RlclxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgdGhlIEFQSSBuYW1lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY29uc3RydWN0b3IgdGhlIGZ1bmN0aW9uIHRvIGNyZWF0ZSBhIHByb3ZpZGVyIGZvciB0aGUgQVBJLlxuICogQHBhcmFtIHtTdHJpbmc/fSBzdHlsZSBUaGUgc3R5bGUgdGhlIHByb3ZpZGVyIGlzIHdyaXR0ZW4gaW4uIFZhbGlkIHN0eWxlc1xuICogICBhcmUgZG9jdW1lbnRlZCBpbiBmZG9tLnBvcnQuUHJvdmlkZXIucHJvdG90eXBlLmdldEludGVyZmFjZS4gRGVmYXVsdHMgdG9cbiAqICAgcHJvdmlkZUFzeW5jaHJvbm91c1xuICovXG5BcGkucHJvdG90eXBlLnJlZ2lzdGVyID0gZnVuY3Rpb24obmFtZSwgY29uc3RydWN0b3IsIHN0eWxlKSB7XG4gIHZhciBpO1xuXG4gIHRoaXMucHJvdmlkZXJzW25hbWVdID0ge1xuICAgIGNvbnN0cnVjdG9yOiBjb25zdHJ1Y3RvcixcbiAgICBzdHlsZTogc3R5bGUgfHwgJ3Byb3ZpZGVBc3luY2hyb25vdXMnXG4gIH07XG5cbiAgaWYgKHRoaXMud2FpdGVyc1tuYW1lXSkge1xuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLndhaXRlcnNbbmFtZV0ubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIHRoaXMud2FpdGVyc1tuYW1lXVtpXS5yZXNvbHZlKGNvbnN0cnVjdG9yLmJpbmQoe30sXG4gICAgICAgICAgdGhpcy53YWl0ZXJzW25hbWVdW2ldLmZyb20pKTtcbiAgICB9XG4gICAgZGVsZXRlIHRoaXMud2FpdGVyc1tuYW1lXTtcbiAgfVxufTtcblxuLyoqXG4gKiBHZXQgYSBjb3JlIEFQSSBjb25uZWN0ZWQgdG8gYSBnaXZlbiBGcmVlRE9NIG1vZHVsZS5cbiAqIEBtZXRob2QgZ2V0Q29yZVxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgdGhlIEFQSSB0byByZXRyaWV2ZS5cbiAqIEBwYXJhbSB7cG9ydC5BcHB9IGZyb20gVGhlIGluc3RhbnRpYXRpbmcgQXBwLlxuICogQHJldHVybnMge1Byb21pc2V9IEEgcHJvbWlzZSBvZiBhIGZkb20uQXBwIGxvb2stYWxpa2UgbWF0Y2hpbmdcbiAqIGEgbG9jYWwgQVBJIGRlZmluaXRpb24uXG4gKi9cbkFwaS5wcm90b3R5cGUuZ2V0Q29yZSA9IGZ1bmN0aW9uKG5hbWUsIGZyb20pIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlQ29tcGF0KGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIGlmICh0aGlzLmFwaXNbbmFtZV0pIHtcbiAgICAgIGlmICh0aGlzLnByb3ZpZGVyc1tuYW1lXSkge1xuICAgICAgICByZXNvbHZlKHRoaXMucHJvdmlkZXJzW25hbWVdLmNvbnN0cnVjdG9yLmJpbmQoe30sIGZyb20pKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghdGhpcy53YWl0ZXJzW25hbWVdKSB7XG4gICAgICAgICAgdGhpcy53YWl0ZXJzW25hbWVdID0gW107XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy53YWl0ZXJzW25hbWVdLnB1c2goe1xuICAgICAgICAgIHJlc29sdmU6IHJlc29sdmUsXG4gICAgICAgICAgcmVqZWN0OiByZWplY3QsXG4gICAgICAgICAgZnJvbTogZnJvbVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kZWJ1Zy53YXJuKCdBcGkuZ2V0Q29yZSBhc2tlZCBmb3IgdW5rbm93biBjb3JlOiAnICsgbmFtZSk7XG4gICAgICByZWplY3QobnVsbCk7XG4gICAgfVxuICB9LmJpbmQodGhpcykpO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIHN0eWxlIGluIHdoaWNoIGEgY29yZSBBUEkgaXMgd3JpdHRlbi5cbiAqIFRoaXMgbWV0aG9kIGlzIGd1YXJhbnRlZWQgdG8ga25vdyB0aGUgc3R5bGUgb2YgYSBwcm92aWRlciByZXR1cm5lZCBmcm9tXG4gKiBhIHByZXZpb3VzIGdldENvcmUgY2FsbCwgYW5kIHNvIGRvZXMgbm90IHVzZSBwcm9taXNlcy5cbiAqIEBtZXRob2QgZ2V0SW50ZXJmYWNlU3R5bGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBwcm92aWRlci5cbiAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBjb2Rpbmcgc3R5bGUsIGFzIHVzZWQgYnlcbiAqICAgZmRvbS5wb3J0LlByb3ZpZGVyLnByb3RvdHlwZS5nZXRJbnRlcmZhY2UuXG4gKi9cbkFwaS5wcm90b3R5cGUuZ2V0SW50ZXJmYWNlU3R5bGUgPSBmdW5jdGlvbihuYW1lKSB7XG4gIGlmICh0aGlzLnByb3ZpZGVyc1tuYW1lXSkge1xuICAgIHJldHVybiB0aGlzLnByb3ZpZGVyc1tuYW1lXS5zdHlsZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmRlYnVnLndhcm4oJ0FwaS5nZXRJbnRlcmZhY2VTdHlsZSBmb3IgdW5rbm93biBwcm92aWRlcjogJyArIG5hbWUpO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbn07XG5cbi8qKlxuICogRGVmaW5lcyB0aGUgYXBpcyBtb2R1bGUgYW5kIHByb3ZpZGVyIHJlZ2lzdHJ5LlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IEFwaTtcbiIsIi8qanNsaW50IGluZGVudDoyLG5vZGU6dHJ1ZSAqL1xudmFyIGluY2x1ZGVGb2xkZXIgPSB1bmRlZmluZWQ7XG52YXIgbWluaWZ5ID0gcmVxdWlyZSgnbm9kZS1qc29uLW1pbmlmeScpO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG52YXIgQnVuZGxlID0gZnVuY3Rpb24gKCkge1xuICAndXNlIHN0cmljdCc7XG4gIHZhciBmb3VuZDtcbiAgdGhpcy5pbnRlcmZhY2VzID0gW107XG4gIC8qanNsaW50IG5vbWVuOiB0cnVlICovXG4gIHRyeSB7XG4gICAgZm91bmQgPSAoZnVuY3Rpb24oKXt2YXIgc2VsZj17fSxmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5zZWxmLmNvbnNvbGUgPSBcIntcXG4gIFxcXCJuYW1lXFxcIjogXFxcImNvbnNvbGVcXFwiLFxcbiAgXFxcImFwaVxcXCI6IHtcXG4gICAgLy8gTG9nKHNvdXJjZSwgbWVzc2FnZSlcXG4gICAgXFxcImxvZ1xcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCIsIFxcXCJzdHJpbmdcXFwiXX0sXFxuICAgIFxcXCJkZWJ1Z1xcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCIsIFxcXCJzdHJpbmdcXFwiXX0sXFxuICAgIFxcXCJpbmZvXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIiwgXFxcInN0cmluZ1xcXCJdfSxcXG4gICAgXFxcIndhcm5cXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiLCBcXFwic3RyaW5nXFxcIl19LFxcbiAgICBcXFwiZXJyb3JcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiLCBcXFwic3RyaW5nXFxcIl19XFxuICB9XFxufVxcblwiO1xuc2VsZi5jb3JlQ29uc29sZSA9IFwie1xcbiAgXFxcIm5hbWVcXFwiOiBcXFwiY29yZS5jb25zb2xlXFxcIixcXG4gIFxcXCJhcGlcXFwiOiB7XFxuICAgIC8vIExvZyhzb3VyY2UsIG1lc3NhZ2UpXFxuICAgIFxcXCJsb2dcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiLCBcXFwic3RyaW5nXFxcIl19LFxcbiAgICBcXFwiZGVidWdcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiLCBcXFwic3RyaW5nXFxcIl19LFxcbiAgICBcXFwiaW5mb1xcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCIsIFxcXCJzdHJpbmdcXFwiXX0sXFxuICAgIFxcXCJ3YXJuXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIiwgXFxcInN0cmluZ1xcXCJdfSxcXG4gICAgXFxcImVycm9yXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIiwgXFxcInN0cmluZ1xcXCJdfVxcbiAgfVxcbn1cXG5cIjtcbnNlbGYuY29yZUVjaG8gPSBcIntcXG4gIFxcXCJuYW1lXFxcIjogXFxcImNvcmUuZWNob1xcXCIsXFxuICBcXFwiYXBpXFxcIjoge1xcbiAgICBcXFwic2V0dXBcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiXX0sXFxuICAgIFxcXCJzZW5kXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIl19LFxcbiAgICBcXFwibWVzc2FnZVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFxcXCJzdHJpbmdcXFwifVxcbiAgfVxcbn1cIjtcbnNlbGYuY29yZSA9IFwie1xcbiAgXFxcIm5hbWVcXFwiOiBcXFwiY29yZVxcXCIsXFxuICBcXFwiYXBpXFxcIjoge1xcbiAgICBcXFwiY3JlYXRlQ2hhbm5lbFxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXSwgXFxcInJldFxcXCI6IHtcXG4gICAgICBcXFwiY2hhbm5lbFxcXCI6IFxcXCJwcm94eVxcXCIsXFxuICAgICAgXFxcImlkZW50aWZpZXJcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICB9fSxcXG4gICAgXFxcImJpbmRDaGFubmVsXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIl0sIFxcXCJyZXRcXFwiOiBcXFwicHJveHlcXFwifSxcXG4gICAgXFxcImdldElkXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdLCBcXFwicmV0XFxcIjogW1xcXCJhcnJheVxcXCIsIFxcXCJzdHJpbmdcXFwiXX0sXFxuICAgIFxcXCJnZXRMb2dnZXJcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiXSwgXFxcInJldFxcXCI6IFxcXCJwcm94eVxcXCJ9XFxuICB9XFxufVxcblwiO1xuc2VsZi5jb3JlT2F1dGggPSBcIntcXG4gIFxcXCJuYW1lXFxcIjogXFxcImNvcmUub2F1dGhcXFwiLFxcbiAgXFxcImFwaVxcXCI6IHtcXG4gICAgLyoqXFxuICAgICAqIEluZGljYXRlIHRoZSBpbnRlbnRpb24gdG8gaW5pdGlhdGUgYW4gb0F1dGggZmxvdywgYWxsb3dpbmcgYW4gYXBwcm9wcmlhdGVcXG4gICAgICogb0F1dGggcHJvdmlkZXIgdG8gYmVnaW4gbW9uaXRvcmluZyBmb3IgcmVkaXJlY3Rpb24uXFxuICAgICAqIFRoaXMgd2lsbCBnZW5lcmF0ZSBhIHRva2VuLCB3aGljaCBtdXN0IGJlIHBhc3NlZCB0byB0aGUgc2luZ2xlIHN1YnNlcXVlbnQgY2FsbFxcbiAgICAgKiB0byBsYXVuY2hBdXRoRmxvdy4gXFxuICAgICAqIFxcbiAgICAgKiBcXG4gICAgICogQG1ldGhvZCBpbml0aWF0ZU9BdXRoXFxuICAgICAqIEBwYXJhbSB7U3RyaW5nW119IFZhbGlkIG9BdXRoIHJlZGlyZWN0IFVSSXMgZm9yIHlvdXIgYXBwbGljYXRpb25cXG4gICAgICogQHJldHVybiB7e3JlZGlyZWN0OiBTdHJpbmcsIHN0YXRlOiBTdHJpbmd9fSBBIGNob3NlbiByZWRpcmVjdCBVUkkgYW5kXFxuICAgICAqICAgc3RhdGUgd2hpY2ggd2lsbCBiZSBtb25pdG9yZWQgZm9yIG9BdXRoIHJlZGlyZWN0aW9uIGlmIGF2YWlsYWJsZVxcbiAgICAgKiovXFxuICAgIFxcXCJpbml0aWF0ZU9BdXRoXFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjogW1tcXFwiYXJyYXlcXFwiLCBcXFwic3RyaW5nXFxcIl1dLFxcbiAgICAgIFxcXCJyZXRcXFwiOiB7XFxuICAgICAgICBcXFwicmVkaXJlY3RcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJzdGF0ZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgICAgfSxcXG4gICAgICBcXFwiZXJyXFxcIjoge1xcbiAgICAgICAgXFxcImVycmNvZGVcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJtZXNzYWdlXFxcIjogXFxcInN0cmluZ1xcXCJcXG4gICAgICB9XFxuICAgIH0sXFxuICBcXG4gICAgLyoqXFxuICAgICAqIG9BdXRoIGNsaWVudC1zaWRlIGZsb3cgLSBsYXVuY2ggdGhlIHByb3ZpZGVkIFVSTFxcbiAgICAgKiBUaGlzIG11c3QgYmUgY2FsbGVkIGFmdGVyIGluaXRpYXRlT0F1dGggd2l0aCB0aGUgcmV0dXJuZWQgc3RhdGUgb2JqZWN0XFxuICAgICAqXFxuICAgICAqIEBtZXRob2QgbGF1bmNoQXV0aEZsb3dcXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IFRoZSBVUkwgdGhhdCBpbml0aWF0ZXMgdGhlIGF1dGggZmxvdy5cXG4gICAgICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywgc3RyaW5nPn0gVGhlIHJldHVybiB2YWx1ZSBmcm9tIGluaXRpYXRlT0F1dGhcXG4gICAgICogQHJldHVybiB7U3RyaW5nfSByZXNwb25zZVVybCAtIGNvbnRhaW5pbmcgdGhlIGFjY2VzcyB0b2tlblxcbiAgICAgKi9cXG4gICAgXFxcImxhdW5jaEF1dGhGbG93XFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiLCB7XFxuICAgICAgICBcXFwicmVkaXJlY3RcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJzdGF0ZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgICAgfV0sXFxuICAgICAgXFxcInJldFxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgIFxcXCJlcnJcXFwiOiB7XFxuICAgICAgICBcXFwiZXJyY29kZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcIm1lc3NhZ2VcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICAgIH1cXG4gICAgfVxcbiAgfVxcbn1cXG5cIjtcbnNlbGYuY29yZVBlZXJjb25uZWN0aW9uID0gXCJ7XFxuICBcXFwibmFtZVxcXCI6IFxcXCJjb3JlLnBlZXJjb25uZWN0aW9uXFxcIixcXG4gIFxcXCJhcGlcXFwiOiB7XFxuICAgIC8vIFNldHVwIHRoZSBsaW5rIHRvIHRoZSBwZWVyIGFuZCBvcHRpb25zIGZvciB0aGlzIHBlZXIgY29ubmVjdGlvbi5cXG4gICAgXFxcInNldHVwXFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjogW1xcbiAgICAgICAgLy8gVGhlIGZyZWVkb20uanMgY2hhbm5lbCBpZGVudGlmaWVyIHVzZWQgdG8gc2V0dXAgYSBzaWduYWxsaW5nIGNoYW5lbC5cXG4gICAgICAgIFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgLy8gVGhlIHBlZXJOYW1lLCB1c2VkIGRlYnVnZ2luZyBhbmQgY29uc29sZSBtZXNzYWdlcy5cXG4gICAgICAgIFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgLy8gVGhlIGxpc3Qgb2YgU1RVTiBzZXJ2ZXJzIHRvIHVzZS5cXG4gICAgICAgIC8vIFRoZSBmb3JtYXQgb2YgYSBzaW5nbGUgZW50cnkgaXMgc3R1bjpIT1NUOlBPUlQsIHdoZXJlIEhPU1RcXG4gICAgICAgIC8vIGFuZCBQT1JUIGFyZSBhIHN0dW4gc2VydmVyIGhvc3RuYW1lIGFuZCBwb3J0LCByZXNwZWN0aXZlbHkuXFxuICAgICAgICBbXFxcImFycmF5XFxcIiwgXFxcInN0cmluZ1xcXCJdLFxcbiAgICAgICAgLy8gV2hldGhlciB0byBpbW1lZGlhdGVseSBpbml0aWF0ZSBhIGNvbm5lY3Rpb24gYmVmb3JlIGZ1bGZpbGxpbmcgcmV0dXJuXFxuICAgICAgICAvLyBwcm9taXNlLlxcbiAgICAgICAgXFxcImJvb2xlYW5cXFwiXFxuICAgICAgXVxcbiAgICB9LFxcbiAgXFxuICAgIC8vIFNlbmQgYSBtZXNzYWdlIHRvIHRoZSBwZWVyLlxcbiAgICBcXFwic2VuZFxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbe1xcbiAgICAgIC8vIERhdGEgY2hhbm5lbCBpZC4gSWYgcHJvdmlkZWQsIHdpbGwgYmUgdXNlZCBhcyB0aGUgY2hhbm5lbCBsYWJlbC5cXG4gICAgICAvLyBUaGUgYmVoYXZpb3IgaXMgdW5kZWZpbmVkIGlmIHRoZSBjaGFubmVsIGxhYmVsIGRvZXNuJ3QgZXhpc3QuXFxuICAgICAgXFxcImNoYW5uZWxMYWJlbFxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgIC8vIE9uZSBvZiB0aGUgYmVsbG93IHNob3VsZCBiZSBkZWZpbmVkOyB0aGlzIGlzIHRoZSBkYXRhIHRvIHNlbmQuXFxuICAgICAgXFxcInRleHRcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICBcXFwiYmluYXJ5XFxcIjogXFxcImJsb2JcXFwiLFxcbiAgICAgIFxcXCJidWZmZXJcXFwiOiBcXFwiYnVmZmVyXFxcIlxcbiAgICB9XX0sXFxuICBcXG4gICAgLy8gQ2FsbGVkIHdoZW4gd2UgZ2V0IGEgbWVzc2FnZSBmcm9tIHRoZSBwZWVyLlxcbiAgICBcXFwib25SZWNlaXZlZFxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IHtcXG4gICAgICAvLyBUaGUgbGFiZWwvaWQgb2YgdGhlIGRhdGEgY2hhbm5lbC5cXG4gICAgICBcXFwiY2hhbm5lbExhYmVsXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgLy8gT25lIHRoZSBiZWxvdyB3aWxsIGJlIHNwZWNpZmllZC5cXG4gICAgICBcXFwidGV4dFxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgIFxcXCJiaW5hcnlcXFwiOiBcXFwiYmxvYlxcXCIsXFxuICAgICAgXFxcImJ1ZmZlclxcXCI6IFxcXCJidWZmZXJcXFwiXFxuICAgIH19LFxcbiAgXFxuICAgIC8vIE9wZW4gdGhlIGRhdGEgY2hhbm5lbCB3aXRoIHRoaXMgbGFiZWwuXFxuICAgIFxcXCJvcGVuRGF0YUNoYW5uZWxcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiXX0sXFxuICAgIC8vIENsb3NlIHRoZSBkYXRhIGNoYW5uZWwgd2l0aCB0aGlzIGxhYmVsLlxcbiAgICBcXFwiY2xvc2VEYXRhQ2hhbm5lbFxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCJdfSxcXG4gIFxcbiAgICAvLyBBIGNoYW5uZWwgd2l0aCB0aGlzIGlkIGhhcyBiZWVuIG9wZW5lZC5cXG4gICAgXFxcIm9uT3BlbkRhdGFDaGFubmVsXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcImV2ZW50XFxcIiwgXFxcInZhbHVlXFxcIjoge1xcXCJjaGFubmVsSWRcXFwiOiBcXFwic3RyaW5nXFxcIn19LFxcbiAgICAvLyBUaGUgY2hhbm5hbGUgd2l0aCB0aGlzIGlkIGhhcyBiZWVuIGNsb3NlZC5cXG4gICAgXFxcIm9uQ2xvc2VEYXRhQ2hhbm5lbFxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IHtcXFwiY2hhbm5lbElkXFxcIjogXFxcInN0cmluZ1xcXCJ9fSxcXG4gIFxcbiAgICAvLyBSZXR1cm5zIHRoZSBudW1iZXIgb2YgYnl0ZXMgdGhhdCBoYXZlIHF1ZXVlZCB1c2luZyBcXFwic2VuZFxcXCIsIGJ1dCBub3RcXG4gICAgLy8geWV0IHNlbnQgb3V0LiBDdXJyZW50bHkganVzdCBleHBvc2VzOlxcbiAgICAvLyBodHRwOi8vd3d3LnczLm9yZy9UUi93ZWJydGMvI3dpZGwtUlRDRGF0YUNoYW5uZWwtYnVmZmVyZWRBbW91bnRcXG4gICAgXFxcImdldEJ1ZmZlcmVkQW1vdW50XFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxuICAgICAgICAgICAgICAgICAgICAgICAgICBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCJdLFxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXFxcInJldFxcXCI6IFxcXCJudW1iZXJcXFwifSxcXG4gIFxcbiAgICAvLyBSZXR1cm5zIGxvY2FsIFNEUCBoZWFkZXJzIGZyb20gY3JlYXRlT2ZmZXIuXFxuICAgIFxcXCJnZXRJbmZvXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdLCBcXFwicmV0XFxcIjogXFxcInN0cmluZ1xcXCJ9LFxcbiAgXFxuICAgIFxcXCJjcmVhdGVPZmZlclxcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLFxcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IFt7XFxuICAgICAgICAvLyBPcHRpb25hbCA6UlRDT2ZmZXJPcHRpb25zIG9iamVjdC5cXG4gICAgICAgIFxcXCJvZmZlclRvUmVjZWl2ZVZpZGVvXFxcIjogXFxcIm51bWJlclxcXCIsXFxuICAgICAgICBcXFwib2ZmZXJUb1JlY2VpdmVBdWRpb1xcXCI6IFxcXCJudW1iZXJcXFwiLFxcbiAgICAgICAgXFxcInZvaWNlQWN0aXZpdHlEZXRlY3Rpb25cXFwiOiBcXFwiYm9vbGVhblxcXCIsXFxuICAgICAgICBcXFwiaWNlUmVzdGFydFxcXCI6IFxcXCJib29sZWFuXFxcIlxcbiAgICAgIH1dLFxcbiAgICAgIFxcXCJyZXRcXFwiOiB7XFxuICAgICAgICAvLyBGdWxmaWxscyB3aXRoIGEgOlJUQ1Nlc3Npb25EZXNjcmlwdGlvblxcbiAgICAgICAgXFxcInR5cGVcXFwiOiBcXFwic3RyaW5nXFxcIiwgIC8vIFNob3VsZCBhbHdheXMgYmUgXFxcIm9mZmVyXFxcIi5cXG4gICAgICAgIFxcXCJzZHBcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICAgIH1cXG4gICAgfSxcXG4gIFxcbiAgICAvLyBDbG9zZSB0aGUgcGVlciBjb25uZWN0aW9uLlxcbiAgICBcXFwiY2xvc2VcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW119LFxcbiAgICAvLyBUaGUgcGVlciBjb25uZWN0aW9uIGhhcyBiZWVuIGNsb3NlZC5cXG4gICAgXFxcIm9uQ2xvc2VcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwiZXZlbnRcXFwiLCBcXFwidmFsdWVcXFwiOiB7fX1cXG4gIH1cXG59XFxuXCI7XG5zZWxmLmNvcmVSdGNkYXRhY2hhbm5lbCA9IFwie1xcbiAgXFxcIm5hbWVcXFwiOiBcXFwiY29yZS5ydGNkYXRhY2hhbm5lbFxcXCIsXFxuICAvLyBBUEkgZm9sbG93cyBodHRwOi8vdzNjLmdpdGh1Yi5pby93ZWJydGMtcGMvXFxuICBcXFwiYXBpXFxcIjoge1xcblxcbiAgICBcXFwiY29uc3RydWN0b3JcXFwiOiB7XFxuICAgICAgLy8gTnVtZXJpYyBJRCByZXRyZWF2ZWQgZnJvbSBjb3JlLnJ0Y3BlZXJjb25uZWN0aW9uLmNyZWF0ZURhdGFDaGFubmVsXFxuICAgICAgLy8gb3IgZnJvbSBhbiBvbmRhdGFjaGFubmVsIGV2ZW50LlxcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIl1cXG4gICAgfSxcXG5cXG4gICAgXFxcImdldExhYmVsXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdLCBcXFwicmV0XFxcIjogXFxcInN0cmluZ1xcXCJ9LFxcbiAgICBcXFwiZ2V0T3JkZXJlZFxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXSwgXFxcInJldFxcXCI6IFxcXCJib29sZWFuXFxcIn0sXFxuICAgIFxcXCJnZXRNYXhQYWNrZXRMaWZlVGltZVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXSwgXFxcInJldFxcXCI6IFxcXCJudW1iZXJcXFwifSxcXG4gICAgXFxcImdldE1heFJldHJhbnNtaXRzXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdLCBcXFwicmV0XFxcIjogXFxcIm51bWJlclxcXCJ9LFxcbiAgICBcXFwiZ2V0UHJvdG9jb2xcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW10sIFxcXCJyZXRcXFwiOiBcXFwic3RyaW5nXFxcIn0sXFxuICAgIFxcXCJnZXROZWdvdGlhdGVkXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdLCBcXFwicmV0XFxcIjogXFxcImJvb2xlYW5cXFwifSxcXG4gICAgXFxcImdldElkXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdLCBcXFwicmV0XFxcIjogXFxcIm51bWJlclxcXCJ9LFxcbiAgICBcXFwiZ2V0UmVhZHlTdGF0ZVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXSwgXFxcInJldFxcXCI6IFxcXCJzdHJpbmdcXFwifSxcXG4gICAgXFxcImdldEJ1ZmZlcmVkQW1vdW50XFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdLCBcXFwicmV0XFxcIjogXFxcIm51bWJlclxcXCJ9LFxcblxcbiAgICBcXFwib25vcGVuXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcImV2ZW50XFxcIiwgXFxcInZhbHVlXFxcIjogW119LFxcbiAgICBcXFwib25lcnJvclxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdfSxcXG4gICAgXFxcIm9uY2xvc2VcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwiZXZlbnRcXFwiLCBcXFwidmFsdWVcXFwiOiBbXX0sXFxuICAgIFxcXCJjbG9zZVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXX0sXFxuICAgIFxcXCJvbm1lc3NhZ2VcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwiZXZlbnRcXFwiLCBcXFwidmFsdWVcXFwiOiB7XFxuICAgICAgXFxcInRleHRcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICBcXFwiYmluYXJ5XFxcIjogXFxcImJ1ZmZlclxcXCJcXG4gICAgfX0sXFxuICAgIFxcXCJnZXRCaW5hcnlUeXBlXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdLCBcXFwicmV0XFxcIjogXFxcInN0cmluZ1xcXCJ9LFxcbiAgICBcXFwic2V0QmluYXJ5VHlwZVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCJdfSxcXG4gICAgXFxcInNlbmRcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiXX0sXFxuICAgIC8vIE5vdGU6IHJlbmFtZWQgZnJvbSAnc2VuZCcgdG8gaGFuZGxlIHRoZSBvdmVybG9hZGVkIHR5cGUuXFxuICAgIFxcXCJzZW5kQnVmZmVyXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtcXFwiYnVmZmVyXFxcIl19XFxuICB9XFxufVxcblwiO1xuc2VsZi5jb3JlUnRjcGVlcmNvbm5lY3Rpb24gPSBcIntcXG4gIFxcXCJuYW1lXFxcIjogXFxcImNvcmUucnRjcGVlcmNvbm5lY3Rpb25cXFwiLFxcbiAgLy8gQVBJIGZvbGxvd3MgaHR0cDovL3czYy5naXRodWIuaW8vd2VicnRjLXBjL1xcbiAgXFxcImFwaVxcXCI6IHtcXG4gICAgLy8gQXJndW1lbnRzOiBpY2VTZXJ2ZXJzLCBpY2VUcmFuc3BvcnRzLCBwZWVySWRlbnRpdHlcXG4gICAgLy8gRGV2aWF0aW9uIGZyb20gc3BlYzogaWNlU2VydmVycywgYW5kIGljZVNlcnZlcnMudXJscyB3aGVuIHNwZWNpZmllZCBtdXN0XFxuICAgIC8vIGJlIGFuIGFycmF5LCBldmVuIGlmIG9ubHkgMSBpcyBzcGVjaWZpZWQuXFxuICAgIFxcXCJjb25zdHJ1Y3RvclxcXCI6IHtcXG4gICAgICBcXFwidmFsdWVcXFwiOiBbe1xcbiAgICAgICAgXFxcImljZVNlcnZlcnNcXFwiOiBbXFxcImFycmF5XFxcIiwge1xcbiAgICAgICAgICBcXFwidXJsc1xcXCI6IFtcXFwiYXJyYXlcXFwiLCBcXFwic3RyaW5nXFxcIl0sXFxuICAgICAgICAgIFxcXCJ1c2VybmFtZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgICBcXFwiY3JlZGVudGlhbFxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgICAgICB9XSxcXG4gICAgICAgIFxcXCJpY2VUcmFuc3BvcnRzXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwicGVlcklkZW50aXR5XFxcIjogXFxcInN0cmluZ1xcXCJcXG4gICAgICB9XVxcbiAgICB9LFxcblxcbiAgICAvLyBQZXIgaHR0cDovL3czYy5naXRodWIuaW8vd2VicnRjLXBjLyNpZGwtZGVmLVJUQ09mZmVyT3B0aW9uc1xcbiAgICBcXFwiY3JlYXRlT2ZmZXJcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW3tcXG4gICAgICBcXFwib2ZmZXJUb1JlY2VpdmVBdWRpb1xcXCI6IFxcXCJudW1iZXJcXFwiLFxcbiAgICAgIFxcXCJvZmZlclRvUmVjZWl2ZVZpZGVvXFxcIjogXFxcIm51bWJlclxcXCIsXFxuICAgICAgXFxcImljZVJlc3RhcnRcXFwiOiBcXFwiYm9vbGVhblxcXCIsXFxuICAgICAgXFxcInZvaWNlQWN0aXZpdHlEZXRlY3Rpb25cXFwiOiBcXFwiYm9vbGVhblxcXCJcXG4gICAgfV0sIFxcXCJyZXRcXFwiOiB7XFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICBcXFwic2RwXFxcIjogXFxcInN0cmluZ1xcXCJcXG4gICAgfX0sXFxuICAgIFxcXCJjcmVhdGVBbnN3ZXJcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW10sIFxcXCJyZXRcXFwiOiB7XFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICBcXFwic2RwXFxcIjogXFxcInN0cmluZ1xcXCJcXG4gICAgfX0sXFxuXFxuICAgIC8vIFBlciBodHRwOi8vdzNjLmdpdGh1Yi5pby93ZWJydGMtcGMvI2lkbC1kZWYtUlRDU2Vzc2lvbkRlc2NyaXB0aW9uXFxuICAgIFxcXCJzZXRMb2NhbERlc2NyaXB0aW9uXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFt7XFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICBcXFwic2RwXFxcIjogXFxcInN0cmluZ1xcXCJcXG4gICAgfV19LFxcbiAgICBcXFwiZ2V0TG9jYWxEZXNjcmlwdGlvblxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXSwgXFxcInJldFxcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgIFxcXCJzZHBcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICB9fSxcXG4gICAgXFxcInNldFJlbW90ZURlc2NyaXB0aW9uXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFt7XFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICBcXFwic2RwXFxcIjogXFxcInN0cmluZ1xcXCJcXG4gICAgfV0sIFxcXCJyZXRcXFwiOiB7fX0sXFxuICAgIFxcXCJnZXRSZW1vdGVEZXNjcmlwdGlvblxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXSwgXFxcInJldFxcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgIFxcXCJzZHBcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICB9fSxcXG5cXG4gICAgLy8gUGVyIGh0dHA6Ly93M2MuZ2l0aHViLmlvL3dlYnJ0Yy1wYy8jaWRsLWRlZi1SVENTaWduYWxpbmdTdGF0ZVxcbiAgICBcXFwiZ2V0U2lnbmFsaW5nU3RhdGVcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW10sIFxcXCJyZXRcXFwiOiBcXFwic3RyaW5nXFxcIn0sXFxuXFxuICAgIC8vIFBlciBodHRwOi8vdzNjLmdpdGh1Yi5pby93ZWJydGMtcGMvI2lkbC1kZWYtUlRDQ29uZmlndXJhdGlvblxcbiAgICBcXFwidXBkYXRlSWNlXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFt7XFxuICAgICAgICBcXFwiaWNlU2VydmVyc1xcXCI6IFtcXFwiYXJyYXlcXFwiLCB7XFxuICAgICAgICAgIFxcXCJ1cmxzXFxcIjogW1xcXCJhcnJheVxcXCIsIFxcXCJzdHJpbmdcXFwiXSxcXG4gICAgICAgICAgXFxcInVzZXJuYW1lXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICAgIFxcXCJjcmVkZW50aWFsXFxcIjogXFxcInN0cmluZ1xcXCJcXG4gICAgICAgIH1dLFxcbiAgICAgICAgXFxcImljZVRyYW5zcG9ydHNcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJwZWVySWRlbnRpdHlcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICAgIH1dLCBcXFwicmV0XFxcIjoge319LFxcblxcbiAgICAvLyBQZXIgaHR0cDovL3czYy5naXRodWIuaW8vd2VicnRjLXBjLyNpZGwtZGVmLVJUQ0ljZUNhbmRpZGF0ZVxcbiAgICBcXFwiYWRkSWNlQ2FuZGlkYXRlXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFt7XFxuICAgICAgXFxcImNhbmRpZGF0ZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgIFxcXCJzZHBNaWRcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICBcXFwic2RwTUxpbmVJbmRleFxcXCI6IFxcXCJudW1iZXJcXFwiXFxuICAgIH1dLCBcXFwicmV0XFxcIjoge319LFxcblxcbiAgICBcXFwiZ2V0SWNlR2F0aGVyaW5nU3RhdGVcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW10sIFxcXCJyZXRcXFwiOiBcXFwic3RyaW5nXFxcIn0sXFxuICAgIFxcXCJnZXRJY2VDb25uZWN0aW9uU3RhdGVcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW10sIFxcXCJyZXRcXFwiOiBcXFwic3RyaW5nXFxcIn0sXFxuXFxuICAgIFxcXCJnZXRDb25maWd1cmF0aW9uXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdLCBcXFwicmV0XFxcIjoge1xcbiAgICAgIFxcXCJpY2VTZXJ2ZXJzXFxcIjogW1xcXCJhcnJheVxcXCIsIHtcXG4gICAgICAgIFxcXCJ1cmxzXFxcIjogW1xcXCJhcnJheVxcXCIsIFxcXCJzdHJpbmdcXFwiXSxcXG4gICAgICAgIFxcXCJ1c2VybmFtZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcImNyZWRlbnRpYWxcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICAgIH1dLFxcbiAgICAgIFxcXCJpY2VUcmFuc3BvcnRzXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgXFxcInBlZXJJZGVudGl0eVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgIH19LFxcblxcbiAgICAvLyBOdW1iZXJzIGZvciBzdHJlYW0gQVBJIGFyZSBJRHMgd2l0aCB3aGljaCB0byBtYWtlIGNvcmUubWVkaWFzdHJlYW0uXFxuICAgIFxcXCJnZXRMb2NhbFN0cmVhbXNcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW10sIFxcXCJyZXRcXFwiOiBbXFxcImFycmF5XFxcIiwgXFxcInN0cmluZ1xcXCJdfSxcXG4gICAgXFxcImdldFJlbW90ZVN0cmVhbXNcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW10sIFxcXCJyZXRcXFwiOiBbXFxcImFycmF5XFxcIiwgXFxcInN0cmluZ1xcXCJdfSxcXG4gICAgXFxcImdldFN0cmVhbUJ5SWRcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiXSwgXFxcInJldFxcXCI6IFxcXCJzdHJpbmdcXFwifSxcXG4gICAgXFxcImFkZFN0cmVhbVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCJdLCBcXFwicmV0XFxcIjoge319LFxcbiAgICBcXFwicmVtb3ZlU3RyZWFtXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIl0sIFxcXCJyZXRcXFwiOiB7fX0sXFxuXFxuICAgIFxcXCJjbG9zZVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXSwgXFxcInJldFxcXCI6IHt9fSxcXG5cXG4gICAgLy8gUGVyIGh0dHA6Ly93M2MuZ2l0aHViLmlvL3dlYnJ0Yy1wYy8jaWRsLWRlZi1SVENEYXRhQ2hhbm5lbEluaXRcXG4gICAgLy8gTm90ZTogTnVtYmVycyBhcmUgSURzIHVzZWQgdG8gY3JlYXRlIGNvcmUuZGF0YWNoYW5uZWwgb2JqZWN0cy5cXG4gICAgXFxcImNyZWF0ZURhdGFDaGFubmVsXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIiwge1xcbiAgICAgIFxcXCJvcmRlcmVkXFxcIjogXFxcImJvb2xlYW5cXFwiLFxcbiAgICAgIFxcXCJtYXhQYWNrZXRMaWZlVGltZVxcXCI6IFxcXCJudW1iZXJcXFwiLFxcbiAgICAgIFxcXCJtYXhSZXRyYW5zbWl0c1xcXCI6IFxcXCJudW1iZXJcXFwiLFxcbiAgICAgIFxcXCJwcm90b2NvbFxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgIFxcXCJuZWdvdGlhdGVkXFxcIjogXFxcImJvb2xlYW5cXFwiLFxcbiAgICAgIFxcXCJpZFxcXCI6IFxcXCJudW1iZXJcXFwiXFxuICAgIH1dLCBcXFwicmV0XFxcIjogXFxcInN0cmluZ1xcXCJ9LFxcbiAgICAvL05vdGU6IG9ubHkgcmVwb3J0cyBjaGFubmVscyBvcGVuZWQgYnkgdGhlIHJlbW90ZSBwZWVyLlxcbiAgICBcXFwib25kYXRhY2hhbm5lbFxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IHtcXG4gICAgICBcXFwiY2hhbm5lbFxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgIH19LFxcblxcbiAgICAvL1RPRE86IFN1cHBvcnQgRFRNRiBFeHRlbnNpb24uXFxuICAgIC8vXFxcImNyZWF0ZURUTUZTZW5kZXJcXFwiOiB7fSxcXG5cXG4gICAgLy9wZXIgaHR0cDovL3czYy5naXRodWIuaW8vd2VicnRjLXBjLyNpZGwtZGVmLVJUQ1N0YXRzQ2FsbGJhY2tcXG4gICAgLy9OdW1iZXIgaWYgc2VwZWNpZmllZCByZXByZXNlbnRzIGEgY29yZS5tZWRpYXN0cmVhbXRyYWNrLlxcbiAgICAvL1JldHVybmVkIG9iamVjdCBpcyBhIHNlcmlhbGl6YXRpb24gb2YgdGhlIFJUQ1N0YXRzUmVwb3J0LlxcbiAgICBcXFwiZ2V0U3RhdHNcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiXSwgXFxcInJldFxcXCI6XFxcIm9iamVjdFxcXCJ9LFxcblxcbiAgICAvL1RPRE86IFN1cHBvcnQgSWRlbnRpdHkgRXh0ZW5zaW9uLlxcbiAgICAvKlxcbiAgICBcXFwic2V0SWRlbnRpdHlQcm92aWRlclxcXCI6IHt9LFxcbiAgICBcXFwiZ2V0SWRlbnRpdHlBc3NlcnRpb25cXFwiOiB7fSxcXG4gICAgXFxcImdldFBlZXJJZGVudGl0eVxcXCI6IHt9LFxcbiAgICBcXFwib25pZGVudGl0eXJlc3VsdFxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdfSxcXG4gICAgXFxcIm9ucGVlcmlkZW50aXR5XFxcIjp7XFxcInR5cGVcXFwiOiBcXFwiZXZlbnRcXFwiLCBcXFwidmFsdWVcXFwiOiBbXX0sXFxuICAgIFxcXCJvbmlkcGFzc2VydGlvbmVycm9yXFxcIjp7XFxcInR5cGVcXFwiOiBcXFwiZXZlbnRcXFwiLCBcXFwidmFsdWVcXFwiOiBbXX0sXFxuICAgIFxcXCJvbmlkcHZhbGlkYXRpb25lcnJvclxcXCI6e1xcXCJ0eXBlXFxcIjogXFxcImV2ZW50XFxcIiwgXFxcInZhbHVlXFxcIjogW119LFxcbiAgICAqL1xcblxcbiAgICBcXFwib25uZWdvdGlhdGlvbm5lZWRlZFxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdfSxcXG4gICAgXFxcIm9uaWNlY2FuZGlkYXRlXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcImV2ZW50XFxcIiwgXFxcInZhbHVlXFxcIjoge1xcbiAgICAgIFxcXCJjYW5kaWRhdGVcXFwiOiB7XFxuICAgICAgICBcXFwiY2FuZGlkYXRlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwic2RwTWlkXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwic2RwTUxpbmVJbmRleFxcXCI6IFxcXCJudW1iZXJcXFwiXFxuICAgICAgfVxcbiAgICB9fSxcXG4gICAgXFxcIm9uc2lnbmFsaW5nc3RhdGVjaGFuZ2VcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwiZXZlbnRcXFwiLCBcXFwidmFsdWVcXFwiOiBbXX0sXFxuICAgIFxcXCJvbmFkZHN0cmVhbVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IHtcXG4gICAgICBcXFwic3RyZWFtXFxcIjogXFxcIm51bWJlclxcXCJcXG4gICAgfX0sXFxuICAgIFxcXCJvbnJlbW92ZXN0cmVhbVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IHtcXG4gICAgICBcXFwic3RyZWFtXFxcIjogXFxcIm51bWJlclxcXCJcXG4gICAgfX0sXFxuICAgIFxcXCJvbmljZWNvbm5lY3Rpb25zdGF0ZWNoYW5nZVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdfVxcbiAgfVxcbn1cXG5cIjtcbnNlbGYuY29yZVN0b3JhZ2UgPSBcIntcXG4gIFxcXCJuYW1lXFxcIjogXFxcImNvcmUuc3RvcmFnZVxcXCIsXFxuICBcXFwiYXBpXFxcIjoge1xcbiAgICBcXFwia2V5c1xcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXSwgXFxcInJldFxcXCI6IFtcXFwiYXJyYXlcXFwiLCBcXFwic3RyaW5nXFxcIl19LFxcbiAgICBcXFwiZ2V0XFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIl0sIFxcXCJyZXRcXFwiOiBcXFwic3RyaW5nXFxcIn0sXFxuICAgIFxcXCJzZXRcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiLCBcXFwic3RyaW5nXFxcIl0sIFxcXCJyZXRcXFwiOiBcXFwic3RyaW5nXFxcIn0sXFxuICAgIFxcXCJyZW1vdmVcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiXSwgXFxcInJldFxcXCI6IFxcXCJzdHJpbmdcXFwifSxcXG4gICAgXFxcImNsZWFyXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdfVxcbiAgfVxcbn1cIjtcbnNlbGYuY29yZVRjcHNvY2tldCA9IFwie1xcbiAgXFxcIm5hbWVcXFwiOiBcXFwiY29yZS50Y3Bzb2NrZXRcXFwiLFxcbiAgXFxcImFwaVxcXCI6IHtcXG4gICAgLy8gU29ja2V0cyBtYXkgYmUgY29uc3RydWN0ZWQgYm91bmQgdG8gYSBwcmUtZXhpc3RpbmcgaWQsIGFzIGluIHRoZSBjYXNlIG9mXFxuICAgIC8vIGludGVyYWN0aW5nIHdpdGggYSBzb2NrZXQgYWNjcGV0ZWQgYnkgYSBzZXJ2ZXIuICBJZiBubyBJZCBpcyBzcGVjaWZpZWQsIGFcXG4gICAgLy8gbmV3IHNvY2tldCB3aWxsIGJlIGNyZWF0ZWQsIHdoaWNoIGNhbiBiZSBlaXRoZXIgY29ubmVjdCdlZCBvciBsaXN0ZW4nZWQuXFxuICAgIFxcXCJjb25zdHJ1Y3RvclxcXCI6IHtcXG4gICAgICBcXFwidmFsdWVcXFwiOiBbXFxcIm51bWJlclxcXCJdXFxuICAgIH0sXFxuICBcXG4gICAgLy8gR2V0IGluZm8gYWJvdXQgYSBzb2NrZXQuICBUZWxscyB5b3Ugd2hldGhlciB0aGUgc29ja2V0IGlzIGFjdGl2ZSBhbmRcXG4gICAgLy8gYXZhaWxhYmxlIGhvc3QgaW5mb3JtYXRpb24uXFxuICAgIFxcXCJnZXRJbmZvXFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjogW10sXFxuICAgICAgXFxcInJldFxcXCI6IHtcXG4gICAgICAgIFxcXCJjb25uZWN0ZWRcXFwiOiBcXFwiYm9vbGVhblxcXCIsXFxuICAgICAgICBcXFwibG9jYWxBZGRyZXNzXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwibG9jYWxQb3J0XFxcIjogXFxcIm51bWJlclxcXCIsXFxuICAgICAgICBcXFwicGVlckFkZHJlc3NcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJwZWVyUG9ydFxcXCI6IFxcXCJudW1iZXJcXFwiXFxuICAgICAgfVxcbiAgICB9LFxcbiAgXFxuICAgIC8qKiBcXG4gICAgICogZXJyb3IgY29kZXMgYW5kIGRlZmF1bHQgbWVzc2FnZXMgdGhhdCBtYXkgYmUgcmV0dXJuZWQgb24gZmFpbHVyZXMuXFxuICAgICAqL1xcbiAgICBcXFwiRVJSQ09ERVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJjb25zdGFudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IHtcXG4gICAgICAvKiogR0VORVJBTCAqKi9cXG4gICAgICBcXFwiU1VDQ0VTU1xcXCI6IFxcXCJTdWNjZXNzIVxcXCIsXFxuICAgICAgLy8gVW5rbm93blxcbiAgICAgIFxcXCJVTktOT1dOXFxcIjogXFxcIlVua25vd24gZXJyb3JcXFwiLFxcbiAgICAgIFxcbiAgICAgIC8vIFNvY2tldCBpcyBhbHJlYWR5IGNvbm5lY3RlZFxcbiAgICAgIFxcXCJBTFJFQURZX0NPTk5FQ1RFRFxcXCI6IFxcXCJTb2NrZXQgYWxyZWFkeSBjb25uZWN0ZWRcXFwiLFxcbiAgICAgIC8vIEludmFsaWQgQXJndW1lbnQsIGNsaWVudCBlcnJvclxcbiAgICAgIFxcXCJJTlZBTElEX0FSR1VNRU5UXFxcIjogXFxcIkludmFsaWQgYXJndW1lbnRcXFwiLFxcbiAgICAgIC8vIENvbm5lY3Rpb24gdGltZWQgb3V0LlxcbiAgICAgIFxcXCJUSU1FRF9PVVRcXFwiOiBcXFwiVGltZWQgb3V0XFxcIixcXG4gICAgICAvLyBPcGVyYXRpb24gY2Fubm90IGNvbXBsZXRlIGJlY2F1c2Ugc29ja2V0IGlzIG5vdCBjb25uZWN0ZWQuXFxuICAgICAgXFxcIk5PVF9DT05ORUNURURcXFwiOiBcXFwiU29ja2V0IG5vdCBjb25uZWN0ZWRcXFwiLFxcbiAgICAgIC8vIFNvY2tldCByZXNldCBiZWNhdXNlIG9mIGNoYW5nZSBpbiBuZXR3b3JrIHN0YXRlLlxcbiAgICAgIFxcXCJORVRXT1JLX0NIQU5HRURcXFwiOiBcXFwiTmV0d29yayBjaGFuZ2VkXFxcIixcXG4gICAgICAvLyBDb25uZWN0aW9uIGNsb3NlZFxcbiAgICAgIFxcXCJDT05ORUNUSU9OX0NMT1NFRFxcXCI6IFxcXCJDb25uZWN0aW9uIGNsb3NlZCBncmFjZWZ1bGx5XFxcIixcXG4gICAgICAvLyBDb25uZWN0aW9uIFJlc2V0XFxuICAgICAgXFxcIkNPTk5FQ1RJT05fUkVTRVRcXFwiOiBcXFwiQ29ubmVjdGlvbiByZXNldFxcXCIsXFxuICAgICAgLy8gQ29ubmVjdGlvbiBSZWZ1c2VkXFxuICAgICAgXFxcIkNPTk5FQ1RJT05fUkVGVVNFRFxcXCI6IFxcXCJDb25uZWN0aW9uIHJlZnVzZWRcXFwiLFxcbiAgICAgIC8vIEdlbmVyaWMgRmFpbHVyZVxcbiAgICAgIFxcXCJDT05ORUNUSU9OX0ZBSUxFRFxcXCI6IFxcXCJDb25uZWN0aW9uIGZhaWxlZFxcXCJcXG4gICAgfX0sXFxuICAgIFxcbiAgICAvLyBDbG9zZSBhIHNvY2tldC4gV2lsbCBGYWlsIGlmIHRoZSBzb2NrZXQgaXMgbm90IGNvbm5lY3RlZCBvciBhbHJlYWR5XFxuICAgIC8vIGNsb3NlZC5cXG4gICAgXFxcImNsb3NlXFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjogW10sXFxuICAgICAgXFxcImVyclxcXCI6IHtcXG4gICAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgICAgfVxcbiAgICB9LFxcbiAgXFxuICAgIC8vIFJlY2VpdmUgbm90aWZpY2F0aW9uIHRoYXQgdGhlIHNvY2tldCBoYXMgZGlzY29ubmVjdGVkLlxcbiAgICBcXFwib25EaXNjb25uZWN0XFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcImV2ZW50XFxcIiwgXFxcInZhbHVlXFxcIjoge1xcbiAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgXFxcIm1lc3NhZ2VcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICB9fSxcXG4gIFxcbiAgICAvLyBDb25uZWN0IHRvIGEgaG9zdCBhbmQgcG9ydC5cXG4gICAgLy8gRmFpbHMgd2l0aCBhbiBlcnJvciBpZiBjb25uZWN0aW9uIGZhaWxzLlxcbiAgICBcXFwiY29ubmVjdFxcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLFxcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIiwgXFxcIm51bWJlclxcXCJdLFxcbiAgICAgIFxcXCJlcnJcXFwiOiB7XFxuICAgICAgICBcXFwiZXJyY29kZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcIm1lc3NhZ2VcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICAgIH1cXG4gICAgfSxcXG4gIFxcbiAgICAvLyBVcGdyYWRlcyBhIHNvY2tldCB0byBUTFMsIGV4cGVjdGVkIHRvIGJlIGludm9rZWQgYWZ0ZXIgY29ubmVjdC5cXG4gICAgXFxcInNlY3VyZVxcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLFxcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IFtdLFxcbiAgICAgIFxcXCJlcnJcXFwiOiB7XFxuICAgICAgICBcXFwiZXJyY29kZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcIm1lc3NhZ2VcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICAgIH1cXG4gICAgfSxcXG4gIFxcbiAgICAvLyBQcmVwYXJlcyBhIHNvY2tldCBmb3IgYmVjb21pbmcgc2VjdXJlIGFmdGVyIHRoZSBuZXh0IHJlYWQgZXZlbnQuXFxuICAgIC8vIFNlZSBkZXRhaWxzIGF0XFxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mcmVlZG9tanMvZnJlZWRvbS93aWtpL3ByZXBhcmVTZWN1cmUtQVBJLVVzYWdlXFxuICAgIC8vIFRoaXMgc2hvdWxkIGJlIGNhbGxlZCBvbmUgcmVhZCBwcmlvciB0byBjYWxsaW5nIC5zZWN1cmUsIGUuZy4gaW4gWE1QUFxcbiAgICAvLyB0aGlzIHNob3VsZCBiZSBjYWxsZWQgYmVmb3JlIHNlbmRpbmcgXFxcInN0YXJ0dGxzXFxcIiwgdGhlbiBhZnRlciBhIFxcXCJwcm9jZWVkXFxcIlxcbiAgICAvLyBtZXNzYWdlIGlzIHJlYWQgLnNlY3VyZSBzaG91bGQgYmUgY2FsbGVkLlxcbiAgICBcXFwicHJlcGFyZVNlY3VyZVxcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLFxcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IFtdLFxcbiAgICAgIFxcXCJlcnJcXFwiOiB7XFxuICAgICAgICBcXFwiZXJyY29kZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcIm1lc3NhZ2VcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICAgIH1cXG4gICAgfSxcXG4gIFxcbiAgICAvLyBXcml0ZSBidWZmZXIgZGF0YSB0byBhIHNvY2tldC5cXG4gICAgLy8gRmFpbHMgd2l0aCBhbiBlcnJvciBpZiB3cml0ZSBmYWlscy5cXG4gICAgXFxcIndyaXRlXFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjogW1xcXCJidWZmZXJcXFwiXSxcXG4gICAgICBcXFwiZXJyXFxcIjoge1xcbiAgICAgICAgXFxcImVycmNvZGVcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJtZXNzYWdlXFxcIjogXFxcInN0cmluZ1xcXCJcXG4gICAgICB9XFxuICAgIH0sXFxuICBcXG4gICAgLy8gUmVjZWl2ZSBkYXRhIG9uIGEgY29ubmVjdGVkIHNvY2tldC5cXG4gICAgXFxcIm9uRGF0YVxcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjoge1xcXCJkYXRhXFxcIjogXFxcImJ1ZmZlclxcXCJ9XFxuICAgIH0sXFxuICBcXG4gICAgLy8gTGlzdGVuIGFzIGEgc2VydmVyIGF0IGEgc3BlY2lmaWVkIGhvc3QgYW5kIHBvcnQuXFxuICAgIC8vIEFmdGVyIGNhbGxpbmcgbGlzdGVuIHRoZSBjbGllbnQgc2hvdWxkIGxpc3RlbiBmb3IgJ29uQ29ubmVjdGlvbicgZXZlbnRzLlxcbiAgICAvLyBGYWlscyB3aXRoIGFuIGVycm9yIGlmIGVycm9ycyBvY2N1ciB3aGlsZSBiaW5kaW5nIG9yIGxpc3RlbmluZy5cXG4gICAgXFxcImxpc3RlblxcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLFxcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIiwgXFxcIm51bWJlclxcXCJdLFxcbiAgICAgIFxcXCJlcnJcXFwiOiB7XFxuICAgICAgICBcXFwiZXJyY29kZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcIm1lc3NhZ2VcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICAgIH1cXG4gICAgfSxcXG4gIFxcbiAgICAvLyBSZWNlaXZlIGEgY29ubmVjdGlvbi5cXG4gICAgLy8gVGhlIHNvY2tldCBwYXJhbWV0ZXIgbWF5IGJlIHVzZWQgdG8gY29uc3RydWN0IGEgbmV3IHNvY2tldC5cXG4gICAgLy8gSG9zdCBhbmQgcG9ydCBpbmZvcm1hdGlvbiBwcm92aWRlIGluZm9ybWF0aW9uIGFib3V0IHRoZSByZW1vdGUgcGVlci5cXG4gICAgXFxcIm9uQ29ubmVjdGlvblxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IHtcXG4gICAgICBcXFwic29ja2V0XFxcIjogXFxcIm51bWJlclxcXCIsXFxuICAgICAgXFxcImhvc3RcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICBcXFwicG9ydFxcXCI6IFxcXCJudW1iZXJcXFwiXFxuICAgIH19XFxuICB9XFxufVxcblwiO1xuc2VsZi5jb3JlVWRwc29ja2V0ID0gXCIvLyBBIFVEUCBzb2NrZXQuXFxuLy8gR2VuZXJhbGx5LCB0byB1c2UgeW91IGp1c3QgbmVlZCB0byBjYWxsIGJpbmQoKSBhdCB3aGljaCBwb2ludCBvbkRhdGFcXG4vLyBldmVudHMgd2lsbCBzdGFydCB0byBmbG93LiBOb3RlIHRoYXQgYmluZCgpIHNob3VsZCBvbmx5IGJlIGNhbGxlZFxcbi8vIG9uY2UgcGVyIGluc3RhbmNlLlxcbntcXG4gIFxcXCJuYW1lXFxcIjogXFxcImNvcmUudWRwc29ja2V0XFxcIixcXG4gIFxcXCJhcGlcXFwiOiB7XFxuICAgIC8qKiBcXG4gICAgICogZXJyb3IgY29kZXMgYW5kIGRlZmF1bHQgbWVzc2FnZXMgdGhhdCBtYXkgYmUgcmV0dXJuZWQgb24gZmFpbHVyZXMuXFxuICAgICAqL1xcbiAgICBcXFwiRVJSQ09ERVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJjb25zdGFudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IHtcXG4gICAgICAvKiogR0VORVJBTCAqKi9cXG4gICAgICBcXFwiU1VDQ0VTU1xcXCI6IFxcXCJTdWNjZXNzIVxcXCIsXFxuICAgICAgLy8gVW5rbm93blxcbiAgICAgIFxcXCJVTktOT1dOXFxcIjogXFxcIlVua25vd24gZXJyb3JcXFwiLFxcbiAgICAgIFxcbiAgICAgIC8vIFNvY2tldCBpcyBhbHJlYWR5IGJvdW5kXFxuICAgICAgXFxcIkFMUkVBRFlfQk9VTkRcXFwiOiBcXFwiU29ja2V0IGFscmVhZHkgYm91bmRcXFwiLFxcbiAgICAgIC8vIEludmFsaWQgQXJndW1lbnQsIGNsaWVudCBlcnJvclxcbiAgICAgIFxcXCJJTlZBTElEX0FSR1VNRU5UXFxcIjogXFxcIkludmFsaWQgYXJndW1lbnRcXFwiLFxcbiAgICAgIC8vIFNvY2tldCByZXNldCBiZWNhdXNlIG9mIGNoYW5nZSBpbiBuZXR3b3JrIHN0YXRlLlxcbiAgICAgIFxcXCJORVRXT1JLX0NIQU5HRURcXFwiOiBcXFwiTmV0d29yayBjaGFuZ2VkXFxcIixcXG4gICAgICAvLyBGYWlsdXJlIHRvIHNlbmQgZGF0YVxcbiAgICAgIFxcXCJTTkVEX0ZBSUxFRFxcXCI6IFxcXCJTZW5kIGZhaWxlZFxcXCJcXG4gICAgfX0sXFxuICBcXG4gICAgLy8gQ3JlYXRlcyBhIHNvY2tldCwgYmluZHMgaXQgdG8gYW4gaW50ZXJmYWNlIGFuZCBwb3J0IGFuZCBsaXN0ZW5zIGZvclxcbiAgICAvLyBtZXNzYWdlcywgZGlzcGF0Y2hpbmcgZWFjaCBtZXNzYWdlIGFzIG9uIG9uRGF0YSBldmVudC5cXG4gICAgLy8gUmV0dXJucyBvbiBzdWNjZXNzLCBvciBmYWlscyB3aXRoIGFuIGVycm9yIG9uIGZhaWx1cmUuXFxuICAgIFxcXCJiaW5kXFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjogW1xcbiAgICAgICAgLy8gSW50ZXJmYWNlIChhZGRyZXNzKSBvbiB3aGljaCB0byBiaW5kLlxcbiAgICAgICAgXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICAvLyBQb3J0IG9uIHdoaWNoIHRvIGJpbmQuXFxuICAgICAgICBcXFwibnVtYmVyXFxcIlxcbiAgICAgIF0sXFxuICAgICAgXFxcInJldFxcXCI6IFtdLFxcbiAgICAgIFxcXCJlcnJcXFwiOiB7XFxuICAgICAgICBcXFwiZXJyY29kZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcIm1lc3NhZ2VcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICAgIH1cXG4gICAgfSxcXG4gIFxcbiAgICAvLyBSZXRyaWV2ZXMgdGhlIHN0YXRlIG9mIHRoZSBzb2NrZXQuXFxuICAgIC8vIFJldHVybnMgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxcbiAgICAvLyAgLSBsb2NhbEFkZHJlc3M6IHRoZSBzb2NrZXQncyBsb2NhbCBhZGRyZXNzLCBpZiBib3VuZFxcbiAgICAvLyAgLSBsb2NhbFBvcnQ6IHRoZSBzb2NrZXQncyBsb2NhbCBwb3J0LCBpZiBib3VuZFxcbiAgICBcXFwiZ2V0SW5mb1xcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXSwgXFxcInJldFxcXCI6IHtcXG4gICAgICBcXFwibG9jYWxBZGRyZXNzXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgXFxcImxvY2FsUG9ydFxcXCI6IFxcXCJudW1iZXJcXFwiXFxuICAgIH19LFxcbiAgXFxuICAgIC8vIFNlbmRzIGRhdGEgdG8gYSBzZXJ2ZXIuXFxuICAgIC8vIFRoZSBzb2NrZXQgbXVzdCBiZSBib3VuZC5cXG4gICAgLy8gUmV0dXJucyBhbiBpbnRlZ2VyIGluZGljYXRpbmcgdGhlIG51bWJlciBvZiBieXRlcyB3cml0dGVuLCB3aXRoIG5vXFxuICAgIC8vIGd1YXJhbnRlZSB0aGF0IHRoZSByZW1vdGUgc2lkZSByZWNlaXZlZCB0aGUgZGF0YS5cXG4gICAgXFxcInNlbmRUb1xcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLFxcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IFtcXG4gICAgICAgIC8vIERhdGEgdG8gc2VuZC5cXG4gICAgICAgIFxcXCJidWZmZXJcXFwiLFxcbiAgICAgICAgLy8gRGVzdGluYXRpb24gYWRkcmVzcy5cXG4gICAgICAgIFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgLy8gRGVzdGluYXRpb24gcG9ydC5cXG4gICAgICAgIFxcXCJudW1iZXJcXFwiXFxuICAgICAgXSxcXG4gICAgICBcXFwicmV0XFxcIjogXFxcIm51bWJlclxcXCIsXFxuICAgICAgXFxcImVyclxcXCI6IHtcXG4gICAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgICAgfVxcbiAgICB9LFxcbiAgXFxuICAgIC8vIFJlbGVhc2VzIGFsbCByZXNvdXJjZXMgYXNzb2NpYXRlZCB3aXRoIHRoaXMgc29ja2V0LlxcbiAgICAvLyBOby1vcCBpZiB0aGUgc29ja2V0IGlzIG5vdCBib3VuZC5cXG4gICAgXFxcImRlc3Ryb3lcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW119LFxcbiAgXFxuICAgIC8vIENhbGxlZCBvbmNlIGZvciBlYWNoIG1lc3NhZ2UgcmVjZWl2ZWQgb24gdGhpcyBzb2NrZXQsIG9uY2UgaXQnc1xcbiAgICAvLyBiZWVuIHN1Y2Nlc3NmdWxseSBib3VuZC5cXG4gICAgXFxcIm9uRGF0YVxcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjoge1xcbiAgICAgICAgLy8gWmVybyBtZWFucyBzdWNjZXNzLCBhbnkgb3RoZXIgXFxcInZhbHVlXFxcIiBpcyBpbXBsZW1lbnRhdGlvbi1kZXBlbmRlbnQuXFxuICAgICAgICBcXFwicmVzdWx0Q29kZVxcXCI6IFxcXCJudW1iZXJcXFwiLFxcbiAgICAgICAgLy8gQWRkcmVzcyBmcm9tIHdoaWNoIGRhdGEgd2FzIHJlY2VpdmVkLlxcbiAgICAgICAgXFxcImFkZHJlc3NcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIC8vIFBvcnQgZnJvbSB3aGljaCBkYXRhIHdhcyByZWNlaXZlZC5cXG4gICAgICAgIFxcXCJwb3J0XFxcIjogXFxcIm51bWJlclxcXCIsXFxuICAgICAgICAvLyBEYXRhIHJlY2VpdmVkLlxcbiAgICAgICAgXFxcImRhdGFcXFwiOiBcXFwiYnVmZmVyXFxcIlxcbiAgICAgIH1cXG4gICAgfVxcbiAgfVxcbn1cXG5cIjtcbnNlbGYuY29yZVZpZXcgPSBcIntcXG4gIFxcXCJuYW1lXFxcIjogXFxcImNvcmUudmlld1xcXCIsXFxuICBcXFwiYXBpXFxcIjoge1xcbiAgICBcXFwic2hvd1xcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCJdfSxcXG4gICAgXFxcImlzU2VjdXJlXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFtdLCBcXFwicmV0XFxcIjogXFxcImJvb2xlYW5cXFwiIH0sXFxuICAgIFxcXCJjbG9zZVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXX0sXFxuICAgIFxcXCJwb3N0TWVzc2FnZVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLCBcXFwidmFsdWVcXFwiOiBbXFxcIm9iamVjdFxcXCJdfSxcXG4gIFxcbiAgICBcXFwibWVzc2FnZVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IFxcXCJvYmplY3RcXFwifSxcXG4gICAgXFxcIm9uQ2xvc2VcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwiZXZlbnRcXFwiLCBcXFwidmFsdWVcXFwiOiBbXX1cXG4gIH1cXG59XFxuXCI7XG5zZWxmLmNvcmVXZWJzb2NrZXQgPSBcIntcXG4gIFxcXCJuYW1lXFxcIjogXFxcImNvcmUud2Vic29ja2V0XFxcIixcXG4gIFxcXCJhcGlcXFwiOiB7XFxuICAgIC8vIENvbnN0cnVjdHMgbmV3IHdlYnNvY2tldC4gRXJyb3JzIGluIGNvbnN0cnVjdGlvbiBhcmUgcGFzc2VkIG9uXFxuICAgIC8vIHRocm91Z2ggdGhlIG9uRXJyb3IgZXZlbnQuXFxuICAgIFxcXCJjb25zdHJ1Y3RvclxcXCI6IHtcXFwidmFsdWVcXFwiOiBbXFxuICAgICAgLy8gVVJMIHRvIGNvbm5lY3QgdGhyb3VnaFxcbiAgICAgIFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgIC8vIFByb3RvY29sc1xcbiAgICAgIFtcXFwiYXJyYXlcXFwiLCBcXFwic3RyaW5nXFxcIl1cXG4gICAgXX0sXFxuICAgIC8vIFNlbmQgdGhlIGRhdGEgdG8gdGhlIG90aGVyIHNpZGUgb2YgdGhpcyBjb25uZWN0aW9uLiBPbmx5IG9uZSBvZlxcbiAgICAvLyB0aGUgZW50cmllcyBpbiB0aGUgZGljdGlvbmFyeSB0aGF0IGlzIHBhc3NlZCB3aWxsIGJlIHNlbnQuXFxuICAgIFxcXCJzZW5kXFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjogW3tcXG4gICAgICAgIFxcXCJ0ZXh0XFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwiYmluYXJ5XFxcIjogXFxcImJsb2JcXFwiLFxcbiAgICAgICAgXFxcImJ1ZmZlclxcXCI6IFxcXCJidWZmZXJcXFwiXFxuICAgICAgfV0sXFxuICAgICAgXFxcImVyclxcXCI6IHtcXG4gICAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgICAgfVxcbiAgICB9LFxcbiAgICBcXFwiZ2V0UmVhZHlTdGF0ZVxcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLFxcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IFtdLFxcbiAgICAgIC8vIDAgLT4gQ09OTkVDVElOR1xcbiAgICAgIC8vIDEgLT4gT1BFTlxcbiAgICAgIC8vIDIgLT4gQ0xPU0lOR1xcbiAgICAgIC8vIDMgLT4gQ0xPU0VEXFxuICAgICAgXFxcInJldFxcXCI6IFxcXCJudW1iZXJcXFwiXFxuICAgIH0sXFxuICAgIFxcXCJnZXRCdWZmZXJlZEFtb3VudFxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLFxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiXSxcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIFxcXCJyZXRcXFwiOiBcXFwibnVtYmVyXFxcIn0sXFxuICAgIFxcXCJjbG9zZVxcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLFxcbiAgICAgIC8vIFRoZSBmaXJzdCBhcmd1bWVudCBpcyBhIHN0YXR1cyBjb2RlIGZyb21cXG4gICAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQ2xvc2VFdmVudFxcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IFtcXFwibnVtYmVyXFxcIiwgXFxcInN0cmluZ1xcXCJdLFxcbiAgICAgIFxcXCJlcnJcXFwiOiB7XFxuICAgICAgICBcXFwiZXJyY29kZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcIm1lc3NhZ2VcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICAgIH1cXG4gICAgfSxcXG4gICAgXFxcIm9uTWVzc2FnZVxcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsXFxuICAgICAgLy8gVGhlIGRhdGEgd2lsbCBiZSBzdG9yZWQgaW4gb25lIG9mIHRoZSBrZXlzLFxcbiAgICAgIC8vIGNvcnJlc3BvbmRpbmcgd2l0aCB0aGUgXFxcInR5cGVcXFwiIHJlY2VpdmVkXFxuICAgICAgXFxcInZhbHVlXFxcIjoge1xcbiAgICAgICAgXFxcInRleHRcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJiaW5hcnlcXFwiOiBcXFwiYmxvYlxcXCIsXFxuICAgICAgICBcXFwiYnVmZmVyXFxcIjogXFxcImJ1ZmZlclxcXCJcXG4gICAgICB9XFxuICAgIH0sXFxuICAgIFxcXCJvbk9wZW5cXFwiOiB7XFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwiZXZlbnRcXFwiLFxcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IFtdXFxuICAgIH0sXFxuICAgIFxcXCJvbkVycm9yXFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcImV2ZW50XFxcIixcXG4gICAgICBcXFwidmFsdWVcXFwiOiB7XFxuICAgICAgICBcXFwiZXJyY29kZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcIm1lc3NhZ2VcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICAgIH1cXG4gICAgfSxcXG4gICAgXFxcIm9uQ2xvc2VcXFwiOiB7XFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwiZXZlbnRcXFwiLFxcbiAgICAgIC8vIFxcXCJ2YWx1ZVxcXCJzIGdpdmVuIGJ5IFdlYlNvY2tldHMgc3BlYzpcXG4gICAgICAvLyBodHRwOi8vd3d3LnczLm9yZy9UUi93ZWJzb2NrZXRzLyNjbG9zZWV2ZW50XFxuICAgICAgXFxcInZhbHVlXFxcIjoge1xcbiAgICAgICAgXFxcImNvZGVcXFwiOiBcXFwibnVtYmVyXFxcIixcXG4gICAgICAgIFxcXCJyZWFzb25cXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJ3YXNDbGVhblxcXCI6IFxcXCJib29sZWFuXFxcIlxcbiAgICAgIH1cXG4gICAgfVxcbiAgfVxcbn1cXG5cIjtcbnNlbGYuc29jaWFsID0gXCIvKipcXG4gKiBTT0NJQUwgQVBJXFxuICpcXG4gKiBBUEkgZm9yIGNvbm5lY3RpbmcgdG8gc29jaWFsIG5ldHdvcmtzIGFuZCBtZXNzYWdpbmcgb2YgdXNlcnMuXFxuICogQW4gaW5zdGFuY2Ugb2YgYSBzb2NpYWwgcHJvdmlkZXIgZW5jYXBzdWxhdGVzIGEgc2luZ2xlIHVzZXIgbG9nZ2luZyBpbnRvXFxuICogYSBzaW5nbGUgbmV0d29yay5cXG4gKlxcbiAqIFRoaXMgQVBJIGRpc3Rpbmd1aXNoZXMgYmV0d2VlbiBhIFxcXCJ1c2VyXFxcIiBhbmQgYSBcXFwiY2xpZW50XFxcIi4gQSBjbGllbnQgaXMgYVxcbiAqIHVzZXIncyBwb2ludCBvZiBhY2Nlc3MgdG8gdGhlIHNvY2lhbCBwcm92aWRlci4gVGh1cywgYSB1c2VyIHRoYXQgaGFzXFxuICogbXVsdGlwbGUgY29ubmVjdGlvbnMgdG8gYSBwcm92aWRlciAoZS5nLiwgb24gbXVsdGlwbGUgZGV2aWNlcyBvciBpbiBtdWx0aXBsZVxcbiAqIGJyb3dzZXJzKSBoYXMgbXVsdGlwbGUgY2xpZW50cy5cXG4gKlxcbiAqIFRoZSBzZW1hbnRpY3Mgb2Ygc29tZSBwcm9wZXJ0aWVzIGFyZSBkZWZpbmVkIGJ5IHRoZSBzcGVjaWZpYyBwcm92aWRlciwgZS5nLjpcXG4gKiAtIEVkZ2VzIGluIHRoZSBzb2NpYWwgbmV0d29yayAod2hvIGlzIG9uIHlvdXIgcm9zdGVyKVxcbiAqIC0gUmVsaWFibGUgbWVzc2FnZSBwYXNzaW5nIChvciB1bnJlbGlhYmxlKVxcbiAqIC0gSW4tb3JkZXIgbWVzc2FnZSBkZWxpdmVyeSAob3Igb3V0IG9mIG9yZGVyKVxcbiAqIC0gUGVyc2lzdGVudCBjbGllbnRJZCAtIFdoZXRoZXIgeW91ciBjbGllbnRJZCBjaGFuZ2VzIGJldHdlZW4gbG9naW5zIHdoZW5cXG4gKiAgICBjb25uZWN0aW5nIGZyb20gdGhlIHNhbWUgZGV2aWNlXFxuICpcXG4gKiBBIDxjbGllbnRfc3RhdGU+LCB1c2VkIGluIHRoaXMgQVBJLCBpcyBkZWZpbmVkIGFzOlxcbiAqIC0gSW5mb3JtYXRpb24gcmVsYXRlZCB0byBhIHNwZWNpZmljIGNsaWVudCBvZiBhIHVzZXJcXG4gKiAtIFVzZSBjYXNlczogXFxuICogICAtIFJldHVybmVkIG9uIGNoYW5nZXMgZm9yIGZyaWVuZHMgb3IgbXkgaW5zdGFuY2UgaW4gJ29uQ2xpZW50U3RhdGUnXFxuICogICAtIFJldHVybmVkIGluIGEgZ2xvYmFsIGxpc3QgZnJvbSAnZ2V0Q2xpZW50cydcXG4gKiB7XFxuICogICAvLyBNYW5kYXRvcnlcXG4gKiAgICd1c2VySWQnOiAnc3RyaW5nJywgICAgICAvLyBVbmlxdWUgSUQgb2YgdXNlciAoZS5nLiBhbGljZUBnbWFpbC5jb20pXFxuICogICAnY2xpZW50SWQnOiAnc3RyaW5nJywgICAgLy8gVW5pcXVlIElEIG9mIGNsaWVudFxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIChlLmcuIGFsaWNlQGdtYWlsLmNvbS9BbmRyb2lkLTIzbmFkc3YzMmYpXFxuICogICAnc3RhdHVzJzogJ3N0cmluZycsICAgICAgLy8gU3RhdHVzIG9mIHRoZSBjbGllbnQuICdTVEFUVVMnIG1lbWJlci5cXG4gKiAgICdsYXN0VXBkYXRlZCc6ICdudW1iZXInLCAvLyBUaW1lc3RhbXAgb2YgdGhlIGxhc3QgdGltZSBjbGllbnRfc3RhdGUgd2FzIHVwZGF0ZWRcXG4gKiAgICdsYXN0U2Vlbic6ICdudW1iZXInICAgICAvLyBUaW1lc3RhbXAgb2YgdGhlIGxhc3Qgc2VlbiB0aW1lIG9mIHRoaXMgZGV2aWNlLlxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vdGU6ICdsYXN0U2VlbicgRE9FUyBOT1QgdHJpZ2dlciBhbiAnb25DbGllbnRTdGF0ZScgZXZlbnRcXG4gKiB9XFxuICogXFxuICogQSA8dXNlcl9wcm9maWxlPiwgdXNlZCBpbiB0aGlzIEFQSSwgaXMgZGVmaW5lZCBhczpcXG4gKiAtIEluZm9ybWF0aW9uIHJlbGF0ZWQgdG8gYSBzcGVjaWZpYyB1c2VyIChwcm9maWxlIGluZm9ybWF0aW9uKVxcbiAqIC0gVXNlIGNhc2VzOlxcbiAqICAgLSBSZXR1cm5lZCBvbiBjaGFuZ2VzIGZvciBmcmllbmRzIG9yIG15c2VsZiBpbiAnb25Vc2VyUHJvZmlsZSdcXG4gKiAgIC0gUmV0dXJuZWQgaW4gYSBnbG9iYWwgbGlzdCBmcm9tICdnZXRVc2VycydcXG4gKiB7XFxuICogICAvLyBNYW5kYXRvcnlcXG4gKiAgIFxcXCJ1c2VySWRcXFwiOiBcXFwic3RyaW5nXFxcIiwgICAgLy8gVW5pcXVlIElEIG9mIHVzZXIgKGUuZy4gYWxpY2VAZ21haWwuY29tKVxcbiAqICAgXFxcImxhc3RVcGRhdGVkXFxcIjogXFxcIm51bWJlclxcXCIgIC8vIFRpbWVzdGFtcCBvZiBsYXN0IGNoYW5nZSB0byB0aGUgcHJvZmlsZVxcbiAqICAgLy8gT3B0aW9uYWxcXG4gKiAgIFxcXCJuYW1lXFxcIjogXFxcInN0cmluZ1xcXCIsICAgICAgLy8gTmFtZSAoZS5nLiBBbGljZSlcXG4gKiAgIFxcXCJ1cmxcXFwiOiBcXFwic3RyaW5nXFxcIiwgICAgICAgLy8gSG9tZXBhZ2UgVVJMXFxuICogICBcXFwiaW1hZ2VEYXRhXFxcIjogXFxcInN0cmluZ1xcXCIsIC8vIFVSSSBvZiBhIHByb2ZpbGUgaW1hZ2UuXFxuICogfVxcbiAqKi9cXG57XFxuICBcXFwibmFtZVxcXCI6IFxcXCJzb2NpYWxcXFwiLFxcbiAgXFxcImFwaVxcXCI6IHtcXG4gICAgLyoqIFxcbiAgICAgKiBlcnJvciBjb2RlcyBhbmQgZGVmYXVsdCBtZXNzYWdlcyB0aGF0IG1heSBiZSByZXR1cm5lZCBvbiBmYWlsdXJlcy5cXG4gICAgICovXFxuICAgIFxcXCJFUlJDT0RFXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcImNvbnN0YW50XFxcIiwgXFxcInZhbHVlXFxcIjoge1xcbiAgICAgIC8qKiBHRU5FUkFMICoqL1xcbiAgICAgIFxcXCJTVUNDRVNTXFxcIjogXFxcIlN1Y2Nlc3MhXFxcIixcXG4gICAgICAvLyBVbmtub3duXFxuICAgICAgXFxcIlVOS05PV05cXFwiOiBcXFwiVW5rbm93biBlcnJvclxcXCIsXFxuICAgICAgLy8gVXNlciBpcyBjdXJyZW50bHkgb2ZmbGluZVxcbiAgICAgIFxcXCJPRkZMSU5FXFxcIjogXFxcIlVzZXIgaXMgY3VycmVudGx5IG9mZmxpbmVcXFwiLFxcbiAgICAgIC8vIEltcHJvcGVyIHBhcmFtZXRlcnNcXG4gICAgICBcXFwiTUFMRk9STUVEUEFSQU1FVEVSU1xcXCI6IFxcXCJQYXJhbWV0ZXJzIGFyZSBtYWxmb3JtZWRcXFwiLFxcbiAgXFxuICAgICAgLyoqIExPR0lOICoqL1xcbiAgICAgIC8vIEVycm9yIGF1dGhlbnRpY2F0aW5nIHRvIHRoZSBzZXJ2ZXIgKGUuZy4gaW52YWxpZCBjcmVkZW50aWFscylcXG4gICAgICBcXFwiTE9HSU5fQkFEQ1JFREVOVElBTFNcXFwiOiBcXFwiRXJyb3IgYXV0aGVudGljYXRpbmcgd2l0aCBzZXJ2ZXJcXFwiLFxcbiAgICAgIC8vIEVycm9yIHdpdGggY29ubmVjdGluZyB0byB0aGUgc2VydmVyXFxuICAgICAgXFxcIkxPR0lOX0ZBSUxFRENPTk5FQ1RJT05cXFwiOiBcXFwiRXJyb3IgY29ubmVjdGluZyB0byBzZXJ2ZXJcXFwiLFxcbiAgICAgIC8vIFVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW5cXG4gICAgICBcXFwiTE9HSU5fQUxSRUFEWU9OTElORVxcXCI6IFxcXCJVc2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluXFxcIixcXG4gICAgICAvLyBPQXV0aCBFcnJvclxcbiAgICAgIFxcXCJMT0dJTl9PQVVUSEVSUk9SXFxcIjogXFxcIk9BdXRoIEVycm9yXFxcIixcXG4gIFxcbiAgICAgIC8qKiBTRU5ETUVTU0FHRSAqKi9cXG4gICAgICAvLyBNZXNzYWdlIHNlbnQgdG8gaW52YWxpZCBkZXN0aW5hdGlvbiAoZS5nLiBub3QgaW4gdXNlcidzIHJvc3RlcilcXG4gICAgICBcXFwiU0VORF9JTlZBTElEREVTVElOQVRJT05cXFwiOiBcXFwiTWVzc2FnZSBzZW50IHRvIGFuIGludmFsaWQgZGVzdGluYXRpb25cXFwiXFxuICAgIH19LFxcbiAgICBcXG4gICAgLyoqXFxuICAgICAqIExpc3Qgb2YgcG9zc2libGUgc3RhdHVzZXMgZm9yIDxjbGllbnRfc3RhdGU+LnN0YXR1c1xcbiAgICAgKiovXFxuICAgIFxcXCJTVEFUVVNcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwiY29uc3RhbnRcXFwiLCBcXFwidmFsdWVcXFwiOiB7XFxuICAgICAgLy8gTm90IGxvZ2dlZCBpblxcbiAgICAgIFxcXCJPRkZMSU5FXFxcIjogXFxcIk9GRkxJTkVcXFwiLFxcbiAgICAgIC8vIFRoaXMgY2xpZW50IHJ1bnMgdGhlIHNhbWUgZnJlZWRvbS5qcyBhcHAgYXMgeW91IGFuZCBpcyBvbmxpbmVcXG4gICAgICBcXFwiT05MSU5FXFxcIjogXFxcIk9OTElORVxcXCIsXFxuICAgICAgLy8gVGhpcyBjbGllbnQgaXMgb25saW5lLCBidXQgZG9lcyBub3QgcnVuIHRoZSBzYW1lIGFwcCAoY2hhdCBjbGllbnQpXFxuICAgICAgLy8gKGkuZS4gY2FuIGJlIHVzZWZ1bCB0byBpbnZpdGUgb3RoZXJzIHRvIHlvdXIgZnJlZWRvbS5qcyBhcHApXFxuICAgICAgXFxcIk9OTElORV9XSVRIX09USEVSX0FQUFxcXCI6IFxcXCJPTkxJTkVfV0lUSF9PVEhFUl9BUFBcXFwiXFxuICAgIH19LFxcbiAgXFxuICAgIC8qKlxcbiAgICAgKiBMb2cgaW50byB0aGUgbmV0d29yayAoU2VlIGJlbG93IGZvciBwYXJhbWV0ZXJzKVxcbiAgICAgKiBlLmcuIHNvY2lhbC5sb2dpbihPYmplY3Qgb3B0aW9ucylcXG4gICAgICpcXG4gICAgICogQG1ldGhvZCBsb2dpblxcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gbG9naW5PcHRpb25zIC0gU2VlIGJlbG93XFxuICAgICAqIEByZXR1cm4ge09iamVjdH0gPGNsaWVudF9zdGF0ZT5cXG4gICAgICoqL1xcbiAgICBcXFwibG9naW5cXFwiOiB7XFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIixcXG4gICAgICBcXFwidmFsdWVcXFwiOiBbe1xcbiAgICAgICAgLy8gT3B0aW9uYWxcXG4gICAgICAgIFxcXCJhZ2VudFxcXCI6IFxcXCJzdHJpbmdcXFwiLCAgICAgICAgIC8vIE5hbWUgb2YgdGhlIGFwcGxpY2F0aW9uXFxuICAgICAgICBcXFwidmVyc2lvblxcXCI6IFxcXCJzdHJpbmdcXFwiLCAgICAgICAvLyBWZXJzaW9uIG9mIGFwcGxpY2F0aW9uXFxuICAgICAgICBcXFwidXJsXFxcIjogXFxcInN0cmluZ1xcXCIsICAgICAgICAgICAvLyBVUkwgb2YgYXBwbGljYXRpb25cXG4gICAgICAgIFxcXCJpbnRlcmFjdGl2ZVxcXCI6IFxcXCJib29sZWFuXFxcIiwgIC8vIEFsbG93IHVzZXIgaW50ZXJhY3Rpb24gZnJvbSBwcm92aWRlci5cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIG5vdCBzZXQsIGludGVycHJldGVkIGFzIHRydWUuXFxuICAgICAgICBcXFwicmVtZW1iZXJMb2dpblxcXCI6IFxcXCJib29sZWFuXFxcIiAvLyBDYWNoZSBsb2dpbiBjcmVkZW50aWFscy4gSWYgbm90IHNldCxcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGludGVycHJldGVkIGFzIHRydWUuXFxuICAgICAgfV0sXFxuICAgICAgXFxcInJldFxcXCI6IHsgICAgICAgICAgICAgICAgICAgICAgIC8vIDxjbGllbnRfc3RhdGU+LCBkZWZpbmVkIGFib3ZlLlxcbiAgICAgICAgXFxcInVzZXJJZFxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcImNsaWVudElkXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwic3RhdHVzXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwibGFzdFVwZGF0ZWRcXFwiOiBcXFwibnVtYmVyXFxcIixcXG4gICAgICAgIFxcXCJsYXN0U2VlblxcXCI6IFxcXCJudW1iZXJcXFwiXFxuICAgICAgfSxcXG4gICAgICBcXFwiZXJyXFxcIjoge1xcbiAgICAgICAgXFxcImVycmNvZGVcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJtZXNzYWdlXFxcIjogXFxcInN0cmluZ1xcXCJcXG4gICAgICB9XFxuICAgIH0sXFxuICBcXG4gICAgLyoqXFxuICAgICAqIENsZWFycyBjYWNoZWQgY3JlZGVudGlhbHMgb2YgdGhlIHByb3ZpZGVyLlxcbiAgICAgKlxcbiAgICAgKiBAbWV0aG9kIGNsZWFyQ2FjaGVkQ3JlZGVudGlhbHNcXG4gICAgICogQHJldHVybiBub3RoaW5nXFxuICAgICAqKi9cXG4gICAgXFxcImNsZWFyQ2FjaGVkQ3JlZGVudGlhbHNcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIiwgXFxcInZhbHVlXFxcIjogW119LFxcbiAgXFxuICAgIC8qKlxcbiAgICAgKiBHZXQgPGNsaWVudF9zdGF0ZT5zIHRoYXQgaGF2ZSBiZWVuIG9ic2VydmVkLlxcbiAgICAgKiBUaGUgcHJvdmlkZXIgaW1wbGVtZW50YXRpb24gbWF5IGFjdCBhcyBhIGNsaWVudCwgaW4gd2hpY2ggY2FzZSBpdHNcXG4gICAgICogPGNsaWVudF9zdGF0ZT4gd2lsbCBiZSBpbiB0aGlzIGxpc3QuXFxuICAgICAqIGdldENsaWVudHMgbWF5IG5vdCByZXByZXNlbnQgYW4gZW50aXJlIHJvc3Rlciwgc2luY2UgaXQgbWF5IG5vdCBiZVxcbiAgICAgKiBlbnVtZXJhYmxlLlxcbiAgICAgKiBcXG4gICAgICogQG1ldGhvZCBnZXRDbGllbnRzXFxuICAgICAqIEByZXR1cm4ge09iamVjdH0geyBcXG4gICAgICogICAgXFxcImNsaWVudElkMVxcXCI6IDxjbGllbnRfc3RhdGU+LFxcbiAgICAgKiAgICBcXFwiY2xpZW50SWQyXFxcIjogPGNsaWVudF9zdGF0ZT4sXFxuICAgICAqICAgICAuLi5cXG4gICAgICogfSBMaXN0IG9mIDxjbGllbnRfc3RhdGU+cyBpbmRleGVkIGJ5IGNsaWVudElkXFxuICAgICAqICAgT24gZmFpbHVyZSwgcmVqZWN0cyB3aXRoIGFuIGVycm9yIGNvZGUuXFxuICAgICAqKi9cXG4gICAgXFxcImdldENsaWVudHNcXFwiOiB7XFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIixcXG4gICAgICBcXFwidmFsdWVcXFwiOiBbXSxcXG4gICAgICBcXFwicmV0XFxcIjogXFxcIm9iamVjdFxcXCIsXFxuICAgICAgXFxcImVyclxcXCI6IHtcXG4gICAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxuICAgICAgfVxcbiAgICB9LFxcbiAgXFxuICAgIC8qKlxcbiAgICAgKiBHZXQgPHVzZXJfcHJvZmlsZT5zIHRoYXQgaGF2ZSBiZWVuIG9ic2VydmVkLlxcbiAgICAgKiBUaGUgcHJvdmlkZXIgaW1wbGVtZW50YXRpb24gbWF5IGFjdCBhcyBhIGNsaWVudCwgaW4gd2hpY2ggY2FzZSBpdHNcXG4gICAgICogPHVzZXJfcHJvZmlsZT4gd2lsbCBiZSBpbiB0aGlzIGxpc3QuXFxuICAgICAqIGdldFVzZXJzIG1heSBub3QgcmVwcmVzZW50IGFuIGVudGlyZSByb3N0ZXIsIHNpbmNlIGl0IG1heSBub3QgYmVcXG4gICAgICogZW51bWVyYWJsZS5cXG4gICAgICpcXG4gICAgICogQG1ldGhvZCBnZXRVc2Vyc1xcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IHsgXFxuICAgICAqICAgIFxcXCJ1c2VySWQxXFxcIjogPHVzZXJfcHJvZmlsZT4sXFxuICAgICAqICAgIFxcXCJ1c2VySWQyXFxcIjogPHVzZXJfcHJvZmlsZT4sXFxuICAgICAqICAgICAuLi5cXG4gICAgICogfSBMaXN0IG9mIDx1c2VyX3Byb2ZpbGU+cyBpbmRleGVkIGJ5IHVzZXJJZFxcbiAgICAgKiAgIE9uIGZhaWx1cmUsIHJlamVjdHMgd2l0aCBhbiBlcnJvciBjb2RlLlxcbiAgICAgKiovXFxuICAgIFxcXCJnZXRVc2Vyc1xcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLFxcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IFtdLFxcbiAgICAgIFxcXCJyZXRcXFwiOiBcXFwib2JqZWN0XFxcIixcXG4gICAgICBcXFwiZXJyXFxcIjoge1xcbiAgICAgICAgXFxcImVycmNvZGVcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJtZXNzYWdlXFxcIjogXFxcInN0cmluZ1xcXCJcXG4gICAgICB9XFxuICAgIH0sXFxuICBcXG4gICAgLyoqIFxcbiAgICAgKiBTZW5kIGEgbWVzc2FnZS5cXG4gICAgICogRGVzdGluYXRpb24gbWF5IGJlIGEgdXNlcklkIG9yIGEgY2xpZW50SWQuIElmIGl0IGlzIGEgdXNlcklkLCBhbGwgY2xpZW50c1xcbiAgICAgKiBmb3IgdGhhdCB1c2VyIHNob3VsZCByZWNlaXZlIHRoZSBtZXNzYWdlLlxcbiAgICAgKiBcXG4gICAgICogQG1ldGhvZCBzZW5kTWVzc2FnZVxcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZGVzdGluYXRpb25faWQgVGhlIHVzZXJJZCBvciBjbGllbnRJZCB0byBzZW5kIHRvXFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIHNlbmQuXFxuICAgICAqIEByZXR1cm4gbm90aGluZ1xcbiAgICAgKiAgT24gZmFpbHVyZSwgcmVqZWN0cyB3aXRoIGFuIGVycm9yIGNvZGVcXG4gICAgICoqL1xcbiAgICBcXFwic2VuZE1lc3NhZ2VcXFwiOiB7XFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIixcXG4gICAgICBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCIsIFxcXCJzdHJpbmdcXFwiXSxcXG4gICAgICBcXFwiZXJyXFxcIjoge1xcbiAgICAgICAgXFxcImVycmNvZGVcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJtZXNzYWdlXFxcIjogXFxcInN0cmluZ1xcXCJcXG4gICAgICB9XFxuICAgIH0sXFxuICBcXG4gICAgLyoqXFxuICAgICAqIExvZyBvdXQgb2YgdGhlIG5ldHdvcmsuXFxuICAgICAqIFxcbiAgICAgKiBAbWV0aG9kIGxvZ291dFxcbiAgICAgKiBAcmV0dXJuIG5vdGhpbmdcXG4gICAgICogIE9uIGZhaWx1cmUsIHJlamVjdHMgd2l0aCBhbiBlcnJvciBjb2RlXFxuICAgICAqKi9cXG4gICAgXFxcImxvZ291dFxcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLFxcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IFtdLFxcbiAgICAgIFxcXCJlcnJcXFwiOiB7XFxuICAgICAgICBcXFwiZXJyY29kZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcIm1lc3NhZ2VcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICAgIH1cXG4gICAgfSxcXG4gIFxcbiAgICAvKipcXG4gICAgICogUmVjZWl2ZSBhbiBpbmNvbWluZyBtZXNzYWdlLlxcbiAgICAgKiovXFxuICAgIFxcXCJvbk1lc3NhZ2VcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwiZXZlbnRcXFwiLCBcXFwidmFsdWVcXFwiOiB7XFxuICAgICAgXFxcImZyb21cXFwiOiB7ICAgICAgICAgICAgICAgLy8gPGNsaWVudF9zdGF0ZT4sIGRlZmluZWQgYWJvdmUuXFxuICAgICAgICBcXFwidXNlcklkXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgICBcXFwiY2xpZW50SWRcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJzdGF0dXNcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJsYXN0VXBkYXRlZFxcXCI6IFxcXCJudW1iZXJcXFwiLFxcbiAgICAgICAgXFxcImxhc3RTZWVuXFxcIjogXFxcIm51bWJlclxcXCJcXG4gICAgICB9LFxcbiAgICAgIFxcXCJtZXNzYWdlXFxcIjogXFxcInN0cmluZ1xcXCIgICAgIC8vIG1lc3NhZ2UgY29udGVudHNcXG4gICAgfX0sXFxuICBcXG4gICAgLyoqXFxuICAgICAqIFJlY2VpdmUgYSBjaGFuZ2UgdG8gYSA8dXNlcl9wcm9maWxlPi5cXG4gICAgICoqL1xcbiAgICBcXFwib25Vc2VyUHJvZmlsZVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IHsgLy8gPHVzZXJfcHJvZmlsZT4sIGRlZmluZWQgYWJvdmUuXFxuICAgICAgXFxcInVzZXJJZFxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgIFxcXCJsYXN0VXBkYXRlZFxcXCI6IFxcXCJudW1iZXJcXFwiLFxcbiAgICAgIFxcXCJuYW1lXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgXFxcInVybFxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgIFxcXCJpbWFnZURhdGFcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICB9fSxcXG4gIFxcbiAgICAvKipcXG4gICAgICogUmVjZWl2ZSBhIGNoYW5nZSB0byBhIDxjbGllbnRfc3RhdGU+LlxcbiAgICAgKiovXFxuICAgIFxcXCJvbkNsaWVudFN0YXRlXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcImV2ZW50XFxcIiwgXFxcInZhbHVlXFxcIjogeyAvLyA8Y2xpZW50X3N0YXRlPiwgZGVmaW5lZCBhYm92ZS5cXG4gICAgICBcXFwidXNlcklkXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgXFxcImNsaWVudElkXFxcIjogXFxcInN0cmluZ1xcXCIsXFxuICAgICAgXFxcInN0YXR1c1xcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgIFxcXCJsYXN0VXBkYXRlZFxcXCI6IFxcXCJudW1iZXJcXFwiLFxcbiAgICAgIFxcXCJsYXN0U2VlblxcXCI6IFxcXCJudW1iZXJcXFwiXFxuICAgIH19XFxuICB9XFxufVxcblwiO1xuc2VsZi5zdG9yYWdlID0gXCIvKipcXHJcXG4gKiBTVE9SQUdFIEFQSVxcclxcbiAqXFxyXFxuICogQVBJIGZvciBQZXJzaXN0ZW50IFN0b3JhZ2VcXHJcXG4gKiBFeHBvc2VzIGEga2V5LXZhbHVlIGdldC9wdXQgaW50ZXJmYWNlXFxyXFxuICoqL1xcclxcbntcXHJcXG4gIFxcXCJuYW1lXFxcIjogXFxcInN0b3JhZ2VcXFwiLFxcclxcbiAgXFxcImFwaVxcXCI6IHtcXHJcXG4gICAgLyoqIFxcclxcbiAgICAgKiBMaXN0IG9mIHNjb3BlcyB0aGF0IGNhbiBwcmVmZXJyZWQgd2hlbiBhY2Nlc3Npbmcgc3RvcmFnZS5cXHJcXG4gICAgKiovXFxyXFxuICAgIFxcXCJzY29wZVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJjb25zdGFudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IHtcXHJcXG4gICAgICAvLyBTdG9yYWdlIHNob3VsZCBvbmx5IGxhc3Qgd2hpbGUgdGhlIGFwcCBpcyBhY3RpdmUuXFxyXFxuICAgICAgXFxcIlNFU1NJT05cXFwiOiAwLFxcclxcbiAgICAgIC8vIFN0b3JhZ2Ugc2hvdWxkIGJlIGxpbWl0ZWQgdG8gaG9zdCB0aGUgYXBwIGlzIGJvdW5kIHRvLlxcclxcbiAgICAgIFxcXCJERVZJQ0VfTE9DQUxcXFwiOiAxLFxcclxcbiAgICAgIC8vIFN0b3JhZ2Ugc2hvdWxkIGJlIHN5bmNocm9uaXplZCBiZXR3ZWVuIHVzZXIgZGV2aWNlcy5cXHJcXG4gICAgICBcXFwiVVNFUl9MT0NBTFxcXCI6IDIsXFxyXFxuICAgICAgLy8gU3RvcmFnZSBzaG91bGQgYmUgc3luY2hyb25pemVkIGFjcm9zcyB1c2Vycy5cXHJcXG4gICAgICBcXFwiU0hBUkVEXFxcIjogM1xcclxcbiAgICB9fSxcXHJcXG4gIFxcclxcbiAgICAvKiogXFxyXFxuICAgICAqIGVycm9yIGNvZGVzIGFuZCBkZWZhdWx0IG1lc3NhZ2VzIHRoYXQgbWF5IGJlIHJldHVybmVkIG9uIGZhaWx1cmVzLlxcclxcbiAgICAgKi9cXHJcXG4gICAgXFxcIkVSUkNPREVcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwiY29uc3RhbnRcXFwiLCBcXFwidmFsdWVcXFwiOiB7XFxyXFxuICAgICAgLyoqIEdFTkVSQUwgKiovXFxyXFxuICAgICAgXFxcIlNVQ0NFU1NcXFwiOiBcXFwiU3VjY2VzcyFcXFwiLFxcclxcbiAgICAgIC8vIFVua25vd25cXHJcXG4gICAgICBcXFwiVU5LTk9XTlxcXCI6IFxcXCJVbmtub3duIGVycm9yXFxcIixcXHJcXG4gICAgICAvLyBEYXRhYmFzZSBub3QgcmVhZHlcXHJcXG4gICAgICBcXFwiT0ZGTElORVxcXCI6IFxcXCJEYXRhYmFzZSBub3QgcmVhY2hhYmxlXFxcIixcXHJcXG4gICAgICAvLyBJbXByb3BlciBwYXJhbWV0ZXJzXFxyXFxuICAgICAgXFxcIk1BTEZPUk1FRFBBUkFNRVRFUlNcXFwiOiBcXFwiUGFyYW1ldGVycyBhcmUgbWFsZm9ybWVkXFxcIlxcclxcbiAgICB9fSxcXHJcXG4gIFxcclxcbiAgICAvKipcXHJcXG4gICAgICogQ3JlYXRlIGEgc3RvcmFnZSBwcm92aWRlci5cXHJcXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcXHJcXG4gICAgICogICAgc2NvcGUge3N0b3JhZ2Uuc2NvcGV9IFRoZSBwcmVmZXJyZWQgc3RvcmFnZSBzY29wZS5cXHJcXG4gICAgICogQGNvbnN0cnVjdG9yXFxyXFxuICAgICAqL1xcclxcbiAgICBcXFwiY29uc3RydWN0b3JcXFwiOiB7IFxcXCJ2YWx1ZVxcXCI6IFt7XFxyXFxuICAgICAgXFxcInNjb3BlXFxcIjogXFxcIm51bWJlclxcXCJcXHJcXG4gICAgfV19LFxcclxcbiAgXFxyXFxuICAgIC8qKlxcclxcbiAgICAgKiBGZXRjaCBhbiBhcnJheSBvZiBhbGwga2V5c1xcclxcbiAgICAgKiBlLmcuIHN0b3JhZ2Uua2V5cygpID0+IFtzdHJpbmddXFxyXFxuICAgICAqXFxyXFxuICAgICAqIEBtZXRob2Qga2V5c1xcclxcbiAgICAgKiBAcmV0dXJuIGFuIGFycmF5IHdpdGggYWxsIGtleXMgaW4gdGhlIHN0b3JlIFxcclxcbiAgICAgKiovXFxyXFxuICAgIFxcXCJrZXlzXFxcIjoge1xcclxcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxyXFxuICAgICAgXFxcInZhbHVlXFxcIjogW10sXFxyXFxuICAgICAgXFxcInJldFxcXCI6IFtcXFwiYXJyYXlcXFwiLCBcXFwic3RyaW5nXFxcIl0sXFxyXFxuICAgICAgXFxcImVyclxcXCI6IHtcXHJcXG4gICAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxyXFxuICAgICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxyXFxuICAgICAgfVxcclxcbiAgICB9LFxcclxcbiAgXFxyXFxuICAgIC8qKlxcclxcbiAgICAgKiBGZXRjaCBhIHZhbHVlIGZvciBhIGtleVxcclxcbiAgICAgKiBlLmcuIHN0b3JhZ2UuZ2V0KFN0cmluZyBrZXkpID0+IHN0cmluZ1xcclxcbiAgICAgKlxcclxcbiAgICAgKiBAbWV0aG9kIGdldFxcclxcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30ga2V5IC0ga2V5IHRvIGZldGNoXFxyXFxuICAgICAqIEByZXR1cm4ge1N0cmluZ30gUmV0dXJucyBhIHN0cmluZyB3aXRoIHRoZSB2YWx1ZSwgbnVsbCBpZiBkb2Vzbid0IGV4aXN0XFxyXFxuICAgICAqKi9cXHJcXG4gICAgXFxcImdldFxcXCI6IHtcXHJcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLFxcclxcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIl0sXFxyXFxuICAgICAgXFxcInJldFxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcclxcbiAgICAgIFxcXCJlcnJcXFwiOiB7XFxyXFxuICAgICAgICBcXFwiZXJyY29kZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcclxcbiAgICAgICAgXFxcIm1lc3NhZ2VcXFwiOiBcXFwic3RyaW5nXFxcIlxcclxcbiAgICAgIH1cXHJcXG4gICAgfSxcXHJcXG4gIFxcclxcbiAgICAvKipcXHJcXG4gICAgICogU2V0cyBhIHZhbHVlIHRvIGEga2V5XFxyXFxuICAgICAqIGUuZy4gc3RvcmFnZS5zZXQoU3RyaW5nIGtleSwgU3RyaW5nIHZhbHVlKVxcclxcbiAgICAgKlxcclxcbiAgICAgKiBAbWV0aG9kIHNldFxcclxcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30ga2V5IC0ga2V5IG9mIHZhbHVlIHRvIHNldFxcclxcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdmFsdWUgLSB2YWx1ZVxcclxcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IHByZXZpb3VzIHZhbHVlIG9mIGtleSBpZiB0aGVyZSB3YXMgb25lLlxcclxcbiAgICAgKiovXFxyXFxuICAgIFxcXCJzZXRcXFwiOiB7XFxyXFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwibWV0aG9kXFxcIixcXHJcXG4gICAgICBcXFwidmFsdWVcXFwiOiBbXFxcInN0cmluZ1xcXCIsIFxcXCJzdHJpbmdcXFwiXSxcXHJcXG4gICAgICBcXFwicmV0XFxcIjogXFxcInN0cmluZ1xcXCIsXFxyXFxuICAgICAgXFxcImVyclxcXCI6IHtcXHJcXG4gICAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxyXFxuICAgICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxyXFxuICAgICAgfVxcclxcbiAgICB9LFxcclxcbiAgICBcXHJcXG4gICAgLyoqXFxyXFxuICAgICAqIFJlbW92ZXMgYSBzaW5nbGUga2V5XFxyXFxuICAgICAqIGUuZy4gc3RvcmFnZS5yZW1vdmUoU3RyaW5nIGtleSlcXHJcXG4gICAgICpcXHJcXG4gICAgICogQG1ldGhvZCByZW1vdmVcXHJcXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGtleSAtIGtleSB0byByZW1vdmVcXHJcXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBwcmV2aW91cyB2YWx1ZSBvZiBrZXkgaWYgdGhlcmUgd2FzIG9uZS5cXHJcXG4gICAgICoqL1xcclxcbiAgICBcXFwicmVtb3ZlXFxcIjoge1xcclxcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxyXFxuICAgICAgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiXSxcXHJcXG4gICAgICBcXFwicmV0XFxcIjogXFxcInN0cmluZ1xcXCIsXFxyXFxuICAgICAgXFxcImVyclxcXCI6IHtcXHJcXG4gICAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxyXFxuICAgICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxyXFxuICAgICAgfVxcclxcbiAgICB9LFxcclxcbiAgICBcXHJcXG4gICAgLyoqXFxyXFxuICAgICAqIFJlbW92ZXMgYWxsIGRhdGEgZnJvbSBzdG9yYWdlXFxyXFxuICAgICAqIGUuZy4gc3RvcmFnZS5jbGVhcigpXFxyXFxuICAgICAqXFxyXFxuICAgICAqIEBtZXRob2QgY2xlYXJcXHJcXG4gICAgICogQHJldHVybiBub3RoaW5nXFxyXFxuICAgICAqKi9cXHJcXG4gICAgXFxcImNsZWFyXFxcIjoge1xcclxcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxyXFxuICAgICAgXFxcInZhbHVlXFxcIjogW10sXFxyXFxuICAgICAgXFxcInJldFxcXCI6IFtdLFxcclxcbiAgICAgIFxcXCJlcnJcXFwiOiB7XFxyXFxuICAgICAgICBcXFwiZXJyY29kZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcclxcbiAgICAgICAgXFxcIm1lc3NhZ2VcXFwiOiBcXFwic3RyaW5nXFxcIlxcclxcbiAgICAgIH1cXHJcXG4gICAgfVxcclxcbiAgfVxcclxcbn1cXHJcXG5cIjtcbnNlbGYuc3RvcmVidWZmZXIgPSBcIlxcclxcbi8qKlxcclxcbiAqIFNUT1JBR0UgQVBJXFxyXFxuICpcXHJcXG4gKiBBUEkgZm9yIFBlcnNpc3RlbnQgU3RvcmFnZVxcclxcbiAqIEV4cG9zZXMgYSBrZXktdmFsdWUgZ2V0L3B1dCBpbnRlcmZhY2VcXHJcXG4gKiovXFxyXFxue1xcclxcbiAgXFxcIm5hbWVcXFwiOiBcXFwic3RvcmVidWZmZXJcXFwiLFxcclxcbiAgXFxcImFwaVxcXCI6IHtcXHJcXG4gICAgLyoqIFxcclxcbiAgICAgKiBMaXN0IG9mIHNjb3BlcyB0aGF0IGNhbiBwcmVmZXJyZWQgd2hlbiBhY2Nlc3Npbmcgc3RvcmFnZS5cXHJcXG4gICAgKiovXFxyXFxuICAgIFxcXCJzY29wZVxcXCI6IHtcXFwidHlwZVxcXCI6IFxcXCJjb25zdGFudFxcXCIsIFxcXCJ2YWx1ZVxcXCI6IHtcXHJcXG4gICAgICAvLyBTdG9yYWdlIHNob3VsZCBvbmx5IGxhc3Qgd2hpbGUgdGhlIGFwcCBpcyBhY3RpdmUuXFxyXFxuICAgICAgXFxcIlNFU1NJT05cXFwiOiAwLFxcclxcbiAgICAgIC8vIFN0b3JhZ2Ugc2hvdWxkIGJlIGxpbWl0ZWQgdG8gaG9zdCB0aGUgYXBwIGlzIGJvdW5kIHRvLlxcclxcbiAgICAgIFxcXCJERVZJQ0VfTE9DQUxcXFwiOiAxLFxcclxcbiAgICAgIC8vIFN0b3JhZ2Ugc2hvdWxkIGJlIHN5bmNocm9uaXplZCBiZXR3ZWVuIHVzZXIgZGV2aWNlcy5cXHJcXG4gICAgICBcXFwiVVNFUl9MT0NBTFxcXCI6IDIsXFxyXFxuICAgICAgLy8gU3RvcmFnZSBzaG91bGQgYmUgc3luY2hyb25pemVkIGFjcm9zcyB1c2Vycy5cXHJcXG4gICAgICBcXFwiU0hBUkVEXFxcIjogM1xcclxcbiAgICB9fSxcXHJcXG4gIFxcclxcbiAgICAvKiogXFxyXFxuICAgICAqIGVycm9yIGNvZGVzIGFuZCBkZWZhdWx0IG1lc3NhZ2VzIHRoYXQgbWF5IGJlIHJldHVybmVkIG9uIGZhaWx1cmVzLlxcclxcbiAgICAgKi9cXHJcXG4gICAgXFxcIkVSUkNPREVcXFwiOiB7XFxcInR5cGVcXFwiOiBcXFwiY29uc3RhbnRcXFwiLCBcXFwidmFsdWVcXFwiOiB7XFxyXFxuICAgICAgLyoqIEdFTkVSQUwgKiovXFxyXFxuICAgICAgXFxcIlNVQ0NFU1NcXFwiOiBcXFwiU3VjY2VzcyFcXFwiLFxcclxcbiAgICAgIC8vIFVua25vd25cXHJcXG4gICAgICBcXFwiVU5LTk9XTlxcXCI6IFxcXCJVbmtub3duIGVycm9yXFxcIixcXHJcXG4gICAgICAvLyBEYXRhYmFzZSBub3QgcmVhZHlcXHJcXG4gICAgICBcXFwiT0ZGTElORVxcXCI6IFxcXCJEYXRhYmFzZSBub3QgcmVhY2hhYmxlXFxcIixcXHJcXG4gICAgICAvLyBJbXByb3BlciBwYXJhbWV0ZXJzXFxyXFxuICAgICAgXFxcIk1BTEZPUk1FRFBBUkFNRVRFUlNcXFwiOiBcXFwiUGFyYW1ldGVycyBhcmUgbWFsZm9ybWVkXFxcIlxcclxcbiAgICB9fSxcXHJcXG4gIFxcclxcbiAgICAvKipcXHJcXG4gICAgICogQ3JlYXRlIGEgc3RvcmFnZSBwcm92aWRlci5cXHJcXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcXHJcXG4gICAgICogICAgc2NvcGUge3N0b3JhZ2Uuc2NvcGV9IFRoZSBwcmVmZXJyZWQgc3RvcmFnZSBzY29wZS5cXHJcXG4gICAgICogQGNvbnN0cnVjdG9yXFxyXFxuICAgICAqL1xcclxcbiAgICBcXFwiY29uc3RydWN0b3JcXFwiOiB7IFxcXCJ2YWx1ZVxcXCI6IFt7XFxyXFxuICAgICAgXFxcInNjb3BlXFxcIjogXFxcIm51bWJlclxcXCJcXHJcXG4gICAgfV19LFxcclxcbiAgXFxyXFxuICAgIC8qKlxcclxcbiAgICAgKiBGZXRjaCBhbiBhcnJheSBvZiBhbGwga2V5c1xcclxcbiAgICAgKiBlLmcuIHN0b3JhZ2Uua2V5cygpID0+IFtzdHJpbmddXFxyXFxuICAgICAqXFxyXFxuICAgICAqIEBtZXRob2Qga2V5c1xcclxcbiAgICAgKiBAcmV0dXJuIGFuIGFycmF5IHdpdGggYWxsIGtleXMgaW4gdGhlIHN0b3JlIFxcclxcbiAgICAgKiovXFxyXFxuICAgIFxcXCJrZXlzXFxcIjoge1xcclxcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxyXFxuICAgICAgXFxcInZhbHVlXFxcIjogW10sXFxyXFxuICAgICAgXFxcInJldFxcXCI6IFtcXFwiYXJyYXlcXFwiLCBcXFwic3RyaW5nXFxcIl0sXFxyXFxuICAgICAgXFxcImVyclxcXCI6IHtcXHJcXG4gICAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxyXFxuICAgICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxyXFxuICAgICAgfVxcclxcbiAgICB9LFxcclxcbiAgXFxyXFxuICAgIC8qKlxcclxcbiAgICAgKiBGZXRjaCBhIHZhbHVlIGZvciBhIGtleVxcclxcbiAgICAgKiBlLmcuIHN0b3JhZ2UuZ2V0KFN0cmluZyBrZXkpID0+IHN0cmluZ1xcclxcbiAgICAgKlxcclxcbiAgICAgKiBAbWV0aG9kIGdldFxcclxcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30ga2V5IC0ga2V5IHRvIGZldGNoXFxyXFxuICAgICAqIEByZXR1cm4ge0FycmF5QnVmZmVyfSBSZXR1cm5zIHZhbHVlLCBudWxsIGlmIGRvZXNuJ3QgZXhpc3RcXHJcXG4gICAgICoqL1xcclxcbiAgICBcXFwiZ2V0XFxcIjoge1xcclxcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxyXFxuICAgICAgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiXSxcXHJcXG4gICAgICBcXFwicmV0XFxcIjogXFxcImJ1ZmZlclxcXCIsXFxyXFxuICAgICAgXFxcImVyclxcXCI6IHtcXHJcXG4gICAgICAgIFxcXCJlcnJjb2RlXFxcIjogXFxcInN0cmluZ1xcXCIsXFxyXFxuICAgICAgICBcXFwibWVzc2FnZVxcXCI6IFxcXCJzdHJpbmdcXFwiXFxyXFxuICAgICAgfVxcclxcbiAgICB9LFxcclxcbiAgXFxyXFxuICAgIC8qKlxcclxcbiAgICAgKiBTZXRzIGEgdmFsdWUgdG8gYSBrZXlcXHJcXG4gICAgICogZS5nLiBzdG9yYWdlLnNldChTdHJpbmcga2V5LCBTdHJpbmcgdmFsdWUpXFxyXFxuICAgICAqXFxyXFxuICAgICAqIEBtZXRob2Qgc2V0XFxyXFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgLSBrZXkgb2YgdmFsdWUgdG8gc2V0XFxyXFxuICAgICAqIEBwYXJhbSB7QXJyYXlCdWZmZXJ9IHZhbHVlIC0gdmFsdWVcXHJcXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBwcmV2aW91cyB2YWx1ZSBvZiBrZXkgaWYgdGhlcmUgd2FzIG9uZS5cXHJcXG4gICAgICoqL1xcclxcbiAgICBcXFwic2V0XFxcIjoge1xcclxcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxyXFxuICAgICAgXFxcInZhbHVlXFxcIjogW1xcXCJzdHJpbmdcXFwiLCBcXFwiYnVmZmVyXFxcIl0sXFxyXFxuICAgICAgXFxcInJldFxcXCI6IFxcXCJidWZmZXJcXFwiLFxcclxcbiAgICAgIFxcXCJlcnJcXFwiOiB7XFxyXFxuICAgICAgICBcXFwiZXJyY29kZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcclxcbiAgICAgICAgXFxcIm1lc3NhZ2VcXFwiOiBcXFwic3RyaW5nXFxcIlxcclxcbiAgICAgIH1cXHJcXG4gICAgfSxcXHJcXG4gICAgXFxyXFxuICAgIC8qKlxcclxcbiAgICAgKiBSZW1vdmVzIGEgc2luZ2xlIGtleVxcclxcbiAgICAgKiBlLmcuIHN0b3JhZ2UucmVtb3ZlKFN0cmluZyBrZXkpXFxyXFxuICAgICAqXFxyXFxuICAgICAqIEBtZXRob2QgcmVtb3ZlXFxyXFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgLSBrZXkgdG8gcmVtb3ZlXFxyXFxuICAgICAqIEByZXR1cm4ge1N0cmluZ30gcHJldmlvdXMgdmFsdWUgb2Yga2V5IGlmIHRoZXJlIHdhcyBvbmUuXFxyXFxuICAgICAqKi9cXHJcXG4gICAgXFxcInJlbW92ZVxcXCI6IHtcXHJcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLFxcclxcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIl0sXFxyXFxuICAgICAgXFxcInJldFxcXCI6IFxcXCJidWZmZXJcXFwiLFxcclxcbiAgICAgIFxcXCJlcnJcXFwiOiB7XFxyXFxuICAgICAgICBcXFwiZXJyY29kZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcclxcbiAgICAgICAgXFxcIm1lc3NhZ2VcXFwiOiBcXFwic3RyaW5nXFxcIlxcclxcbiAgICAgIH1cXHJcXG4gICAgfSxcXHJcXG4gICAgXFxyXFxuICAgIC8qKlxcclxcbiAgICAgKiBSZW1vdmVzIGFsbCBkYXRhIGZyb20gc3RvcmFnZVxcclxcbiAgICAgKiBlLmcuIHN0b3JhZ2UuY2xlYXIoKVxcclxcbiAgICAgKlxcclxcbiAgICAgKiBAbWV0aG9kIGNsZWFyXFxyXFxuICAgICAqIEByZXR1cm4gbm90aGluZ1xcclxcbiAgICAgKiovXFxyXFxuICAgIFxcXCJjbGVhclxcXCI6IHtcXHJcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLFxcclxcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IFtdLFxcclxcbiAgICAgIFxcXCJyZXRcXFwiOiBbXSxcXHJcXG4gICAgICBcXFwiZXJyXFxcIjoge1xcclxcbiAgICAgICAgXFxcImVycmNvZGVcXFwiOiBcXFwic3RyaW5nXFxcIixcXHJcXG4gICAgICAgIFxcXCJtZXNzYWdlXFxcIjogXFxcInN0cmluZ1xcXCJcXHJcXG4gICAgICB9XFxyXFxuICAgIH1cXHJcXG4gIH1cXHJcXG59XFxyXFxuXCI7XG5zZWxmLnRyYW5zcG9ydCA9IFwiLyoqXFxuICogVFJBTlNQT1JUIEFQSVxcbiAqXFxuICogQVBJIGZvciBwZWVyLXRvLXBlZXIgY29tbXVuaWNhdGlvblxcbiAqIFVzZWZ1bCBmb3Igc2VuZGluZyBsYXJnZSBiaW5hcnkgZGF0YSBiZXR3ZWVuIGluc3RhbmNlc1xcbiAqKi9cXG57XFxuICBcXFwibmFtZVxcXCI6IFxcXCJ0cmFuc3BvcnRcXFwiLFxcbiAgXFxcImFwaVxcXCI6IHtcXG4gICAgLyoqIFxcbiAgICAgKiBlcnJvciBjb2RlcyBhbmQgZGVmYXVsdCBtZXNzYWdlcyB0aGF0IG1heSBiZSByZXR1cm5lZCBvbiBmYWlsdXJlcy5cXG4gICAgICovXFxuICAgIFxcXCJFUlJDT0RFXFxcIjoge1xcXCJ0eXBlXFxcIjogXFxcImNvbnN0YW50XFxcIiwgXFxcInZhbHVlXFxcIjoge1xcbiAgICAgIC8qKiBHRU5FUkFMICoqL1xcbiAgICAgIFxcXCJTVUNDRVNTXFxcIjogXFxcIlN1Y2Nlc3MhXFxcIixcXG4gICAgICAvLyBVbmtub3duXFxuICAgICAgXFxcIlVOS05PV05cXFwiOiBcXFwiVW5rbm93biBlcnJvclxcXCIsXFxuICAgICAgLy8gRGF0YWJhc2Ugbm90IHJlYWR5XFxuICAgICAgXFxcIk9GRkxJTkVcXFwiOiBcXFwiTm90IHJlYWNoYWJsZVxcXCIsXFxuICAgICAgLy8gSW1wcm9wZXIgcGFyYW1ldGVyc1xcbiAgICAgIFxcXCJNQUxGT1JNRURQQVJBTUVURVJTXFxcIjogXFxcIlBhcmFtZXRlcnMgYXJlIG1hbGZvcm1lZFxcXCJcXG4gICAgfX0sXFxuICBcXG4gICAgLyoqXFxuICAgICAqIFByZXBhcmUgYSBQMlAgY29ubmVjdGlvbiB3aXRoIGluaXRpYWxpemF0aW9uIHBhcmFtZXRlcnNcXG4gICAgICogVGFrZXMgaW4gYSBzaWduYWxsaW5nIHBhdGh3YXkgKGZyZWVkb20uanMgY2hhbm5lbCksIHdoaWNoIGlzIHVzZWRcXG4gICAgICogYnkgdGhlIHRyYW5zcG9ydCBwcm92aWRlciB0byBzZW5kL3JlY2VpdmUgc2lnbmFsbGluZyBtZXNzYWdlc1xcbiAgICAgKiB0byB0aGUgb3RoZXIgc2lkZSBvZiB0aGUgUDJQIGNvbm5lY3Rpb24gZm9yIHNldHVwLlxcbiAgICAgKlxcbiAgICAgKiBAbWV0aG9kIHNldHVwXFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIC0gZ2l2ZSB0aGlzIGNvbm5lY3Rpb24gYSBuYW1lIGZvciBsb2dnaW5nXFxuICAgICAqIEBwYXJhbSB7UHJveHl9IGNoYW5uZWwgLSBzaWduYWxsaW5nIGNoYW5uZWxcXG4gICAgICogQHJldHVybiBub3RoaW5nLlxcbiAgICAgKiovXFxuICAgIFxcXCJzZXR1cFxcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLFxcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIiwgXFxcInByb3h5XFxcIl0sXFxuICAgICAgXFxcInJldFxcXCI6IFtdLFxcbiAgICAgIFxcXCJlcnJcXFwiOiB7XFxuICAgICAgICBcXFwiZXJyY29kZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcIm1lc3NhZ2VcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICAgIH1cXG4gICAgfSxcXG4gIFxcbiAgICAvKipcXG4gICAgICogU2VuZCBiaW5hcnkgZGF0YSB0byB0aGUgcGVlclxcbiAgICAgKiBBbGwgZGF0YSBpcyBsYWJlbGxlZCB3aXRoIGEgc3RyaW5nIHRhZ1xcbiAgICAgKiBBbnkgZGF0YSBzZW50IHdpdGggdGhlIHNhbWUgdGFnIGlzIHNlbnQgaW4gb3JkZXIsXFxuICAgICAqIGJ1dCB0aGVyZSBpcyBubyBndWFyYW50ZWVzIGJldHdlZW4gdGFnc1xcbiAgICAgKlxcbiAgICAgKiBAbWV0aG9kIHNlbmRcXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRhZ1xcbiAgICAgKiBAcGFyYW0ge2J1ZmZlcn0gZGF0YVxcbiAgICAgKiBAcmV0dXJuIG5vdGhpbmdcXG4gICAgICoqL1xcbiAgICBcXFwic2VuZFxcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJtZXRob2RcXFwiLFxcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IFtcXFwic3RyaW5nXFxcIiwgXFxcImJ1ZmZlclxcXCJdLFxcbiAgICAgIFxcXCJyZXRcXFwiOiBbXSxcXG4gICAgICBcXFwiZXJyXFxcIjoge1xcbiAgICAgICAgXFxcImVycmNvZGVcXFwiOiBcXFwic3RyaW5nXFxcIixcXG4gICAgICAgIFxcXCJtZXNzYWdlXFxcIjogXFxcInN0cmluZ1xcXCJcXG4gICAgICB9XFxuICAgIH0sXFxuICBcXG4gICAgLyoqXFxuICAgICAqIENsb3NlIHRoZSBjb25uZWN0aW9uLiBBbnkgZGF0YSBxdWV1ZWQgZm9yIHNlbmRpbmcsIG9yIGluIHRoZVxcbiAgICAgKiBwcm9jZXNzIG9mIHNlbmRpbmcsIG1heSBiZSBkcm9wcGVkLiBJZiB0aGUgc3RhdGUgb2YgdGhlIHByb21zZSBvZlxcbiAgICAgKiB0aGUgc2VuZCBtZXRob2QgaXMgXFxcInBlbmRpbmdcXFwiIHRoZW4gdGhlIGRhdGEgZm9yIHRoYXQgc2VuZCBjYWxsIG1heVxcbiAgICAgKiBiZSBzZW5kaW5nIG9yIHF1ZXVlZC5cXG4gICAgICogXFxuICAgICAqIEBtZXRob2QgY2xvc2VcXG4gICAgICogQHJldHVybiBub3RoaW5nXFxuICAgICAqKi9cXG4gICAgXFxcImNsb3NlXFxcIjoge1xcbiAgICAgIFxcXCJ0eXBlXFxcIjogXFxcIm1ldGhvZFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjogW10sXFxuICAgICAgXFxcInJldFxcXCI6IFtdLFxcbiAgICAgIFxcXCJlcnJcXFwiOiB7XFxuICAgICAgICBcXFwiZXJyY29kZVxcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcIm1lc3NhZ2VcXFwiOiBcXFwic3RyaW5nXFxcIlxcbiAgICAgIH1cXG4gICAgfSxcXG4gIFxcbiAgICAvKipcXG4gICAgICogRXZlbnQgb24gaW5jb21pbmcgZGF0YSAoQXJyYXlCdWZmZXIpXFxuICAgICAqKi9cXG4gICAgXFxcIm9uRGF0YVxcXCI6IHtcXG4gICAgICBcXFwidHlwZVxcXCI6IFxcXCJldmVudFxcXCIsXFxuICAgICAgXFxcInZhbHVlXFxcIjoge1xcbiAgICAgICAgXFxcInRhZ1xcXCI6IFxcXCJzdHJpbmdcXFwiLFxcbiAgICAgICAgXFxcImRhdGFcXFwiOiBcXFwiYnVmZmVyXFxcIlxcbiAgICAgIH1cXG4gICAgfSxcXG4gIFxcbiAgICAvKipcXG4gICAgICogRXZlbnQgb24gc3VjY2Vzc2Z1bCBjbG9zaW5nIG9mIHRoZSBjb25uZWN0aW9uXFxuICAgICAqKi9cXG4gICAgXFxcIm9uQ2xvc2VcXFwiOiB7XFxuICAgICAgXFxcInR5cGVcXFwiOiBcXFwiZXZlbnRcXFwiLFxcbiAgICAgIFxcXCJ2YWx1ZVxcXCI6IFtdXFxuICAgIH1cXG4gIH1cXG59XFxuXCI7XG5yZXR1cm4gc2VsZn0pKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBwYXNzLlxuICB9XG4gIC8qanNsaW50IG5vbWVuOiBmYWxzZSAqL1xuICB1dGlsLmVhY2hQcm9wKGZvdW5kLCBmdW5jdGlvbiAoanNvbikge1xuICAgIHRoaXMuaW50ZXJmYWNlcy5wdXNoKEpTT04ucGFyc2UobWluaWZ5KGpzb24pKSk7XG4gIH0uYmluZCh0aGlzKSk7XG59O1xuXG5cbi8qKlxuICogUG9wdWxhdGUgYW4gQVBJIHJlZ2lzdHJ5IHdpdGggcHJvdmlkZWQgcHJvdmlkZXJzLCBhbmQgd2l0aCBrbm93biBBUElcbiAqIGRlZmluaXRpb25zLlxuICogQHN0YXRpY1xuICogQG1ldGhvZCByZWdpc3RlclxuICogQHBhcmFtIHt7bmFtZTogc3RyaW5nLCBwcm92aWRlcjogRnVuY3Rpb24sIHN0eWxlPzogc3RyaW5nfVtdfSBwcm92aWRlcnNcbiAqICAgVGhlIGNvcmUgcHJvdmlkZXJzIG1hZGUgYXZhaWxhYmxlIHRvIHRoaXMgZnJlZWRvbS5qcyBpbnN0YW5jZS5cbiAqIEBwYXJhbSB7QXBpfSByZWdpc3RyeSBUaGUgQVBJIHJlZ2lzdHJ5IHRvIHBvcHVsYXRlLlxuICovXG5leHBvcnRzLnJlZ2lzdGVyID0gZnVuY3Rpb24gKHByb3ZpZGVycywgcmVnaXN0cnkpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICB2YXIgYnVuZGxlID0gbmV3IEJ1bmRsZSgpO1xuICBidW5kbGUuaW50ZXJmYWNlcy5mb3JFYWNoKGZ1bmN0aW9uIChhcGkpIHtcbiAgICBpZiAoYXBpICYmIGFwaS5uYW1lICYmIGFwaS5hcGkpIHtcbiAgICAgIHJlZ2lzdHJ5LnNldChhcGkubmFtZSwgYXBpLmFwaSk7XG4gICAgfVxuICB9KTtcblxuICBwcm92aWRlcnMuZm9yRWFjaChmdW5jdGlvbiAocHJvdmlkZXIpIHtcbiAgICBpZiAocHJvdmlkZXIubmFtZSkge1xuICAgICAgcmVnaXN0cnkucmVnaXN0ZXIocHJvdmlkZXIubmFtZSwgcHJvdmlkZXIucHJvdmlkZXIsIHByb3ZpZGVyLnN0eWxlKTtcbiAgICB9XG4gIH0pO1xufTtcbiIsIi8qZ2xvYmFscyBCbG9iLCBBcnJheUJ1ZmZlciwgRGF0YVZpZXcgKi9cbi8qanNsaW50IGluZGVudDoyLCBub2RlOnRydWUsIHNsb3BweTp0cnVlICovXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG4vKipcbiAqIEEgZnJlZWRvbSBwb3J0IGZvciBhIHVzZXItYWNjZXNzYWJsZSBhcGkuXG4gKiBAY2xhc3MgQ29uc3VtZXJcbiAqIEBpbXBsZW1lbnRzIFBvcnRcbiAqIEB1c2VzIGhhbmRsZUV2ZW50c1xuICogQHBhcmFtIHtPYmplY3R9IGludGVyZmFjZUNscyBUaGUgYXBpIGludGVyZmFjZSBleHBvc2VkIGJ5IHRoaXMgY29uc3VtZXIuXG4gKiBAcGFyYW0ge0RlYnVnfSBkZWJ1ZyBUaGUgZGVidWdnZXIgdG8gdXNlIGZvciBsb2dnaW5nLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZhciBDb25zdW1lciA9IGZ1bmN0aW9uIChpbnRlcmZhY2VDbHMsIGRlYnVnKSB7XG4gIHRoaXMuaWQgPSBDb25zdW1lci5uZXh0SWQoKTtcbiAgdGhpcy5pbnRlcmZhY2VDbHMgPSBpbnRlcmZhY2VDbHM7XG4gIHRoaXMuZGVidWcgPSBkZWJ1ZztcbiAgdXRpbC5oYW5kbGVFdmVudHModGhpcyk7XG4gIFxuICB0aGlzLmlmYWNlcyA9IHt9O1xuICB0aGlzLmNsb3NlSGFuZGxlcnMgPSB7fTtcbiAgdGhpcy5lcnJvckhhbmRsZXJzID0ge307XG4gIHRoaXMuZW1pdHMgPSB7fTtcbn07XG5cbi8qKlxuICogUmVjZWl2ZSBpbmNvbWluZyBtZXNzYWdlcyBmb3IgdGhpcyBjb25zdW1lci5cbiAqIEBtZXRob2Qgb25NZXNzYWdlXG4gKiBAcGFyYW0ge1N0cmluZ30gc291cmNlIFRoZSBzb3VyY2Ugb2YgdGhlIG1lc3NhZ2UuXG4gKiBAcGFyYW0ge09iamVjdH0gbWVzc2FnZSBUaGUgcmVjZWl2ZWQgbWVzc2FnZS5cbiAqL1xuQ29uc3VtZXIucHJvdG90eXBlLm9uTWVzc2FnZSA9IGZ1bmN0aW9uIChzb3VyY2UsIG1lc3NhZ2UpIHtcbiAgaWYgKHNvdXJjZSA9PT0gJ2NvbnRyb2wnICYmIG1lc3NhZ2UucmV2ZXJzZSkge1xuICAgIHRoaXMuZW1pdENoYW5uZWwgPSBtZXNzYWdlLmNoYW5uZWw7XG4gICAgdGhpcy5lbWl0KHRoaXMuZW1pdENoYW5uZWwsIHtcbiAgICAgIHR5cGU6ICdjaGFubmVsIGFubm91bmNlbWVudCcsXG4gICAgICBjaGFubmVsOiBtZXNzYWdlLnJldmVyc2VcbiAgICB9KTtcbiAgICB0aGlzLmVtaXQoJ3N0YXJ0Jyk7XG4gIH0gZWxzZSBpZiAoc291cmNlID09PSAnY29udHJvbCcgJiYgbWVzc2FnZS50eXBlID09PSAnc2V0dXAnKSB7XG4gICAgdGhpcy5jb250cm9sQ2hhbm5lbCA9IG1lc3NhZ2UuY2hhbm5lbDtcbiAgfSBlbHNlIGlmIChzb3VyY2UgPT09ICdjb250cm9sJyAmJiBtZXNzYWdlLnR5cGUgPT09ICdjbG9zZScpIHtcbiAgICBkZWxldGUgdGhpcy5jb250cm9sQ2hhbm5lbDtcbiAgICB0aGlzLmRvQ2xvc2UoKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAoIXRoaXMuZW1pdENoYW5uZWwgJiYgbWVzc2FnZS5jaGFubmVsKSB7XG4gICAgICB0aGlzLmVtaXRDaGFubmVsID0gbWVzc2FnZS5jaGFubmVsO1xuICAgICAgdGhpcy5lbWl0KCdzdGFydCcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobWVzc2FnZS50eXBlID09PSAnY2xvc2UnICYmIG1lc3NhZ2UudG8pIHtcbiAgICAgIHRoaXMudGVhcmRvd24obWVzc2FnZS50byk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChtZXNzYWdlLnR5cGUgPT09ICdlcnJvcicpIHtcbiAgICAgIHRoaXMuZXJyb3IobWVzc2FnZS50bywgbWVzc2FnZS5tZXNzYWdlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKG1lc3NhZ2UudG8pIHtcbiAgICAgIGlmICh0aGlzLmVtaXRzW21lc3NhZ2UudG9dKSB7XG4gICAgICAgIHRoaXMuZW1pdHNbbWVzc2FnZS50b10oJ21lc3NhZ2UnLCBtZXNzYWdlLm1lc3NhZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5kZWJ1Zy53YXJuKCdDb3VsZCBub3QgZGVsaXZlciBtZXNzYWdlLCBubyBzdWNoIGludGVyZmFjZTogJyArIG1lc3NhZ2UudG8pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbXNnID0gbWVzc2FnZS5tZXNzYWdlO1xuICAgICAgdXRpbC5lYWNoUHJvcCh0aGlzLmVtaXRzLCBmdW5jdGlvbiAoaWZhY2UpIHtcbiAgICAgICAgaWZhY2UoJ21lc3NhZ2UnLCBtZXNzYWdlLm1lc3NhZ2UpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZSBhIGNvbnN1bWVyLkludGVyZmFjZSBhc3NvY2lhdGVkIHdpdGggdGhpcyBjb25zdW1lci5cbiAqIEFuIGludGVyZmFjZSBpcyByZXR1cm5lZCwgd2hpY2ggaXMgc3VwcGxpZWQgd2l0aCBpbXBvcnRhbnQgY29udHJvbCBvZiB0aGVcbiAqIGFwaSB2aWEgY29uc3RydWN0b3IgYXJndW1lbnRzOiAoYm91bmQgYmVsb3cgaW4gZ2V0SW50ZXJmYWNlQ29uc3RydWN0b3IpXG4gKiBcbiAqIG9uTXNnOiBmdW5jdGlvbihiaW5kZXIpIHNldHMgdGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2hlbiBtZXNzYWdlcyBmb3IgdGhpc1xuICogICAgaW50ZXJmYWNlIGFycml2ZSBvbiB0aGUgY2hhbm5lbCxcbiAqIGVtaXQ6IGZ1bmN0aW9uKG1zZykgYWxsb3dzIHRoaXMgaW50ZXJmYWNlIHRvIGVtaXQgbWVzc2FnZXMsXG4gKiBpZDogc3RyaW5nIGlzIHRoZSBJZGVudGlmaWVyIGZvciB0aGlzIGludGVyZmFjZS5cbiAqIEBtZXRob2QgZ2V0SW50ZXJmYWNlXG4gKi9cbkNvbnN1bWVyLnByb3RvdHlwZS5nZXRJbnRlcmZhY2UgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBJZmFjZSA9IHRoaXMuZ2V0SW50ZXJmYWNlQ29uc3RydWN0b3IoKSxcbiAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgaWYgKGFyZ3MubGVuZ3RoKSB7XG4gICAgSWZhY2UgPSBJZmFjZS5iaW5kLmFwcGx5KElmYWNlLCBbSWZhY2VdLmNvbmNhdChhcmdzKSk7XG4gIH1cbiAgcmV0dXJuIG5ldyBJZmFjZSgpO1xufTtcblxuLyoqXG4gKiBBdHRhY2ggYW4gJ29uRXZlbnQnIGxpc3RlbmVyIHRvIGFuIGludGVyZmFjZSwgYWxsb3dpbmcgZXh0ZXJuYWwgY29uc3VtZXJzXG4gKiB0byBlaXRoZXIgbGlzdGVuIHRvIGNoYW5uZWwgc3RhdGUsIG9yIHJlZ2lzdGVyIGNhbGxiYWNrcyBvbiBsaWZldGltZSBldmVudHNcbiAqIG9mIGluZGl2aWR1YWwgaW5zdGFuY2VzIG9mIHRoZSBpbnRlcmZhY2UuXG4gKiBAbWV0aG9kIGdldExpc3RlbmVyXG4gKiBAcGFybWEge1N0cmluZ30gbmFtZSBUaGUgZXZlbnQgdG8gbGlzdGVuIHRvLlxuICogQHByaXZhdGVcbiAqL1xuQ29uc3VtZXIucHJvdG90eXBlLmdldExpc3RlbmVyID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChpbnN0YW5jZSwgaGFuZGxlcikge1xuICAgIC8vIExpc3RlbiB0byB0aGUgY2hhbm5lbCBkaXJlY3RseS5cbiAgICBpZiAodHlwZW9mIGluc3RhbmNlID09PSAnZnVuY3Rpb24nICYmIGhhbmRsZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5vbmNlKG5hbWUsIGluc3RhbmNlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBMaXN0ZW4gdG8gYSBzcGVjaWZpYyBpbnN0YW5jZS5cbiAgICB2YXIgaGFuZGxlcnMgPSBuYW1lICsgJ0hhbmRsZXJzJztcbiAgICB1dGlsLmVhY2hQcm9wKHRoaXMuaWZhY2VzLCBmdW5jdGlvbiAoY2FuZGlkYXRlLCBpZCkge1xuICAgICAgaWYgKGNhbmRpZGF0ZSA9PT0gaW5zdGFuY2UpIHtcbiAgICAgICAgaWYgKHRoaXNbaGFuZGxlcnNdW2lkXSkge1xuICAgICAgICAgIHRoaXNbaGFuZGxlcnNdW2lkXS5wdXNoKGhhbmRsZXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXNbaGFuZGxlcnNdW2lkXSA9IFtoYW5kbGVyXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xuICB9LmJpbmQodGhpcyk7XG59O1xuXG4vKipcbiAqIENyZWF0ZSBhIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gZ2V0IGludGVyZmFjZXMgZnJvbSB0aGlzIGFwaSBjb25zdW1lclxuICogZnJvbSBhIHVzZXItdmlzaWJsZSBwb2ludC5cbiAqIEBtZXRob2QgZ2V0UHJveHlJbnRlcmZhY2VcbiAqL1xuQ29uc3VtZXIucHJvdG90eXBlLmdldFByb3h5SW50ZXJmYWNlID0gZnVuY3Rpb24gKCkge1xuICB2YXIgZnVuYyA9IGZ1bmN0aW9uIChwKSB7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIGlmIChhcmdzLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiBwLmdldEludGVyZmFjZS5hcHBseShwLCBhcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHAuZ2V0SW50ZXJmYWNlKCk7XG4gICAgfVxuICB9LmJpbmQoe30sIHRoaXMpO1xuXG4gIGZ1bmMuY2xvc2UgPSBmdW5jdGlvbiAoaWZhY2UpIHtcbiAgICBpZiAoaWZhY2UpIHtcbiAgICAgIHV0aWwuZWFjaFByb3AodGhpcy5pZmFjZXMsIGZ1bmN0aW9uIChjYW5kaWRhdGUsIGlkKSB7XG4gICAgICAgIGlmIChjYW5kaWRhdGUgPT09IGlmYWNlKSB7XG4gICAgICAgICAgdGhpcy50ZWFyZG93bihpZCk7XG4gICAgICAgICAgdGhpcy5lbWl0KHRoaXMuZW1pdENoYW5uZWwsIHtcbiAgICAgICAgICAgIHR5cGU6ICdjbG9zZScsXG4gICAgICAgICAgICB0bzogaWRcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQ2xvc2UgdGhlIGNoYW5uZWwuXG4gICAgICB0aGlzLmRvQ2xvc2UoKTtcbiAgICB9XG4gIH0uYmluZCh0aGlzKTtcblxuICBmdW5jLm9uQ2xvc2UgPSB0aGlzLmdldExpc3RlbmVyKCdjbG9zZScpO1xuICBmdW5jLm9uRXJyb3IgPSB0aGlzLmdldExpc3RlbmVyKCdlcnJvcicpO1xuXG4gIHJldHVybiBmdW5jO1xufTtcblxuLyoqXG4gKiBQcm92aWRlcyBhIGJvdW5kIGNsYXNzIGZvciBjcmVhdGluZyBhIGNvbnN1bWVyLkludGVyZmFjZSBhc3NvY2lhdGVkXG4gKiB3aXRoIHRoaXMgYXBpLiBUaGlzIHBhcnRpYWwgbGV2ZWwgb2YgY29uc3RydWN0aW9uIGNhbiBiZSB1c2VkXG4gKiB0byBhbGxvdyB0aGUgY29uc3VtZXIgdG8gYmUgdXNlZCBhcyBhIHByb3ZpZGVyIGZvciBhbm90aGVyIEFQSS5cbiAqIEBtZXRob2QgZ2V0SW50ZXJmYWNlQ29uc3RydWN0b3JcbiAqIEBwcml2YXRlXG4gKi9cbkNvbnN1bWVyLnByb3RvdHlwZS5nZXRJbnRlcmZhY2VDb25zdHJ1Y3RvciA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGlkID0gQ29uc3VtZXIubmV4dElkKCk7XG4gIHJldHVybiB0aGlzLmludGVyZmFjZUNscy5iaW5kKFxuICAgIHt9LFxuICAgIGZ1bmN0aW9uIChpZCwgb2JqLCBiaW5kZXIpIHtcbiAgICAgIHRoaXMuaWZhY2VzW2lkXSA9IG9iajtcbiAgICAgIHRoaXMuZW1pdHNbaWRdID0gYmluZGVyO1xuICAgIH0uYmluZCh0aGlzLCBpZCksXG4gICAgdGhpcy5kb0VtaXQuYmluZCh0aGlzLCBpZCksXG4gICAgdGhpcy5kZWJ1Z1xuICApO1xufTtcblxuLyoqXG4gKiBFbWl0IGEgbWVzc2FnZSBvbiB0aGUgY2hhbm5lbCBvbmNlIHNldHVwIGlzIGNvbXBsZXRlLlxuICogQG1ldGhvZCBkb0VtaXRcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge1N0cmluZ30gdG8gVGhlIElEIG9mIHRoZSBmbG93IHNlbmRpbmcgdGhlIG1lc3NhZ2UuXG4gKiBAcGFyYW0ge09iamVjdH0gbXNnIFRoZSBtZXNzYWdlIHRvIGVtaXRcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gYWxsIFNlbmQgbWVzc2FnZSB0byBhbGwgcmVjaXBpZW50cy5cbiAqL1xuQ29uc3VtZXIucHJvdG90eXBlLmRvRW1pdCA9IGZ1bmN0aW9uICh0bywgbXNnLCBhbGwpIHtcbiAgaWYgKGFsbCkge1xuICAgIHRvID0gZmFsc2U7XG4gIH1cbiAgaWYgKHRoaXMuZW1pdENoYW5uZWwpIHtcbiAgICB0aGlzLmVtaXQodGhpcy5lbWl0Q2hhbm5lbCwge3RvOiB0bywgdHlwZTogJ21lc3NhZ2UnLCBtZXNzYWdlOiBtc2d9KTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm9uY2UoJ3N0YXJ0JywgdGhpcy5kb0VtaXQuYmluZCh0aGlzLCB0bywgbXNnKSk7XG4gIH1cbn07XG5cbi8qKlxuICogVGVhcmRvd24gYSBzaW5nbGUgaW50ZXJmYWNlIG9mIHRoaXMgYXBpLlxuICogQG1ldGhvZCB0ZWFyZG93blxuICogQHBhcmFtIHtTdHJpbmd9IGlkIFRoZSBpZCBvZiB0aGUgaW50ZXJmYWNlIHRvIHRlYXIgZG93bi5cbiAqL1xuQ29uc3VtZXIucHJvdG90eXBlLnRlYXJkb3duID0gZnVuY3Rpb24gKGlkKSB7XG4gIGRlbGV0ZSB0aGlzLmVtaXRzW2lkXTtcbiAgaWYgKHRoaXMuY2xvc2VIYW5kbGVyc1tpZF0pIHtcbiAgICB1dGlsLmVhY2hQcm9wKHRoaXMuY2xvc2VIYW5kbGVyc1tpZF0sIGZ1bmN0aW9uIChwcm9wKSB7XG4gICAgICBwcm9wKCk7XG4gICAgfSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuaWZhY2VzW2lkXTtcbiAgZGVsZXRlIHRoaXMuY2xvc2VIYW5kbGVyc1tpZF07XG4gIGRlbGV0ZSB0aGlzLmVycm9ySGFuZGxlcnNbaWRdO1xufTtcblxuLyoqXG4gKiBIYW5kbGUgYSBtZXNzYWdlIGVycm9yIHJlcG9ydGVkIHRvIHRoaXMgYXBpLlxuICogQG1ldGhvZCBlcnJvclxuICogQHBhcmFtIHtTdHJpbmc/fSBpZCBUaGUgaWQgb2YgdGhlIGludGVyZmFjZSB3aGVyZSB0aGUgZXJyb3Igb2NjdXJlZC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBtZXNzYWdlIFRoZSBtZXNzYWdlIHdoaWNoIGZhaWxlZCwgaWYgcmVsZXZhbnQuXG4gKi9cbkNvbnN1bWVyLnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uIChpZCwgbWVzc2FnZSkge1xuICBpZiAoaWQgJiYgdGhpcy5lcnJvckhhbmRsZXJzW2lkXSkge1xuICAgIHV0aWwuZWFjaFByb3AodGhpcy5lcnJvckhhbmRsZXJzW2lkXSwgZnVuY3Rpb24gKHByb3ApIHtcbiAgICAgIHByb3AobWVzc2FnZSk7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoIWlkKSB7XG4gICAgdGhpcy5lbWl0KCdlcnJvcicsIG1lc3NhZ2UpO1xuICB9XG59O1xuXG5cbi8qKlxuICogQ2xvc2UgLyB0ZWFyZG93biB0aGUgZmxvdyB0aGlzIGFwaSB0ZXJtaW5hdGVzLlxuICogQG1ldGhvZCBkb0Nsb3NlXG4gKi9cbkNvbnN1bWVyLnByb3RvdHlwZS5kb0Nsb3NlID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5jb250cm9sQ2hhbm5lbCkge1xuICAgIHRoaXMuZW1pdCh0aGlzLmNvbnRyb2xDaGFubmVsLCB7XG4gICAgICB0eXBlOiAnQ2hhbm5lbCBDbG9zaW5nJyxcbiAgICAgIHJlcXVlc3Q6ICdjbG9zZSdcbiAgICB9KTtcbiAgfVxuXG4gIHV0aWwuZWFjaFByb3AodGhpcy5lbWl0cywgZnVuY3Rpb24gKGVtaXQsIGlkKSB7XG4gICAgdGhpcy50ZWFyZG93bihpZCk7XG4gIH0uYmluZCh0aGlzKSk7XG5cbiAgdGhpcy5lbWl0KCdjbG9zZScpO1xuICB0aGlzLm9mZigpO1xuXG4gIHRoaXMuZW1pdENoYW5uZWwgPSBudWxsO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIHRleHR1YWwgZGVzY3JpcHRpb24gb2YgdGhpcyBwb3J0LlxuICogQG1ldGhvZCB0b1N0cmluZ1xuICogQHJldHVybiBUaGUgZGVzY3JpcHRpb24gb2YgdGhpcyBwb3J0LlxuICovXG5Db25zdW1lci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLmVtaXRDaGFubmVsKSB7XG4gICAgcmV0dXJuIFwiW0NvbnN1bWVyIFwiICsgdGhpcy5lbWl0Q2hhbm5lbCArIFwiXVwiO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBcIlt1bmJvdW5kIENvbnN1bWVyXVwiO1xuICB9XG59O1xuXG4vKipcbiAqIEdldCB0aGUgbmV4dCBJRCBmb3IgYW4gYXBpIGNoYW5uZWwuXG4gKiBAbWV0aG9kIG5leHRJZFxuICogQHN0YXRpY1xuICogQHByaXZhdGVcbiAqL1xuQ29uc3VtZXIubmV4dElkID0gZnVuY3Rpb24gKCkge1xuICBpZiAoIUNvbnN1bWVyLmlkKSB7XG4gICAgQ29uc3VtZXIuaWQgPSAxO1xuICB9XG4gIHJldHVybiAoQ29uc3VtZXIuaWQgKz0gMSk7XG59O1xuXG4vKipcbiAqIENvbnZlcnQgYSBzdHJ1Y3R1cmVkIGRhdGEgc3RydWN0dXJlIGludG8gYSBtZXNzYWdlIHN0cmVhbSBjb25mb3JtaW5nIHRvXG4gKiBhIHRlbXBsYXRlIGFuZCBhbiBhcnJheSBvZiBiaW5hcnkgZGF0YSBlbGVtZW50cy5cbiAqIEBzdGF0aWNcbiAqIEBtZXRob2QgbWVzc2FnZVRvUG9ydGFibGVcbiAqIEBwYXJhbSB7T2JqZWN0fSB0ZW1wbGF0ZSBUaGUgdGVtcGxhdGUgdG8gY29uZm9ybSB0b1xuICogQHBhcmFtIHtPYmplY3R9IHZhbHVlIFRoZSBpbnN0YW5jZSBvZiB0aGUgZGF0YSBzdHJ1Y3R1cmUgdG8gY29uZnJvbVxuICogQHBhcmFtIHtEZWJ1Z30gZGVidWcgQSBkZWJ1Z2dlciBmb3IgZXJyb3JzLlxuICogQHJldHVybiB7e3RleHQ6IE9iamVjdCwgYmluYXJ5OiBBcnJheX19IFNlcGFyYXRlZCBkYXRhIHN0cmVhbXMuXG4gKi9cbkNvbnN1bWVyLm1lc3NhZ2VUb1BvcnRhYmxlID0gZnVuY3Rpb24gKHRlbXBsYXRlLCB2YWx1ZSwgZGVidWcpIHtcbiAgdmFyIGV4dGVybmFscyA9IFtdLFxuICAgIG1lc3NhZ2UgPSBDb25zdW1lci5jb25mb3JtKHRlbXBsYXRlLCB2YWx1ZSwgZXh0ZXJuYWxzLCB0cnVlLCBkZWJ1Zyk7XG4gIHJldHVybiB7XG4gICAgdGV4dDogbWVzc2FnZSxcbiAgICBiaW5hcnk6IGV4dGVybmFsc1xuICB9O1xufTtcblxuLyoqXG4gKiBDb252ZXJ0IFN0cnVjdHVyZWQgRGF0YSBzdHJlYW1zIGludG8gYSBkYXRhIHN0cnVjdHVyZSBjb25mb3JtaW5nIHRvIGFcbiAqIHRlbXBsYXRlLlxuICogQHN0YXRpY1xuICogQG1ldGhvZCBwb3J0YWJsZVRvTWVzc2FnZVxuICogQHBhcmFtIHtPYmplY3R9IHRlbXBsYXRlIFRoZSB0ZW1wbGF0ZSB0byBjb25mb3JtIHRvXG4gKiBAcGFyYW0ge3t0ZXh0OiBPYmplY3QsIGJpbmFyeTogQXJyYXl9fSBzdHJlYW1zIFRoZSBzdHJlYW1zIHRvIGNvbmZvcm1cbiAqIEBwYXJhbSB7RGVidWd9IGRlYnVnIEEgZGVidWdnZXIgZm9yIGVycm9ycy5cbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIGRhdGEgc3RydWN0dXJlIG1hdGNoaW5nIHRoZSB0ZW1wbGF0ZS5cbiAqL1xuQ29uc3VtZXIucG9ydGFibGVUb01lc3NhZ2UgPSBmdW5jdGlvbiAodGVtcGxhdGUsIHN0cmVhbXMsIGRlYnVnKSB7XG4gIHJldHVybiBDb25zdW1lci5jb25mb3JtKHRlbXBsYXRlLCBzdHJlYW1zLnRleHQsIHN0cmVhbXMuYmluYXJ5LCBmYWxzZSwgZGVidWcpO1xufTtcblxuLyoqXG4gKiBGb3JjZSBhIGNvbGxlY3Rpb24gb2YgdmFsdWVzIHRvIGxvb2sgbGlrZSB0aGUgdHlwZXMgYW5kIGxlbmd0aCBvZiBhbiBBUElcbiAqIHRlbXBsYXRlLlxuICogQHN0YXRpY1xuICogQG1ldGhvZCBjb25mb3JtXG4gKiBAcGFyYW0ge09iamVjdH0gdGVtcGxhdGUgVGhlIHRlbXBsYXRlIHRvIGNvbmZvcm0gdG9cbiAqIEBwYXJhbSB7T2JqZWN0fSBmcm9tIFRoZSB2YWx1ZSB0byBjb25mb3JtXG4gKiBAcGFyYW0ge0FycmF5fSBleHRlcm5hbHMgTGlzdGluZyBvZiBiaW5hcnkgZWxlbWVudHMgaW4gdGhlIHRlbXBsYXRlXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFdoZXRoZXIgdG8gdG8gc2VwYXJhdGUgb3IgY29tYmluZSBzdHJlYW1zLlxuICogQGFwYXJhbSB7RGVidWd9IGRlYnVnIEEgZGVidWdnZXIgZm9yIGVycm9ycy5cbiAqL1xuQ29uc3VtZXIuY29uZm9ybSA9IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgZnJvbSwgZXh0ZXJuYWxzLCBzZXBhcmF0ZSwgZGVidWcpIHtcbiAgLyoganNoaW50IC1XMDg2ICovXG4gIGlmICh0eXBlb2YgKGZyb20pID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy9mcm9tID0gdW5kZWZpbmVkO1xuICAgIC8vdGhyb3cgXCJUcnlpbmcgdG8gY29uZm9ybSBhIGZ1bmN0aW9uXCI7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfSBlbHNlIGlmICh0eXBlb2YgKGZyb20pID09PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH0gZWxzZSBpZiAoZnJvbSA9PT0gbnVsbCkge1xuICAgIHJldHVybiBudWxsO1xuICB9IGVsc2UgaWYgKHRlbXBsYXRlID09PSB1bmRlZmluZWQpIHtcbiAgICBkZWJ1Zy5lcnJvcihcIk1lc3NhZ2UgZGlzY2FyZGVkIGZvciBub3QgbWF0Y2hpbmcgZGVjbGFyZWQgdHlwZSFcIiwgZnJvbSk7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHN3aXRjaCAodGVtcGxhdGUpIHtcbiAgY2FzZSAnc3RyaW5nJzpcbiAgICByZXR1cm4gU3RyaW5nKCcnKSArIGZyb207XG4gIGNhc2UgJ251bWJlcic6XG4gICAgcmV0dXJuIE51bWJlcigxKSAqIGZyb207XG4gIGNhc2UgJ2Jvb2xlYW4nOlxuICAgIHJldHVybiBCb29sZWFuKGZyb20gPT09IHRydWUpO1xuICBjYXNlICdvYmplY3QnOlxuICAgIC8vIFRPRE8od2lsbHNjb3R0KTogQWxsb3cgcmVtb3ZhbCBpZiBzYW5kYm94aW5nIGVuZm9yY2VzIHRoaXMuXG4gICAgaWYgKHR5cGVvZiBmcm9tID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZnJvbSkpO1xuICAgIH1cbiAgY2FzZSAnYmxvYic6XG4gICAgaWYgKHNlcGFyYXRlKSB7XG4gICAgICBpZiAoZnJvbSBpbnN0YW5jZW9mIEJsb2IpIHtcbiAgICAgICAgZXh0ZXJuYWxzLnB1c2goZnJvbSk7XG4gICAgICAgIHJldHVybiBleHRlcm5hbHMubGVuZ3RoIC0gMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlYnVnLmVycm9yKCdjb25mb3JtIGV4cGVjdGluZyBCbG9iLCBidXQgc2F3ICcgKyAodHlwZW9mIGZyb20pKTtcbiAgICAgICAgZXh0ZXJuYWxzLnB1c2gobmV3IEJsb2IoW10pKTtcbiAgICAgICAgcmV0dXJuIGV4dGVybmFscy5sZW5ndGggLSAxO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZXh0ZXJuYWxzW2Zyb21dO1xuICAgIH1cbiAgY2FzZSAnYnVmZmVyJzpcbiAgICBpZiAoc2VwYXJhdGUpIHtcbiAgICAgIGV4dGVybmFscy5wdXNoKENvbnN1bWVyLm1ha2VBcnJheUJ1ZmZlcihmcm9tLCBkZWJ1ZykpO1xuICAgICAgcmV0dXJuIGV4dGVybmFscy5sZW5ndGggLSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gQ29uc3VtZXIubWFrZUFycmF5QnVmZmVyKGV4dGVybmFsc1tmcm9tXSwgZGVidWcpO1xuICAgIH1cbiAgY2FzZSAncHJveHknOlxuICAgIHJldHVybiBmcm9tO1xuICB9XG4gIHZhciB2YWwsIGk7XG4gIGlmIChBcnJheS5pc0FycmF5KHRlbXBsYXRlKSAmJiBmcm9tICE9PSB1bmRlZmluZWQpIHtcbiAgICB2YWwgPSBbXTtcbiAgICBpID0gMDtcbiAgICBpZiAodGVtcGxhdGUubGVuZ3RoID09PSAyICYmIHRlbXBsYXRlWzBdID09PSAnYXJyYXknKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKFwidGVtcGxhdGUgaXMgYXJyYXksIHZhbHVlIGlzIFwiICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpKTtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBmcm9tLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHZhbC5wdXNoKENvbnN1bWVyLmNvbmZvcm0odGVtcGxhdGVbMV0sIGZyb21baV0sIGV4dGVybmFscyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXBhcmF0ZSwgZGVidWcpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChpID0gMDsgaSA8IHRlbXBsYXRlLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmIChmcm9tW2ldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB2YWwucHVzaChDb25zdW1lci5jb25mb3JtKHRlbXBsYXRlW2ldLCBmcm9tW2ldLCBleHRlcm5hbHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXBhcmF0ZSwgZGVidWcpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YWwucHVzaCh1bmRlZmluZWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2YWw7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHRlbXBsYXRlID09PSAnb2JqZWN0JyAmJiBmcm9tICE9PSB1bmRlZmluZWQpIHtcbiAgICB2YWwgPSB7fTtcbiAgICB1dGlsLmVhY2hQcm9wKHRlbXBsYXRlLCBmdW5jdGlvbiAocHJvcCwgbmFtZSkge1xuICAgICAgaWYgKGZyb21bbmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB2YWxbbmFtZV0gPSBDb25zdW1lci5jb25mb3JtKHByb3AsIGZyb21bbmFtZV0sIGV4dGVybmFscywgc2VwYXJhdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVidWcpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB2YWw7XG4gIH1cbiAgZGVidWcuZXJyb3IoJ1Vua25vd24gdGVtcGxhdGUgcHJvdmlkZWQ6ICcgKyB0ZW1wbGF0ZSk7XG59O1xuXG4vKipcbiAqIE1ha2UgYSB0aGluZyBpbnRvIGFuIEFycmF5IEJ1ZmZlclxuICogQHN0YXRpY1xuICogQG1ldGhvZCBtYWtlQXJyYXlCdWZmZXJcbiAqIEBwYXJhbSB7T2JqZWN0fSB0aGluZ1xuICogQHBhcmFtIHtEZWJ1Z30gZGVidWcgQSBkZWJ1Z2dlciBpbiBjYXNlIG9mIGVycm9ycy5cbiAqIEByZXR1cm4ge0FycmF5QnVmZmVyfSBBbiBBcnJheSBCdWZmZXJcbiAqL1xuQ29uc3VtZXIubWFrZUFycmF5QnVmZmVyID0gZnVuY3Rpb24gKHRoaW5nLCBkZWJ1Zykge1xuICBpZiAoIXRoaW5nKSB7XG4gICAgcmV0dXJuIG5ldyBBcnJheUJ1ZmZlcigwKTtcbiAgfVxuXG4gIGlmICh0aGluZyBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgcmV0dXJuIHRoaW5nO1xuICB9IGVsc2UgaWYgKHRoaW5nLmNvbnN0cnVjdG9yLm5hbWUgPT09IFwiQXJyYXlCdWZmZXJcIiAmJlxuICAgICAgdHlwZW9mIHRoaW5nLnByb3RvdHlwZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIC8vIFdvcmthcm91bmQgZm9yIHdlYmtpdCBvcmlnaW4gb3duZXJzaGlwIGlzc3VlLlxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9VV05ldHdvcmtzTGFiL2ZyZWVkb20vaXNzdWVzLzI4XG4gICAgcmV0dXJuIG5ldyBEYXRhVmlldyh0aGluZykuYnVmZmVyO1xuICB9IGVsc2Uge1xuICAgIGRlYnVnLmVycm9yKCdleHBlY3RpbmcgQXJyYXlCdWZmZXIsIGJ1dCBzYXcgJyArXG4gICAgICAgICh0eXBlb2YgdGhpbmcpICsgJzogJyArIEpTT04uc3RyaW5naWZ5KHRoaW5nKSk7XG4gICAgcmV0dXJuIG5ldyBBcnJheUJ1ZmZlcigwKTtcbiAgfVxufTtcblxuLyoqXG4gKiBSZWN1cnNpdmVseSB0cmF2ZXJzZSBhIFtuZXN0ZWRdIG9iamVjdCBhbmQgZnJlZXplIGl0cyBrZXlzIGZyb20gYmVpbmdcbiAqIHdyaXRhYmxlLiBOb3RlLCB0aGUgcmVzdWx0IGNhbiBoYXZlIG5ldyBrZXlzIGFkZGVkIHRvIGl0LCBidXQgZXhpc3Rpbmcgb25lc1xuICogY2Fubm90IGJlICBvdmVyd3JpdHRlbi4gRG9lc24ndCBkbyBhbnl0aGluZyBmb3IgYXJyYXlzIG9yIG90aGVyIGNvbGxlY3Rpb25zLlxuICpcbiAqIEBtZXRob2QgcmVjdXJzaXZlRnJlZXplT2JqZWN0XG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIC0gb2JqZWN0IHRvIGJlIGZyb3plblxuICogQHJldHVybiB7T2JqZWN0fSBvYmpcbiAqKi9cbkNvbnN1bWVyLnJlY3Vyc2l2ZUZyZWV6ZU9iamVjdCA9IGZ1bmN0aW9uIChvYmopIHtcbiAgdmFyIGssIHJldCA9IHt9O1xuICBpZiAodHlwZW9mIG9iaiAhPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gb2JqO1xuICB9XG4gIGZvciAoayBpbiBvYmopIHtcbiAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocmV0LCBrLCB7XG4gICAgICAgIHZhbHVlOiBDb25zdW1lci5yZWN1cnNpdmVGcmVlemVPYmplY3Qob2JqW2tdKSxcbiAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJldDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ29uc3VtZXI7XG4iLCIvKmpzbGludCBpbmRlbnQ6Miwgbm9kZTp0cnVlLCBzbG9wcHk6dHJ1ZSAqL1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuLyoqXG4gKiBBIGZyZWVkb20gZW50cnkgcG9pbnQgZm9yIGRlYnVnZ2luZy5cbiAqIEB1c2VzIGhhbmRsZUV2ZW50c1xuICogQGltcGxlbWVudHMgUG9ydFxuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZhciBEZWJ1ZyA9IGZ1bmN0aW9uIChsb2dnZXIpIHtcbiAgdGhpcy5pZCA9ICdkZWJ1Zyc7XG4gIHRoaXMuZW1pdENoYW5uZWwgPSBmYWxzZTtcbiAgdGhpcy5jb25maWcgPSBmYWxzZTtcbiAgdXRpbC5oYW5kbGVFdmVudHModGhpcyk7XG59O1xuXG4vKipcbiAqIFByb3ZpZGUgYSB0ZXh0dWFsIGRlc2NyaXB0aW9uIG9mIHRoaXMgcG9ydC5cbiAqIEBtZXRob2QgdG9TdHJpbmdcbiAqIEByZXR1cm4ge1N0cmluZ30gdGhlIHRleHR1YWwgZGVzY3JpcHRpb24uXG4gKi9cbkRlYnVnLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuICdbQ29uc29sZV0nO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlciBhIGxvZ2dlciBmb3Igb3V0cHV0dGluZyBkZWJ1Z2dpbmcgbWVzc2FnZXMuXG4gKiBAbWV0aG9kIHNldExvZ2dlclxuICogQHBhcmFtIHtDb25zb2xlfSBsb2dnZXIgVGhlIGxvZ2dlciB0byByZWdpc3RlclxuICovXG5EZWJ1Zy5wcm90b3R5cGUuc2V0TG9nZ2VyID0gZnVuY3Rpb24gKGxvZ2dlcikge1xuICBpZiAodGhpcy5sb2dnZXIpIHtcbiAgICB0aGlzLmluZm8oJ1JlcGxhY2luZyBMb2dnZXIuJyk7XG4gIH1cbiAgdGhpcy5sb2dnZXIgPSBsb2dnZXI7XG4gIHRoaXMuZW1pdCgnbG9nZ2VyJyk7XG59O1xuXG4vKipcbiAqIEhhbmRsZXIgZm9yIHJlY2VpdmluZyBtZXNzYWdlcyBzZW50IHRvIHRoZSBkZWJ1ZyBwb3J0LlxuICogVGhlc2UgbWVzc2FnZXMgYXJlIHVzZWQgdG8gcmV0cmVpdmUgY29uZmlnIGZvciBleHBvc2luZyBjb25zb2xlLlxuICogQG1ldGhvZCBvbk1lc3NhZ2VcbiAqIEBwYXJhbSB7U3RyaW5nfSBzb3VyY2UgdGhlIHNvdXJjZSBpZGVudGlmaWVyIGZvciB0aGUgbWVzc2FnZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBtZXNzYWdlIHRoZSByZWNlaXZlZCBtZXNzYWdlLlxuICovXG5EZWJ1Zy5wcm90b3R5cGUub25NZXNzYWdlID0gZnVuY3Rpb24gKHNvdXJjZSwgbWVzc2FnZSkge1xuICBpZiAoc291cmNlID09PSAnY29udHJvbCcgJiYgbWVzc2FnZS5jaGFubmVsICYmICF0aGlzLmVtaXRDaGFubmVsKSB7XG4gICAgdGhpcy5lbWl0Q2hhbm5lbCA9IG1lc3NhZ2UuY2hhbm5lbDtcbiAgICB0aGlzLmNvbmZpZyA9IG1lc3NhZ2UuY29uZmlnO1xuICAgIGlmICghdGhpcy5jb25maWcuZ2xvYmFsLmNvbnNvbGUpIHtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5jb25maWcuZ2xvYmFsLmNvbnNvbGUgPSBjb25zb2xlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jb25maWcuZ2xvYmFsLmNvbnNvbGUgPSB0aGlzLmdldExvZ2dlcignQ29uc29sZScpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmVtaXQoJ3JlYWR5Jyk7XG4gIH1cbn07XG5cbi8qKlxuICogRGlzcGF0Y2ggYSBkZWJ1ZyBtZXNzYWdlIHdpdGggYXJiaXRyYXJ5IHNldmVyaXR5LlxuICogQWxsIGRlYnVnIG1lc3NhZ2VzIGFyZSByb3V0ZWQgdGhyb3VnaCB0aGUgbWFuYWdlciwgdG8gYWxsb3cgZm9yIGRlbGVnYXRpb24uXG4gKiBAbWV0aG9kIGZvcm1hdFxuICogQHBhcmFtIHtTdHJpbmd9IHNldmVyaXR5IHRoZSBzZXZlcml0eSBvZiB0aGUgbWVzc2FnZS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBzb3VyY2UgVGhlIGxvY2F0aW9uIG9mIG1lc3NhZ2UuXG4gKiBAcGFyYW0ge1N0cmluZ1tdfSBhcmdzIFRoZSBjb250ZW50cyBvZiB0aGUgbWVzc2FnZS5cbiAqIEBwcml2YXRlXG4gKi9cbkRlYnVnLnByb3RvdHlwZS5mb3JtYXQgPSBmdW5jdGlvbiAoc2V2ZXJpdHksIHNvdXJjZSwgYXJncykge1xuICB2YXIgaSwgYWxpc3QgPSBbXSwgYXJnYXJyO1xuICBpZiAodHlwZW9mIGFyZ3MgPT09IFwic3RyaW5nXCIgJiYgc291cmNlKSB7XG4gICAgdHJ5IHtcbiAgICAgIGFyZ2FyciA9IEpTT04ucGFyc2UoYXJncyk7XG4gICAgICBpZiAoYXJnYXJyIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgYXJncyA9IGFyZ2FycjtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyBwYXNzLlxuICAgIH1cbiAgfVxuXG4gIGlmICh0eXBlb2YgYXJncyA9PT0gXCJzdHJpbmdcIikge1xuICAgIGFsaXN0LnB1c2goYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgZm9yIChpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIGFsaXN0LnB1c2goYXJnc1tpXSk7XG4gICAgfVxuICB9XG4gIGlmICghdGhpcy5lbWl0Q2hhbm5lbCkge1xuICAgIHRoaXMub24oJ3JlYWR5JywgdGhpcy5mb3JtYXQuYmluZCh0aGlzLCBzZXZlcml0eSwgc291cmNlLCBhbGlzdCkpO1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLmVtaXQodGhpcy5lbWl0Q2hhbm5lbCwge1xuICAgIHNldmVyaXR5OiBzZXZlcml0eSxcbiAgICBzb3VyY2U6IHNvdXJjZSxcbiAgICBxdWlldDogdHJ1ZSxcbiAgICByZXF1ZXN0OiAnZGVidWcnLFxuICAgIG1zZzogSlNPTi5zdHJpbmdpZnkoYWxpc3QpXG4gIH0pO1xufTtcblxuLyoqXG4gKiBQcmludCByZWNlaXZlZCBtZXNzYWdlcyBvbiB0aGUgY29uc29sZS5cbiAqIFRoaXMgaXMgY2FsbGVkIGJ5IHRoZSBtYW5hZ2VyIGluIHJlc3BvbnNlIHRvIGFuIGVtaXNzaW9uIGZyb20gZm9ybWF0LlxuICogQG1ldGhvZCBwcmludFxuICogQHBhcmFtIHtPYmplY3R9IG1lc3NhZ2UgVGhlIG1lc3NhZ2UgZW1pdHRlZCBieSB7QHNlZSBmb3JtYXR9IHRvIHByaW50LlxuICovXG5EZWJ1Zy5wcm90b3R5cGUucHJpbnQgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICBpZiAoIXRoaXMubG9nZ2VyKSB7XG4gICAgdGhpcy5vbmNlKCdsb2dnZXInLCB0aGlzLnByaW50LmJpbmQodGhpcywgbWVzc2FnZSkpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBhcmdzLCBhcnIgPSBbXSwgaSA9IDA7XG4gIGFyZ3MgPSBKU09OLnBhcnNlKG1lc3NhZ2UubXNnKTtcbiAgaWYgKHR5cGVvZiBhcmdzID09PSBcInN0cmluZ1wiKSB7XG4gICAgYXJyLnB1c2goYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgd2hpbGUgKGFyZ3NbaV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgYXJyLnB1c2goYXJnc1tpXSk7XG4gICAgICBpICs9IDE7XG4gICAgfVxuICB9XG4gIHRoaXMubG9nZ2VyW21lc3NhZ2Uuc2V2ZXJpdHldLmNhbGwodGhpcy5sb2dnZXIsIG1lc3NhZ2Uuc291cmNlLCBhcnIsIGZ1bmN0aW9uICgpIHt9KTtcbn07XG5cbi8qKlxuICogUHJpbnQgYSBsb2cgbWVzc2FnZSB0byB0aGUgY29uc29sZS5cbiAqIEBtZXRob2QgbG9nXG4gKi9cbkRlYnVnLnByb3RvdHlwZS5sb2cgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuZm9ybWF0KCdsb2cnLCB1bmRlZmluZWQsIGFyZ3VtZW50cyk7XG59O1xuXG4vKipcbiAqIFByaW50IGFuIGluZm8gbWVzc2FnZSB0byB0aGUgY29uc29sZS5cbiAqIEBtZXRob2QgbG9nXG4gKi9cbkRlYnVnLnByb3RvdHlwZS5pbmZvID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmZvcm1hdCgnaW5mbycsIHVuZGVmaW5lZCwgYXJndW1lbnRzKTtcbn07XG5cbi8qKlxuICogUHJpbnQgYSBkZWJ1ZyBtZXNzYWdlIHRvIHRoZSBjb25zb2xlLlxuICogQG1ldGhvZCBsb2dcbiAqL1xuRGVidWcucHJvdG90eXBlLmRlYnVnID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmZvcm1hdCgnZGVidWcnLCB1bmRlZmluZWQsIGFyZ3VtZW50cyk7XG59O1xuXG4vKipcbiAqIFByaW50IGEgd2FybmluZyBtZXNzYWdlIHRvIHRoZSBjb25zb2xlLlxuICogQG1ldGhvZCB3YXJuXG4gKi9cbkRlYnVnLnByb3RvdHlwZS53YXJuID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmZvcm1hdCgnd2FybicsIHVuZGVmaW5lZCwgYXJndW1lbnRzKTtcbn07XG5cbi8qKlxuICogUHJpbnQgYW4gZXJyb3IgbWVzc2FnZSB0byB0aGUgY29uc29sZS5cbiAqIEBtZXRob2QgZXJyb3JcbiAqL1xuRGVidWcucHJvdG90eXBlLmVycm9yID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmZvcm1hdCgnZXJyb3InLCB1bmRlZmluZWQsIGFyZ3VtZW50cyk7XG59O1xuXG4vKipcbiAqIEdldCBhIGxvZ2dlciB0aGF0IGxvZ3MgbWVzc2FnZXMgcHJlZml4ZWQgYnkgYSBnaXZlbiBuYW1lLlxuICogQG1ldGhvZCBnZXRMb2dnZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBwcmVmaXggZm9yIGxvZ2dlZCBtZXNzYWdlcy5cbiAqIEByZXR1cm5zIHtDb25zb2xlfSBBIGNvbnNvbGUtbGlrZSBvYmplY3QuXG4gKi9cbkRlYnVnLnByb3RvdHlwZS5nZXRMb2dnZXIgPSBmdW5jdGlvbiAobmFtZSkge1xuICB2YXIgbG9nID0gZnVuY3Rpb24gKHNldmVyaXR5LCBzb3VyY2UpIHtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zcGxpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHRoaXMuZm9ybWF0KHNldmVyaXR5LCBzb3VyY2UsIGFyZ3MpO1xuICB9LFxuICAgIGxvZ2dlciA9IHtcbiAgICAgIGZyZWVkb206IHRydWUsXG4gICAgICBkZWJ1ZzogbG9nLmJpbmQodGhpcywgJ2RlYnVnJywgbmFtZSksXG4gICAgICBpbmZvOiBsb2cuYmluZCh0aGlzLCAnaW5mbycsIG5hbWUpLFxuICAgICAgbG9nOiBsb2cuYmluZCh0aGlzLCAnbG9nJywgbmFtZSksXG4gICAgICB3YXJuOiBsb2cuYmluZCh0aGlzLCAnd2FybicsIG5hbWUpLFxuICAgICAgZXJyb3I6IGxvZy5iaW5kKHRoaXMsICdlcnJvcicsIG5hbWUpXG4gICAgfTtcbiAgcmV0dXJuIGxvZ2dlcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRGVidWc7XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vKmpzbGludCBpbmRlbnQ6Mixub2RlOnRydWUgKi9cclxudmFyIFByb21pc2VDb21wYXQgPSByZXF1aXJlKCdlczYtcHJvbWlzZScpLlByb21pc2U7XHJcblxyXG52YXIgQXBpID0gcmVxdWlyZSgnLi9hcGknKTtcclxudmFyIERlYnVnID0gcmVxdWlyZSgnLi9kZWJ1ZycpO1xyXG52YXIgSHViID0gcmVxdWlyZSgnLi9odWInKTtcclxudmFyIE1hbmFnZXIgPSByZXF1aXJlKCcuL21hbmFnZXInKTtcclxudmFyIFBvbGljeSA9IHJlcXVpcmUoJy4vcG9saWN5Jyk7XHJcbnZhciBQcm94eUJpbmRlciA9IHJlcXVpcmUoJy4vcHJveHliaW5kZXInKTtcclxudmFyIFJlc291cmNlID0gcmVxdWlyZSgnLi9yZXNvdXJjZScpO1xyXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xyXG52YXIgQnVuZGxlID0gcmVxdWlyZSgnLi9idW5kbGUnKTtcclxuXHJcbnZhciBmcmVlZG9tR2xvYmFsO1xyXG52YXIgZ2V0R2xvYmFsID0gZnVuY3Rpb24gKCkge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuICBcclxuICAvLyBOb2RlLmpzXHJcbiAgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnICYmIGdsb2JhbC5wcm90b3R5cGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgZnJlZWRvbUdsb2JhbCA9IGdsb2JhbDtcclxuICAvLyBCcm93c2Vyc1xyXG4gIH0gZWxzZSB7XHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgZnJlZWRvbUdsb2JhbCA9IHRoaXM7XHJcbiAgICB9LCAwKTtcclxuICB9XHJcbn07XHJcbmdldEdsb2JhbCgpO1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSBhIG5ldyBmcmVlZG9tIGNvbnRleHQuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0IEluZm9ybWF0aW9uIGFib3V0IHRoZSBsb2NhbCBjb250ZXh0LlxyXG4gKiBAc2VlIHt1dGlsL3dvcmtlckVudHJ5LmpzfVxyXG4gKiBAcGFyYW0ge1N0cmluZ30gbWFuaWZlc3QgVGhlIG1hbmlmZXN0IHRvIGxvYWQuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWcgQ29uZmlndXJhdGlvbiBrZXlzIHNldCBieSB0aGUgdXNlci5cclxuICogQHJldHVybnMge1Byb21pc2V9IEEgcHJvbWlzZSBmb3IgdGhlIG1vZHVsZSBkZWZpbmVkIGluIHRoZSBtYW5pZmVzdC5cclxuICovXHJcbnZhciBzZXR1cCA9IGZ1bmN0aW9uIChjb250ZXh0LCBtYW5pZmVzdCwgY29uZmlnKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG4gIHZhciBkZWJ1ZyA9IG5ldyBEZWJ1ZygpLFxyXG4gICAgaHViID0gbmV3IEh1YihkZWJ1ZyksXHJcbiAgICByZXNvdXJjZSA9IG5ldyBSZXNvdXJjZShkZWJ1ZyksXHJcbiAgICBhcGkgPSBuZXcgQXBpKGRlYnVnKSxcclxuICAgIG1hbmFnZXIgPSBuZXcgTWFuYWdlcihodWIsIHJlc291cmNlLCBhcGkpLFxyXG4gICAgYmluZGVyID0gbmV3IFByb3h5QmluZGVyKG1hbmFnZXIpLFxyXG4gICAgcG9saWN5LFxyXG4gICAgc2l0ZV9jZmcgPSB7XHJcbiAgICAgICdkZWJ1Zyc6ICdsb2cnLFxyXG4gICAgICAnbWFuaWZlc3QnOiBtYW5pZmVzdCxcclxuICAgICAgJ21vZHVsZUNvbnRleHQnOiAoIWNvbnRleHQgfHwgdHlwZW9mIChjb250ZXh0LmlzTW9kdWxlKSA9PT0gXCJ1bmRlZmluZWRcIikgP1xyXG4gICAgICAgICAgdXRpbC5pc01vZHVsZUNvbnRleHQoKSA6XHJcbiAgICAgICAgICBjb250ZXh0LmlzTW9kdWxlXHJcbiAgICB9LFxyXG4gICAgbGluayxcclxuICAgIFBvcnQ7XHJcblxyXG4gIGlmIChjb25maWcpIHtcclxuICAgIHV0aWwubWl4aW4oc2l0ZV9jZmcsIGNvbmZpZywgdHJ1ZSk7XHJcbiAgfVxyXG4gIHNpdGVfY2ZnLmdsb2JhbCA9IGZyZWVkb21HbG9iYWw7XHJcbiAgaWYgKGNvbnRleHQpIHtcclxuICAgIHV0aWwubWl4aW4oc2l0ZV9jZmcsIGNvbnRleHQsIHRydWUpO1xyXG4gIH1cclxuXHJcbiAgLy8gUmVnaXN0ZXIgdXNlci1zdXBwbGllZCBleHRlbnNpb25zLlxyXG4gIC8vIEZvciBleGFtcGxlIHRoZSAnY29yZS5vYXV0aCcgcHJvdmlkZXIgZGVmaW5lcyBhIHJlZ2lzdGVyIGZ1bmN0aW9uLFxyXG4gIC8vIHdoaWNoIGVuYWJsZXMgc2l0ZV9jZmcub2F1dGggdG8gYmUgcmVnaXN0ZXJlZCB3aXRoIGl0LlxyXG4gIGNvbnRleHQucHJvdmlkZXJzLmZvckVhY2goZnVuY3Rpb24gKHByb3ZpZGVyKSB7XHJcbiAgICBpZiAocHJvdmlkZXIubmFtZS5pbmRleE9mKCdjb3JlLicpID09PSAwICYmXHJcbiAgICAgICAgdHlwZW9mIHByb3ZpZGVyLnJlZ2lzdGVyID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIHByb3ZpZGVyLnJlZ2lzdGVyKFxyXG4gICAgICAgICh0eXBlb2Ygc2l0ZV9jZmdbcHJvdmlkZXIubmFtZS5zdWJzdHIoNSldICE9PSAndW5kZWZpbmVkJykgP1xyXG4gICAgICAgICAgICBzaXRlX2NmZ1twcm92aWRlci5uYW1lLnN1YnN0cig1KV0gOlxyXG4gICAgICAgICAgICB1bmRlZmluZWRcclxuICAgICAgKTtcclxuICAgIH1cclxuICB9KTtcclxuICBcclxuICBCdW5kbGUucmVnaXN0ZXIoY29udGV4dC5wcm92aWRlcnMsIGFwaSk7XHJcbiAgcmVzb3VyY2UucmVnaXN0ZXIoY29udGV4dC5yZXNvbHZlcnMgfHwgW10pO1xyXG5cclxuICByZXR1cm4gbmV3IFByb21pc2VDb21wYXQoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgaWYgKHNpdGVfY2ZnLm1vZHVsZUNvbnRleHQpIHtcclxuICAgICAgUG9ydCA9IHNpdGVfY2ZnLnBvcnRUeXBlO1xyXG4gICAgICBsaW5rID0gbmV3IFBvcnQoJ091dGJvdW5kJywgcmVzb3VyY2UpO1xyXG4gICAgICBtYW5hZ2VyLnNldHVwKGxpbmspO1xyXG5cclxuICAgICAgLy8gRGVsYXkgZGVidWcgbWVzc2FnZXMgdW50aWwgZGVsZWdhdGlvbiB0byB0aGUgcGFyZW50IGNvbnRleHQgaXMgc2V0dXAuXHJcbiAgICAgIG1hbmFnZXIub25jZSgnZGVsZWdhdGUnLCBtYW5hZ2VyLnNldHVwLmJpbmQobWFuYWdlciwgZGVidWcpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG1hbmFnZXIuc2V0dXAoZGVidWcpO1xyXG4gICAgICBwb2xpY3kgPSBuZXcgUG9saWN5KG1hbmFnZXIsIHJlc291cmNlLCBzaXRlX2NmZyk7XHJcblxyXG4gICAgICAvLyBEZWZpbmUgaG93IHRvIGxvYWQgYSByb290IG1vZHVsZS5cclxuICAgICAgdmFyIGZhbGxiYWNrTG9nZ2VyLCBnZXRJZmFjZTtcclxuICAgICAgZmFsbGJhY2tMb2dnZXIgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xyXG4gICAgICAgIGFwaS5nZXRDb3JlKCdjb3JlLmNvbnNvbGUnLCBkZWJ1ZykudGhlbihmdW5jdGlvbiAoTG9nZ2VyKSB7XHJcbiAgICAgICAgICBkZWJ1Zy5zZXRMb2dnZXIobmV3IExvZ2dlcigpKTtcclxuICAgICAgICAgIGlmIChtZXNzYWdlKSB7XHJcbiAgICAgICAgICAgIGRlYnVnLmVycm9yKG1lc3NhZ2UpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9O1xyXG4gICAgICBnZXRJZmFjZSA9IGZ1bmN0aW9uIChtYW5pZmVzdCkge1xyXG4gICAgICAgIHJldHVybiByZXNvdXJjZS5nZXQoc2l0ZV9jZmcubG9jYXRpb24sIG1hbmlmZXN0KS50aGVuKFxyXG4gICAgICAgICAgZnVuY3Rpb24gKGNhbm9uaWNhbF9tYW5pZmVzdCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcG9saWN5LmdldChbXSwgY2Fub25pY2FsX21hbmlmZXN0KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICApLnRoZW4oZnVuY3Rpb24gKGluc3RhbmNlKSB7XHJcbiAgICAgICAgICBtYW5hZ2VyLnNldHVwKGluc3RhbmNlKTtcclxuICAgICAgICAgIHJldHVybiBiaW5kZXIuYmluZERlZmF1bHQoaW5zdGFuY2UsIGFwaSwgaW5zdGFuY2UubWFuaWZlc3QpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgLy8gTG9hZCBhcHByb3ByaWF0ZSBMb2dnZXIuXHJcbiAgICAgIGlmIChzaXRlX2NmZy5sb2dnZXIpIHtcclxuICAgICAgICBnZXRJZmFjZShzaXRlX2NmZy5sb2dnZXIpLnRoZW4oZnVuY3Rpb24gKGlmYWNlKSB7XHJcbiAgICAgICAgICBpZiAoaWZhY2UuZXh0ZXJuYWwuYXBpICE9PSAnY29uc29sZScpIHtcclxuICAgICAgICAgICAgZmFsbGJhY2tMb2dnZXIoXCJVbndpbGxpbmcgdG8gdXNlIGxvZ2dlciB3aXRoIHVua25vd24gQVBJOlwiLFxyXG4gICAgICAgICAgICAgIGlmYWNlLmV4dGVybmFsLmFwaSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBkZWJ1Zy5zZXRMb2dnZXIoaWZhY2UuZXh0ZXJuYWwoKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSwgZmFsbGJhY2tMb2dnZXIpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGZhbGxiYWNrTG9nZ2VyKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIExvYWQgcm9vdCBtb2R1bGUuXHJcbiAgICAgIGdldElmYWNlKHNpdGVfY2ZnLm1hbmlmZXN0KS50aGVuKGZ1bmN0aW9uIChpZmFjZSkge1xyXG4gICAgICAgIHJldHVybiBpZmFjZS5leHRlcm5hbDtcclxuICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgIGRlYnVnLmVycm9yKCdGYWlsZWQgdG8gcmV0cmlldmUgbWFuaWZlc3Q6ICcgKyBlcnIpO1xyXG4gICAgICAgIHRocm93IGVycjtcclxuICAgICAgfSkudGhlbihyZXNvbHZlLCByZWplY3QpO1xyXG4gICAgfVxyXG5cclxuICAgIGh1Yi5lbWl0KCdjb25maWcnLCBzaXRlX2NmZyk7XHJcbiAgfSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHNldHVwO1xyXG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIi8qanNsaW50IGluZGVudDoyLHNsb3BweTp0cnVlLG5vZGU6dHJ1ZSAqL1xyXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xyXG5cclxuLyoqXHJcbiAqIERlZmluZXMgZmRvbS5IdWIsIHRoZSBjb3JlIG1lc3NhZ2UgaHViIGJldHdlZW4gZnJlZWRvbSBtb2R1bGVzLlxyXG4gKiBJbmNvbW1pbmcgbWVzc2FnZXMgZnJvbSBhcHBzIGFyZSBzZW50IHRvIGh1Yi5vbk1lc3NhZ2UoKVxyXG4gKiBAY2xhc3MgSHViXHJcbiAqIEBwYXJhbSB7RGVidWd9IGRlYnVnIExvZ2dlciBmb3IgZGVidWdnaW5nLlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbnZhciBIdWIgPSBmdW5jdGlvbiAoZGVidWcpIHtcclxuICB0aGlzLmRlYnVnID0gZGVidWc7XHJcbiAgdGhpcy5jb25maWcgPSB7fTtcclxuICB0aGlzLmFwcHMgPSB7fTtcclxuICB0aGlzLnJvdXRlcyA9IHt9O1xyXG4gIHRoaXMudW5ib3VuZCA9IFtdO1xyXG5cclxuICB1dGlsLmhhbmRsZUV2ZW50cyh0aGlzKTtcclxuICB0aGlzLm9uKCdjb25maWcnLCBmdW5jdGlvbiAoY29uZmlnKSB7XHJcbiAgICB1dGlsLm1peGluKHRoaXMuY29uZmlnLCBjb25maWcpO1xyXG4gIH0uYmluZCh0aGlzKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogSGFuZGxlIGFuIGluY29taW5nIG1lc3NhZ2UgZnJvbSBhIGZyZWVkb20gYXBwLlxyXG4gKiBAbWV0aG9kIG9uTWVzc2FnZVxyXG4gKiBAcGFyYW0ge1N0cmluZ30gc291cmNlIFRoZSBpZGVudGlmaXlpbmcgc291cmNlIG9mIHRoZSBtZXNzYWdlLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gbWVzc2FnZSBUaGUgc2VudCBtZXNzYWdlLlxyXG4gKi9cclxuSHViLnByb3RvdHlwZS5vbk1lc3NhZ2UgPSBmdW5jdGlvbiAoc291cmNlLCBtZXNzYWdlKSB7XHJcbiAgdmFyIGRlc3RpbmF0aW9uID0gdGhpcy5yb3V0ZXNbc291cmNlXSwgdHlwZTtcclxuICBpZiAoIWRlc3RpbmF0aW9uIHx8ICFkZXN0aW5hdGlvbi5hcHApIHtcclxuICAgIHRoaXMuZGVidWcud2FybihcIk1lc3NhZ2UgZHJvcHBlZCBmcm9tIHVucmVnaXN0ZXJlZCBzb3VyY2UgXCIgKyBzb3VyY2UpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgaWYgKCF0aGlzLmFwcHNbZGVzdGluYXRpb24uYXBwXSkge1xyXG4gICAgdGhpcy5kZWJ1Zy53YXJuKFwiTWVzc2FnZSBkcm9wcGVkIHRvIGRlc3RpbmF0aW9uIFwiICsgZGVzdGluYXRpb24uYXBwKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIC8vIFRoZSBmaXJlaG9zZSB0cmFjaW5nIGFsbCBpbnRlcm5hbCBmcmVlZG9tLmpzIG1lc3NhZ2VzLlxyXG4gIGlmICghbWVzc2FnZS5xdWlldCAmJiAhZGVzdGluYXRpb24ucXVpZXQgJiYgdGhpcy5jb25maWcgJiYgdGhpcy5jb25maWcudHJhY2UpIHtcclxuICAgIHR5cGUgPSBtZXNzYWdlLnR5cGU7XHJcbiAgICBpZiAobWVzc2FnZS50eXBlID09PSAnbWVzc2FnZScgJiYgbWVzc2FnZS5tZXNzYWdlICYmXHJcbiAgICAgICAgbWVzc2FnZS5tZXNzYWdlLmFjdGlvbiA9PT0gJ21ldGhvZCcpIHtcclxuICAgICAgdHlwZSA9ICdtZXRob2QuJyArIG1lc3NhZ2UubWVzc2FnZS50eXBlO1xyXG4gICAgfSBlbHNlIGlmIChtZXNzYWdlLnR5cGUgPT09ICdtZXRob2QnICYmIG1lc3NhZ2UubWVzc2FnZSAmJlxyXG4gICAgICAgIG1lc3NhZ2UubWVzc2FnZS50eXBlID09PSAnbWV0aG9kJykge1xyXG4gICAgICB0eXBlID0gJ3JldHVybi4nICsgbWVzc2FnZS5tZXNzYWdlLm5hbWU7XHJcbiAgICB9IGVsc2UgaWYgKG1lc3NhZ2UudHlwZSA9PT0gJ21lc3NhZ2UnICYmIG1lc3NhZ2UubWVzc2FnZSAmJlxyXG4gICAgICAgIG1lc3NhZ2UubWVzc2FnZS50eXBlID09PSAnZXZlbnQnKSB7XHJcbiAgICAgIHR5cGUgPSAnZXZlbnQuJyArIG1lc3NhZ2UubWVzc2FnZS5uYW1lO1xyXG4gICAgfVxyXG4gICAgdGhpcy5kZWJ1Zy5kZWJ1Zyh0aGlzLmFwcHNbZGVzdGluYXRpb24uc291cmNlXS50b1N0cmluZygpICtcclxuICAgICAgICBcIiAtXCIgKyB0eXBlICsgXCItPiBcIiArXHJcbiAgICAgICAgdGhpcy5hcHBzW2Rlc3RpbmF0aW9uLmFwcF0udG9TdHJpbmcoKSArIFwiLlwiICsgZGVzdGluYXRpb24uZmxvdyk7XHJcbiAgfVxyXG5cclxuICB0aGlzLmFwcHNbZGVzdGluYXRpb24uYXBwXS5vbk1lc3NhZ2UoZGVzdGluYXRpb24uZmxvdywgbWVzc2FnZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IHRoZSBsb2NhbCBkZXN0aW5hdGlvbiBwb3J0IG9mIGEgZmxvdy5cclxuICogQG1ldGhvZCBnZXREZXN0aW5hdGlvblxyXG4gKiBAcGFyYW0ge1N0cmluZ30gc291cmNlIFRoZSBmbG93IHRvIHJldHJpZXZlLlxyXG4gKiBAcmV0dXJuIHtQb3J0fSBUaGUgZGVzdGluYXRpb24gcG9ydC5cclxuICovXHJcbkh1Yi5wcm90b3R5cGUuZ2V0RGVzdGluYXRpb24gPSBmdW5jdGlvbiAoc291cmNlKSB7XHJcbiAgdmFyIGRlc3RpbmF0aW9uID0gdGhpcy5yb3V0ZXNbc291cmNlXTtcclxuICBpZiAoIWRlc3RpbmF0aW9uKSB7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcbiAgcmV0dXJuIHRoaXMuYXBwc1tkZXN0aW5hdGlvbi5hcHBdO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldCB0aGUgbG9jYWwgc291cmNlIHBvcnQgb2YgYSBmbG93LlxyXG4gKiBAbWV0aG9kIGdldFNvdXJjZVxyXG4gKiBAcGFyYW0ge1BvcnR9IHNvdXJjZSBUaGUgZmxvdyBpZGVudGlmaWVyIHRvIHJldHJpZXZlLlxyXG4gKiBAcmV0dXJuIHtQb3J0fSBUaGUgc291cmNlIHBvcnQuXHJcbiAqL1xyXG5IdWIucHJvdG90eXBlLmdldFNvdXJjZSA9IGZ1bmN0aW9uIChzb3VyY2UpIHtcclxuICBpZiAoIXNvdXJjZSkge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuICBpZiAoIXRoaXMuYXBwc1tzb3VyY2UuaWRdKSB7XHJcbiAgICB0aGlzLmRlYnVnLndhcm4oXCJObyByZWdpc3RlcmVkIHNvdXJjZSAnXCIgKyBzb3VyY2UuaWQgKyBcIidcIik7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG4gIHJldHVybiB0aGlzLmFwcHNbc291cmNlLmlkXTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZWdpc3RlciBhIGRlc3RpbmF0aW9uIGZvciBtZXNzYWdlcyB3aXRoIHRoaXMgaHViLlxyXG4gKiBAbWV0aG9kIHJlZ2lzdGVyXHJcbiAqIEBwYXJhbSB7UG9ydH0gYXBwIFRoZSBQb3J0IHRvIHJlZ2lzdGVyLlxyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtmb3JjZV0gV2hldGhlciB0byBvdmVycmlkZSBhbiBleGlzdGluZyBwb3J0LlxyXG4gKiBAcmV0dXJuIHtCb29sZWFufSBXaGV0aGVyIHRoZSBhcHAgd2FzIHJlZ2lzdGVyZWQuXHJcbiAqL1xyXG5IdWIucHJvdG90eXBlLnJlZ2lzdGVyID0gZnVuY3Rpb24gKGFwcCwgZm9yY2UpIHtcclxuICBpZiAoIXRoaXMuYXBwc1thcHAuaWRdIHx8IGZvcmNlKSB7XHJcbiAgICB0aGlzLmFwcHNbYXBwLmlkXSA9IGFwcDtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIERlcmVnaXN0ZXIgYSBkZXN0aW5hdGlvbiBmb3IgbWVzc2FnZXMgd2l0aCB0aGUgaHViLlxyXG4gKiBOb3RlOiBkb2VzIG5vdCByZW1vdmUgYXNzb2NpYXRlZCByb3V0ZXMuIEFzIHN1Y2gsIGRlcmVnaXN0ZXJpbmcgd2lsbFxyXG4gKiBwcmV2ZW50IHRoZSBpbnN0YWxsYXRpb24gb2YgbmV3IHJvdXRlcywgYnV0IHdpbGwgbm90IGRpc3RydXB0IGV4aXN0aW5nXHJcbiAqIGh1YiByb3V0ZXMuXHJcbiAqIEBtZXRob2QgZGVyZWdpc3RlclxyXG4gKiBAcGFyYW0ge1BvcnR9IGFwcCBUaGUgUG9ydCB0byBkZXJlZ2lzdGVyXHJcbiAqIEByZXR1cm4ge0Jvb2xlYW59IFdoZXRoZXIgdGhlIGFwcCB3YXMgZGVyZWdpc3RlcmVkLlxyXG4gKi9cclxuSHViLnByb3RvdHlwZS5kZXJlZ2lzdGVyID0gZnVuY3Rpb24gKGFwcCkge1xyXG4gIGlmICghdGhpcy5hcHBzW2FwcC5pZF0pIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbiAgZGVsZXRlIHRoaXMuYXBwc1thcHAuaWRdO1xyXG4gIHJldHVybiB0cnVlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEluc3RhbGwgYSBuZXcgcm91dGUgaW4gdGhlIGh1Yi5cclxuICogQG1ldGhvZCBpbnN0YWxsXHJcbiAqIEBwYXJhbSB7UG9ydH0gc291cmNlIFRoZSBzb3VyY2Ugb2YgdGhlIHJvdXRlLlxyXG4gKiBAcGFyYW0ge1BvcnR9IGRlc3RpbmF0aW9uIFRoZSBkZXN0aW5hdGlvbiBvZiB0aGUgcm91dGUuXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBmbG93IFRoZSBmbG93IHdoZXJlIHRoZSBkZXN0aW5hdGlvbiB3aWxsIHJlY2VpdmUgbWVzc2FnZXMuXHJcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gcXVpZXQgV2hldGhlciBtZXNzYWdlcyBvbiB0aGlzIHJvdXRlIHNob3VsZCBiZSBzdXBwcmVzc2VkLlxyXG4gKiBAcmV0dXJuIHtTdHJpbmd9IEEgcm91dGluZyBzb3VyY2UgaWRlbnRpZmllciBmb3Igc2VuZGluZyBtZXNzYWdlcy5cclxuICovXHJcbkh1Yi5wcm90b3R5cGUuaW5zdGFsbCA9IGZ1bmN0aW9uIChzb3VyY2UsIGRlc3RpbmF0aW9uLCBmbG93LCBxdWlldCkge1xyXG4gIHNvdXJjZSA9IHRoaXMuZ2V0U291cmNlKHNvdXJjZSk7XHJcbiAgaWYgKCFzb3VyY2UpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgaWYgKCFkZXN0aW5hdGlvbikge1xyXG4gICAgdGhpcy5kZWJ1Zy53YXJuKFwiVW53aWxsaW5nIHRvIGdlbmVyYXRlIGJsYWNraG9sZSBmbG93IGZyb20gXCIgKyBzb3VyY2UuaWQpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgdmFyIHJvdXRlID0gdGhpcy5nZW5lcmF0ZVJvdXRlKCk7XHJcbiAgdGhpcy5yb3V0ZXNbcm91dGVdID0ge1xyXG4gICAgYXBwOiBkZXN0aW5hdGlvbixcclxuICAgIGZsb3c6IGZsb3csXHJcbiAgICBzb3VyY2U6IHNvdXJjZS5pZCxcclxuICAgIHF1aWV0OiBxdWlldFxyXG4gIH07XHJcbiAgaWYgKHR5cGVvZiBzb3VyY2Uub24gPT09ICdmdW5jdGlvbicpIHtcclxuICAgIHNvdXJjZS5vbihyb3V0ZSwgdGhpcy5vbk1lc3NhZ2UuYmluZCh0aGlzLCByb3V0ZSkpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJvdXRlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFVuaW5zdGFsbCBhIGh1YiByb3V0ZS5cclxuICogQG1ldGhvZCB1bmluc3RhbGxcclxuICogQHBhcmFtIHtQb3J0fSBzb3VyY2UgVGhlIHNvdXJjZSBvZiB0aGUgcm91dGUuXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBmbG93IFRoZSByb3V0ZSB0byB1bmluc3RhbGwuXHJcbiAqIEByZXR1cm4ge0Jvb2xlYW59IFdoZXRoZXIgdGhlIHJvdXRlIHdhcyBhYmxlIHRvIGJlIHVuaW5zdGFsbGVkLlxyXG4gKi9cclxuSHViLnByb3RvdHlwZS51bmluc3RhbGwgPSBmdW5jdGlvbiAoc291cmNlLCBmbG93KSB7XHJcbiAgc291cmNlID0gdGhpcy5nZXRTb3VyY2Uoc291cmNlKTtcclxuICBpZiAoIXNvdXJjZSkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgdmFyIHJvdXRlID0gdGhpcy5yb3V0ZXNbZmxvd107XHJcbiAgaWYgKCFyb3V0ZSkge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0gZWxzZSBpZiAocm91dGUuc291cmNlICE9PSBzb3VyY2UuaWQpIHtcclxuICAgIHRoaXMuZGVidWcud2FybihcIkZsb3cgXCIgKyBmbG93ICsgXCIgZG9lcyBub3QgYmVsb25nIHRvIHBvcnQgXCIgKyBzb3VyY2UuaWQpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgZGVsZXRlIHRoaXMucm91dGVzW2Zsb3ddO1xyXG4gIGlmICh0eXBlb2Ygc291cmNlLm9mZiA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgc291cmNlLm9mZihyb3V0ZSk7XHJcbiAgfVxyXG4gIHJldHVybiB0cnVlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdlbmVyYXRlIGEgdW5pcXVlIHJvdXRpbmcgaWRlbnRpZmllci5cclxuICogQG1ldGhvZCBnZW5lcmF0ZVJvdXRlXHJcbiAqIEByZXR1cm4ge1N0cmluZ30gYSByb3V0aW5nIHNvdXJjZSBpZGVudGlmaWVyLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxuSHViLnByb3RvdHlwZS5nZW5lcmF0ZVJvdXRlID0gZnVuY3Rpb24gKCkge1xyXG4gIHJldHVybiB1dGlsLmdldElkKCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEh1YjtcclxuIiwiLypqc2xpbnQgaW5kZW50OjIsIG5vZGU6dHJ1ZSwgc2xvcHB5OnRydWUgKi9cbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbi8qKlxuICogQSBsaW5rIGNvbm5lY3RzIHR3byBmcmVlZG9tIGh1YnMuIFRoaXMgaXMgYW4gYWJzdHJhY3QgY2xhc3NcbiAqIHByb3ZpZGluZyBjb21tb24gZnVuY3Rpb25hbGl0eSBvZiB0cmFuc2xhdGluZyBjb250cm9sIGNoYW5uZWxzLFxuICogYW5kIGludGVncmF0aW5nIGNvbmZpZyBpbmZvcm1hdGlvbi5cbiAqIEBjbGFzcyBMaW5rXG4gKiBAaW1wbGVtZW50cyBQb3J0XG4gKiBAY29uc3RydWN0b3JcbiAqL1xudmFyIExpbmsgPSBmdW5jdGlvbiAobmFtZSwgcmVzb3VyY2UpIHtcbiAgdGhpcy5pZCA9ICdMaW5rJyArIE1hdGgucmFuZG9tKCk7XG4gIHRoaXMubmFtZSA9IG5hbWU7XG4gIHRoaXMucmVzb3VyY2UgPSByZXNvdXJjZTtcbiAgdGhpcy5jb25maWcgPSB7fTtcbiAgdGhpcy5zcmMgPSBudWxsO1xuXG4gIHV0aWwuaGFuZGxlRXZlbnRzKHRoaXMpO1xuICB1dGlsLm1peGluKHRoaXMsIExpbmsucHJvdG90eXBlKTtcbn07XG5cbi8qKlxuICogUmVjZWl2ZSBtZXNzYWdlcyBmcm9tIHRoZSBodWIgdG8gdGhpcyBwb3J0LlxuICogTWFuYWdlcyBzdGFydHVwLCBhbmQgcGFzc2VzIG90aGVycyB0byAnZGVsaXZlck1lc3NhZ2UnIGltcGxlbWVudGVkXG4gKiBpbiBkZXJpdmVkIGNsYXNzZXMuXG4gKiBAbWV0aG9kIG9uTWVzc2FnZVxuICogQHBhcmFtIHtTdHJpbmd9IGZsb3cgdGhlIGNoYW5uZWwvZmxvdyBvZiB0aGUgbWVzc2FnZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBtZXNzYWdlIFRoZSBNZXNzYWdlLlxuICovXG5MaW5rLnByb3RvdHlwZS5vbk1lc3NhZ2UgPSBmdW5jdGlvbiAoZmxvdywgbWVzc2FnZSkge1xuICBpZiAoZmxvdyA9PT0gJ2NvbnRyb2wnICYmICF0aGlzLmNvbnRyb2xDaGFubmVsKSB7XG4gICAgaWYgKCF0aGlzLmNvbnRyb2xDaGFubmVsICYmIG1lc3NhZ2UuY2hhbm5lbCkge1xuICAgICAgdGhpcy5jb250cm9sQ2hhbm5lbCA9IG1lc3NhZ2UuY2hhbm5lbDtcbiAgICAgIHV0aWwubWl4aW4odGhpcy5jb25maWcsIG1lc3NhZ2UuY29uZmlnKTtcbiAgICAgIHRoaXMuc3RhcnQoKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5kZWxpdmVyTWVzc2FnZShmbG93LCBtZXNzYWdlKTtcbiAgfVxufTtcblxuLyoqXG4gKiBSZWdpc3RlciBhIGhhbmRsZXIgdG8gYWxlcnQgb2YgZXJyb3JzIG9uIHRoaXMgcG9ydC5cbiAqIEBtZXRob2QgYWRkRXJyb3JIYW5kbGVyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyIE1ldGhvZCB0byBjYWxsIHdpdGggZXJyb3JzLlxuICovXG5MaW5rLnByb3RvdHlwZS5hZGRFcnJvckhhbmRsZXIgPSBmdW5jdGlvbiAoaGFuZGxlcikge1xuICB0aGlzLm9uRXJyb3IgPSBoYW5kbGVyO1xufTtcblxuLyoqXG4gKiBSZXBvcnQgYW4gZXJyb3Igb24gdGhpcyBsaW5rLlxuICogQG1ldGhvZCBvbmVycm9yXG4gKiBAcGFyYW0ge0Vycm9yfSBlcnIgVGhlIGVycm9yIHRoYXQgb2NjdXJyZWQuXG4gKi9cbkxpbmsucHJvdG90eXBlLm9uRXJyb3IgPSBmdW5jdGlvbiAoZXJyKSB7XG4gIC8vRmlsbGVkIGluIGJ5IGFkZEVycm9ySGFuZGxlclxufTtcblxuLyoqXG4gKiBFbWl0IG1lc3NhZ2VzIHRvIHRoZSB0aGUgaHViLCBtYXBwaW5nIGNvbnRyb2wgY2hhbm5lbHMuXG4gKiBAbWV0aG9kIGVtaXRNZXNzYWdlXG4gKiBAcGFyYW0ge1N0cmluZ30gZmxvdyB0aGUgZmxvdyB0byBlbWl0IHRoZSBtZXNzYWdlIG9uLlxuICogQHBhcmFtIHtPYmplY3R9IG1lc3NnYWUgVGhlIG1lc3NhZ2UgdG8gZW1pdC5cbiAqL1xuTGluay5wcm90b3R5cGUuZW1pdE1lc3NhZ2UgPSBmdW5jdGlvbiAoZmxvdywgbWVzc2FnZSkge1xuICBpZiAoZmxvdyA9PT0gJ2NvbnRyb2wnICYmIHRoaXMuY29udHJvbENoYW5uZWwpIHtcbiAgICBmbG93ID0gdGhpcy5jb250cm9sQ2hhbm5lbDtcbiAgfVxuICB0aGlzLmVtaXQoZmxvdywgbWVzc2FnZSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IExpbms7XG4iLCIvKmpzbGludCBpbmRlbnQ6Miwgd2hpdGU6dHJ1ZSwgbm9kZTp0cnVlLCBzbG9wcHk6dHJ1ZSAqL1xuLypnbG9iYWxzIFVSTCx3ZWJraXRVUkwgKi9cbnZhciBMaW5rID0gcmVxdWlyZSgnLi4vbGluaycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbi8qKlxuICogQSBwb3J0IHByb3ZpZGluZyBtZXNzYWdlIHRyYW5zcG9ydCBiZXR3ZWVuIHR3byBmcmVlZG9tIGNvbnRleHRzIHZpYSBpRnJhbWVzLlxuICogQGNsYXNzIEZyYW1lXG4gKiBAZXh0ZW5kcyBMaW5rXG4gKiBAdXNlcyBoYW5kbGVFdmVudHNcbiAqIEBjb25zdHJ1Y3RvclxuICovXG52YXIgRnJhbWUgPSBmdW5jdGlvbihpZCwgcmVzb3VyY2UpIHtcbiAgTGluay5jYWxsKHRoaXMsIGlkLCByZXNvdXJjZSk7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgZG9jdW1lbnQgdG8gdXNlIGZvciB0aGUgZnJhbWUuIFRoaXMgYWxsb3dzIG92ZXJyaWRlcyBpbiBkb3duc3RyZWFtXG4gKiBsaW5rcyB0aGF0IHdhbnQgdG8gZXNzZW50aWFsbHkgbWFrZSBhbiBpRnJhbWUsIGJ1dCBuZWVkIHRvIGRvIGl0IGluIGFub3RoZXJcbiAqIGNvbnRleHQuXG4gKiBAbWV0aG9kIGdldERvY3VtZW50XG4gKiBAcHJvdGVjdGVkXG4gKi9cbkZyYW1lLnByb3RvdHlwZS5nZXREb2N1bWVudCA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5kb2N1bWVudCA9IGRvY3VtZW50O1xuICBpZiAoIXRoaXMuZG9jdW1lbnQuYm9keSkge1xuICAgIHRoaXMuZG9jdW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYm9keVwiKSk7XG4gIH1cbiAgdGhpcy5yb290ID0gZG9jdW1lbnQuYm9keTtcbn07XG5cbi8qKlxuICogU3RhcnQgdGhpcyBwb3J0IGJ5IGxpc3RlbmluZyBvciBjcmVhdGluZyBhIGZyYW1lLlxuICogQG1ldGhvZCBzdGFydFxuICogQHByaXZhdGVcbiAqL1xuRnJhbWUucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmNvbmZpZy5tb2R1bGVDb250ZXh0KSB7XG4gICAgdGhpcy5jb25maWcuZ2xvYmFsLkRFQlVHID0gdHJ1ZTtcbiAgICB0aGlzLnNldHVwTGlzdGVuZXIoKTtcbiAgICB0aGlzLnNyYyA9ICdpbic7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5zZXR1cEZyYW1lKCk7XG4gICAgdGhpcy5zcmMgPSAnb3V0JztcbiAgfVxufTtcblxuLyoqXG4gKiBTdG9wIHRoaXMgcG9ydCBieSBkZWxldGluZyB0aGUgZnJhbWUuXG4gKiBAbWV0aG9kIHN0b3BcbiAqIEBwcml2YXRlXG4gKi9cbkZyYW1lLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKSB7XG4gIC8vIEZ1bmN0aW9uIGlzIGRldGVybWluZWQgYnkgc2V0dXBMaXN0ZW5lciBvciBzZXR1cEZyYW1lIGFzIGFwcHJvcHJpYXRlLlxufTtcblxuLyoqXG4gKiBHZXQgdGhlIHRleHR1YWwgZGVzY3JpcHRpb24gb2YgdGhpcyBwb3J0LlxuICogQG1ldGhvZCB0b1N0cmluZ1xuICogQHJldHVybiB7U3RyaW5nfSB0aGUgZGVzY3JpcHRpb24gb2YgdGhpcyBwb3J0LlxuICovXG5GcmFtZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIFwiW0ZyYW1lXCIgKyB0aGlzLmlkICsgXCJdXCI7XG59O1xuXG4vKipcbiAqIFNldCB1cCBhIGdsb2JhbCBsaXN0ZW5lciB0byBoYW5kbGUgaW5jb21pbmcgbWVzc2FnZXMgdG8gdGhpc1xuICogZnJlZWRvbS5qcyBjb250ZXh0LlxuICogQG1ldGhvZCBzZXR1cExpc3RlbmVyXG4gKi9cbkZyYW1lLnByb3RvdHlwZS5zZXR1cExpc3RlbmVyID0gZnVuY3Rpb24oKSB7XG4gIHZhciBvbk1zZyA9IGZ1bmN0aW9uKG1zZykge1xuICAgIGlmIChtc2cuZGF0YS5zcmMgIT09ICdpbicpIHtcbiAgICAgIHRoaXMuZW1pdE1lc3NhZ2UobXNnLmRhdGEuZmxvdywgbXNnLmRhdGEubWVzc2FnZSk7XG4gICAgfVxuICB9LmJpbmQodGhpcyk7XG4gIHRoaXMub2JqID0gdGhpcy5jb25maWcuZ2xvYmFsO1xuICB0aGlzLm9iai5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgb25Nc2csIHRydWUpO1xuICB0aGlzLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLm9iai5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgb25Nc2csIHRydWUpO1xuICAgIGRlbGV0ZSB0aGlzLm9iajtcbiAgfTtcbiAgdGhpcy5lbWl0KCdzdGFydGVkJyk7XG4gIHRoaXMub2JqLnBvc3RNZXNzYWdlKFwiUmVhZHkgRm9yIE1lc3NhZ2VzXCIsIFwiKlwiKTtcbn07XG5cbi8qKlxuICogR2V0IGEgVVJMIG9mIGEgYmxvYiBvYmplY3QgZm9yIGluY2x1c2lvbiBpbiBhIGZyYW1lLlxuICogUG9seWZpbGxzIGltcGxlbWVudGF0aW9ucyB3aGljaCBkb24ndCBoYXZlIGEgY3VycmVudCBVUkwgb2JqZWN0LCBsaWtlXG4gKiBwaGFudG9tanMuXG4gKiBAbWV0aG9kIGdldFVSTFxuICovXG5GcmFtZS5wcm90b3R5cGUuZ2V0VVJMID0gZnVuY3Rpb24oYmxvYikge1xuICBpZiAodHlwZW9mIFVSTCAhPT0gJ29iamVjdCcgJiYgdHlwZW9mIHdlYmtpdFVSTCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gd2Via2l0VVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcbiAgfVxufTtcblxuLyoqXG4gKiBEZWFsbG9jYXRlIHRoZSBVUkwgb2YgYSBibG9iIG9iamVjdC5cbiAqIFBvbHlmaWxscyBpbXBsZW1lbnRhdGlvbnMgd2hpY2ggZG9uJ3QgaGF2ZSBhIGN1cnJlbnQgVVJMIG9iamVjdCwgbGlrZVxuICogcGhhbnRvbWpzLlxuICogQG1ldGhvZCBnZXRVUkxcbiAqL1xuRnJhbWUucHJvdG90eXBlLnJldm9rZVVSTCA9IGZ1bmN0aW9uKHVybCkge1xuICBpZiAodHlwZW9mIFVSTCAhPT0gJ29iamVjdCcgJiYgdHlwZW9mIHdlYmtpdFVSTCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB3ZWJraXRVUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XG4gIH0gZWxzZSB7XG4gICAgVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xuICB9XG59O1xuXG4vKipcbiAqIFNldCB1cCBhbiBpRnJhbWUgd2l0aCBhbiBpc29sYXRlZCBmcmVlZG9tLmpzIGNvbnRleHQgaW5zaWRlLlxuICogQG1ldGhvZCBzZXR1cEZyYW1lXG4gKi9cbkZyYW1lLnByb3RvdHlwZS5zZXR1cEZyYW1lID0gZnVuY3Rpb24oKSB7XG4gIHZhciBmcmFtZSwgb25Nc2c7XG4gIHRoaXMuZ2V0RG9jdW1lbnQoKTtcbiAgZnJhbWUgPSB0aGlzLm1ha2VGcmFtZSh0aGlzLmNvbmZpZy5zb3VyY2UsIHRoaXMuY29uZmlnLmluamVjdCk7XG4gIFxuICB0aGlzLnJvb3QuYXBwZW5kQ2hpbGQoZnJhbWUpO1xuXG4gIG9uTXNnID0gZnVuY3Rpb24oZnJhbWUsIG1zZykge1xuICAgIGlmICghdGhpcy5vYmopIHtcbiAgICAgIHRoaXMub2JqID0gZnJhbWU7XG4gICAgICB0aGlzLmVtaXQoJ3N0YXJ0ZWQnKTtcbiAgICB9XG4gICAgaWYgKG1zZy5kYXRhLnNyYyAhPT0gJ291dCcpIHtcbiAgICAgIHRoaXMuZW1pdE1lc3NhZ2UobXNnLmRhdGEuZmxvdywgbXNnLmRhdGEubWVzc2FnZSk7XG4gICAgfVxuICB9LmJpbmQodGhpcywgZnJhbWUuY29udGVudFdpbmRvdyk7XG5cbiAgZnJhbWUuY29udGVudFdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgb25Nc2csIHRydWUpO1xuICB0aGlzLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgICBmcmFtZS5jb250ZW50V2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBvbk1zZywgdHJ1ZSk7XG4gICAgaWYgKHRoaXMub2JqKSB7XG4gICAgICBkZWxldGUgdGhpcy5vYmo7XG4gICAgfVxuICAgIHRoaXMucmV2b2tlVVJMKGZyYW1lLnNyYyk7XG4gICAgZnJhbWUuc3JjID0gXCJhYm91dDpibGFua1wiO1xuICAgIHRoaXMucm9vdC5yZW1vdmVDaGlsZChmcmFtZSk7XG4gIH07XG59O1xuXG4vKipcbiAqIE1ha2UgZnJhbWVzIHRvIHJlcGxpY2F0ZSBmcmVlZG9tIGlzb2xhdGlvbiB3aXRob3V0IHdlYi13b3JrZXJzLlxuICogaUZyYW1lIGlzb2xhdGlvbiBpcyBub24tc3RhbmRhcmRpemVkLCBhbmQgYWNjZXNzIHRvIHRoZSBET00gd2l0aGluIGZyYW1lc1xuICogbWVhbnMgdGhhdCB0aGV5IGFyZSBpbnNlY3VyZS4gSG93ZXZlciwgZGVidWdnaW5nIG9mIHdlYndvcmtlcnMgaXNcbiAqIHBhaW5mdWwgZW5vdWdoIHRoYXQgdGhpcyBtb2RlIG9mIGV4ZWN1dGlvbiBjYW4gYmUgdmFsdWFibGUgZm9yIGRlYnVnZ2luZy5cbiAqIEBtZXRob2QgbWFrZUZyYW1lXG4gKi9cbkZyYW1lLnByb3RvdHlwZS5tYWtlRnJhbWUgPSBmdW5jdGlvbihzcmMsIGluamVjdCkge1xuICAvLyBUT0RPKHdpbGxzY290dCk6IGFkZCBzYW5kYm94aW5nIHByb3RlY3Rpb24uXG4gIHZhciBmcmFtZSA9IHRoaXMuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyksXG4gICAgICBleHRyYSA9ICcnLFxuICAgICAgbG9hZGVyLFxuICAgICAgYmxvYjtcblxuICBpZiAoaW5qZWN0KSB7XG4gICAgaWYgKCFpbmplY3QubGVuZ3RoKSB7XG4gICAgICBpbmplY3QgPSBbaW5qZWN0XTtcbiAgICB9XG4gICAgaW5qZWN0LmZvckVhY2goZnVuY3Rpb24oc2NyaXB0KSB7XG4gICAgICBleHRyYSArPSAnPHNjcmlwdCBzcmM9XCInICsgc2NyaXB0ICsgJ1wiIG9uZXJyb3I9XCInICtcbiAgICAgICd0aHJvdyBuZXcgRXJyb3IoXFwnSW5qZWN0aW9uIG9mICcgKyBzY3JpcHQgKycgRmFpbGVkIVxcJyk7JyArXG4gICAgICAnXCI+PC9zY3JpcHQ+JztcbiAgICB9KTtcbiAgfVxuICBsb2FkZXIgPSAnPGh0bWw+PG1ldGEgaHR0cC1lcXVpdj1cIkNvbnRlbnQtdHlwZVwiIGNvbnRlbnQ9XCJ0ZXh0L2h0bWw7JyArXG4gICAgJ2NoYXJzZXQ9VVRGLThcIj4nICsgZXh0cmEgKyAnPHNjcmlwdCBzcmM9XCInICsgc3JjICsgJ1wiIG9uZXJyb3I9XCInICtcbiAgICAndGhyb3cgbmV3IEVycm9yKFxcJ0xvYWRpbmcgb2YgJyArIHNyYyArJyBGYWlsZWQhXFwnKTsnICtcbiAgICAnXCI+PC9zY3JpcHQ+PC9odG1sPic7XG4gIGJsb2IgPSB1dGlsLmdldEJsb2IobG9hZGVyLCAndGV4dC9odG1sJyk7XG4gIGZyYW1lLnNyYyA9IHRoaXMuZ2V0VVJMKGJsb2IpO1xuXG4gIHJldHVybiBmcmFtZTtcbn07XG5cbi8qKlxuICogUmVjZWl2ZSBtZXNzYWdlcyBmcm9tIHRoZSBodWIgdG8gdGhpcyBwb3J0LlxuICogUmVjZWl2ZWQgbWVzc2FnZXMgd2lsbCBiZSBlbWl0dGVkIGZyb20gdGhlIG90aGVyIHNpZGUgb2YgdGhlIHBvcnQuXG4gKiBAbWV0aG9kIGRlbGl2ZXJNZXNzYWdlXG4gKiBAcGFyYW0ge1N0cmluZ30gZmxvdyB0aGUgY2hhbm5lbC9mbG93IG9mIHRoZSBtZXNzYWdlLlxuICogQHBhcmFtIHtPYmplY3R9IG1lc3NhZ2UgVGhlIE1lc3NhZ2UuXG4gKi9cbkZyYW1lLnByb3RvdHlwZS5kZWxpdmVyTWVzc2FnZSA9IGZ1bmN0aW9uKGZsb3csIG1lc3NhZ2UpIHtcbiAgaWYgKHRoaXMub2JqKSB7XG4gICAgLy9mZG9tLmRlYnVnLmxvZygnbWVzc2FnZSBzZW50IHRvIHdvcmtlcjogJywgZmxvdywgbWVzc2FnZSk7XG4gICAgdGhpcy5vYmoucG9zdE1lc3NhZ2Uoe1xuICAgICAgc3JjOiB0aGlzLnNyYyxcbiAgICAgIGZsb3c6IGZsb3csXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgfSwgJyonKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm9uY2UoJ3N0YXJ0ZWQnLCB0aGlzLm9uTWVzc2FnZS5iaW5kKHRoaXMsIGZsb3csIG1lc3NhZ2UpKTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBGcmFtZTtcblxuIiwiLypqc2xpbnQgaW5kZW50OjIsbm9kZTp0cnVlLHNsb3BweTp0cnVlICovXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xudmFyIE1vZHVsZUludGVybmFsID0gcmVxdWlyZSgnLi9tb2R1bGVpbnRlcm5hbCcpO1xuXG4vKipcbiAqIEEgZnJlZWRvbSBwb3J0IHdoaWNoIG1hbmFnZXMgdGhlIGNvbnRyb2wgcGxhbmUgb2Ygb2YgY2hhbmdpbmcgaHViIHJvdXRlcy5cbiAqIEBjbGFzcyBNYW5hZ2VyXG4gKiBAaW1wbGVtZW50cyBQb3J0XG4gKiBAcGFyYW0ge0h1Yn0gaHViIFRoZSByb3V0aW5nIGh1YiB0byBjb250cm9sLlxuICogQHBhcmFtIHtSZXNvdXJjZX0gcmVzb3VyY2UgVGhlIHJlc291cmNlIG1hbmFnZXIgZm9yIHRoZSBydW50aW1lLlxuICogQHBhcmFtIHtBcGl9IGFwaSBUaGUgQVBJIG1hbmFnZXIgZm9yIHRoZSBydW50aW1lLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZhciBNYW5hZ2VyID0gZnVuY3Rpb24gKGh1YiwgcmVzb3VyY2UsIGFwaSkge1xuICB0aGlzLmlkID0gJ2NvbnRyb2wnO1xuICB0aGlzLmNvbmZpZyA9IHt9O1xuICB0aGlzLmNvbnRyb2xGbG93cyA9IHt9O1xuICB0aGlzLmRhdGFGbG93cyA9IHt9O1xuICB0aGlzLmRhdGFGbG93c1t0aGlzLmlkXSA9IFtdO1xuICB0aGlzLnJldmVyc2VGbG93TWFwID0ge307XG5cbiAgdGhpcy5kZWJ1ZyA9IGh1Yi5kZWJ1ZztcbiAgdGhpcy5odWIgPSBodWI7XG4gIHRoaXMucmVzb3VyY2UgPSByZXNvdXJjZTtcbiAgdGhpcy5hcGkgPSBhcGk7XG5cbiAgdGhpcy5kZWxlZ2F0ZSA9IG51bGw7XG4gIHRoaXMudG9EZWxlZ2F0ZSA9IHt9O1xuICBcbiAgdGhpcy5odWIub24oJ2NvbmZpZycsIGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB1dGlsLm1peGluKHRoaXMuY29uZmlnLCBjb25maWcpO1xuICAgIHRoaXMuZW1pdCgnY29uZmlnJyk7XG4gIH0uYmluZCh0aGlzKSk7XG4gIFxuICB1dGlsLmhhbmRsZUV2ZW50cyh0aGlzKTtcbiAgdGhpcy5odWIucmVnaXN0ZXIodGhpcyk7XG59O1xuXG4vKipcbiAqIFByb3ZpZGUgYSB0ZXh0dWFsIGRlc2NyaXB0aW9uIG9mIHRoaXMgcG9ydC5cbiAqIEBtZXRob2QgdG9TdHJpbmdcbiAqIEByZXR1cm4ge1N0cmluZ30gdGhlIGRlc2NyaXB0aW9uIG9mIHRoaXMgcG9ydC5cbiAqL1xuTWFuYWdlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBcIltMb2NhbCBDb250cm9sbGVyXVwiO1xufTtcblxuLyoqXG4gKiBQcm9jZXNzIG1lc3NhZ2VzIHNlbnQgdG8gdGhpcyBwb3J0LlxuICogVGhlIG1hbmFnZXIsIG9yICdjb250cm9sJyBkZXN0aW5hdGlvbiBoYW5kbGVzIHNldmVyYWwgdHlwZXMgb2YgbWVzc2FnZXMsXG4gKiBpZGVudGlmaWVkIGJ5IHRoZSByZXF1ZXN0IHByb3BlcnR5LiAgVGhlIGFjdGlvbnMgYXJlOlxuICogMS4gZGVidWcuIFByaW50cyB0aGUgbWVzc2FnZSB0byB0aGUgY29uc29sZS5cbiAqIDIuIGxpbmsuIENyZWF0ZXMgYSBsaW5rIGJldHdlZW4gdGhlIHNvdXJjZSBhbmQgYSBwcm92aWRlZCBkZXN0aW5hdGlvbiBwb3J0LlxuICogMy4gZW52aXJvbm1lbnQuIEluc3RhbnRpYXRlIGEgbW9kdWxlIGVudmlyb25tZW50IGRlZmluZWQgaW4gTW9kdWxlSW50ZXJuYWwuXG4gKiA0LiBkZWxlZ2F0ZS4gUm91dGVzIGEgZGVmaW5lZCBzZXQgb2YgY29udHJvbCBtZXNzYWdlcyB0byBhbm90aGVyIGxvY2F0aW9uLlxuICogNS4gcmVzb3VyY2UuIFJlZ2lzdGVycyB0aGUgc291cmNlIGFzIGEgcmVzb3VyY2UgcmVzb2x2ZXIuXG4gKiA2LiBjb3JlLiBHZW5lcmF0ZXMgYSBjb3JlIHByb3ZpZGVyIGZvciB0aGUgcmVxdWVzdGVyLlxuICogNy4gY2xvc2UuIFRlYXJzIGRvd24gcm91dGVzIGludm9saW5nIHRoZSByZXF1ZXN0aW5nIHBvcnQuXG4gKiA4LiB1bmxpbmsuIFRlYXJzIGRvd24gYSByb3V0ZSBmcm9tIHRoZSByZXF1ZXN0aW5nIHBvcnQuXG4gKiBAbWV0aG9kIG9uTWVzc2FnZVxuICogQHBhcmFtIHtTdHJpbmd9IGZsb3cgVGhlIHNvdXJjZSBpZGVudGlmaWVyIG9mIHRoZSBtZXNzYWdlLlxuICogQHBhcmFtIHtPYmplY3R9IG1lc3NhZ2UgVGhlIHJlY2VpdmVkIG1lc3NhZ2UuXG4gKi9cbk1hbmFnZXIucHJvdG90eXBlLm9uTWVzc2FnZSA9IGZ1bmN0aW9uIChmbG93LCBtZXNzYWdlKSB7XG4gIHZhciByZXZlcnNlRmxvdyA9IHRoaXMuY29udHJvbEZsb3dzW2Zsb3ddLCBvcmlnaW47XG4gIGlmICghcmV2ZXJzZUZsb3cpIHtcbiAgICB0aGlzLmRlYnVnLndhcm4oXCJVbmtub3duIG1lc3NhZ2Ugc291cmNlOiBcIiArIGZsb3cpO1xuICAgIHJldHVybjtcbiAgfVxuICBvcmlnaW4gPSB0aGlzLmh1Yi5nZXREZXN0aW5hdGlvbihyZXZlcnNlRmxvdyk7XG5cbiAgaWYgKHRoaXMuZGVsZWdhdGUgJiYgcmV2ZXJzZUZsb3cgIT09IHRoaXMuZGVsZWdhdGUgJiZcbiAgICAgIHRoaXMudG9EZWxlZ2F0ZVtmbG93XSkge1xuICAgIC8vIFNoaXAgb2ZmIHRvIHRoZSBkZWxlZ2VlXG4gICAgdGhpcy5lbWl0KHRoaXMuZGVsZWdhdGUsIHtcbiAgICAgIHR5cGU6ICdEZWxlZ2F0aW9uJyxcbiAgICAgIHJlcXVlc3Q6ICdoYW5kbGUnLFxuICAgICAgcXVpZXQ6IHRydWUsXG4gICAgICBmbG93OiBmbG93LFxuICAgICAgbWVzc2FnZTogbWVzc2FnZVxuICAgIH0pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChtZXNzYWdlLnJlcXVlc3QgPT09ICdkZWJ1ZycpIHtcbiAgICB0aGlzLmRlYnVnLnByaW50KG1lc3NhZ2UpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChtZXNzYWdlLnJlcXVlc3QgPT09ICdsaW5rJykge1xuICAgIHRoaXMuY3JlYXRlTGluayhvcmlnaW4sIG1lc3NhZ2UubmFtZSwgbWVzc2FnZS50bywgbWVzc2FnZS5vdmVycmlkZURlc3QpO1xuICB9IGVsc2UgaWYgKG1lc3NhZ2UucmVxdWVzdCA9PT0gJ2Vudmlyb25tZW50Jykge1xuICAgIHRoaXMuY3JlYXRlTGluayhvcmlnaW4sIG1lc3NhZ2UubmFtZSwgbmV3IE1vZHVsZUludGVybmFsKHRoaXMpKTtcbiAgfSBlbHNlIGlmIChtZXNzYWdlLnJlcXVlc3QgPT09ICdkZWxlZ2F0ZScpIHtcbiAgICAvLyBJbml0YXRlIERlbGVnYXRpb24uXG4gICAgaWYgKHRoaXMuZGVsZWdhdGUgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuZGVsZWdhdGUgPSByZXZlcnNlRmxvdztcbiAgICB9XG4gICAgdGhpcy50b0RlbGVnYXRlW21lc3NhZ2UuZmxvd10gPSB0cnVlO1xuICAgIHRoaXMuZW1pdCgnZGVsZWdhdGUnKTtcbiAgfSBlbHNlIGlmIChtZXNzYWdlLnJlcXVlc3QgPT09ICdyZXNvdXJjZScpIHtcbiAgICB0aGlzLnJlc291cmNlLmFkZFJlc29sdmVyKG1lc3NhZ2UuYXJnc1swXSk7XG4gICAgdGhpcy5yZXNvdXJjZS5hZGRSZXRyaWV2ZXIobWVzc2FnZS5zZXJ2aWNlLCBtZXNzYWdlLmFyZ3NbMV0pO1xuICB9IGVsc2UgaWYgKG1lc3NhZ2UucmVxdWVzdCA9PT0gJ2NvcmUnKSB7XG4gICAgaWYgKHRoaXMuY29yZSAmJiByZXZlcnNlRmxvdyA9PT0gdGhpcy5kZWxlZ2F0ZSkge1xuICAgICAgKG5ldyB0aGlzLmNvcmUoKSkub25NZXNzYWdlKG9yaWdpbiwgbWVzc2FnZS5tZXNzYWdlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5nZXRDb3JlKGZ1bmN0aW9uICh0bywgY29yZSkge1xuICAgICAgdGhpcy5odWIub25NZXNzYWdlKHRvLCB7XG4gICAgICAgIHR5cGU6ICdjb3JlJyxcbiAgICAgICAgY29yZTogY29yZVxuICAgICAgfSk7XG4gICAgfS5iaW5kKHRoaXMsIHJldmVyc2VGbG93KSk7XG4gIH0gZWxzZSBpZiAobWVzc2FnZS5yZXF1ZXN0ID09PSAnY2xvc2UnKSB7XG4gICAgdGhpcy5kZXN0cm95KG9yaWdpbik7XG4gIH0gZWxzZSBpZiAobWVzc2FnZS5yZXF1ZXN0ID09PSAndW5saW5rJykge1xuICAgIHRoaXMucmVtb3ZlTGluayhvcmlnaW4sIG1lc3NhZ2UudG8pO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuZGVidWcud2FybihcIlVua25vd24gY29udHJvbCByZXF1ZXN0OiBcIiArIG1lc3NhZ2UucmVxdWVzdCk7XG4gICAgdGhpcy5kZWJ1Zy5sb2coSlNPTi5zdHJpbmdpZnkobWVzc2FnZSkpO1xuICAgIHJldHVybjtcbiAgfVxufTtcblxuLyoqXG4gKiBHZXQgdGhlIHBvcnQgbWVzc2FnZXMgd2lsbCBiZSByb3V0ZWQgdG8gZ2l2ZW4gaXRzIGlkLlxuICogQG1ldGhvZCBnZXRQb3J0XG4gKiBAcGFyYW0ge1N0cmluZ30gcG9ydElkIFRoZSBJRCBvZiB0aGUgcG9ydC5cbiAqIEByZXR1cm5zIHtmZG9tLlBvcnR9IFRoZSBwb3J0IHdpdGggdGhhdCBJRC5cbiAqL1xuTWFuYWdlci5wcm90b3R5cGUuZ2V0UG9ydCA9IGZ1bmN0aW9uIChwb3J0SWQpIHtcbiAgcmV0dXJuIHRoaXMuaHViLmdldERlc3RpbmF0aW9uKHRoaXMuY29udHJvbEZsb3dzW3BvcnRJZF0pO1xufTtcblxuLyoqXG4gKiBTZXQgdXAgYSBwb3J0IHdpdGggdGhlIGh1Yi5cbiAqIEBtZXRob2Qgc2V0dXBcbiAqIEBwYXJhbSB7UG9ydH0gcG9ydCBUaGUgcG9ydCB0byByZWdpc3Rlci5cbiAqL1xuTWFuYWdlci5wcm90b3R5cGUuc2V0dXAgPSBmdW5jdGlvbiAocG9ydCkge1xuICBpZiAoIXBvcnQuaWQpIHtcbiAgICB0aGlzLmRlYnVnLndhcm4oXCJSZWZ1c2luZyB0byBzZXR1cCB1bmlkZW50aWZpZWQgcG9ydCBcIik7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKHRoaXMuY29udHJvbEZsb3dzW3BvcnQuaWRdKSB7XG4gICAgdGhpcy5kZWJ1Zy53YXJuKFwiUmVmdXNpbmcgdG8gcmUtaW5pdGlhbGl6ZSBwb3J0IFwiICsgcG9ydC5pZCk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKCF0aGlzLmNvbmZpZy5nbG9iYWwpIHtcbiAgICB0aGlzLm9uY2UoJ2NvbmZpZycsIHRoaXMuc2V0dXAuYmluZCh0aGlzLCBwb3J0KSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGhpcy5odWIucmVnaXN0ZXIocG9ydCk7XG4gIHZhciBmbG93ID0gdGhpcy5odWIuaW5zdGFsbCh0aGlzLCBwb3J0LmlkLCBcImNvbnRyb2xcIiksXG4gICAgcmV2ZXJzZSA9IHRoaXMuaHViLmluc3RhbGwocG9ydCwgdGhpcy5pZCwgcG9ydC5pZCk7XG4gIHRoaXMuY29udHJvbEZsb3dzW3BvcnQuaWRdID0gZmxvdztcbiAgdGhpcy5kYXRhRmxvd3NbcG9ydC5pZF0gPSBbcmV2ZXJzZV07XG4gIHRoaXMucmV2ZXJzZUZsb3dNYXBbZmxvd10gPSByZXZlcnNlO1xuICB0aGlzLnJldmVyc2VGbG93TWFwW3JldmVyc2VdID0gZmxvdztcblxuICBpZiAocG9ydC5saW5lYWdlKSB7XG4gICAgdGhpcy5lbWl0KCdtb2R1bGVBZGQnLCB7aWQ6IHBvcnQuaWQsIGxpbmVhZ2U6IHBvcnQubGluZWFnZX0pO1xuICB9XG4gIFxuICB0aGlzLmh1Yi5vbk1lc3NhZ2UoZmxvdywge1xuICAgIHR5cGU6ICdzZXR1cCcsXG4gICAgY2hhbm5lbDogcmV2ZXJzZSxcbiAgICBjb25maWc6IHRoaXMuY29uZmlnXG4gIH0pO1xuXG4gIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBUZWFyIGRvd24gYSBwb3J0IG9uIHRoZSBodWIuXG4gKiBAbWV0aG9kIGRlc3Ryb3lcbiAqIEBhcHJhbSB7UG9ydH0gcG9ydCBUaGUgcG9ydCB0byB1bnJlZ2lzdGVyLlxuICovXG5NYW5hZ2VyLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKHBvcnQpIHtcbiAgaWYgKCFwb3J0LmlkKSB7XG4gICAgdGhpcy5kZWJ1Zy53YXJuKFwiVW5hYmxlIHRvIHRlYXIgZG93biB1bmlkZW50aWZpZWQgcG9ydFwiKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAocG9ydC5saW5lYWdlKSB7XG4gICAgdGhpcy5lbWl0KCdtb2R1bGVSZW1vdmUnLCB7aWQ6IHBvcnQuaWQsIGxpbmVhZ2U6IHBvcnQubGluZWFnZX0pO1xuICB9XG5cbiAgLy8gUmVtb3ZlIHRoZSBwb3J0LlxuICBkZWxldGUgdGhpcy5jb250cm9sRmxvd3NbcG9ydC5pZF07XG5cbiAgLy8gUmVtb3ZlIGFzc29jaWF0ZWQgbGlua3MuXG4gIHZhciBpO1xuICBmb3IgKGkgPSB0aGlzLmRhdGFGbG93c1twb3J0LmlkXS5sZW5ndGggLSAxOyBpID49IDA7IGkgLT0gMSkge1xuICAgIHRoaXMucmVtb3ZlTGluayhwb3J0LCB0aGlzLmRhdGFGbG93c1twb3J0LmlkXVtpXSk7XG4gIH1cblxuICAvLyBSZW1vdmUgdGhlIHBvcnQuXG4gIGRlbGV0ZSB0aGlzLmRhdGFGbG93c1twb3J0LmlkXTtcbiAgdGhpcy5odWIuZGVyZWdpc3Rlcihwb3J0KTtcbn07XG5cbi8qKlxuICogQ3JlYXRlIGEgbGluayBiZXR3ZWVuIHR3byBwb3J0cy4gIExpbmtzIGFyZSBjcmVhdGVkIGluIGJvdGggZGlyZWN0aW9ucyxcbiAqIGFuZCBhIG1lc3NhZ2Ugd2l0aCB0aG9zZSBjYXBhYmlsaXRpZXMgaXMgc2VudCB0byB0aGUgc291cmNlIHBvcnQuXG4gKiBAbWV0aG9kIGNyZWF0ZUxpbmtcbiAqIEBwYXJhbSB7UG9ydH0gcG9ydCBUaGUgc291cmNlIHBvcnQuXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBUaGUgZmxvdyBmb3IgbWVzc2FnZXMgZnJvbSBkZXN0aW5hdGlvbiB0byBwb3J0LlxuICogQHBhcmFtIHtQb3J0fSBkZXN0aW5hdGlvbiBUaGUgZGVzdGluYXRpb24gcG9ydC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBbZGVzdE5hbWVdIFRoZSBmbG93IG5hbWUgZm9yIG1lc3NhZ2VzIHRvIHRoZSBkZXN0aW5hdGlvbi5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW3RvRGVzdF0gVGVsbCB0aGUgZGVzdGluYXRpb24gYWJvdXQgdGhlIGxpbmsuXG4gKi9cbk1hbmFnZXIucHJvdG90eXBlLmNyZWF0ZUxpbmsgPSBmdW5jdGlvbiAocG9ydCwgbmFtZSwgZGVzdGluYXRpb24sIGRlc3ROYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b0Rlc3QpIHtcbiAgaWYgKCF0aGlzLmNvbmZpZy5nbG9iYWwpIHtcbiAgICB0aGlzLm9uY2UoJ2NvbmZpZycsXG4gICAgICB0aGlzLmNyZWF0ZUxpbmsuYmluZCh0aGlzLCBwb3J0LCBuYW1lLCBkZXN0aW5hdGlvbiwgZGVzdE5hbWUpKTtcbiAgICByZXR1cm47XG4gIH1cbiAgXG4gIGlmICghdGhpcy5jb250cm9sRmxvd3NbcG9ydC5pZF0pIHtcbiAgICB0aGlzLmRlYnVnLndhcm4oJ1Vud2lsbGluZyB0byBsaW5rIGZyb20gbm9uLXJlZ2lzdGVyZWQgc291cmNlLicpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICghdGhpcy5jb250cm9sRmxvd3NbZGVzdGluYXRpb24uaWRdKSB7XG4gICAgaWYgKHRoaXMuc2V0dXAoZGVzdGluYXRpb24pID09PSBmYWxzZSkge1xuICAgICAgdGhpcy5kZWJ1Zy53YXJuKCdDb3VsZCBub3QgZmluZCBvciBzZXR1cCBkZXN0aW5hdGlvbi4nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cbiAgdmFyIHF1aWV0ID0gZGVzdGluYXRpb24ucXVpZXQgfHwgZmFsc2UsXG4gICAgb3V0Z29pbmdOYW1lID0gZGVzdE5hbWUgfHwgJ2RlZmF1bHQnLFxuICAgIG91dGdvaW5nID0gdGhpcy5odWIuaW5zdGFsbChwb3J0LCBkZXN0aW5hdGlvbi5pZCwgb3V0Z29pbmdOYW1lLCBxdWlldCksXG4gICAgcmV2ZXJzZTtcblxuICAvLyBSZWNvdmVyIHRoZSBwb3J0IHNvIHRoYXQgbGlzdGVuZXJzIGFyZSBpbnN0YWxsZWQuXG4gIGRlc3RpbmF0aW9uID0gdGhpcy5odWIuZ2V0RGVzdGluYXRpb24ob3V0Z29pbmcpO1xuICByZXZlcnNlID0gdGhpcy5odWIuaW5zdGFsbChkZXN0aW5hdGlvbiwgcG9ydC5pZCwgbmFtZSwgcXVpZXQpO1xuXG4gIHRoaXMucmV2ZXJzZUZsb3dNYXBbb3V0Z29pbmddID0gcmV2ZXJzZTtcbiAgdGhpcy5kYXRhRmxvd3NbcG9ydC5pZF0ucHVzaChvdXRnb2luZyk7XG4gIHRoaXMucmV2ZXJzZUZsb3dNYXBbcmV2ZXJzZV0gPSBvdXRnb2luZztcbiAgdGhpcy5kYXRhRmxvd3NbZGVzdGluYXRpb24uaWRdLnB1c2gocmV2ZXJzZSk7XG5cbiAgaWYgKHRvRGVzdCkge1xuICAgIHRoaXMuaHViLm9uTWVzc2FnZSh0aGlzLmNvbnRyb2xGbG93c1tkZXN0aW5hdGlvbi5pZF0sIHtcbiAgICAgIHR5cGU6ICdjcmVhdGVMaW5rJyxcbiAgICAgIG5hbWU6IG91dGdvaW5nTmFtZSxcbiAgICAgIGNoYW5uZWw6IHJldmVyc2UsXG4gICAgICByZXZlcnNlOiBvdXRnb2luZ1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuaHViLm9uTWVzc2FnZSh0aGlzLmNvbnRyb2xGbG93c1twb3J0LmlkXSwge1xuICAgICAgbmFtZTogbmFtZSxcbiAgICAgIHR5cGU6ICdjcmVhdGVMaW5rJyxcbiAgICAgIGNoYW5uZWw6IG91dGdvaW5nLFxuICAgICAgcmV2ZXJzZTogcmV2ZXJzZVxuICAgIH0pO1xuICB9XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhIGxpbmsgYmV0d2VlbiB0byBwb3J0cy4gVGhlIHJldmVyc2UgbGluayB3aWxsIGFsc28gYmUgcmVtb3ZlZC5cbiAqIEBtZXRob2QgcmVtb3ZlTGlua1xuICogQHBhcmFtIHtQb3J0fSBwb3J0IFRoZSBzb3VyY2UgcG9ydC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBmbG93IHRvIGJlIHJlbW92ZWQuXG4gKi9cbk1hbmFnZXIucHJvdG90eXBlLnJlbW92ZUxpbmsgPSBmdW5jdGlvbiAocG9ydCwgbmFtZSkge1xuICB2YXIgcmV2ZXJzZSA9IHRoaXMuaHViLmdldERlc3RpbmF0aW9uKG5hbWUpLFxuICAgIHJmbG93ID0gdGhpcy5yZXZlcnNlRmxvd01hcFtuYW1lXSxcbiAgICBpO1xuXG4gIGlmICghcmV2ZXJzZSB8fCAhcmZsb3cpIHtcbiAgICB0aGlzLmRlYnVnLndhcm4oXCJDb3VsZCBub3QgZmluZCBtZXRhZGF0YSB0byByZW1vdmUgZmxvdzogXCIgKyBuYW1lKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAodGhpcy5odWIuZ2V0RGVzdGluYXRpb24ocmZsb3cpLmlkICE9PSBwb3J0LmlkKSB7XG4gICAgdGhpcy5kZWJ1Zy53YXJuKFwiU291cmNlIHBvcnQgZG9lcyBub3Qgb3duIGZsb3cgXCIgKyBuYW1lKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBOb3RpZnkgcG9ydHMgdGhhdCBhIGNoYW5uZWwgaXMgY2xvc2luZy5cbiAgaSA9IHRoaXMuY29udHJvbEZsb3dzW3BvcnQuaWRdO1xuICBpZiAoaSkge1xuICAgIHRoaXMuaHViLm9uTWVzc2FnZShpLCB7XG4gICAgICB0eXBlOiAnY2xvc2UnLFxuICAgICAgY2hhbm5lbDogbmFtZVxuICAgIH0pO1xuICB9XG4gIGkgPSB0aGlzLmNvbnRyb2xGbG93c1tyZXZlcnNlLmlkXTtcbiAgaWYgKGkpIHtcbiAgICB0aGlzLmh1Yi5vbk1lc3NhZ2UoaSwge1xuICAgICAgdHlwZTogJ2Nsb3NlJyxcbiAgICAgIGNoYW5uZWw6IHJmbG93XG4gICAgfSk7XG4gIH1cblxuICAvLyBVbmluc3RhbGwgdGhlIGNoYW5uZWwuXG4gIHRoaXMuaHViLnVuaW5zdGFsbChwb3J0LCBuYW1lKTtcbiAgdGhpcy5odWIudW5pbnN0YWxsKHJldmVyc2UsIHJmbG93KTtcblxuICBkZWxldGUgdGhpcy5yZXZlcnNlRmxvd01hcFtuYW1lXTtcbiAgZGVsZXRlIHRoaXMucmV2ZXJzZUZsb3dNYXBbcmZsb3ddO1xuICB0aGlzLmZvcmdldEZsb3cocmV2ZXJzZS5pZCwgcmZsb3cpO1xuICB0aGlzLmZvcmdldEZsb3cocG9ydC5pZCwgbmFtZSk7XG59O1xuXG4vKipcbiAqIEZvcmdldCB0aGUgZmxvdyBmcm9tIGlkIHdpdGggYSBnaXZlbiBuYW1lLlxuICogQG1ldGhvZCBmb3JnZXRGbG93XG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtTdHJpbmd9IGlkIFRoZSBwb3J0IElEIG9mIHRoZSBzb3VyY2UuXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBUaGUgZmxvdyBuYW1lLlxuICovXG5NYW5hZ2VyLnByb3RvdHlwZS5mb3JnZXRGbG93ID0gZnVuY3Rpb24gKGlkLCBuYW1lKSB7XG4gIHZhciBpO1xuICBpZiAodGhpcy5kYXRhRmxvd3NbaWRdKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZGF0YUZsb3dzW2lkXS5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgaWYgKHRoaXMuZGF0YUZsb3dzW2lkXVtpXSA9PT0gbmFtZSkge1xuICAgICAgICB0aGlzLmRhdGFGbG93c1tpZF0uc3BsaWNlKGksIDEpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogR2V0IHRoZSBjb3JlIGZyZWVkb20uanMgQVBJIGFjdGl2ZSBvbiB0aGUgY3VycmVudCBodWIuXG4gKiBAbWV0aG9kIGdldENvcmVcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiBDYWxsYmFjayB0byBmaXJlIHdpdGggdGhlIGNvcmUgb2JqZWN0LlxuICovXG5NYW5hZ2VyLnByb3RvdHlwZS5nZXRDb3JlID0gZnVuY3Rpb24gKGNiKSB7XG4gIGlmICh0aGlzLmNvcmUpIHtcbiAgICBjYih0aGlzLmNvcmUpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuYXBpLmdldENvcmUoJ2NvcmUnLCB0aGlzKS50aGVuKGZ1bmN0aW9uIChjb3JlKSB7XG4gICAgICB0aGlzLmNvcmUgPSBjb3JlO1xuICAgICAgY2IodGhpcy5jb3JlKTtcbiAgICB9LmJpbmQodGhpcykpO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1hbmFnZXI7XG4iLCIvKmpzbGludCBpbmRlbnQ6Mixub2RlOnRydWUsc2xvcHB5OnRydWUgKi9cbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG52YXIgUHJvdmlkZXIgPSByZXF1aXJlKCcuL3Byb3ZpZGVyJyk7XG5cbi8qKlxuICogVGhlIGV4dGVybmFsIFBvcnQgZmFjZSBvZiBhIG1vZHVsZSBvbiBhIGh1Yi5cbiAqIEBjbGFzcyBNb2R1bGVcbiAqIEBleHRlbmRzIFBvcnRcbiAqIEBwYXJhbSB7U3RyaW5nfSBtYW5pZmVzdFVSTCBUaGUgbWFuaWZlc3QgdGhpcyBtb2R1bGUgbG9hZHMuXG4gKiBAcGFyYW0ge1N0cmluZ1tdfSBjcmVhdG9yIFRoZSBsaW5lYWdlIG9mIGNyZWF0aW9uIGZvciB0aGlzIG1vZHVsZS5cbiAqIEBwYXJhbSB7UG9saWN5fSBQb2xpY3kgVGhlIHBvbGljeSBsb2FkZXIgZm9yIGRlcGVuZGVuY2llcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG52YXIgTW9kdWxlID0gZnVuY3Rpb24gKG1hbmlmZXN0VVJMLCBtYW5pZmVzdCwgY3JlYXRvciwgcG9saWN5KSB7XG4gIHRoaXMuYXBpID0gcG9saWN5LmFwaTtcbiAgdGhpcy5wb2xpY3kgPSBwb2xpY3k7XG4gIHRoaXMucmVzb3VyY2UgPSBwb2xpY3kucmVzb3VyY2U7XG4gIHRoaXMuZGVidWcgPSBwb2xpY3kuZGVidWc7XG5cbiAgdGhpcy5jb25maWcgPSB7fTtcblxuICB0aGlzLmlkID0gbWFuaWZlc3RVUkwgKyBNYXRoLnJhbmRvbSgpO1xuICB0aGlzLm1hbmlmZXN0SWQgPSBtYW5pZmVzdFVSTDtcbiAgdGhpcy5tYW5pZmVzdCA9IG1hbmlmZXN0O1xuICB0aGlzLmxpbmVhZ2UgPSBbdGhpcy5tYW5pZmVzdElkXS5jb25jYXQoY3JlYXRvcik7XG5cbiAgdGhpcy5xdWlldCA9IHRoaXMubWFuaWZlc3QucXVpZXQgfHwgZmFsc2U7XG5cbiAgdGhpcy5leHRlcm5hbFBvcnRNYXAgPSB7fTtcbiAgdGhpcy5pbnRlcm5hbFBvcnRNYXAgPSB7fTtcbiAgdGhpcy5kZXBlbmRhbnRDaGFubmVscyA9IFtdO1xuICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcblxuICB1dGlsLmhhbmRsZUV2ZW50cyh0aGlzKTtcbn07XG5cbi8qKlxuICogUmVjZWl2ZSBhIG1lc3NhZ2UgZm9yIHRoZSBNb2R1bGUuXG4gKiBAbWV0aG9kIG9uTWVzc2FnZVxuICogQHBhcmFtIHtTdHJpbmd9IGZsb3cgVGhlIG9yaWdpbiBvZiB0aGUgbWVzc2FnZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBtZXNzYWdlIFRoZSBtZXNzYWdlIHJlY2VpdmVkLlxuICovXG5Nb2R1bGUucHJvdG90eXBlLm9uTWVzc2FnZSA9IGZ1bmN0aW9uIChmbG93LCBtZXNzYWdlKSB7XG4gIGlmIChmbG93ID09PSAnY29udHJvbCcpIHtcbiAgICBpZiAobWVzc2FnZS50eXBlID09PSAnc2V0dXAnKSB7XG4gICAgICB0aGlzLmNvbnRyb2xDaGFubmVsID0gbWVzc2FnZS5jaGFubmVsO1xuICAgICAgdXRpbC5taXhpbih0aGlzLmNvbmZpZywgbWVzc2FnZS5jb25maWcpO1xuICAgICAgdGhpcy5lbWl0KHRoaXMuY29udHJvbENoYW5uZWwsIHtcbiAgICAgICAgdHlwZTogJ0NvcmUgUHJvdmlkZXInLFxuICAgICAgICByZXF1ZXN0OiAnY29yZSdcbiAgICAgIH0pO1xuICAgICAgdGhpcy5zdGFydCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZiAobWVzc2FnZS50eXBlID09PSAnY3JlYXRlTGluaycgJiYgbWVzc2FnZS5jaGFubmVsKSB7XG4gICAgICB0aGlzLmRlYnVnLmRlYnVnKHRoaXMgKyAnZ290IGNyZWF0ZSBsaW5rIGZvciAnICsgbWVzc2FnZS5uYW1lKTtcbiAgICAgIHRoaXMuZXh0ZXJuYWxQb3J0TWFwW21lc3NhZ2UubmFtZV0gPSBtZXNzYWdlLmNoYW5uZWw7XG4gICAgICBpZiAodGhpcy5pbnRlcm5hbFBvcnRNYXBbbWVzc2FnZS5uYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMuaW50ZXJuYWxQb3J0TWFwW21lc3NhZ2UubmFtZV0gPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHZhciBtc2cgPSB7XG4gICAgICAgIHR5cGU6ICdkZWZhdWx0IGNoYW5uZWwgYW5ub3VuY2VtZW50JyxcbiAgICAgICAgY2hhbm5lbDogbWVzc2FnZS5yZXZlcnNlXG4gICAgICB9O1xuICAgICAgaWYgKHRoaXMubWFuaWZlc3QuZGVwZW5kZW5jaWVzICYmXG4gICAgICAgICAgdGhpcy5tYW5pZmVzdC5kZXBlbmRlbmNpZXNbbWVzc2FnZS5uYW1lXSkge1xuICAgICAgICBtc2cuYXBpID0gdGhpcy5tYW5pZmVzdC5kZXBlbmRlbmNpZXNbbWVzc2FnZS5uYW1lXS5hcGk7XG4gICAgICB9XG4gICAgICB0aGlzLmVtaXQobWVzc2FnZS5jaGFubmVsLCBtc2cpO1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZiAobWVzc2FnZS5jb3JlKSB7XG4gICAgICB0aGlzLmNvcmUgPSBuZXcgbWVzc2FnZS5jb3JlKCk7XG4gICAgICB0aGlzLmVtaXQoJ2NvcmUnLCBtZXNzYWdlLmNvcmUpO1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZiAobWVzc2FnZS50eXBlID09PSAnY2xvc2UnKSB7XG4gICAgICAvLyBDbG9zaW5nIGNoYW5uZWwuXG4gICAgICBpZiAobWVzc2FnZS5jaGFubmVsID09PSAnY29udHJvbCcpIHtcbiAgICAgICAgdGhpcy5zdG9wKCk7XG4gICAgICB9XG4gICAgICB0aGlzLmRlcmVnaXN0ZXJGbG93KG1lc3NhZ2UuY2hhbm5lbCwgZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnBvcnQub25NZXNzYWdlKGZsb3csIG1lc3NhZ2UpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoKHRoaXMuZXh0ZXJuYWxQb3J0TWFwW2Zsb3ddID09PSBmYWxzZSB8fFxuICAgICAgICAhdGhpcy5leHRlcm5hbFBvcnRNYXBbZmxvd10pICYmIG1lc3NhZ2UuY2hhbm5lbCkge1xuICAgICAgdGhpcy5kZWJ1Zy5kZWJ1Zyh0aGlzICsgJ2hhbmRsaW5nIGNoYW5uZWwgYW5ub3VuY2VtZW50IGZvciAnICsgZmxvdyk7XG4gICAgICB0aGlzLmV4dGVybmFsUG9ydE1hcFtmbG93XSA9IG1lc3NhZ2UuY2hhbm5lbDtcbiAgICAgIGlmICh0aGlzLmludGVybmFsUG9ydE1hcFtmbG93XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMuaW50ZXJuYWxQb3J0TWFwW2Zsb3ddID0gZmFsc2U7XG5cbiAgICAgICAgLy8gTmV3IGluY29taW5nIGNvbm5lY3Rpb24gYXR0ZW1wdHMgc2hvdWxkIGdldCByb3V0ZWQgdG8gbW9kSW50ZXJuYWwuXG4gICAgICAgIGlmICh0aGlzLm1hbmlmZXN0LnByb3ZpZGVzICYmIHRoaXMubW9kSW50ZXJuYWwpIHtcbiAgICAgICAgICB0aGlzLnBvcnQub25NZXNzYWdlKHRoaXMubW9kSW50ZXJuYWwsIHtcbiAgICAgICAgICAgIHR5cGU6ICdDb25uZWN0aW9uJyxcbiAgICAgICAgICAgIGNoYW5uZWw6IGZsb3csXG4gICAgICAgICAgICBhcGk6IG1lc3NhZ2UuYXBpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5tYW5pZmVzdC5wcm92aWRlcykge1xuICAgICAgICAgIHRoaXMub25jZSgnbW9kSW50ZXJuYWwnLCBmdW5jdGlvbiAoZmxvdywgYXBpKSB7XG4gICAgICAgICAgICB0aGlzLnBvcnQub25NZXNzYWdlKHRoaXMubW9kSW50ZXJuYWwsIHtcbiAgICAgICAgICAgICAgdHlwZTogJ0Nvbm5lY3Rpb24nLFxuICAgICAgICAgICAgICBjaGFubmVsOiBmbG93LFxuICAgICAgICAgICAgICBhcGk6IGFwaVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfS5iaW5kKHRoaXMsIGZsb3csIG1lc3NhZ2UuYXBpKSk7XG4gICAgICAgIC8vIEZpcnN0IGNvbm5lY3Rpb24gcmV0YWlucyBsZWdhY3kgbWFwcGluZyBhcyAnZGVmYXVsdCcuXG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuZXh0ZXJuYWxQb3J0TWFwWydkZWZhdWx0J10gJiYgbWVzc2FnZS5jaGFubmVsKSB7XG4gICAgICAgICAgdGhpcy5leHRlcm5hbFBvcnRNYXBbJ2RlZmF1bHQnXSA9IG1lc3NhZ2UuY2hhbm5lbDtcbiAgICAgICAgICB0aGlzLm9uY2UoJ2ludGVybmFsQ2hhbm5lbFJlYWR5JywgZnVuY3Rpb24gKGZsb3cpIHtcbiAgICAgICAgICAgIHRoaXMuaW50ZXJuYWxQb3J0TWFwW2Zsb3ddID0gdGhpcy5pbnRlcm5hbFBvcnRNYXBbJ2RlZmF1bHQnXTtcbiAgICAgICAgICB9LmJpbmQodGhpcywgZmxvdykpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmICghdGhpcy5zdGFydGVkKSB7XG4gICAgICB0aGlzLm9uY2UoJ3N0YXJ0JywgdGhpcy5vbk1lc3NhZ2UuYmluZCh0aGlzLCBmbG93LCBtZXNzYWdlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLmludGVybmFsUG9ydE1hcFtmbG93XSA9PT0gZmFsc2UpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCd3YWl0aW5nIG9uIGludGVybmFsIGNoYW5uZWwgZm9yIG1zZycpO1xuICAgICAgICB0aGlzLm9uY2UoJ2ludGVybmFsQ2hhbm5lbFJlYWR5JywgdGhpcy5vbk1lc3NhZ2UuYmluZCh0aGlzLCBmbG93LCBtZXNzYWdlKSk7XG4gICAgICB9IGVsc2UgaWYgKCF0aGlzLmludGVybmFsUG9ydE1hcFtmbG93XSkge1xuICAgICAgICB0aGlzLmRlYnVnLmVycm9yKCdVbmV4cGVjdGVkIG1lc3NhZ2UgZnJvbSAnICsgZmxvdyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucG9ydC5vbk1lc3NhZ2UodGhpcy5pbnRlcm5hbFBvcnRNYXBbZmxvd10sIG1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDbGVhbiB1cCBhZnRlciBhIGZsb3cgd2hpY2ggaXMgbm8gbG9uZ2VyIHVzZWQgLyBuZWVkZWQuXG4gKiBAbWV0aG9kIGRlcmVnaXN0ZXJGTG93XG4gKiBAcGFyYW0ge1N0cmluZ30gZmxvdyBUaGUgZmxvdyB0byByZW1vdmUgbWFwcGluZ3MgZm9yLlxuICogQHBhcmFtIHtCb29sZWFufSBpbnRlcm5hbCBJZiB0aGUgZmxvdyBuYW1lIGlzIHRoZSBpbnRlcm5hbCBpZGVudGlmaWVyLlxuICogQHJldHVybnMge0Jvb2xlYW59IFdoZXRoZXIgdGhlIGZsb3cgd2FzIHN1Y2Nlc3NmdWxseSBkZXJlZ2lzdGVyZWQuXG4gKiBAcHJpdmF0ZVxuICovXG5Nb2R1bGUucHJvdG90eXBlLmRlcmVnaXN0ZXJGbG93ID0gZnVuY3Rpb24gKGZsb3csIGludGVybmFsKSB7XG4gIHZhciBrZXksXG4gICAgbWFwID0gaW50ZXJuYWwgPyB0aGlzLmludGVybmFsUG9ydE1hcCA6IHRoaXMuZXh0ZXJuYWxQb3J0TWFwO1xuICAvLyBUT0RPOiB0aGlzIGlzIGluZWZmaWNpZW50LCBidXQgc2VlbXMgbGVzcyBjb25mdXNpbmcgdGhhbiBhIDNyZFxuICAvLyByZXZlcnNlIGxvb2t1cCBtYXAuXG4gIGZvciAoa2V5IGluIG1hcCkge1xuICAgIGlmIChtYXBba2V5XSA9PT0gZmxvdykge1xuICAgICAgaWYgKGludGVybmFsKSB7XG4gICAgICAgIHRoaXMuZW1pdCh0aGlzLmNvbnRyb2xDaGFubmVsLCB7XG4gICAgICAgICAgdHlwZTogJ0NoYW5uZWwgVGVhcmRvd24nLFxuICAgICAgICAgIHJlcXVlc3Q6ICd1bmxpbmsnLFxuICAgICAgICAgIHRvOiB0aGlzLmV4dGVybmFsUG9ydE1hcFtrZXldXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5wb3J0Lm9uTWVzc2FnZSgnY29udHJvbCcsIHtcbiAgICAgICAgICB0eXBlOiAnY2xvc2UnLFxuICAgICAgICAgIGNoYW5uZWw6IHRoaXMuaW50ZXJuYWxQb3J0TWFwW2tleV1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBkZWxldGUgdGhpcy5leHRlcm5hbFBvcnRNYXBba2V5XTtcbiAgICAgIGRlbGV0ZSB0aGlzLmludGVybmFsUG9ydE1hcFtrZXldO1xuXG4gICAgICAvLyBXaGVuIHRoZXJlIGFyZSBzdGlsbCBub24tZGVwZW5kYW50IGNoYW5uZWxzLCBrZWVwIHJ1bm5pbmdcbiAgICAgIGZvciAoa2V5IGluIHRoaXMuZXh0ZXJuYWxQb3J0TWFwKSB7XG4gICAgICAgIGlmICh0aGlzLmV4dGVybmFsUG9ydE1hcC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgaWYgKHRoaXMuZGVwZW5kYW50Q2hhbm5lbHMuaW5kZXhPZihrZXkpIDwgMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBPdGhlcndpc2Ugc2h1dCBkb3duIHRoZSBtb2R1bGUuXG4gICAgICB0aGlzLnN0b3AoKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59O1xuXG4vKipcbiAqIEF0dGVtcHQgdG8gc3RhcnQgdGhlIG1vZHVsZSBvbmNlIHRoZSByZW1vdGUgZnJlZWRvbSBjb250ZXh0XG4gKiBleGlzdHMuXG4gKiBAbWV0aG9kIHN0YXJ0XG4gKiBAcHJpdmF0ZVxuICovXG5Nb2R1bGUucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgUG9ydDtcbiAgaWYgKHRoaXMuc3RhcnRlZCB8fCB0aGlzLnBvcnQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHRoaXMuY29udHJvbENoYW5uZWwpIHtcbiAgICB0aGlzLmxvYWRMaW5rcygpO1xuICAgIFBvcnQgPSB0aGlzLmNvbmZpZy5wb3J0VHlwZTtcbiAgICB0aGlzLnBvcnQgPSBuZXcgUG9ydCh0aGlzLm1hbmlmZXN0Lm5hbWUsIHRoaXMucmVzb3VyY2UpO1xuICAgIC8vIExpc3RlbiB0byBhbGwgcG9ydCBtZXNzYWdlcy5cbiAgICB0aGlzLnBvcnQub24odGhpcy5lbWl0TWVzc2FnZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnBvcnQuYWRkRXJyb3JIYW5kbGVyKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIHRoaXMuZGVidWcud2FybignTW9kdWxlIEZhaWxlZCcsIGVycik7XG4gICAgICB0aGlzLnN0b3AoKTtcbiAgICB9LmJpbmQodGhpcykpO1xuICAgIC8vIFRlbGwgdGhlIGxvY2FsIHBvcnQgdG8gYXNrIHVzIGZvciBoZWxwLlxuICAgIHRoaXMucG9ydC5vbk1lc3NhZ2UoJ2NvbnRyb2wnLCB7XG4gICAgICBjaGFubmVsOiAnY29udHJvbCcsXG4gICAgICBjb25maWc6IHRoaXMuY29uZmlnXG4gICAgfSk7XG5cbiAgICAvLyBUZWxsIHRoZSByZW1vdGUgbG9jYXRpb24gdG8gZGVsZWdhdGUgZGVidWdnaW5nLlxuICAgIHRoaXMucG9ydC5vbk1lc3NhZ2UoJ2NvbnRyb2wnLCB7XG4gICAgICB0eXBlOiAnUmVkaXJlY3QnLFxuICAgICAgcmVxdWVzdDogJ2RlbGVnYXRlJyxcbiAgICAgIGZsb3c6ICdkZWJ1ZydcbiAgICB9KTtcbiAgICB0aGlzLnBvcnQub25NZXNzYWdlKCdjb250cm9sJywge1xuICAgICAgdHlwZTogJ1JlZGlyZWN0JyxcbiAgICAgIHJlcXVlc3Q6ICdkZWxlZ2F0ZScsXG4gICAgICBmbG93OiAnY29yZSdcbiAgICB9KTtcbiAgICBcbiAgICAvLyBUZWxsIHRoZSBjb250YWluZXIgdG8gaW5zdGFudGlhdGUgdGhlIGNvdW50ZXJwYXJ0IHRvIHRoaXMgZXh0ZXJuYWwgdmlldy5cbiAgICB0aGlzLnBvcnQub25NZXNzYWdlKCdjb250cm9sJywge1xuICAgICAgdHlwZTogJ0Vudmlyb25tZW50IENvbmZpZ3VyYXRpb24nLFxuICAgICAgcmVxdWVzdDogJ2Vudmlyb25tZW50JyxcbiAgICAgIG5hbWU6ICdNb2RJbnRlcm5hbCdcbiAgICB9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBTdG9wIHRoZSBtb2R1bGUgd2hlbiBpdCBpcyBubyBsb25nZXIgbmVlZGVkLCBhbmQgdGVhci1kb3duIHN0YXRlLlxuICogQG1ldGhvZCBzdG9wXG4gKiBAcHJpdmF0ZVxuICovXG5Nb2R1bGUucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICghdGhpcy5zdGFydGVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMuZW1pdCgnY2xvc2UnKTtcbiAgaWYgKHRoaXMucG9ydCkge1xuICAgIHRoaXMucG9ydC5vZmYoKTtcbiAgICB0aGlzLnBvcnQub25NZXNzYWdlKCdjb250cm9sJywge1xuICAgICAgdHlwZTogJ2Nsb3NlJyxcbiAgICAgIGNoYW5uZWw6ICdjb250cm9sJ1xuICAgIH0pO1xuICAgIHRoaXMucG9ydC5zdG9wKCk7XG4gICAgZGVsZXRlIHRoaXMucG9ydDtcbiAgfVxuICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcbn07XG5cbi8qKlxuICogVGV4dHVhbCBEZXNjcmlwdGlvbiBvZiB0aGUgUG9ydFxuICogQG1ldGhvZCB0b1N0cmluZ1xuICogQHJldHVybiB7U3RyaW5nfSBUaGUgZGVzY3JpcHRpb24gb2YgdGhpcyBQb3J0LlxuICovXG5Nb2R1bGUucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gXCJbTW9kdWxlIFwiICsgdGhpcy5tYW5pZmVzdC5uYW1lICsgXCJdXCI7XG59O1xuXG4vKipcbiAqIEludGVyY2VwdCBtZXNzYWdlcyBhcyB0aGV5IGFycml2ZSBmcm9tIHRoZSBtb2R1bGUsXG4gKiBtYXBwaW5nIHRoZW0gYmV0d2VlbiBpbnRlcm5hbCBhbmQgZXh0ZXJuYWwgZmxvdyBuYW1lcy5cbiAqIEBtZXRob2QgZW1pdE1lc3NhZ2VcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBkZXN0aW5hdGlvbiB0aGUgbW9kdWxlIHdhbnRzIHRvIHNlbmQgdG8uXG4gKiBAcGFyYW0ge09iamVjdH0gbWVzc2FnZSBUaGUgbWVzc2FnZSB0byBzZW5kLlxuICogQHByaXZhdGVcbiAqL1xuTW9kdWxlLnByb3RvdHlwZS5lbWl0TWVzc2FnZSA9IGZ1bmN0aW9uIChuYW1lLCBtZXNzYWdlKSB7XG4gIGlmICh0aGlzLmludGVybmFsUG9ydE1hcFtuYW1lXSA9PT0gZmFsc2UgJiYgbWVzc2FnZS5jaGFubmVsKSB7XG4gICAgdGhpcy5pbnRlcm5hbFBvcnRNYXBbbmFtZV0gPSBtZXNzYWdlLmNoYW5uZWw7XG4gICAgdGhpcy5lbWl0KCdpbnRlcm5hbENoYW5uZWxSZWFkeScpO1xuICAgIHJldHVybjtcbiAgfVxuICAvLyBUZXJtaW5hdGUgZGVidWcgcmVkaXJlY3Rpb24gcmVxdWVzdGVkIGluIHN0YXJ0KCkuXG4gIGlmIChuYW1lID09PSAnY29udHJvbCcpIHtcbiAgICBpZiAobWVzc2FnZS5mbG93ID09PSAnZGVidWcnICYmIG1lc3NhZ2UubWVzc2FnZSkge1xuICAgICAgdGhpcy5kZWJ1Zy5mb3JtYXQobWVzc2FnZS5tZXNzYWdlLnNldmVyaXR5LFxuICAgICAgICAgIG1lc3NhZ2UubWVzc2FnZS5zb3VyY2UgfHwgdGhpcy50b1N0cmluZygpLFxuICAgICAgICAgIG1lc3NhZ2UubWVzc2FnZS5tc2cpO1xuICAgIH0gZWxzZSBpZiAobWVzc2FnZS5mbG93ID09PSAnY29yZScgJiYgbWVzc2FnZS5tZXNzYWdlKSB7XG4gICAgICBpZiAoIXRoaXMuY29yZSkge1xuICAgICAgICB0aGlzLm9uY2UoJ2NvcmUnLCB0aGlzLmVtaXRNZXNzYWdlLmJpbmQodGhpcywgbmFtZSwgbWVzc2FnZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAobWVzc2FnZS5tZXNzYWdlLnR5cGUgPT09ICdyZWdpc3RlcicpIHtcbiAgICAgICAgbWVzc2FnZS5tZXNzYWdlLnJlcGx5ID0gdGhpcy5wb3J0Lm9uTWVzc2FnZS5iaW5kKHRoaXMucG9ydCwgJ2NvbnRyb2wnKTtcbiAgICAgICAgdGhpcy5leHRlcm5hbFBvcnRNYXBbbWVzc2FnZS5tZXNzYWdlLmlkXSA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgdGhpcy5jb3JlLm9uTWVzc2FnZSh0aGlzLCBtZXNzYWdlLm1lc3NhZ2UpO1xuICAgIH0gZWxzZSBpZiAobWVzc2FnZS5uYW1lID09PSAnTW9kSW50ZXJuYWwnICYmICF0aGlzLm1vZEludGVybmFsKSB7XG4gICAgICB0aGlzLm1vZEludGVybmFsID0gbWVzc2FnZS5jaGFubmVsO1xuICAgICAgdGhpcy5wb3J0Lm9uTWVzc2FnZSh0aGlzLm1vZEludGVybmFsLCB7XG4gICAgICAgIHR5cGU6ICdJbml0aWFsaXphdGlvbicsXG4gICAgICAgIGlkOiB0aGlzLm1hbmlmZXN0SWQsXG4gICAgICAgIGFwcElkOiB0aGlzLmlkLFxuICAgICAgICBtYW5pZmVzdDogdGhpcy5tYW5pZmVzdCxcbiAgICAgICAgbGluZWFnZTogdGhpcy5saW5lYWdlLFxuICAgICAgICBjaGFubmVsOiBtZXNzYWdlLnJldmVyc2VcbiAgICAgIH0pO1xuICAgICAgdGhpcy5lbWl0KCdtb2RJbnRlcm5hbCcpO1xuICAgIH0gZWxzZSBpZiAobWVzc2FnZS50eXBlID09PSAnY3JlYXRlTGluaycpIHtcbiAgICAgIHRoaXMuaW50ZXJuYWxQb3J0TWFwW21lc3NhZ2UubmFtZV0gPSBtZXNzYWdlLmNoYW5uZWw7XG4gICAgICB0aGlzLnBvcnQub25NZXNzYWdlKG1lc3NhZ2UuY2hhbm5lbCwge1xuICAgICAgICB0eXBlOiAnY2hhbm5lbCBhbm5vdW5jZW1lbnQnLFxuICAgICAgICBjaGFubmVsOiBtZXNzYWdlLnJldmVyc2VcbiAgICAgIH0pO1xuICAgICAgdGhpcy5lbWl0KCdpbnRlcm5hbENoYW5uZWxSZWFkeScpO1xuICAgIH0gZWxzZSBpZiAobWVzc2FnZS50eXBlID09PSAnY2xvc2UnKSB7XG4gICAgICB0aGlzLmRlcmVnaXN0ZXJGbG93KG1lc3NhZ2UuY2hhbm5lbCwgdHJ1ZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKG5hbWUgPT09ICdNb2RJbnRlcm5hbCcgJiYgbWVzc2FnZS50eXBlID09PSAncmVhZHknICYmICF0aGlzLnN0YXJ0ZWQpIHtcbiAgICB0aGlzLnN0YXJ0ZWQgPSB0cnVlO1xuICAgIHRoaXMuZW1pdCgnc3RhcnQnKTtcbiAgfSBlbHNlIGlmIChuYW1lID09PSAnTW9kSW50ZXJuYWwnICYmIG1lc3NhZ2UudHlwZSA9PT0gJ3Jlc29sdmUnKSB7XG4gICAgdGhpcy5yZXNvdXJjZS5nZXQodGhpcy5tYW5pZmVzdElkLCBtZXNzYWdlLmRhdGEpLnRoZW4oZnVuY3Rpb24gKGlkLCBkYXRhKSB7XG4gICAgICB0aGlzLnBvcnQub25NZXNzYWdlKHRoaXMubW9kSW50ZXJuYWwsIHtcbiAgICAgICAgdHlwZTogJ3Jlc29sdmUgcmVzcG9uc2UnLFxuICAgICAgICBpZDogaWQsXG4gICAgICAgIGRhdGE6IGRhdGFcbiAgICAgIH0pO1xuICAgIH0uYmluZCh0aGlzLCBtZXNzYWdlLmlkKSwgZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5kZWJ1Zy53YXJuKCdFcnJvciBSZXNvbHZpbmcgVVJMIGZvciBNb2R1bGUuJyk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmVtaXQodGhpcy5leHRlcm5hbFBvcnRNYXBbbmFtZV0sIG1lc3NhZ2UpO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbi8qKlxuICogUmVxdWVzdCB0aGUgZXh0ZXJuYWwgcm91dGVzIHVzZWQgYnkgdGhpcyBtb2R1bGUuXG4gKiBAbWV0aG9kIGxvYWRMaW5rc1xuICogQHByaXZhdGVcbiAqL1xuTW9kdWxlLnByb3RvdHlwZS5sb2FkTGlua3MgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBpLCBjaGFubmVscyA9IFsnZGVmYXVsdCddLCBuYW1lLCBkZXAsXG4gICAgZmluaXNoTGluayA9IGZ1bmN0aW9uIChkZXAsIG5hbWUsIHByb3ZpZGVyKSB7XG4gICAgICB2YXIgc3R5bGUgPSB0aGlzLmFwaS5nZXRJbnRlcmZhY2VTdHlsZShuYW1lKTtcbiAgICAgIGRlcC5nZXRJbnRlcmZhY2UoKVtzdHlsZV0ocHJvdmlkZXIpO1xuICAgIH07XG4gIGlmICh0aGlzLm1hbmlmZXN0LnBlcm1pc3Npb25zKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMubWFuaWZlc3QucGVybWlzc2lvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIG5hbWUgPSB0aGlzLm1hbmlmZXN0LnBlcm1pc3Npb25zW2ldO1xuICAgICAgaWYgKGNoYW5uZWxzLmluZGV4T2YobmFtZSkgPCAwICYmIG5hbWUuaW5kZXhPZignY29yZS4nKSA9PT0gMCkge1xuICAgICAgICBjaGFubmVscy5wdXNoKG5hbWUpO1xuICAgICAgICB0aGlzLmRlcGVuZGFudENoYW5uZWxzLnB1c2gobmFtZSk7XG4gICAgICAgIGRlcCA9IG5ldyBQcm92aWRlcih0aGlzLmFwaS5nZXQobmFtZSkuZGVmaW5pdGlvbiwgdGhpcy5kZWJ1Zyk7XG4gICAgICAgIHRoaXMuYXBpLmdldENvcmUobmFtZSwgdGhpcykudGhlbihmaW5pc2hMaW5rLmJpbmQodGhpcywgZGVwLCBuYW1lKSk7XG5cbiAgICAgICAgdGhpcy5lbWl0KHRoaXMuY29udHJvbENoYW5uZWwsIHtcbiAgICAgICAgICB0eXBlOiAnQ29yZSBMaW5rIHRvICcgKyBuYW1lLFxuICAgICAgICAgIHJlcXVlc3Q6ICdsaW5rJyxcbiAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgIHRvOiBkZXBcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmICh0aGlzLm1hbmlmZXN0LmRlcGVuZGVuY2llcykge1xuICAgIHV0aWwuZWFjaFByb3AodGhpcy5tYW5pZmVzdC5kZXBlbmRlbmNpZXMsIGZ1bmN0aW9uIChkZXNjLCBuYW1lKSB7XG4gICAgICBpZiAoY2hhbm5lbHMuaW5kZXhPZihuYW1lKSA8IDApIHtcbiAgICAgICAgY2hhbm5lbHMucHVzaChuYW1lKTtcbiAgICAgICAgdGhpcy5kZXBlbmRhbnRDaGFubmVscy5wdXNoKG5hbWUpO1xuICAgICAgfVxuICAgICAgdGhpcy5yZXNvdXJjZS5nZXQodGhpcy5tYW5pZmVzdElkLCBkZXNjLnVybCkudGhlbihmdW5jdGlvbiAodXJsKSB7XG4gICAgICAgIHRoaXMucG9saWN5LmdldCh0aGlzLmxpbmVhZ2UsIHVybCkudGhlbihmdW5jdGlvbiAoZGVwKSB7XG4gICAgICAgICAgdGhpcy51cGRhdGVFbnYobmFtZSwgZGVwLm1hbmlmZXN0KTtcbiAgICAgICAgICB0aGlzLmVtaXQodGhpcy5jb250cm9sQ2hhbm5lbCwge1xuICAgICAgICAgICAgdHlwZTogJ0xpbmsgdG8gJyArIG5hbWUsXG4gICAgICAgICAgICByZXF1ZXN0OiAnbGluaycsXG4gICAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgICAgb3ZlcnJpZGVEZXN0OiBuYW1lICsgJy4nICsgdGhpcy5pZCxcbiAgICAgICAgICAgIHRvOiBkZXBcbiAgICAgICAgICB9KTtcbiAgICAgICAgfS5iaW5kKHRoaXMpLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgdGhpcy5kZWJ1Zy53YXJuKCdmYWlsZWQgdG8gbG9hZCBkZXA6ICcsIG5hbWUsIGVycik7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0uYmluZCh0aGlzKSk7XG4gIH1cbiAgLy8gTm90ZSB0aGF0IG1lc3NhZ2VzIGNhbiBiZSBzeW5jaHJvbm91cywgc28gc29tZSBwb3J0cyBtYXkgYWxyZWFkeSBiZSBib3VuZC5cbiAgZm9yIChpID0gMDsgaSA8IGNoYW5uZWxzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhpcy5leHRlcm5hbFBvcnRNYXBbY2hhbm5lbHNbaV1dID0gdGhpcy5leHRlcm5hbFBvcnRNYXBbY2hhbm5lbHNbaV1dIHx8IGZhbHNlO1xuICAgIHRoaXMuaW50ZXJuYWxQb3J0TWFwW2NoYW5uZWxzW2ldXSA9IGZhbHNlO1xuICB9XG59O1xuXG4vKipcbiAqIFVwZGF0ZSB0aGUgbW9kdWxlIGVudmlyb25tZW50IHdpdGggaW5mb3JtYXRpb24gYWJvdXQgYSBkZXBlbmRlbnQgbWFuaWZlc3QuXG4gKiBAbWV0aG9kIHVwZGF0ZUVudlxuICogQHBhcmFtIHtTdHJpbmd9IGRlcCBUaGUgZGVwZW5kZW5jeVxuICogQHBhcmFtIHtPYmplY3R9IG1hbmlmZXN0IFRoZSBtYW5pZmVzdCBvZiB0aGUgZGVwZW5kZW5jeVxuICovXG5Nb2R1bGUucHJvdG90eXBlLnVwZGF0ZUVudiA9IGZ1bmN0aW9uIChkZXAsIG1hbmlmZXN0KSB7XG4gIGlmICghbWFuaWZlc3QpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKCF0aGlzLm1vZEludGVybmFsKSB7XG4gICAgdGhpcy5vbmNlKCdtb2RJbnRlcm5hbCcsIHRoaXMudXBkYXRlRW52LmJpbmQodGhpcywgZGVwLCBtYW5pZmVzdCkpO1xuICAgIHJldHVybjtcbiAgfVxuICBcbiAgdmFyIG1ldGFkYXRhO1xuXG4gIC8vIERlY2lkZSBpZi93aGF0IG90aGVyIHByb3BlcnRpZXMgc2hvdWxkIGJlIGV4cG9ydGVkLlxuICAvLyBLZWVwIGluIHN5bmMgd2l0aCBNb2R1bGVJbnRlcm5hbC51cGRhdGVFbnZcbiAgbWV0YWRhdGEgPSB7XG4gICAgbmFtZTogbWFuaWZlc3QubmFtZSxcbiAgICBpY29uOiBtYW5pZmVzdC5pY29uLFxuICAgIGRlc2NyaXB0aW9uOiBtYW5pZmVzdC5kZXNjcmlwdGlvbixcbiAgICBhcGk6IG1hbmlmZXN0LmFwaVxuICB9O1xuICBcbiAgdGhpcy5wb3J0Lm9uTWVzc2FnZSh0aGlzLm1vZEludGVybmFsLCB7XG4gICAgdHlwZTogJ21hbmlmZXN0JyxcbiAgICBuYW1lOiBkZXAsXG4gICAgbWFuaWZlc3Q6IG1ldGFkYXRhXG4gIH0pO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNb2R1bGU7XG4iLCIvKmpzbGludCBpbmRlbnQ6Miwgbm9kZTp0cnVlLHNsb3BweTp0cnVlICovXG52YXIgUHJvbWlzZUNvbXBhdCA9IHJlcXVpcmUoJ2VzNi1wcm9taXNlJykuUHJvbWlzZTtcblxudmFyIEFwaUludGVyZmFjZSA9IHJlcXVpcmUoJy4vcHJveHkvYXBpSW50ZXJmYWNlJyk7XG52YXIgUHJvdmlkZXIgPSByZXF1aXJlKCcuL3Byb3ZpZGVyJyk7XG52YXIgUHJveHlCaW5kZXIgPSByZXF1aXJlKCcuL3Byb3h5YmluZGVyJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG4vKipcbiAqIFRoZSBpbnRlcm5hbCBsb2dpYyBmb3IgbW9kdWxlIHNldHVwLCB3aGljaCBtYWtlcyBzdXJlIHRoZSBwdWJsaWNcbiAqIGZhY2luZyBleHBvcnRzIGhhdmUgYXBwcm9wcmlhdGUgcHJvcGVydGllcywgYW5kIGxvYWQgdXNlciBzY3JpcHRzLlxuICogQGNsYXNzIE1vZHVsZUludGVybmFsXG4gKiBAZXh0ZW5kcyBQb3J0XG4gKiBAcGFyYW0ge1BvcnR9IG1hbmFnZXIgVGhlIG1hbmFnZXIgaW4gdGhpcyBtb2R1bGUgdG8gdXNlIGZvciByb3V0aW5nIHNldHVwLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbnZhciBNb2R1bGVJbnRlcm5hbCA9IGZ1bmN0aW9uIChtYW5hZ2VyKSB7XG4gIHRoaXMuY29uZmlnID0ge307XG4gIHRoaXMubWFuYWdlciA9IG1hbmFnZXI7XG4gIHRoaXMuZGVidWcgPSBtYW5hZ2VyLmRlYnVnO1xuICB0aGlzLmJpbmRlciA9IG5ldyBQcm94eUJpbmRlcih0aGlzLm1hbmFnZXIpO1xuICB0aGlzLmFwaSA9IHRoaXMubWFuYWdlci5hcGk7XG4gIHRoaXMubWFuaWZlc3RzID0ge307XG4gIHRoaXMucHJvdmlkZXJzID0ge307XG4gIFxuICB0aGlzLmlkID0gJ01vZHVsZUludGVybmFsJztcbiAgdGhpcy5wZW5kaW5nUG9ydHMgPSAwO1xuICB0aGlzLnJlcXVlc3RzID0ge307XG5cbiAgdXRpbC5oYW5kbGVFdmVudHModGhpcyk7XG59O1xuXG4vKipcbiAqIE1lc3NhZ2UgaGFuZGxlciBmb3IgdGhpcyBwb3J0LlxuICogVGhpcyBwb3J0IG9ubHkgaGFuZGxlcyB0d28gbWVzc2FnZXM6XG4gKiBUaGUgZmlyc3QgaXMgaXRzIHNldHVwIGZyb20gdGhlIG1hbmFnZXIsIHdoaWNoIGl0IHVzZXMgZm9yIGNvbmZpZ3VyYXRpb24uXG4gKiBUaGUgc2Vjb25kIGlzIGZyb20gdGhlIG1vZHVsZSBjb250cm9sbGVyIChmZG9tLnBvcnQuTW9kdWxlKSwgd2hpY2ggcHJvdmlkZXNcbiAqIHRoZSBtYW5pZmVzdCBpbmZvIGZvciB0aGUgbW9kdWxlLlxuICogQG1ldGhvZCBvbk1lc3NhZ2VcbiAqIEBwYXJhbSB7U3RyaW5nfSBmbG93IFRoZSBkZXRpbmF0aW9uIG9mIHRoZSBtZXNzYWdlLlxuICogQHBhcmFtIHtPYmplY3R9IG1lc3NhZ2UgVGhlIG1lc3NhZ2UuXG4gKi9cbk1vZHVsZUludGVybmFsLnByb3RvdHlwZS5vbk1lc3NhZ2UgPSBmdW5jdGlvbiAoZmxvdywgbWVzc2FnZSkge1xuICBpZiAoZmxvdyA9PT0gJ2NvbnRyb2wnKSB7XG4gICAgaWYgKCF0aGlzLmNvbnRyb2xDaGFubmVsICYmIG1lc3NhZ2UuY2hhbm5lbCkge1xuICAgICAgdGhpcy5jb250cm9sQ2hhbm5lbCA9IG1lc3NhZ2UuY2hhbm5lbDtcbiAgICAgIHV0aWwubWl4aW4odGhpcy5jb25maWcsIG1lc3NhZ2UuY29uZmlnKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoZmxvdyA9PT0gJ2RlZmF1bHQnICYmICF0aGlzLmFwcElkKSB7XG4gICAgLy8gUmVjb3ZlciB0aGUgSUQgb2YgdGhpcyBtb2R1bGU6XG4gICAgdGhpcy5wb3J0ID0gdGhpcy5tYW5hZ2VyLmh1Yi5nZXREZXN0aW5hdGlvbihtZXNzYWdlLmNoYW5uZWwpO1xuICAgIHRoaXMuZXh0ZXJuYWxDaGFubmVsID0gbWVzc2FnZS5jaGFubmVsO1xuICAgIHRoaXMuYXBwSWQgPSBtZXNzYWdlLmFwcElkO1xuICAgIHRoaXMubGluZWFnZSA9IG1lc3NhZ2UubGluZWFnZTtcblxuICAgIHZhciBvYmplY3RzID0gdGhpcy5tYXBQcm94aWVzKG1lc3NhZ2UubWFuaWZlc3QpO1xuXG4gICAgdGhpcy5nZW5lcmF0ZUVudihtZXNzYWdlLm1hbmlmZXN0LCBvYmplY3RzKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLmxvYWRMaW5rcyhvYmplY3RzKTtcbiAgICB9LmJpbmQodGhpcykpLnRoZW4odGhpcy5sb2FkU2NyaXB0cy5iaW5kKHRoaXMsIG1lc3NhZ2UuaWQsXG4gICAgICAgIG1lc3NhZ2UubWFuaWZlc3QuYXBwLnNjcmlwdCkpO1xuICB9IGVsc2UgaWYgKGZsb3cgPT09ICdkZWZhdWx0JyAmJiB0aGlzLnJlcXVlc3RzW21lc3NhZ2UuaWRdKSB7XG4gICAgdGhpcy5yZXF1ZXN0c1ttZXNzYWdlLmlkXShtZXNzYWdlLmRhdGEpO1xuICAgIGRlbGV0ZSB0aGlzLnJlcXVlc3RzW21lc3NhZ2UuaWRdO1xuICB9IGVsc2UgaWYgKGZsb3cgPT09ICdkZWZhdWx0JyAmJiBtZXNzYWdlLnR5cGUgPT09ICdtYW5pZmVzdCcpIHtcbiAgICB0aGlzLmVtaXQoJ21hbmlmZXN0JywgbWVzc2FnZSk7XG4gICAgdGhpcy51cGRhdGVNYW5pZmVzdChtZXNzYWdlLm5hbWUsIG1lc3NhZ2UubWFuaWZlc3QpO1xuICB9IGVsc2UgaWYgKGZsb3cgPT09ICdkZWZhdWx0JyAmJiBtZXNzYWdlLnR5cGUgPT09ICdDb25uZWN0aW9uJykge1xuICAgIC8vIE11bHRpcGxlIGNvbm5lY3Rpb25zIGNhbiBiZSBtYWRlIHRvIHRoZSBkZWZhdWx0IHByb3ZpZGVyLlxuICAgIGlmIChtZXNzYWdlLmFwaSAmJiB0aGlzLnByb3ZpZGVyc1ttZXNzYWdlLmFwaV0pIHtcbiAgICAgIHRoaXMubWFuYWdlci5jcmVhdGVMaW5rKHRoaXMucHJvdmlkZXJzW21lc3NhZ2UuYXBpXSwgbWVzc2FnZS5jaGFubmVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcnQsIG1lc3NhZ2UuY2hhbm5lbCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmRlZmF1bHRQb3J0ICYmXG4gICAgICAgICAgICAgICAobWVzc2FnZS5hcGkgPT09IHRoaXMuZGVmYXVsdFBvcnQuYXBpIHx8ICFtZXNzYWdlLmFwaSkpIHtcbiAgICAgIHRoaXMubWFuYWdlci5jcmVhdGVMaW5rKHRoaXMuZGVmYXVsdFBvcnQsIG1lc3NhZ2UuY2hhbm5lbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9ydCwgbWVzc2FnZS5jaGFubmVsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5vbmNlKCdzdGFydCcsIHRoaXMub25NZXNzYWdlLmJpbmQodGhpcywgZmxvdywgbWVzc2FnZSkpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBHZXQgYSB0ZXh0dWFsIGRlc2NyaXB0aW9uIG9mIHRoaXMgUG9ydC5cbiAqIEBtZXRob2QgdG9TdHJpbmdcbiAqIEByZXR1cm4ge1N0cmluZ30gYSBkZXNjcmlwdGlvbiBvZiB0aGlzIFBvcnQuXG4gKi9cbk1vZHVsZUludGVybmFsLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIFwiW0Vudmlyb25tZW50IEhlbHBlcl1cIjtcbn07XG5cbi8qKlxuICogR2VuZXJhdGUgYW4gZXh0ZXJuYWx5IHZpc2lzYmxlIG5hbWVzcGFjZVxuICogQG1ldGhvZCBnZW5lcmF0ZUVudlxuICogQHBhcmFtIHtPYmplY3R9IG1hbmlmZXN0IFRoZSBtYW5pZmVzdCBvZiB0aGUgbW9kdWxlLlxuICogQHBhcmFtIHtPYmplY3RbXX0gaXRlbXMgT3RoZXIgaW50ZXJmYWNlcyB0byBsb2FkLlxuICogQHJldHVybnMge1Byb21pc2V9IEEgcHJvbWlzZSB3aGVuIHRoZSBleHRlcm5hbCBuYW1lc3BhY2UgaXMgdmlzaWJsZS5cbiAqIEBwcml2YXRlXG4gKi9cbk1vZHVsZUludGVybmFsLnByb3RvdHlwZS5nZW5lcmF0ZUVudiA9IGZ1bmN0aW9uIChtYW5pZmVzdCwgaXRlbXMpIHtcbiAgcmV0dXJuIHRoaXMuYmluZGVyLmJpbmREZWZhdWx0KHRoaXMucG9ydCwgdGhpcy5hcGksIG1hbmlmZXN0LCB0cnVlKS50aGVuKFxuICAgIGZ1bmN0aW9uIChiaW5kaW5nKSB7XG4gICAgICB2YXIgaSA9IDA7XG4gICAgICBiaW5kaW5nLnBvcnQuYXBpID0gYmluZGluZy5leHRlcm5hbC5hcGk7XG4gICAgICB0aGlzLmRlZmF1bHRQb3J0ID0gYmluZGluZy5wb3J0O1xuICAgICAgaWYgKGJpbmRpbmcuZXh0ZXJuYWwuYXBpKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgIGlmIChpdGVtc1tpXS5uYW1lID09PSBiaW5kaW5nLmV4dGVybmFsLmFwaSAmJiBpdGVtc1tpXS5kZWYucHJvdmlkZXMpIHtcbiAgICAgICAgICAgIGl0ZW1zLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5jb25maWcuZ2xvYmFsLmZyZWVkb20gPSBiaW5kaW5nLmV4dGVybmFsO1xuICAgIH0uYmluZCh0aGlzKVxuICApO1xufTtcblxuLyoqXG4gKiBBdHRhY2ggYSBwcm94eSB0byB0aGUgZXh0ZXJuYWxseSB2aXNpYmxlIG5hbWVzcGFjZS5cbiAqIEBtZXRob2QgYXR0YWNoXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgcHJveHkuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHByb3ZpZGVzIElmIHRoaXMgcHJveHkgaXMgYSBwcm92aWRlci5cbiAqIEBwYXJhbSB7UHJveHlJbnRlcmZhY2V9IHByb3h5IFRoZSBwcm94eSB0byBhdHRhY2guXG4gKiBAcGFyYW0ge1N0cmluZ30gYXBpIFRoZSBBUEkgdGhlIHByb3h5IGltcGxlbWVudHMuXG4gKiBAcHJpdmF0ZS5cbiAqL1xuTW9kdWxlSW50ZXJuYWwucHJvdG90eXBlLmF0dGFjaCA9IGZ1bmN0aW9uIChuYW1lLCBwcm92aWRlcywgcHJveHkpIHtcbiAgdmFyIGV4cCA9IHRoaXMuY29uZmlnLmdsb2JhbC5mcmVlZG9tO1xuICBcbiAgaWYgKHByb3ZpZGVzKSB7XG4gICAgdGhpcy5wcm92aWRlcnNbbmFtZV0gPSBwcm94eS5wb3J0O1xuICB9XG5cbiAgaWYgKCFleHBbbmFtZV0pIHtcbiAgICBleHBbbmFtZV0gPSBwcm94eS5leHRlcm5hbDtcbiAgICBpZiAodGhpcy5tYW5pZmVzdHNbbmFtZV0pIHtcbiAgICAgIGV4cFtuYW1lXS5tYW5pZmVzdCA9IHRoaXMubWFuaWZlc3RzW25hbWVdO1xuICAgIH1cbiAgfVxuXG4gIHRoaXMucGVuZGluZ1BvcnRzIC09IDE7XG4gIGlmICh0aGlzLnBlbmRpbmdQb3J0cyA9PT0gMCkge1xuICAgIHRoaXMuZW1pdCgnc3RhcnQnKTtcbiAgfVxufTtcblxuLyoqXG4gKiBSZXF1ZXN0IGEgc2V0IG9mIHByb3h5IGludGVyZmFjZXMsIGFuZCBiaW5kIHRoZW0gdG8gdGhlIGV4dGVybmFsXG4gKiBuYW1lc3BhY2UuXG4gKiBAbWV0aG9kIGxvYWRMaW5rc1xuICogQHBhcmFtIHtPYmplY3RbXX0gaXRlbXMgRGVzY3JpcHRvcnMgb2YgdGhlIHByb3h5IHBvcnRzIHRvIGxvYWQuXG4gKiBAcHJpdmF0ZVxuICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2UgZm9yIHdoZW4gYWxsIGxpbmtzIGFyZSBsb2FkZWQuXG4gKi9cbi8vVE9ETyh3aWxsc2NvdHQpOiBwcm9taXNlIHNob3VsZCBiZSBjaGFpbmVkLCByYXRoZXIgdGhhbiBnb2luZyB0aHJvdWdoIGV2ZW50cy5cbk1vZHVsZUludGVybmFsLnByb3RvdHlwZS5sb2FkTGlua3MgPSBmdW5jdGlvbiAoaXRlbXMpIHtcbiAgdmFyIGksIHByb3h5LCBwcm92aWRlciwgY29yZSxcbiAgICBtYW5pZmVzdFByZWRpY2F0ZSA9IGZ1bmN0aW9uIChuYW1lLCBmbG93LCBtc2cpIHtcbiAgICAgIHJldHVybiBmbG93ID09PSAnbWFuaWZlc3QnICYmIG1zZy5uYW1lID09PSBuYW1lO1xuICAgIH0sXG4gICAgb25NYW5pZmVzdCA9IGZ1bmN0aW9uIChpdGVtLCBtc2cpIHtcbiAgICAgIHZhciBkZWZpbml0aW9uID0ge1xuICAgICAgICBuYW1lOiBpdGVtLmFwaVxuICAgICAgfTtcbiAgICAgIGlmICghbXNnLm1hbmlmZXN0LmFwaSB8fCAhbXNnLm1hbmlmZXN0LmFwaVtpdGVtLmFwaV0pIHtcbiAgICAgICAgZGVmaW5pdGlvbi5kZWZpbml0aW9uID0gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlZmluaXRpb24uZGVmaW5pdGlvbiA9IG1zZy5tYW5pZmVzdC5hcGlbaXRlbS5hcGldO1xuICAgICAgfVxuICAgICAgdGhpcy5iaW5kZXIuZ2V0RXh0ZXJuYWwodGhpcy5wb3J0LCBpdGVtLm5hbWUsIGRlZmluaXRpb24pLnRoZW4oXG4gICAgICAgIHRoaXMuYXR0YWNoLmJpbmQodGhpcywgaXRlbS5uYW1lLCBmYWxzZSlcbiAgICAgICk7XG4gICAgfS5iaW5kKHRoaXMpLFxuICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZUNvbXBhdChmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICB0aGlzLm9uY2UoJ3N0YXJ0JywgcmVzb2x2ZSk7XG4gICAgfS5iaW5kKHRoaXMpKTtcblxuICBmb3IgKGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICBpZiAoaXRlbXNbaV0uYXBpICYmICFpdGVtc1tpXS5kZWYpIHtcbiAgICAgIGlmICh0aGlzLm1hbmlmZXN0c1tpdGVtc1tpXS5uYW1lXSkge1xuICAgICAgICBvbk1hbmlmZXN0KGl0ZW1zW2ldLCB7XG4gICAgICAgICAgbWFuaWZlc3Q6IHRoaXMubWFuaWZlc3RzW2l0ZW1zW2ldLm5hbWVdXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5vbmNlKG1hbmlmZXN0UHJlZGljYXRlLmJpbmQoe30sIGl0ZW1zW2ldLm5hbWUpLFxuICAgICAgICAgICAgICAgICAgb25NYW5pZmVzdC5iaW5kKHRoaXMsIGl0ZW1zW2ldKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYmluZGVyLmdldEV4dGVybmFsKHRoaXMucG9ydCwgaXRlbXNbaV0ubmFtZSwgaXRlbXNbaV0uZGVmKS50aGVuKFxuICAgICAgICB0aGlzLmF0dGFjaC5iaW5kKHRoaXMsIGl0ZW1zW2ldLm5hbWUsIGl0ZW1zW2ldLmRlZiAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zW2ldLmRlZi5wcm92aWRlcylcbiAgICAgICk7XG4gICAgfVxuICAgIHRoaXMucGVuZGluZ1BvcnRzICs9IDE7XG4gIH1cbiAgXG4gIC8vIEFsbG93IHJlc29sdXRpb24gb2YgZmlsZXMgYnkgcGFyZW50LlxuICB0aGlzLm1hbmFnZXIucmVzb3VyY2UuYWRkUmVzb2x2ZXIoZnVuY3Rpb24gKG1hbmlmZXN0LCB1cmwsIHJlc29sdmUpIHtcbiAgICB2YXIgaWQgPSB1dGlsLmdldElkKCk7XG4gICAgdGhpcy5yZXF1ZXN0c1tpZF0gPSByZXNvbHZlO1xuICAgIHRoaXMuZW1pdCh0aGlzLmV4dGVybmFsQ2hhbm5lbCwge1xuICAgICAgdHlwZTogJ3Jlc29sdmUnLFxuICAgICAgaWQ6IGlkLFxuICAgICAgZGF0YTogdXJsXG4gICAgfSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0uYmluZCh0aGlzKSk7XG5cbiAgLy8gQXR0YWNoIENvcmUuXG4gIHRoaXMucGVuZGluZ1BvcnRzICs9IDE7XG5cbiAgY29yZSA9IHRoaXMuYXBpLmdldCgnY29yZScpLmRlZmluaXRpb247XG4gIHByb3ZpZGVyID0gbmV3IFByb3ZpZGVyKGNvcmUsIHRoaXMuZGVidWcpO1xuICB0aGlzLm1hbmFnZXIuZ2V0Q29yZShmdW5jdGlvbiAoQ29yZVByb3YpIHtcbiAgICBuZXcgQ29yZVByb3YodGhpcy5tYW5hZ2VyKS5zZXRJZCh0aGlzLmxpbmVhZ2UpO1xuICAgIHByb3ZpZGVyLmdldEludGVyZmFjZSgpLnByb3ZpZGVBc3luY2hyb25vdXMoQ29yZVByb3YpO1xuICB9LmJpbmQodGhpcykpO1xuXG4gIHRoaXMuZW1pdCh0aGlzLmNvbnRyb2xDaGFubmVsLCB7XG4gICAgdHlwZTogJ0xpbmsgdG8gY29yZScsXG4gICAgcmVxdWVzdDogJ2xpbmsnLFxuICAgIG5hbWU6ICdjb3JlJyxcbiAgICB0bzogcHJvdmlkZXJcbiAgfSk7XG4gIFxuICB0aGlzLmJpbmRlci5nZXRFeHRlcm5hbChwcm92aWRlciwgJ2RlZmF1bHQnLCB7XG4gICAgbmFtZTogJ2NvcmUnLFxuICAgIGRlZmluaXRpb246IGNvcmVcbiAgfSkudGhlbihcbiAgICB0aGlzLmF0dGFjaC5iaW5kKHRoaXMsICdjb3JlJywgZmFsc2UpXG4gICk7XG5cblxuLy8gIHByb3h5ID0gbmV3IFByb3h5KEFwaUludGVyZmFjZS5iaW5kKHt9LCBjb3JlKSwgdGhpcy5kZWJ1Zyk7XG4vLyAgdGhpcy5tYW5hZ2VyLmNyZWF0ZUxpbmsocHJvdmlkZXIsICdkZWZhdWx0JywgcHJveHkpO1xuLy8gIHRoaXMuYXR0YWNoKCdjb3JlJywge3BvcnQ6IHByLCBleHRlcm5hbDogcHJveHl9KTtcblxuICBpZiAodGhpcy5wZW5kaW5nUG9ydHMgPT09IDApIHtcbiAgICB0aGlzLmVtaXQoJ3N0YXJ0Jyk7XG4gIH1cblxuICByZXR1cm4gcHJvbWlzZTtcbn07XG5cbi8qKlxuICogVXBkYXRlIHRoZSBleHBvcnRlZCBtYW5pZmVzdCBvZiBhIGRlcGVuZGVuY3kuXG4gKiBTZXRzIGl0IGludGVybmFsbHkgaWYgbm90IHlldCBleHBvcnRlZCwgb3IgYXR0YWNoZXMgdGhlIHByb3BlcnR5IGlmIGl0XG4gKiBpcyBsb2FkZWQgYWZ0ZXIgdGhlIG1vZHVsZSBoYXMgc3RhcnRlZCAod2UgZG9uJ3QgZGVsYXkgc3RhcnQgdG8gcmV0cmVpdmVcbiAqIHRoZSBtYW5pZmVzdCBvZiB0aGUgZGVwZW5kZW5jeS4pXG4gKiBAbWV0aG9kIHVwZGF0ZU1hbmlmZXN0XG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBUaGUgRGVwZW5kZW5jeVxuICogQHBhcmFtIHtPYmplY3R9IG1hbmlmZXN0IFRoZSBtYW5pZmVzdCBvZiB0aGUgZGVwZW5kZW5jeVxuICovXG5Nb2R1bGVJbnRlcm5hbC5wcm90b3R5cGUudXBkYXRlTWFuaWZlc3QgPSBmdW5jdGlvbiAobmFtZSwgbWFuaWZlc3QpIHtcbiAgdmFyIGV4cCA9IHRoaXMuY29uZmlnLmdsb2JhbC5mcmVlZG9tO1xuXG4gIGlmIChleHAgJiYgZXhwW25hbWVdKSB7XG4gICAgZXhwW25hbWVdLm1hbmlmZXN0ID0gbWFuaWZlc3Q7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5tYW5pZmVzdHNbbmFtZV0gPSBtYW5pZmVzdDtcbiAgfVxufTtcblxuLyoqXG4gKiBEZXRlcm1pbmUgd2hpY2ggcHJveHkgcG9ydHMgc2hvdWxkIGJlIGV4cG9zZWQgYnkgdGhpcyBtb2R1bGUuXG4gKiBAbWV0aG9kIG1hcFByb3hpZXNcbiAqIEBwYXJhbSB7T2JqZWN0fSBtYW5pZmVzdCB0aGUgbW9kdWxlIEpTT04gbWFuaWZlc3QuXG4gKiBAcmV0dXJuIHtPYmplY3RbXX0gcHJveHkgZGVzY3JpcHRvcnMgZGVmaW5lZCBpbiB0aGUgbWFuaWZlc3QuXG4gKi9cbk1vZHVsZUludGVybmFsLnByb3RvdHlwZS5tYXBQcm94aWVzID0gZnVuY3Rpb24gKG1hbmlmZXN0KSB7XG4gIHZhciBwcm94aWVzID0gW10sIHNlZW4gPSBbJ2NvcmUnXSwgaSwgb2JqO1xuICBcbiAgaWYgKG1hbmlmZXN0LnBlcm1pc3Npb25zKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IG1hbmlmZXN0LnBlcm1pc3Npb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBvYmogPSB7XG4gICAgICAgIG5hbWU6IG1hbmlmZXN0LnBlcm1pc3Npb25zW2ldLFxuICAgICAgICBkZWY6IHVuZGVmaW5lZFxuICAgICAgfTtcbiAgICAgIG9iai5kZWYgPSB0aGlzLmFwaS5nZXQob2JqLm5hbWUpO1xuICAgICAgaWYgKHNlZW4uaW5kZXhPZihvYmoubmFtZSkgPCAwICYmIG9iai5kZWYpIHtcbiAgICAgICAgcHJveGllcy5wdXNoKG9iaik7XG4gICAgICAgIHNlZW4ucHVzaChvYmoubmFtZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICBpZiAobWFuaWZlc3QuZGVwZW5kZW5jaWVzKSB7XG4gICAgdXRpbC5lYWNoUHJvcChtYW5pZmVzdC5kZXBlbmRlbmNpZXMsIGZ1bmN0aW9uIChkZXNjLCBuYW1lKSB7XG4gICAgICBvYmogPSB7XG4gICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgIGFwaTogZGVzYy5hcGlcbiAgICAgIH07XG4gICAgICBpZiAoc2Vlbi5pbmRleE9mKG5hbWUpIDwgMCkge1xuICAgICAgICBpZiAoZGVzYy5hcGkpIHtcbiAgICAgICAgICBvYmouZGVmID0gdGhpcy5hcGkuZ2V0KGRlc2MuYXBpKTtcbiAgICAgICAgfVxuICAgICAgICBwcm94aWVzLnB1c2gob2JqKTtcbiAgICAgICAgc2Vlbi5wdXNoKG5hbWUpO1xuICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG4gIH1cbiAgXG4gIGlmIChtYW5pZmVzdC5wcm92aWRlcykge1xuICAgIGZvciAoaSA9IDA7IGkgPCBtYW5pZmVzdC5wcm92aWRlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgb2JqID0ge1xuICAgICAgICBuYW1lOiBtYW5pZmVzdC5wcm92aWRlc1tpXSxcbiAgICAgICAgZGVmOiB1bmRlZmluZWRcbiAgICAgIH07XG4gICAgICBvYmouZGVmID0gdGhpcy5hcGkuZ2V0KG9iai5uYW1lKTtcbiAgICAgIGlmIChvYmouZGVmKSB7XG4gICAgICAgIG9iai5kZWYucHJvdmlkZXMgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChtYW5pZmVzdC5hcGkgJiYgbWFuaWZlc3QuYXBpW29iai5uYW1lXSkge1xuICAgICAgICBvYmouZGVmID0ge1xuICAgICAgICAgIG5hbWU6IG9iai5uYW1lLFxuICAgICAgICAgIGRlZmluaXRpb246IG1hbmlmZXN0LmFwaVtvYmoubmFtZV0sXG4gICAgICAgICAgcHJvdmlkZXM6IHRydWVcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZGVidWcud2FybignTW9kdWxlIHdpbGwgbm90IHByb3ZpZGUgXCInICsgb2JqLm5hbWUgK1xuICAgICAgICAgICdcIiwgc2luY2Ugbm8gZGVjbGFyYXRpb24gY2FuIGJlIGZvdW5kLicpO1xuICAgICAgICAvKmpzbGludCBjb250aW51ZTp0cnVlKi9cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvKmpzbGludCBjb250aW51ZTpmYWxzZSovXG4gICAgICBpZiAoc2Vlbi5pbmRleE9mKG9iai5uYW1lKSA8IDApIHtcbiAgICAgICAgcHJveGllcy5wdXNoKG9iaik7XG4gICAgICAgIHNlZW4ucHVzaChvYmoubmFtZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHByb3hpZXM7XG59O1xuXG4vKipcbiAqIExvYWQgZXh0ZXJuYWwgc2NyaXB0cyBpbnRvIHRoaXMgbmFtZXNwYWNlLlxuICogQG1ldGhvZCBsb2FkU2NyaXB0c1xuICogQHBhcmFtIHtTdHJpbmd9IGZyb20gVGhlIFVSTCBvZiB0aGlzIG1vZHVsZXMncyBtYW5pZmVzdC5cbiAqIEBwYXJhbSB7U3RyaW5nW119IHNjcmlwdHMgVGhlIFVSTHMgb2YgdGhlIHNjcmlwdHMgdG8gbG9hZC5cbiAqL1xuTW9kdWxlSW50ZXJuYWwucHJvdG90eXBlLmxvYWRTY3JpcHRzID0gZnVuY3Rpb24gKGZyb20sIHNjcmlwdHMpIHtcbiAgLy8gVE9ETyhzYWxvbWVnZW8pOiBhZGQgYSB0ZXN0IGZvciBmYWlsdXJlLlxuICB2YXIgaW1wb3J0ZXIgPSBmdW5jdGlvbiAoc2NyaXB0LCByZXNvbHZlLCByZWplY3QpIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5jb25maWcuZ2xvYmFsLmltcG9ydFNjcmlwdHMoc2NyaXB0KTtcbiAgICAgIHJlc29sdmUodHJ1ZSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmVqZWN0KGUpO1xuICAgIH1cbiAgfS5iaW5kKHRoaXMpLFxuICAgIHNjcmlwdHNfY291bnQsXG4gICAgbG9hZDtcbiAgaWYgKHR5cGVvZiBzY3JpcHRzID09PSAnc3RyaW5nJykge1xuICAgIHNjcmlwdHNfY291bnQgPSAxO1xuICB9IGVsc2Uge1xuICAgIHNjcmlwdHNfY291bnQgPSBzY3JpcHRzLmxlbmd0aDtcbiAgfVxuXG4gIGxvYWQgPSBmdW5jdGlvbiAobmV4dCkge1xuICAgIGlmIChuZXh0ID09PSBzY3JpcHRzX2NvdW50KSB7XG4gICAgICB0aGlzLmVtaXQodGhpcy5leHRlcm5hbENoYW5uZWwsIHtcbiAgICAgICAgdHlwZTogXCJyZWFkeVwiXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgc2NyaXB0O1xuICAgIGlmICh0eXBlb2Ygc2NyaXB0cyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHNjcmlwdCA9IHNjcmlwdHM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNjcmlwdCA9IHNjcmlwdHNbbmV4dF07XG4gICAgfVxuXG4gICAgdGhpcy5tYW5hZ2VyLnJlc291cmNlLmdldChmcm9tLCBzY3JpcHQpLnRoZW4oZnVuY3Rpb24gKHVybCkge1xuICAgICAgdGhpcy50cnlMb2FkKGltcG9ydGVyLCB1cmwpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICBsb2FkKG5leHQgKyAxKTtcbiAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfS5iaW5kKHRoaXMpO1xuXG5cblxuICBpZiAoIXRoaXMuY29uZmlnLmdsb2JhbC5pbXBvcnRTY3JpcHRzKSB7XG4gICAgaW1wb3J0ZXIgPSBmdW5jdGlvbiAodXJsLCByZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHZhciBzY3JpcHQgPSB0aGlzLmNvbmZpZy5nbG9iYWwuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICBzY3JpcHQuc3JjID0gdXJsO1xuICAgICAgc2NyaXB0LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCByZXNvbHZlLCB0cnVlKTtcbiAgICAgIHRoaXMuY29uZmlnLmdsb2JhbC5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gICAgfS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgbG9hZCgwKTtcbn07XG5cbi8qKlxuICogQXR0ZW1wdCB0byBsb2FkIHJlc29sdmVkIHNjcmlwdHMgaW50byB0aGUgbmFtZXNwYWNlLlxuICogQG1ldGhvZCB0cnlMb2FkXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gaW1wb3J0ZXIgVGhlIGFjdHVhbCBpbXBvcnQgZnVuY3Rpb25cbiAqIEBwYXJhbSB7U3RyaW5nW119IHVybHMgVGhlIHJlc292ZWQgVVJMcyB0byBsb2FkLlxuICogQHJldHVybnMge1Byb21pc2V9IGNvbXBsZXRpb24gb2YgbG9hZFxuICovXG5Nb2R1bGVJbnRlcm5hbC5wcm90b3R5cGUudHJ5TG9hZCA9IGZ1bmN0aW9uIChpbXBvcnRlciwgdXJsKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZUNvbXBhdChpbXBvcnRlci5iaW5kKHt9LCB1cmwpKS50aGVuKGZ1bmN0aW9uICh2YWwpIHtcbiAgICByZXR1cm4gdmFsO1xuICB9LCBmdW5jdGlvbiAoZSkge1xuICAgIHRoaXMuZGVidWcud2FybihlLnN0YWNrKTtcbiAgICB0aGlzLmRlYnVnLmVycm9yKFwiRXJyb3IgbG9hZGluZyBcIiArIHVybCwgZSk7XG4gICAgdGhpcy5kZWJ1Zy5lcnJvcihcIklmIHRoZSBzdGFjayB0cmFjZSBpcyBub3QgdXNlZnVsLCBzZWUgaHR0cHM6Ly9cIiArXG4gICAgICAgIFwiZ2l0aHViLmNvbS9mcmVlZG9tanMvZnJlZWRvbS93aWtpL0RlYnVnZ2luZy1TY3JpcHQtUGFyc2UtRXJyb3JzXCIpO1xuICB9LmJpbmQodGhpcykpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNb2R1bGVJbnRlcm5hbDtcbiIsIi8qZ2xvYmFscyBYTUxIdHRwUmVxdWVzdCAqL1xuLypqc2xpbnQgaW5kZW50OjIsd2hpdGU6dHJ1ZSxub2RlOnRydWUsc2xvcHB5OnRydWUgKi9cbnZhciBQcm9taXNlQ29tcGF0ID0gcmVxdWlyZSgnZXM2LXByb21pc2UnKS5Qcm9taXNlO1xudmFyIE1vZHVsZSA9IHJlcXVpcmUoJy4vbW9kdWxlJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG4vKipcbiAqIFRoZSBQb2xpY3kgcmVnaXN0cnkgZm9yIGZyZWVkb20uanMuICBVc2VkIHRvIGxvb2sgdXAgbW9kdWxlcyBhbmQgcHJvdmlkZVxuICogbWlncmF0aW9uIGFuZCBjb2FsbGVzaW5nIG9mIGV4ZWN1dGlvbi5cbiAqIEBDbGFzcyBQb2xpY3lcbiAqIEBwYXJhbSB7TWFuYWdlcn0gbWFuYWdlciBUaGUgbWFuYWdlciBvZiB0aGUgYWN0aXZlIHJ1bnRpbWUuXG4gKiBAcGFyYW0ge1Jlc291cmNlfSByZXNvdXJjZSBUaGUgcmVzb3VyY2UgbG9hZGVyIG9mIHRoZSBhY3RpdmUgcnVudGltZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWcgVGhlIGxvY2FsIGNvbmZpZy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG52YXIgUG9saWN5ID0gZnVuY3Rpb24obWFuYWdlciwgcmVzb3VyY2UsIGNvbmZpZykge1xuICB0aGlzLmFwaSA9IG1hbmFnZXIuYXBpO1xuICB0aGlzLmRlYnVnID0gbWFuYWdlci5kZWJ1ZztcbiAgdGhpcy5sb2NhdGlvbiA9IGNvbmZpZy5sb2NhdGlvbjtcbiAgdGhpcy5yZXNvdXJjZSA9IHJlc291cmNlO1xuXG4gIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICB0aGlzLnJ1bnRpbWVzID0gW107XG4gIHRoaXMucG9saWNpZXMgPSBbXTtcbiAgdGhpcy5wZW5kaW5nID0ge307XG4gIHV0aWwuaGFuZGxlRXZlbnRzKHRoaXMpO1xuXG4gIHRoaXMuYWRkKG1hbmFnZXIsIGNvbmZpZy5wb2xpY3kpO1xuICB0aGlzLnJ1bnRpbWVzWzBdLmxvY2FsID0gdHJ1ZTtcbn07XG5cbi8qKlxuICogVGhlIHBvbGljeSBhIHJ1bnRpbWUgaXMgZXhwZWN0ZWQgdG8gaGF2ZSB1bmxlc3MgaXQgc3BlY2lmaWVzXG4gKiBvdGhlcndpc2UuXG4gKiBUT0RPOiBjb25zaWRlciBtYWtpbmcgc3RhdGljXG4gKiBAcHJvcGVydHkgZGVmYXVsdFBvbGljeVxuICovXG5Qb2xpY3kucHJvdG90eXBlLmRlZmF1bHRQb2xpY3kgPSB7XG4gIGJhY2tncm91bmQ6IGZhbHNlLCAvLyBDYW4gdGhpcyBydW50aW1lIHJ1biAnYmFja2dyb3VuZCcgbW9kdWxlcz9cbiAgaW50ZXJhY3RpdmU6IHRydWUgLy8gSXMgdGhlcmUgYSB2aWV3IGFzc29jaWF0ZWQgd2l0aCB0aGlzIHJ1bnRpbWU/XG4gIC8vIFRPRE86IHJlbWFpbmluZyBydW50aW1lIHBvbGljeS5cbn07XG5cbi8qKlxuICogVGhlIGNvbnN0cmFpbnRzIGEgY29kZSBtb2R1bGVzIGlzIGV4cGVjdGVkIHRvIGhhdmUgdW5sZXNzIGl0IHNwZWNpZmllc1xuICogb3RoZXJ3aXNlLlxuICogVE9ETzogY29uc2lkZXIgbWFraW5nIHN0YXRpY1xuICogQHByb3BlcnR5IGRlZmF1bHRDb25zdHJhaW50c1xuICovXG5Qb2xpY3kucHJvdG90eXBlLmRlZmF1bHRDb25zdHJhaW50cyA9IHtcbiAgaXNvbGF0aW9uOiBcImFsd2F5c1wiLCAvLyB2YWx1ZXM6IGFsd2F5cywgYXBwLCBuZXZlclxuICBwbGFjZW1lbnQ6IFwibG9jYWxcIiAvLyB2YWx1ZXM6IGxvY2FsLCBzdGFibGUsIHJlZHVuZGFudFxuICAvLyBUT0RPOiByZW1haW5pbmcgY29uc3RyYWludHMsIGV4cHJlc3MgcGxhdGZvcm0tc3BlY2lmaWMgZGVwZW5kZW5jaWVzLlxufTtcblxuLyoqXG4gKiBSZXNvbHZlIGEgbW9kdWxlIGZyb20gaXRzIGNhbm9uaWNhbCBVUkwuXG4gKiBSZXBvbmRzIHdpdGggdGhlIHByb21pc2Ugb2YgYSBwb3J0IHJlcHJlc2VudGluZyB0aGUgbW9kdWxlLCBcbiAqIEBtZXRob2QgZ2V0XG4gKiBAcGFyYW0ge1N0cmluZ1tdfSBsaW5lYWdlIFRoZSBsaW5lYWdlIG9mIHRoZSByZXF1ZXN0aW5nIG1vZHVsZS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBpZCBUaGUgY2Fub25pY2FsIElEIG9mIHRoZSBtb2R1bGUgdG8gZ2V0LlxuICogQHJldHVybnMge1Byb21pc2V9IEEgcHJvbWlzZSBmb3IgdGhlIGxvY2FsIHBvcnQgdG93YXJkcyB0aGUgbW9kdWxlLlxuICovXG5Qb2xpY3kucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGxpbmVhZ2UsIGlkKSB7XG4gIFxuICAvLyBNYWtlIHN1cmUgdGhhdCBhIG1vZHVsZSBpc24ndCBnZXR0aW5nIGxvY2F0ZWQgdHdpY2UgYXQgdGhlIHNhbWUgdGltZS5cbiAgLy8gVGhpcyBpcyByZXNvbHZlZCBieSBkZWxheWluZyBpZiBpdCB1bnRpbCB3ZSBzZWUgaXQgaW4gYSAnbW9kdWxlQWRkJyBldmVudC5cbiAgaWYgKHRoaXMucGVuZGluZ1tpZF0pIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2VDb21wYXQoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgdGhpcy5vbmNlKCdwbGFjZWQnLCBmdW5jdGlvbihsLCBpKSB7XG4gICAgICAgIHRoaXMuZ2V0KGwsIGkpLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgIH0uYmluZCh0aGlzLCBsaW5lYWdlLCBpZCkpO1xuICAgIH0uYmluZCh0aGlzKSk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5wZW5kaW5nW2lkXSA9IHRydWU7XG4gIH1cblxuICByZXR1cm4gdGhpcy5sb2FkTWFuaWZlc3QoaWQpLnRoZW4oZnVuY3Rpb24obWFuaWZlc3QpIHtcbiAgICB2YXIgY29uc3RyYWludHMgPSB0aGlzLm92ZXJsYXkodGhpcy5kZWZhdWx0Q29uc3RyYWludHMsIG1hbmlmZXN0LmNvbnN0cmFpbnRzKSxcbiAgICAgICAgcnVudGltZSA9IHRoaXMuZmluZERlc3RpbmF0aW9uKGxpbmVhZ2UsIGlkLCBjb25zdHJhaW50cyksXG4gICAgICAgIHBvcnRJZDtcbiAgICBpZiAocnVudGltZS5sb2NhbCkge1xuICAgICAgcG9ydElkID0gdGhpcy5pc1J1bm5pbmcocnVudGltZSwgaWQsIGxpbmVhZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0cmFpbnRzLmlzb2xhdGlvbiAhPT0gJ25ldmVyJyk7XG4gICAgICBpZihjb25zdHJhaW50cy5pc29sYXRpb24gIT09ICdhbHdheXMnICYmIHBvcnRJZCkge1xuICAgICAgICB0aGlzLmRlYnVnLmluZm8oJ1JldXNlZCBwb3J0ICcgKyBwb3J0SWQpO1xuICAgICAgICBkZWxldGUgdGhpcy5wZW5kaW5nW2lkXTtcbiAgICAgICAgdGhpcy5lbWl0KCdwbGFjZWQnKTtcbiAgICAgICAgcmV0dXJuIHJ1bnRpbWUubWFuYWdlci5nZXRQb3J0KHBvcnRJZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV3IE1vZHVsZShpZCwgbWFuaWZlc3QsIGxpbmVhZ2UsIHRoaXMpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUT0RPOiBDcmVhdGUgYSBwb3J0IHRvIGdvIHRvIHRoZSByZW1vdGUgcnVudGltZS5cbiAgICAgIHRoaXMuZGVidWcuZXJyb3IoJ1VuZXhwZWN0ZWQgbG9jYXRpb24gc2VsZWN0ZWQgZm9yIG1vZHVsZSBwbGFjZW1lbnQnKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0uYmluZCh0aGlzKSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgdGhpcy5kZWJ1Zy5lcnJvcignUG9saWN5IEVycm9yIFJlc29sdmluZyAnICsgaWQsIGVycik7XG4gICAgdGhyb3coZXJyKTtcbiAgfS5iaW5kKHRoaXMpKTtcbn07XG5cbi8qKlxuICogRmluZCB0aGUgcnVudGltZSBkZXN0aW5hdGlvbiBmb3IgYSBtb2R1bGUgZ2l2ZW4gaXRzIGNvbnN0cmFpbnRzIGFuZCB0aGVcbiAqIG1vZHVsZSBjcmVhdGluZyBpdC5cbiAqIEBtZXRob2QgZmluZERlc3RpbmF0aW9uXG4gKiBAcGFyYW0ge1N0cmluZ1tdfSBsaW5lYWdlIFRoZSBpZGVudGl0eSBvZiB0aGUgbW9kdWxlIGNyZWF0aW5nIHRoaXMgbW9kdWxlLlxuICogQHBhcmFtIHtTdHJpbmddIGlkIFRoZSBjYW5vbmljYWwgdXJsIG9mIHRoZSBtb2R1bGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb25zdHJhaW50cyBDb25zdHJhaW50cyBmb3IgdGhlIG1vZHVsZS5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFRoZSBlbGVtZW50IG9mIHRoaXMucnVudGltZXMgd2hlcmUgdGhlIG1vZHVsZSBzaG91bGQgcnVuLlxuICovXG5Qb2xpY3kucHJvdG90eXBlLmZpbmREZXN0aW5hdGlvbiA9IGZ1bmN0aW9uKGxpbmVhZ2UsIGlkLCBjb25zdHJhaW50cykge1xuICB2YXIgaTtcblxuICAvLyBTdGVwIDE6IGlmIGFuIGluc3RhbmNlIGFscmVhZHkgZXhpc3RzLCB0aGUgbVxuICBpZiAoY29uc3RyYWludHMuaXNvbGF0aW9uICE9PSAnYWx3YXlzJykge1xuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnBvbGljaWVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBpZiAodGhpcy5pc1J1bm5pbmcodGhpcy5ydW50aW1lc1tpXSwgaWQsIGxpbmVhZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgY29uc3RyYWludHMuaXNvbGF0aW9uICE9PSAnbmV2ZXInKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW50aW1lc1tpXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBTdGVwIDI6IGlmIHRoZSBtb2R1bGUgd2FudHMgc3RhYmlsaXR5LCBpdCBtYXkgbmVlZCB0byBiZSByZW1vdGUuXG4gIGlmIChjb25zdHJhaW50cy5wbGFjZW1lbnQgPT09ICdsb2NhbCcpIHtcbiAgICByZXR1cm4gdGhpcy5ydW50aW1lc1swXTtcbiAgfSBlbHNlIGlmIChjb25zdHJhaW50cy5wbGFjZW1lbnQgPT09ICdzdGFibGUnKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMucG9saWNpZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIGlmICh0aGlzLnBvbGljaWVzW2ldLmJhY2tncm91bmQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucnVudGltZXNbaV07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gU3RlcCAzOiBpZiB0aGUgbW9kdWxlIG5lZWRzIGxvbmdldml0eSAvIGludGVyYWN0aXZpdHksIGl0IG1heSB3YW50IHRvIGJlIHJlbW90ZS5cbiAgcmV0dXJuIHRoaXMucnVudGltZXNbMF07XG59O1xuXG4vKipcbiAqIERldGVybWluZSBpZiBhIGtub3duIHJ1bnRpbWUgaXMgcnVubmluZyBhbiBhcHByb3ByaWF0ZSBpbnN0YW5jZSBvZiBhIG1vZHVsZS5cbiAqIEBtZXRob2QgaXNSdW5uaW5nXG4gKiBAcGFyYW0ge09iamVjdH0gcnVudGltZSBUaGUgcnVudGltZSB0byBjaGVjay5cbiAqIEBwYXJhbSB7U3RyaW5nfSBpZCBUaGUgbW9kdWxlIHRvIGxvb2sgZm9yLlxuICogQHBhcmFtIHtTdHJpbmdbXX0gZnJvbSBUaGUgaWRlbnRpZmllciBvZiB0aGUgcmVxdWVzdGluZyBtb2R1bGUuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGZ1bGxNYXRjaCBJZiB0aGUgbW9kdWxlIG5lZWRzIHRvIGJlIGluIHRoZSBzYW1lIGFwcC5cbiAqIEByZXR1cm5zIHtTdHJpbmd8Qm9vbGVhbn0gVGhlIE1vZHVsZSBpZCBpZiBpdCBpcyBydW5uaW5nLCBvciBmYWxzZSBpZiBub3QuXG4gKi9cblBvbGljeS5wcm90b3R5cGUuaXNSdW5uaW5nID0gZnVuY3Rpb24ocnVudGltZSwgaWQsIGZyb20sIGZ1bGxNYXRjaCkge1xuICB2YXIgaSA9IDAsIGogPSAwLCBva2F5O1xuICBmb3IgKGkgPSAwOyBpIDwgcnVudGltZS5tb2R1bGVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgaWYgKGZ1bGxNYXRjaCAmJiBydW50aW1lLm1vZHVsZXNbaV0ubGVuZ3RoID09PSBmcm9tLmxlbmd0aCArIDEpIHtcbiAgICAgIG9rYXkgPSB0cnVlO1xuICAgICAgZm9yIChqID0gMDsgaiA8IGZyb20ubGVuZ3RoOyBqICs9IDEpIHtcbiAgICAgICAgaWYgKHJ1bnRpbWUubW9kdWxlc1tpXVtqICsgMV0uaW5kZXhPZihmcm9tW2pdKSAhPT0gMCkge1xuICAgICAgICAgIG9rYXkgPSBmYWxzZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHJ1bnRpbWUubW9kdWxlc1tpXVswXS5pbmRleE9mKGlkKSAhPT0gMCkge1xuICAgICAgICBva2F5ID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChva2F5KSB7XG4gICAgICAgIHJldHVybiBydW50aW1lLm1vZHVsZXNbaV1bMF07XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICghZnVsbE1hdGNoICYmIHJ1bnRpbWUubW9kdWxlc1tpXVswXS5pbmRleE9mKGlkKSA9PT0gMCkge1xuICAgICAgcmV0dXJuIHJ1bnRpbWUubW9kdWxlc1tpXVswXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBHZXQgYSBwcm9taXNlIG9mIHRoZSBtYW5pZmVzdCBmb3IgYSBtb2R1bGUgSUQuXG4gKiBAbWV0aG9kIGxvYWRNYW5pZmVzdFxuICogQHBhcmFtIHtTdHJpbmd9IG1hbmlmZXN0IFRoZSBjYW5vbmljYWwgSUQgb2YgdGhlIG1hbmlmZXN0XG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSBmb3IgdGhlIGpzb24gY29udGVudHMgb2YgdGhlIG1hbmlmZXN0LlxuICovXG5Qb2xpY3kucHJvdG90eXBlLmxvYWRNYW5pZmVzdCA9IGZ1bmN0aW9uKG1hbmlmZXN0KSB7XG4gIHJldHVybiB0aGlzLnJlc291cmNlLmdldENvbnRlbnRzKG1hbmlmZXN0KS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgcmVzcCA9IHt9O1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShkYXRhKTtcbiAgICB9IGNhdGNoKGVycikge1xuICAgICAgdGhpcy5kZWJ1Zy5lcnJvcihcIkZhaWxlZCB0byBsb2FkIFwiICsgbWFuaWZlc3QgKyBcIjogXCIgKyBlcnIpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gTWFuaWZlc3QgQXZhaWxhYmxlXCIpO1xuICAgIH1cbiAgfS5iaW5kKHRoaXMpKTtcbn07XG5cbi8qKlxuICogQWRkIGEgcnVudGltZSB0byBrZWVwIHRyYWNrIG9mIGluIHRoaXMgcG9saWN5LlxuICogQG1ldGhvZCBhZGRcbiAqIEBwYXJhbSB7ZmRvbS5wb3J0fSBwb3J0IFRoZSBwb3J0IHRvIHVzZSBmb3IgbW9kdWxlIGxpZmV0aW1lIGluZm9cbiAqIEBwYXJhbSB7T2JqZWN0fSBwb2xpY3kgVGhlIHBvbGljeSBvZiB0aGUgcnVudGltZS5cbiAqL1xuUG9saWN5LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihwb3J0LCBwb2xpY3kpIHtcbiAgdmFyIHJ1bnRpbWUgPSB7XG4gICAgbWFuYWdlcjogcG9ydCxcbiAgICBtb2R1bGVzOiBbXVxuICB9O1xuICB0aGlzLnJ1bnRpbWVzLnB1c2gocnVudGltZSk7XG4gIHRoaXMucG9saWNpZXMucHVzaCh0aGlzLm92ZXJsYXkodGhpcy5kZWZhdWx0UG9saWN5LCBwb2xpY3kpKTtcblxuICBwb3J0Lm9uKCdtb2R1bGVBZGQnLCBmdW5jdGlvbihydW50aW1lLCBpbmZvKSB7XG4gICAgdmFyIGxpbmVhZ2UgPSBbXTtcbiAgICBsaW5lYWdlID0gbGluZWFnZS5jb25jYXQoaW5mby5saW5lYWdlKTtcbiAgICBsaW5lYWdlWzBdID0gaW5mby5pZDtcbiAgICBydW50aW1lLm1vZHVsZXMucHVzaChsaW5lYWdlKTtcbiAgICBpZiAodGhpcy5wZW5kaW5nW2luZm8ubGluZWFnZVswXV0pIHtcbiAgICAgIGRlbGV0ZSB0aGlzLnBlbmRpbmdbaW5mby5saW5lYWdlWzBdXTtcbiAgICAgIHRoaXMuZW1pdCgncGxhY2VkJyk7XG4gICAgfVxuICB9LmJpbmQodGhpcywgcnVudGltZSkpO1xuICBwb3J0Lm9uKCdtb2R1bGVSZW1vdmUnLCBmdW5jdGlvbihydW50aW1lLCBpbmZvKSB7XG4gICAgdmFyIGxpbmVhZ2UgPSBbXSwgaSwgbW9kRmluZ2VycHJpbnQ7XG4gICAgbGluZWFnZSA9IGxpbmVhZ2UuY29uY2F0KGluZm8ubGluZWFnZSk7XG4gICAgbGluZWFnZVswXSA9IGluZm8uaWQ7XG4gICAgbW9kRmluZ2VycHJpbnQgPSBsaW5lYWdlLnRvU3RyaW5nKCk7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgcnVudGltZS5tb2R1bGVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBpZiAocnVudGltZS5tb2R1bGVzW2ldLnRvU3RyaW5nKCkgPT09IG1vZEZpbmdlcnByaW50KSB7XG4gICAgICAgIHJ1bnRpbWUubW9kdWxlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5kZWJ1Zy53YXJuKCdVbmtub3duIG1vZHVsZSB0byByZW1vdmU6ICcsIGluZm8uaWQpO1xuICB9LmJpbmQodGhpcywgcnVudGltZSkpO1xufTtcblxuLyoqXG4gKiBPdmVybGF5IGEgc3BlY2lmaWMgcG9saWN5IG9yIGNvbnN0cmFpbnQgaW5zdGFuY2Ugb24gZGVmYXVsdCBzZXR0aW5ncy5cbiAqIFRPRE86IGNvbnNpZGVyIG1ha2luZyBzdGF0aWMuXG4gKiBAbWV0aG9kIG92ZXJsYXlcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gYmFzZSBUaGUgZGVmYXVsdCBvYmplY3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBvdmVybGF5IFRoZSBzdXBlcmNlZWRpbmcgb2JqZWN0XG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBvYmplY3Qgd2l0aCBiYXNlIHBhcmFtZXRlcnMgd2hlbiBub3Qgc2V0IGluIG92ZXJsYXkuXG4gKi9cblBvbGljeS5wcm90b3R5cGUub3ZlcmxheSA9IGZ1bmN0aW9uKGJhc2UsIG92ZXJsYXkpIHtcbiAgdmFyIHJldCA9IHt9O1xuXG4gIHV0aWwubWl4aW4ocmV0LCBiYXNlKTtcbiAgaWYgKG92ZXJsYXkpIHtcbiAgICB1dGlsLm1peGluKHJldCwgb3ZlcmxheSwgdHJ1ZSk7XG4gIH1cbiAgcmV0dXJuIHJldDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUG9saWN5O1xuIiwiLypqc2xpbnQgaW5kZW50OjIsIG5vZGU6dHJ1ZSwgc2xvcHB5OnRydWUsIGJyb3dzZXI6dHJ1ZSAqL1xudmFyIENvbnN1bWVyID0gcmVxdWlyZSgnLi9jb25zdW1lcicpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuLyoqXG4gKiBBIGZyZWVkb20gcG9ydCBmb3IgYSB1c2VyLWFjY2Vzc2FibGUgcHJvdmlkZXIuXG4gKiBAY2xhc3MgUHJvdmlkZXJcbiAqIEBpbXBsZW1lbnRzIFBvcnRcbiAqIEB1c2VzIGhhbmRsZUV2ZW50c1xuICogQHBhcmFtIHtPYmplY3R9IGRlZiBUaGUgaW50ZXJmYWNlIG9mIHRoZSBwcm92aWRlci5cbiAqIEBwYXJhbSB7RGVidWd9IGRlYnVnIFRoZSBkZWJ1Z2dlciB0byB1c2UgZm9yIGxvZ2dpbmcuXG4gKiBAY29udHJ1Y3RvclxuICovXG52YXIgUHJvdmlkZXIgPSBmdW5jdGlvbiAoZGVmLCBkZWJ1Zykge1xuICB0aGlzLmlkID0gQ29uc3VtZXIubmV4dElkKCk7XG4gIHV0aWwuaGFuZGxlRXZlbnRzKHRoaXMpO1xuICB0aGlzLmRlYnVnID0gZGVidWc7XG4gIFxuICB0aGlzLmRlZmluaXRpb24gPSBkZWY7XG4gIHRoaXMubW9kZSA9IFByb3ZpZGVyLm1vZGUuc3luY2hyb25vdXM7XG4gIHRoaXMuY2hhbm5lbHMgPSB7fTtcbiAgdGhpcy5pZmFjZSA9IG51bGw7XG4gIHRoaXMucHJvdmlkZXJDbHMgPSBudWxsO1xuICB0aGlzLnByb3ZpZGVySW5zdGFuY2VzID0ge307XG59O1xuXG4vKipcbiAqIFByb3ZpZGVyIG1vZGVzIG9mIG9wZXJhdGlvbi5cbiAqIEBwcm9wZXJ0eSBtb2RlXG4gKiBAc3RhdGljXG4gKiBAdHlwZSBudW1iZXJcbiAqL1xuUHJvdmlkZXIubW9kZSA9IHtcbiAgc3luY2hyb25vdXM6IDAsXG4gIGFzeW5jaHJvbm91czogMSxcbiAgcHJvbWlzZXM6IDJcbn07XG5cbi8qKlxuICogUmVjZWl2ZSBleHRlcm5hbCBtZXNzYWdlcyBmb3IgdGhlIHByb3ZpZGVyLlxuICogQG1ldGhvZCBvbk1lc3NhZ2VcbiAqIEBwYXJhbSB7U3RyaW5nfSBzb3VyY2UgdGhlIHNvdXJjZSBpZGVudGlmaWVyIG9mIHRoZSBtZXNzYWdlLlxuICogQHBhcmFtIHtPYmplY3R9IG1lc3NhZ2UgVGhlIHJlY2VpdmVkIG1lc3NhZ2UuXG4gKi9cblByb3ZpZGVyLnByb3RvdHlwZS5vbk1lc3NhZ2UgPSBmdW5jdGlvbiAoc291cmNlLCBtZXNzYWdlKSB7XG4gIGlmIChzb3VyY2UgPT09ICdjb250cm9sJyAmJiBtZXNzYWdlLnJldmVyc2UpIHtcbiAgICB0aGlzLmNoYW5uZWxzW21lc3NhZ2UubmFtZV0gPSBtZXNzYWdlLmNoYW5uZWw7XG4gICAgdGhpcy5lbWl0KG1lc3NhZ2UuY2hhbm5lbCwge1xuICAgICAgdHlwZTogJ2NoYW5uZWwgYW5ub3VuY2VtZW50JyxcbiAgICAgIGNoYW5uZWw6IG1lc3NhZ2UucmV2ZXJzZVxuICAgIH0pO1xuICAgIHRoaXMuZW1pdCgnc3RhcnQnKTtcbiAgfSBlbHNlIGlmIChzb3VyY2UgPT09ICdjb250cm9sJyAmJiBtZXNzYWdlLnR5cGUgPT09ICdzZXR1cCcpIHtcbiAgICB0aGlzLmNvbnRyb2xDaGFubmVsID0gbWVzc2FnZS5jaGFubmVsO1xuICB9IGVsc2UgaWYgKHNvdXJjZSA9PT0gJ2NvbnRyb2wnICYmIG1lc3NhZ2UudHlwZSA9PT0gJ2Nsb3NlJykge1xuICAgIGlmIChtZXNzYWdlLmNoYW5uZWwgPT09IHRoaXMuY29udHJvbENoYW5uZWwpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLmNvbnRyb2xDaGFubmVsO1xuICAgIH1cbiAgICB0aGlzLmNsb3NlKCk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKCF0aGlzLmNoYW5uZWxzW3NvdXJjZV0gJiYgbWVzc2FnZS5jaGFubmVsKSB7XG4gICAgICB0aGlzLmNoYW5uZWxzW3NvdXJjZV0gPSBtZXNzYWdlLmNoYW5uZWw7XG4gICAgICB0aGlzLmVtaXQoJ3N0YXJ0Jyk7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmICghdGhpcy5jaGFubmVsc1tzb3VyY2VdKSB7XG4gICAgICB0aGlzLmRlYnVnLndhcm4oJ01lc3NhZ2UgZnJvbSB1bmNvbmZpZ3VyZWQgc291cmNlOiAnICsgc291cmNlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAobWVzc2FnZS50eXBlID09PSAnY2xvc2UnICYmIG1lc3NhZ2UudG8pIHtcbiAgICAgIGRlbGV0ZSB0aGlzLnByb3ZpZGVySW5zdGFuY2VzW3NvdXJjZV1bbWVzc2FnZS50b107XG4gICAgfSBlbHNlIGlmIChtZXNzYWdlLnRvICYmIHRoaXMucHJvdmlkZXJJbnN0YW5jZXNbc291cmNlXSAmJlxuICAgICAgICAgICAgICAgdGhpcy5wcm92aWRlckluc3RhbmNlc1tzb3VyY2VdW21lc3NhZ2UudG9dKSB7XG4gICAgICBtZXNzYWdlLm1lc3NhZ2UudG8gPSBtZXNzYWdlLnRvO1xuICAgICAgdGhpcy5wcm92aWRlckluc3RhbmNlc1tzb3VyY2VdW21lc3NhZ2UudG9dKG1lc3NhZ2UubWVzc2FnZSk7XG4gICAgfSBlbHNlIGlmIChtZXNzYWdlLnRvICYmIG1lc3NhZ2UubWVzc2FnZSAmJlxuICAgICAgICBtZXNzYWdlLm1lc3NhZ2UudHlwZSA9PT0gJ2NvbnN0cnVjdCcpIHtcbiAgICAgIHZhciBhcmdzID0gQ29uc3VtZXIucG9ydGFibGVUb01lc3NhZ2UoXG4gICAgICAgICAgKHRoaXMuZGVmaW5pdGlvbi5jb25zdHJ1Y3RvciAmJiB0aGlzLmRlZmluaXRpb24uY29uc3RydWN0b3IudmFsdWUpID9cbiAgICAgICAgICAgICAgdGhpcy5kZWZpbml0aW9uLmNvbnN0cnVjdG9yLnZhbHVlIDogW10sXG4gICAgICAgICAgbWVzc2FnZS5tZXNzYWdlLFxuICAgICAgICAgIHRoaXMuZGVidWdcbiAgICAgICAgKTtcbiAgICAgIGlmICghdGhpcy5wcm92aWRlckluc3RhbmNlc1tzb3VyY2VdKSB7XG4gICAgICAgIHRoaXMucHJvdmlkZXJJbnN0YW5jZXNbc291cmNlXSA9IHt9O1xuICAgICAgfVxuICAgICAgdGhpcy5wcm92aWRlckluc3RhbmNlc1tzb3VyY2VdW21lc3NhZ2UudG9dID0gdGhpcy5nZXRQcm92aWRlcihzb3VyY2UsIG1lc3NhZ2UudG8sIGFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRlYnVnLndhcm4odGhpcy50b1N0cmluZygpICsgJyBkcm9wcGluZyBtZXNzYWdlICcgK1xuICAgICAgICAgIEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UpKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQ2xvc2UgLyB0ZWFyZG93biB0aGUgZmxvdyB0aGlzIHByb3ZpZGVyIHRlcm1pbmF0ZXMuXG4gKiBAbWV0aG9kIGNsb3NlXG4gKi9cblByb3ZpZGVyLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuY29udHJvbENoYW5uZWwpIHtcbiAgICB0aGlzLmVtaXQodGhpcy5jb250cm9sQ2hhbm5lbCwge1xuICAgICAgdHlwZTogJ1Byb3ZpZGVyIENsb3NpbmcnLFxuICAgICAgcmVxdWVzdDogJ2Nsb3NlJ1xuICAgIH0pO1xuICAgIGRlbGV0ZSB0aGlzLmNvbnRyb2xDaGFubmVsO1xuICB9XG4gIHRoaXMuZW1pdCgnY2xvc2UnKTtcblxuICB0aGlzLnByb3ZpZGVySW5zdGFuY2VzID0ge307XG4gIHRoaXMuZW1pdENoYW5uZWwgPSBudWxsO1xufTtcblxuLyoqXG4gKiBHZXQgYW4gaW50ZXJmYWNlIHRvIGV4cG9zZSBleHRlcm5hbGx5IHJlcHJlc2VudGluZyB0aGlzIHBvcnQuXG4gKiBQcm92aWRlcnMgYXJlIHJlZ2lzdGVyZWQgd2l0aCB0aGUgcG9ydCB1c2luZyBlaXRoZXJcbiAqIHByb3ZpZGVTeW5jaHJvbm91cyBvciBwcm92aWRlQXN5bmNocm9ub3VzIGRlcGVuZGluZyBvbiB0aGUgZGVzaXJlZFxuICogcmV0dXJuIGludGVyZmFjZS5cbiAqIEBtZXRob2QgZ2V0SW50ZXJmYWNlXG4gKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBleHRlcm5hbCBpbnRlcmZhY2Ugb2YgdGhpcyBQcm92aWRlci5cbiAqL1xuUHJvdmlkZXIucHJvdG90eXBlLmdldEludGVyZmFjZSA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuaWZhY2UpIHtcbiAgICByZXR1cm4gdGhpcy5pZmFjZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmlmYWNlID0ge1xuICAgICAgcHJvdmlkZVN5bmNocm9ub3VzOiBmdW5jdGlvbiAocHJvdikge1xuICAgICAgICB0aGlzLnByb3ZpZGVyQ2xzID0gcHJvdjtcbiAgICAgICAgdGhpcy5tb2RlID0gUHJvdmlkZXIubW9kZS5zeW5jaHJvbm91cztcbiAgICAgIH0uYmluZCh0aGlzKSxcbiAgICAgIHByb3ZpZGVBc3luY2hyb25vdXM6IGZ1bmN0aW9uIChwcm92KSB7XG4gICAgICAgIHRoaXMucHJvdmlkZXJDbHMgPSBwcm92O1xuICAgICAgICB0aGlzLm1vZGUgPSBQcm92aWRlci5tb2RlLmFzeW5jaHJvbm91cztcbiAgICAgIH0uYmluZCh0aGlzKSxcbiAgICAgIHByb3ZpZGVQcm9taXNlczogZnVuY3Rpb24gKHByb3YpIHtcbiAgICAgICAgdGhpcy5wcm92aWRlckNscyA9IHByb3Y7XG4gICAgICAgIHRoaXMubW9kZSA9IFByb3ZpZGVyLm1vZGUucHJvbWlzZXM7XG4gICAgICB9LmJpbmQodGhpcyksXG4gICAgICBjbG9zZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICB9LmJpbmQodGhpcylcbiAgICB9O1xuXG4gICAgdXRpbC5lYWNoUHJvcCh0aGlzLmRlZmluaXRpb24sIGZ1bmN0aW9uIChwcm9wLCBuYW1lKSB7XG4gICAgICBzd2l0Y2ggKHByb3AudHlwZSkge1xuICAgICAgY2FzZSBcImNvbnN0YW50XCI6XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLmlmYWNlLCBuYW1lLCB7XG4gICAgICAgICAgdmFsdWU6IENvbnN1bWVyLnJlY3Vyc2l2ZUZyZWV6ZU9iamVjdChwcm9wLnZhbHVlKSxcbiAgICAgICAgICB3cml0YWJsZTogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICByZXR1cm4gdGhpcy5pZmFjZTtcbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGUgYSBmdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHRvIGdldCBpbnRlcmZhY2VzIGZyb20gdGhpcyBwcm92aWRlciBmcm9tXG4gKiBhIHVzZXItdmlzaWJsZSBwb2ludC5cbiAqIEBtZXRob2QgZ2V0UHJveHlJbnRlcmZhY2VcbiAqL1xuUHJvdmlkZXIucHJvdG90eXBlLmdldFByb3h5SW50ZXJmYWNlID0gZnVuY3Rpb24gKCkge1xuICB2YXIgZnVuYyA9IGZ1bmN0aW9uIChwKSB7XG4gICAgcmV0dXJuIHAuZ2V0SW50ZXJmYWNlKCk7XG4gIH0uYmluZCh7fSwgdGhpcyk7XG5cbiAgZnVuYy5jbG9zZSA9IGZ1bmN0aW9uIChpZmFjZSkge1xuICAgIGlmIChpZmFjZSkge1xuICAgICAgdXRpbC5lYWNoUHJvcCh0aGlzLmlmYWNlcywgZnVuY3Rpb24gKGNhbmRpZGF0ZSwgaWQpIHtcbiAgICAgICAgaWYgKGNhbmRpZGF0ZSA9PT0gaWZhY2UpIHtcbiAgICAgICAgICB0aGlzLnRlYXJkb3duKGlkKTtcbiAgICAgICAgICB0aGlzLmVtaXQodGhpcy5lbWl0Q2hhbm5lbCwge1xuICAgICAgICAgICAgdHlwZTogJ2Nsb3NlJyxcbiAgICAgICAgICAgIHRvOiBpZFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBDbG9zZSB0aGUgY2hhbm5lbC5cbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9XG4gIH0uYmluZCh0aGlzKTtcblxuICBmdW5jLm9uQ2xvc2UgPSBmdW5jdGlvbiAoaWZhY2UsIGhhbmRsZXIpIHtcbiAgICBpZiAodHlwZW9mIGlmYWNlID09PSAnZnVuY3Rpb24nICYmIGhhbmRsZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gQWRkIGFuIG9uLWNoYW5uZWwtY2xvc2VkIGhhbmRsZXIuXG4gICAgICB0aGlzLm9uY2UoJ2Nsb3NlJywgaWZhY2UpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHV0aWwuZWFjaFByb3AodGhpcy5pZmFjZXMsIGZ1bmN0aW9uIChjYW5kaWRhdGUsIGlkKSB7XG4gICAgICBpZiAoY2FuZGlkYXRlID09PSBpZmFjZSkge1xuICAgICAgICBpZiAodGhpcy5oYW5kbGVyc1tpZF0pIHtcbiAgICAgICAgICB0aGlzLmhhbmRsZXJzW2lkXS5wdXNoKGhhbmRsZXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuaGFuZGxlcnNbaWRdID0gW2hhbmRsZXJdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG4gIH0uYmluZCh0aGlzKTtcblxuICByZXR1cm4gZnVuYztcbn07XG5cbi8qKlxuICogR2V0IGEgbmV3IGluc3RhbmNlIG9mIHRoZSByZWdpc3RlcmVkIHByb3ZpZGVyLlxuICogQG1ldGhvZCBnZXRQcm92aWRlclxuICogQHBhcmFtIHtTdHJpbmd9IHNvdXJjZSBUaGUgcG9ydCB0aGlzIGluc3RhbmNlIGlzIGludGVyYWN0aWduIHdpdGguXG4gKiBAcGFyYW0ge1N0cmluZ30gaWRlbnRpZmllciB0aGUgbWVzc2FnYWJsZSBhZGRyZXNzIGZvciB0aGlzIHByb3ZpZGVyLlxuICogQHBhcmFtIHtBcnJheX0gYXJncyBDb25zdHJ1Y3RvciBhcmd1bWVudHMgZm9yIHRoZSBwcm92aWRlci5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBBIGZ1bmN0aW9uIHRvIHNlbmQgbWVzc2FnZXMgdG8gdGhlIHByb3ZpZGVyLlxuICovXG5Qcm92aWRlci5wcm90b3R5cGUuZ2V0UHJvdmlkZXIgPSBmdW5jdGlvbiAoc291cmNlLCBpZGVudGlmaWVyLCBhcmdzKSB7XG4gIGlmICghdGhpcy5wcm92aWRlckNscykge1xuICAgIHRoaXMuZGVidWcud2FybignQ2Fubm90IGluc3RhbnRpYXRlIHByb3ZpZGVyLCBzaW5jZSBpdCBpcyBub3QgcHJvdmlkZWQnKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHZhciBldmVudHMgPSB7fSxcbiAgICBkaXNwYXRjaEV2ZW50LFxuICAgIEJvdW5kQ2xhc3MsXG4gICAgaW5zdGFuY2U7XG5cbiAgdXRpbC5lYWNoUHJvcCh0aGlzLmRlZmluaXRpb24sIGZ1bmN0aW9uIChwcm9wLCBuYW1lKSB7XG4gICAgaWYgKHByb3AudHlwZSA9PT0gJ2V2ZW50Jykge1xuICAgICAgZXZlbnRzW25hbWVdID0gcHJvcDtcbiAgICB9XG4gIH0pO1xuXG4gIGRpc3BhdGNoRXZlbnQgPSBmdW5jdGlvbiAoc3JjLCBldiwgaWQsIG5hbWUsIHZhbHVlKSB7XG4gICAgaWYgKGV2W25hbWVdKSB7XG4gICAgICB2YXIgc3RyZWFtcyA9IENvbnN1bWVyLm1lc3NhZ2VUb1BvcnRhYmxlKGV2W25hbWVdLnZhbHVlLCB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGVidWcpO1xuICAgICAgdGhpcy5lbWl0KHRoaXMuY2hhbm5lbHNbc3JjXSwge1xuICAgICAgICB0eXBlOiAnbWVzc2FnZScsXG4gICAgICAgIHRvOiBpZCxcbiAgICAgICAgbWVzc2FnZToge1xuICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgdHlwZTogJ2V2ZW50JyxcbiAgICAgICAgICB0ZXh0OiBzdHJlYW1zLnRleHQsXG4gICAgICAgICAgYmluYXJ5OiBzdHJlYW1zLmJpbmFyeVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH0uYmluZCh0aGlzLCBzb3VyY2UsIGV2ZW50cywgaWRlbnRpZmllcik7XG5cbiAgLy8gdGhpcyBpcyBhbGwgdG8gc2F5OiBuZXcgcHJvdmlkZXJDbHMoZGlzcGF0Y2hFdmVudCwgYXJnc1swXSwgYXJnc1sxXSwuLi4pXG4gIEJvdW5kQ2xhc3MgPSB0aGlzLnByb3ZpZGVyQ2xzLmJpbmQuYXBwbHkodGhpcy5wcm92aWRlckNscyxcbiAgICAgIFt0aGlzLnByb3ZpZGVyQ2xzLCBkaXNwYXRjaEV2ZW50XS5jb25jYXQoYXJncyB8fCBbXSkpO1xuICBpbnN0YW5jZSA9IG5ldyBCb3VuZENsYXNzKCk7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChwb3J0LCBzcmMsIG1zZykge1xuICAgIGlmIChtc2cuYWN0aW9uID09PSAnbWV0aG9kJykge1xuICAgICAgaWYgKHR5cGVvZiB0aGlzW21zZy50eXBlXSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBwb3J0LmRlYnVnLndhcm4oXCJQcm92aWRlciBkb2VzIG5vdCBpbXBsZW1lbnQgXCIgKyBtc2cudHlwZSArIFwiKCkhXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgcHJvcCA9IHBvcnQuZGVmaW5pdGlvblttc2cudHlwZV0sXG4gICAgICAgIGRlYnVnID0gcG9ydC5kZWJ1ZyxcbiAgICAgICAgYXJncyA9IENvbnN1bWVyLnBvcnRhYmxlVG9NZXNzYWdlKHByb3AudmFsdWUsIG1zZywgZGVidWcpLFxuICAgICAgICByZXQgPSBmdW5jdGlvbiAoc3JjLCBtc2csIHByb3AsIHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgIHZhciBzdHJlYW1zID0gQ29uc3VtZXIubWVzc2FnZVRvUG9ydGFibGUocHJvcC5yZXQsIHJlc29sdmUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVidWcpO1xuICAgICAgICAgIHRoaXMuZW1pdCh0aGlzLmNoYW5uZWxzW3NyY10sIHtcbiAgICAgICAgICAgIHR5cGU6ICdtZXRob2QnLFxuICAgICAgICAgICAgdG86IG1zZy50byxcbiAgICAgICAgICAgIG1lc3NhZ2U6IHtcbiAgICAgICAgICAgICAgdG86IG1zZy50byxcbiAgICAgICAgICAgICAgdHlwZTogJ21ldGhvZCcsXG4gICAgICAgICAgICAgIHJlcUlkOiBtc2cucmVxSWQsXG4gICAgICAgICAgICAgIG5hbWU6IG1zZy50eXBlLFxuICAgICAgICAgICAgICB0ZXh0OiBzdHJlYW1zLnRleHQsXG4gICAgICAgICAgICAgIGJpbmFyeTogc3RyZWFtcy5iaW5hcnksXG4gICAgICAgICAgICAgIGVycm9yOiByZWplY3RcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfS5iaW5kKHBvcnQsIHNyYywgbXNnLCBwcm9wKTtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShhcmdzKSkge1xuICAgICAgICBhcmdzID0gW2FyZ3NdO1xuICAgICAgfVxuICAgICAgaWYgKHBvcnQubW9kZSA9PT0gUHJvdmlkZXIubW9kZS5zeW5jaHJvbm91cykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldCh0aGlzW21zZy50eXBlXS5hcHBseSh0aGlzLCBhcmdzKSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICByZXQodW5kZWZpbmVkLCBlLm1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHBvcnQubW9kZSA9PT0gUHJvdmlkZXIubW9kZS5hc3luY2hyb25vdXMpIHtcbiAgICAgICAgdGhpc1ttc2cudHlwZV0uYXBwbHkoaW5zdGFuY2UsIGFyZ3MuY29uY2F0KHJldCkpO1xuICAgICAgfSBlbHNlIGlmIChwb3J0Lm1vZGUgPT09IFByb3ZpZGVyLm1vZGUucHJvbWlzZXMpIHtcbiAgICAgICAgdGhpc1ttc2cudHlwZV0uYXBwbHkodGhpcywgYXJncykudGhlbihyZXQsIHJldC5iaW5kKHt9LCB1bmRlZmluZWQpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0uYmluZChpbnN0YW5jZSwgdGhpcywgc291cmNlKTtcbn07XG5cbi8qKlxuICogR2V0IGEgdGV4dHVhbCBkZXNjcmlwdGlvbiBvZiB0aGlzIHBvcnQuXG4gKiBAbWV0aG9kIHRvU3RyaW5nXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHRoZSBkZXNjcmlwdGlvbiBvZiB0aGlzIHBvcnQuXG4gKi9cblByb3ZpZGVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuZW1pdENoYW5uZWwpIHtcbiAgICByZXR1cm4gXCJbUHJvdmlkZXIgXCIgKyB0aGlzLmVtaXRDaGFubmVsICsgXCJdXCI7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIFwiW3VuYm91bmQgUHJvdmlkZXJdXCI7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvdmlkZXI7XG4iLCIvKmpzbGludCBpbmRlbnQ6Miwgd2hpdGU6dHJ1ZSwgbm9kZTp0cnVlLCBzbG9wcHk6dHJ1ZSwgYnJvd3Nlcjp0cnVlICovXG52YXIgUHJvbWlzZUNvbXBhdCA9IHJlcXVpcmUoJ2VzNi1wcm9taXNlJykuUHJvbWlzZTtcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG52YXIgQ29uc3VtZXIgPSByZXF1aXJlKCcuLi9jb25zdW1lcicpO1xuXG52YXIgQXBpSW50ZXJmYWNlID0gZnVuY3Rpb24oZGVmLCBvbk1zZywgZW1pdCwgZGVidWcpIHtcbiAgdmFyIGluZmxpZ2h0ID0ge30sXG4gICAgICBldmVudHMgPSBudWxsLFxuICAgICAgZW1pdHRlciA9IG51bGwsXG4gICAgICByZXFJZCA9IDAsXG4gICAgICBhcmdzID0gYXJndW1lbnRzO1xuXG4gIHV0aWwuZWFjaFByb3AoZGVmLCBmdW5jdGlvbihwcm9wLCBuYW1lKSB7XG4gICAgc3dpdGNoKHByb3AudHlwZSkge1xuICAgIGNhc2UgJ21ldGhvZCc6XG4gICAgICB0aGlzW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIE5vdGU6IGluZmxpZ2h0IHNob3VsZCBiZSByZWdpc3RlcmVkIGJlZm9yZSBtZXNzYWdlIGlzIHBhc3NlZFxuICAgICAgICAvLyBpbiBvcmRlciB0byBwcmVwYXJlIGZvciBzeW5jaHJvbm91cyBpbi13aW5kb3cgcGlwZXMuXG4gICAgICAgIHZhciB0aGlzUmVxID0gcmVxSWQsXG4gICAgICAgICAgICBwcm9taXNlID0gbmV3IFByb21pc2VDb21wYXQoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgIGluZmxpZ2h0W3RoaXNSZXFdID0ge1xuICAgICAgICAgICAgICAgIHJlc29sdmU6cmVzb2x2ZSxcbiAgICAgICAgICAgICAgICByZWplY3Q6cmVqZWN0LFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiBwcm9wLnJldFxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBzdHJlYW1zID0gQ29uc3VtZXIubWVzc2FnZVRvUG9ydGFibGUocHJvcC52YWx1ZSxcbiAgICAgICAgICAgICAgICBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApLFxuICAgICAgICAgICAgICAgIGRlYnVnKTtcbiAgICAgICAgcmVxSWQgKz0gMTtcbiAgICAgICAgZW1pdCh7XG4gICAgICAgICAgYWN0aW9uOiAnbWV0aG9kJyxcbiAgICAgICAgICB0eXBlOiBuYW1lLFxuICAgICAgICAgIHJlcUlkOiB0aGlzUmVxLFxuICAgICAgICAgIHRleHQ6IHN0cmVhbXMudGV4dCxcbiAgICAgICAgICBiaW5hcnk6IHN0cmVhbXMuYmluYXJ5XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgIH07XG4gICAgICBicmVhaztcbiAgICBjYXNlICdldmVudCc6XG4gICAgICBpZighZXZlbnRzKSB7XG4gICAgICAgIHV0aWwuaGFuZGxlRXZlbnRzKHRoaXMpO1xuICAgICAgICBlbWl0dGVyID0gdGhpcy5lbWl0O1xuICAgICAgICBkZWxldGUgdGhpcy5lbWl0O1xuICAgICAgICBldmVudHMgPSB7fTtcbiAgICAgIH1cbiAgICAgIGV2ZW50c1tuYW1lXSA9IHByb3A7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjb25zdGFudCc6XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgbmFtZSwge1xuICAgICAgICB2YWx1ZTogQ29uc3VtZXIucmVjdXJzaXZlRnJlZXplT2JqZWN0KHByb3AudmFsdWUpLFxuICAgICAgICB3cml0YWJsZTogZmFsc2VcbiAgICAgIH0pO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9LmJpbmQodGhpcykpO1xuXG4gIG9uTXNnKHRoaXMsIGZ1bmN0aW9uKHR5cGUsIG1zZykge1xuICAgIGlmICh0eXBlID09PSAnY2xvc2UnKSB7XG4gICAgICB0aGlzLm9mZigpO1xuICAgICAgZGVsZXRlIHRoaXMuaW5mbGlnaHQ7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghbXNnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChtc2cudHlwZSA9PT0gJ21ldGhvZCcpIHtcbiAgICAgIGlmIChpbmZsaWdodFttc2cucmVxSWRdKSB7XG4gICAgICAgIHZhciByZXNvbHZlciA9IGluZmxpZ2h0W21zZy5yZXFJZF0sXG4gICAgICAgICAgICB0ZW1wbGF0ZSA9IHJlc29sdmVyLnRlbXBsYXRlO1xuICAgICAgICBkZWxldGUgaW5mbGlnaHRbbXNnLnJlcUlkXTtcbiAgICAgICAgaWYgKG1zZy5lcnJvcikge1xuICAgICAgICAgIHJlc29sdmVyLnJlamVjdChtc2cuZXJyb3IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc29sdmVyLnJlc29sdmUoQ29uc3VtZXIucG9ydGFibGVUb01lc3NhZ2UodGVtcGxhdGUsIG1zZywgZGVidWcpKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVidWcuZXJyb3IoJ0luY29taW5nIG1lc3NhZ2UgY2xhaW1lZCB0byBiZSBhbiBSUEMgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ3JldHVybmluZyBmb3IgdW5yZWdpc3RlcmVkIGNhbGwnLCBtc2cucmVxSWQpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAobXNnLnR5cGUgPT09ICdldmVudCcpIHtcbiAgICAgIGlmIChldmVudHNbbXNnLm5hbWVdKSB7XG4gICAgICAgIGVtaXR0ZXIobXNnLm5hbWUsIENvbnN1bWVyLnBvcnRhYmxlVG9NZXNzYWdlKGV2ZW50c1ttc2cubmFtZV0udmFsdWUsXG4gICAgICAgICAgICAgICAgbXNnLCBkZWJ1ZykpO1xuICAgICAgfVxuICAgIH1cbiAgfS5iaW5kKHRoaXMpKTtcblxuICBhcmdzID0gQ29uc3VtZXIubWVzc2FnZVRvUG9ydGFibGUoXG4gICAgICAoZGVmLmNvbnN0cnVjdG9yICYmIGRlZi5jb25zdHJ1Y3Rvci52YWx1ZSkgPyBkZWYuY29uc3RydWN0b3IudmFsdWUgOiBbXSxcbiAgICAgIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3MsIDQpLFxuICAgICAgZGVidWcpO1xuXG4gIGVtaXQoe1xuICAgIHR5cGU6ICdjb25zdHJ1Y3QnLFxuICAgIHRleHQ6IGFyZ3MudGV4dCxcbiAgICBiaW5hcnk6IGFyZ3MuYmluYXJ5XG4gIH0pO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBBcGlJbnRlcmZhY2U7XG4iLCIvKmpzbGludCBpbmRlbnQ6Miwgd2hpdGU6dHJ1ZSwgbm9kZTp0cnVlLCBzbG9wcHk6dHJ1ZSwgYnJvd3Nlcjp0cnVlICovXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxudmFyIEV2ZW50SW50ZXJmYWNlID0gZnVuY3Rpb24ob25Nc2csIGVtaXQsIGRlYnVnKSB7XG4gIHV0aWwuaGFuZGxlRXZlbnRzKHRoaXMpO1xuICBcbiAgb25Nc2codGhpcywgZnVuY3Rpb24oZW1pdCwgdHlwZSwgbXNnKSB7XG4gICAgZW1pdChtc2cudHlwZSwgbXNnLm1lc3NhZ2UpO1xuICB9LmJpbmQodGhpcywgdGhpcy5lbWl0KSk7XG5cbiAgdGhpcy5lbWl0ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSwgbXNnKSB7XG4gICAgZW1pdHRlcih7dHlwZTogdHlwZSwgbWVzc2FnZTogbXNnfSwgdHJ1ZSk7XG4gIH0uYmluZCh7fSwgZW1pdCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50SW50ZXJmYWNlO1xuIiwiLypqc2xpbnQgaW5kZW50OjIsIG5vZGU6dHJ1ZSAqL1xudmFyIFByb21pc2VDb21wYXQgPSByZXF1aXJlKCdlczYtcHJvbWlzZScpLlByb21pc2U7XG5cbnZhciBBcGlJbnRlcmZhY2UgPSByZXF1aXJlKCcuL3Byb3h5L2FwaUludGVyZmFjZScpO1xudmFyIEV2ZW50SW50ZXJmYWNlID0gcmVxdWlyZSgnLi9wcm94eS9ldmVudEludGVyZmFjZScpO1xudmFyIENvbnN1bWVyID0gcmVxdWlyZSgnLi9jb25zdW1lcicpO1xudmFyIFByb3ZpZGVyID0gcmVxdWlyZSgnLi9wcm92aWRlcicpO1xuXG4vKipcbiAqIEEgUHJveHkgQmluZGVyIG1hbmFnZXMgdGhlIGV4dGVybmFsIGludGVyZmFjZSwgYW5kIGNyZWF0ZXMgb25lIG9mXG4gKiB0aGUgZGlmZmVyZW50IHR5cGVzIG9mIG9iamVjdHMgZXhwb3NlZCBieSBmcmVlZG9tIGVpdGhlciBhcyBhIGdsb2JhbFxuICogd2l0aGluIGEgd29ya2VyIC8gbW9kdWxlIGNvbnRleHQsIG9yIHJldHVybmVkIGJ5IGFuIGV4dGVybmFsIGNhbGwgdG9cbiAqIGNyZWF0ZSBhIGZyZWVkb20gcnVudGltZS5cbiAqIEBDbGFzcyBQcm94eUJpbmRlclxuICogQHBhcmFtIHtNYW5hZ2VyfSBtYW5hZ2VyIFRoZSBtYW5hZ2VyIGZvciB0aGUgYWN0aXZlIHJ1bnRpbWUuXG4gKi9cbnZhciBQcm94eUJpbmRlciA9IGZ1bmN0aW9uIChtYW5hZ2VyKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgdGhpcy5tYW5hZ2VyID0gbWFuYWdlcjtcbn07XG5cbi8qKlxuICogQ3JlYXRlIGEgcHJveHkgZm9yIGEgZnJlZWRvbSBwb3J0LCBhbmQgcmV0dXJuIGl0IG9uY2UgbG9hZGVkLlxuICogQG1ldGhvZCBnZXRFeHRlcm5hbFxuICogQHBhcmFtIHtQb3J0fSBwb3J0IFRoZSBwb3J0IGZvciB0aGUgcHJveHkgdG8gY29tbXVuaWNhdGUgd2l0aC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBwcm94eS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbZGVmaW5pdGlvbl0gVGhlIGRlZmluaXRpb24gb2YgdGhlIEFQSSB0byBleHBvc2UuXG4gKiBAcGFyYW0ge1N0cmluZ30gZGVmaW5pdGlvbi5uYW1lIFRoZSBuYW1lIG9mIHRoZSBBUEkuXG4gKiBAcGFyYW0ge09iamVjdH0gZGVmaW5pdGlvbi5kZWZpbml0aW9uIFRoZSBkZWZpbml0aW9uIG9mIHRoZSBBUEkuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGRlZmluaXRpb24ucHJvdmlkZXMgV2hldGhlciB0aGlzIGlzIGEgY29uc3VtZXIgb3IgcHJvdmlkZXIuXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gQSBwcm9taXNlIGZvciB0aGUgYWN0aXZlIHByb3h5IGludGVyZmFjZS5cbiAqL1xuUHJveHlCaW5kZXIucHJvdG90eXBlLmdldEV4dGVybmFsID0gZnVuY3Rpb24gKHBvcnQsIG5hbWUsIGRlZmluaXRpb24pIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICB2YXIgcHJveHksIGFwaTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlQ29tcGF0KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICBpZiAoZGVmaW5pdGlvbikge1xuICAgICAgYXBpID0gZGVmaW5pdGlvbi5uYW1lO1xuICAgICAgaWYgKGRlZmluaXRpb24ucHJvdmlkZXMpIHtcbiAgICAgICAgcHJveHkgPSBuZXcgUHJvdmlkZXIoZGVmaW5pdGlvbi5kZWZpbml0aW9uLCB0aGlzLm1hbmFnZXIuZGVidWcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJveHkgPSBuZXcgQ29uc3VtZXIoQXBpSW50ZXJmYWNlLmJpbmQoe30sXG4gICAgICAgICAgICBkZWZpbml0aW9uLmRlZmluaXRpb24pLFxuICAgICAgICAgICAgdGhpcy5tYW5hZ2VyLmRlYnVnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcHJveHkgPSBuZXcgQ29uc3VtZXIoRXZlbnRJbnRlcmZhY2UsIHRoaXMubWFuYWdlci5kZWJ1Zyk7XG4gICAgfVxuXG4gICAgcHJveHkub25jZSgnc3RhcnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgaWZhY2UgPSBwcm94eS5nZXRQcm94eUludGVyZmFjZSgpO1xuICAgICAgaWYgKGFwaSkge1xuICAgICAgICBpZmFjZS5hcGkgPSBhcGk7XG4gICAgICB9XG4gICAgICByZXNvbHZlKHtcbiAgICAgICAgcG9ydDogcHJveHksXG4gICAgICAgIGV4dGVybmFsOiBpZmFjZVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLm1hbmFnZXIuY3JlYXRlTGluayhwb3J0LCBuYW1lLCBwcm94eSk7XG4gIH0uYmluZCh0aGlzKSk7XG59O1xuXG4vKipcbiAqIEJpbmQgdGhlIGRlZmF1bHQgcHJveHkgZm9yIGEgZnJlZWRvbSBwb3J0LlxuICogQG1ldGhvZCBiaW5kRGVmYXVsdFxuICogQHBhcmFtIHtQb3J0fSBwb3J0IFRoZSBwb3J0IGZvciB0aGUgcHJveHkgdG8gY29tbXVuaWNhdGUgd2l0aC5cbiAqIEBwYXJhbSB7QXBpfSBhcGkgVGhlIEFQSSBsb2FkZXIgd2l0aCBBUEkgZGVmaW5pdGlvbnMuXG4gKiBAcGFyYW0ge09iamVjdH0gbWFuaWZlc3QgVGhlIG1hbmlmZXN0IG9mIHRoZSBtb2R1bGUgdG8gZXhwb3NlLlxuICogQHBhcmFtIHtCb29sZWFufSBpbnRlcm5hbCBXaGV0aGVyIHRoZSBpbnRlcmZhY2UgaXMgZm9yIGluc2lkZSB0aGUgbW9kdWxlLlxuICogQHJldHVybnMge1Byb21pc2V9IEEgcHJvbWlzZSBmb3IgYSBwcm94eSBpbnRlcmZhY2UuXG4gKiBAcHJpdmF0ZVxuICovXG5Qcm94eUJpbmRlci5wcm90b3R5cGUuYmluZERlZmF1bHQgPSBmdW5jdGlvbiAocG9ydCwgYXBpLCBtYW5pZmVzdCwgaW50ZXJuYWwpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICB2YXIgbWV0YWRhdGEgPSB7XG4gICAgbmFtZTogbWFuaWZlc3QubmFtZSxcbiAgICBpY29uOiBtYW5pZmVzdC5pY29uLFxuICAgIGRlc2NyaXB0aW9uOiBtYW5pZmVzdC5kZXNjcmlwdGlvblxuICB9LCBkZWY7XG5cbiAgaWYgKG1hbmlmZXN0WydkZWZhdWx0J10pIHtcbiAgICBkZWYgPSBhcGkuZ2V0KG1hbmlmZXN0WydkZWZhdWx0J10pO1xuICAgIGlmICghZGVmICYmIG1hbmlmZXN0LmFwaSAmJiBtYW5pZmVzdC5hcGlbbWFuaWZlc3RbJ2RlZmF1bHQnXV0pIHtcbiAgICAgIGRlZiA9IHtcbiAgICAgICAgbmFtZTogbWFuaWZlc3RbJ2RlZmF1bHQnXSxcbiAgICAgICAgZGVmaW5pdGlvbjogbWFuaWZlc3QuYXBpW21hbmlmZXN0WydkZWZhdWx0J11dXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAoaW50ZXJuYWwgJiYgbWFuaWZlc3QucHJvdmlkZXMgJiZcbiAgICAgICAgbWFuaWZlc3QucHJvdmlkZXMuaW5kZXhPZihtYW5pZmVzdFsnZGVmYXVsdCddKSAhPT0gZmFsc2UpIHtcbiAgICAgIGRlZi5wcm92aWRlcyA9IHRydWU7XG4gICAgfSBlbHNlIGlmIChpbnRlcm5hbCkge1xuICAgICAgYXBpLmRlYnVnLndhcm4oXCJkZWZhdWx0IEFQSSBub3QgcHJvdmlkZWQsIFwiICtcbiAgICAgICAgICAgICAgICAgICAgIFwiYXJlIHlvdSBtaXNzaW5nIGEgcHJvdmlkZXMga2V5IGluIHlvdXIgbWFuaWZlc3Q/XCIpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzLmdldEV4dGVybmFsKHBvcnQsICdkZWZhdWx0JywgZGVmKS50aGVuKFxuICAgIGZ1bmN0aW9uIChtZXRhZGF0YSwgaW5mbykge1xuICAgICAgaW5mby5leHRlcm5hbC5tYW5pZmVzdCA9IG1ldGFkYXRhO1xuICAgICAgcmV0dXJuIGluZm87XG4gICAgfS5iaW5kKHRoaXMsIG1ldGFkYXRhKVxuICApO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQcm94eUJpbmRlcjtcbiIsIi8qZ2xvYmFscyBYTUxIdHRwUmVxdWVzdCAqL1xuLypqc2xpbnQgaW5kZW50OjIsbm9kZTp0cnVlLHNsb3BweTp0cnVlICovXG52YXIgUHJvbWlzZUNvbXBhdCA9IHJlcXVpcmUoJ2VzNi1wcm9taXNlJykuUHJvbWlzZTtcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuLyoqXG4gKiBUaGUgUmVzb3VyY2UgcmVnaXN0cnkgZm9yIEZyZWVET00uICBVc2VkIHRvIGxvb2sgdXAgcmVxdWVzdGVkIFJlc291cmNlcyxcbiAqIGFuZCBwcm92aWRlIGxvb2t1cCBhbmQgbWlncmF0aW9uIG9mIHJlc291cmNlcy5cbiAqIEBDbGFzcyBSZXNvdXJjZVxuICogQHBhcmFtIHtEZWJ1Z30gZGVidWcgVGhlIGxvZ2dlciB0byB1c2UgZm9yIGRlYnVnZ2luZy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG52YXIgUmVzb3VyY2UgPSBmdW5jdGlvbiAoZGVidWcpIHtcbiAgdGhpcy5kZWJ1ZyA9IGRlYnVnO1xuICB0aGlzLmZpbGVzID0ge307XG4gIHRoaXMucmVzb2x2ZXJzID0gW3RoaXMuaHR0cFJlc29sdmVyLCB0aGlzLm51bGxSZXNvbHZlcl07XG4gIHRoaXMuY29udGVudFJldHJpZXZlcnMgPSB7XG4gICAgJ2h0dHAnOiB0aGlzLnhoclJldHJpZXZlcixcbiAgICAnaHR0cHMnOiB0aGlzLnhoclJldHJpZXZlcixcbiAgICAnY2hyb21lLWV4dGVuc2lvbic6IHRoaXMueGhyUmV0cmlldmVyLFxuICAgICdyZXNvdXJjZSc6IHRoaXMueGhyUmV0cmlldmVyLFxuICAgICdjaHJvbWUnOiB0aGlzLnhoclJldHJpZXZlcixcbiAgICAnYXBwJzogdGhpcy54aHJSZXRyaWV2ZXIsXG4gICAgJ21hbmlmZXN0JzogdGhpcy5tYW5pZmVzdFJldHJpZXZlclxuICB9O1xufTtcblxuLyoqXG4gKiBSZXNvbHZlIGEgcmVzdXJjZSBVUkwgcmVxdWVzdGVkIGZyb20gYSBtb2R1bGUuXG4gKiBAbWV0aG9kIGdldFxuICogQHBhcmFtIHtTdHJpbmd9IG1hbmlmZXN0IFRoZSBjYW5vbmljYWwgYWRkcmVzcyBvZiB0aGUgbW9kdWxlIHJlcXVlc3RpbmcuXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsIFRoZSByZXNvdXJjZSB0byBnZXQuXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gQSBwcm9taXNlIGZvciB0aGUgcmVzb3VyY2UgYWRkcmVzcy5cbiAqL1xuUmVzb3VyY2UucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChtYW5pZmVzdCwgdXJsKSB7XG4gIHZhciBrZXkgPSBKU09OLnN0cmluZ2lmeShbbWFuaWZlc3QsIHVybF0pO1xuICBcbiAgcmV0dXJuIG5ldyBQcm9taXNlQ29tcGF0KGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICBpZiAodGhpcy5maWxlc1trZXldKSB7XG4gICAgICByZXNvbHZlKHRoaXMuZmlsZXNba2V5XSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucmVzb2x2ZShtYW5pZmVzdCwgdXJsKS50aGVuKGZ1bmN0aW9uIChrZXksIHJlc29sdmUsIGFkZHJlc3MpIHtcbiAgICAgICAgdGhpcy5maWxlc1trZXldID0gYWRkcmVzcztcbiAgICAgICAgLy9mZG9tLmRlYnVnLmxvZygnUmVzb2x2ZWQgJyArIGtleSArICcgdG8gJyArIGFkZHJlc3MpO1xuICAgICAgICByZXNvbHZlKGFkZHJlc3MpO1xuICAgICAgfS5iaW5kKHRoaXMsIGtleSwgcmVzb2x2ZSksIHJlamVjdCk7XG4gICAgfVxuICB9LmJpbmQodGhpcykpO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGNvbnRlbnRzIG9mIGEgcmVzb3VyY2UuXG4gKiBAbWV0aG9kIGdldENvbnRlbnRzXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsIFRoZSByZXNvdXJjZSB0byByZWFkLlxuICogQHJldHVybnMge1Byb21pc2V9IEEgcHJvbWlzZSBmb3IgdGhlIHJlc291cmNlIGNvbnRlbnRzLlxuICovXG5SZXNvdXJjZS5wcm90b3R5cGUuZ2V0Q29udGVudHMgPSBmdW5jdGlvbiAodXJsKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZUNvbXBhdChmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdmFyIHByb3A7XG4gICAgaWYgKCF1cmwpIHtcbiAgICAgIHRoaXMuZGVidWcud2FybihcIkFza2VkIHRvIGdldCBjb250ZW50cyBvZiB1bmRlZmluZWQgVVJMLlwiKTtcbiAgICAgIHJldHVybiByZWplY3QoKTtcbiAgICB9XG4gICAgZm9yIChwcm9wIGluIHRoaXMuY29udGVudFJldHJpZXZlcnMpIHtcbiAgICAgIGlmICh0aGlzLmNvbnRlbnRSZXRyaWV2ZXJzLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgIGlmICh1cmwuaW5kZXhPZihwcm9wICsgXCI6Ly9cIikgPT09IDApIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5jb250ZW50UmV0cmlldmVyc1twcm9wXS5jYWxsKHRoaXMsIHVybCwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgfSBlbHNlIGlmICh1cmwuaW5kZXhPZihcIjovL1wiKSA9PT0gLTEgJiYgcHJvcCA9PT0gXCJudWxsXCIpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5jb250ZW50UmV0cmlldmVyc1twcm9wXS5jYWxsKHRoaXMsIHVybCwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZWplY3QoKTtcbiAgfS5iaW5kKHRoaXMpKTtcbn07XG5cbi8qKlxuICogUmV0dXJuIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIGZpcnN0IG9mIGFuIGFycmF5IG9mIHByb21pc2VzXG4gKiByZXNvbHZlcywgb3IgcmVqZWN0cyBhZnRlciBhbGwgcHJvbWlzZXMgcmVqZWN0LiBDYW4gYmUgdGhvdWdodCBvZiBhc1xuICogdGhlIG1pc3NpbmcgJ1Byb21pc2UuYW55JyAtIHJhY2UgaXMgbm8gZ29vZCwgc2luY2UgZWFybHkgcmVqZWN0aW9uc1xuICogcHJlZW1wdCBhIHN1YnNlcXVlbnQgcmVzb2x1dGlvbi5cbiAqIEBwcml2YXRlXG4gKiBAc3RhdGljXG4gKiBAbWV0aG9kIEZpcnN0UHJvbWlzZVxuICogQHBhcmFtIHtQcm9taXNlW119IFByb21pc2VzIHRvIHNlbGVjdCBmcm9tXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSByZXNvbHZpbmcgd2l0aCBhIHZhbHVlIGZyb20gYXJndW1lbnRzLlxuICovXG52YXIgZmlyc3RQcm9taXNlID0gZnVuY3Rpb24ocHJvbWlzZXMpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlQ29tcGF0KGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHZhciBlcnJvcnMgPSBbXTtcbiAgICBwcm9taXNlcy5mb3JFYWNoKGZ1bmN0aW9uKHByb21pc2UpIHtcbiAgICAgIHByb21pc2UudGhlbihyZXNvbHZlLCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goZXJyKTtcbiAgICAgICAgaWYgKGVycm9ycy5sZW5ndGggPT09IHByb21pc2VzLmxlbmd0aCkge1xuICAgICAgICAgIHJlamVjdChlcnJvcnMpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIFJlc29sdmUgYSByZXNvdXJjZSB1c2luZyBrbm93biByZXNvbHZlcnMuIFVubGlrZSBnZXQsIHJlc29sdmUgZG9lc1xuICogbm90IGNhY2hlIHJlc29sdmVkIHJlc291cmNlcy5cbiAqIEBtZXRob2QgcmVzb2x2ZVxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBtYW5pZmVzdCBUaGUgbW9kdWxlIHJlcXVlc3RpbmcgdGhlIHJlc291cmNlLlxuICogQHBhcmFtIHtTdHJpbmd9IHVybCBUaGUgcmVzb3VyY2UgdG8gcmVzb2x2ZTtcbiAqIEByZXR1cm5zIHtQcm9taXNlfSBBIHByb21pc2UgZm9yIHRoZSByZXNvdXJjZSBhZGRyZXNzLlxuICovXG5SZXNvdXJjZS5wcm90b3R5cGUucmVzb2x2ZSA9IGZ1bmN0aW9uIChtYW5pZmVzdCwgdXJsKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZUNvbXBhdChmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdmFyIHByb21pc2VzID0gW107XG4gICAgaWYgKHVybCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gcmVqZWN0KCk7XG4gICAgfVxuICAgIHV0aWwuZWFjaFJldmVyc2UodGhpcy5yZXNvbHZlcnMsIGZ1bmN0aW9uIChyZXNvbHZlcikge1xuICAgICAgcHJvbWlzZXMucHVzaChuZXcgUHJvbWlzZUNvbXBhdChyZXNvbHZlci5iaW5kKHt9LCBtYW5pZmVzdCwgdXJsKSkpO1xuICAgIH0uYmluZCh0aGlzKSk7XG4gICAgZmlyc3RQcm9taXNlKHByb21pc2VzKS50aGVuKHJlc29sdmUsIGZ1bmN0aW9uKCkge1xuICAgICAgcmVqZWN0KCdObyByZXNvbHZlcnMgdG8gaGFuZGxlIHVybDogJyArIEpTT04uc3RyaW5naWZ5KFttYW5pZmVzdCwgdXJsXSkpO1xuICAgIH0pO1xuICB9LmJpbmQodGhpcykpO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlciByZXNvbHZlcnM6IGNvZGUgdGhhdCBrbm93cyBob3cgdG8gZ2V0IHJlc291cmNlc1xuICogbmVlZGVkIGJ5IHRoZSBydW50aW1lLiBBIHJlc29sdmVyIHdpbGwgYmUgY2FsbGVkIHdpdGggZm91clxuICogYXJndW1lbnRzOiB0aGUgYWJzb2x1dGUgbWFuaWZlc3Qgb2YgdGhlIHJlcXVlc3RlciwgdGhlXG4gKiByZXNvdXJjZSBiZWluZyByZXF1ZXN0ZWQsIGFuZCBhIHJlc29sdmUgLyByZWplY3QgcGFpciB0b1xuICogZnVsZmlsbCBhIHByb21pc2UuXG4gKiBAbWV0aG9kIGFkZFJlc29sdmVyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSByZXNvbHZlciBUaGUgcmVzb2x2ZXIgdG8gYWRkLlxuICovXG5SZXNvdXJjZS5wcm90b3R5cGUuYWRkUmVzb2x2ZXIgPSBmdW5jdGlvbiAocmVzb2x2ZXIpIHtcbiAgdGhpcy5yZXNvbHZlcnMucHVzaChyZXNvbHZlcik7XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVyIHJldHJpZXZlcnM6IGNvZGUgdGhhdCBrbm93cyBob3cgdG8gbG9hZCByZXNvdXJjZXNcbiAqIG5lZWRlZCBieSB0aGUgcnVudGltZS4gQSByZXRyaWV2ZXIgd2lsbCBiZSBjYWxsZWQgd2l0aCBhIFVSTFxuICogdG8gcmV0cmlldmUgd2l0aCBhIHByb3RvY29sIHRoYXQgaXQgaXMgYWJsZSB0byBoYW5kbGUuXG4gKiBAbWV0aG9kIGFkZFJldHJpZXZlclxuICogQHBhcmFtIHtTdHJpbmd9IHByb3RvIFRoZSBwcm90b2NvbCB0byByZWdpc3RlciBmb3IuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSByZXRyaWV2ZXIgVGhlIHJldHJpZXZlciB0byBhZGQuXG4gKi9cblJlc291cmNlLnByb3RvdHlwZS5hZGRSZXRyaWV2ZXIgPSBmdW5jdGlvbiAocHJvdG8sIHJldHJpZXZlcikge1xuICBpZiAodGhpcy5jb250ZW50UmV0cmlldmVyc1twcm90b10pIHtcbiAgICB0aGlzLmRlYnVnLndhcm4oXCJVbndpbGxpbmcgdG8gb3ZlcnJpZGUgZmlsZSByZXRyaWV2YWwgZm9yIFwiICsgcHJvdG8pO1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLmNvbnRlbnRSZXRyaWV2ZXJzW3Byb3RvXSA9IHJldHJpZXZlcjtcbn07XG5cbi8qKlxuICogUmVnaXN0ZXIgZXh0ZXJuYWwgcmVzb2x2ZXJzIGFuZCByZXRyZWF2ZXJzXG4gKiBAbWV0aG9kIHJlZ2lzdGVyXG4gKiBAcGFyYW0ge3tcInByb3RvXCI6U3RyaW5nLCBcInJlc29sdmVyXCI6RnVuY3Rpb24sIFwicmV0cmVhdmVyXCI6RnVuY3Rpb259W119XG4gKiAgICAgcmVzb2x2ZXJzIFRoZSBsaXN0IG9mIHJldHJlaXZlcnMgYW5kIHJlc29sdmVycy5cbiAqL1xuUmVzb3VyY2UucHJvdG90eXBlLnJlZ2lzdGVyID0gZnVuY3Rpb24gKHJlc29sdmVycykge1xuICBpZiAoIXJlc29sdmVycy5sZW5ndGgpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICByZXNvbHZlcnMuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgIGlmIChpdGVtLnJlc29sdmVyKSB7XG4gICAgICB0aGlzLmFkZFJlc29sdmVyKGl0ZW0ucmVzb2x2ZXIpO1xuICAgIH0gZWxzZSBpZiAoaXRlbS5wcm90byAmJiBpdGVtLnJldHJpZXZlcikge1xuICAgICAgdGhpcy5hZGRSZXRyaWV2ZXIoaXRlbS5wcm90bywgaXRlbS5yZXRyaWV2ZXIpO1xuICAgIH1cbiAgfS5iaW5kKHRoaXMpKTtcbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lIGlmIGEgVVJMIGlzIGFuIGFic29sdXRlIFVSTCBvZiBhIGdpdmVuIFNjaGVtZS5cbiAqIEBtZXRob2QgaGFzU2NoZW1lXG4gKiBAc3RhdGljXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtTdHJpbmdbXX0gcHJvdG9jb2xzIFdoaXRlbGlzdGVkIHByb3RvY29sc1xuICogQHBhcmFtIHtTdHJpbmd9IFVSTCB0aGUgVVJMIHRvIG1hdGNoLlxuICogQHJldHVybnMge0Jvb2xlYW59IElmIHRoZSBVUkwgaXMgYW4gYWJzb2x1dGUgZXhhbXBsZSBvZiBvbmUgb2YgdGhlIHNjaGVtZXMuXG4gKi9cblJlc291cmNlLmhhc1NjaGVtZSA9IGZ1bmN0aW9uIChwcm90b2NvbHMsIHVybCkge1xuICB2YXIgaTtcbiAgZm9yIChpID0gMDsgaSA8IHByb3RvY29scy5sZW5ndGg7IGkgKz0gMSkge1xuICAgIGlmICh1cmwuaW5kZXhPZihwcm90b2NvbHNbaV0gKyBcIjovL1wiKSA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbi8qKlxuICogUmVtb3ZlICcuLycgYW5kICcuLi8nIGZyb20gYSBVUkxcbiAqIFJlcXVpcmVkIGJlY2F1c2UgQ2hyb21lIEFwcHMgZm9yIE1vYmlsZSAoY2NhKSBkb2Vzbid0IHVuZGVyc3RhbmRcbiAqIFhIUiBwYXRocyB3aXRoIHRoZXNlIHJlbGF0aXZlIGNvbXBvbmVudHMgaW4gdGhlIFVSTC5cbiAqIEBtZXRob2QgcmVtb3ZlUmVsYXRpdmVQYXRoXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsIFRoZSBVUkwgdG8gbW9kaWZ5XG4gKiBAcmV0dXJucyB7U3RyaW5nfSB1cmwgd2l0aG91dCAnLi8nIGFuZCAnLi4vJ1xuICoqL1xuUmVzb3VyY2UucmVtb3ZlUmVsYXRpdmVQYXRoID0gZnVuY3Rpb24gKHVybCkge1xuICB2YXIgaWR4ID0gdXJsLmluZGV4T2YoXCI6Ly9cIikgKyAzLFxuICAgIHN0YWNrLFxuICAgIHRvUmVtb3ZlLFxuICAgIHJlc3VsdDtcbiAgLy8gUmVtb3ZlIGFsbCBpbnN0YW5jZXMgb2YgLy4vXG4gIHVybCA9IHVybC5yZXBsYWNlKC9cXC9cXC5cXC8vZywgXCIvXCIpO1xuICAvL1dlaXJkIGJ1ZyB3aGVyZSBpbiBjY2EsIG1hbmlmZXN0IHN0YXJ0cyB3aXRoICdjaHJvbWU6Ly8vLydcbiAgLy9UaGlzIGZvcmNlcyB0aGVyZSB0byBvbmx5IGJlIDIgc2xhc2hlc1xuICB3aGlsZSAodXJsLmNoYXJBdChpZHgpID09PSBcIi9cIikge1xuICAgIHVybCA9IHVybC5zbGljZSgwLCBpZHgpICsgdXJsLnNsaWNlKGlkeCArIDEsIHVybC5sZW5ndGgpO1xuICB9XG5cbiAgLy8gQWR2YW5jZSB0byBuZXh0IC9cbiAgaWR4ID0gdXJsLmluZGV4T2YoXCIvXCIsIGlkeCk7XG4gIC8vIFJlbW92aW5nIC4uL1xuICBzdGFjayA9IHVybC5zdWJzdHIoaWR4ICsgMSkuc3BsaXQoXCIvXCIpO1xuICB3aGlsZSAoc3RhY2suaW5kZXhPZihcIi4uXCIpICE9PSAtMSkge1xuICAgIHRvUmVtb3ZlID0gc3RhY2suaW5kZXhPZihcIi4uXCIpO1xuICAgIGlmICh0b1JlbW92ZSA9PT0gMCkge1xuICAgICAgc3RhY2suc2hpZnQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RhY2suc3BsaWNlKCh0b1JlbW92ZSAtIDEpLCAyKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vUmVidWlsZCBzdHJpbmdcbiAgcmVzdWx0ID0gdXJsLnN1YnN0cigwLCBpZHgpO1xuICBmb3IgKGlkeCA9IDA7IGlkeCA8IHN0YWNrLmxlbmd0aDsgaWR4ICs9IDEpIHtcbiAgICByZXN1bHQgKz0gXCIvXCIgKyBzdGFja1tpZHhdO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIFJlc29sdmUgVVJMcyB3aGljaCBjYW4gYmUgYWNjZXNzZWQgdXNpbmcgc3RhbmRhcmQgSFRUUCByZXF1ZXN0cy5cbiAqIEBtZXRob2QgaHR0cFJlc29sdmVyXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtTdHJpbmd9IG1hbmlmZXN0IFRoZSBNYW5pZmVzdCBVUkwuXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsIFRoZSBVUkwgdG8gcmVzb2x2ZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHJlc29sdmUgVGhlIHByb21pc2UgdG8gY29tcGxldGUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSByZWplY3QgVGhlIHByb21pc2UgdG8gcmVqZWN0LlxuICogQHJldHVybnMge0Jvb2xlYW59IFRydWUgaWYgdGhlIFVSTCBjb3VsZCBiZSByZXNvbHZlZC5cbiAqL1xuUmVzb3VyY2UucHJvdG90eXBlLmh0dHBSZXNvbHZlciA9IGZ1bmN0aW9uIChtYW5pZmVzdCwgdXJsLCByZXNvbHZlLCByZWplY3QpIHtcbiAgdmFyIHByb3RvY29scyA9IFtcImh0dHBcIiwgXCJodHRwc1wiLCBcImNocm9tZVwiLCBcImNocm9tZS1leHRlbnNpb25cIiwgXCJyZXNvdXJjZVwiLFxuICAgICAgICAgICAgICAgICAgIFwiYXBwXCJdLFxuICAgIGRpcm5hbWUsXG4gICAgcHJvdG9jb2xJZHgsXG4gICAgcGF0aElkeCxcbiAgICBwYXRoLFxuICAgIGJhc2UsXG4gICAgcmVzdWx0O1xuXG4gIGlmIChSZXNvdXJjZS5oYXNTY2hlbWUocHJvdG9jb2xzLCB1cmwpKSB7XG4gICAgcmVzb2x2ZShSZXNvdXJjZS5yZW1vdmVSZWxhdGl2ZVBhdGgodXJsKSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgXG4gIGlmICghbWFuaWZlc3QpIHtcbiAgICByZWplY3QoKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKFJlc291cmNlLmhhc1NjaGVtZShwcm90b2NvbHMsIG1hbmlmZXN0KSAmJlxuICAgICAgdXJsLmluZGV4T2YoXCI6Ly9cIikgPT09IC0xKSB7XG4gICAgZGlybmFtZSA9IG1hbmlmZXN0LnN1YnN0cigwLCBtYW5pZmVzdC5sYXN0SW5kZXhPZihcIi9cIikpO1xuICAgIHByb3RvY29sSWR4ID0gZGlybmFtZS5pbmRleE9mKFwiOi8vXCIpO1xuICAgIHBhdGhJZHggPSBwcm90b2NvbElkeCArIDMgKyBkaXJuYW1lLnN1YnN0cihwcm90b2NvbElkeCArIDMpLmluZGV4T2YoXCIvXCIpO1xuICAgIHBhdGggPSBkaXJuYW1lLnN1YnN0cihwYXRoSWR4KTtcbiAgICBiYXNlID0gZGlybmFtZS5zdWJzdHIoMCwgcGF0aElkeCk7XG4gICAgaWYgKHVybC5pbmRleE9mKFwiL1wiKSA9PT0gMCkge1xuICAgICAgcmVzb2x2ZShSZXNvdXJjZS5yZW1vdmVSZWxhdGl2ZVBhdGgoYmFzZSArIHVybCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXNvbHZlKFJlc291cmNlLnJlbW92ZVJlbGF0aXZlUGF0aChiYXNlICsgcGF0aCArIFwiL1wiICsgdXJsKSk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJlamVjdCgpO1xufTtcblxuLyoqXG4gKiBSZXNvbHZlIFVSTHMgd2hpY2ggYXJlIHNlbGYtZGVzY3JpYmluZy5cbiAqIEBtZXRob2QgbnVsbFJlc29sdmVyXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtTdHJpbmd9IG1hbmlmZXN0IFRoZSBNYW5pZmVzdCBVUkwuXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsIFRoZSBVUkwgdG8gcmVzb2x2ZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHJlc29sdmUgVGhlIHByb21pc2UgdG8gY29tcGxldGUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSByZWplY3QgVGhlIHByb21pc2UgdG8gcmVqZWN0LlxuICogQHJldHVybnMge0Jvb2xlYW59IFRydWUgaWYgdGhlIFVSTCBjb3VsZCBiZSByZXNvbHZlZC5cbiAqL1xuUmVzb3VyY2UucHJvdG90eXBlLm51bGxSZXNvbHZlciA9IGZ1bmN0aW9uIChtYW5pZmVzdCwgdXJsLCByZXNvbHZlLCByZWplY3QpIHtcbiAgdmFyIHByb3RvY29scyA9IFtcIm1hbmlmZXN0XCJdO1xuICBpZiAoUmVzb3VyY2UuaGFzU2NoZW1lKHByb3RvY29scywgdXJsKSkge1xuICAgIHJlc29sdmUodXJsKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmICh1cmwuaW5kZXhPZignZGF0YTonKSA9PT0gMCkge1xuICAgIHJlc29sdmUodXJsKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZWplY3QoKTtcbn07XG5cbi8qKlxuICogUmV0cmlldmUgbWFuaWZlc3QgY29udGVudCBmcm9tIGEgc2VsZi1kZXNjcmlwdGl2ZSBtYW5pZmVzdCB1cmwuXG4gKiBUaGVzZSB1cmxzIGFyZSB1c2VkIHRvIHJlZmVyZW5jZSBhIG1hbmlmZXN0IHdpdGhvdXQgcmVxdWlyaW5nIHN1YnNlcXVlbnQsXG4gKiBwb3RlbnRpYWxseSBub24tQ09SUyByZXF1ZXN0cy5cbiAqIEBtZXRob2QgbWFuaWZlc3RSZXRyaWV2ZXJcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge1N0cmluZ30gbWFuaWZlc3QgVGhlIE1hbmlmZXN0IFVSTFxuICogQHBhcmFtIHtGdW5jdGlvbn0gcmVzb2x2ZSBUaGUgcHJvbWlzZSB0byBjb21wbGV0ZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHJlamVjdCBUaGUgcHJvbWlzZSB0byByZWplY3QuXG4gKi9cblJlc291cmNlLnByb3RvdHlwZS5tYW5pZmVzdFJldHJpZXZlciA9IGZ1bmN0aW9uIChtYW5pZmVzdCwgcmVzb2x2ZSwgcmVqZWN0KSB7XG4gIHZhciBkYXRhO1xuICB0cnkge1xuICAgIGRhdGEgPSBtYW5pZmVzdC5zdWJzdHIoMTEpO1xuICAgIEpTT04ucGFyc2UoZGF0YSk7XG4gICAgcmVzb2x2ZShkYXRhKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRoaXMuZGVidWcud2FybihcIkludmFsaWQgbWFuaWZlc3QgVVJMIHJlZmVyZW5jZWQ6XCIgKyBtYW5pZmVzdCk7XG4gICAgcmVqZWN0KCk7XG4gIH1cbn07XG5cbi8qKlxuICogUmV0cmlldmUgcmVzb3VyY2UgY29udGVudHMgdXNpbmcgYW4gWEhSIHJlcXVlc3QuXG4gKiBAbWV0aG9kIHhoclJldHJpZXZlclxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmwgVGhlIHJlc291cmNlIHRvIGZldGNoLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gcmVzb2x2ZSBUaGUgcHJvbWlzZSB0byBjb21wbGV0ZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHJlamVjdCBUaGUgcHJvbWlzZSB0byByZWplY3QuXG4gKi9cblJlc291cmNlLnByb3RvdHlwZS54aHJSZXRyaWV2ZXIgPSBmdW5jdGlvbiAodXJsLCByZXNvbHZlLCByZWplY3QpIHtcbiAgdmFyIHJlZiA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICByZWYuYWRkRXZlbnRMaXN0ZW5lcihcInJlYWR5c3RhdGVjaGFuZ2VcIiwgZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgIGlmIChyZWYucmVhZHlTdGF0ZSA9PT0gNCAmJiByZWYucmVzcG9uc2VUZXh0KSB7XG4gICAgICByZXNvbHZlKHJlZi5yZXNwb25zZVRleHQpO1xuICAgIH0gZWxzZSBpZiAocmVmLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgIHRoaXMuZGVidWcud2FybihcIkZhaWxlZCB0byBsb2FkIGZpbGUgXCIgKyB1cmwgKyBcIjogXCIgKyByZWYuc3RhdHVzKTtcbiAgICAgIHJlamVjdChyZWYuc3RhdHVzKTtcbiAgICB9XG4gIH0uYmluZCh0aGlzLCByZXNvbHZlLCByZWplY3QpLCBmYWxzZSk7XG4gIHJlZi5vdmVycmlkZU1pbWVUeXBlKFwiYXBwbGljYXRpb24vanNvblwiKTtcbiAgcmVmLm9wZW4oXCJHRVRcIiwgdXJsLCB0cnVlKTtcbiAgcmVmLnNlbmQoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmVzb3VyY2U7XG4iLCIvKmdsb2JhbHMgY3J5cHRvLCBXZWJLaXRCbG9iQnVpbGRlciwgQmxvYiwgVVJMICovXG4vKmdsb2JhbHMgd2Via2l0VVJMLCBVaW50OEFycmF5LCBVaW50MTZBcnJheSwgQXJyYXlCdWZmZXIgKi9cbi8qanNsaW50IGluZGVudDoyLHdoaXRlOnRydWUsYnJvd3Nlcjp0cnVlLG5vZGU6dHJ1ZSxzbG9wcHk6dHJ1ZSAqL1xuXG4vKipcbiAqIFV0aWxpdHkgbWV0aG9kIHVzZWQgd2l0aGluIHRoZSBmcmVlZG9tIExpYnJhcnkuXG4gKiBAY2xhc3MgdXRpbFxuICogQHN0YXRpY1xuICovXG52YXIgdXRpbCA9IHt9O1xuXG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIGZvciBpdGVyYXRpbmcgb3ZlciBhbiBhcnJheSBiYWNrd2FyZHMuIElmIHRoZSBmdW5jXG4gKiByZXR1cm5zIGEgdHJ1ZSB2YWx1ZSwgaXQgd2lsbCBicmVhayBvdXQgb2YgdGhlIGxvb3AuXG4gKiBAbWV0aG9kIGVhY2hSZXZlcnNlXG4gKiBAc3RhdGljXG4gKi9cbnV0aWwuZWFjaFJldmVyc2UgPSBmdW5jdGlvbihhcnksIGZ1bmMpIHtcbiAgaWYgKGFyeSkge1xuICAgIHZhciBpO1xuICAgIGZvciAoaSA9IGFyeS5sZW5ndGggLSAxOyBpID4gLTE7IGkgLT0gMSkge1xuICAgICAgaWYgKGFyeVtpXSAmJiBmdW5jKGFyeVtpXSwgaSwgYXJ5KSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQG1ldGhvZCBoYXNQcm9wXG4gKiBAc3RhdGljXG4gKi9cbnV0aWwuaGFzUHJvcCA9IGZ1bmN0aW9uKG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59O1xuXG4vKipcbiAqIEN5Y2xlcyBvdmVyIHByb3BlcnRpZXMgaW4gYW4gb2JqZWN0IGFuZCBjYWxscyBhIGZ1bmN0aW9uIGZvciBlYWNoXG4gKiBwcm9wZXJ0eSB2YWx1ZS4gSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgYSB0cnV0aHkgdmFsdWUsIHRoZW4gdGhlXG4gKiBpdGVyYXRpb24gaXMgc3RvcHBlZC5cbiAqIEBtZXRob2QgZWFjaFByb3BcbiAqIEBzdGF0aWNcbiAqL1xudXRpbC5lYWNoUHJvcCA9IGZ1bmN0aW9uKG9iaiwgZnVuYykge1xuICB2YXIgcHJvcDtcbiAgZm9yIChwcm9wIGluIG9iaikge1xuICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocHJvcCkpIHtcbiAgICAgIGlmIChmdW5jKG9ialtwcm9wXSwgcHJvcCkpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIFNpbXBsZSBmdW5jdGlvbiB0byBtaXggaW4gcHJvcGVydGllcyBmcm9tIHNvdXJjZSBpbnRvIHRhcmdldCxcbiAqIGJ1dCBvbmx5IGlmIHRhcmdldCBkb2VzIG5vdCBhbHJlYWR5IGhhdmUgYSBwcm9wZXJ0eSBvZiB0aGUgc2FtZSBuYW1lLlxuICogVGhpcyBpcyBub3Qgcm9idXN0IGluIElFIGZvciB0cmFuc2ZlcnJpbmcgbWV0aG9kcyB0aGF0IG1hdGNoXG4gKiBPYmplY3QucHJvdG90eXBlIG5hbWVzLCBidXQgdGhlIHVzZXMgb2YgbWl4aW4gaGVyZSBzZWVtIHVubGlrZWx5IHRvXG4gKiB0cmlnZ2VyIGEgcHJvYmxlbSByZWxhdGVkIHRvIHRoYXQuXG4gKiBAbWV0aG9kIG1peGluXG4gKiBAc3RhdGljXG4gKi9cbnV0aWwubWl4aW4gPSBmdW5jdGlvbih0YXJnZXQsIHNvdXJjZSwgZm9yY2UpIHtcbiAgaWYgKHNvdXJjZSkge1xuICAgIHV0aWwuZWFjaFByb3Aoc291cmNlLCBmdW5jdGlvbiAodmFsdWUsIHByb3ApIHtcbiAgICAgIGlmIChmb3JjZSB8fCAhdXRpbC5oYXNQcm9wKHRhcmdldCwgcHJvcCkpIHtcbiAgICAgICAgdGFyZ2V0W3Byb3BdID0gdmFsdWU7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIHRhcmdldDtcbn07XG5cbi8qKlxuICogR2V0IGEgdW5pcXVlIElELlxuICogQG1ldGhvZCBnZXRJZFxuICogQHN0YXRpY1xuICovXG51dGlsLmdldElkID0gZnVuY3Rpb24oKSB7XG4gIHZhciBndWlkID0gJ2d1aWQnLFxuICAgICAgZG9tYWluID0gMTIsXG4gICAgICBidWZmZXI7XG4gIC8vIENocm9tZSAvIEZpcmVmb3guXG4gIGlmICh0eXBlb2YgY3J5cHRvID09PSAnb2JqZWN0JyAmJiBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKSB7XG4gICAgYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoZG9tYWluKTtcbiAgICBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKGJ1ZmZlcik7XG4gICAgdXRpbC5lYWNoUmV2ZXJzZShidWZmZXIsIGZ1bmN0aW9uKG4pIHtcbiAgICAgIGd1aWQgKz0gJy0nICsgbjtcbiAgICB9KTtcbiAgLy8gTm9kZVxuICB9IGVsc2UgaWYgKHR5cGVvZiBjcnlwdG8gPT09ICdvYmplY3QnICYmIGNyeXB0by5yYW5kb21CeXRlcykge1xuICAgIGJ1ZmZlciA9IGNyeXB0by5yYW5kb21CeXRlcyhkb21haW4pO1xuICAgIHV0aWwuZWFjaFJldmVyc2UoYnVmZmVyLCBmdW5jdGlvbihuKSB7XG4gICAgICBndWlkICs9ICctJyArIG47XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgd2hpbGUgKGRvbWFpbiA+IDApIHtcbiAgICAgIGd1aWQgKz0gJy0nICsgTWF0aC5jZWlsKDI1NSAqIE1hdGgucmFuZG9tKCkpO1xuICAgICAgZG9tYWluIC09IDE7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGd1aWQ7XG59O1xuXG4vKipcbiAqIEVuY29kZSBhIHN0cmluZyBpbnRvIGEgYmluYXJ5IGFycmF5IGJ1ZmZlciwgYnkgdHJlYXRpbmcgZWFjaCBjaGFyYWN0ZXIgYXMgYVxuICogdXRmMTYgZW5jb2RlZCBjaGFyYWN0ZXIgLSB0aGUgbmF0aXZlIGphdmFzY3JpcHQgZW5jb2RpbmcuXG4gKiBAbWV0aG9kIHN0cjJhYlxuICogQHN0YXRpY1xuICogQHBhcmFtIHtTdHJpbmd9IHN0ciBUaGUgc3RyaW5nIHRvIGVuY29kZS5cbiAqIEByZXR1cm5zIHtBcnJheUJ1ZmZlcn0gVGhlIGVuY29kZWQgc3RyaW5nLlxuICovXG51dGlsLnN0cjJhYiA9IGZ1bmN0aW9uKHN0cikge1xuICB2YXIgbGVuZ3RoID0gc3RyLmxlbmd0aCxcbiAgICAgIGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihsZW5ndGggKiAyKSwgLy8gMiBieXRlcyBmb3IgZWFjaCBjaGFyXG4gICAgICBidWZmZXJWaWV3ID0gbmV3IFVpbnQxNkFycmF5KGJ1ZmZlciksXG4gICAgICBpO1xuICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICBidWZmZXJWaWV3W2ldID0gc3RyLmNoYXJDb2RlQXQoaSk7XG4gIH1cblxuICByZXR1cm4gYnVmZmVyO1xufTtcblxuLyoqXG4gKiBDb252ZXJ0IGFuIGFycmF5IGJ1ZmZlciBjb250YWluaW5nIGFuIGVuY29kZWQgc3RyaW5nIGJhY2sgaW50byBhIHN0cmluZy5cbiAqIEBtZXRob2QgYWIyc3RyXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge0FycmF5QnVmZmVyfSBidWZmZXIgVGhlIGJ1ZmZlciB0byB1bndyYXAuXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgZGVjb2RlZCBidWZmZXIuXG4gKi9cbnV0aWwuYWIyc3RyID0gZnVuY3Rpb24oYnVmZmVyKSB7XG4gIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsIG5ldyBVaW50MTZBcnJheShidWZmZXIpKTtcbn07XG5cbi8qKlxuICogQWRkICdvbicgYW5kICdlbWl0JyBtZXRob2RzIHRvIGFuIG9iamVjdCwgd2hpY2ggYWN0IGFzIGEgbGlnaHQgd2VpZ2h0XG4gKiBldmVudCBoYW5kbGluZyBzdHJ1Y3R1cmUuXG4gKiBAY2xhc3MgaGFuZGxlRXZlbnRzXG4gKiBAc3RhdGljXG4gKi9cbnV0aWwuaGFuZGxlRXZlbnRzID0gZnVuY3Rpb24ob2JqKSB7XG4gIHZhciBldmVudFN0YXRlID0ge1xuICAgIG11bHRpcGxlOiB7fSxcbiAgICBtYXliZW11bHRpcGxlOiBbXSxcbiAgICBzaW5nbGU6IHt9LFxuICAgIG1heWJlc2luZ2xlOiBbXVxuICB9LCBmaWx0ZXIsIHB1c2g7XG5cbiAgLyoqXG4gICAqIEZpbHRlciBhIGxpc3QgYmFzZWQgb24gYSBwcmVkaWNhdGUuIFRoZSBsaXN0IGlzIGZpbHRlcmVkIGluIHBsYWNlLCB3aXRoXG4gICAqIHNlbGVjdGVkIGl0ZW1zIHJlbW92ZWQgYW5kIHJldHVybmVkIGJ5IHRoZSBmdW5jdGlvbi5cbiAgICogQG1ldGhvZFxuICAgKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBsaXN0IHRvIGZpbHRlclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkaWNhdGUgVGhlIG1ldGhvZCB0byBydW4gb24gZWFjaCBpdGVtLlxuICAgKiBAcmV0dXJucyB7QXJyYXl9IFNlbGVjdGVkIGl0ZW1zXG4gICAqL1xuICBmaWx0ZXIgPSBmdW5jdGlvbihsaXN0LCBwcmVkaWNhdGUpIHtcbiAgICB2YXIgcmV0ID0gW10sIGk7XG5cbiAgICBpZiAoIWxpc3QgfHwgIWxpc3QubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgZm9yIChpID0gbGlzdC5sZW5ndGggLSAxOyBpID49IDA7IGkgLT0gMSkge1xuICAgICAgaWYgKHByZWRpY2F0ZShsaXN0W2ldKSkge1xuICAgICAgICByZXQucHVzaChsaXN0LnNwbGljZShpLCAxKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH07XG5cbiAgLyoqXG4gICAqIEVucXVldWUgYSBoYW5kbGVyIGZvciBhIHNwZWNpZmljIHR5cGUuXG4gICAqIEBtZXRob2RcbiAgICogQHBhcmFtIHtTdHJpbmd9IHRvIFRoZSBxdWV1ZSAoJ3NpbmdsZScgb3IgJ211bHRpcGxlJykgdG8gcXVldWUgb24uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIFRoZSB0eXBlIG9mIGV2ZW50IHRvIHdhaXQgZm9yLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyIFRoZSBoYW5kbGVyIHRvIGVucXVldWUuXG4gICAqL1xuICBwdXNoID0gZnVuY3Rpb24odG8sIHR5cGUsIGhhbmRsZXIpIHtcbiAgICBpZiAodHlwZW9mIHR5cGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRoaXNbJ21heWJlJyArIHRvXS5wdXNoKFt0eXBlLCBoYW5kbGVyXSk7XG4gICAgfSBlbHNlIGlmICh0aGlzW3RvXVt0eXBlXSkge1xuICAgICAgdGhpc1t0b11bdHlwZV0ucHVzaChoYW5kbGVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpc1t0b11bdHlwZV0gPSBbaGFuZGxlcl07XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhIG1ldGhvZCB0byBiZSBleGVjdXRlZCB3aGVuIGFuIGV2ZW50IG9mIGEgc3BlY2lmaWMgdHlwZSBvY2N1cnMuXG4gICAqIEBtZXRob2Qgb25cbiAgICogQHBhcmFtIHtTdHJpbmd8RnVuY3Rpb259IHR5cGUgVGhlIHR5cGUgb2YgZXZlbnQgdG8gcmVnaXN0ZXIgYWdhaW5zdC5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciBUaGUgaGFuZGxlciB0byBydW4gd2hlbiB0aGUgZXZlbnQgb2NjdXJzLlxuICAgKi9cbiAgb2JqLm9uID0gcHVzaC5iaW5kKGV2ZW50U3RhdGUsICdtdWx0aXBsZScpO1xuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhIG1ldGhvZCB0byBiZSBleGVjdXRlIHRoZSBuZXh0IHRpbWUgYW4gZXZlbnQgb2NjdXJzLlxuICAgKiBAbWV0aG9kIG9uY2VcbiAgICogQHBhcmFtIHtTdHJpbmd8RnVuY3Rpb259IHR5cGUgVGhlIHR5cGUgb2YgZXZlbnQgdG8gd2FpdCBmb3IuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIgVGhlIGhhbmRsZXIgdG8gcnVuIHRoZSBuZXh0IHRpbWUgYSBtYXRjaGluZyBldmVudFxuICAgKiAgICAgaXMgcmFpc2VkLlxuICAgKi9cbiAgb2JqLm9uY2UgPSBwdXNoLmJpbmQoZXZlbnRTdGF0ZSwgJ3NpbmdsZScpO1xuXG4gIC8qKlxuICAgKiBFbWl0IGFuIGV2ZW50IG9uIHRoaXMgb2JqZWN0LlxuICAgKiBAbWV0aG9kIGVtaXRcbiAgICogQHBhcmFtIHtTdHJpbmd9IHR5cGUgVGhlIHR5cGUgb2YgZXZlbnQgdG8gcmFpc2UuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIFRoZSBwYXlsb2FkIG9mIHRoZSBldmVudC5cbiAgICovXG4gIG9iai5lbWl0ID0gZnVuY3Rpb24odHlwZSwgZGF0YSkge1xuICAgIHZhciBpLCBxdWV1ZTtcbiAgICBpZiAodGhpcy5tdWx0aXBsZVt0eXBlXSkge1xuICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMubXVsdGlwbGVbdHlwZV0ubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKHRoaXMubXVsdGlwbGVbdHlwZV1baV0oZGF0YSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLnNpbmdsZVt0eXBlXSkge1xuICAgICAgcXVldWUgPSB0aGlzLnNpbmdsZVt0eXBlXTtcbiAgICAgIHRoaXMuc2luZ2xlW3R5cGVdID0gW107XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgcXVldWUubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgcXVldWVbaV0oZGF0YSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLm1heWJlbXVsdGlwbGUubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIGlmICh0aGlzLm1heWJlbXVsdGlwbGVbaV1bMF0odHlwZSwgZGF0YSkpIHtcbiAgICAgICAgdGhpcy5tYXliZW11bHRpcGxlW2ldWzFdKGRhdGEpO1xuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGkgPSB0aGlzLm1heWJlc2luZ2xlLmxlbmd0aCAtIDE7IGkgPj0gMDsgaSAtPSAxKSB7XG4gICAgICBpZiAodGhpcy5tYXliZXNpbmdsZVtpXVswXSh0eXBlLCBkYXRhKSkge1xuICAgICAgICBxdWV1ZSA9IHRoaXMubWF5YmVzaW5nbGUuc3BsaWNlKGksIDEpO1xuICAgICAgICBxdWV1ZVswXVsxXShkYXRhKTtcbiAgICAgIH1cbiAgICB9XG4gIH0uYmluZChldmVudFN0YXRlKTtcblxuICAvKipcbiAgICogUmVtb3ZlIGFuIGV2ZW50IGhhbmRsZXJcbiAgICogQG1ldGhvZCBvZmZcbiAgICogQHBhcmFtIHtTdHJpbmd9IHR5cGUgVGhlIHR5cGUgb2YgZXZlbnQgdG8gcmVtb3ZlLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9uP30gaGFuZGxlciBUaGUgaGFuZGxlciB0byByZW1vdmUuXG4gICAqL1xuICBvYmoub2ZmID0gZnVuY3Rpb24odHlwZSwgaGFuZGxlcikge1xuICAgIGlmICghdHlwZSkge1xuICAgICAgdGhpcy5tdWx0aXBsZSA9IHt9O1xuICAgICAgdGhpcy5tYXliZW11bHRpcGxlID0gW107XG4gICAgICB0aGlzLnNpbmdsZSA9IHt9O1xuICAgICAgdGhpcy5tYXliZXNpbmdsZSA9IFtdO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgZmlsdGVyKHRoaXMubWF5YmVzaW5nbGUsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIGl0ZW1bMF0gPT09IHR5cGUgJiYgKCFoYW5kbGVyIHx8IGl0ZW1bMV0gPT09IGhhbmRsZXIpO1xuICAgICAgfSk7XG4gICAgICBmaWx0ZXIodGhpcy5tYXliZW11bHRpcGxlLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIHJldHVybiBpdGVtWzBdID09PSB0eXBlICYmICghaGFuZGxlciB8fCBpdGVtWzFdID09PSBoYW5kbGVyKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICghaGFuZGxlcikge1xuICAgICAgZGVsZXRlIHRoaXMubXVsdGlwbGVbdHlwZV07XG4gICAgICBkZWxldGUgdGhpcy5zaW5nbGVbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGZpbHRlcih0aGlzLm11bHRpcGxlW3R5cGVdLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIHJldHVybiBpdGVtID09PSBoYW5kbGVyO1xuICAgICAgfSk7XG4gICAgICBmaWx0ZXIodGhpcy5zaW5nbGVbdHlwZV0sIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIGl0ZW0gPT09IGhhbmRsZXI7XG4gICAgICB9KTtcbiAgICB9XG4gIH0uYmluZChldmVudFN0YXRlKTtcbn07XG5cbi8qKlxuICogV2hlbiBydW4gd2l0aG91dCBhIHdpbmRvdywgb3Igc3BlY2lmaWNhbGx5IHJlcXVlc3RlZC5cbiAqIE5vdGU6IERlY2xhcmF0aW9uIGNhbiBiZSByZWRlZmluZWQgaW4gZm9yY2VNb2R1bGVDb250ZXh0IGJlbG93LlxuICogQG1ldGhvZCBpc01vZHVsZUNvbnRleHRcbiAqIEBmb3IgdXRpbFxuICogQHN0YXRpY1xuICovXG4vKiFAcHJlc2VydmUgU3RhcnRNb2R1bGVDb250ZXh0RGVjbGFyYXRpb24qL1xudXRpbC5pc01vZHVsZUNvbnRleHQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnKTtcbn07XG5cbi8qKlxuICogR2V0IGEgQmxvYiBvYmplY3Qgb2YgYSBzdHJpbmcuXG4gKiBQb2x5ZmlsbHMgaW1wbGVtZW50YXRpb25zIHdoaWNoIGRvbid0IGhhdmUgYSBjdXJyZW50IEJsb2IgY29uc3RydWN0b3IsIGxpa2VcbiAqIHBoYW50b21qcy5cbiAqIEBtZXRob2QgZ2V0QmxvYlxuICogQHN0YXRpY1xuICovXG51dGlsLmdldEJsb2IgPSBmdW5jdGlvbihkYXRhLCB0eXBlKSB7XG4gIGlmICh0eXBlb2YgQmxvYiAhPT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgV2ViS2l0QmxvYkJ1aWxkZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgdmFyIGJ1aWxkZXIgPSBuZXcgV2ViS2l0QmxvYkJ1aWxkZXIoKTtcbiAgICBidWlsZGVyLmFwcGVuZChkYXRhKTtcbiAgICByZXR1cm4gYnVpbGRlci5nZXRCbG9iKHR5cGUpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBuZXcgQmxvYihbZGF0YV0sIHt0eXBlOiB0eXBlfSk7XG4gIH1cbn07XG5cbi8qKlxuICogRmluZCBhbGwgc2NyaXB0cyBvbiB0aGUgZ2l2ZW4gcGFnZS5cbiAqIEBtZXRob2Qgc2NyaXB0c1xuICogQHN0YXRpY1xuICovXG51dGlsLnNjcmlwdHMgPSBmdW5jdGlvbihnbG9iYWwpIHtcbiAgcmV0dXJuIGdsb2JhbC5kb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0Jyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWw7XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vKmpzbGludCBub2RlOnRydWUqL1xuLy8gVGhpcyBhbHRlcm5hdGl2ZSBlbnRyeSBwb2ludCBjYW4gYmUgdXNlZCB0byBidWlsZCB0aGUgY29udGVudHMgb2YgYW4gaUZyYW1lLFxuLy8gd2hlbiB1c2luZyB0aGUgZnJhbWUgbGluayBvZiBmcmVlZG9tIChzcGVjaWZpY2FsbHkgZm9yIHVuaXQgdGVzdGluZyBzaW5jZVxuLy8gcGhhbnRvbUpTIGRvZXNuJ3Qgc3VwcG9ydCB3ZWIgd29ya2Vycy4pLlxuXG52YXIgcHJvdmlkZXJzID0gW1xuICByZXF1aXJlKCcuLi8uLi9wcm92aWRlcnMvY29yZS9jb3JlLnVucHJpdmlsZWdlZCcpXG5dO1xuXG5yZXF1aXJlKCcuLi9lbnRyeScpKHtcbiAgaXNNb2R1bGU6IHRydWUsXG4gIHBvcnRUeXBlOiByZXF1aXJlKCcuLi9saW5rL2ZyYW1lJyksXG4gIHByb3ZpZGVyczogcHJvdmlkZXJzLFxuICBnbG9iYWw6IGdsb2JhbFxufSk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSJdfQ==
