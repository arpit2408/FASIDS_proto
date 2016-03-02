var expect = require('chai').expect;
var _ = require("underscore");
var mongoose = require("mongoose");
var utility = require('../utility.js');
mongoose.connect(utility.dburl);
var PolygonGeojson=  require("../../db_models/index.js").PolygonGeojson;

describe("PolygonGeojson", function (){

});