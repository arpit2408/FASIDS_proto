var express = require('express');
var router = express.Router();

/* all the routes under "/users"*/
/* */
var passport = null;
router.all('*', function(req, res, next) {
  if (passport === null){
    passport = req.PASSPORT;
  }
  return next(); // following routes conninue handling requests
});

router.get('/signup', function (req, res, next){
  res.render("signup",{
    breadcrumTitle:"sign up",
    pathToHere:"users / signup"
  });
});

router.post('/signup', function (req, res, next){
  /*db operation goes here*/
  var new_user = {};
  new_user.email = req.body.email;
  new_user.password_hash = req.body.password; 
  new_user.first_name = req.body.firstname;
  new_user.last_name = req.body.lastname;
  // new_user.receive_updates = req.body.receive_updates|| false;
  new_user.usercat = req.body.usercat;     // 1 is common user
  
  new_user = new req.DB_USER(new_user);
  new_user.save(function (error){
    if (error) return next(error);
    console.log("[user.js:34 ]");
    // res.json(new_user.email);   // TODO send email here
  });
  res.render("signup",{
    breadcrumTitle:"sign up",
    pathToHere:"users / signup",
    msg_type:"success",
    msg_content:"Hello, "+new_user.displayName()+", you've signed up successfully. Click \"SIGN IN\" at left upper corner to sign in"
  });
});

router.get('/logout', function (req, res, next){
  req.logout();
  res.redirect("back");
})

// for  /users/signin
// router.post('/signin', passport.authenticate('local'),function (req, res, next){
//   console.log("[user.js 47]");
//   res.redirect('back'); 
// });

module.exports = router;
