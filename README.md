This is a plugin for video.js.

It provides an A/B loop function, allowing a section of a video to be looped over repeatedly.

Sample usage
============

```html
<!DOCTYPE html>
<html>
<head>
  <link href="http://vjs.zencdn.net/5.6.0/video-js.css" rel="stylesheet">
</head>

<body>
  <video id="video" class="video-js" controls preload="auto" width="640" height="264" data-setup="{}">
    <source src="video.mp4" type='video/mp4'>
  </video>

  <script src="http://vjs.zencdn.net/5.6.0/video.js"></script>
  <script src="videoJsABLoopPlugin.js"></script>
  
  <script>
	
	var video = videojs("video",{
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
	
	abLoop.onLoopCallBack = function(plugin,opts,player){
		console.log("Looping video" );
		opts.pauseOnLoop = true;     //this should make the video pause at the beginning of the subsequent loop
	};
	
	setTimeout(function() {	
		console.log("setting new start and end...");
		video.abLoopPlugin.api.setStart().setEnd(10).enable();
	} , 5000);
	
  </script>
  
</body>
</html>
```
