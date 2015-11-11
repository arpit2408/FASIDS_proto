var mailer = require('express-mailer');

exports.extend = function (app){
  mailer.extend(app, {
    from:"email.kelbees@gmail.com",
    host:"smtp.gmail.com",
    secureConnection:true,
    port:465,
    transportMethod:'SMTP',
    auth:{
      user:'email.kelbees@gmail.com',
      pass:'kelbee$123'
    }
  });
  return app;
}