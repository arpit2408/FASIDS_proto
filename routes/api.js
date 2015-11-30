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
  console.log(tentative_relation);
  req.db_models.Relationship.addRelation(tentative_relation, function (err ,added_relation){
    if (added_relation) {
      switch (added_relation.operation.operation_name ) {
        case "vote":
          req.DB_POST.findOne({post_id: added_relation.operation_receiver_id}, function (err, post){
            post.votes = post.votes + added_relation.operation.operation_value;
            post.save( function (err){
              if (err) return res.status(500).json({api_result:"error : " + JSON.stringify(err), api_route:"/api/addrelation"});
              console.log(post.post_id + " : votes," + post.votes);
            });
          });
          break;
        default:
      }     

      res.json({api_result:"success", api_route:"/api/addrelation"});
    }

    else {
      res.status(500).json({api_result:"error : " + err.message, api_route:"/api/addrelation"});
    }
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