This is a plugin for video.js.

It provides an A/B loop function, allowing a section of a video to be looped over repeatedly.

The settings can be changed dynamically, either programmatically or via a user interface.

Interface
=========

GUI
---

Buttons are created on the control bar to set start and end times for the loop, and to enable and disable looping.

![GUI screeshot](/images/interfaceScreenshot.png "GUI screeshot")

You can right click on the start and end buttons to skip to the start and end positions. If you right click on the loop
button you can enable /disable pausing after looping.  

You can set the buttons not to create using the ```createButtons``` setup option.

API
---

Assuming ```video``` references a videojs instance 
* Look at ```video.abLoopPlugin``` for functions to call to control the loop.
* Options can be set and read with ```video.abLoopPlugin.setOptions({'optionname':value})``` and ```video.abLoopPlugin.getOptions()```. You could save settings by writing this as JSON or whatever.
* An onLoop callback can be set at ```video.abLoopPlugin.onLoopCallBack```, as in the example below.

Keyboard
--------

You could use the existing hotkeys plugin to make keyboard controls. See the samples directory for an example.

Sample usage
============

See the samples folder for working examples. 

You initialise the plugin with defaults, and then can set properties at runtime.

The API methods can be chained together like this: ```video.abLoopPlugin.setStart().setEnd(8).enable();```

```setStart``` and ```setEnd``` will set the start and end positions to the current video position if called with no parameter.

```javascript

//initialise the video with the plugin and initial settings
var video = videojs("videoid",{
	plugins: {
		abLoopPlugin: {
			start:50    //seconds
			,end:55    //leave out or set to false to loop to end of video
			,enabled:false
			,moveToStartIfBeforeStart:false       //allow video to play normally before the loop section?
			,moveToStartIfAfterEnd:true
			,pauseOnLoop: false     //if true, after looping video will pause
		}
	}
});

video.play();

setTimeout(function() { 
	console.log("setting new start and end...");
	video.abLoopPlugin.setStart().setEnd(8).enable();
} , 2000);

video.abLoopPlugin.onLoopCallBack = function(api,player){
	var opts = api.getOptions();
	console.log("Looping back to %s sec on %s",opts.start, player.currentSrc() );
	api.setOptions({'pauseOnLoop': true}); 
	this.setStart(5);
	api.setEnd(15);
};
```

TODO
----

* Replace callback with event emission
* Check compatibility with older browsers
* Write tests
