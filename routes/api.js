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

apirouter.get("/delrelation", APIEnsureAuthenticated, function (req, res, next){
  var query = {operater_id: req.query.operater_id, operation_receiver_id: req.query.operation_receiver_id, "operation.operation_name" : req.query.operation_name};
  req.db_models.Relationship.findOneAndRemove(query, function exec (err, relation_to_be_removed){
    if (err) return res.status(500).json({api_result:"error : " + err.message, api_route:"/api/delrelation"});
    if (!relation_to_be_removed){
      return res.status(404).json({api_result:"error : cannot find queried relation", api_route:"/api/delrelation"});
    }
    req.DB_POST.offsetRelation(relation_to_be_removed, function (err, updated_value){
      if (err){
        return res.status(500).json({api_result:"error : " + err.message, api_route:"/api/delrelation"});
      }
      res.json({api_result:"success", api_route:"/api/delrelation", updated_value: updated_value});
    });
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
    if (err) return res.status(500).json({api_result:"error : " + err.message, api_route:"/api/addrelation"});
    if (!added_relation) {
      return res.status(500).json({api_result:"error : cannot create new relation", api_route:"/api/addrelation"});
    }    
    req.DB_POST.handleNewRelation(added_relation, function (err, updated_value){
      if (err){
        return res.status(500).json({api_result:"error : " + err.message, api_route:"/api/addrelation"});
      }
      res.json({api_result:"success", api_route:"/api/addrelation", updated_value: updated_value});
    }); 
  });
});
apirouter.post("/batchlookuprelation", APIEnsureAuthenticated, function (req, res, next){
  var query_operation_receivers =  JSON.parse(req.body.query_operation_receivers);
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


apirouter.get('/lookupuser', function(req, res, next){
  var targetUser = req.query.targetuser;
  var api_route = req.baseUrl +req.path;
  if (!targetUser){  // in  valid user
    res.status(404).json({api_result:"error: invalid targetuser query", api_route:api_route});
    return;
  }
  req.DB_USER.findOne({email: targetUser}, function queryCallBack(err, user){
    if (err) return res.status(500).json({api_result:"error : " + err.message, api_route: api_route});
    if (!user) return res.json({ api_result:"success : no such user" , api_route: api_route});  // major reason i think it success is that this api is used for confliction preventing
    var toBeOutputUser = user.toObject();
    delete toBeOutputUser.password_hash;
    return res.json({api_result:"success : found user", api_route:api_route, user:toBeOutputUser});
  });
});


apirouter.get("/fire_ant_products", function (req, res, next) {
  var api_route = req.baseUrl +req.path;
  req.db_models.FireAntProduct.find({},null,{}, function exec(err, products) {
    if (err) {
      return res.status(500).json({api_result:"error : " + err.message, api_route: api_route});
    }
    products = _.map(products, function (product) {
      return product.toObject();
    });
    res.json(products);
  });
});


module.exports = apirouter;