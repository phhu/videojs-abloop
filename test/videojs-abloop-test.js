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

    //Open website and check loaded
    before(function(done) {
        this.timeout(15000);

        this.driver = new selenium.Builder().
            withCapabilities(selenium.Capabilities.firefox()).
            build();
        var driver = this.driver;
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
        this.driver.quit().then(done);
        //done();
    });
    it('Should be enablable eventually', function() {
        return this.driver.executeScript("return videos[0].abLoopPlugin.enable().getOptions().enabled;").should.eventually.equal(true);
    });
    it('Should go to start', function() {
        this.driver.executeScript("return videos[0].abLoopPlugin.setStart(5).goToStart().player.currentTime()").should.equal(5);
    });   
    it('Should be enablable', function(done) {
        this.driver.executeScript("return videos[0].abLoopPlugin && videos[0].abLoopPlugin.enable().getOptions();").then(function(opts){ 
            expect(opts.enabled).to.equal(true);
            done();
        });
    });
    it('Should be apply URL fragments', function(done) {
        this.driver.executeScript("return videos[0].abLoopPlugin.applyUrlFragment('#t=2,3').getOptions();").then(function(opts){ 
            expect(opts.start).to.equal(2);
            expect(opts.end).to.equal(3);
            done();
        });
    });
    /*it('Should have a body', function(done) {
        this.driver.findElement(selenium.By.tagName('body')).getAttribute('id').then(function(id) {
            expect(id).to.equal('body');
            done();
        });
    });*/    
    
});
