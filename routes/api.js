var express = require('express');
var router = express.Router();
var session = require('express-session');

const minecraftRouter = require('./api/minecraft')
const torrentRouter = require('./api/torrent')
const statsRouter = require('./api/stats')
const webhooksRouter = require('./api/webhooks')
const websitesRouter = require('./api/websites.js')

router.use(session({
    secret: 'AhSDh7gj0a2da23lj',
    resave: false,
    saveUninitialized: true,
}))

router.use('/minecraft', minecraftRouter);
router.use('/torrent', torrentRouter);
router.use('/stats', statsRouter);
router.use('/webhooks', webhooksRouter);
router.use('/websites', websitesRouter);

module.exports = router;