var _ = require('underscore');
var moment = require('moment');
var router = require('express').Router();
var glblprefix = (process.env.NONEIISNODE) ? "":"/node/fasids";
var routesHelpers = require('./routesHelpers');

// READ index
router.get('/', function (req, res, next){
  var paging_condition = _.pick(req.query,'sort','skip','limit');
  req.DB_POST.getPostsOfRole(paging_condition, 3, function cb(err, query){
    if (err) return next(err);
    if (!query) return next( new Error("no query"));
    // query is like Model.find({"role":1}).skip(condition.skip).limit(condition.limit).sort(sort_param) 
    query.populate('poster_id').exec(function (err, posts){
      res.render('blog/index', {
        breadcrumTitle:"Index of blogs",
        pathToHere:"blogs",
        title: 'Index | Blog | FASIDS',
        activePage:'Blog',
        isAuthenticated: req.isAuthenticated(),
        user: routesHelpers.processReqUser(req.user),
        posts:posts,
        momentlib:moment,
        paging_condition: paging_condition
      });
    }); // query exec callback
  }); // make query callback
});

// READ signle blogpost
router.get('/first-blog', function (req, res, next) {
  res.render('blog/first-blog', {
    title: 'BLOG',
    activePage:'Blog',
    breadcrumTitle:"How can I tell if I have fire ants?",
    pathToHere:"blogs / first-blog",
    momentlib:moment,
    isAuthenticated: req.isAuthenticated(),
    user: routesHelpers.processReqUser(req.user)
  });
});

// CREATE  part1
router.get('/create', function (req, res, next){
  // res.send("GET /blogs/create\n");
  res.render('blog/create',{
    title: 'Hallo.js - Editing Markdown in WYSIWYG',
    activePage:'Blog',
    breadcrumTitle:"Create new blog",
    pathToHere:"blogs / create",
    isAuthenticated: req.isAuthenticated(),
    user: routesHelpers.processReqUser(req.user)
  });
});

// CREATE part2
router.post('/create', routesHelpers.ensureAuthenticated, function (req, res, next){
  var newblogpost = new req.DB_POST({
    role:3,
    poster_id: req.user._id,
    post_time: new Date(),
    post_title: req.body.post_title,
    content: req.body.content,
    votes:0,
    stars:0,
    tags: req.body.tags || ["default"]
  });
  newblogpost.save( function (err){
    if(err) return next(err);
    res.redirect(glblprefix  + '/blogs');
  });
});


/**
* Will be used for ajax saving function for blogpost
* UPDATE api, standard json return
*/
router.patch('/update', function (res,res,next){
  res.send("PATCH /blogs/update\n");
});


// DELETE api, standard json return
router.delete('/delete', function (res, res, next){
  res.send("DELETE /blogs/delete\n");
});

module.exports = router;