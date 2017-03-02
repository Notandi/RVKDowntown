var express = require('express');
var router = express.Router();
var datamanagerModule = require('../models/dataManager');
var dataManager = new datamanagerModule();
dataManager.init();


//dataManager.updateBars();
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


// returns a list of barids
router.get('/api/ids', function(req, res, next){
  dataManager.getBarIds( (barids)=>{
    res.send(barids);
  });
});

/**
* Returns the bars related to the barids
*
* @param {int[]} req.body  - json object with the ids requested
*/
router.post('/api/bars',function(req, res, next){
  var ids = req.body;
  dataManager.getBars( ids, (bars) => {
      res.send(bars);
  });
});

module.exports = router;
