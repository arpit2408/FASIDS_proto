var _ = require('underscore');
var router = require('express').Router();
var glblprefix = (process.env.NONEIISNODE) ? "":"/node/fasids";
var routesHelpers = require('./routesHelpers');

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

module.exports = router;