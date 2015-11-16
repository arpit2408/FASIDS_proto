// collection name : fire_ant_product
// Mongoose Class Name   FireAntProduct

var mongoose = require('mongoose');
var _ = require('underscore');
_.mixin({
  compactObject: function(o) {
    _.each(o, function(v, k) {
      if(!v) {
        delete o[k];
      }
    });
    return o;
  }
});
var County = require('./county.js');
var ant_distribution_schema = new mongoose.Schema({
  fips:Number,
  genus:String,
  species:String
},{ collection:'ant_distribution'});

// define instance methods
ant_distribution_schema.method({

});


/*

db.ant_distribution.aggregate(
  [
    {$match: { }},
    { $group: { _id: "$fips", count: { $sum: 1 } } }

  ]
)
*/

/*
  If things going well, The successCB will be called with augu: [{_id:<fips>, count:<Number>},,,, ]
*/
ant_distribution_schema.static({
  findFIPSFromSpecie: function ( genus, species, successCB){
    var Model = this;
    var query = _.compactObject({genus:genus, species:species});
    // Model.find(query, successCB);  
    Model.aggregate([{$match:query}, {$group:{_id:"$fips" , count:{$sum:1}}} ]).exec( successCB);
  }
});


// helper function of schema
var saveCB = function( err, instance){
  if (err) console.log("[! ERROR !]  NOT successfully saved");
  else console.log("[INFO] "+ instance._id +" saved. ");
};

module.exports = mongoose.model('AntDistribution',ant_distribution_schema);