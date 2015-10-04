var mongoose = require('mongoose');
var _ = require('underscore');
var user_schema = new mongoose.Schema({
  "first_name":String,
  "last_name":String,
  "password_hash":String,
  "email":String,
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
  }
});

// helper function of schema
var saveCB = function( err, instance){
  if (err) console.log("[! ERROR !]  NOT successfully saved");
  else console.log("[INFO] "+ instance._id +" saved. ");
};

module.exports = mongoose.model('User',user_schema);