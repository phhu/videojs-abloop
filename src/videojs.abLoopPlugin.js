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

	videojs.plugin('abLoopPlugin', function (initialOptions) {
		var player = this;
		
		//plugin instance - same object
		var pluginName = 'abLoopPlugin';	
		var plugin = player[pluginName]; //already assisgned, a reference to this function
		plugin.VERSION = '0.1.0';
	
		//api is a per player interface
		var apiName = pluginName + 'API';    //this is the interface for controlling the loop on each player
		player[apiName] = player[apiName] || {}; 	
		var api = player[apiName];   
		api.options = api.options || {};
		var opts = api.options;		
		
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
		var validateOptions = function(){
		
			//start defaults to 0;
			if (opts.start == undefined || !isNumber(opts.start) || opts.start < 0){opts.start = 0;}
			
			//end defaults to duration, or start + 1 if it's not set
			//setting it to false 
			var duration = player.duration();
			if (duration){
				if ( opts.end ==undefined|| opts.end ===false || !isNumber(opts.end) ||opts.end < opts.start || opts.end > duration  ){
					opts.end = duration;
				}	
			} else {
				//allow undefined end to default to false - which will become duration hopefully
				if (opts.end == undefined){opts.end = false; }
				if (opts.end !== false && (!isNumber(opts.end) || opts.end < opts.start)){
					opts.end = opts.start + 1;
				}
			}

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
				api.onLoopCallBack(api,opts,player);
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
		
		//functions to expose as API 
		api.validateOptions = validateOptions;
		api.resetToInitialOptions = setOptionsToInitialOptions;
		api.setOptions = setOptions;
		//api.getOptions = getOptions;
		api.goToStart = goToStartOfLoop;
		api.goToEnd = goToEndOfLoop;	
		api.setStart = setStartOfLoop;
		api.setEnd = setEndOfLoop;
		api.enable = enableLoop;
		api.disable = disableLoop;
		api.toggle = toggleLoop;
		api.togglePauseOnLoop = togglePauseOnLoop;
		
		//sample callback function - called when the loop happens
		api.onLoopCallBack = function(api,opts,player){
			//console.log("Looping back to " + opts.start);
		}
		api.player = player;
		
		//main logic
		var checkABLoop = function(e){
			//console.log("chekcing loop");
			if (!opts.enabled){return false;}
			var curTime = player.currentTime();
			if (opts.end === false){opts.end=player.duration();}
			validateOptions();
			
			if (opts.start === opts.end){player.pause();}
			if (opts.moveToStartIfBeforeStart && curTime < opts.start){
				goToStartOfLoop();
			} else if (curTime >= opts.end){
				//use a margin of one just in case time has skipped a bit past
				if ((curTime - opts.end) < 1 || opts.moveToStartIfAfterEnd){
					goToStartOfLoop();
				}
			}
		};
		
		//get options
		setOptionsToInitialOptions();		
		//on timeupdate, check if we need to loop
		player.on('timeupdate',checkABLoop);

	});

});
