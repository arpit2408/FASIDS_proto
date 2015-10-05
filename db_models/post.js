var mongoose = require('mongoose');
var _ = require('underscore');
var post_schema = new mongoose.Schema({
  "role":Number, // 1 means main_post, 2 means reply
  "post_id":String,
  "poster_id":mongoose.Schema.ObjectId,
  "poster_fullname":String,
  "post_cat":{type:Number, min:0, max:4},   // used for the icons
  "post_title":String,
  "post_time": Date,
  "reply_to_post":String,// post created to reply specific post
  "reply_to_mainpost":String,
  "content":String
},{ collection:'post'});

// define instance methods
post_schema.method({

});


post_schema.static({
  getAllFollowUps: function( main_post_id, callback){
    var Model = this;
    Model.findOne({"post_id": main_post_id}, null,{},function (err, instance){
      if (err) throw (err);
      if (instance.role !== 1){
        throw ("only main post can have follow ups");
      }
      Model.find({"reply_to_mainpost": main_post_id}).sort({"post_time":-1}).exec(callback);
    });
  },



  getAllMainPosts: function ( callback) {   // I can put sort parameter here
    var Model = this;
    Model.find({"role":1}).sort({"post_time":-1}).exec(callback);
  }
});

// helper function of schema
var saveCB = function( err, instance){
  if (err) console.log("[! ERROR !]  NOT successfully saved");
  else console.log("[INFO] "+ instance._id +" saved. ");
};

module.exports = mongoose.model('Post',post_schema);