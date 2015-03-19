/******/ (function(modules) { // webpackBootstrap
/******/ 	var parentHotUpdateCallback = this["webpackHotUpdate"];
/******/ 	this["webpackHotUpdate"] = 
/******/ 			function webpackHotUpdateCallback(chunkId, moreModules) {
/******/ 				hotAddUpdateChunk(chunkId, moreModules);
/******/ 				if(parentHotUpdateCallback) parentHotUpdateCallback(chunkId, moreModules);
/******/ 			}
/******/ 	
/******/ 			function hotDownloadUpdateChunk(chunkId) {
/******/ 				var head = document.getElementsByTagName('head')[0];
/******/ 				var script = document.createElement('script');
/******/ 				script.type = 'text/javascript';
/******/ 				script.charset = 'utf-8';
/******/ 				script.src = __webpack_require__.p + "" + chunkId + "." + hotCurrentHash + ".hot-update.js";
/******/ 				head.appendChild(script);
/******/ 			}
/******/ 	
/******/ 			function hotDownloadManifest(callback) {
/******/ 				if(typeof XMLHttpRequest === "undefined")
/******/ 					return callback(new Error("No browser support"));
/******/ 				try {
/******/ 					var request = new XMLHttpRequest();
/******/ 					var requestPath = __webpack_require__.p + "" + hotCurrentHash + ".hot-update.json";
/******/ 					request.open("GET", requestPath, true);
/******/ 					request.timeout = 10000;
/******/ 					request.send(null);
/******/ 				} catch(err) {
/******/ 					return callback(err);
/******/ 				}
/******/ 				request.onreadystatechange = function() {
/******/ 					if(request.readyState !== 4) return;
/******/ 					if(request.status === 0) {
/******/ 						// timeout
/******/ 						callback(new Error("Manifest request to " + requestPath + " timed out."));
/******/ 					} else if(request.status === 404) {
/******/ 						// no update available
/******/ 						callback();
/******/ 					} else if(request.status !== 200 && request.status !== 304) {
/******/ 						// other failure
/******/ 						callback(new Error("Manifest request to " + requestPath + " failed."));
/******/ 					} else {
/******/ 						// success
/******/ 						try {
/******/ 							var update = JSON.parse(request.responseText);
/******/ 						} catch(e) {
/******/ 							callback(e);
/******/ 							return;
/******/ 						}
/******/ 						callback(null, update);
/******/ 					}
/******/ 				};
/******/ 			}
/******/ 		

/******/ 	
/******/ 	
/******/ 	var hotApplyOnUpdate = true;
/******/ 	var hotCurrentHash = "4fa5e0bdbda96f758cd0";
/******/ 	var hotCurrentModuleData = {};
/******/ 	var hotCurrentParents = [];
/******/ 	
/******/ 	function hotCreateRequire(moduleId) {
/******/ 		var me = installedModules[moduleId];
/******/ 		if(!me) return __webpack_require__;
/******/ 		var fn = function(request) {
/******/ 			if(me.hot.active) {
/******/ 				if(installedModules[request]) {
/******/ 					if(installedModules[request].parents.indexOf(moduleId) < 0)
/******/ 						installedModules[request].parents.push(moduleId);
/******/ 					if(me.children.indexOf(request) < 0)
/******/ 						me.children.push(request);
/******/ 				} else hotCurrentParents = [moduleId];
/******/ 			} else {
/******/ 				console.warn("[HMR] unexpected require(" + request + ") from disposed module " + moduleId);
/******/ 				hotCurrentParents = [];
/******/ 			}
/******/ 			return __webpack_require__(request);
/******/ 		};
/******/ 		for(var name in __webpack_require__) {
/******/ 			if(Object.prototype.hasOwnProperty.call(__webpack_require__, name)) {
/******/ 				fn[name] = __webpack_require__[name];
/******/ 			}
/******/ 		}
/******/ 		fn.e = function(chunkId, callback) {
/******/ 			if(hotStatus === "ready")
/******/ 				hotSetStatus("prepare");
/******/ 			hotChunksLoading++;
/******/ 			__webpack_require__.e(chunkId, function() {
/******/ 				try {
/******/ 					callback.call(null, fn);
/******/ 				} finally {
/******/ 					finishChunkLoading();
/******/ 				}
/******/ 				function finishChunkLoading() {
/******/ 					hotChunksLoading--;
/******/ 					if(hotStatus === "prepare") {
/******/ 						if(!hotWaitingFilesMap[chunkId]) {
/******/ 							hotEnsureUpdateChunk(chunkId);
/******/ 						}
/******/ 						if(hotChunksLoading === 0 && hotWaitingFiles === 0) {
/******/ 							hotUpdateDownloaded();
/******/ 						}
/******/ 					}
/******/ 				}
/******/ 			});
/******/ 		}
/******/ 		return fn;
/******/ 	}
/******/ 	
/******/ 	function hotCreateModule(moduleId) {
/******/ 		var hot = {
/******/ 			// private stuff
/******/ 			_acceptedDependencies: {},
/******/ 			_declinedDependencies: {},
/******/ 			_selfAccepted: false,
/******/ 			_selfDeclined: false,
/******/ 			_disposeHandlers: [],
/******/ 	
/******/ 			// Module API
/******/ 			active: true,
/******/ 			accept: function(dep, callback) {
/******/ 				if(typeof dep === "undefined")
/******/ 					hot._selfAccepted = true;
/******/ 				else if(typeof dep === "function")
/******/ 					hot._selfAccepted = dep;
/******/ 				else if(typeof dep === "number")
/******/ 					hot._acceptedDependencies[dep] = callback;
/******/ 				else for(var i = 0; i < dep.length; i++)
/******/ 					hot._acceptedDependencies[dep[i]] = callback;
/******/ 			},
/******/ 			decline: function(dep) {
/******/ 				if(typeof dep === "undefined")
/******/ 					hot._selfDeclined = true;
/******/ 				else if(typeof dep === "number")
/******/ 					hot._declinedDependencies[dep] = true;
/******/ 				else for(var i = 0; i < dep.length; i++)
/******/ 					hot._declinedDependencies[dep[i]] = true;
/******/ 			},
/******/ 			dispose: function(callback) {
/******/ 				hot._disposeHandlers.push(callback);
/******/ 			},
/******/ 			addDisposeHandler: function(callback) {
/******/ 				hot._disposeHandlers.push(callback);
/******/ 			},
/******/ 			removeDisposeHandler: function(callback) {
/******/ 				var idx = hot._disposeHandlers.indexOf(callback);
/******/ 				if(idx >= 0) hot._disposeHandlers.splice(idx, 1);
/******/ 			},
/******/ 	
/******/ 			// Management API
/******/ 			check: hotCheck,
/******/ 			apply: hotApply,
/******/ 			status: function(l) {
/******/ 				if(!l) return hotStatus;
/******/ 				hotStatusHandlers.push(l);
/******/ 			},
/******/ 			addStatusHandler: function(l) {
/******/ 				hotStatusHandlers.push(l);
/******/ 			},
/******/ 			removeStatusHandler: function(l) {
/******/ 				var idx = hotStatusHandlers.indexOf(l);
/******/ 				if(idx >= 0) hotStatusHandlers.splice(idx, 1);
/******/ 			},
/******/ 	
/******/ 			//inherit from previous dispose call
/******/ 			data: hotCurrentModuleData[moduleId]
/******/ 		};
/******/ 		return hot;
/******/ 	}
/******/ 	
/******/ 	var hotStatusHandlers = [];
/******/ 	var hotStatus = "idle";
/******/ 	
/******/ 	function hotSetStatus(newStatus) {
/******/ 		hotStatus = newStatus;
/******/ 		for(var i = 0; i < hotStatusHandlers.length; i++)
/******/ 			hotStatusHandlers[i].call(null, newStatus);
/******/ 	}
/******/ 	
/******/ 	// while downloading
/******/ 	var hotWaitingFiles = 0;
/******/ 	var hotChunksLoading = 0;
/******/ 	var hotWaitingFilesMap = {};
/******/ 	var hotRequestedFilesMap = {};
/******/ 	var hotAvailibleFilesMap = {};
/******/ 	var hotCallback;
/******/ 	
/******/ 	// The update info
/******/ 	var hotUpdate, hotUpdateNewHash;
/******/ 	
/******/ 	function hotCheck(apply, callback) {
/******/ 		if(hotStatus !== "idle") throw new Error("check() is only allowed in idle status");
/******/ 		if(typeof apply === "function") {
/******/ 			hotApplyOnUpdate = false;
/******/ 			callback = apply;
/******/ 		} else {
/******/ 			hotApplyOnUpdate = apply;
/******/ 			callback = callback || function(err) { if(err) throw err };
/******/ 		}
/******/ 		hotSetStatus("check");
/******/ 		hotDownloadManifest(function(err, update) {
/******/ 			if(err) return callback(err);
/******/ 			if(!update) {
/******/ 				hotSetStatus("idle");
/******/ 				callback(null, null);
/******/ 				return;
/******/ 			}
/******/ 	
/******/ 			hotRequestedFilesMap = {};
/******/ 			hotAvailibleFilesMap = {};
/******/ 			hotWaitingFilesMap = {};
/******/ 			for(var i = 0; i < update.c.length; i++)
/******/ 				hotAvailibleFilesMap[update.c[i]] = true;
/******/ 			hotUpdateNewHash = update.h;
/******/ 	
/******/ 			hotSetStatus("prepare");
/******/ 			hotCallback = callback;
/******/ 			hotUpdate = {};
/******/ 			var chunkId = 0; {
/******/ 				hotEnsureUpdateChunk(chunkId);
/******/ 			}
/******/ 			if(hotChunksLoading === 0 && hotWaitingFiles === 0) {
/******/ 				hotUpdateDownloaded();
/******/ 			}
/******/ 		});
/******/ 	}
/******/ 	
/******/ 	function hotAddUpdateChunk(chunkId, moreModules) {
/******/ 		if(!hotAvailibleFilesMap[chunkId] || !hotRequestedFilesMap[chunkId])
/******/ 			return;
/******/ 		hotRequestedFilesMap[chunkId] = false;
/******/ 		for(var moduleId in moreModules) {
/******/ 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				hotUpdate[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(--hotWaitingFiles === 0 && hotChunksLoading === 0) {
/******/ 			hotUpdateDownloaded();
/******/ 		}
/******/ 	}
/******/ 	
/******/ 	function hotEnsureUpdateChunk(chunkId) {
/******/ 		if(!hotAvailibleFilesMap[chunkId]) {
/******/ 			hotWaitingFilesMap[chunkId] = true;
/******/ 		} else {
/******/ 			hotRequestedFilesMap[chunkId] = true;
/******/ 			hotWaitingFiles++;
/******/ 			hotDownloadUpdateChunk(chunkId);
/******/ 		}
/******/ 	}
/******/ 	
/******/ 	function hotUpdateDownloaded() {
/******/ 		hotSetStatus("ready");
/******/ 		var callback = hotCallback;
/******/ 		hotCallback = null;
/******/ 		if(!callback) return;
/******/ 		if(hotApplyOnUpdate) {
/******/ 			hotApply(hotApplyOnUpdate, callback);
/******/ 		} else {
/******/ 			var outdatedModules = [];
/******/ 			for(var id in hotUpdate) {
/******/ 				if(Object.prototype.hasOwnProperty.call(hotUpdate, id)) {
/******/ 					outdatedModules.push(+id);
/******/ 				}
/******/ 			}
/******/ 			callback(null, outdatedModules);
/******/ 		}
/******/ 	}
/******/ 	
/******/ 	function hotApply(options, callback) {
/******/ 		if(hotStatus !== "ready") throw new Error("apply() is only allowed in ready status");
/******/ 		if(typeof options === "function") {
/******/ 			callback = options;
/******/ 			options = {};
/******/ 		} else if(options && typeof options === "object") {
/******/ 			callback = callback || function(err) { if(err) throw err };
/******/ 		} else {
/******/ 			options = {};
/******/ 			callback = callback || function(err) { if(err) throw err };
/******/ 		}
/******/ 		
/******/ 		function getAffectedStuff(module) {
/******/ 			var outdatedModules = [module];
/******/ 			var outdatedDependencies = {};
/******/ 			
/******/ 			var queue = outdatedModules.slice();
/******/ 			while(queue.length > 0) {
/******/ 				var moduleId = queue.pop();
/******/ 				var module = installedModules[moduleId];
/******/ 				if(!module || module.hot._selfAccepted)
/******/ 					continue;
/******/ 				if(module.hot._selfDeclined) {
/******/ 					return new Error("Aborted because of self decline: " + moduleId);
/******/ 				}
/******/ 				if(moduleId === 0) {
/******/ 					return;
/******/ 				}
/******/ 				for(var i = 0; i < module.parents.length; i++) {
/******/ 					var parentId = module.parents[i];
/******/ 					var parent = installedModules[parentId];
/******/ 					if(parent.hot._declinedDependencies[moduleId]) {
/******/ 						return new Error("Aborted because of declined dependency: " + moduleId + " in " + parentId);
/******/ 					}
/******/ 					if(outdatedModules.indexOf(parentId) >= 0) continue;
/******/ 					if(parent.hot._acceptedDependencies[moduleId]) {
/******/ 						if(!outdatedDependencies[parentId])
/******/ 							outdatedDependencies[parentId] = [];
/******/ 						addAllToSet(outdatedDependencies[parentId], [moduleId]);
/******/ 						continue;
/******/ 					}
/******/ 					delete outdatedDependencies[parentId];
/******/ 					outdatedModules.push(parentId);
/******/ 					queue.push(parentId);
/******/ 				}
/******/ 			}
/******/ 			
/******/ 			return [outdatedModules, outdatedDependencies];
/******/ 		}
/******/ 		function addAllToSet(a, b) {
/******/ 			for(var i = 0; i < b.length; i++) {
/******/ 				var item = b[i];
/******/ 				if(a.indexOf(item) < 0)
/******/ 					a.push(item);
/******/ 			}
/******/ 		}
/******/ 	
/******/ 		// at begin all updates modules are outdated
/******/ 		// the "outdated" status can propagate to parents if they don't accept the children
/******/ 		var outdatedDependencies = {};
/******/ 		var outdatedModules = [];
/******/ 		var appliedUpdate = {};
/******/ 		for(var id in hotUpdate) {
/******/ 			if(Object.prototype.hasOwnProperty.call(hotUpdate, id)) {
/******/ 				var moduleId = +id;
/******/ 				var result = getAffectedStuff(moduleId);
/******/ 				if(!result) {
/******/ 					if(options.ignoreUnaccepted)
/******/ 						continue;
/******/ 					hotSetStatus("abort");
/******/ 					return callback(new Error("Aborted because " + moduleId + " is not accepted"));
/******/ 				}
/******/ 				if(result instanceof Error) {
/******/ 					hotSetStatus("abort");
/******/ 					return callback(result);
/******/ 				}
/******/ 				appliedUpdate[moduleId] = hotUpdate[moduleId];
/******/ 				addAllToSet(outdatedModules, result[0]);
/******/ 				for(var moduleId in result[1]) {
/******/ 					if(Object.prototype.hasOwnProperty.call(result[1], moduleId)) {
/******/ 						if(!outdatedDependencies[moduleId])
/******/ 							outdatedDependencies[moduleId] = [];
/******/ 						addAllToSet(outdatedDependencies[moduleId], result[1][moduleId]);
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 	
/******/ 		// Store self accepted outdated modules to require them later by the module system
/******/ 		var outdatedSelfAcceptedModules = [];
/******/ 		for(var i = 0; i < outdatedModules.length; i++) {
/******/ 			var moduleId = outdatedModules[i];
/******/ 			if(installedModules[moduleId] && installedModules[moduleId].hot._selfAccepted)
/******/ 				outdatedSelfAcceptedModules.push({
/******/ 					module: moduleId,
/******/ 					errorHandler: installedModules[moduleId].hot._selfAccepted
/******/ 				});
/******/ 		}
/******/ 	
/******/ 		// Now in "dispose" phase
/******/ 		hotSetStatus("dispose");
/******/ 		var queue = outdatedModules.slice();
/******/ 		while(queue.length > 0) {
/******/ 			var moduleId = queue.pop();
/******/ 			var module = installedModules[moduleId];
/******/ 			if(!module) continue;
/******/ 	
/******/ 			var data = {};
/******/ 	
/******/ 			// Call dispose handlers
/******/ 			var disposeHandlers = module.hot._disposeHandlers;
/******/ 			for(var j = 0; j < disposeHandlers.length; j++) {
/******/ 				var cb = disposeHandlers[j]
/******/ 				cb(data);
/******/ 			}
/******/ 			hotCurrentModuleData[moduleId] = data;
/******/ 	
/******/ 			// disable module (this disables requires from this module)
/******/ 			module.hot.active = false;
/******/ 	
/******/ 			// remove module from cache
/******/ 			delete installedModules[moduleId];
/******/ 	
/******/ 			// remove "parents" references from all children
/******/ 			for(var j = 0; j < module.children.length; j++) {
/******/ 				var child = installedModules[module.children[j]];
/******/ 				if(!child) continue;
/******/ 				var idx = child.parents.indexOf(moduleId);
/******/ 				if(idx >= 0) {
/******/ 					child.parents.splice(idx, 1);
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 	
/******/ 		// remove outdated dependency from module children
/******/ 		for(var moduleId in outdatedDependencies) {
/******/ 			if(Object.prototype.hasOwnProperty.call(outdatedDependencies, moduleId)) {
/******/ 				var module = installedModules[moduleId];
/******/ 				var moduleOutdatedDependencies = outdatedDependencies[moduleId];
/******/ 				for(var j = 0; j < moduleOutdatedDependencies.length; j++) {
/******/ 					var dependency = moduleOutdatedDependencies[j];
/******/ 					var idx = module.children.indexOf(dependency);
/******/ 					if(idx >= 0) module.children.splice(idx, 1);
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 	
/******/ 		// Not in "apply" phase
/******/ 		hotSetStatus("apply");
/******/ 	
/******/ 		hotCurrentHash = hotUpdateNewHash;
/******/ 	
/******/ 		// insert new code
/******/ 		for(var moduleId in appliedUpdate) {
/******/ 			if(Object.prototype.hasOwnProperty.call(appliedUpdate, moduleId)) {
/******/ 				modules[moduleId] = appliedUpdate[moduleId];
/******/ 			}
/******/ 		}
/******/ 	
/******/ 		// call accept handlers
/******/ 		var error = null;
/******/ 		for(var moduleId in outdatedDependencies) {
/******/ 			if(Object.prototype.hasOwnProperty.call(outdatedDependencies, moduleId)) {
/******/ 				var module = installedModules[moduleId];
/******/ 				var moduleOutdatedDependencies = outdatedDependencies[moduleId];
/******/ 				var callbacks = [];
/******/ 				for(var i = 0; i < moduleOutdatedDependencies.length; i++) {
/******/ 					var dependency = moduleOutdatedDependencies[i];
/******/ 					var cb = module.hot._acceptedDependencies[dependency];
/******/ 					if(callbacks.indexOf(cb) >= 0) continue;
/******/ 					callbacks.push(cb);
/******/ 				}
/******/ 				for(var i = 0; i < callbacks.length; i++) {
/******/ 					var cb = callbacks[i];
/******/ 					try {
/******/ 						cb(outdatedDependencies);
/******/ 					} catch(err) {
/******/ 						if(!error)
/******/ 							error = err;
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 	
/******/ 		// Load self accepted modules
/******/ 		for(var i = 0; i < outdatedSelfAcceptedModules.length; i++) {
/******/ 			var item = outdatedSelfAcceptedModules[i];
/******/ 			var moduleId = item.module;
/******/ 			hotCurrentParents = [moduleId];
/******/ 			try {
/******/ 				__webpack_require__(moduleId);
/******/ 			} catch(err) {
/******/ 				if(typeof item.errorHandler === "function") {
/******/ 					try {
/******/ 						item.errorHandler(err);
/******/ 					} catch(err) {
/******/ 						if(!error)
/******/ 							error = err;
/******/ 					}
/******/ 				} else if(!error)
/******/ 					error = err;
/******/ 			}
/******/ 		}
/******/ 	
/******/ 		// handle errors in accept handlers and self accepted module load
/******/ 		if(error) {
/******/ 			hotSetStatus("fail");
/******/ 			return callback(error);
/******/ 		}
/******/ 	
/******/ 		hotSetStatus("idle");
/******/ 		callback(null, outdatedModules);
/******/ 	}

/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			hot: hotCreateModule(moduleId),
/******/ 			parents: hotCurrentParents,
/******/ 			children: []
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, hotCreateRequire(moduleId));

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";

/******/ 	// __webpack_hash__
/******/ 	__webpack_require__.h = function() { return hotCurrentHash; };

/******/ 	// Load entry module and return exports
/******/ 	return hotCreateRequire(0)(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(1);
	module.exports = __webpack_require__(2);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	if(true) {
		var lastData;
		var upToDate = function upToDate() {
			return lastData.indexOf(__webpack_require__.h()) >= 0;
		};
		var check = function check() {
			module.hot.check(true, function(err, updatedModules) {
				if(err) {
					if(module.hot.status() in {abort:1,fail:1}) {
						console.warn("[HMR] Cannot apply update. Need to do a full reload!");
						window.location.reload();
					} else {
						console.warn("[HMR] Update failed: " + err);
					}
					return;
				}

				if(!updatedModules) {
					console.warn("[HMR] Cannot find update. Need to do a full reload!");
					console.warn("[HMR] (Probably because of restarting the webpack-dev-server)")
					window.location.reload();
					return;
				}

				if(!upToDate()) {
					check();
				}

				if(!updatedModules || updatedModules.length === 0) {
					console.log("[HMR] Update is empty.");
				} else {
					console.log("[HMR] Updated modules:");
					updatedModules.forEach(function(moduleId) {
						console.log("[HMR]  - " + moduleId);
					});
				}
				if(upToDate()) {
					console.log("[HMR] App is up to date.");
				}

			});
		};
		var addEventListener = window.addEventListener ? function(eventName, listener) {
			window.addEventListener(eventName, listener, false);
		} : function (eventName, listener) {
			window.attachEvent('on' + eventName, listener);
		};
		addEventListener("message", function(event) {
			if(typeof event.data === "string" && event.data.indexOf("webpackHotUpdate") === 0) {
				lastData = event.data;
				if(!upToDate() && module.hot.status() === "idle") {
					console.log("[HMR] Checking for updates on the server...");
					check();
				}
			}
		});
		console.log("[HMR] Waiting for update signal from WDS...");
	} else {
		throw new Error("[HMR] Hot Module Replacement is disabled.");
	}


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

	var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	// create web audio api context
	var audioCtx = new window.AudioContext();

	function getOutput(fn) {
	    var out = fn && fn();

	    if (out) {
	        out.rawNode.connect(audioCtx.destination);
	    }
	}

	var NodeWrapper = (function () {
	    function NodeWrapper(node) {
	        _classCallCheck(this, NodeWrapper);

	        this.rawNode = node;
	    }

	    _prototypeProperties(NodeWrapper, null, {
	        connect: {
	            value: function connect(nodeWrapper) {
	                this.rawNode.connect(nodeWrapper.rawNode);
	                return nodeWrapper;
	            },
	            writable: true,
	            configurable: true
	        }
	    });

	    return NodeWrapper;
	})();

	var ValueState = (function () {
	    function ValueState(params) {
	        _classCallCheck(this, ValueState);

	        this.value = params.value;
	        this.listeners = params.listeners;
	    }

	    _prototypeProperties(ValueState, null, {
	        onUpdate: {
	            value: function onUpdate(fn) {
	                this.listeners.push(fn);
	            },
	            writable: true,
	            configurable: true
	        },
	        map: {
	            value: function map(fn) {
	                var mapper = new ValueState({
	                    value: this.value,
	                    listeners: []
	                });

	                this.onUpdate(function (v) {
	                    return mapper.set(fn(v));
	                });
	                return mapper;
	            },
	            writable: true,
	            configurable: true
	        },
	        set: {
	            value: function set(value) {
	                this.value = value;
	                this.publish();
	            },
	            writable: true,
	            configurable: true
	        },
	        publish: {
	            value: function publish() {
	                var _this = this;

	                this.listeners.forEach(function (l) {
	                    l(_this.value);
	                });
	            },
	            writable: true,
	            configurable: true
	        }
	    });

	    return ValueState;
	})();

	ValueState.create = function (value) {
	    var newState = new ValueState({
	        value: value,
	        listeners: []
	    });
	    return newState;
	};

	var Envelope = (function () {
	    function Envelope(env) {
	        _classCallCheck(this, Envelope);

	        this.attack = env.attack;
	        this.decay = env.decay;
	        this.sustain = env.sustain;
	        this.release = env.release;
	        this.gate = env.gate;
	        this.listeners = env.listeners;
	        this.factor = env.factor;
	    }

	    _prototypeProperties(Envelope, null, {
	        connect: {
	            value: function connect(l) {
	                l.value = 0;
	                this.listeners.push(l);
	            },
	            writable: true,
	            configurable: true
	        },
	        onGateStart: {
	            value: function onGateStart() {
	                var _this = this;

	                // prevent retrig
	                this.listeners.forEach(function (l) {
	                    var z = 0.01 + audioCtx.currentTime;
	                    // attack phase
	                    l.cancelScheduledValues(audioCtx.currentTime);
	                    l.setValueAtTime(0, z);
	                    l.linearRampToValueAtTime(_this.factor, z + _this.attack);
	                    // decay phase
	                    l.linearRampToValueAtTime(_this.sustain * _this.factor, z + _this.attack + _this.decay);
	                });
	            },
	            writable: true,
	            configurable: true
	        },
	        onGateEnd: {
	            value: function onGateEnd() {
	                var _this = this;

	                this.listeners.forEach(function (l) {
	                    var z = audioCtx.currentTime + 0.01;
	                    // release phase
	                    l.cancelScheduledValues(audioCtx.currentTime);
	                    l.linearRampToValueAtTime(0, z + _this.release);
	                });
	            },
	            writable: true,
	            configurable: true
	        }
	    });

	    return Envelope;
	})();

	Envelope.create = function (params) {
	    params.factor = params.factor || 1;
	    params.listeners = params.listeners || [];
	    var env = new Envelope(params);

	    env.gate.onUpdate(function (v) {
	        if (v) {
	            env.onGateStart();
	        } else {
	            env.onGateEnd();
	        }
	    });
	    return env;
	};

	var link = function (src, dest) {
	    if (src instanceof ValueState) {
	        dest.value = src.value;
	        src.onUpdate(function (v) {
	            dest.value = v;
	        });
	    } else if (src instanceof Envelope) {
	        src.connect(dest);
	    } else {
	        dest.value = src;
	    }
	};

	function Osc(params) {
	    var node = audioCtx.createOscillator();
	    node.type = params.type;

	    link(params.frequency, node.frequency);
	    link(params.detune || 0, node.detune);

	    node.start();

	    return new NodeWrapper(node);
	}

	function VCF(params) {
	    var node = audioCtx.createBiquadFilter();

	    node.type = params.type;
	    link(params.cutoff, node.frequency);
	    link(params.resonance, node.Q);

	    return new NodeWrapper(node);
	}

	function VCA(params) {
	    var node = audioCtx.createGain();
	    link(params.gain, node.gain);

	    return new NodeWrapper(node);
	}

	function Mixer(params) {
	    var channels = params.channels;
	    var out = audioCtx.createGain();

	    channels.forEach(function (ch) {
	        var _ch = _slicedToArray(ch, 2);

	        var audio = _ch[0];
	        var level = _ch[1];

	        var gain = audioCtx.createGain();
	        link(level, gain.gain);

	        audio.rawNode.connect(gain);
	        gain.connect(out);
	    });

	    return new NodeWrapper(out);
	}

	var toNote = function (low, octaves) {
	    return function (value) {
	        return low * Math.pow(2, octaves * value);
	    };
	};

	var notes = (function () {
	    var _notes = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"].map(function (n, i) {
	        return {
	            id: n,
	            freq: toNote(32.7032, 1)(i / 12)
	        };
	    }).reduce(function (coll, x) {
	        coll[x.id] = x.freq;
	        return coll;
	    }, {});

	    _notes["A#"] = _notes.Bb;
	    _notes["C#"] = _notes.Db;
	    _notes["D#"] = _notes.Eb;
	    _notes["F#"] = _notes.Gb;
	    _notes["G#"] = _notes.Ab;
	    return _notes;
	})();

	var noteNameToPitch = function (x) {
	    var n = x.match(/\D+/)[0];
	    var o = Number(x.match(/\d+/)[0]);

	    return notes[n] * Math.pow(2, o);
	};

	function Clock(params) {
	    // BPM: beats per minute
	    // division: clock division, e.g. 1 - whole note; 16 - sixteenth note
	    var bpm = params.bpm;
	    var division = params.division;

	    var ms = 60000 / (division * bpm / 4);

	    var outs = {
	        trig: ValueState.create()
	    };

	    var updateLoop = function () {
	        outs.trig.set(null);
	        window.setTimeout(updateLoop, ms);
	    };

	    updateLoop();

	    return outs;
	}

	function Sequencer(params) {
	    var sequence = params.sequence;
	    var trig = params.trig;

	    // todo: sequence type
	    var freqs = sequence.map(noteNameToPitch);

	    var i = 0;

	    var outs = {
	        freq: ValueState.create()
	    };

	    trig.onUpdate(function () {
	        outs.freq.set(freqs[i]);
	        i = (i + 1) % freqs.length;
	    });

	    return outs;
	}

	function XYPad(pad) {
	    var outs = {
	        x: ValueState.create(0),
	        y: ValueState.create(0)
	    };

	    var range = 300;
	    pad.addEventListener("scroll", function (e) {
	        var _e$target = e.target;
	        var scrollTop = _e$target.scrollTop;
	        var scrollLeft = _e$target.scrollLeft;

	        outs.x.set(scrollLeft / range);
	        outs.y.set(scrollTop / range);
	    });
	    return outs;
	}

	function Keyboard(el) {
	    var outs = {
	        freq: ValueState.create(),
	        gate: ValueState.create(0)
	    };

	    var keyMap = new Map([["A", "C4"], ["S", "D4"], ["D", "E4"], ["F", "F4"], ["G", "G4"], ["H", "A4"], ["J", "B4"], ["K", "C5"], ["L", "D5"]]);

	    var keyCodeToPitch = function (keyCode) {
	        var key = String.fromCharCode(keyCode);
	        var noteName = keyMap.get(key);
	        if (!noteName) {
	            return;
	        }
	        return noteNameToPitch(noteName);
	    };

	    var noteStack = [];

	    var noteOn = function (pitch) {
	        // add pitch to noteStack
	        if (! ~noteStack.indexOf(pitch)) {
	            noteStack.push(pitch);
	            outs.freq.set(pitch);
	            outs.gate.set(1);
	        }
	    };

	    var noteOff = function (pitch) {
	        var i = noteStack.indexOf(pitch);

	        // remove pitch from noteStack
	        if (~!i) {
	            noteStack.splice(i, 1);
	        }

	        // set pitch to head of noteStack
	        if (noteStack.length) {
	            outs.freq.set(noteStack[noteStack.length - 1]);
	        } else {
	            outs.gate.set(0);
	        }
	    };

	    el.addEventListener("keydown", function (e) {
	        var pitch = keyCodeToPitch(e.keyCode);
	        if (pitch) {
	            noteOn(pitch);
	        }
	    });

	    el.addEventListener("keyup", function (e) {
	        var pitch = keyCodeToPitch(e.keyCode);
	        if (pitch) {
	            noteOff(pitch);
	        }
	    });

	    return outs;
	}

	document.addEventListener("DOMContentLoaded", function () {
	    var _keyboard = document.getElementById("keyboard");
	    _keyboard.focus();
	    var pad = XYPad(document.getElementById("xy-pad"));

	    var key = Keyboard(_keyboard);

	    var clock = Clock({ bpm: 120, division: 16 });

	    var ADSR = Envelope.create({
	        attack: 1, decay: 1, sustain: 1, release: 1,
	        gate: key.gate, factor: 1
	    });

	    // const seq = Sequencer({sequence: ['A4','C4','D4','E4'], trig: clock.trig});

	    // const seqOctave = seq.freq.map(x => x / 2);

	    var cutoff = pad.y.map(toNote(100, 10));
	    cutoff.set(100);
	    var res = pad.x.map(function (x) {
	        return x * 25;
	    });

	    getOutput(function () {
	        return Osc({ type: "sawtooth", frequency: key.freq.map(function (x) {
	                return x / 2;
	            }) }).connect(VCF({ type: "lowpass", cutoff: cutoff, resonance: res })).connect(VCA({ gain: ADSR }));
	    });
	});

/***/ }
/******/ ]);