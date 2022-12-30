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

const {Server} = require('../../classes/minecraftServer')

// Render minecraft home page with servers available
router.get('/', function (req, res, next) {
    // Handle clients bad requests
    if (!req.session.user ) {
        req.metadata = { 'error-message': 'user not logged, redirecting to / root' }
        return res.redirect('/');
    }
    
    logger.verbose('Getting minecraft servers', { context: '[MC]: ' })
    let servers = Server.getServers()

    req.metadata = servers
    res.render('minecraft', { servers: servers });
});

module.exports = router;