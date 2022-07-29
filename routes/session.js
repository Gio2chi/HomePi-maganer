var express = require('express');
var router = express.Router();
var session = require('express-session');
const stats = require('../modules/system');
const mc = require('../modules/minecraftInterface');

router.use(session({
  /*genid: function(req) {
    return genuuid()
  },*/
  secret: 'AhSDh7gj0a2da23lj',
  resave: false,
  saveUninitialized: true,
}))

/* GET users listing. */
router.get('/', function (req, res, next) {
  if (!req.session.user) return res.redirect('/');
  if (!stats.isRunning()) stats.startSession(5 * 60)
  res.render('AP_home');
});

router.get('/minecraft', function (req, res, next) {
  if (!req.session.user) return res.redirect('/');
  let servers = mc.getServers()
  res.render('minecraft', {servers: servers});
});

router.get('/torrent', function (req, res, next) {
  if (!req.session.user) return res.redirect('/');
  let servers = mc.getServers()
  res.render('torrent', {servers: servers});
});

module.exports = router;