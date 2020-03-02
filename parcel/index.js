import videojs from 'video.js'
import abLoopPlugin from './abLoopPlugin'

abLoopPlugin(window,videojs);

const player = videojs('vid',{
  plugins: {
    abLoopPlugin: {}
  }
});
player.abLoopPlugin.setStart(5).setEnd(6.5).playLoop();

// for convenience when testing
window.player = player;  
window.videojs = videojs;

// Some plugins either auto-detect the videoJS instance
// or have the instance passed as a parameter

//abLoopPlugin(videojs, { configOptions })