var express = require('express');
var router = express.Router();
var session = require('express-session');

router.use(session({
    secret: 'AhSDh7gj0a2da23lj',
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