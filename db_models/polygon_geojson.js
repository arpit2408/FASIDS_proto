// DB collection name : polygon_geojson
// Mongoose Class Name   PolygonGeojson

var mongoose = require('mongoose');
var _ = require('underscore');
var polygon_geojson_schema = new mongoose.Schema({
  type: {type:String, enum:['Feature']},
  geometry:{
    type:{type:String, enum:['Polygon']},
    coordinates:Array
  },
  properties:{
    polygon_name:String,
    address:String,
    notes:String, // used by user to input their notes about this polygon

    total_area:Number,
    mound_density:Number,
    mound_number: Number,

    type_of_use:{
      type:String,
      enum: ["home", "agricultural", "professional"],
      required:[true, "type of use of polygonGeojson not supplied"]
    },
    control_method: {                     // 'bait', 'contact'
      type: String,
      enum: ["bait", "contact", "baitcontact"],
      required: [true, "control_method field not supplied"]
    },
    usage: {                            // 'broadcast', 'imt'
      type: String,
      enum: ["broadcast", "imt", "broadcastimt"],
      required: [true, "usage field not supplied"]
    },
    is_outdoor_land: Boolean,
    need_organic: Boolean,
    need_safe_for_pets: Boolean,

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