var fbManager = function() {
  var FB = require('fb');
  var fs = require('fs');
  // var fb = new FB.Facebook(options);
  var self = this;
  var accessToken;

  let countCallsEvents = 0;
  let countResponseEvents = 0;
  let countResponseBars = 0;

  
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
      FB.setAccessToken(accessToken);
      console.log("accesstoken:");
      //console.log(accessToken);
      // updateFunction();
      // self.fetchEvents(function(response) {
      // 	console.log(response);
      // });
  	  if(type == 'events') {
  	  	self.fetchEvents(callback)
  	  } else if('bars') {
        self.fetchBars(callback)
  	  }
  	  
    });
  }
  

  //Sækir events
  self.fetchEvents = function(callback) {
    console.log('MADE IT TO FETCH EVENTS');
  	let barList = fs.readFileSync('./bars4.txt').toString().split('\n');
    let barInfo = [];
    let events = [];
    // var fbBarName;
    var searchQuery;
    var fields = {"fields":"events{start_time,end_time,id,name,attending_count}"}

    for(var i = 0; i<barList.length; i++){
      barList[i] = barList[i].replace(/\r/, "");
      barInfo[i] = barList[i].split(':');
      //console.log('barInfo i byrjun' + barInfo[i][0])
      let fbBarName = barInfo[i][0];
      searchQuery = '/' + barInfo[i][1];

      countCallsEvents++;
      FB.api(searchQuery, 'GET', fields, function(res) {
  	    countResponseEvents++;
        if(!res || res.error) {
          //console.log(!res ? 'error occurred' : res.error);
            
        }

        var bar = []
        if(res.events !== undefined) {
  	      for(var i = 0; i<res.events.data.length; i++) {
            bar.push({
              name : res.events.data[i].name,
              link : 'https://www.facebook.com/events/' + res.events.data[i].id,
              attending : res.events.data[i].attending_count,
              startTime : res.events.data[i].start_time,
              endTime : res.events.data[i].end_time
            });
          //for lykkja 2 endar
          }
        }
        events.push({
          name: fbBarName,
          events: bar
        })
        //console.log('events:');
        //console.log(events)
        if(countResponseEvents >= barList.length) {
          console.log('got responses for all bars');
          callback(events);
        }
      });
    
    //for lykkja 1 endar
    }
    //console.log('events eftir lykkju 1:');
    //console.log(events)

  }
  

  //sækir opening hours og description og cover photo
  //muna að handle-a undefined
  self.fetchBars = function(callback) {
  	let fields = {"fields":"about,description,hours,cover"};
    
    let barList = fs.readFileSync('./bars4.txt').toString().split('\n');
    let barInfo = [];
    let barDetails = [];

    let searchQuery;

    for(var i = 0; i < barList.length; i++) {
      barList[i] = barList[i].replace(/\r/, "");
      barInfo[i] = barList[i].split(':');
      let fbBarName = barInfo[i][0];
      searchQuery = '/' + barInfo[i][1];
      
      FB.api(searchQuery, 'GET', fields, function(response) {
      	// if(!res || res.error) {
          //console.log(!res ? 'error occurred' : res.error);
        // }

        var coverPic = undefined
        if(response.cover!= undefined) coverPic = response.cover.source;

        barDetails.push({
        	name: fbBarName,
            about: response.about,
        	description: response.description,
        	opening_hours: response.hours,
        	cover: coverPic
        });

        countResponseBars++
        if(countResponseBars >= barList.length) {
          console.log('got responses for all bars');
          callback(barDetails);
          console.log(barDetails);
        }

      });

    }
      
  }

}


module.exports = fbManager;