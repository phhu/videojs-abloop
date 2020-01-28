// check that geckodriver in path is up to date, otherwise you might get web driver errors 
// also need to have video muted in the html

var selenium = require('selenium-webdriver');
//var chrome = require('selenium-webdriver/chrome');
var firefox = require('selenium-webdriver/firefox');
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;
var should = chai.should();
var static = require('node-static');
var http = require('http');
var port = 8081;

const errorHandler = e=>console.error(e);

//create a static server to serve out the samples 

var fileServer = new static.Server('.'); 
var httpServer = http.createServer(function (request, response) {
    request.addListener('end', function () {
        fileServer.serve(request, response);
    }).resume();
}).listen(port);
httpServer = require('http-shutdown')(httpServer);


describe('videojs-abloop', function() {

    var driver;

    //Open website and wait until abloop plugin loaded
    before(function(done) {
        this.timeout(30000);
        var url = 'http://localhost:' + port + '/sample';
        let options = new firefox.Options();
        
        console.log("Attempting to open ", url);
        //console.log(JSON.stringify(options,null,2));    
        this.driver = new selenium.Builder()
            .forBrowser('firefox')    
            .setFirefoxOptions(options)
            .build();
        driver = this.driver;   // reference in parent closure
        driver.get(url)
            .then(driver.wait(function () {
                console.log("attempting to execute script to check if videojs and plugin loaded");
                return driver.executeScript(
                    `return videos[0] != undefined && 
                        videos[0].abLoopPlugin != undefined && 
                        videos[0].abLoopPlugin.loaded
                    ;`
                );
            }, 8000))
            .then(function(){done()})
            .catch(errorHandler)
            ;
    });
    beforeEach(function(done) {
        done();
        //this.timeout(15000);  
    });

    // Close the website after each test is run (so that it is opened fresh each time)
    after(function(done) {
        console.log("Shutting down server");
        //httpServer.shutdown(function(){console.log("shut down http server");});
        driver
            .quit()
            .then(function(){done()})
            .catch(errorHandler)
            ;
    });

    it('Should be enablable', function() {
        return driver.executeScript(
            "return videos[0].abLoopPlugin.enable().getOptions().enabled;"
        ).should.eventually.equal(true);
    });

    it('Should go to start', function() {
        return driver.executeScript("return videos[0].abLoopPlugin.setStart(5).goToStart().player.currentTime();")
            .should.eventually.equal(5);
    });

    it('Should go to end', function() {
        return driver.executeScript("return videos[0].abLoopPlugin.setEnd(7).goToEnd().player.currentTime();")
            .should.eventually.equal(7);
    });

    it('Should apply URL fragments', function(done) {
        driver.executeScript("return videos[0].abLoopPlugin.applyUrlFragment('#t=2,0:00:03').getOptions();")
            .then(function(opts){ 
                expect(opts.start).to.equal(2);
                expect(opts.end).to.equal(3);
                done();
            })
            .catch(errorHandler)
        ;
    });

    it('Should return URL fragments', function() {
        return driver.executeScript("return videos[1].abLoopPlugin.setStart(1).setEnd(\"0m4s\").getUrlFragment();")
            .should.eventually.equal('#t=1,4');
    });
    it('Should report loaded false when no video supplied', function() {
        return driver.executeScript("return videos[2].abLoopPlugin.loaded;")
            .should.eventually.equal(false);
    });
    /*it('Should report duration zero when no video supplied', function() {
        return driver.executeScript("return videos[2].player().duration();")
            .should.eventually.equal(0);
    });*/
    it('Should allow pausing before looping', function(done) {
        this.timeout(8000); 
        driver.executeScript("return videos[1].abLoopPlugin.setOptions({'pauseBeforeLooping':true,'start':5,'end':7,'enabled':true}).goToStart().getOptions();")
            .then(function(opts){
                console.log(opts);
                expect(opts.start).to.equal(5);
                expect(opts.end).to.equal(7);
                expect(opts.enabled).to.equal(true);
                setTimeout(function(){ 
                    driver.executeScript("videos[1].play();return videos[1].paused();")
                        .then(function(paused){
                            expect(paused).to.equal(false);
                            setTimeout(function(){ 
                                driver.executeScript("return {currentTime:videos[1].currentTime(),paused:videos[1].paused(),opts:videos[1].abLoopPlugin.getOptions()};")
                                    .then(function(data){
                                        expect(data.paused).to.equal(true);
                                        expect(data.currentTime).to.be.at.least(7);
                                        expect(data.currentTime).to.be.below(7.5);
                                        done();
                                    })
                                    .catch(errorHandler)
                                ;
                            }, 3000);
                        })
                        .catch(errorHandler)
                    ;
                }, 2000);
            }).catch(errorHandler)
        ;
    }); 
    /*
    it('Should play the first video', (done) => {
        this.timeout(8000); 
        driver.executeScript(
            `return {
                play: videos[0].abLoopPlugin.player.play(),
                opts: videos[0].abLoopPlugin.getOptions()
            };`
        )
        .then(function({play,opts}){
            console.log(opts);
            expect(opts.start).to.equal(5);
            expect(opts.end).to.equal(7);
            expect(opts.enabled).to.equal(true);
            setTimeout(function(){ 
                driver.executeScript("videos[1].play();return videos[1].paused();")
                    .then(function(paused){
                        expect(paused).to.equal(false);
                        setTimeout(function(){ 
                            driver.executeScript("return {currentTime:videos[1].currentTime(),paused:videos[1].paused(),opts:videos[1].abLoopPlugin.getOptions()};")
                                .then(function(data){
                                    expect(data.paused).to.equal(true);
                                    expect(data.currentTime).to.be.at.least(7);
                                    expect(data.currentTime).to.be.below(7.5);
                                    done();
                                })
                                .catch(errorHandler)
                            ;
                        }, 3000);
                    })
                    .catch(errorHandler)
                ;
            }, 2000);
        }).catch(errorHandler)
        ;
    }); 
    //*/
});
