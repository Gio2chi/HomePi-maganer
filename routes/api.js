require('dotenv').config()
var express = require('express');
var router = express.Router();
var session = require('express-session');

const minecraftRouter = require('./api/minecraft')
const torrentRouter = require('./api/torrent')
const statsRouter = require('./api/stats')
const webhooksRouter = require('./api/webhooks')
const websitesRouter = require('./api/websites.js')

router.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}))

router.use('/minecraft', minecraftRouter);
router.use('/torrent', torrentRouter);
router.use('/stats', statsRouter);
// router.use('/webhooks', webhooksRouter); not implemented yet
// router.use('/websites', websitesRouter); to reconfigure

module.exports = router;