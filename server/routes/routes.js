const express = require('express');
const router = express.Router();
const datamanagerModule = require('../models/dataManager');
const dataManager = new datamanagerModule();
const NanoTimer = require('nanotimer');
const timer = new NanoTimer();
const updateInterval = '21600s';
//const testInterval = '5s';
dataManager.fetchData();
initializeUpdatingSchedule();



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
  if(ids.constructor === Array)
  {
  	dataManager.getBars( ids, (bars) => {
      res.send(bars);
  });

  }
  
});


/**
* Updates the bars and events information every 6 hours
*
*/
function initializeUpdatingSchedule()
{
	timer.setInterval((function() {dataManager.fetchData();}), '', updateInterval);
}



module.exports = router;
