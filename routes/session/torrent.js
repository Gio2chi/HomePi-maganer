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

const torrent = require('../../modules/torrentInterface');

router.get('/', async (req, res, next) => {
    
    // Handle clients bad requests
    if (!req.session.user ) {
        req.metadata = { 'error-message': 'user not logged, redirecting to / root' }
        return res.redirect('/');
    }

    // Check if the torrent session is running , if not then start it
    if (!torrent.isRunningTorrent()) {
        logger.verbose('Starting torrent session', { context: '[TOR]: ' })
        torrent.startSessionTorrent(5 * 60)
    }

    let torrents = await torrent.getAllTorrentDetails()

    // Getting torrents order and setting it in the torrents object
    var orderTmp = []
    let order = torrent.getOrder()
    if (order.length > 0) {
        torrents.forEach(torrent => {
            let index = order.indexOf(torrent.id)
            if (index != -1) { orderTmp[index] = torrent }
        })
        torrents.forEach(torrent => {
            if (!orderTmp.includes(torrent)) orderTmp.unshift(torrent)
        })
        torrents = orderTmp
    }
    
    req.metadata = { torrents }
    res.render('torrent', { torrents });
});

module.exports = router;