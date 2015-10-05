var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');

var session = require('express-session');   //package.json has info
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

/*if this app is running on openshift, env var should have OPENSHIFT_MONGODB_DB_URL*/
var db_literal = "fasids";
var mongoose = require('mongoose'),  // newly added, regarding init express
    db_models = require('./db_models/index.js'),
    db_url = process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://@localhost:27017/',
    db = mongoose.connect(db_url+db_literal, {safe: true}),
    mongoId = mongoose.Types.ObjectId();

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
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

var passport = require('./components/processedPassport.js').addPassport(app, db_models);

// every req has db_model: User
app.use(function(req, res, next){
  req.DB_USER = db_models.User;
  return next();
});

// routing
app.use('/', routes);
app.post('/users/signin', passport.authenticate('local'),function (req, res, next){
  res.redirect("back");
});
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