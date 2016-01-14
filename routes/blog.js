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
router.get('/singlepost/:url_title', function (req, res, next) {
  console.log(req.params.url_title);
  req.DB_POST.findOne({url_title: encodeURIComponent(req.params.url_title)}).populate("poster_id").exec( function(err, blogpost){
    if (err) return next(err);
    if (!blogpost) return next(new Error("requested resource not found"));

    res.render('blog/singleblog.jade', {
      title: 'BLOG',
      activePage:'Blog',
      breadcrumTitle: blogpost.post_title,
      pathToHere:"blogs / " + blogpost.url_title,
      momentlib:moment,
      isAuthenticated: req.isAuthenticated(),
      user: routesHelpers.processReqUser(req.user),
      post:blogpost
    });
  });

});

// CREATE  part1
router.get('/create', routesHelpers.ensureGroup.bind([0]), function (req, res, next){
  // res.send("GET /blogs/create\n");
  res.render('blog/create',{
    title: 'Post Blog on FASIDS',
    activePage:'Blog',
    breadcrumTitle:"Create new blog",
    pathToHere:"blogs / create",
    isAuthenticated: req.isAuthenticated(),
    user: routesHelpers.processReqUser(req.user)
  });
});

// CREATE part2
router.post('/create', routesHelpers.ensureGroup.bind([0]), function (req, res, next){
  var newblogpost = new req.DB_POST({
    role:3,
    poster_id: req.user._id,
    post_time: new Date(),
    post_title: req.body.post_title,
    url_title:req.DB_POST.genUrlTitle(req.body.post_title),
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

router.get('/update/:url_title', routesHelpers.ensureGroup.bind([0]), function (req, res, next){
  req.DB_POST.findOne({url_title: encodeURIComponent(req.params.url_title)}).exec( function (err, blogpost){
    if (err) return next(err);
    if (!blogpost) return next( new Error("requested resource not found"));
    res.render('blog/create',{
      title: 'Update Blog on FASIDS',
      activePage:'Blog',
      breadcrumTitle:"Update blog",
      pathToHere:"blogs / update / " + blogpost.url_title,
      isAuthenticated: req.isAuthenticated(),
      user: routesHelpers.processReqUser(req.user),
      post:blogpost
    });
  });
});

/**
* Will be used for ajax saving function for blogpost
* UPDATE api, standard json return
*/
router.post('/update/:url_title', routesHelpers.ensureGroup.bind([0]), function (req,res,next){
  req.DB_POST.findOne({url_title: encodeURIComponent(req.params.url_title)}).exec( function (err, blogpost){
    if (err) return next(err);
    
    if (!blogpost) return next( new Error("requested resource not found"));
    blogpost.post_title=  req.body.post_title;
    blogpost.url_title=req.DB_POST.genUrlTitle(req.body.post_title);
    blogpost.content= req.body.content;
    blogpost.save(function (err){
      if (err) return next(err);
      res.redirect(glblprefix  +'/blogs/update/' + blogpost.url_title);
    });
  });
});


// DELETE api, standard json return
router.get('/delete/:url_title',routesHelpers.ensureGroup.bind([0]) ,function (req, res, next){
  res.send("DELETE /blogs/delete\n");
});



module.exports = router;