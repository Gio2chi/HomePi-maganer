require('dotenv').config()
var express = require('express');
var router = express.Router();
var session = require('express-session');

router.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}))

const stats = require('../../modules/system');

router.get('/', function (req, res, next) {
    if (!req.session.user) return res.redirect('/');
    if (!stats.isRunning()) stats.startSession(5 * 60)
    res.render('AP_home');
});

module.exports = router