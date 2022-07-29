var express = require('express');
var router = express.Router();
var session = require('express-session');

const minecraftRouter = require('./minecraftApi')
const torrentRouter = require('./torrentApi')
const statsRouter = require('./statsApi')

router.use(session({
    secret: 'AhSDh7gj0a2da23lj',
    resave: false,
    saveUninitialized: true,
}))

router.use('/minecraft', minecraftRouter);
router.use('/torrent', torrentRouter);
router.use('/stats', statsRouter);

module.exports = router;