/* routes hér */
const express = require('express');

const apicache = require('apicache');

const router = express.Router();


const cache = apicache.middleware;


// route fyrir forsíðuna
router.get('/', cache('5 minutes'), (req, res, next) => {
});


// sýnir error ef farið er á route sem er ekki skilgreint
router.get('*', (req, res, next) => {
  res.status(404).render('message', { message: 'oh no!',
    error: 'Error: Request failed with status code 404' });
});

module.exports = router;
