var _ = require('underscore');
var router = require('express').Router();
var glblprefix = (process.env.NONEIISNODE) ? "":"/node/fasids";
var routesHelpers = require('./routesHelpers');

// READ index
router.get('/', function (req, res, next){
  res.render('blog/index', {
    title: 'Index | Blog | FASIDS',
    activePage:'Blog',
    breadcrumTitle:"Index of blogs",
    pathToHere:"blogs",
    isAuthenticated: req.isAuthenticated(),
    user: routesHelpers.processReqUser(req.user) 
  });
});

// READ signle blogpost
router.get('/first-blog', function (req, res, next) {
  res.render('blog/first-blog', {
    title: 'BLOG',
    activePage:'Blog',
    breadcrumTitle:"How can I tell if I have fire ants?",
    pathToHere:"blogs / first-blog",
    isAuthenticated: req.isAuthenticated(),
    user: routesHelpers.processReqUser(req.user)
  });
});

// CREATE  part1
router.get('/create', function (req, res, next){
  res.send("GET /blogs/create\n");
});

// CREATE part2
router.post('/create', function (req, res, next){
  res.send("POST /blogs/create\n");
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