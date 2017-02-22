var express = require('express');
var router = express.Router();
var dm = require('../models/datamanager');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/api/ids', function(req, res, next){
  var ids = dm.getBarIds();
  res.send(ids);
});

router.post('/api/bars',function(req, res, next){
  var idString = req.body.ids;
  console.log(req.body);
  var response = dm.getBars( idString );
  res.send(response);
});

module.exports = router;
