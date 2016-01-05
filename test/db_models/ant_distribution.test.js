var expect = require('chai').expect;
var _ = require("underscore");
var AntDistribution = require("../../db_models/ant_distribution.js");
var mongoose = require("mongoose");
mongoose.connect('mongodb://@localhost:27017/fasids');

var consolelog  = "         console.log: ";
describe("AndDistribution", function (){
  describe("#findFIPSFromSpecie()", function (){
    it("should receive  genus, species, callback, and return count grouped by FIPS", function (done){
      var genus = "Aphaenogaster";
      var species = "punctaticeps";
      AntDistribution.findFIPSFromSpecie(genus, species, function (err, ant_distributions){
        if (err) throw err;
        expect(ant_distributions instanceof Array).to.equal(true);
        if (ant_distributions.length > 0){
          console.log(consolelog + "testing inner elements....")
          expect(ant_distributions[0].hasOwnProperty("_id")).to.equal(true);
        }
        console.log(consolelog + JSON.stringify(ant_distributions));
        done();
      });
    });
  });
});