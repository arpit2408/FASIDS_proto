var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { 
    title: 'FASIDS',
    activePage:'Home'
  });
});

router.get('/questions', function (req, res, next){
  res.render('qa', {title:'Question and Answers | FASIDS',
    activePage:'Questions'
  });
});

module.exports = router;
