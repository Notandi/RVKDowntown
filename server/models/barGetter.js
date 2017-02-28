var barGetter = function(databaseInterface) {
    var self = this;
    const db = databaseInterface;
    var fs = require('fs');
    const API_KEY = 'AIzaSyCzwZgG3X-ZMs2elJi9Bn_l5YgYtvszJBw';

    /*var barList = fs.readFileSync('./bars.txt').toString().split('\n');
    for(var i = 0; i<barList.length; i++)
    {
      barList[i] = barList[i].replace(/\r/, "");
    }*/


    var GooglePlaces = require('google-places');

    var places = new GooglePlaces(API_KEY);

    var googleMapsClient = require('@google/maps').createClient({
        key: API_KEY,
    });

    self.loadInitialBarData = function() {
        console.log('called load initial bar data');

        //console.log(googleMapsClient);
        //name: 0, menu: 1, image: 2, coords: 3, link: 4, description: 5, rating: 6, opens: 7, closes: 8, photo: 9
        googleMapsClient.placesRadar({
            language: 'en',
            location: [64.14583609, -21.93030953],
            radius: 10000,
            type: 'bar',
        }, function(err, response) {
            if (!err) {
                //console.log(response.json.results);
                var barsFound = response.json.results;
                //console.log(barsFound.length);

                for (var i = 0; i < barsFound.length; i++) {
                    //console.log('calling for details');
                    places.details({
                        reference: barsFound[i].reference
                    }, function(err, response) {
                        //console.log('made it to call');
                        var parsedCoords = JSON.stringify(response.result.geometry.location);
                        var bar = {
                            name: response.result.name,
                            menu: '',
                            image: '',
                            coords: parsedCoords,
                            link: response.result.website,
                            description: '',
                            rating: response.result.rating,
                            opens: '',
                            closes: '',
                        }
                        for (property in bar) {
                            if (bar[property] === undefined) {
                                if (property === 'rating') {
                                    bar[property] = 0.0;
                                } else {
                                    bar[property] = '';
                                }
                            }
                        }
                        db.insertBar(bar);
                        console.log('inserting the following bar', bar);
                    });
                }


            }
        });

    };



    self.updateBars = function() {



      /*function handleData(bar_ids)
      {
        function fetchInfo(bars)
        {
          for(var i = 0; i<bars.length; i++)
          {
            googleMapsClient.places({
            language: 'en',
            location: [bars[i].lat, bars[i].long],
            radius: 1000,
            type: 'bar',
          }, function(err, response) {
            if (!err) {
              console.log(response.json.results);
              for(var k = 0; k<response.json.results; k++)
              {

              }
            }
          });

          }



        }

        db.getBars(fetchInfo,bar_ids);

      }

      db.getBarIds(handleData);*/


       googleMapsClient.places({
            language: 'en',
            location: [64.14583609, -21.93030953],
            radius: 10000,
            type: 'bar',
          }, function(err, response) {
            if (!err) {
              console.log(response.json.results);
            }
          });






    };


};



module.exports = barGetter;