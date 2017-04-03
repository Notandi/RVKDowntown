var fbManager = function() {
  var FB = require('fb');
  var fs = require('fs');
  var self = this;
  var accessToken;

  let countResponseEvents = 0;
  let countResponseBars = 0;

  // Authorization fyrir Graph API
  self.update = function(type, callback) {
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
      // Sets the new accesstoken.
      FB.setAccessToken(accessToken);
      
  	  if(type == 'events') {
  	  	self.fetchEvents(callback)
  	  } else if('bars') {
        self.fetchBars(callback)
  	  }
    });
  }
  

  //Calls Facebook Graph Api and gathers information into an array
  self.fetchEvents = function(callback) {
    let barList = fs.readFileSync('./bar_pages.txt').toString().split('\n');
    
    let barInfo = [];
    let events = [];
    var searchQuery;
    var fields = {"fields":"events{start_time,end_time,id,name,attending_count}"}

    for(var i = 0; i<barList.length; i++){
      barList[i] = barList[i].replace(/\r/, "");
      barInfo[i] = barList[i].split(':');
      let fbBarName = barInfo[i][0];
      searchQuery = '/' + barInfo[i][1];
      
      //Graph API request
      FB.api(searchQuery, 'GET', fields, function(res) {
  	    countResponseEvents++;
        // if(!res || res.error) {
          //console.log(!res ? 'error occurred' : res.error);
        // }

        var bar = []
        if(res.events !== undefined) {
  	      for(var i = 0; i<res.events.data.length; i++) {
            bar.push({
              name : res.events.data[i].name,
              link : 'https://www.facebook.com/events/' + res.events.data[i].id,
              guests : res.events.data[i].attending_count,
              startTime : res.events.data[i].start_time,
              endTime : res.events.data[i].end_time,
              venue : fbBarName,
            });
          }
        }
        events.push({
          name: fbBarName,
          events: bar
        })
        //When all responses have been recieved we make the callback.
        if(countResponseEvents >= barList.length) {          
          callback(events);
        }
      });
    }
  }
  

  //Calls Facebook Graph Api and gathers information into an array
  self.fetchBars = function(callback) {
  	let fields = {"fields":"about,description,hours,cover"};

    //Read text file which contains bar names
    let barList = fs.readFileSync('./bar_pages.txt').toString().split('\n');
    let barInfo = [];
    let barDetails = [];
    let searchQuery;

    for(var i = 0; i < barList.length; i++) {
      barList[i] = barList[i].replace(/\r/, "");
      barInfo[i] = barList[i].split(':');
      let fbBarName = barInfo[i][0];
      searchQuery = '/' + barInfo[i][1];
      
      //Graph API request
      FB.api(searchQuery, 'GET', fields, function(response) {
      	// if(!res || res.error) {
          //console.log(!res ? 'error occurred' : res.error);
        // }



        let coverPic = undefined;
        let fbLink = undefined;
        if(response.id !== undefined) fbLink = 'https://www.facebook.com/'+response.id;
        if(response.cover!= undefined) coverPic = response.cover.source;
        barDetails.push({
        	name: fbBarName,
          about: response.about,
        	description: response.description,
        	opening_hours: response.hours,
        	cover: coverPic,
          link: fbLink,
        });
        console.log('this is our link at this point: ', barDetails[countResponseBars].link);
        countResponseBars++
        //When all responses have been recieved we call the callback.
        if(countResponseBars >= barList.length) {    
          console.log('finished with this count: ' + countResponseBars);
          callback(barDetails);
        }
      });
    }
  }
}


module.exports = fbManager;