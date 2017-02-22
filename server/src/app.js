/* express kóði hér */
const express = require('express');

const path = require('path');

const bodyParser = require('body-parser');

const app = express();

const routes = require('./routes/routes');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

module.exports = app;
