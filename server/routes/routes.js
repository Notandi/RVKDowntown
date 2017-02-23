var express = require('express');
var router = express.Router();
var datamanagerModule = require('../models/dataManager');
var dataManager = new datamanagerModule();

/*
function sendToClient(bars)
{
	console.log(bars[0].events);
}

dataManager.getBars([1,2],sendToClient);
*/

/*
var bar = 'austur';
var event = 
{
	name : 'hundaveisla',
	venue : 'austur',
	link : 'fb.com/event?=hundaveisla',
	description : 'skemmtileg veisla fyrir hunda',
	startTime :'13:37 GMT +00',
	endTime : '17:00 GMT +00',
}
*/

//dataManager.addEvent(event,bar);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/api/ids', function(req, res, next){
  /*var ids = dataManager.getBarIds();
  res.send(ids);*/
});

router.post('/api/bars',function(req, res, next){
  /*var idString = req.body.ids;
  console.log(req.body);
  var response = dataManager.getBars( idString );
  res.send(response);*/
});

module.exports = router;
