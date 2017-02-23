
var dataManager = function() {
  var self = this;
  var databaseInterfaceModule = require('./pg_dbInterface');
  var databaseInterface = new databaseInterfaceModule();


 /**
 * Gets all of the bar ids
 *  
 * @param {callback} handleData - delivers the bar_ids
 */
  self.getBarIds = function(handleData){
    
    function deliverBarIds(bar_ids){
      console.log(bar_ids);
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
 * @param {object} bar - Information about the bar
 */
  self.updateBar = function(bar) {
    databaseInterface.updateBar(bar);
  };

};



module.exports = dataManager;