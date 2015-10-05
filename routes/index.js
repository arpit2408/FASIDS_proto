var express = require('express');
var router = express.Router();


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    // var my_error = new Error("Unauthorized behaviro");
    // my_error.status = 401;
    // next(my_error);
    res.status(401).send("Unauthorized action, loggin required");
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

router.get('/questions', function (req, res, next){
  res.render('qa', {title:'Question and Answers | FASIDS',
    breadcrumTitle:"Interactive Questions and Answers",
    pathToHere:"questions",
    activePage:'Questions',
    isAuthenticated: req.isAuthenticated(),
    user: processReqUser(req.user)
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
