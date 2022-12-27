var express = require('express');
var router = express.Router();
var session = require('express-session');

router.use(session({
    secret: 'AhSDh7gj0a2da23lj',
    resave: false,
    saveUninitialized: true,
}))

const {Server} = require('../../classes/minecraftServer')

router.get('/', function (req, res, next) {
    if (!req.session.user) return res.redirect('/');
    let servers = Server.getServers()
    res.render('minecraft', { servers: servers });
});

module.exports = router;