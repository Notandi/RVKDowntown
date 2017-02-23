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

    self.init = function() {
        console.log('called init');
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }
            var statement = 'SELECT * FROM BARS';
            var query = client.query(statement);
            var numOfBarsFound = 0;
            query.on('row', function(row, result) {
                numOfBarsFound++;
            });
            query.on('end', function(result) {
                if (numOfBarsFound < 1) self.loadInitialData(); //If the database is empty, load data  

            });

            done();

        });

    };


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

    }



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


    self.loadInitialData = function() {

        console.log('called loadInitialData');
        pool.connect(function(err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var words = [];
            var grouping = 'none';
            var word = '';
            var sentiment_value = 0;

            words['noun'] = fs.readFileSync('./word_textfiles/nouns/all_nouns.txt').toString().split('\n');
            words['pronoun'] = fs.readFileSync('./word_textfiles/pronouns/all_pronouns.txt').toString().split('\n');
            words['adverb'] = fs.readFileSync('./word_textfiles/adverbs/all_adverbs.txt').toString().split('\n');
            words['verb'] = fs.readFileSync('./word_textfiles/verbs/all_verbs.txt').toString().split('\n');
            words['adjective'] = fs.readFileSync('./word_textfiles/adjectives/all_adjectives.txt').toString().split('\n');
            words['preposition'] = fs.readFileSync('./word_textfiles/prepositions/all_prepositions.txt').toString().split('\n');

            for (var type in words) {
                for (var i = 0; i < words[type].length; i++) {
                    grouping = 'none';
                    word = words[type][i];
                    word = word.replace(/\r/, ""); //Remove CR-LF symbol
                    sentiment_value = sentiment(word).score.toString();
                    
                    if (word.startsWith('wh') && type === 'pronoun') grouping = 'wh_question';
                    client.query('INSERT INTO WORDS(word, type, sentiment, grouping) VALUES($1,$2,$3,$4)', [word, type, sentiment_value, grouping]);
                }
            }

            for (var type in sentences) {
                console.log('inserting type: ' + type);

                client.query('INSERT INTO SENTENCES(type, structure) VALUES($1,$2)', [type, JSON.stringify(sentences[type])]);
            }

            done();
        });
    };

};



module.exports = pg_dbInterface;