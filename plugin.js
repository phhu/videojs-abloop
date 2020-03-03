// this file used to build the file for distribution 
// and so use directly in the browser

// videojs is an external dependency - see package.json
//import videojs from 'video.js' 
import abLoopPlugin from './videojs-abloop'   

abLoopPlugin(window,videojs);
