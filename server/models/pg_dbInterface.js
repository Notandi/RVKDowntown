let pg_dbInterface = function() {
    let self = this;
    let pg = require('pg');
    const url = require('url');
    let fs = require("fs");

    console.log('entered pg_dbInterface');


    //HEROKU STUFF
    /*
    const params = url.parse(process.env.DATABASE_URL);
    const auth = params.auth.split(':');

    const config = {
      user: auth[0],
      password: auth[1],
      host: params.hostname,
      port: params.port,
      database: params.pathname.split('/')[1],
      ssl: true
    };
    */

    //LOCAL STUFF
    const env_db_loc = process.env.DATABASE_URL;
    const db_loc = 'rvkdowntown' || process.env.DATABASE_URL;

    let config = {
        user: 'postgres', //env let: PGUSER 
        database: db_loc, //env let: PGDATABASE 
        password: 'root', //env let: PGPASSWORD 
        port: 5432, //env let: PGPORT 
        max: 20, // max number of clients in the pool 
        idleTimeoutMillis: 300000000, // how long a client is allowed to remain idle before being closed 
    };

    let pool = new pg.Pool(config);
    const POOL_ERROR = {message: 'error fetching client from pool', code: 500};

    /**
   * Gets a number of bars equal to the length of bar_ids with each bar object also containing all of the events for that bar
   *
   * @param {int[]} bar_ids  - ids of the bars to be fetched
   * @param {callback} deliverData - handles the bars data
   */
    self.getBars = function(deliverData, bar_ids) {
        pool.connect(function(err, client, done) {
            if (err) {
              //throw POOL_ERROR;

              return console.error('error fetching client from pool', err);
            }            
            let bars = [];

            let params = [];
            for (let i = 1; i <= bar_ids.length; i++) {
                params.push('$' + i);
            }
            let statement = 'SELECT * FROM BARS WHERE _id IN (' + params.join(',') + ')';

            let query = client.query(statement, bar_ids);

            query.on('row', function(row, result) {

                let parsedCoords = JSON.parse(row.coords);
                let parsedOpens = '';
                let parsedCloses = '';
                if(row.opens !== '')
                {
                  parsedOpens = JSON.parse(row.opens);
                  parsedCloses = JSON.parse(row.closes);
                }

                let bar = {
                    id: row._id,
                    name: row.name,
                    menu: row.menu,
                    image: row.image,
                    coords : parsedCoords,
                    link: row.link,
                    description: row.description,
                    about: row.about,
                    rating: row.rating,
                    opens: parsedOpens,
                    closes: parsedCloses,
                    events : [],
                }
                bars.push(bar);

            });
            query.on('end', function(result) {
              //Adding events to all bars            
              let eventStatement = 'SELECT * FROM EVENTS WHERE _id IN (SELECT _event_id FROM EVENTS_IN_BAR WHERE _bar_id IN (' + params.join(',') + '))';
              let eventQuery = client.query(eventStatement, bar_ids);
              eventQuery.on('row', function(row, result) {

                for(let i = 0; i<bars.length; i++)
                {
                  if(row.venue === bars[i].name)
                  {
                    let event = {
                      name: row.name,
                      startTime: row.starttime,
                      endTime: row.starttime,
                      guests: row.guests,
                      venue: row.venue,
                      link: row.link,
                    }     
                    bars[i].events.push(event);
                    break;
                  }
                }
            });
              eventQuery.on('end', function(result) {
                deliverData(bars);
            });

            });

            done();

        });

    };

    /**
   * Gets an array containing the ids of all the bars in the database
   * @param {callback} deliverData - handles the bars data
   */
    self.getBarIds = function(deliverData) {
        pool.connect(function(err, client, done) {
            if (err) {
              //throw POOL_ERROR;
              return console.error('error fetching client from pool', err);
            }
            let query = client.query('SELECT _id FROM BARS');
            let bar_ids = [];

            query.on('row', function(row, result) {
                bar_ids.push(row._id);
            });
            query.on('end', function(result) {
                deliverData(bar_ids);
            });
            done();
        });

    };


     /**
   * Inserts an event into the database
   *
   * @param {object} event  - information about the event
   * @param {string} bar - name of the bar the event is held in
   */
    self.insertEvent = function(event, bar) {

        pool.connect(function(err, client, done) {
            if (err) {
              //throw POOL_ERROR;
              return console.error('error fetching client from pool', err);
            }

            //Sorting the event data into the correct order before inserting
            let insertOrder = {name: 0, startTime: 1,endTime: 2,guests: 3,venue: 4,link: 5};
            let eventData = [];

            //Replace all undefined letiables with an empty string
            for (property in event) {
              if(event[property] === undefined)
              {
                eventData[insertOrder[property]] = '';
              }
              else
              {
                eventData[insertOrder[property]] = event[property];
              }
                       
            }

            let statement = 'INSERT INTO EVENTS(name,startTime,endTime,guests,venue,link) VALUES($1,$2,$3,$4,$5,$6)';
         
           
            let checkIfEventExists = 'SELECT * FROM EVENTS WHERE link = $1';
            let checkQuery = client.query(checkIfEventExists,[event.link]);
            let events = [];
            checkQuery.on('row', function(row, result) {
              events.push(row);
            });
            checkQuery.on('end', function(result) {
              
              //Make sure we are insert a event that doesn't exist
              if(events.length <= 0)
              {
                  let query = client.query(statement, eventData);                  
                  query.on('end', function(result) {                  
                    let query2 = client.query('SELECT BARS._id AS bar_id, EVENTS._id AS' +
                        ' event_id FROM EVENTS,BARS where EVENTS.link = $1 AND BARS.name = $2', [event.link, bar]);
                        console.log('searching for event: ' + event.link + ' and bar: ' + bar);
                    query2.on('row', function(row, result) {                        
                        result.addRow(row);
                    });
                    query2.on('end', function(result) {                        
                        let bar_id = result.rows[0].bar_id;
                        let event_id = result.rows[0].event_id;
                        let query3 = client.query('INSERT INTO EVENTS_IN_BAR(_bar_id,_event_id) VALUES ($1,$2)', [bar_id, event_id]);
                        query3.on('end', function(result) {
                          
                        });
                    });
              });

              }     
            });

            

            done();

        });
    };


     /**
   * Inserts a bar into the database
   *
   * @param {object} bar  - information about the bar
   */
    self.insertBar = function(bar, insertedBar){
      pool.connect(function(err, client, done) {
            if (err) {
              //throw POOL_ERROR;
              return console.error('error fetching client from pool', err);
            }
            let statement = 'INSERT INTO BARS(name,menu,image,coords,link,description,rating,opens,closes,about) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)';
            
            let insertOrder = {name: 0, menu: 1, image: 2, coords: 3, link: 4, description: 5, rating: 6, opens: 7, closes: 8, about: 9};
            let barData = [];

            //Replace all undefined letiables with an empty string
            for (property in bar) {
              if(bar[property] === undefined)
              {
                barData[insertOrder[property]] = '';
              }
              else
              {
                barData[insertOrder[property]] = bar[property];
              } 
            }

            //client.query(statement,barData);

            let checkIfBarExists = 'SELECT * FROM BARS WHERE name = $1';
            let checkQuery = client.query(checkIfBarExists,[bar.name]);
            checkQuery.on('end', function(result) {
              //Make sure we are inserting a bar that doesn't exist
              if(result.rowCount <= 0)
              {
                let insertionQuery = client.query(statement,barData);
                insertionQuery.on('end', function(result) {
                  insertedBar();               
                });

              }                
            });

            done();
        });
    };

   /**
   * Deletes a bar from the database
   *
   * @param {string} bar  - name of the bar
   */
    self.deleteBar = function(bar) {
        pool.connect(function(err, client, done) {
            if (err) {
              //throw POOL_ERROR;
              return console.error('error fetching client from pool', err);
            }

            //console.log('called delete bar');
            
            let findIdQuery = client.query('SELECT _id FROM BARS WHERE name = $1', [bar]);

            findIdQuery.on('end', function(result) {
                if(result.rowCount > 0)
                {
                  
                  let deleteRelationQuery = client.query('DELETE FROM EVENTS_IN_BAR WHERE _bar_id = $1', [result.rows[0]._id]);
                deleteRelationQuery.on('end', function(result) {

                    let deleteBar = 'DELETE FROM BARS WHERE name = $1';
                    client.query(deleteBar, [bar]);
                });

                }
                
            });

            done();
        });

    };


   /**
   * Deletes an event from the database
   *
   * @param {string} link  - link to the event that is to be deleted, assumes links are unique
   */
    self.deleteEvent = function(link){
      pool.connect(function(err, client, done) {
            if (err) {
              //throw POOL_ERROR;
              return console.error('error fetching client from pool', err);
            }

            let findIdQuery = client.query('SELECT _id FROM EVENTS WHERE link = $1', [link]);

            findIdQuery.on('end', function(result) {
                console.log('found this many entries: ' + result.rowCount + ' for this link: ' + link);
                if(result.rowCount > 0)
                {
                  //console.log('made it to first query with this link:' + link);
                  let deleteRelationQuery = client.query('DELETE FROM EVENTS_IN_BAR WHERE _event_id = $1', [result.rows[0]._id]);
                deleteRelationQuery.on('end', function(result) {
                    //console.log('made it to second query' + link);
                    let deleteEvent = 'DELETE FROM EVENTS WHERE link = $1';
                    client.query(deleteEvent, [link]);
                });

                }
                
            });

            done();
        });
    };

   /**
   * Retrieves all of the events in the database
   *
   * @param {function} deliverData  - A callback function that is called when the events have been retrieved
   */
    self.getEvents = function(deliverData) {
      pool.connect(function(err, client, done) {
            if (err) {
              //throw POOL_ERROR;
              return console.error('error fetching client from pool', err);
            }
            let query = client.query('SELECT * FROM EVENTS');
            let events = [];
            //let insertOrder = {name: 0, startTime: 1,endTime: 2,guests: 3,venue: 4,link: 5};
            query.on('row', function(row, result) {
              let event = {
                name: row.name,
                startTime: row.starttime,
                endTime: row.starttime,
                guests: row.guests,
                venue: row.venue,
                link: row.link,
              }

              events.push(event);
            });
            query.on('end', function(result) {
                deliverData(events);
            });
            done();
        });

    }

     /**
   * Updates a bar in the database
   *
   * @param {object} bar  - information about the bar
   */
    self.updateBar = function(bar){
      pool.connect(function(err, client, done) {
            if (err) {
              //throw POOL_ERROR;
              return console.error('error fetching client from pool', err);
            }

            console.log('updating database with this link: ',bar.link);
            
            let insertOrder = {name: 0, menu: 1, image: 2, coords: 3, link: 4, description: 5, rating: 6, opens: 7, closes: 8, about: 9};
            let barColumns = [];
            let barData = [];
            for (property in bar) {
              if(insertOrder.hasOwnProperty(property))
              {
                barColumns[insertOrder[property]] = property;
                barData[insertOrder[property]] = bar[property];
              }              
            }



            //Removing undefined letiables from arrays, in case a full bar object was not given
            for (let i = 0; i < barColumns.length; i++) {
              if (barColumns[i] == undefined) {         
                barColumns.splice(i, 1);
                barData.splice(i,1);
                i--;
              }
            }
            
            let statement = 'UPDATE BARS SET ';
            barData.reverse();
            barColumns.reverse();  
            
            for (let i = 0; i < barColumns.length-1; i++) {                
                statement += barColumns[i] + ' = $'+(i+1)+',';              
            }

            //Getting rid of the extra comma at the end
            statement = statement.substring(0, statement.length-1);
            statement += ' WHERE name = $'+barColumns.length;
                        
            let checkIfBarExists = 'SELECT * FROM BARS WHERE name = $1';
            let checkQuery = client.query(checkIfBarExists,[bar.name]);
            let bars = [];
            checkQuery.on('row', function(row, result) {
              bars.push(row);
            });
            checkQuery.on('end', function(result) {
              //Make sure we are updating a bar that exists
              if(bars.length > 0) client.query(statement,barData);                
            });

            

            done();
        });
    };


};



module.exports = pg_dbInterface;