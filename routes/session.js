var express = require('express');
var router = express.Router();
var session = require('express-session');

const statsRouter = require('./session/stats');
const minecraftRouter = require('./session/minecraft');
const torrentRouter = require('./session/torrent');
const websitesRouter  = require('./session/websites');

router.use(session({
  secret: 'AhSDh7gj0a2da23lj',
  resave: false,
  saveUninitialized: true,
}))

router.use('/', statsRouter)
router.use('/stats', statsRouter)
router.use('/minecraft', minecraftRouter)
router.use('/torrent', torrentRouter)
router.use('/websites', websitesRouter)

module.exports = router;