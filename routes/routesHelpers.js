// routesHelpers.js, this file stores some commonly used helper functions used in routes file
var glblprefix = (process.env.NONEIISNODE) ? "":"/node/fasids";
exports.processReqUser = function ( req_user){  
  if (req_user) var temp_user = req_user.toObject();
  else return null;
  temp_user.display_name = req_user.displayName();
  delete temp_user.password_hash; 
  return temp_user;
}

exports.ensureAuthenticated = function (req, res, next) {
  switch (req.method){
    case "GET":
      if (!req.isAuthenticated()) {
        res.redirect(glblprefix + "/users/signin?referral_url=" + req.originalUrl );
        return;
      }
    break;
    default:
      if (!req.isAuthenticated()) {
        var nonGETnotAuthorizedError = new Error("HTTP non-GET request not authorized ");
        nonGETnotAuthorizedError.status = 401;
        next(nonGETnotAuthorizedError);
        return; 
      }
  }
  return next();
}
