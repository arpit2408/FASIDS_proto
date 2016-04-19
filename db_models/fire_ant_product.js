// collection name : fire_ant_product
// Mongoose Class Name   FireAntProduct

var mongoose = require('mongoose');
var _ = require('underscore');
var fire_ant_product_schema = new mongoose.Schema({
  product_id: {
    type: Number,
    required: [true, "product_id field not supplied"]
  },
  product_name: {
    type: String,
    required: [true, "prduct_name field not supplied"],
    maxlength: [200, "product_name field has too long length"]
  },
  manufacturer: {  // this one is not required
    type: String,
    maxlength: [200, "manufacturer field has too long length"]
  },   
  type_of_uses: [{
    type: String, 
    enum: ["home", "agricultural", "professional"]
  }],
  physcial_form:{  //application_type
    type: String,
    enum: ["granular", "dust", "liquid"],  //  granular, dust, liquid
    required: [true, "physcial_form field not supplied"]
  },    
  pest_types: [{
    type: String,
    maxlength: [100, "element of pest_types field  has too long length"]
  }],                    
  is_outdoor: Boolean,
  is_organic: Boolean,
  is_safe_for_pets: Boolean,
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
  // if its usage: 'broadcast', 'coverage' means coverage in square meter, if usage: 'imt', 'coverage' means number of mound it can treat 
  coverage: Number,
  homedepot_score: Number, 
  product_overview: {
    type: String,
    maxlength: 20000
  },
  product_url:{
    type:String
  },
  img_small_url:String,
  img_url: String
},{ collection:'fire_ant_product'});

// define instance methods
fire_ant_product_schema.method({
  getAmount: function (geoJsonObject) {
    var product = this;
    var amount = -1;
    if (product.coverage) {
      switch(geoJsonObject.properties.usage) {    // "usage" field of geoJsonObject is a must-be-filled field.
        case "imt":
          try {
            amount = (geoJsonObject.properties.mound_number / product.coverage); 
          } catch (e) {
            console.error(e);
          }
          break;
        case "broadcast":
          amount = (geoJsonObject.properties.total_area / product.coverage);
          break;
        case "broadcastimt":
          amount = (geoJsonObject.properties.total_area / product.coverage);
          break;
        default:
          amount = -1;
          console.log("unrecognized usage field in geoJsonObject." + geoJsonObject.properties.usage);
      } 
    } 
    return amount;
  }
});

// helper function of schema
var saveCB = function( err, instance){
  if (err) console.log("[! ERROR !]  NOT successfully saved");
  else console.log("[INFO] "+ instance._id +" saved. ");
};

module.exports = mongoose.model('FireAntProduct',fire_ant_product_schema);