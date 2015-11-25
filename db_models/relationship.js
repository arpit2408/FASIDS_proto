var mongoose = require('mongoose');
var _ = require('underscore');
var relationship_schema = new mongoose.Schema({
  "operater_id":mongoose.Schema.ObjectId,
  "operation_receiver_id" :String,  // have to be consistent with post Model 
  "operation"  :{"operation_name":String, "operation_value": Number}
},{ collection:'relationship'});

// define instance methods
relationship_schema.method({


});

relationship_schema.static({
  getRelation: function (operater_id, operation_receiver_id, exec){
    var Model = this;
    Model.findOne({operater_id:operater_id, operation_receiver_id:operation_receiver_id}, exec);
  },
  addRelation: function (relation, exec){
    var Model = this;
    Model.findOne({operater_id: relation.operater_id, operation_receiver_id: relation.operation_receiver_id}, function (err, relation){
      if (err){
        console.log("[ERROR] : " + JSON.stringify(err))
        exec();
      }
      else if (!relation){
        var new_relation = new Model(relation);
        exec(new_relation);
      } 
      else {
        exec();
      }
    });
  }
});


// helper function of schema
var saveCB = function( err, instance){
  if (err) console.log("[! ERROR !]  NOT successfully saved");
  else console.log("[INFO] "+ instance._id +" saved. ");
};

module.exports = mongoose.model('Relationship',relationship_schema);