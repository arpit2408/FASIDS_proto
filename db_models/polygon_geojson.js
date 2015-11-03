// DB collection name : polygon_geojson
// Mongoose Class Name   PolygonGeojson

var mongoose = require('mongoose');
var _ = require('underscore');
var polygon_geojson_schema = new mongoose.Schema({
  type: {type:String, enum:['Feature']},
  geometry:{
    type:{type:String, enum:['Polygon', 'polygon']},
    coordinates:Array
  },
  properties:{
    landusage:String,
    total_area:Number,
    mound_density:Number,
    treatment:String,
    owner:mongoose.Schema.ObjectId
  }
},{collection:'polygon_geojson'});
  
// define instance methods
polygon_geojson_schema.method({
  // someMethod: function (...){}

});



// helper function of schema
var saveCB = function( err, instance){
  if (err) console.log("[! ERROR !]  NOT successfully saved");
  else console.log("[INFO] "+ instance._id +" saved. ");
};

module.exports = mongoose.model('PolygonGeojson',polygon_geojson_schema);