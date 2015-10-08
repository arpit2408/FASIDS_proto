var mongoose = require('mongoose');
var _ = require('underscore');
var Promise = require('promise');
var fs = require('fs');
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

/*example promise*/
function readFile(filename, enc){
  return new Promise(function (fulfill, reject){
    fs.readFile(filename, enc, function (err, res){
      if (err) reject(err);
      else fulfill(res);
    });
  });
}
function errHandler(err){
  throw(err);
}

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
        Model.staticLinkPostWithUser(replies).then(function(res){
          callback(null, res);
        }).catch(errHandler);

      });  // callback should take err, and instances
    });
  },

  staticLinkPostWithUser:function(mongoArray){
    return new Promise(function wrappedCodeBlock (fulfill, reject){
      if (mongoArray.length ===0){
        fulfill(mongoArray);
      }
      else {
        var dueCallbackStack = [];
        for(var i = 0; i <= mongoArray.length - 1; i++){
          dueCallbackStack.push(i);
          User.findOne({_id:mongoArray[i].poster_id},null,{}, function userFoundCB(err, user){

            var i = dueCallbackStack.pop();
            if (err) {
              reject(err);
              return;
            }
            if (!user){
              reject( new Error("did not find corresponding poster for: " + mongoArray[i]._id));
              return;
            }
            mongoArray[i].poster = user;
            /*I do not assume async callbacks order can be kept*/
            if (dueCallbackStack.length === 0){
              fulfill(mongoArray);
            }
          });
        }// end of for
      }  
    });
  },
  staticLinkLastReplier:function( main_posts ){
    return new Promise(function wrappedCodeBlock (fulfill, reject){
      if (main_posts.length ===0){
        fulfill(main_posts);
      }
      else {
        var dueCallbackStack = [];
        for(var i = 0; i < main_posts.length ;i++){
          dueCallbackStack.push(i);
          User.findOne({_id:main_posts[i].last_replier},null,{}, function userFoundCB(err, user){
            var i = dueCallbackStack.pop();
            if (err) {
              reject(err);
              return;
            }
            if (!user){
              reject(new Error("did not find replier for: " + main_posts[i]._id));
              return;
            }
            main_posts[i].last_replier_obj = user;  // link last replier to that main_post
            if (dueCallbackStack.length === 0){
              fulfill(main_posts);
            }
          });
        };
      }  
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