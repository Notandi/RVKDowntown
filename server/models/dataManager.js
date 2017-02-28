
var dataManager = function() {
  var self = this;
  var databaseInterfaceModule = require('./pg_dbInterface');
  var databaseInterface = new databaseInterfaceModule();
  var barGetterModule = require('./barGetter');
  var barGetter = new barGetterModule(databaseInterface);
  var fbManager = require('./fbManager');

  fbManager();
  
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

    //fbManager.init();
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


  self.reformatObject = function(type, obj) {
    if(type === 'bars')
    {
      var bars = [];
      for(var i = 0; i<obj.length; i++)
      {
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

          k++
        }

        var bar = {
          name : obj[i].name,
          opens : JSON.stringify(opens),
          closes : JSON.stringify(closes),
          
        }

      }

    }


  };
  
  /**
  * Updates all of the bars with events
  * 
  */
  self.updateEvents = function() {
    function insertEvents(events){
      for(property in events){
        for(var i = 0; i<events[property].length; i++){
          self.addEvent(events[property][i],property);
        }
      }
    }
    fbManager.updateEvents(insertEvents);
  };


 /**
 * Updates all of the bars
 * 
 */
  self.updateBars = function() {
    function updateBars(bars){
      for(var property in bars)
      {
        var bar = {};
        bar[name] = property;
        for(var element in bars[property])
        {
          bar[element] = bars[property][element];
        }
        self.updateBar(bar);
      }
    }

    fbManager.updateBars(updateBars);
    self.updateEvents();
  };

};



module.exports = dataManager;