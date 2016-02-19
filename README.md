This is a plugin for video.js.

It provides an A/B loop function, allowing a section of a video to be looped over repeatedly.

Interface
---------

There is no user interface, just an API. 

Assuming ```video``` references a videojs instance 
* Look at ```video.abLoopPlugin``` for functions to call to control the loop.
* Alternatively options can be set and read at ```video.abLoopPlugin.options```. You could save settings by writing this as JSON or whatever.
* An onLoop callback can be set at ```video.abLoopPlugin.onLoopCallBack```, as in the example below.

You could use the existing hotkeys plugin to make keyboard controls.

Sample usage
------------

See index.html in the samples folder for a working example. 

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

video.abLoopPlugin.onLoopCallBack = function(opts,pluginapi,player){
	console.log("Looping back to %s sec on %s",opts.start, player.currentSrc() );
	opts.pauseOnLoop = true; 
	opts.start;
	opts.end = 15;
};
```

TODO
----

* Add sample hotkeys extension code to control the loop
* Replace callback with event emission
* Add control bar buttons as user interface?
