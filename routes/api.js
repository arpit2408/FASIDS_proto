var apirouter = require('express').Router();
var _ = require('underscore');
var Promise = require('promise');

function processReqUser ( req_user){  
  if (req_user) var temp_user = req_user.toObject();
  else return null;
  temp_user.display_name = req_user.displayName();
  delete temp_user.password_hash; 
  return temp_user;
}

function APIEnsureAuthenticated (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    return res.status(401).json( {api_result:"error : not authorized", api_route:"/api"});
  }
}


apirouter.get("/delrelation", APIEnsureAuthenticated, function (req, res, next){
  var query = {operater_id: req.query.operater_id, operation_receiver_id: req.query.operation_receiver_id};
  req.db_models.Relationship.findOneAndRemove(query, function exec (err, relation_to_be_removed){
    if (err) return res.status(500).json({api_result:"error : " + err.message, api_route:"/api/delrelation"});
    if (!relation_to_be_removed){
      return res.status(404).json({api_result:"error : cannot find queried relation", api_route:"/api/delrelation"});
    }
    switch (relation_to_be_removed.operation.operation_name){
      case "vote":
        req.DB_POST.offsetRelation( relation_to_be_removed, function (err, new_votes){
          if (err){
            return res.status(500).json({api_result:"error : " + err.message, api_route:"/api/delrelation"});
          }
          res.json({api_result:"success", api_route:"/api/delrelation", api_new_votes: new_votes});
        });
        break;
      default:
        res.json({api_result:"error : unrecognized api operation", api_route:"/api/delrelation"});
    }
  });
});

// all routes after (/api)
apirouter.post("/addrelation", APIEnsureAuthenticated, function (req, res, next){
  
  var tentative_relation = {
    operation_receiver_id:req.body.operation_receiver_id,
    operater_id:req.body.operater_id,
    operation:{
      operation_name:req.body.operation_name,
      operation_value:req.body.operation_value
    }
  };
  req.db_models.Relationship.addRelation(tentative_relation, function (err ,added_relation){
    if (added_relation) {
      switch (added_relation.operation.operation_name ) {
        case "vote":
          req.DB_POST.findOne({post_id: added_relation.operation_receiver_id}, function (err, post){
            post.votes = post.votes + added_relation.operation.operation_value;
            post.save( function (err){
              if (err) return res.status(500).json({api_result:"error : " + err.message, api_route:"/api/addrelation"});
              console.log(post.post_id + " : votes," + post.votes);
              res.json({api_result:"success", api_route:"/api/addrelation", api_new_votes: post.votes});
            });
          });
          break;
        default:
          res.json({api_result:"error : unrecognized api operation", api_route:"/api/addrelation"});
      }     
      
    }
    else {
      res.status(500).json({api_result:"error : " + err.message, api_route:"/api/addrelation"});
    }
  });
});
apirouter.post("/batchlookuprelation", APIEnsureAuthenticated, function (req, res, next){
  var query_operation_receivers =  JSON.parse(req.body.query_operation_receivers);
  console.log(query_operation_receivers);
  // res.status(500).json({api_result : "error", api_route:"/api/batchlookuprelation"});
  req.db_models.Relationship.find({
    operater_id: req.body.query_operater_id,
    operation_receiver_id: {$in: query_operation_receivers}
  }).exec(function (err , relations){
    var i =0, len = relations.length;
    for (; i < len; i++){
      relations[i] = relations[i].toObject();
    }
    return res.json(relations);
  });
});

/*
{
  ...
  operater_id: xxxxxx,
  operation_receiver_id:xxxx
  ...
}
*/
apirouter.get("/getrelation", APIEnsureAuthenticated, function (req, res, next ){
  var Relationship = req.db_models.Relationship;
  Relationship.getRelation(req.query.operater_id, req.query.operation_receiver_id, function (err, relation){
    if (err) return res.status(500).json({api_result:"error : get relation DB query error", api_route:"/api/getrelation"});
    if (!relation) return res.json({api_result:"success : no relation", api_route:"/api/getrelation"});
    else return res.json({api_result:"success : found relation", api_route:"/api/getrelation", relation: relation.toObject()});
  });
});

module.exports = apirouter;