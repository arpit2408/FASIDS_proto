var mongoose = require('mongoose');
var _ = require('underscore');
var Promise = require('promise');
var htmlToText = require('html-to-text');
var fs = require('fs');
var post_schema = new mongoose.Schema({
  "role":Number, // 1 means main_post, 2 means reply
  "poster_id":{type: mongoose.Schema.ObjectId, ref: 'User'},
  "post_cat":{type:Number, min:0, max:4},   // used for the icons     1 main post in QA, 2 reply to main post, 3 blogpost
  "post_title":String,
  "post_time": Date,
  "updated_at": {type: Date, default: Date.now},
  "post_viewed":Number,
  "replied_post":Number,
  // "last_reply_id":{type:mongoose.Schema.ObjectId, ref:'Post'},  // keep track of last reply _id
  "reply_to_post":{type:mongoose.Schema.ObjectId, ref:'Post'},// post created to reply specific post
  "reply_to_mainpost":{type:mongoose.Schema.ObjectId, ref:'Post'},
  "replies":[{type:mongoose.Schema.ObjectId, ref:'Post'}],
  "votes":{type:Number, required: true},
  "stars":{type:Number, required: true},
  "tags":[{type:String}],
  "active": Boolean,
  "content":{type:String, required: true}
},{ collection:'post'});
/*regarding main post*/
// {
//   "_id" : default  
//   "role":1, // 1 means main_post, 2 means reply
//   "poster_id":mongoose.Schema.ObjectId,
//   "poster_fullname":String,
//   "post_cat":{type:Number, min:0, max:4},   // used for the icons
//   "post_title":String,
//   "post_time": Date,
//   "post_viewed":Number,
//   "reply_to_post":String,// post created to reply specific post
//   "reply_to_mainpost":String,
//   "content":String,
//   "stars" : Number,
//   "votes" : Number
// }

/*regarding replies*/
// {
//   "_id" : default  
//   "role":2, // 1 means main_post, 2 means reply
//   "poster_id":mongoose.Schema.ObjectId,
//   "poster_fullname":String,
//   "post_time": Date,
//   "reply_to_post":String,// post created to reply specific post
//   "reply_to_mainpost":String,
//   "content":String,
//   "stars" : Number,
//   "votes" : Number
// }
// define instance methods
//http://stackoverflow.com/questions/13851088/how-to-bind-function-arguments-without-binding-this
function bindWithoutThis(cb) {
  var bindArgs = Array.prototype.slice.call(arguments, 1);
  return function () {
      var internalArgs = Array.prototype.slice.call(arguments, 0);
      var args = Array.prototype.concat(bindArgs, internalArgs);
      return cb.apply(this, args);
  };
}

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
  addOneReply: function (reply_id, saveCB){
    this.replies.push(reply_id);
    this.replied_post += 1;
    this.save(saveCB);
  },
  /*
    param:
      length: how long the pure text content will be returned, the preview text need use this method
  */
  preivew: function (){
    return this.getPureTextContent(80) + "...";
  },
  getPureTextContent: function (length){
    return htmlToText.fromString(this.content,{
      wordwrap:false
    }).substring(0,length);
  },
  destroy : function ( callback){
    var this_post = this;
    this_post.remove(function onRemovePostInstance (err, post){
      if (err) return callback(err);
      this_post.model("Relationship").remove({"operation_receiver_id": post._id}, function (err){
        if (err) return callback(err);
        if (post.role === 2){  // This is one reply to certain post
          this_post.model("Post").findById(this_post.reply_to_mainpost, null, {}, function exec (error, main_post){
            var this_post_index_at_mainreplies = main_post.replies.indexOf(this_post._id);
            if (this_post_index_at_mainreplies >-1){
              main_post.replies.splice(this_post_index_at_mainreplies); // method usage  some_array.splice(start_index, delete_count[, item1, item2,..,])
            } else {
              console.log("[ERROR] main_post delete find to be deleted reply in replies array");
            }
            main_post.save();
            return callback(null, this_post._id);
          });
        }else{
          return callback(null, this_post._id);
        }
        console.log("[INFO] post: " + post._id + " removed");
      });
    });
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
    Model.findOne({"_id": main_post_id}).populate('replies poster_id').exec(callback);
  },
  // This method is to populate poster_id of all the replies
  staticLinkPostWithUser:function(mongoArray){
    var ids = _.pluck(mongoArray, '_id')
    return this.find({_id:{$in:ids}}).populate('poster_id');
  },
  /*
  staticLinkLastReply:function( main_posts ){
    var POST = this;
    // console.log("arrived staticLinkLastReply#################");
    // console.log(this)
    return new Promise(function wrappedCodeBlock (fulfill, reject){
      if (main_posts.length ===0){
        fulfill(main_posts);
      }
      else {
        var dueCallbackStack = [];
        for(var i = 0; i < main_posts.length ;i++){
          dueCallbackStack.push(i);
          POST.findOne({ "_id":main_posts[i].last_reply_id},null,{}, bindWithoutThis(  function userFoundCB(i, err, reply){
            if (err) {
              reject(err);
              return;
            }
            if (!reply){
              reject(new Error("did not last reply for: " + main_posts[i]._id));
              return;
            }

            main_posts[i]['last_reply'] = reply;  // link last replier to that main_post
            dueCallbackStack.pop();
            if (dueCallbackStack.length === 0){
              // console.log("fulfill" + fulfill);
              fulfill(main_posts);
            }
          },i) );
        };
      }  
    });
  },
  */
  getAllMainPosts: function ( condition ,callback) {   // I can put sort parameter here
    var Model = this;
    if (typeof condition === "undefined"){
      console.log("[INFO] getAllMainPosts of post.js received undefined sort argument");
      condition = {limit: 15, skip: 0, sort:"newest"};
    }
    if (!condition.limit){condition.limit = 15;}
    if (!condition.skip) { condition.skip = 0;}
    if (!condition.sort){ condition.sort = "newest";}
    Model.count({role:1}, function afterCount(err, count){
      condition.count = count;
      var to_be_sorted_field = "post_time";
      var increasing = 1;
      var decreasing = -1;
      var order = -1
      var sort_param = {};
      switch(condition.sort){
        case "newest":
          break;
        case "votes":
          to_be_sorted_field = "votes";
          break;
        case "frequent":
          to_be_sorted_field = "post_viewed";
          break;
        case "active":
          // TODO
          break;
        case "unanswered":
          sort_param[to_be_sorted_field] = order;
          return callback(err , Model.find({"replied_post":0, "role":1}).skip(condition.skip).limit(condition.limit).sort(sort_param));
          break;
        default:
          // the default value has already being assigned
      }
      sort_param[to_be_sorted_field] = order;
      return callback( null, Model.find({"role":1}).skip(condition.skip).limit(condition.limit).sort(sort_param) );
      // Model.find({"role":1}).skip(condition.skip).limit(condition.limit).sort(sort_param).exec(callback);
    });
  },
  handleNewRelation: function (relation_to_be_added, exec){
    if (!relation_to_be_added) {
      return exec( new Error("relation_to_be_added is falsy argument"), null);
    } 
    this.findOne({_id: relation_to_be_added.operation_receiver_id}, function (err ,post){
      if (err) return exec(err, null);
      if (!post) return exec(new Error("cannot find this post: " + relation_to_be_added.operation_receiver_id));
      var to_be_returned_property = "";
      switch (relation_to_be_added.operation.operation_name){
        case "vote":
          post.votes += relation_to_be_added.operation.operation_value;
          to_be_returned_property = "votes";
          break;
        case "star":
          post.stars += 1;
          to_be_returned_property = "stars";
          break;
        default:
          console.log("[ERROR]  handleNewRelation() of post.js (DB Schema), unrecognized relation name");
          return exec (null, new Error("recognized relation name"));
      }
      post.save (function onSave(err){
        if (err) return exec (err, null);
        return exec (null, post[to_be_returned_property]);
      });
    });
  },
  offsetRelation : function (relation_to_be_removed, exec){
    if (!relation_to_be_removed) {
      return exec( new Error("relation_to_be_removed is falsy argument"), null);
    }
    var Model = this;
    Model.findOne( {_id: relation_to_be_removed.operation_receiver_id}, function  (err, post){
      if (err) return exec(err, null);
      if (!post) return exec(new Error("cannot find this post: " + relation_to_be_removed.operation_receiver_id));
      var to_be_returned_property = "";
      switch ( relation_to_be_removed.operation.operation_name ){
        case "vote":
          post.votes -= relation_to_be_removed.operation.operation_value;
          to_be_returned_property = "votes";
          break;
        case "star":
          post.stars -= 1;
          to_be_returned_property = "stars";
          break;
        default:
          console.log("[ERROR]  offsetRelation() of post.js (DB Schema), unrecognized relation name");
          return exec (null, new Error("recognized relation name"));
      }
      post.save(function onSave(err){
        if (err) return exec(err, null);
        return exec(null, post[to_be_returned_property]);
      });
    });
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