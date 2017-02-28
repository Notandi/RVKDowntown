var express = require('express');
var router = express.Router();
var datamanagerModule = require('../models/dataManager');
var dataManager = new datamanagerModule();
dataManager.init();
//var barGetterModule = require('../models/barGetter');
//var barGetter = new barGetterModule();

//name,menu,image,coords,link,description,rating
/*
var bar = {
	name: 'austur',
	menu: 'fullt af drykkjum driiiininnknkkkkkkk fyrir alla nog af drykkjum',
	description : 'flott og geðveikt snilld gott',
}

dataManager.updateBar(bar);
*/

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
