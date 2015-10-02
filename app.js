var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');

var session = require('express-session');   //package.json has info
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');


var passport = require('passport');    //package.json has info
var passportLocal = require('passport-local');     //package.json has info


/*if this app is running on openshift, env var should have OPENSHIFT_MONGODB_DB_URL*/
var db_literal = "fasidsproto";

var mongoose = require('mongoose'),  // newly added, regarding init express
    db_models = require('./db_models/index.js'),
    db_url = process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://@localhost:27017/',
    db = mongoose.connect(db_url+db_literal, {safe: true}),
    mongoId = mongoose.Types.ObjectId();


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie:{maxAge:2678400}
}));
app.use(express.static(path.join(__dirname, 'public')));

//initialize passport session
app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportLocal.Strategy({
  usernameField: 'email',
  passwordField: 'password'
  },
  verifyCredentials));
function verifyCredentials(email, password, done) {
    // Pretend this is using a real database!
    //Model.findOne(query, [fields], [options], [callback(error, doc)]): finds the first document that matches the query
    db_models.User.findOne({"email":email},null,{},function(err, instance){
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

/* seems that javascript obj cannot be serialized into session*/
/*passport is gonna invoke this function for dev.*/
/*added by author ad 37:00*/
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
        done(null, instance);  // hoping req.User is one Mongoose Model instance
      }
    });
});

// every req has db_model as DetailedRentalListing
app.use(function(req, res, next){
  req.DB_USER = db_models.User;
  return next();
})

// routing
app.use('/', routes);
app.use('/users', users);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


// module.exports = app;

var port = process.env.OPENSHIFT_NODEJS_PORT || 3000;
var ip   = process.env.OPENSHIFT_NODEJS_IP  || '127.0.0.1'

app.listen(port,ip ,null, function(){
  console.log( "server listening: " + ip + ":" +port );
});


