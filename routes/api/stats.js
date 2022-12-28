require('dotenv').config()
var express = require('express');
var router = express.Router();
var session = require('express-session');
var stats = require('../../modules/system');

router.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}))

router.get('/server', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if(!req.session.user) return res.json({ status: 'error' });
    stats.updateExpiration(30)
    res.json(stats.getInfos())
})

module.exports = router;