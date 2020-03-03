// example using node etc.
// test with: parcel parcelTest.html

/* videojs is treated as external for testing here with parcel.js
 * (see package.json)
 * but fair chance you want to import it
 */
//import videojs from 'video.js'    
import abLoopPlugin from './videojs-abloop'

abLoopPlugin(window,videojs);

const player = videojs('vid',{     //vid is the video element id
  plugins: {
    abLoopPlugin: {
      'start':3
    }
  }
});
player.abLoopPlugin.setEnd(6.5).playLoop();

// refernces in window, for convenience when testing via devtools
window.player = player;  
window.videojs = videojs;
