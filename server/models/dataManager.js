
var dataManager = function() {
  var self = this;
  var databaseInterfaceModule = require('./pg_dbInterface');
  var databaseInterface = new databaseInterfaceModule();
  var googleManagerModule = require('./googleManager');
  var googleManager = new googleManagerModule(databaseInterface);
  var fbManagerModule = require('./fbManager');
  var fbManager = new fbManagerModule();

  
   /**
   * Fills the database with bars if it is empty
   *  
   */ 
  self.fetchData = function(){    
    function loadData(bar_ids)
    {
      if(bar_ids.length === 0) googleManager.loadInitialBarData(self.updateBars);
      else self.updateBars();
    }
    self.getBarIds(loadData);
  };


 /**
 * Gets all of the bar ids
 * 
 * @param {callback} handleData - delivers the bar_ids
 */
  self.getBarIds = function(handleData){
    
    function deliverBarIds(bar_ids){
      handleData(bar_ids);
    }
    databaseInterface.getBarIds(deliverBarIds);
  };


 /**
 * Gets a number of bars equal to the length of bar_ids
 *
 * @param {int[]} bar_ids  - ids of the bars to be fetched
 * @param {callback} handleData - handles the bars data
 */
  self.getBars = function(bar_ids, handleData){
    function deliverBars(bars){
      
      handleData(bars);
    }

    databaseInterface.getBars(deliverBars,bar_ids);
  };


 /**
 * Adds a event to a bar 
 * 
 * @param {object} event - Event information
 * @param {string} bar - Bar name
 */
  self.addEvent = function(event, bar) {
    databaseInterface.insertEvent(event,bar);
  };

 /**
 * Adds a bar to the database
 *  
 * @param {object} bar - Information about the bar
 */
  self.addBar = function(bar) {
    databaseInterface.insertBar(bar);
  };

  /**
 * Updates a bars information 
 *  
 * @param {object} bar - Information about the bar, *needs* to contain a name property
 */
  self.updateBar = function(bar) {
    databaseInterface.updateBar(bar);
  };

  /**
  * Updates all of the bars with events
  * 
  */
  self.updateEvents = function() {
    console.log('MADE IT TO UPDATE EVENTS');
    function insertEvents(bars){
      
      function handleBarIds(bar_ids)
      {
        function addEvents(db_bars)
        {          
          for(var i = 0; i<bars.length; i++)
          {
            for(var k = 0; k<bars[i].events.length; k++)
            {
              if(!dateHasPassed(bars[i].events[k]))
              {
                self.addEvent(bars[i].events[k],bars[i].name);
              }
            }
          }
        }
        databaseInterface.getBars(addEvents,bar_ids);
      }
      databaseInterface.getBarIds(handleBarIds);

    }
    self.removeExpiredEvents();
    fbManager.update('events',insertEvents);    
  };

  /**
  * Removes bars from the database that are not listed in the text file, these are places that were originally received from google
  * and are either not bars or were just removed from the text file for other reasons
  *
  * @param {array} bars - contains the bars that are listed in the text file
  * @param {array} db_bars - contains the bars that are in the database
  */
  /*function removeOldBars(bars,db_bars){

    var missingBarsInDb = [];          
    for(var i = 0; i<bars.length; i++)
    {
      var indice = barIndice(db_bars,bars[i].name);
      if(indice < 0) //Found a object that exists in text file but not database
      {
        missingBarsInDb.push(bars[i].name);
        bars.splice(i,1);
        i--;
      }

      else
      {
        db_bars.splice(indice,1);              
      }
      
    }

    //console.log('these are the bars that are missing in the database: ', missingBarsInDb);
    //console.log('these are the bars that are about to be removed from the database', db_bars);

    //Deleting all bars that were not in the txt file but were in the database
    for(var k = 0; k<db_bars.length; k++)
    {
      databaseInterface.deleteBar(db_bars[k].name);
    }

  };*/

 /**
 * Updates all of the bars with information from facebook and removes bars from the database that were not in the txt file
 * 
 */
  self.updateBars = function() {
    function updateBars(bars){
      function handleBarIds(bar_ids)
      {
        function handleBars(db_bars)
        {

          //removeOldBars(bars,db_bars);

          for(var i = 0; i<bars.length; i++)
          {
            self.updateBar(parseObject(bars[i]));
          }

        }
        databaseInterface.getBars(handleBars,bar_ids);
      }
      databaseInterface.getBarIds(handleBarIds);
      
    }

    
    fbManager.update('bars',updateBars);
    googleManager.updateRatings();
    self.updateEvents();
  };

 /**
 * Removes all expired events
 * 
 */
  self.removeExpiredEvents = function() {
    console.log('called removeExpiredEvents');
    function deliverData(events){
      for(var i = 0; i<events.length; i++)
      {
        if(dateHasPassed(events[i]))
        {
          databaseInterface.deleteEvent(events[i].link);
        }
      }
    }
    databaseInterface.getEvents(deliverData);

  };

    /* *** PRIVATE FUNCTIONS *** */

  /**
  * Check if a event has passed
  * 
  * @param {string} event - The event you want to check for
  * @returns {boolean} - Returns whether event has passed or not
  */
  function dateHasPassed(event) {
    var endTime = event.endTime;
    if(endTime === undefined || event.endTime === '')
    {
      if(event.startTime === undefined)
      {
        endTime = 0;
      }
      else
      {
        endTime = Date.parse(event.startTime);
      }      
    }

    else
    {
      endTime = Date.parse(endTime);
    }

    var currentDate = new Date();
    var currentTime = currentDate.getTime();    

    return endTime < currentTime;
  };

  /**
  * Finds the indice of the bar object 'bar' in db_bars
  * 
  * @param {array} db_bars - Array of bars retreived from the databse
  * @param {string} - The name of the bar to find
  *
  * @returns {integer} - Returns the indice of the bar object or -1 if it was not found
  */
  /*function barIndice(db_bars,bar){
    for(var i = 0; i<db_bars.length; i++)
    {
      if(db_bars[i].name === bar)
      {
        return i;
      }
    }

    return -1;
  };*/

    /**
 * Parses a bar object so that it can be inserted into the database 
 *  
 * @param {object} obj - The bar object that is to be parsed
 */
   function parseObject(obj) {

    
    var opening_hours = obj.opening_hours;
    var opens = {};
    var closes = {};

    var k = 2;
    for(property in opening_hours)
    {
      if(k%2 === 0)
      {
        opens[property] = opening_hours[property];                        
      }
      else
      {
        closes[property] = opening_hours[property];
      }

      k++;
    }

    var bar = {
      name : obj.name,
      opens : JSON.stringify(opens),
      closes : JSON.stringify(closes),
      image: obj.cover,
      description: obj.about,      
      about: obj.about,
      link: obj.link,
    }

    return bar;

  };

};






module.exports = dataManager;