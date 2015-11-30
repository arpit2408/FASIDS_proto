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
    Model.findOne({operater_id: relation.operater_id, operation_receiver_id: relation.operation_receiver_id}, function (err, db_relation){
      if (err){
        console.log("[ERROR] : " + JSON.stringify(err))
        exec(err, null);
      }
      else if (!db_relation){
        console.log("relationship.js: " + "going to new");
        var new_relation = new Model(relation);
        new_relation.save( function (err) {
          if (err) {
            return exec(err, null);
          }
          exec(null,new_relation);
        });
      } 
      else {  // already has one relation, so we cannot process this adding

        exec(new Error("relationship already exited"));
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