var express = require('express');
var router = express.Router();
var session = require('express-session');

const minecraftRouter = require('./minecraftApi')
const torrentRouter = require('./torrentApi')
const statsRouter = require('./statsApi')
const webhooksRouter = require('./webhooksApi')
const websitesRouter = require('./websitesApi.js')

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