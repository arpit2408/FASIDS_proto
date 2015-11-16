/*
  {
    "_id" : ObjectId("564512b96683c2b1fcd68812"),
    "state" : "TX",
    "county" : "Cameron county",
    "fips" : "48061",
    "state_fips" : "48",
    "square_mil" : 951.952
  }

*/

// collection name : fire_ant_product
// Mongoose Class Name   FireAntProduct

var mongoose = require('mongoose');
var _ = require('underscore');
var county_schema = new mongoose.Schema({
  "state" : String,
  "county" : String,
  "fips" : Number,
  "state_fips" : Number,
  "square_mil" : Number
},{ collection:'county'});

var AntDistribution = require('./ant_distribution.js');
// define instance methods
county_schema.method({


});



// helper function of schema
var saveCB = function( err, instance){
  if (err) console.log("[! ERROR !]  NOT successfully saved");
  else console.log("[INFO] "+ instance._id +" saved. ");
};

module.exports = mongoose.model('County',county_schema);