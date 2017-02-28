var pg_dbInterface = function() {
    var self = this;
    var pg = require('pg');
    const url = require('url');
    var fs = require("fs");

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

    var config = {
        user: 'postgres', //env var: PGUSER 
        database: db_loc, //env var: PGDATABASE 
        password: 'root', //env var: PGPASSWORD 
        port: 5432, //env var: PGPORT 
        max: 10, // max number of clients in the pool 
        idleTimeoutMillis: 300000000, // how long a client is allowed to remain idle before being closed 
    };

    var pool = new pg.Pool(config);

    /**
   * Gets a number of bars equal to the length of bar_ids with each bar object also containing all of the events for that bar
   *
   * @param {int[]} bar_ids  - ids of the bars to be fetched
   * @param {callback} deliverData - handles the bars data
   */
    self.getBars = function(deliverData, bar_ids) {
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var bars = [];

            var params = [];
            for (var i = 1; i <= bar_ids.length; i++) {
                params.push('$' + i);
            }
            var statement = 'SELECT * FROM BARS WHERE _id IN (' + params.join(',') + ')';

            var query = client.query(statement, bar_ids);

            query.on('row', function(row, result) {

                var bar = {
                    id: row._id,
                    name: row.name,
                    menu: row.menu,
                    image: row.image,
                    coords: row.coords,
                    link: row.link,
                    description: row.description,
                    rating: row.rating,
                    opens: row.opens,
                    closes: row.closes,
                    events : [],
                }
                bars.push(bar);

            });
            query.on('end', function(result) {
              //Adding events to all bars            
              var eventStatement = 'SELECT * FROM EVENTS WHERE _id IN (SELECT _event_id FROM EVENTS_IN_BAR WHERE _bar_id IN (' + params.join(',') + '))';
              var eventQuery = client.query(eventStatement, bar_ids);              
              eventQuery.on('row', function(row, result) {

                for(var i = 0; i<bars.length; i++)
                {
                  if(row.venue === bars[i].name)
                  {                    
                    bars[i].events.push(row);
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

    }

    /**
   * Gets an array containing the ids of all the bars in the database
   * @param {callback} deliverData - handles the bars data
   */
    self.getBarIds = function(deliverData) {
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }
            var query = client.query('SELECT _id FROM BARS');
            var bar_ids = [];

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
                return console.error('error fetching client from pool', err);
            }

            //Sorting the event data into the correct order before inserting
            var insertOrder = {name: 0, startTime: 1,endTime: 2,description: 3,venue: 4,link: 5};
            var eventData = [];
            for (property in event) {
                eventData[insertOrder[property]] = event[property];                
            }
            
            var statement = 'INSERT INTO EVENTS(name,startTime,endTime,description,venue,link) VALUES($1,$2,$3,$4,$5,$6)';
            
            var query = client.query(statement, eventData);


            query.on('end', function(result) {
                var query2 = client.query('SELECT BARS._id AS bar_id, EVENTS._id AS' +
                    ' event_id FROM EVENTS,BARS where EVENTS.name = $1 AND BARS.name = $2', [event.name, bar]);
                query2.on('row', function(row, result) {
                    result.addRow(row);
                });
                query2.on('end', function(result) {
                    var bar_id = result.rows[0].bar_id;
                    var event_id = result.rows[0].event_id;
                    var query3 = client.query('INSERT INTO EVENTS_IN_BAR(_bar_id,_event_id) VALUES ($1,$2)', [bar_id, event_id]);
                });
            });

            done();

        });
    };


     /**
   * Inserts a bar into the database
   *
   * @param {object} bar  - information about the bar
   */
    self.insertBar = function(bar){
      pool.connect(function(err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }
            var statement = 'INSERT INTO BARS(name,menu,image,coords,link,description,rating,opens,closes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)';
            
            var insertOrder = {name: 0, menu: 1, image: 2, coords: 3, link: 4, description: 5, rating: 6, opens: 7, closes: 8};
            var barData = [];
            for (property in bar) {
                barData[insertOrder[property]] = bar[property];
            }

            client.query(statement,barData);

            done();
        });
    };

     /**
   * Updates a bar in the database
   *
   * @param {object} bar  - information about the bar
   */
    self.updateBar = function(bar){
      pool.connect(function(err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var insertOrder = {name: 0, menu: 1, image: 2, coords: 3, link: 4, description: 5, rating: 6, opens: 7, closes: 8};
            var barColumns = [];
            var barData = [];
            for (property in bar) {
              if(insertOrder.hasOwnProperty(property))
              {
                barColumns[insertOrder[property]] = property;
                barData[insertOrder[property]] = bar[property];
              }              
            }

            //Removing undefined variables from arrays, in case a full bar object was not given
            for (var i = 0; i < barColumns.length; i++) {
              if (barColumns[i] == undefined) {         
                barColumns.splice(i, 1);
                barData.splice(i,1);
                i--;
              }
            }
            
            var statement = 'UPDATE BARS SET ';
            barData.reverse();
            barColumns.reverse();  
            
            for (var i = 0; i < barColumns.length-1; i++) {
                console.log('statement so far: ' + statement);
                statement += barColumns[i] + ' = $'+(i+1)+',';                
            }

            //Getting rid of the extra comma at the end
            statement = statement.substring(0, statement.length-1);
            statement += ' WHERE name = $'+barColumns.length;
            
   
            client.query(statement,barData);

            done();
        });
    };


};



module.exports = pg_dbInterface;