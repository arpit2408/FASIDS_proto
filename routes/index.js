var express = require('express');
var moment = require('moment');
var Promise = require('promise');
var router = express.Router();
var _ = require('underscore');
var routesHelpers = require('./routesHelpers');
var readFile = Promise.denodeify(require('fs').readFile); // see https://www.promisejs.org/
var glblprefix = routesHelpers.glblprefix;
function readJSON(filename, callback){  //// see https://www.promisejs.org/
  // If a callback is provided, call it with error as the first argument
  // and result as the second argument, then return `undefined`.
  // If no callback is provided, just return the promise.
  return readFile(filename, 'utf8').then(JSON.parse).nodeify(callback);
}

function ensureAdmin(req, res, next){
  if (req.isAuthenticated() && req.user.usercat === 0){
    next();
  } else{
    res.redirect( glblprefix  + "/users/signin?referral_url=" + req.originalUrl );
  }
}

// function
var ensureAuthenticated = routesHelpers.ensureAuthenticated;
// function
var processReqUser = routesHelpers.processReqUser;
/*routes
get    "/" index page

//********* Q & A **********
get    "/qa"                         Q & A index
get    "/qa/question?qid=xxxxx"      render certain questions and answers
post   "/qa/question?qid=xxxxx"      post replies to certain question
delete "/qa/question?qid=xxxxx"      destroy this post and clean all associations    Not Done Yet
post   "/qa/posting"                 New questions posted via this route                 
get    "/qa/posting"                 Render the input page for use to post a question
get    "/qa/edit_post?post_id=xx"    Render the editor with to be edited content in  eit
post   "/qa/edit_post?post_id=xx"    update content of post instance

//********* ant activity *****
get    "/antactivity"                show ant acitvity page

//******map application ******
get    "/landscape/homeownermng"     show main page of landscape management
get    "/landscape/homeownermng/:geojson_id"   show patch page of certain geojson
delete "/landscape/homeownermng/:geojson_id"  API, delete geojson
post   "/landscape/homeownermng/:geojson_id/patch"  API, update geojson instance
get    "/landscape/treatment/:geojson_id"      show treatment (list of products and map of 
                                               polygon)
post   "/landscape/treatment"          API, create new geojson and show treatment
get    "/landscape/fire_ant_products"  show list of all fire_ant_products
get    "/landscape/antdistribution"    show counties map with ant distribution
get    "/landscape/antdistribution_lookup?genus=xx(&specie=xx)"  API, for antdistribution lookup
*/


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'FASIDS',
    activePage:'Home',
    isAuthenticated: req.isAuthenticated(),
    user: processReqUser(req.user)
  }, function (err, html) {
    if (err) {
      next(err);
      return;
    }
    res.send(html);
  });
});

/*visit the qa forum*/
router.get('/qa', function (req, res, next){
  var paging_condition = _.pick(req.query,'sort','skip','limit');
  req.DB_POST.getPostsOfRole(paging_condition, 1,function cb (err, query){
    if (err) return next(err);
    if (!query) return next( new Error("no query"));
    // query is like Model.find({"role":1}).skip(condition.skip).limit(condition.limit).sort(sort_param) 
    query.populate('poster_id replies reply_to_mainpost').exec(function (err, posts){
      posts = _.filter(posts, function(post){  return  post.poster_id !== null;});
      res.render('qa', 
        {
          title:'Question and Answers | FASIDS',
          breadcrumTitle:"Questions and Answers",
          pathToHere:"qa",
          activePage:'Questions',
          isAuthenticated: req.isAuthenticated(),
          user: processReqUser(req.user),          
          posts:posts,
          momentlib:moment,
          paging_condition: paging_condition
        },
        function (err, html) {
          if (err) {
            // next(err);
            return ;
          }
          res.send(html).end();
        }
      );
    });
  });
});

/* /qa/question?qid=123  */
router.get('/qa/question', ensureAuthenticated,function (req, res, next){
  // console.log(req.query.qid);
  if (!req.query.qid){
    return next( new Error('illegal queries'));
  }
  req.DB_POST.findOne({_id: req.query.qid}).populate("poster_id replies").exec(function (err, main_post){
    if (err) return next(err);
    if (!main_post) return next(new Error("cannot find this main_post"));
    main_post.addOneView();
    req.DB_POST.staticLinkPostWithUser(main_post.replies).exec(function (err, replies){
      if (err) return next (err);
      main_post.replies = replies;
      res.render('question.jade',{
        breadcrumTitle:main_post.post_title,
        pathToHere:"qa / question?qid="+main_post._id.toString(),
        title: 'QA QUESTION | FASIDS',
        activePage:'Questions',
        isAuthenticated: req.isAuthenticated(),
        user: processReqUser(req.user),
        momentlib:moment,
        main_post: main_post,
        replies:replies,
      });
    });
  });
});


/* POST replies at path: "/qa/question" */
router.post('/qa/question', ensureAuthenticated, function (req, res, next) {
  var reply = {
    role:2,
    poster_id: req.user._id,
    post_time: new Date(),
    // need to assign urlTitle
    reply_to_post: (req.query.replyto)?req.query.replyto:null,
    reply_to_mainpost:req.query.qid,
    content: req.body.content,
    votes:0,
    stars:0
  };
  reply = new req.DB_POST(reply);
  reply.save( function (error){
    if (error) return next(error);
    // at current scope, reply is saved successfully 
    req.DB_POST.findOne({_id:reply.reply_to_mainpost}).exec(function (err, main_post){
      if (err) return next(err);
      if (!main_post) return next(new Error("Did not find this main_post"));
      main_post.addOneReply(reply._id, function onSave(err){
        if (err) return next(err);
        return res.redirect(glblprefix + '/qa/question?qid='+req.query.qid);
      });
    });
  });
});

/* TODO: destroy one post and its relationship in collection relationship*/
router.delete('/qa/edit_post', ensureAdmin, function (req, res, next){
  req.DB_POST.findOne({_id:req.query.post_id}).exec(function (err, target_post){
    target_post.destroy( function onDestroy(err, deleted_post_id){
      if (err) return next(err);
      if (!deleted_post_id) return next( new Error("System Error: delete reply failure"));
      res.json({api_result:"success", api_route:"/qa/edit_post", api_method:"DELETE", target_post: target_post.toJSON() } );

    });
  });
});

/**
* New question posted via this route
*/
router.post('/qa/posting', ensureAuthenticated, function (req, res, next){
  var currentDate = new Date();
  var newPost = {
    role:1,
    poster_id: req.user._id,
    post_cat:(req.body.post_cat)?parseInt(req.body.post_cat):1,
    post_title:req.body.title,
    url_title: req.DB_POST.genUrlTitle(req.body.title),
    post_time:currentDate,
    post_viewed:0,
    replied_post:0,
    votes:0,
    stars:0,
    content: req.body.content,
    replies: [],
  };
  newPost = new req.DB_POST(newPost);
  newPost.save( function (error){
    if (error) return next(error);
    return res.redirect(glblprefix + '/qa');
  });
});

/*render this posting page*/
router.get('/qa/posting', ensureAuthenticated,function (req, res, next){
  res.render('postquestion',{
    breadcrumTitle:"POST A NEW QUESTION",
    pathToHere:"qa / posting",
    title: 'QA POSTING | FASIDS',
    activePage:'Questions',
    isAuthenticated: req.isAuthenticated(),
    user: processReqUser(req.user)
  });
});

router.get('/qa/edit_post', ensureAuthenticated, function(req, res, next){
  if (!req.query.post_id){
    return next(new Error("post_id not found"));
  }
  req.DB_POST.findById(req.query.post_id, null, {}, function exec(error, post){
    if (error) {
      if (error.message.search('Cast to ObjectId failed') >=0){
        var new_error = new Error("could not find resource");
        new_error.status = 404;
        return next(new_error);
      }
      return next(error);
    }
    if (!post){
      var e = new Error("requested post could not be found");
      e.status = 404;
      return next(e);
    }
    res.render('postquestion',{
      breadcrumTitle:"EDIT POST",
      pathToHere:"qa / edit_post?post_id=" + req.query.post_id,
      title:"QA EDIT POST | FASIDS",
      activePage:"Questions",
      isAuthenticated: req.isAuthenticated(),
      user: processReqUser(req.user),
      to_be_edited_post:post
    });
  });
});

router.post('/qa/edit_post', ensureAuthenticated, function (req, res, next){
  if (!req.query.post_id){
    return next(new Error("post_id not found"));
  }
  req.DB_POST.findById(req.query.post_id, null, {}, function exec(error, post){
    if (error) return next(error);
    if (!post) {
      var not_found_error = new Error("could not find this post"); not_found_error.status =404;
      return next(not_found_error);
    }
    if (req.user._id.toString() === post.poster_id.toString() || req.user.usercat === 0){
      post.content = req.body.content;
      if (post.role == 1){post.post_title = req.body.title;}
    }
    else {
      var not_privileged = new Error("does not have access to this operation");
      not_privileged.status = 401;
      return next(not_privileged);
    }
    post.save(function (error){
      if (error) return next(error);
      if (post.role == 1)
        return res.redirect(glblprefix + '/qa/question?qid=' + post._id);
      else if (post.role == 2)
        return res.redirect(glblprefix + '/qa/question?qid=' + post.reply_to_mainpost);
    })
  });
});

/* ant activity */
router.get('/antactivity', function (req, res, next){
  res.render("antactivity",{
    isAuthenticated: req.isAuthenticated(),
    user: processReqUser(req.user),
    breadcrumTitle:"FIREANT ACTIVITY FORECAST",
    pathToHere:"antactivity",
    activePage:'Ants',
    momentlib:moment
  })
});

/*map applications */
router.get('/landscape/homeownermng', function (req, res, next) {
  res.render("landscape/homeownermng.jade",{
    title: 'Landscape Management Tool | FASIDS',
    isAuthenticated: req.isAuthenticated(),
    user: processReqUser(req.user),
    activePage:"Landscape",
    // geojson:{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-96.331601,30.620445],[-96.329026,30.620464],[-96.327932,30.617361],[-96.330378,30.616992],[-96.3307,30.617952],[-96.331601,30.620445]]]},"properties":{"bounds":{"sw":{"lat":30.616991994047623,"lng":-96.3316011428833},"ne":{"lat":30.620463592449177,"lng":-96.32793188095093}},"total_area":89814.46632613993,"environment_map":{"tilt":0,"MapTypeId":"roadmap"},"polygon_name":null,"address":null,"notes":null,"mound_density":null,"mound_number":null,"type_of_use":"home","control_method":null,"usage":null,"is_outdoor_land":null,"need_organic":null,"need_safe_for_pets":null}},
    page_status:{model_op:"create",isAuthenticated: req.isAuthenticated()}
  });
});

router.get('/landscape/homeownermng/:geojson_id', function (req, res, next){
  req.db_models.PolygonGeojson.findById(req.params.geojson_id, null,{}, function exec(error, the_polygon ){
    if (error) {
      if (error.message.search('Cast to ObjectId failed') >=0){
        var new_error = new Error("could not find resource");
        new_error.status = 404;
        return next(new_error);
      }
      return next(error);
    } 
    if (!the_polygon ) {
      var e = new Error("requested geojson could not be found");
      e.status = 404
      return next(e);
    }
    res.render('landscape/homeownermng.jade',{
      geojson:the_polygon,
      isAuthenticated: req.isAuthenticated(),
      user: processReqUser(req.user),
      page_status:{model_op:"patch", isAuthenticated: req.isAuthenticated()},
      patch_url: glblprefix + '/landscape/homeownermng/'+req.params.geojson_id+"/patch"
    }); 
  });  // end of findById()
});

// this is for ajax
router.delete('/landscape/homeownermng/:geojson_id' , ensureAuthenticated,function (req, res, next){
  var api_route = req.baseUrl +req.path;
  req.db_models.PolygonGeojson.findOne(  {_id: req.params.geojson_id}, null,{}, function execRemoval(error, the_polygon ){
    if (error) return next(error);
    if (!the_polygon) {
      var e = new Error("requested geojson could not be found");
      e.status = 404
      return res.json(e);
    }
    try {
      if (the_polygon.properties.owner.toString() === req.user._id.toString()) {
        the_polygon.remove(function onRemoval(error){
          if (error){
            return res.json(error);
          }
          res.json({
            api_result:"success : PolygonGeojson Deleted", 
            api_route:api_route, 
            jumpUrl:glblprefix + '/landscape/homeownermng'
          });
        });
      }
    } catch (error) {  // possibly field undefined
      error.status = 500;
      return res.json(error);
    }
  });
});

router.post('/landscape/homeownermng/:geojson_id/patch' ,ensureAuthenticated, function (req, res, next){
  var api_route = req.baseUrl +req.path;
  var geojson = req.body.geojson;
  if (typeof req.body.geojson == "string"){
    geojson = JSON.parse(geojson);
  }
  req.db_models.PolygonGeojson.findById(req.params.geojson_id, null,{}, function exec(error, the_polygon ){
    if (error) return next(error);
    if (!the_polygon){
      var e = new Error("requested geojson could not be found");
      e.status = 404
      return res.json(error);
    }
    if (the_polygon.properties.owner.toString() !== req.user._id.toString()){
      var e = new Error("is not authorized for requested resource: " +  the_polygon.properties.owner.toString() + "," +req.user._id );
      e.status = 401;
      return res.json(e);
    }
    _.each(_.keys(geojson), function (key_name, index, key_list){
      the_polygon[key_name] = geojson[key_name];
    });
    the_polygon.save( function(error){
      if (error) return res.status(500).json(error);
      // res.redirect(glblprefix + "/landscape/homeownermng/" + req.params.geojson_id);
      res.json({
        api_result:"success : PolygonGeojson Patched", 
        api_route:api_route, 
        jumpUrl:glblprefix + '/landscape/homeownermng/'+the_polygon._id.toString()
      });
    });
  });
});


// This url shows proper products
router.get('/landscape/treatment/:geojson_id', ensureAuthenticated, function (req, res, next){
  req.db_models.PolygonGeojson.findById(req.params.geojson_id, null,{}, function exec(error, the_polygon ){
    if (error) {
      if (error.message.search('Cast to ObjectId failed') >=0){
        var new_error = new Error("could not find resource");
        new_error.status = 404;
        return next(new_error);
      }
      return next(error);
    } 
    if (!the_polygon ) {
      var e = new Error("requested geojson could not be found");
      e.status = 404
      return next(e);
    }
    if( typeof the_polygon.properties.owner === "undefined" || the_polygon.properties.owner.toString() !== req.user._id.toString()){
      return res.status(401).send("you are not authorized to view other's polygon");
    }
    var query = routesHelpers.extractFireAntProductQueryFromGeojson(the_polygon);
    console.log("user generated treatment query:");
    console.log( query);
    req.db_models.FireAntProduct.find(query , null, {}, function exec(error, products){
      if (error) return next(error);
      products.forEach(function iteratee (product, index, al){
        var tempAmount = product.getAmount(the_polygon);
        products[index] = product.toObject();
        products[index]["amount"] = tempAmount; 
      });

      res.render('landscape/treatment.jade',{
        geojson:the_polygon,
        products: products,
        breadcrumTitle:"LAND TREATMENT",
        pathToHere:"landscape / treatment",
        isAuthenticated: req.isAuthenticated(),
        user: processReqUser(req.user)
      }); 
    }); // end of FireAntProduct.find()

  });  // end of findById()
});


// Responsible for Creation of PolygonGeojson model, this has been changed into one API function
router.post('/landscape/treatment', ensureAuthenticated, function (req, res,next){
  var api_route = req.baseUrl +req.path;
  var geojson = req.body.geojson;
  if (typeof req.body.geojson == "string"){
    geojson = JSON.parse(geojson);
  }
  // has already been done in front side
  // if (geojson.properties.treatment === 'imt') {
  //   geojson.properties.mound_density = req.db_models.PolygonGeojson.convertMoundDensityIntoMetric(geojson.properties.mound_density);
  // }

  geojson.properties.owner = req.user._id;
  var db_geojson = new req.db_models.PolygonGeojson(geojson);
  db_geojson.save( function ( error){
    if (error) {
      return res.status(500).json(error);  // TODO: the failure response is not json
    }
    res.json(
      {api_result:"success : PolygonGeojson created", api_route:api_route, jumpUrl:glblprefix + '/landscape/homeownermng/'+db_geojson._id.toString()}
    );
  });
});

/* this route is used to display products*/
router.get('/landscape/fire_ant_products', function(req, res, next){
  res.render("landscape/fire_ant_products.jade",{
    page_status:{isAuthenticated: req.isAuthenticated(), user: processReqUser(req.user)},
    isAuthenticated: req.isAuthenticated(),
    user: processReqUser(req.user)
  });
});

/*
  For Future developer, 
  The unfinished updating form and list is in fire_ant_products2.jade
*/
router.get('/landscape/fire_ant_products2/:productId?', ensureAdmin, function(req, res, next){
  var displayMode =  req.params.productId ? "edit":"list";
  res.render("landscape/fire_ant_products2.jade",{
    page_status:{
      isAuthenticated: req.isAuthenticated(), 
      user: processReqUser(req.user), 
      displayMode: displayMode,
      productId: req.params.productId
    },
    isAuthenticated: req.isAuthenticated(),
    user: processReqUser(req.user)
  });
});


// 11/12/2015 Add ant distribution map, this one should be one client side project
router.get('/landscape/antdistribution', function (req, res, next){
  // TODO: promise readFile 
  readJSON( './data/genus_species.json' , function (err, genus_species){
    if (err) return next(err);
    res.render( "landscape/antdistribution.jade", {
      genus_species    : genus_species,
      activePage       : "Landscape",
      isAuthenticated  : req.isAuthenticated(),
      user             : processReqUser(req.user),
    });
  });
});

/**
* This is one api for antdistribution
*/
router.get('/landscape/antdistribution_lookup', function (req, res, next){
  req.db_models.AntDistribution.findFIPSFromSpecie(req.query.genus, req.query.specie, function exec(err, ant_distributions){
    var tbr = {};
    _.each(ant_distributions, function(el, ind, arr){
      tbr[el._id] = el.count;
    });
    res.json(tbr);
  });

});


// 02/29/2016 
router.get('/landscape/instructions', function (req, res, next){
  res.render('landscape/instructions',{
    activePage       : "Landscape",
    isAuthenticated  : req.isAuthenticated(),
    user             : processReqUser(req.user)
  });
});

module.exports = router;
