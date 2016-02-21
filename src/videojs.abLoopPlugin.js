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

        var defaultOptions = {
            start:0    //seconds
            ,end:false //leave out or set to false to loop to end of video
            ,enabled:false
            ,moveToStartIfBeforeStart:true      //allow video to play normally before the loop section?
            ,moveToStartIfAfterEnd:true
            ,pauseOnLoop: false     //if true, after looping video will pause
            ,createButtons: true
        };

        var defaultInitialOptions = function(){
            initialOptions = initialOptions || {};
            for (var opt in defaultOptions){
                if (initialOptions[opt] === undefined){
                    initialOptions[opt] = defaultOptions[opt];
                }
            }
        };

        var player = this;

        //contains options, allowing them to be set at runtime
        var opts = {};

        //utility functions
        var isNumber = function (n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        };
        var isFunction = function(functionToCheck) {
            var getType = {};
            return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
        };

        //used for validation and setting of boolean options
        var booleanOptions = ['moveToStartIfBeforeStart','moveToStartIfAfterEnd','enabled','pauseOnLoop'];
        var callbacks = ['onLoopCallBack','onOptionsChange'];
        var numericOptions = ['start','end'];

        //check that the options make sense. This is called on timeupdate, before the main logic.
        //so nonsense options will persist as long as time does not update
        var validateOptions = function(){

            opts.start = validateStart(opts.start);
            opts.end = validateEnd(opts.end);

            //clean up booleans, forcing them to be actual booleans
            booleanOptions.forEach(function(optName){
                opts[optName] = opts[optName] ? true : false;
            });

            return api;
        };
        var validateStart = function(s){
            if (s===false){return s;}
            if (isNumber(s) && s>= 0){return s;}
            return 0;
        };
        var validateEnd = function(x){
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
        };


        var setOptionsToInitialOptions = function(){
            return setOptions(initialOptions,true);
        };

        var setOptions = function(newOptions,replaceAll){

            var setOpt = function(optName){
                if (replaceAll || newOptions[optName]){
                    opts[optName] = newOptions[optName];
                }
            };

            booleanOptions.forEach(setOpt);
            numericOptions.forEach(setOpt);

            validateOptions();
            return api;
        };

        //this sets the player to the start of the loop
        var goToStartOfLoop = function(){

            player.currentTime(opts.start);
            if (opts.pauseOnLoop){
                player.pause();
            }
            //invoke callback if set
            if (isFunction(api.onLoopCallBack)){
                api.onLoopCallBack(api,player);
            }
            return api;
        };

        var goToEndOfLoop = function(){
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
        var enableLoop = function(){
            opts.enabled = true;
            return api;
        };
        var toggleLoop = function(){
            opts.enabled = !opts.enabled;
            return api;
        };
        var disableLoop = function(){
            opts.enabled = false;
            return api;
        };
        var togglePauseOnLoop = function(){
            opts.pauseOnLoop = !opts.pauseOnLoop;
            return api;
        };
        var getOptions = function(){
            var o = JSON.parse(JSON.stringify(opts));
            return o;
        };
        //used to add notification to a function call
        //changed is an object of properties which have changed
        //e.g. {'start':true, 'end':false}
        var notify = function(funcToRun,changed){
            var defValue = changed ? false : true;        //if changed not specified, assume they all have
            changed = changed || {};

            //set defaults for changed
            var df = function(o){changed[o] = !!changed[o] || defValue;};
            booleanOptions.forEach(df);
            ['start','end'].forEach(df);

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

        var updateButtonText = function(changed){
            //update button displays if not already done

            ['start','end','enabled','pauseOnLoop'].forEach(function(n){
                if (changed === undefined || changed[n]){
                    if (n=='pauseOnLoop'){n='enabled';}
                    if (buttons[n] && buttons[n].updateText){
                        buttons[n].updateText();
                    }
                }
            });
        };

        //check if we need to go to start of loop
        var checkABLoop = function(e){
            var curTime,endTime,startTime;
            if (!opts.enabled){return false;}   //don't check if not enabled
            if (player.paused()){return false;}   //don't check if paused

            validateOptions();
            curTime = player.currentTime();
            endTime = (opts.end === false) ? player.duration() : opts.end;
            startTime = (opts.start === false) ? 0 : opts.start;

            if (startTime === endTime){
                player.pause();                //to save contant looping behaviour
            } else if (startTime > endTime){
                return false;
            } else if (curTime < startTime && opts.moveToStartIfBeforeStart){
                goToStartOfLoop();
            } else if (curTime >= endTime){
                //use a margin of one just in case time has skipped a bit past
                if ((curTime - endTime) < 1 || opts.moveToStartIfAfterEnd){
                    goToStartOfLoop();
                }
            }
        };

        var formatTimeWithMS = function(seconds){
            return videojs.formatTime(seconds) + '.' + ((seconds % 1) * 10).toFixed(0);
        };

        var buttonSpecs = [
             {
                'name':'start'
                ,'leftclick':function(api){api.setStart();}
                ,'rightclick':function(api){api.goToStart();}
                ,'defaultText':'Start'
                ,'textFunction':function(opts){return formatTimeWithMS(opts.start);}
            },
            {
                'name':'end'
                ,'leftclick':function(api){api.setEnd();}
                ,'rightclick':function(api){api.goToEnd();}
                ,'defaultText':'End'
                ,'textFunction':function(opts){return formatTimeWithMS(opts.end);}
            },
            {
                'name':'enabled'
                ,'leftclick':function(api){api.toggle();}
                ,'rightclick':function(api){api.togglePauseOnLoop();}
                ,'defaultText':'Loop'
                ,'textFunction':function(opts){
                    return opts.enabled ? (opts.pauseOnLoop ?  'LOOP&\nPAUSE': 'LOOP ON' )  : 'Loop\noff';
                }
            }
        ];

        var createButton = function(spec,player){
            console.log("creating button");
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
            b.addClass('abLoopButton');
            b.addClass(spec.name);
            b.updateText();    //set the initial text
            return b;
        };

        var buttons = {};
        //create the buttons based on the specs
        var createButtons = function(specs){
            specs.forEach(function(spec){
                if (buttons[spec.name] === undefined){
                    buttons[spec.name] = createButton( spec, player);
                }
            });
        };
        //functions etc to expose as API
        var api = {
            validateOptions:notify(validateOptions),
            resetToInitialOptions: notify(setOptionsToInitialOptions),
            setOptions:  notify(setOptions),
            getOptions: getOptions,
            goToStart: goToStartOfLoop,
            goToEnd: goToEndOfLoop,
            setStart: notify(setStartOfLoop,{'start':true}),
            setEnd:  notify(setEndOfLoop,{'end':true}),
            enable:  notify(enableLoop,{'enabled':true}),
            disable:  notify(disableLoop,{'enabled':true}),
            toggle: notify(toggleLoop,{'enabled':true}),
            togglePauseOnLoop: notify(togglePauseOnLoop,{'pauseOnLoop':true}),
            player: player,
            version: version,
        };

        //set up the plugin
        var setup = function(){
            defaultInitialOptions();

            //assign bound copies of the callbacks
            callbacks.forEach(function(cb){
                if (isFunction(initialOptions[cb])){
                    api[cb] = initialOptions[cb].bind(api);
                }
            });

            //create buttons once the player is ready
            if (initialOptions.createButtons){
                player.ready(function(){createButtons(buttonSpecs);});
            }

            //set options to initial options and notify of change
            notify(setOptionsToInitialOptions)();

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
    };

    abLoopPlugin.loaded  = false;
    abLoopPlugin.VERSION = version;
    videojs.plugin('abLoopPlugin', abLoopPlugin);

});
