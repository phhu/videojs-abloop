var selenium = require('selenium-webdriver');
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;
var should = chai.should();
var static = require('node-static');
 
//create a static server to serve out the samples 

var fileServer = new static.Server('.'); 
require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        fileServer.serve(request, response);
    }).resume();
}).listen(8080);


describe('videojs-abloop', function() {

    var driver;

    //Open website and wait until abloop plugin loaded
    before(function(done) {
        this.timeout(30000);

        this.driver = new selenium.Builder().
            withCapabilities(selenium.Capabilities.firefox()).
            build();
        driver = this.driver;
        driver.get('http://localhost:8080/sample')
            .then(driver.wait(function () {
                return driver.executeScript("return videos[0] != undefined && videos[0].abLoopPlugin != undefined && videos[0].abLoopPlugin.loaded;");
            }, 8000))
            .then(done);
    });
    beforeEach(function(done) {
        done();
        //this.timeout(15000);  
    });

    // Close the website after each test is run (so that it is opened fresh each time)
    after(function(done) {
        driver.quit().then(done);
        //done();
    });
    it('Should be enablable', function() {
        return driver.executeScript("return videos[0].abLoopPlugin.enable().getOptions().enabled;").should.eventually.equal(true);
    });
    it('Should go to start', function() {
        return driver.executeScript("return videos[0].abLoopPlugin.setStart(5).goToStart().player.currentTime();").should.eventually.equal(5);
    });
    it('Should go to end', function() {
        return driver.executeScript("return videos[0].abLoopPlugin.setEnd(7).goToEnd().player.currentTime();").should.eventually.equal(7);
    });   
    it('Should apply URL fragments', function(done) {
        driver.executeScript("return videos[0].abLoopPlugin.applyUrlFragment('#t=2,0:00:03').getOptions();").then(function(opts){ 
            expect(opts.start).to.equal(2);
            expect(opts.end).to.equal(3);
            done();
        });
    });
    it('Should return URL fragments', function() {
        return driver.executeScript("return videos[1].abLoopPlugin.setStart(1).setEnd(\"0m4s\").getUrlFragment();").should.eventually.equal('#t=1,4');
    });
    it('Should allow pausing before looping', function(done) {
        this.timeout(8000); 
        driver.executeScript("return videos[1].abLoopPlugin.setOptions({'pauseBeforeLooping':true,'start':5,'end':7,'enabled':true}).goToStart().getOptions();").then(function(opts){
            expect(opts.start).to.equal(5);
            expect(opts.end).to.equal(7);
            expect(opts.enabled).to.equal(true);
            setTimeout(function(){ 
                driver.executeScript("videos[1].play();return videos[1].paused();").then(function(paused){
                    expect(paused).to.equal(false);
                    setTimeout(function(){ 
                        driver.executeScript("return {currentTime:videos[1].currentTime(),paused:videos[1].paused(),opts:videos[1].abLoopPlugin.getOptions()};").then(function(data){
                            expect(data.paused).to.equal(true);
                            expect(data.currentTime).to.be.at.least(7);
                            expect(data.currentTime).to.be.below(7.5);
                            done();
                        })
                    }, 3000);
                })
            }, 2000);
        });
    }); 
    /*it('Should have a body', function(done) {
        this.driver.findElement(selenium.By.tagName('body')).getAttribute('id').then(function(id) {
            expect(id).to.equal('body');
            done();
        });
    });*/    
    
});
