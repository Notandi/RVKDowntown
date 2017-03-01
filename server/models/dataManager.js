
var dataManager = function() {
  var self = this;
  var databaseInterfaceModule = require('./pg_dbInterface');
  var databaseInterface = new databaseInterfaceModule();
  var barGetterModule = require('./barGetter');
  var barGetter = new barGetterModule(databaseInterface);
  var fbManagerModule = require('./fbManager');
  var fbManager = new fbManagerModule();

  
  
   /**
   * Fills the database with bars if it is empty
   *  
   */ 
  self.init = function(){
    function loadData(bar_ids)
    {
      if(bar_ids.length === 0) barGetter.loadInitialBarData();
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
    function insertEvents(events){
      console.log('CONSOLE LOGGING EVENTS!!');
      //console.log(events);
      console.log('events length: ' + events.length);

      for(var i = 0; i<events.length; i++){
        for(var k = 0; events[i].length; k++)
        {
          if(!dateHasPassed(events[k].endTime))
          {
            self.addEvent(events[k],events[k].name);
          }
        }
      }
    }
    fbManager.update('events',insertEvents);
    self.removeExpiredEvents();
  };

 /**
 * Updates all of the bars
 * 
 */
  self.updateBars = function() {
    function updateBars(bars){
      function handleBarIds(bar_ids)
      {
        function handleBars(db_bars)
        {

          for(var i = 0; i<bars.length; i++)
          {
            self.updateBar(parseObject(bars[i]));
            db_bars.slice(barIndice(db_bars,bars[i].name));
          }

          for(var k = 0; k<db_bars.length; k++)
          {
            databaseInterface.deleteBar(db_bars[k].name);
          }

        }
        databaseInterface.getBars(handleBars,bar_ids);
      }
      databaseInterface.getBarIds(handleBarIds);
      
    }

    //fbManager.updateBars(updateBars);
    self.updateEvents();
  };

 /**
 * Removes all expired events
 * 
 */
  self.removeExpiredEvents = function() {
    function deliverData(events){
      for(var i = 0; i<events.length; i++)
      {
        if(dateHasPassed(events[i].endTime))
        {
          databaseInterface.removeEvent(events[i].link);
        }
      }
    }
    databaseInterface.getEvents(deliverData);

  };

    /* *** PRIVATE FUNCTIONS *** */

  /**
  * Check if a date has passed
  * 
  * @param {string} date - The date you want to check for
  * @returns {boolean} - Returns whether date has passed or not
  */
  function dateHasPassed(date) {
    var dateTime = Date.parse(date);
    var currentDate = new Date();
    var currentTime = currentDate.getTime();

    return dateTime > currentTime;
  };

  /**
  * Finds the indice of the bar object 'bar' in db_bars
  * 
  * @param {array} db_bars - Array of bars retreived from the databse
  * @param {string} - The name of the bar to find
  */
  function barIndice(db_bars,bar){
    for(var i = 0; i<db_bars.length; i++)
    {
      if(db_bars[i].name === bar)
      {
        return i;
      }
    }

    return -1;
  };

    /**
 * Parses a bar object so that it can be inserted into the database 
 *  
 * @param {object} obj - The bar object that is to be parsed
 */
   function parseObject(obj) {

    
    var opening_hours = obj[i].opening_hours;
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
      name : name,
      opens : JSON.stringify(opens),
      closes : JSON.stringify(closes),
      image: obj.cover.source,
      description: obj.about,
      link : obj.link,
    }

    return bar;

  };

};






module.exports = dataManager;