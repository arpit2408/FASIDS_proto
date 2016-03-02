var chai = require('chai');
var expect = chai.expect;
var _ = require("underscore");
var superagent = require('superagent');
var moduleapp = require('../../app.js');


describe('indexRouter', function(){
  before(function () {
    moduleapp.boot();
  });
  describe('GET /landscape/homeownermng', function(){
    it('should respond to GET',function(done){
      superagent.get('http://localhost:'+moduleapp.port).end(function(err, res){
        if (err)
          throw err;
        expect(res.status).to.equal(200);
        done();
      });
    });
  });

  after(function () {
    moduleapp.shutdown();
  });
});