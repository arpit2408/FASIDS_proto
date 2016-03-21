var mailer = require('express-mailer');
const assert = require('assert');
// for maintainer of this piece of code, 
// if you are using this application under IISNODE, please find environment variables at C:\Program Files\iisnode\www\fasids\web.xml  
// Environment variables are stored at <appSettings>
// If you started this application using start_app.sh or start_app.bash,
// please find environment variables in start scripts
var EMAIL_ACCOUNT = process.env.EMAIL_ACCOUNT;
var EMAIL_PASS = process.env.EMAIL_PASS;
assert(typeof EMAIL_ACCOUNT === "string", "email account might not be set");
assert(EMAIL_ACCOUNT.length > 0, "email account string should not be empty string");
assert(typeof EMAIL_PASS === "string","email pass might not be set" );
assert(EMAIL_PASS.length > 0, "email pass should not be empty string.");
exports.extend = function (app){
  mailer.extend(app, {
    from:EMAIL_ACCOUNT,
    host:"smtp.gmail.com",
    secureConnection:true,
    port:465,
    transportMethod:'SMTP',
    auth:{
      user:EMAIL_ACCOUNT,
      pass:EMAIL_PASS
    }
  });
  return app;
}