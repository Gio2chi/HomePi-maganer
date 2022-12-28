require('dotenv').config()
var express = require('express');
var router = express.Router();
var session = require('express-session');

router.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}))

const {Server} = require('../../classes/minecraftServer')

// Render minecraft home page with servers available
router.get('/', function (req, res, next) {
    // Check the user
    if (!req.session.user) return res.redirect('/');
    
    let servers = Server.getServers()
    res.render('minecraft', { servers: servers });
});

module.exports = router;