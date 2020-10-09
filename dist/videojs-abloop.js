// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"gk0h":[function(require,module,exports) {
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*
 * Video.js AB loop plugin
 * Adds function to allow looping for a section of a video in video.js player
 * https://github.com/phhu/videojs-abloop
 * MIT licence
 */
// export default
module.exports = function (window, videojs) {
  var version = "1.2.0";

  var abLoopPlugin = function abLoopPlugin(initialOptions) {
    //default initial options if not specified. 
    initialOptions = initialOptions || {}; //get reference to player

    var player = this; //utility functions

    var isNumber = function isNumber(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    };

    var isFunction = function isFunction(functionToCheck) {
      var getType = {};
      return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    };

    var toBoolean = function toBoolean(x) {
      return !!x;
    };

    var cloneAndPluck = function cloneAndPluck(sourceObject, keys) {
      var newObject = {};
      keys.forEach(function (key) {
        if (sourceObject[key] !== undefined) {
          newObject[key] = sourceObject[key];
        }
      });
      return newObject;
    }; //adds decimals to videojs's format time function


    var formatTimeWithMS = function formatTimeWithMS(seconds, decimalPlaces) {
      decimalPlaces = decimalPlaces || 1;
      return videojs.formatTime(seconds) + '.' + Math.floor(seconds % 1 * Math.pow(10, decimalPlaces));
    };

    var roundFloat = function roundFloat(n, decimalPlaces) {
      var f = Math.pow(10, decimalPlaces);
      return Math.floor(n * f) / f;
    }; //this converts a timestamp (1h23, 1:23:33, 1m30s etc) to a number of seconds


    var parseTimeStamp = function parseTimeStamp(timestamp) {
      if (timestamp === undefined) {
        return undefined;
      } //if a plain number ,assume seconds


      if (isNumber(timestamp)) {
        return timestamp;
      }

      if (/^([+\-])?([\d\.]+)$/i.test(timestamp)) {
        return parseFloat(timestamp);
      } //this assumes a plain whole number is minutes


      var res = /^([+\-])?((([\d]+)(h|:(?=.*:)))?(([\d]+)(m|:|$))?)?(([\d\.]+)s?)?$/i.exec(timestamp);

      if (!res) {
        return null;
      }

      var d = {
        match: res[0],
        sign: res[1],
        hours: res[4] || 0,
        mins: res[7] || 0,
        secs: res[10] || 0
      };
      var multiplier = d.sign == '-' ? -1 : 1;
      var totSecs = parseFloat(d.hours) * 60 * 60 + parseFloat(d.mins) * 60 + parseFloat(d.secs);
      return isNumber(totSecs) ? multiplier * totSecs : null;
    }; //contains options, allowing them to be set at runtime


    var opts = {};
    var optionSpecs = {
      'start': {
        "default": 0,
        "validate": function validate(x) {
          if (x === false) {
            return x;
          }

          if (isNumber(x) && x >= 0) {
            return x;
          }

          return 0;
        }
      },
      'end': {
        "default": false,
        "validate": function validate(x) {
          if (x === false) {
            return x;
          } //allow false values to mean loop til end


          if (isNumber(x)) {
            var duration = player.duration();

            if (duration === 0 || !isNumber(duration)) {
              //duration unknown
              if (x >= 0) {
                return x;
              }
            } else {
              //we know the duration
              if (x >= 0 && x <= duration) {
                return x;
              } else if (x > duration) {
                return duration;
              } else {
                // shouldn't happen....
                return x;
              }
            }
          }

          return false; // by default, loop to end of video
        }
      },
      'enabled': {
        "default": false,
        "validate": toBoolean
      },
      'loopIfBeforeStart': {
        "default": true,
        "validate": toBoolean
      },
      'loopIfAfterEnd': {
        "default": true,
        "validate": toBoolean
      },
      'pauseBeforeLooping': {
        "default": false,
        "validate": toBoolean
      },
      'pauseAfterLooping': {
        "default": false,
        "validate": toBoolean
      } //it's easier not to treat this as an option, as can't remove buttons once created

      /*,'createButtons':{
      "default":true
      ,"validate":toBoolean
      }*/

    }; //callbacks can be included in initial options, but are not treated as options
    //check is used to check that the callbacks are valid, but not to replace their values

    var callBackSpecs = {
      'onLoopCallBack': {
        "default": undefined,
        "check": isFunction
      },
      'onOptionsChange': {
        "default": undefined,
        "check": isFunction
      }
    }; //for convenience

    var optionNames = Object.keys(optionSpecs);
    var callBackNames = Object.keys(callBackSpecs); //set initial option values to defaults if they are not specified

    var defaultInitialOptions = function defaultInitialOptions() {
      initialOptions = initialOptions || {};

      var setToDefault = function setToDefault(specs) {
        return function (name) {
          if (initialOptions[name] === undefined) {
            initialOptions[name] = specs[name].default;
          }
        };
      };

      optionNames.forEach(setToDefault(optionSpecs));
      callBackNames.forEach(setToDefault(callBackSpecs));
    }; //assign bound copies of the callbacks to the api


    var setCallBacksToInitialOptions = function setCallBacksToInitialOptions() {
      callBackNames.forEach(function (callBackName) {
        if (callBackSpecs[callBackName].check(initialOptions[callBackName])) {
          api[callBackName] = initialOptions[callBackName]; // .bind(api) - better not to bind
        }
      });
    }; //check that the options make sense. This is called on timeupdate, before the main logic.
    //so nonsense options will persist as long as time does not update


    var validateOptions = function validateOptions() {
      optionNames.forEach(function (optName) {
        opts[optName] = optionSpecs[optName].validate(opts[optName]);
      });
      return api;
    };

    var setOptionsToInitialOptions = function setOptionsToInitialOptions() {
      return setOptions(initialOptions, true);
    };

    var setOptions = function setOptions(newOptions, replaceAll) {
      optionNames.forEach(function (optName) {
        if (replaceAll || newOptions[optName] !== undefined) {
          opts[optName] = newOptions[optName];
        }
      });
      validateOptions();
      return api;
    };

    var alreadyPausedBeforeLoop = false; //if we pause before looping, need to know if it has already been done so that we can then loop
    //this sets the player to the start of the loop

    var goToStartOfLoop = function goToStartOfLoop(checkPause) {
      if (checkPause) {
        if (opts.pauseBeforeLooping && alreadyPausedBeforeLoop === false) {
          player.pause();
          alreadyPausedBeforeLoop = true;
        } else {
          alreadyPausedBeforeLoop = false; //do loop

          player.currentTime(opts.start); //invoke callback if set

          if (opts.pauseAfterLooping) {
            player.pause();
          }

          if (callBackSpecs.onLoopCallBack.check(api.onLoopCallBack)) {
            api.onLoopCallBack(api, player);
          }
        }
      } else {
        alreadyPausedBeforeLoop = false;
        player.currentTime(opts.start);
      }

      return api;
    };

    var goToEndOfLoop = function goToEndOfLoop() {
      alreadyPausedBeforeLoop = false;
      player.currentTime(opts.end);
      return api;
    }; //makes a function to set a time option (start,end)


    var timeSetter = function timeSetter(optName) {
      return function (time) {
        if (time === false) {
          opts[optName] = false;
        } else {
          if (time !== undefined) {
            time = parseTimeStamp(time);
          }

          if (time !== null) {
            time = time === undefined ? player.currentTime() : time;
            opts[optName] = time;
          }
        }

        return api;
      };
    }; //makes a function to change a time option


    var timeAdjuster = function timeAdjuster(optName) {
      return function (adjustment) {
        adjustment = parseTimeStamp(adjustment);

        if (isNumber(adjustment)) {
          opts[optName] += adjustment;
        }

        return api;
      };
    };

    var playLoop = function playLoop() {
      validateOptions();
      goToStartOfLoop(false);
      enableLoop();
      player.play();
      return api;
    };

    var enableLoop = function enableLoop() {
      opts.enabled = true;
      return api;
    };

    var disableLoop = function disableLoop() {
      opts.enabled = false;
      return api;
    };

    var cyclePauseOnLooping = function cyclePauseOnLooping() {
      var after = opts.pauseAfterLooping,
          before = opts.pauseBeforeLooping;

      if (!after && !before) {
        setOptions({
          pauseAfterLooping: true,
          pauseBeforeLooping: false
        });
      } else if (after && !before) {
        setOptions({
          pauseAfterLooping: false,
          pauseBeforeLooping: true
        });
      } else if (!after && before) {
        setOptions({
          pauseAfterLooping: true,
          pauseBeforeLooping: true
        });
      } else {
        setOptions({
          pauseAfterLooping: false,
          pauseBeforeLooping: false
        });
      }

      return api;
    }; //return a function to toggle an option


    var toggler = function toggler(optName) {
      return function () {
        opts[optName] = !opts[optName];
        return api;
      };
    }; //borrowed from videojs library (private method)


    var absoluteURL = function absoluteURL(url) {
      // Check if absolute URL
      if (!url.match(/^https?:\/\//)) {
        // Convert to absolute URL.
        if (window && window.document) {
          var div = window.document.createElement('div');
          div.innerHTML = '<a href="' + url + '">x</a>';
          url = div.firstChild.href;
        }
      }

      return url;
    };

    var getAbsoluteUrlWithHash = function getAbsoluteUrlWithHash(spec) {
      return absoluteURL(getUrlWithHash(spec));
    }; //return a URL hash / fragment describing the looped portion.
    //e.g. #t=10,12  - see https://www.w3.org/TR/media-frags/#standardisation-URI-fragments


    var getUrlHash = function getUrlHash(spec) {
      spec = spec || {};
      spec.decimalPlaces = Math.floor(spec.decimalPlaces) || 3; //validateOptions();

      var start = opts.start !== false ? parseFloat(opts.start) : 0;
      var hash = '#' + 't=' + roundFloat(start, spec.decimalPlaces);

      if (opts.end !== false) {
        var end = parseFloat(opts.end);
        hash += ',' + roundFloat(end, spec.decimalPlaces);
      }

      return hash;
    }; //get a URL with a hash to identify the looping section


    var getUrlWithHash = function getUrlWithHash(spec) {
      spec = spec || {};
      var src = player.currentSrc();

      if (src.src) {
        src = src.src;
      }

      var url = src + getUrlHash(spec);
      return url;
    }; //apply just a hash, effectively setting start and end options


    var applyUrlHash = function applyUrlHash(url) {
      //allow to pass in a string or an object with hash property
      if (typeof url === 'string') {
        url = videojs.parseUrl(url);
      }

      if (url.hash) {
        //extract out the start and end times
        var re = /^(#?t=)?([^,]*)(,(.*))?$/;
        var start = url.hash.replace(re, '$2');
        var end = url.hash.replace(re, '$4'); //normally only seconds or hh:mm:ss are allowed, but allow 1m20s etc

        start = parseTimeStamp(start);
        end = parseTimeStamp(end);

        if (isNumber(start)) {
          opts.start = parseFloat(start);
        }

        if (isNumber(end)) {
          opts.end = parseFloat(end);
        }
      }

      return api;
    }; //apply a url, typically with a hash to identify a section to loop
    //this will load a new source if necessary


    var applyUrl = function applyUrl(url) {
      //could use videojs.parseUrl, but regexping is less hassle
      var urlWithoutHash = url.replace(/^(.*?)(#.*)?$/, '$1');
      var urlHash = url.replace(/^(.*?)(#.*)?$/, '$2'); //check if we need to update the source

      var curSrc = player.currentSrc();

      if (!(curSrc == urlWithoutHash || curSrc == url || url == urlHash)) {
        player.src(urlWithoutHash);
      } //apply hash if there is one


      if (urlHash) {
        applyUrlHash(urlHash);
      }

      return api;
    };

    var getOptions = function getOptions(optionsToReturn) {
      var retOpts = optionsToReturn; //coerce retOpts into an Array

      if (typeof optionsToReturn === 'string') {
        retOpts = [optionsToReturn];
      } else if (optionsToReturn === undefined || !Array.isArray(optionsToReturn)) {
        if (optionsToReturn !== null && _typeof(optionsToReturn) === 'object') {
          //allow specification with an object`
          retOpts = Object.keys(optionsToReturn);
        } else {
          //return all options if none are specified
          retOpts = Object.keys(optionSpecs);
        }
      }

      return cloneAndPluck(opts, retOpts);
    }; //used to add notification to a function call
    //changed is an object of properties which have changed
    //e.g. {'start':true, 'end':false}


    var notify = function notify(funcToRun, changed) {
      var defValue = changed ? false : true; //if changed not specified, assume they all have

      changed = changed || {}; //set defaults for changed

      optionNames.forEach(function (optName) {
        changed[optName] = !!changed[optName] || defValue;
      });
      return function () {
        var args = arguments;
        var oldOpts = getOptions(); //copy options as were

        var ret = funcToRun.apply(null, args);
        var optionDetails = {
          'changed': changed,
          'oldOpts': oldOpts,
          'newOpts': getOptions()
        };

        if (api.onOptionsChange) {
          api.onOptionsChange(optionDetails, api, player);
        }

        updateButtonText(changed); //API might have changed settings, so update the buttons

        return ret;
      };
    };

    var loopAtEndOfVideoRequired = false; //flag set to true if looping around end of video is requierd (where start > end)

    var startMargin = 0.5; //sometimes the video will go to a point just before the loop (rounding), so allow a small margin on the start position check.

    var endMargin = 1; //sometimes the video will go to a point just before the loop (rounding), so allow a small margin on the start position check.
    //given the current player state and options, should we loop?

    var loopRequired = function loopRequired() {
      var curTime, endTime, startTime;
      validateOptions();
      curTime = player.currentTime();
      endTime = getEndTime();
      startTime = getStartTime();

      if (startTime > endTime) {
        loopAtEndOfVideoRequired = true; //if the end is before the start, deal with it

        if (curTime < startTime - startMargin && curTime > endTime && (curTime - endTime < endMargin || opts.loopIfAfterEnd || opts.loopIfBeforeStart)) {
          return true;
        }
      } else {
        //startTime <= endTime
        loopAtEndOfVideoRequired = false;

        if (curTime < startTime - startMargin && opts.loopIfBeforeStart) {
          return true;
        } else if (curTime >= endTime) {
          //use a margin of one just in case time has skipped a bit past
          if (curTime - endTime < endMargin || opts.loopIfAfterEnd) {
            return true;
          }
        }
      }

      return false;
    };

    var getStartTime = function getStartTime() {
      return opts.start === false ? 0 : opts.start;
    };

    var getEndTime = function getEndTime() {
      return opts.end === false ? player.duration() : opts.end;
    };

    var isLooping = false;
    var minLoopLength = isNumber(initialOptions.minLoopLength) && initialOptions.minLoopLength > 0 ? initialOptions.minLoopLength : 200; //function run on time update by player

    var checkABLoop = function checkABLoop(e) {
      if (!isLooping && opts.enabled && !player.paused() && loopRequired()) {
        //prevents constant looping

        /*if (getStartTime() === getEndTime()){
        player.pause();
        }*/
        //prevent looping happening to quickly in succession
        //this effectively sets a minimum loop time
        //if start time and end time are the same, we would get a loop of this length
        isLooping = true;
        setTimeout(function () {
          isLooping = false;
        }, minLoopLength);
        goToStartOfLoop(true);
      }
    }; // BUTTON THINGS


    var buttons = {}; //holds references to the button objects

    var buttonSpecs = [{
      'name': 'start',
      'optionsUsed': ['start'],
      'leftclick': function leftclick(api, event) {
        if (event.shiftKey) {
          api.adjustStart(-0.5);
        } else if (event.ctrlKey) {
          api.adjustStart(-0.05);
        } else {
          api.setStart();
        }
      },
      'rightclick': function rightclick(api, event) {
        if (event.shiftKey) {
          api.adjustStart(0.5);
        } else if (event.ctrlKey) {
          api.adjustStart(0.05);
        } else {
          api.goToStart();
        }
      },
      'defaultText': 'Start',
      'textFunction': function textFunction(opts) {
        return formatTimeWithMS(opts.start);
      }
    }, {
      'name': 'end',
      'optionsUsed': ['end'],
      'leftclick': function leftclick(api, event) {
        if (event.shiftKey) {
          api.adjustEnd(-0.5);
        } else if (event.ctrlKey) {
          api.adjustEnd(-0.05);
        } else {
          api.setEnd();
        }
      },
      'rightclick': function rightclick(api, event) {
        if (event.shiftKey) {
          api.adjustEnd(0.5);
        } else if (event.ctrlKey) {
          api.adjustEnd(0.05);
        } else {
          api.goToEnd();
        }
      },
      'defaultText': 'End',
      'textFunction': function textFunction(opts) {
        return formatTimeWithMS(opts.end);
      }
    }, {
      'name': 'enabled',
      'optionsUsed': ['enabled', 'pauseAfterLooping', 'pauseBeforeLooping'],
      'leftclick': function leftclick(api, event) {
        var msg, url;

        if (window && window.prompt) {
          if (event.ctrlKey) {
            api.applyUrl(inputPrompt("Set new URL", api.getAbsoluteUrl()));
          } else if (event.altKey) {
            api.applyUrl(inputPrompt("Set new URL", api.getUrl()));
          } else if (event.shiftKey) {
            api.applyUrlFragment(inputPrompt("Set new URL fragment", api.getUrlFragment()));
          } else {
            api.toggle();
          }
        } else {
          api.toggle();
        }
      },
      'rightclick': function rightclick(api, event) {
        var msg;

        if (window && window.prompt) {
          if (event.ctrlKey) {
            msg = api.getAbsoluteUrl();
          } else if (event.altKey) {
            msg = api.getUrl();
          } else if (event.shiftKey) {
            msg = api.getUrlFragment();
          }
        }

        if (msg) {
          clipboardPrompt(msg);
        } else {
          api.cyclePauseOnLooping();
        }
      },
      'defaultText': 'Loop',
      'textFunction': function textFunction(opts) {
        if (opts.enabled) {
          if (opts.pauseBeforeLooping && opts.pauseAfterLooping) {
            return 'PAUSE LOOP PAUSE';
          }

          if (opts.pauseAfterLooping) {
            return 'LOOP& PAUSE';
          }

          if (opts.pauseBeforeLooping) {
            return 'PAUSE &LOOP';
          }

          return 'LOOP ON';
        } else {
          return 'Loop off';
        }
      }
    }];

    var clipboardPrompt = function clipboardPrompt(msg) {
      if (window && window.prompt) {
        window.prompt("Copy to clipboard: Ctrl+C, Enter", msg);
      }
    };

    var inputPrompt = function inputPrompt(message, def) {
      if (window && window.prompt) {
        return window.prompt(message, def);
      } else {
        return false;
      }
    };

    var createButton = function createButton(spec, player) {
      //returns a function which handles button clicks,
      var clickFunction = function clickFunction(abLoopCall, whichButton) {
        return function (event) {
          if (whichButton === undefined || event.which && event.which == whichButton) {
            abLoopCall(player.abLoopPlugin, event);
            this.updateText();
          }
        };
      }; //returns a function which handles button text updates


      var updateTextFunction = function updateTextFunction(defaultText, textFunction) {
        return function () {
          var text = textFunction(opts) || defaultText;
          var el = this.el();
          el.textContent = text; //el.innerText = text;    //doesn't work in Firefox
        };
      }; //create the button


      var b = player.controlBar.addChild('Button');

      if (spec.leftclick) {
        b.on('click', clickFunction(spec.leftclick));
      }

      if (spec.rightclick) {
        //event which
        //bind the function as it isn't bound by default
        b.el().onmousedown = clickFunction(spec.rightclick, 3).bind(b); //knock out the context menu

        b.on('contextmenu', function (event) {
          if (event.preventDefault) {
            event.preventDefault();
          }

          if (event.preventDefault) {
            event.stopPropagation();
          }

          return false;
        });
      } //gets called when text on button needs updating


      b.updateText = updateTextFunction(spec.defaultText, spec.textFunction);
      b.optionsUsed = spec.optionsUsed;
      b.addClass('abLoopButton');
      b.addClass(spec.name);
      b.updateText(); //set the initial text

      return b;
    }; //create the buttons based on the specs


    var createButtons = function createButtons(specs) {
      specs.forEach(function (spec) {
        //only create the button if it's not already there
        if (buttons[spec.name] === undefined) {
          buttons[spec.name] = createButton(spec, player);
        }
      });
    }; //updates button displays if not already done


    var updateButtonText = function updateButtonText(changed) {
      var changedReducer = function changedReducer(acc, optName) {
        return acc || changed[optName];
      };

      for (var buttonName in buttons) {
        var b = buttons[buttonName];
        var needsUpdate = !b.optionsUsed || b.optionsUsed.reduce(changedReducer, false);

        if (needsUpdate) {
          b.updateText();
        }
      }
    }; //functions etc to expose as API
    //those which change values can be passed through the notify function


    var api = {
      validateOptions: notify(validateOptions),
      resetToInitialOptions: notify(setOptionsToInitialOptions),
      setOptions: notify(setOptions),
      getOptions: getOptions,
      goToStart: goToStartOfLoop,
      goToEnd: goToEndOfLoop,
      setStart: notify(timeSetter('start'), {
        'start': true
      }),
      setEnd: notify(timeSetter('end'), {
        'end': true
      }),
      adjustStart: notify(timeAdjuster('start'), {
        'start': true
      }),
      adjustEnd: notify(timeAdjuster('end'), {
        'end': true
      }),
      enable: notify(enableLoop, {
        'enabled': true
      }),
      disable: notify(disableLoop, {
        'enabled': true
      }),
      toggle: notify(toggler('enabled'), {
        'enabled': true
      }),
      togglePauseAfterLooping: notify(toggler('pauseAfterLooping'), {
        'pauseAfterLooping': true
      }),
      togglePauseBeforeLooping: notify(toggler('pauseBeforeLooping'), {
        'pauseBeforeLooping': true
      }),
      cyclePauseOnLooping: notify(cyclePauseOnLooping, {
        'pauseBeforeLooping': true,
        'pauseAfterLooping': true
      }),
      player: player,
      version: version,
      getAbsoluteUrl: getAbsoluteUrlWithHash,
      getUrl: getUrlWithHash,
      getUrlFragment: getUrlHash,
      applyUrl: notify(applyUrl, {
        'start': true,
        'end': true
      }),
      applyUrlFragment: notify(applyUrlHash, {
        'start': true,
        'end': true
      }),
      loopRequired: loopRequired //allows testing of conditions via API when player is paused
      ,
      playLoop: notify(playLoop)
    }; //set up the plugin

    var setup = function setup() {
      defaultInitialOptions();
      setCallBacksToInitialOptions(); //set options to initial options and notify of change

      notify(setOptionsToInitialOptions)();
      player.ready(function () {
        //create buttons once the player is ready
        if (initialOptions.createButtons != false) {
          createButtons(buttonSpecs);
        } //if start time is greater than end, the video needs to loop on ending
        //this is indicated by the loopAtEndOfVideoRequired flag


        player.on('ended', function () {
          if (loopAtEndOfVideoRequired && opts.enabled && !player.loop()) {
            player.play();
          }
        });
      }); //this replaces the reference created to this function on each player object
      //with a reference to the api object (created once per invocation of this function)
      //The functions created in this function and referenced by api will still
      //be available via closure

      player.abLoopPlugin = api; //on timeupdate, check if we need to loop

      player.on('timeupdate', checkABLoop);
      api.loaded = true;
    };

    setup();
    return api;
  };

  abLoopPlugin.loaded = false;
  abLoopPlugin.VERSION = version;
  var registerPlugin = videojs.registerPlugin || videojs.plugin;
  return registerPlugin('abLoopPlugin', abLoopPlugin);
};
},{}],"GOVZ":[function(require,module,exports) {
"use strict";

var _videojsAbloop = _interopRequireDefault(require("./videojs-abloop"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// this file used to build the file for distribution 
// and so use directly in the browser
// videojs is an external dependency - see package.json
//import videojs from 'video.js' 
(0, _videojsAbloop.default)(window, videojs);
},{"./videojs-abloop":"gk0h"}]},{},["GOVZ"], null)
//# sourceMappingURL=/videojs-abloop.js.map