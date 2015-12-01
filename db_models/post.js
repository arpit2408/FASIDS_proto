var mongoose = require('mongoose');
var _ = require('underscore');
var Promise = require('promise');
var fs = require('fs');
var post_schema = new mongoose.Schema({
  "role":Number, // 1 means main_post, 2 means reply
  "post_id":String,
  "poster_id":mongoose.Schema.ObjectId,
  "poster_fullname":String,
  //"poster"   // this is a virtual field which only be fullfilled when rendered 
  "post_cat":{type:Number, min:0, max:4},   // used for the icons
  "post_title":String,
  "post_time": Date,
  "post_viewed":Number,
  "replied_post":Number,
  //"last_reply"  // this is a virtual field which only be fullfilled when rendered 
  "last_reply_id":String,  // keep track of last reply post_id

  "reply_to_post":String,// post created to reply specific post
  "reply_to_mainpost":String,
  "votes":Number,
  "stars":Number,
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
  updateData: function (reply_number, newest_reply){
    this.replied_post = reply_number;
    this.last_reply_id = newest_reply.post_id;
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
    // console.log(this);
    return new Promise(function wrappedCodeBlock (fulfill, reject){
      if (mongoArray.length ===0){
        fulfill(mongoArray);
      }
      else {
        var dueCallbackStack = [];
        for(var i = 0; i <= mongoArray.length - 1; i++){
          dueCallbackStack.push(i);
          User.findOne({_id:mongoArray[i].poster_id},null,{}, bindWithoutThis(  function userFoundCB(i,err, user){
            if (err) {
              reject(err);
              return;
            }
            if (!user){
              reject( new Error("did not find corresponding poster for: " + mongoArray[i]._id));
              return;
            }
            mongoArray[i]['poster'] = user;
            dueCallbackStack.pop();
            /*I do not assume async callbacks order can be kept*/
            if (dueCallbackStack.length === 0){
              fulfill(mongoArray);
            }
          },i)  );
        }// end of for
      }  
    });
  },
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
          POST.findOne({ "post_id":main_posts[i].last_reply_id},null,{}, bindWithoutThis(  function userFoundCB(i, err, reply){
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

  getAllMainPosts: function ( sort ,callback) {   // I can put sort parameter here
    var Model = this;
    if (typeof sort === "undefined"){
      console.log("[INFO] getAllMainPosts of post.js received undefined sort argument");
    }
    var to_be_sorted_field = "post_time";
    var increasing = 1;
    var decreasing = -1;
    var order = -1
    var sort_param = {};
    switch(sort){
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
        Model.find({"replied_post":0, "role":1}).sort(sort_param).exec(callback);
        return;
        break;
      default:
        // the default value has already being assigned
    }
    sort_param[to_be_sorted_field] = order;
    Model.find({"role":1}).sort(sort_param).exec(callback);
  },
  handleNewRelation: function (relation_to_be_added, exec){
    if (!relation_to_be_added) {
      return exec( new Error("relation_to_be_added is falsy argument"), null);
    } 
    this.findOne({post_id: relation_to_be_added.operation_receiver_id}, function (err ,post){
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
    Model.findOne( {post_id: relation_to_be_removed.operation_receiver_id}, function  (err, post){
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