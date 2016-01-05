var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');

var session = require('express-session');   //package.json has info
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var index_route = require('./routes/index');
var users = require('./routes/users');
var api_route = require('./routes/api')

/*if this app is running on openshift, env var should have OPENSHIFT_MONGODB_DB_URL*/
var db_literal = "fasids";
var mongoose = require('mongoose'),  // newly added, regarding init express
    db_models = require('./db_models/index.js'),
    db_url = process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://@localhost:27017/',
    db = mongoose.connect(db_url+db_literal, {safe: true}),
    mongoId = mongoose.Types.ObjectId();

var app = express();
var windows_base = express();  // adding common prefix router
// view engine setup
app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 3000)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set("x-powered-by", false);
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
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));

var passport = require('./components/processedPassport.js').addPassport(app, db_models);
require('./components/extendMailer.js').extend(app);  // now response object has mailer property
// every req has db_model: User
app.use(function(req, res, next){
  req.DB_USER = db_models.User;
  req.DB_POST = db_models.Post;
  req.db_models = db_models;
  return next();
});

// routing
app.use('/', index_route);
app.post('/users/signin', passport.authenticate('local',{failureRedirect:'/users/signin',failureFlash:true, sucessFlash: true}),function (req, res, next){
  if (typeof req.query.referral_url !== "undefined" && req.query.referral_url.search(/signin/) === -1){
    return res.redirect(req.query.referral_url);
  } else {
    return res.redirect("back");
  }
  // res.redirect("/");
});
app.use('/users', users);
app.use('/api', api_route);

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

if (process.env.NONEIISNODE){
  var ip   = process.env.OPENSHIFT_NODEJS_IP  || '127.0.0.1'
  var server = http.createServer(app);
  var boot = function (override_port) {
    server.listen(override_port || app.get('port'),ip, function(){
      console.info('Express server listening on port ' + app.get('port'));
    });
  }
  var shutdown = function() {
    server.close();
  }
  if (require.main === module) {
    boot();
  } else {
    console.info('Running app as a module')
    exports.boot = boot.bind(null, 3001);  // for test purpose, I have to set port at 3001 to avoid confliction
    exports.shutdown = shutdown;
    exports.port = app.get('port');
  }
}
else{
  windows_base.use('/node/fasids', app);
  windows_base.listen(process.env.PORT);
}

