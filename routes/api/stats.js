require('dotenv').config()
var express = require('express');
var router = express.Router();
var session = require('express-session');
var stats = require('../../modules/system');

const winston = require('winston');
const logger = winston.loggers.get('logger')

router.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}))

router.get('/server', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Handle clients bad requests
    if (!req.session.user ) {
        req.metadata = { 'error-message': 'user not logged' }
        return res.status(401).json({ status: 'error' });
    }

    logger.verbose('Updating stats session expiration')
    stats.updateExpiration(30)

    let info = stats.getInfos()
    req.metadata = info
    res.json(info)
})

module.exports = router;