This is a plugin for video.js (http://videojs.com/)

It provides an A/B loop function, allowing a section of a video to be looped over repeatedly.

The settings can be changed dynamically, either programmatically or via a user interface.

Example
=======

See https://unpkg.com/videojs-abloop/sample/basic.html

```html
<html>
	<head>
		<script src="https://vjs.zencdn.net/5.6.0/video.js"></script>
		<link href="https://vjs.zencdn.net/5.6.0/video-js.css" rel="stylesheet" /> 
		<script src="https://unpkg.com/videojs-abloop/dist/videojs-abloop.min.js"></script>		
	</head>
	<body>
		<video id="vid" controls class="video-js"  >
			<source src="https://vjs.zencdn.net/v/oceans.mp4" type='video/mp4'>
		</video>	
		<script>	
			var video = videojs("vid",{
				plugins: {
					abLoopPlugin: {}
				}
			});
			video.ready(function(){
				this.abLoopPlugin.setStart(10).setEnd(15).playLoop();
			});
		</script>
	</body>
</html>
```

Example from node:

```
npm install video.js videojs-abloop
```

```js
//import videojs from 'video.js'
//import abLoopPlugin from 'videojs-abloop'

const videojs = require('video.js');
const abLoopPlugin = require('videojs-abloop');

abLoopPlugin(window,videojs);

const player = videojs('vid',{     //vid is the video element id
  plugins: {
    abLoopPlugin: {
      'start':3
    }
  }
});
player.abLoopPlugin.setEnd(6.5).playLoop();
```

Interface
=========

GUI
---

Buttons are created on the right hand side of the control bar to set start and end times for the loop, and to enable and disable looping.

![GUI screeshot](/images/interfaceScreenshot.png "GUI screeshot")

* Start and end buttons (3rd and 2nd from right, showing times):
    * Left click: set start/end time to current video position. 
    * Right click: skip the video to start/end position. 
    * Shift + left / right click: move start / end position back / forward (by 0.5s)
    * Ctrl  + left / right click: move start / end position back / forward (by 0.05s)

* Loop button (rightmost button):
    * Left click: enable / disable looping. 
    * right click: cycle settings for pausing automatically before or after looping.  
    * Shift + left/right click: set/extract URL fragment for current loop settings
    * Ctrl + left/right click: set/extract full URL for video with current loop settings
    * Alt + left/right click: set/extract relative URL for video with current loop settings

You can set the buttons not to create using the ```createButtons``` setup option.

API
---

The plugin is controlled by an internal opts object that looks something like this.

```javascript
{
	"start":0,
	"end":10,
	"enabled":false,
	"loopIfBeforeStart":true,
	"loopIfAfterEnd":true,
	"pauseBeforeLooping":false,
	"pauseAfterLooping":false
}
```

These can be set on plugin setup or dynamically via API commands.

Assuming ```video``` references a videojs player instance:
* Look at ```video.abLoopPlugin``` for functions to call to control the loop.
* The API methods can be chained together like this: ```video.abLoopPlugin.setStart().setEnd(8).goToStart().enable();```
* ```setStart``` and ```setEnd``` will set the start and end positions to the current video position if called with no parameter.
* Options can be set  with ```video.abLoopPlugin.setOptions({'optionname':value})``` 
* Options can be read with ```video.abLoopPlugin.getOptions()``` or to return some options ```video.abLoopPlugin.getOptions(["start","end"])```.
  * You could save settings by writing this as JSON or whatever (see in samples folder for a crude example).
* An onLoop callback can be set at ```video.abLoopPlugin.onLoopCallBack``` or in the setup options (see example below).
* An onOptionsChange callback can be set at ```video.abLoopPlugin.onOptionsChange``` or in the setup options. This is useful if you implement your own interface.
* You can also get and apply URL fragments to represent the looping section. E.g. ```#t=10,15```. 

API commands
------------

| API command |  notes | example |
|-------------|---------|-------|
|setOptions(optionsObject)     | Options not specified will not be set  | setOptions({"start":40,"end":45"}) |
|getOptions(ArrayOfOptionNames?)| Call without an argument to get them all.| getOptions(["start","end"])|
|goToStart()                   | set player currentTime to start time |
|goToEnd()                     ||
|setStart(startTime?)	       | Call startTime() to set the startTime to the player's currentTime | startTime() startTime(30) startTime("0:34:23") |  
|setEnd(endTime?)|   Call endTime() to set the startTime to the player's currentTime
|adjustStart(adjustmentInSec) | adjustStart("1m30s") or adjustStart("1:20:30") also work | adjustStart(-5)
|adjustEnd(adjustmentInSec)| 
|enable()|  enable the plugin.
|disable()| 
|toggle()| change enabled status
|togglePauseAfterLooping()| ||
|togglePauseBeforeLooping()| ||
|cyclePauseOnLooping()| cycle between four different compinations of settings for pausing on looping
|validateOptions()| set options to valid values if they are not already. This is called every time the loop condition is checked anyway, but you might want to use it manually if setting options while the player is paused or the plugin disabled
|resetToInitialOptions() | reset options to the ones provided on setup
|playLoop()|  for convenience, plays the loop from its start. Equivalent to abLoopPlugin.validateOptions().goToStart().enable().player.play()
|player| reference to parent player object. e.g. video.abLoopPlugin.enable().player.play()
|version| version number
|getAbsoluteUrl()| gets the full URL of the loop - e.g. http://domain.com/path/to/video.mp4#t=12,13
|getUrl()| gets the URL of the loop - e.g. path/to/video.mp4#t=12,13
|getUrlFragment() | gets the loop URL fragment - e.g. #t=12,13
|applyUrl(url)  | Set the video source and apply loop start and end as per the t=start,end fragment | applyUrl('http://path/to/video.mp4#t=12,13')|
|applyUrlFragment(urlFragment)  | As above, but only sets the loop start and end from the URL hash fragment | applyUrlFragment('#t=12,13')  applyUrlFragment('http://path/ignored.mp4#t=12,13')
|loopRequired()|  returns true or false depending on whether the loop would be activated in the current state. |

Keyboard
--------

You could use the existing [hotkeys plugin](https://github.com/ctd1500/videojs-hotkeys) to make keyboard controls. See the samples directory for an example.

Sample usage
============

See the samples folder for working examples. 

Include the script:

```html
<script src="videojs-abloop.js"></script>
```
Alternatively source it from unpkg.com:
```html
<script src="https://unpkg.com/videojs-abloop/dist/videojs-abloop.min.js">
```
Or use in node.js:

```npm install video.js videojs-abloop```

```js
import videojs from 'video.js'    
import abLoopPlugin from 'videojs-abloop'

abLoopPlugin(window,videojs);
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
			,loopIfBeforeStart:false //allow video to play normally before the loop section? defaults to true
			,loopIfAfterEnd:true	// defaults to true
			,pauseAfterLooping: false     	//if true, after looping video will pause. Defaults to false
			,pauseBeforeLooping: false     	//if true, before looping video will pause. Defaults to false
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
	api.setOptions({'pauseAfterLooping': true}); 
	api.setStart(5);
	api.setEnd(15);
};
```
