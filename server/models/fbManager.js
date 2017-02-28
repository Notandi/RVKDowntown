var fbManager = function() {
var FB = require('fb');
var fs = require('fs');
// var fb = new FB.Facebook(options);
var self = this;
var accessToken;


  self.getToken = function(updateFunction) {
  	FB.api('oauth/access_token', {
      client_id: '1420581601306358',
      client_secret: '8541674ba53825710b3bf2486aadb4d0',
      grant_type: 'client_credentials'
    }, function (res) {
      if(!res || res.error) {
        console.log(!res ? 'error occurred' : res.error);
        return;
      }
 
      accessToken = res.access_token;
      FB.setAccessToken(accessToken);
      console.log("accesstoken:");
      console.log(accessToken);
      updateFunction()
    });
  
  }

  self.updateEvents = function(){
    
    

  }



  self.fetchEvents = function(insertEvents) {
  	FB.api('/austurclub', 'GET', {"fields":"events"}, function(res) {
      if(!res || res.error) {
        console.log(!res ? 'error occurred' : res.error);
        return;
      }
      console.log(res.id);
      console.log(res.name);
      console.log(res.events.data);
    });
  }
  
}


module.exports = fbManager;