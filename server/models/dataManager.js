
var dataManager = function() {
  var self = this;
  var databaseInterfaceModule = require('./pg_dbInterface');
  var databaseInterface = new databaseInterfaceModule();

  self.getBarIds = function(){
    
    function deliverBarIds(bar_ids){
      console.log(bar_ids);
    }

    databaseInterface.getBarIds(deliverBarIds);
  }

  self.getBars = function(bar_ids){
    function deliverBars(bars){
      console.log(bars);
    }

    databaseInterface.getBars(deliverBars,bar_ids);
  }


};



module.exports = dataManager;