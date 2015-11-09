var passport = require('passport');    //package.json has info
var passportLocal = require('passport-local');     //package.json has info

var localUtilities = {};

function verifyCredentials(email, password, done) {
    // Pretend this is using a real database!
    //Model.findOne(query, [fields], [options], [callback(error, doc)]): finds the first document that matches the query
    localUtilities['db_models'].User.findOne({"email":email},null,{},function(err, instance){
      if (err) { 
        console.log(err.message);
        return next(err);
      }
      else if(!instance) {
        done(null, null);
      } else{
        var instance_result = instance.toObject(); // convert mongoose instance into JSON-lized object
        if (instance_result.password_hash === password){
          delete instance_result.password_hash;
          done(null, instance_result);  // pass the whole user profile
        } else{
          // Not authenticated
          done(null, null);
        }
      }
    });// end of findOne
}
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


exports.addPassport = function (app, db_models){
  localUtilities['db_models'] = db_models;
  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(new passportLocal.Strategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  verifyCredentials));
  passport.serializeUser(function(user, done) {
      done(null, user._id);
  });

  passport.deserializeUser(function(_id, done) {
      // Query database or cache here!!
      db_models.User.findOne({"_id":_id},null,{},function(err, instance){
        //instance is an instance of User Model
        if (err) { 
          console.log(err.message);
          return next(err);
        }
        else if(!instance) {
          done(null, null);
        } else{
          var instance_result = instance.toObject(); // convert mongoose instance into JSON-lized object
          delete instance_result.password_hash;
          // done(null, instance_result);
          done(null, instance);
        }
      });
  });
  return passport;
}