var express = require('express');
var router = express.Router();
var session = require('express-session');
const stats = require('../modules/system');
const mc = require('../modules/minecraftInterface');
const torrent = require('../modules/torrentInterface');

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
  res.render('minecraft', { servers: servers });
});

router.get('/torrent', async (req, res, next) => {
  if (!req.session.user) return res.redirect('/');
  if (!torrent.isRunningTorrent()) torrent.startSessionTorrent(5 * 60)
  let torrents = await torrent.getAllTorrentDetails()
  for(let i=0; i<torrents.length; i++) console.log(torrents[i].name)
  console.log("-----------")
  var orderTmp = []
  let order = torrent.getOrder()
  if (order.length > 0) {
    torrents.forEach(torrent => {
      let index = order.indexOf(torrent.id)
      console.log(torrent.id, index)
      if (index != -1) {orderTmp[index] = torrent}
    })
    torrents.forEach(torrent => {
      if(!orderTmp.includes(torrent)) orderTmp.unshift(torrent)
    })
    torrents = orderTmp
  }
  for(let i=0; i<torrents.length; i++) console.log(torrents[i].name)
  res.render('torrent', { torrents: torrents });
});

module.exports = router;