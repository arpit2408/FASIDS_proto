var express = require('express');
var router = express.Router();


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    // var my_error = new Error("Unauthorized behaviro");
    // my_error.status = 401;
    // next(my_error);
    res.status(401).send("Unauthorized action, login required");
  }
}

function processReqUser ( req_user){  
  if (req_user) var temp_user = req_user.toObject();
  else return null;
  delete temp_user.password_hash; 
  return temp_user;
}

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { 
    title: 'FASIDS',
    activePage:'Home',
    isAuthenticated: req.isAuthenticated(),
    user: processReqUser(req.user)
  });
});

router.get('/qa', function (req, res, next){
  res.render('qa', {title:'Question and Answers | FASIDS',
    breadcrumTitle:"Interactive Questions and Answers",
    pathToHere:"qa",
    activePage:'Questions',
    isAuthenticated: req.isAuthenticated(),
    user: processReqUser(req.user)
  });
});

/* /qa/question?qid=123  */
router.get('/qa/question',function (req, res, next){
  console.log(req.query.qid);
  res.render('question.jade',{
    breadcrumTitle:"Question title(TODO: retrieve from DB)",
    pathToHere:"qa / question?id=12345678",
    title: 'QA POSTING | FASIDS',
    activePage:'Questions',
    isAuthenticated: req.isAuthenticated(),
    user: processReqUser(req.user)
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
  "content":String*/
router.post('/qa/posting', ensureAuthenticated, function (req, res, next){
  console.log("$$$$$$posting:$$$");
  console.log(req.user._id);
  var currentDate = new Date();
  var post_id = (currentDate.getFullYear()%2000).toString() + (currentDate.getMonth()+1).toString() + currentDate.getDay().toString() + currentDate.getHours().toString();
  post_id += currentDate.getMinutes().toString() + currentDate.getSeconds().toString() + currentDate.getMilliseconds().toString();

  var newPost = {
    role:1,
    post_id:post_id,
    poster_id: req.user._id,
    post_cat:(req.body.post_cat)?parseInt(req.body.post_cat):1,
    post_title:req.body.title,
    post_time:currentDate,
    content: req.body.content
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

module.exports = router;
