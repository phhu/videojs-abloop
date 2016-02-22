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

Assuming ```video``` references a videojs player instance:
* Look at ```video.abLoopPlugin``` for functions to call to control the loop.
* The API methods can be chained together like this: ```video.abLoopPlugin.setStart().setEnd(8).goToStart().enable();```
* ```setStart``` and ```setEnd``` will set the start and end positions to the current video position if called with no parameter.
* Options can be set  with ```video.abLoopPlugin.setOptions({'optionname':value})``` 
* Options can be read with ```video.abLoopPlugin.getOptions()``` or to return some options ```video.abLoopPlugin.getOptions(["start","end"])```.
  * You could save settings by writing this as JSON or whatever (see in samples folder for a crude example).
* An onLoop callback can be set at ```video.abLoopPlugin.onLoopCallBack``` or in the setup options (see example below).
* An onOptionsChange callback can be set at ```video.abLoopPlugin.onOptionsChange``` or in the setup options. This is useful if you implement your own interface.

Keyboard
--------

You could use the existing hotkeys plugin to make keyboard controls. See the samples directory for an example.

Sample usage
============

See the samples folder for working examples. 

Include the script:

```html
<script src="../src/videojs.abLoopPlugin.js"></script>
```

You initialise the plugin with defaults, and then can set properties at runtime.

```javascript

//initialise the video with the plugin and initial settings
var video = videojs("videoid",{
	plugins: {
		abLoopPlugin: {
			start:50    	//in seconds - defaults to 0
			,end:55    	//in seconds. Set to  false to loop to end of video. Defaults to false
			,enabled:false			//defaults to false
			,moveToStartIfBeforeStart:false //allow video to play normally before the loop section? defaults to true
			,moveToStartIfAfterEnd:true	// defaults to true
			,pauseOnLoop: false     	//if true, after looping video will pause. Defaults to false
			,createButtons: true		//defaults to true
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
	api.setStart(5);
	api.setEnd(15);
};
```

TODO
----

* Replace callback with event emission
* Check compatibility with older browsers
* Write tests
