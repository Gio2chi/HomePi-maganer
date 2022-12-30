require('dotenv').config()
var express = require('express');
var router = express.Router();
var session = require('express-session');

const winston = require('winston');
const logger = winston.loggers.get('logger')

router.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}))

const stats = require('../../modules/system');

router.get('/', function (req, res, next) {
    if (!req.session.user) return res.redirect('/');
    if (!stats.isRunning()) {
        logger.verbose('Starting stats session', { context: '[Stats]: ' })
        stats.startSession(5 * 60)
    }
    res.render('AP_home');
});

module.exports = router