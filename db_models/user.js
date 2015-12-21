var mongoose = require('mongoose');
var async = require('async');
var _ = require('underscore');
var user_schema = new mongoose.Schema({
  "first_name":String,
  "last_name":String,
  "password_hash":String,
  "email":{type: String, index:{unique: true}},
  "usercat":{type:Number, min:0, max:4},
  "receive_updates":Boolean,
  // "wishlist":Array,    // ObjectId literal array
  //regarding OAuth
},{ collection:'user'});

// define instance methods
user_schema.method({
  displayName: function(){
    return this.first_name + " " + this.last_name;
  },
  resetPassword: function(){
    console.log("user.js 20: code placehoder");
  },

  // cb is the callback of save
  resetPassword : function(cb) {
    this.password_hash =  Math.random().toString(36).slice(-8);
    this.save(cb);
  },

  /*The purpose of this function to return relevant activities for this user instance
    , his question, his answers, his polygon json and so on
  */
  allRelvant : function (  callback){
    var user = this;
    async.parallel(  
    [
      function parallel1(cb){
        mongoose.model('Post').find({poster_id: user._id.toString()}).populate('reply_to_mainpost').exec(cb);
      }, 
      function parallel2(cb){
        mongoose.model('PolygonGeojson').find({'properties.owner':user._id.toString()}, cb);
      }
    ], callback);
  }
});



// helper function of schema
var saveCB = function( err, instance){
  if (err) console.log("[! ERROR !]  NOT successfully saved");
  else console.log("[INFO] "+ instance._id +" saved. ");
};

module.exports = mongoose.model('User',user_schema);