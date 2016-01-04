// collection name : fire_ant_product
// Mongoose Class Name   FireAntProduct

var mongoose = require('mongoose');
var _ = require('underscore');
var fire_ant_product_schema = new mongoose.Schema({
  product_id:Number,           // get from homedepot Internet #
  product_name: String,
  manufacturer: String,
  application_type: String,    //  granular, dust
  pest_type: String,           //  comma seprated string array
  con_or_rtu: String,          // 'rtu' means ready to use, 'con' means concentrated, need dilution before using
  is_outdoor: Boolean,
  is_safe_editable: Boolean,
  is_safe_for_pets: Boolean,
  control_method: String,       // 'bait', 'contact'
  usage: String,                // 'broadcast', 'mound treatment'
  coverage: Number,             // if it is broadcast, this one indicates the area in square meter unit, if it is mound treatment, it is how many mounds it can cover 
  is_water_needed: Boolean,   
  homedepot_score: Number, 
  product_overview: String,
  product_url:String,
  homedepot_img_small_url:String,
  homedepot_img_url: String,
  backup_url:String
},{ collection:'fire_ant_product'});

// define instance methods
fire_ant_product_schema.method({
  getAmount: function (totalarea, density){
    var product = this;
    var amount =""
    if (product.coverage){
      switch(product.usage){
        case "imt":
          amount =  (totalarea * density / product.coverage).toFixed(1); 
          break;
        case "broadcast":
          amount = (totalarea / product.coverage).toFixed(1);
          break;
        case "line":
          amount = "No data for perimeter";
          break;
        default:
          amount = "No valid coverage";
      } 
    } else {
      amount = "No Data"
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