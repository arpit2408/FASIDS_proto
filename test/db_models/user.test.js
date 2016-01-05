var expect = require('chai').expect;
var _ = require("underscore");
var User = require("../../db_models/index.js").User;
var mongoose = require("mongoose");
var utility = require('../utility.js');
mongoose.connect(utility.dburl);

before(function (){
  expected = new User({
    "first_name":"TestFirst",
    "last_name":"TestLast",
    "password_hash":"password",
    "email": "test@test.com",
    "usercat": 0,
    "receive_updates":true
  });
});

after(function (){
  expected.remove();
});
describe("User", function (){
  describe(".displayName()", function (){
    it("should return <firstname> <lastname>", function (done){
      expect(expected.displayName()).to.equal("TestFirst TestLast");
      done();
    });

    it(".resetPassword()", function (done){
      expected.resetPassword( function (err){
        if (err) throw err;
        console.log(utility.consolelog + expected.password_hash);
        expect(expected.password_hash).to.not.equal("password");
        done();
      });
    });

    it(".allRelvant()", function (done){
      expected.save(function (err){
        if (err) throw err;
        expected.allRelvant( function (err, instances){
          if (err){
            if (Array.isArray(err)){throw err[0];}
            else throw err;
          }
          expect(instances.length).to.equal(2);  // when data is filled with more things, I will implement more testing here
          done();
        });
      })
    });
  });
});