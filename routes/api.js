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
  var tentative_relation = req.body.tentative_relation;
  req.db_models.Relationship.addRelation(tentative_relation, function (added_relation){
    if (addrelation)
      res.json({api_result:"success", api_route:"/api/addrelation"});
    else
      res.status(500).json({api_result:"error", api_route:"/api/addrelation"});
  })
});

apirouter.get("/getrelation", APIEnsureAuthenticated, function (req, res, next ){
  var Relationship = req.db_models.Relationship;
  Relationship.getRelation(req.query.operater_id, req.query.operation_receiver_id, function (err, relation){
    if (err) return res.status(500).json({api_result:"error : get relation DB query error", api_route:"/api/getrelation"});
    if (!relation) return res.json({api_result:"success : no relation", api_route:"/api/getrelation"});
    else return res.json({api_result:"success : found relation", api_route:"/api/getrelation", relation: relation.toObject()});
  });
});

