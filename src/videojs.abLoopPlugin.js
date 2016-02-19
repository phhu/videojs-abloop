/*
 * Video.js AB loop
 */

;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory.bind(this, root, root.videojs));
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(root, root.videojs);
  } else {
    factory(root, root.videojs);
  }
})(window, function(window, videojs) {
	"use strict";

	var version = "0.2.0";
	var abLoopPlugin = function (initialOptions) {
		var player = this;

		//contains options, allowing them to be set at runtime
		var opts = {};		
		
		//utility functions
		var isNumber = function (n) {
			return !isNaN(parseFloat(n)) && isFinite(n);
		}
		var isFunction = function(functionToCheck) {
			var getType = {};
			return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
		}
		
		//used for validation and setting of boolean options
		var booleanOptions = ['moveToStartIfBeforeStart','moveToStartIfAfterEnd','enabled','pauseOnLoop'];
		
		//check that the options make sense. This is called on timeupdate, before the main logic.
		//so nonsense options will persist as long as time does not update
		
		var validateStart = function(s){
			if (s===false){return s;}
			if (isNumber(s) && s>= 0){return s;} 
			return 0;
		}
		var validateEnd = function(x){
			if (x===false){return x;}
			if (isNumber(x)){
				var duration = player.duration();
				if (duration == undefined || duration === 0){
					if ( x>= 0 ){return x;} 
				} else {
					if ( x>= 0 && x <= duration){
						return x;
					} else if ( x> duration){
						return duration;
					}
				}
			}
			return false;// by default, loop to end of video
		}		
		
		var validateOptions = function(){
			
			opts.start = validateStart(opts.start);
			opts.end = validateEnd(opts.end);
			
			//clean up booleans, forcing them to be actual booleans
			booleanOptions.forEach(function(optName){
				opts[optName] = opts[optName] ? true : false;
			});
			
			return api;
		}

		var setOptionsToInitialOptions = function(){
			return setOptions(initialOptions,true);
		}
		
		var setOptions = function(newOptions,replaceAll){
			opts.start = newOptions.start;
			opts.end=  newOptions.end;
			
			booleanOptions.forEach(function(optName){
				if (replaceAll || newOptions[optName]){
					opts[optName] = newOptions[optName];
				}
			});			

			validateOptions();			
			return api;
		}
		
		//this sets the player to the start of the loop
		var goToStartOfLoop = function(){
			
			player.currentTime(opts.start);
			if (opts.pauseOnLoop){
				player.pause();
			}
			//invoke callback if set
			if (isFunction(api.onLoopCallBack)){
				api.onLoopCallBack(opts,api,player);
			}
			return api;
		}

		
		var goToEndOfLoop = function(){
			player.currentTime(opts.end);
			return api;
		}						
		var setStartOfLoop = function(time){
			time = (time == undefined) ? player.currentTime() : time;
			opts.start = time;
			return api;
		}		
		var setEndOfLoop = function(time){
			time = (time == undefined) ? player.currentTime() : time;
			opts.end = time;
			return api;
		}			
		var enableLoop = function(){
			opts.enabled = true;
			return api;
		}
		var toggleLoop = function(){
			opts.enabled = !opts.enabled;
			return api;
		}
		var disableLoop = function(){
			opts.enabled = false;
			return api;
		}
		var togglePauseOnLoop = function(){
			opts.pauseOnLoop = !opts.pauseOnLoop;
			return api;
		}
		/*var getOptions = function(){
			return opts; 
		}*/
		
		//check if we need to go to start of loop
		var checkABLoop = function(e){
			if (!opts.enabled){return false;}   //don't check if not enabled
			
			validateOptions();
			var curTime = player.currentTime();
			var endTime = (opts.end === false) ? player.duration() : opts.end;
			var startTime = (opts.start === false) ? 0 : opts.start;
			
			if (startTime === endTime){
				player.pause();				//to save contant looping behaviour
			} else if (curTime < startTime && opts.moveToStartIfBeforeStart){
				goToStartOfLoop();	
			} else if (curTime >= endTime){
				//use a margin of one just in case time has skipped a bit past
				if ((curTime - endTime) < 1 || opts.moveToStartIfAfterEnd){
					goToStartOfLoop();
				}
			}
		};
		
		//functions etc to expose as API 
		var api = {
			options: opts,
			validateOptions:validateOptions,
			resetToInitialOptions:setOptionsToInitialOptions,
			setOptions: setOptions,
			//getOptions: getOptions,
			goToStart: goToStartOfLoop,
			goToEnd: goToEndOfLoop,	
			setStart: setStartOfLoop,
			setEnd: setEndOfLoop,
			enable: enableLoop,
			disable: disableLoop,
			toggle: toggleLoop,
			togglePauseOnLoop: togglePauseOnLoop,
			onLoopCallBack: function(opts,api,player){
				//console.log("Looping back to %s sec on %s",opts.start, player.currentSrc() );
			},
			player: player,
			version: version,
			//toString: function(){return JSON.stringify(opts);}
		};
		
		//this replaces the reference created to this function on each player object
		//with a reference to the api object (created once per invocation of this function)
		//The functions created in this function and referenced by api will still 
		//be available via closure		
		player['abLoopPlugin'] = api;
		
		//get options to initial options
		setOptionsToInitialOptions();		
		//on timeupdate, check if we need to loop
		player.on('timeupdate',checkABLoop);
	};
	
	abLoopPlugin.VERSION = version;
	videojs.plugin('abLoopPlugin', abLoopPlugin);

});
