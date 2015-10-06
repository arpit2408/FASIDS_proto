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
  "post_viewed":Number,
  "replied_post":Number,
  "last_replier":mongoose.Schema.ObjectId,
  "reply_to_post":String,// post created to reply specific post
  "reply_to_mainpost":String,
  "content":String
},{ collection:'post'});
var User = require('./user.js');
/*regarding main post*/
// {
//   "role":1, // 1 means main_post, 2 means reply
//   "post_id":String,
//   "poster_id":mongoose.Schema.ObjectId,
//   "poster_fullname":String,
//   "post_cat":{type:Number, min:0, max:4},   // used for the icons
//   "post_title":String,
//   "post_time": Date,
//   "post_viewed":Number,
//   "reply_to_post":String,// post created to reply specific post
//   "reply_to_mainpost":String,
//   "content":String
// }

/*regardomh followups*/
// {
//   "role":2, // 1 means main_post, 2 means reply
//   "post_id":String,
//   "poster_id":mongoose.Schema.ObjectId,
//   "poster_fullname":String,
//   "post_time": Date,
//   "reply_to_post":String,// post created to reply specific post
//   "reply_to_mainpost":String,
//   "content":String
// }

// define instance methods
post_schema.method({
  addOneView: function(){
    var post = this;
    if (post.role !== 1) {throw ("only main post can add view number");} 
    if (post.post_viewed){
      post.post_viewed += 1;
    } else{
      post.post_viewed = 1;
    }
    post.save(saveCB);
  },
  updateData: function (reply_number, newest_reply){
    this.replied_post = reply_number;
    this.last_replier = newest_reply.poster_id;
    this.save(saveCB);
  },
  setReplyNumber: function (reply_number){
    var post = this;
    if (post.role !== 1) {throw ("only main post can add reply number");} 
    post.replied_post = reply_number;
    post.save(saveCB);
  }
});


post_schema.static({
  getAllFollowUps: function( main_post_id, callback){
    var Model = this;
    Model.findOne({"post_id": main_post_id}, null,{},function findMainPostCB(err, instance){
      if (err) throw (err);
      if (instance.role !== 1){
        throw ("only main post can have follow ups");
      }
      Model.find({"reply_to_mainpost": main_post_id}).sort({"post_time":1}).exec(function findRepliesCB(err, replies){
        if (err) throw (err);
        replies.forEach(function (element, index, ar){
          User.findOne({_id:element.poster_id}, null, {}, function userFindOneCB(err, user){
            if (err) throw (err);
            ar[index].poster = user.toObject();
            /* wait until all the reply in replies are updated*/
            if (index === replies.length -1){
              callback(null, ar);
            }
          });
        });

      });  // callback should take err, and instances
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

// function readJSON(filename){
//   return new Promise(function (fulfill, reject){

//     readFile(filename, 'utf8').done(
//       function (res){
//         try {
//           fulfill(JSON.parse(res));
//         } catch (ex) {
//           reject(ex);
//         }
//       }
//       , reject
//     );

//   });
// }