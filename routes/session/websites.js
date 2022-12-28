require('dotenv').config()
var express = require('express');
var router = express.Router();
var session = require('express-session');

router.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}))

const web  = require('../../modules/websitesInterface');

router.get('/websites', function (req, res, next) {
    if (!req.session.user) return res.redirect('/');
    let websites = web.getWebsites()
    res.render('websites', { websites: websites });
});

module.exports = router;