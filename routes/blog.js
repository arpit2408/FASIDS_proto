var _ = require('underscore');
var router = require('express').Router();
var glblprefix = (process.env.NONEIISNODE) ? "":"/node/fasids";
var routesHelpers = require('./routesHelpers');





router.get('/first-blog', function (req, res, next) {
  res.render('blog/first-blog', {
    title: 'BLOG',
    activePage:'Reports',
    breadcrumTitle:"first blog",
    pathToHere:"blogs / first-blog",
    isAuthenticated: req.isAuthenticated(),
    user: routesHelpers.processReqUser(req.user)
  });
});

module.exports = router;