/*
 * Video.js AB loop plugin
 * Adds function to allow looping for a section of a video in video.js player
 *
 */

;(function(root, factory) {
  "use strict";
  if (typeof define === 'function' && define.amd) {
    define([], factory.bind(this, root, root.videojs));
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(root, root.videojs);
  } else {
    factory(root, root.videojs);
  }
})(window, function(window, videojs) {
    "use strict";

    var version = "0.3.1";
    var abLoopPlugin = function (initialOptions) {

        //get reference to player
        var player = this;

        //utility functions
        var isNumber = function (n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        };
        var isFunction = function(functionToCheck) {
            var getType = {};
            return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
        };
        var toBoolean = function(x){return !!x;};
        var cloneAndPluck = function(sourceObject, keys) {
            var newObject = {};
            keys.forEach(function(key) {
                if(sourceObject[key] !== undefined){
                    newObject[key] = sourceObject[key];
                }
            });
            return newObject;
        };
        var formatTimeWithMS = function(seconds){
            return videojs.formatTime(seconds) + '.' + Math.floor((seconds % 1) * 10);
        };
        var parseTimeStamp = function(timestamp){
            //if a plain number ,assume seconds
			if (/^([\d\.]+)$/i.test(timestamp)){return parseFloat(timestamp);}
			//this assumes a plain whole number is minutes
            var res = /^((([\d]+)(h|:(?=.*:)))?(([\d]+)(m|:|$))?)?(([\d\.]+)s?)?$/i.exec(timestamp);
			var d = {
				match: res[0],
				hours: res[3] || 0,
				mins: res[6] || 0,
				secs: res[9] || 0,
			};
            //console.log(d);
            return parseFloat(d.hours) * 60 * 60 + parseFloat(d.mins) * 60 + parseFloat(d.secs);
        }
        
        //contains options, allowing them to be set at runtime
        var opts = {};

        var optionSpecs = {
            'start':{
                "default":0
                ,"validate": function(x){
                    if (x===false){return x;}
                    if (isNumber(x) && x>= 0){return x;}
                    return 0;
                }
            }
            ,'end':{
                "default":false
                ,"validate":function(x){
                    if (x===false){return x;}
                    if (isNumber(x)){
                        var duration = player.duration();
                        if (duration === undefined || duration === 0){
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
            }
            ,'enabled':{
                "default":false
                ,"validate":toBoolean
            }
            ,'moveToStartIfBeforeStart':{
                "default":true
                ,"validate":toBoolean
            }
            ,'moveToStartIfAfterEnd':{
                "default":true
                ,"validate":toBoolean
            }
            ,'pauseBeforeLoop':{
                "default":false
                ,"validate":toBoolean
            }
            ,'pauseAfterLoop':{
                "default":false
                ,"validate":toBoolean
            }
            ,'createButtons':{
                "default":true
                ,"validate":toBoolean
            }
        };

        //callbacks can be included in initial options, but are not treated as options
        //check is used to check that the callbacks are valid, but not to replace their values
        var callBackSpecs = {
            'onLoopCallBack':{
                "default":undefined
                ,"check":isFunction
            }
            ,'onOptionsChange':{
                "default":undefined
                ,"check":isFunction
            }
        };

        //for convenience
        var optionNames = Object.keys(optionSpecs);
        var callBackNames = Object.keys(callBackSpecs);

        //set initial option values to defaults if they are not specified
        var defaultInitialOptions = function(){
            initialOptions = initialOptions || {};

            var setToDefault = function(specs){
                return function(name){
                    if (initialOptions[name] === undefined){
                        initialOptions[name] = specs[name].default;
                    }
                };
            };
            optionNames.forEach(setToDefault(optionSpecs));
            callBackNames.forEach(setToDefault(callBackSpecs));
        };

        var setCallBacksToInitialOptions = function(){

            //assign bound copies of the callbacks to the api
            callBackNames.forEach(function(callBackName){
                if (callBackSpecs[callBackName].check(initialOptions[callBackName])){
                    api[callBackName] = initialOptions[callBackName].bind(api);
                }
            });
        };

        //check that the options make sense. This is called on timeupdate, before the main logic.
        //so nonsense options will persist as long as time does not update
        var validateOptions = function(){
            optionNames.forEach(function(optName){
                opts[optName] = optionSpecs[optName].validate(opts[optName]);
            });
            return api;
        };

        var setOptionsToInitialOptions = function(){
            return setOptions(initialOptions,true);
        };

        var setOptions = function(newOptions,replaceAll){

            optionNames.forEach(function(optName){
                if (replaceAll || newOptions[optName] !== undefined){
                    opts[optName] = newOptions[optName];
                }
            });

            validateOptions();
            return api;
        };

        var alreadyPausedBeforeLoop = false;   
        //this sets the player to the start of the loop
        var goToStartOfLoop = function(checkPause){

            if (checkPause){
                if (opts.pauseBeforeLoop && alreadyPausedBeforeLoop === false){
                    player.pause();
                    alreadyPausedBeforeLoop = true;
                } else {
                    alreadyPausedBeforeLoop = false;

                    //do loop
                    player.currentTime(opts.start);
                    //invoke callback if set
                    if (callBackSpecs.onLoopCallBack.check(api.onLoopCallBack)){
                        api.onLoopCallBack(api,player);
                    }
                    if (opts.pauseAfterLoop){
                        player.pause();
                    }

                }
            } else {
                alreadyPausedBeforeLoop = false;
                player.currentTime(opts.start);
            }
            return api;
        };

        var goToEndOfLoop = function(){
            alreadyPausedBeforeLoop = false;
            player.currentTime(opts.end);
            return api;
        };
        var setStartOfLoop = function(time){
            time = (time === undefined) ? player.currentTime() : time;
            opts.start = time;
            return api;
        };
        var setEndOfLoop = function(time){
            time = (time === undefined) ? player.currentTime() : time;
            opts.end = time;
            return api;
        };
        var adjustEndOfLoop = function(adjustment){
            if (isNumber(adjustment)){
                opts.end += adjustment;
            }
            return api;
        };
        var adjustStartOfLoop = function(adjustment){
            if (isNumber(adjustment)){
                opts.start += adjustment;
            }
            return api;
        };
        var enableLoop = function(){
            opts.enabled = true;
            return api;
        };
        var disableLoop = function(){
            opts.enabled = false;
            return api;
        };
        var cyclePauseOnLoopStatus = function(){
            var after = opts.pauseAfterLoop, before = opts.pauseBeforeLoop;
            if (!after && !before){
                setOptions({pauseAfterLoop:true,pauseBeforeLoop:false});
            } else if (after && !before){
                setOptions({pauseAfterLoop:false,pauseBeforeLoop:true});
            } else if (!after && before){
                setOptions({pauseAfterLoop:true,pauseBeforeLoop:true});
            } else {
                setOptions({pauseAfterLoop:false,pauseBeforeLoop:false});
            }
        };

        //return a function to toggle an option
        var toggler = function(optName){
            return function(){
                opts[optName] = !opts[optName];
                return api;
            };
        };

        //get a URL with a hash to identify the looping section
        var getUrl = function(spec){
            spec = spec || {};
            validateOptions();
            var src = player.currentSrc();
            var url = videojs.parseUrl(src);
            var start = (opts.start !== false) ? parseFloat(opts.start) : 0;
            url.hash = '#' + 't=' + start;
            if(opts.end !==false){
                var end = parseFloat(opts.end);
                url.hash += (',' + end);
            }
            if (spec.returnParsed){
                return url;
            } else {
                return src.replace(/#[^#]*$/,'') + url.hash;
            }
        };
        
        //apply a url, typically with a hash to identify a section to loop
        var setUrl = function(spec){
            if (typeof spec === 'string'){spec = {urlString: spec}}
            spec = spec || {urlString: spec};
            spec.overwriteSrc = spec.overwriteSrc || false;
            //spec.play = spec.play || false;
            spec.urlString = spec.urlString || undefined;
            spec.urlObject = spec.urlObject || undefined;
            
            var url = spec.urlObject || videojs.parseUrl(spec.urlString);
            var hash = url.hash;
            var start = hash.replace(/^#t=([^,]*)(,.*)?$/,'$1');
            var end = hash.replace(/^#t=([^,]*)(,([\d\.]+))?$/,'$3');
           // console.log("end:",end);
            opts.start = isNumber(start) ? parseFloat(start): false;
            opts.end  = isNumber(end) ? parseFloat(end) : false;
            //if (isNumber(start)){opts.enabled = true;}
            
            if(spec.overwriteSrc){
                var curSrc = player.currentSrc();
                if (curSrc !== spec.urlString){
                    var newSrc = spec.urlString.replace(/#.*$/,'');
                    player.src(newSrc);
                    //console.log("replacing URL " + curSrc + " with " + newSrc);
                    //console.log("currentSrc now: " + player.currentSrc());
                }
            }
            //if(spec.play){goToStartOfLoop();player.play();}
            
            
            return api;
                            
        };

        
        var getOptions = function(optionsToReturn){

            var retOpts = optionsToReturn;

            //coerce retOpts into an Array
            if( typeof optionsToReturn === 'string' ) {
                retOpts= [optionsToReturn];
            } else if (optionsToReturn === undefined || !Array.isArray(optionsToReturn)){
                if (optionsToReturn !== null && typeof optionsToReturn === 'object'){
                    //allow specification with an object`
                    retOpts = Object.keys(optionsToReturn);
                } else {
                    //return all options if none are specified
                    retOpts = Object.keys(optionSpecs);
                }
            }

            return cloneAndPluck(opts,retOpts);

        };

        //used to add notification to a function call
        //changed is an object of properties which have changed
        //e.g. {'start':true, 'end':false}
        var notify = function(funcToRun,changed){
            var defValue = changed ? false : true;    //if changed not specified, assume they all have
            changed = changed || {};

            //set defaults for changed
            optionNames.forEach(function(optName){
                changed[optName] = !!changed[optName] || defValue;
            });

            return function(){
                var args = arguments;
                var oldOpts = getOptions();  //copy options as were
                var ret = funcToRun.apply(null,args);
                var optionDetails = {
                    'changed':changed
                    ,'oldOpts':oldOpts
                    ,'newOpts':getOptions()
                };
                if (api.onOptionsChange){
                    api.onOptionsChange(optionDetails,api,player);
                }
                updateButtonText(changed);   //API might have changed settings, so update the buttons
                return ret;
            };
        };

        //check if we need to go to start of loop
        var endLoopRequired = false;
        
        var checkABLoop = function(e){
            var curTime,endTime,startTime, duration;
            if (!opts.enabled){return false;}   //don't check if not enabled
            if (player.paused()){return false;}   //don't check if paused

            validateOptions();
            curTime = player.currentTime();
            duration = player.duration();
            endTime = (opts.end === false) ? duration : opts.end;
            startTime = (opts.start === false) ? 0 : opts.start;
   
            endLoopRequired = false;
            if (startTime === endTime){
                player.pause();                //to save contant looping behaviour
            } else if (startTime > endTime){
                endLoopRequired = true;
                //if the end is before the start, deal with it
                if (curTime < startTime && curTime > endTime && ((curTime - endTime) < 1 || opts.moveToStartIfAfterEnd ||opts.moveToStartIfBeforeStart)){
                    goToStartOfLoop(true);
                }
            } else if (curTime < startTime && opts.moveToStartIfBeforeStart){
                goToStartOfLoop(true);
            } else if (curTime >= endTime){
                //use a margin of one just in case time has skipped a bit past
                if ((curTime - endTime) < 1 || opts.moveToStartIfAfterEnd){
                    goToStartOfLoop(true);
                }
            }

            //return false;
        };

        // BUTTON THINGS
        var buttons = {};    //holds references to the button objects
        var buttonSpecs = [
             {
                'name':'start'
                ,'optionsUsed':['start']
                ,'leftclick':function(api){api.setStart();}
                ,'rightclick':function(api){api.goToStart();}
                ,'defaultText':'Start'
                ,'textFunction':function(opts){return formatTimeWithMS(opts.start);}
            }
            ,{
                'name':'end'
                ,'optionsUsed':['end']
                ,'leftclick':function(api){api.setEnd();}
                ,'rightclick':function(api){api.goToEnd();}
                ,'defaultText':'End'
                ,'textFunction':function(opts){return formatTimeWithMS(opts.end);}
            }
            ,{
                'name':'enabled'
                ,'optionsUsed':['enabled','pauseAfterLoop','pauseBeforeLoop']
                ,'leftclick':function(api){api.toggle();}
                ,'rightclick':function(api){api.cyclePauseOnLoopStatus();}
                ,'defaultText':'Loop'
                ,'textFunction':function(opts){
                    if (opts.enabled){
                        if (opts.pauseBeforeLoop && opts.pauseAfterLoop){return 'PAUSE LOOP PAUSE';}
                        if (opts.pauseAfterLoop){return 'LOOP& PAUSE';}
                        if (opts.pauseBeforeLoop){return 'PAUSE &LOOP';}
                        return  'LOOP ON';
                    } else {
                        return  'Loop off';
                    }
                }
            }
        ];

        var createButton = function(spec,player){
            //returns a function which handles button clicks,
            var clickFunction = function(abLoopCall,whichButton){
                return function(event){
                    if (whichButton === undefined || (event.which && event.which == whichButton)) {
                        abLoopCall(player.abLoopPlugin);
                        this.updateText();
                    }
                };
            };

            //returns a function which handles button text updates
            var updateTextFunction = function(defaultText,textFunction){
                return function(){
                    var text = textFunction(opts) || defaultText;
                    var el = this.el();
                    el.textContent = text;
                    //el.innerText = text;    //doesn't work in Firefox
                };
            };

            //create the button
            var b = player.controlBar.addChild('Button');
            if (spec.leftclick){
                b.on('click',clickFunction(spec.leftclick));
            }
            if (spec.rightclick){
                //event which
                //bind the function as it isn't bound by default
                b.el().onmousedown = clickFunction(spec.rightclick,3).bind(b);
                //knock out the context menu
                b.on('contextmenu', function(event) {
                    if(event.preventDefault){event.preventDefault();}
                    if(event.preventDefault){event.stopPropagation();}
                    return false;
                });
            }

            //gets called when text on button needs updating
            b.updateText = updateTextFunction(spec.defaultText,spec.textFunction);
            b.optionsUsed = spec.optionsUsed;
            b.addClass('abLoopButton');
            b.addClass(spec.name);
            b.updateText();    //set the initial text
            return b;
        };

        //create the buttons based on the specs
        var createButtons = function(specs){
            specs.forEach(function(spec){
                 //only create the button if it's not already there
                if (buttons[spec.name] === undefined){
                    buttons[spec.name] = createButton( spec, player);
                }
            });
        };

        //updates button displays if not already done
        var updateButtonText = function(changed){
            var changedReducer = function(acc,optName){ return acc || changed[optName]; };
            for (var buttonName in buttons){
                var b = buttons[buttonName];
                var needsUpdate = !(b.optionsUsed) || b.optionsUsed.reduce(changedReducer,false);
                if (needsUpdate){b.updateText();}
            }
        };

        //functions etc to expose as API
        //those which change values can be passed through the notify function
        var api = {
            validateOptions:notify(validateOptions)
            ,resetToInitialOptions: notify(setOptionsToInitialOptions)
            ,setOptions:  notify(setOptions)
            ,getOptions: getOptions
            ,goToStart: goToStartOfLoop
            ,goToEnd: goToEndOfLoop
            ,setStart: notify(setStartOfLoop,{'start':true})
            ,setEnd:  notify(setEndOfLoop,{'end':true})
            ,adjustStart:  notify(adjustStartOfLoop,{'start':true})
            ,adjustEnd:  notify(adjustEndOfLoop,{'end':true})
            ,enable:  notify(enableLoop,{'enabled':true})
            ,disable:  notify(disableLoop,{'enabled':true})
            ,toggle: notify(toggler('enabled'),{'enabled':true})
            ,togglePauseAfterLoop: notify(toggler('pauseAfterLoop'),{'pauseAfterLoop':true})
            ,togglePauseBeforeLoop: notify(toggler('pauseBeforeLoop'),{'pauseBeforeLoop':true})
            ,cyclePauseOnLoopStatus: notify(cyclePauseOnLoopStatus,{'pauseBeforeLoop':true,'pauseAfterLoop':true})
            ,player: player
            ,version: version
            ,getUrl: getUrl
            ,setUrl: notify(setUrl,{'start':true,'end':true,'enabled':true})
        };

        //set up the plugin
        var setup = function(){

            defaultInitialOptions();

            setCallBacksToInitialOptions();

            //set options to initial options and notify of change
            notify(setOptionsToInitialOptions)();

            //create buttons once the player is ready
            if (initialOptions.createButtons){
                player.ready(function(){
                    createButtons(buttonSpecs);
                    
                    //if start time is greater than end, the video needs to loop on ending
                    player.on('ended',function(){
                        if(endLoopRequired && !player.loop() && opts.enabled){
                            player.play();
                        }
                    });
                    
                });
            }

            //this replaces the reference created to this function on each player object
            //with a reference to the api object (created once per invocation of this function)
            //The functions created in this function and referenced by api will still
            //be available via closure
            player.abLoopPlugin = api;

            //on timeupdate, check if we need to loop
            player.on('timeupdate',checkABLoop);
            api.loaded = true;
        };

        setup();
        return api;
    };

    abLoopPlugin.loaded  = false;
    abLoopPlugin.VERSION = version;
    videojs.plugin('abLoopPlugin', abLoopPlugin);

});
