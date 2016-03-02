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
    mound_density:Number,  // input is imperial units ft^2
    polygon_name:String,
    address:String,
    notes:String, // used by user to input their notes about this polygon
    treatment:String,
    environment_map:{
      MapTypeId:{type:String, enum:['hybrid','roadmap', 'satellite', 'terrain']},
      tilt:{type:Number,enum:[0,45]}
    },
    bounds :{
      sw:{ lat: Number, lng: Number},
      ne:{ lat: Number, lng: Number}
    },
    owner:{type:mongoose.Schema.ObjectId, ref:'User'}
  }
},{collection:'polygon_geojson'});
  
// define instance methods
polygon_geojson_schema.method({
  // someMethod: function (...){}
  convertMtSquareToFtSquare: function (){
    return this.properties.total_area * 10.76391045;
  },

  convertMoundDensityIntoFt: function (){
    return this.properties.mound_density / 10.76391045;
  },
  getMoundsNum : function (){
    return (this.properties.total_area * this.properties.mound_density).toFixed(1);
  }
});

// need more sanity check for these functions
polygon_geojson_schema.static({
  convertMtSquareToFtSquare: function ( mtSquare){
    if (mtSquare === null || typeof mtSquare ==='undefined') return 0;
    return mtSquare * 10.76391045;
  },
  convertFtSquareToMtSquare: function ( footSquare){
    if (footSquare === null || typeof footSquare === 'undefined') return 0;
    return footSquare /10.76391045;
  },
  convertMoundDensityIntoMetric: function ( ftSquareDensity){
    if (ftSquareDensity === null || typeof ftSquareDensity === 'undefined') return 0;
    return ftSquareDensity  * 10.76391045;
  },
  convertMoundDensityIntoFt: function (mtSquareDensity){
    if ( mtSquareDensity === null || typeof mtSquareDensity === 'undefined') return 0;
    return mtSquareDensity  / 10.76391045;
  }
});



// helper function of schema
var saveCB = function( err, instance){
  if (err) console.log("[! ERROR !]  NOT successfully saved");
  else console.log("[INFO] "+ instance._id +" saved. ");
};

module.exports = mongoose.model('PolygonGeojson',polygon_geojson_schema);