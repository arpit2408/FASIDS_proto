// routesHelpers.js, this file stores some commonly used helper functions used in routes file
var glblprefix = process.env.GLOBALPREFIX ||"";
exports.glblprefix = process.env.GLOBALPREFIX ||"";
exports.processReqUser = function ( req_user){  
  if (req_user) var temp_user = req_user.toObject();
  else return null;
  temp_user.display_name = req_user.displayName();
  delete temp_user.password_hash; 
  return temp_user;
};

exports.APIEnsureAuthenticated = function (req, res, next, group) {
  if (typeof group === "undefined" || group == null ) {
    group = [0,1,2,3,4,5,6];  // it just means all group okay
  }
  if (req.isAuthenticated() && group.indexOf(req.user.usercat) >= 0 ) {
    next();
  } else {
    return res.status(401).json( {api_result:"error : not authorized", api_route: req.baseUrl +req.path});
  }
};
// once the argument number is not correct, this authentication middleware function will not be even invoked
exports.ensureAuthenticated = function (req, res, next) {
  // if (typeof group === "undefined" || group == null ) {
  //   group = [];  // it just means all group okay
  // }
  switch (req.method){
    case "GET":
      // console.log("hehe");
      if (!req.isAuthenticated() ) {
        res.redirect(glblprefix + "/users/signin?referral_url=" +  encodeURIComponent(req.originalUrl) );
        return;
      }
    break;
    default:
      // console.log("haha");
      if (!req.isAuthenticated()) {
        var nonGETnotAuthorizedError = new Error("HTTP non-GET request not authorized ");
        nonGETnotAuthorizedError.status = 401;
        next(nonGETnotAuthorizedError);
        return; 
      }
  }
  return next();
};

exports.ensureGroup = function (req, res, next, group){
  // I have to supply group thru scope bound outside, I have to figure out a better way
  if (typeof group === "undefined" || !Array.isArray(group)) {
    group = [0,1,2,3,4,5]; 
    console.error("[ERROR] ensureGroup's scope is not allowed-group array");
  }
  switch (req.method){
    case "GET":
      if (!req.isAuthenticated()  || group.indexOf(req.user.usercat) < 0 ) {
        res.redirect(glblprefix + "/users/signin?referral_url=" + encodeURIComponent(req.originalUrl) );
        return;
      }
    break;
    default:
      if (!req.isAuthenticated() || group.indexOf(req.user.usercat) <0 ) {
        var nonGETnotAuthorizedError = new Error("HTTP non-GET request not authorized, access level not matched ");
        nonGETnotAuthorizedError.status = 401;
        next(nonGETnotAuthorizedError);
        return; 
      }
  }
  return next();
};

exports.isValidPassword = function (toBeTestedPass) {
  if (!toBeTestedPass) return false;
  if (typeof toBeTestedPass !== "string") return false;
  if (toBeTestedPass.length <6 || toBeTestedPass.length >16) return false;
  return true;
};

/*
{
  type_of_uses: String,   // the field in fire_ant_product is String[], while the field(type_of_use) in polygon_geojson is String
  is_outdoor: Boolean,
  is_organic: Boolean,
  is_safe_for_pets: Boolean,
  control_method: String,
  usage: String
}
*/
exports.extractFireAntProductQueryFromGeojson = function (geoJson) {
  var query = {};
  var falseThenDeleteFields = ["is_outdoor", "is_organic", "is_safe_for_pets"];
  var polygonGeojsonPropFields = [
    "type_of_use","is_outdoor", 
    "need_organic", "need_safe_for_pets", 
    "control_method", "usage"
  ];
  var fireAndProductPropFields = [
    "type_of_uses","is_outdoor", 
    "is_organic", "is_safe_for_pets",
    "control_method", "usage"
  ];
  polygonGeojsonPropFields.forEach(function (keyName, idx){
    if (geoJson.properties[keyName]) {
      query[fireAndProductPropFields[idx]] = geoJson.properties[keyName];
      if ( falseThenDeleteFields.indexOf(fireAndProductPropFields[idx]) >-1 &&  query[fireAndProductPropFields[idx]] === false ) {
        delete  query[fireAndProductPropFields[idx]];
      }
    }
  });
  return query;
};