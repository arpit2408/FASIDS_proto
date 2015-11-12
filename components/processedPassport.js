var passport = require('passport');    //package.json has info
var passportLocal = require('passport-local');     //package.json has info

var localUtilities = {};

function verifyCredentials(email, password, done) {
    // Pretend this is using a real database!
    //Model.findOne(query, [fields], [options], [callback(error, doc)]): finds the first document that matches the query
    localUtilities['db_models'].User.findOne({"email":email},null,{},function(err, instance){
      if (err) { 
        console.log(err.message);
        return done(err);
      }
      else if(!instance) {
        done(null, null, {message:"Incorrect email & password combination"});
      } else{
        if (instance.password_hash === password){
          done(null, instance, {message:"You have successfully logged in"});  // pass the whole user profile
        } else{
          // Not authenticated
          done(null, false, {message:"Incorrect mail & password combination"});
        }
      }
    });// end of findOne
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
          return done(err);
        }
        else if(!instance) {
          return done(null, null);
        } else{
          done(null, instance);
        }
      });
  });
  return passport;
}