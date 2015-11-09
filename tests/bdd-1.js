// This is test file is experimental attempt to write first bdd for this prototype project
// Bowei Liu
// 11092015

var boot = require('../app').boot,
  shutdown = require('../app').shutdown,
  port = require('../app').port,
  superagent = require('superagent'),
  expect = require('chai').expect;  // this line is different from Original Chap 3 of practical Node.js

  
describe('server', function () {
  before(function () {
    boot();
  });

  describe('homepage', function(){
    it('should respond to GET',function(done){
      superagent.get('http://localhost:'+port).end(function(err, res){
        if (err)
          throw err;
        console.log("res:" +res);
        expect(res.status).to.equal(200);
        done();
      });
    });
  });
  after(function () {
    shutdown();
  });
});