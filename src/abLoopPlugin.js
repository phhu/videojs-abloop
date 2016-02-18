videojs.plugin('abLoopPlugin', function (initialOptions) {
	
	var player = this;
	var pluginName = 'abLoopPlugin';
	//player[pluginName] = player[pluginName] || {};
	var plugin = player[pluginName];
	plugin.options = plugin.options || {};
	var opts = plugin.options;
	
	//api is used to give access to control functions
	//could set api to plugin directly, but since it's a function this is a little messy
	plugin.api = plugin.api || {};
	var api = plugin.api;
	
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
	
	//this implements looping behaviour
	var goToStartOfLoop = function(){
		
		player.currentTime(opts.start);
		if (opts.pauseOnLoop){
			player.pause();
		}
		//invoke callback if set
		if (isFunction(plugin.onLoopCallBack)){
			plugin.onLoopCallBack(plugin,opts,player);
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
	var getOptions = function(){
		return opts;
	}

	//functions to expose as API 
	api.validateOptions = validateOptions;
	api.resetToInitialOptions = setOptionsToInitialOptions;
	api.setOptions = setOptions;
	api.getOptions = getOptions;
	api.goToStart = goToStartOfLoop;
	api.goToEnd = goToEndOfLoop;	
	api.setStart = setStartOfLoop;
	api.setEnd = setEndOfLoop;
	api.enable = enableLoop;
	api.disable = disableLoop;
	api.toggle = toggleLoop;
	
	//sample callback function - called when the loop happens
	plugin.onLoopCallBack = function(plugin,opts,player){
		//console.log("Looping back to " + opts.start);
	}
			
	//main logic
	var checkABLoop = function(e){
		if (!opts.enabled){return false;}
		var curTime = player.currentTime();
		if (opts.end === false){opts.end=player.duration();}
		validateOptions();
		
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
