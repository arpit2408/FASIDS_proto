var express = require('express');
var moment = require('moment');
var router = express.Router();


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    // var my_error = new Error("Unauthorized behaviro");
    // my_error.status = 401;
    // next(my_error);
    // 
    res.status(401).send("Unauthorized action, login required");
  }
}

function processReqUser ( req_user){  
  if (req_user) var temp_user = req_user.toObject();
  else return null;
  delete temp_user.password_hash; 
  return temp_user;
}

function genPostId(){
  var currentDate = new Date();
  var post_id = (currentDate.getFullYear()%2000).toString() + (currentDate.getMonth()+1).toString() + currentDate.getDay().toString() + currentDate.getHours().toString();
  post_id += currentDate.getMinutes().toString() + currentDate.getSeconds().toString() + currentDate.getMilliseconds().toString();
  return post_id;
}

function sanityCheckPosts(posts){
  if ( typeof(posts)==='undefined' || posts ===null){
    return false;
  }
  var i = 0;
  for (i=0; i < posts.length; i++){
    var post = posts[i];
    if (post.role === 1){
      if (typeof (post.last_replier_obj) === 'undefined'){
        return false;
      }
    }
    if  (typeof (post.poster) === 'undefined'){
      return false;
    }
  }
  return true;
}

/*routes
get    "/"
//********* Q & A **********
get    "/qa"
post   "/qa/question?qid=xxxx"
get    "/qa/question?qid=xxxxx"
post   "/qa/posting"
get    "/qa/[pstomh"

//********* Ant Activity **********


*/

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { 
    title: 'FASIDS',
    activePage:'Home',
    isAuthenticated: req.isAuthenticated(),
    user: processReqUser(req.user)
  });
});

/*visit the qa forum*/
router.get('/qa', function (req, res, next){
  req.DB_POST.getAllMainPosts(function (err, posts){
    if (err) next(err);
    toBeRenderedPosts = [];
    if (posts.length === 0){
      res.render('qa', {title:'Question and Answers | FASIDS',
        breadcrumTitle:"Interactive Questions and Answers",
        pathToHere:"qa",
        activePage:'Questions',
        isAuthenticated: req.isAuthenticated(),
        user: processReqUser(req.user),
        posts:toBeRenderedPosts
      });
      return;
    }
    // posts.forEach(function(element, index, ar){
    //   // ar[index] = element.toObject();
    //   req.DB_USER.findOne({_id:ar[index].last_replier}, null, {}, function (err, user){
    //     if (err) return next(err);
    //     if (!user) return next(new Error("no such user"));
    //     toBeRenderedPosts[index] = ar[index].toObject();
    //     toBeRenderedPosts[index].last_replier_displayname = user.displayName();
    //     console.log("add last last_replier name");

    //     if (toBeRenderedPosts.length === posts.length){
    //       // can render now 
    //       res.render('qa', {title:'Question and Answers | FASIDS',
    //         breadcrumTitle:"Interactive Questions and Answers",
    //         pathToHere:"qa",
    //         activePage:'Questions',
    //         isAuthenticated: req.isAuthenticated(),
    //         user: processReqUser(req.user),
    //         posts:toBeRenderedPosts,
    //         momentlib:moment
    //       });
    //     }
    //   })
    // });
  
    req.DB_POST.staticLinkPostWithUser(posts).then(req.DB_POST.staticLinkLastReplier).then(function (posts){
      if ( !sanityCheckPosts(posts) ){
        return next(new Error("posts sanity check failed"));
      }
      res.render('qa', {title:'Question and Answers | FASIDS',
        breadcrumTitle:"Interactive Questions and Answers",
        pathToHere:"qa",
        activePage:'Questions',
        isAuthenticated: req.isAuthenticated(),
        user: processReqUser(req.user),
        posts:posts,
        momentlib:moment
      }).catch(function(err){
        return next(err);
      });
    });
    // console.log("qa rendered");
  });
});

router.post('/qa/question', function (req, res, next) {

  var reply = {
    role:2,
    post_id:genPostId(),
    poster_id: req.user._id,
    poster_fullname: req.user.displayName(),
    post_time: new Date(),
    reply_to_post: (req.query.replyto)?req.query.replyto:"none",
    reply_to_mainpost:req.query.qid,
    content: req.body.content
  };
  reply = new req.DB_POST(reply);
  reply.save( function (error){
    if (error) return next(error);
    // at current scope, reply is saved successfully 

    req.DB_POST.getAllFollowUps(req.query.qid,function setReplyNumber(err , replies){
      if (err) return next(err);
      req.DB_POST.findOne({post_id: req.query.qid}, null, {}, function (err, main_post){
        if (err) return next(err);
        main_post.updateData(replies.length, replies[replies.length-1]);

      });
    });
    return res.redirect('/qa/question?qid='+req.query.qid);
  });
});

/* /qa/question?qid=123  */
router.get('/qa/question',function (req, res, next){
  // console.log(req.query.qid);
  if (!req.query.qid){
    return next( new Error('illegal queries'));
  }
  var post_id = req.query.qid;
  req.DB_POST.findOne({post_id:post_id},null,{}, function (err, target_post){
    if (err) next(err);
    //Converts this document into a plain javascript object, ready for storage in MongoDB.
    target_post.addOneView();
    target_post = target_post.toObject();
    req.DB_POST.getAllFollowUps(post_id, function whenRepliesReady (err, replies){
      if (err) next(err);
      // var number_reply = replies.length;
      res.render('question.jade',{
        breadcrumTitle:target_post.post_title,
        pathToHere:"qa / question?qid="+post_id.toString(),
        title: 'QA QUESTION | FASIDS',
        activePage:'Questions',
        isAuthenticated: req.isAuthenticated(),
        user: processReqUser(req.user),
        momentlib:moment,
        main_post: target_post,
        replies:replies,
      });
    });
  });
});

/*
  "role":Number, // 1 means main_post, 2 means reply
  "post_id":String,
  "poster_id":mongoose.Schema.ObjectId,
  "post_cat":{type:Number, min:0, max:4},   // used for the icons
  "post_title":String,
  "post_time": Date,
  "reply_to_post":String,// post created to reply specific post
  "reply_to_mainpost":String,
  "content":String
*/
router.post('/qa/posting', ensureAuthenticated, function (req, res, next){
  console.log("$$$$$$posting:$$$");
  var currentDate = new Date();
  var post_id = genPostId();
  var newPost = {
    role:1,
    post_id:post_id,
    poster_id: req.user._id,
    post_cat:(req.body.post_cat)?parseInt(req.body.post_cat):1,
    post_title:req.body.title,
    post_time:currentDate,
    post_viewed:0,
    replied_post:0,
    last_replier:req.user._id,
    content: req.body.content,
    poster_fullname: req.user.displayName()
  };
  newPost = new req.DB_POST(newPost);
  newPost.save( function (error){
    if (error) return next(error);
    return res.redirect('/qa');
  });
});

router.get('/qa/posting', ensureAuthenticated,function (req, res, next){
  res.render('postquestion',{
    breadcrumTitle:"POST A NEW QUESTION",
    pathToHere:"qa / posting",
    title: 'QA POSTING | FASIDS',
    activePage:'Questions',
    isAuthenticated: req.isAuthenticated(),
    user: processReqUser(req.user)
  });
});


/* */
router.get('/antactivity', function (req, res, next){
  res.render("antactivity",{
    breadcrumTitle:"FIREANT ACTIVITY FORECAST",
    pathToHere:"antactivity",
    activePage:'Ants',
    momentlib:moment
  })
});

module.exports = router;
