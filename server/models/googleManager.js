var googleManager = function(databaseInterface) {
    var self = this;
    const db = databaseInterface;
    const fs = require('fs');
    const API_KEY1 = 'AIzaSyCzwZgG3X-ZMs2elJi9Bn_l5YgYtvszJBw';
    const API_KEY2 = 'AIzaSyBk4gNUr3H9-fI9wrv9GwGv9NKneKH500E';
    const PLACE_COORDS = {
        lat : 64.14583609,
        lng : -21.93030953,
    }
    const PLACE_RADIUS = 10000;

    var GooglePlaces = require('google-places');

    var places = new GooglePlaces(API_KEY1);
    //retry 3

    var googleMapsClient = require('@google/maps').createClient({
        key: API_KEY1,
    });

    /**
    * Fetches bar names and basic information about them in a PLACE_RADIUS around PLACE_COORDS from the google places api
    *  
    * @param {callback} getFacebookInfo - A callback that updates the bars with the rest of the information
    */
    self.loadInitialBarData = function(getFacebookInfo) {
        console.log('called load initial bar data');        
        let barCounter = 0;
        //Fetching bar names listed in the text file
        let barList = fs.readFileSync('./bar_pages.txt').toString().split('\n');
        let barNameList = [];
        let barInfo = [];
        for(var i = 0; i<barList.length; i++)
        {
            barList[i] = barList[i].replace(/\r/, "");
            barInfo.push(barList[i].split(':'));
            barName = barInfo[i][0];
            barNameList.push(barName);
        }
        
        //name: 0, menu: 1, image: 2, coords: 3, link: 4, description: 5, rating: 6, opens: 7, closes: 8, photo: 9
        googleMapsClient.placesRadar({
            language: 'en',
            location: [PLACE_COORDS.lat, PLACE_COORDS.lng],
            radius: PLACE_RADIUS,
            type: 'bar',
        }, function(err, response) {
            if (!err) {
                
                var barsFound = response.json.results;
                function barHasBeenInserted(){                    
                    barCounter++;
                    if(barCounter >= barNameList.length) getFacebookInfo();
                }

                for (var i = 0; i < barsFound.length; i++) {
                    
                    places.details({
                        reference: barsFound[i].reference
                    }, function(err, response) {
                        if(err)
                        {
                            console.log('error recieved!!',err);
                            return;
                        }
                                                
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
                            about: '',
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
                        if(barIsListed(bar.name,barNameList)) db.insertBar(bar,barHasBeenInserted);
                        
                        //console.log('inserting the following bar', bar);
                    });
                }


            }
        });

    };


    /**
    * Updates the ratings of the bars
    *      
    */
    self.updateRatings = function() {

        googleMapsClient.placesRadar({
            language: 'en',
            location: [PLACE_COORDS.lat, PLACE_COORDS.lng],
            radius: PLACE_RADIUS,
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
                        if(err)
                        {
                            console.log('error recieved!!',err);
                            return;
                        }
                        //console.log('made it to call');                        
                        var bar = {
                            name: response.result.name,
                            rating: response.result.rating,
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
                        db.updateBar(bar);
                        
                    });
                }
            }
        });

    };


    function barIsListed(bar_name,bar_name_list)
    {
        for(var i = 0; i<bar_name_list.length; i++)
        {
            if(bar_name_list[i] === bar_name) return true;
        }

        return false;
    }


};



module.exports = googleManager;