var express = require('express');
var router = express.Router();
var session = require('express-session');
var stats = require('../modules/system');

router.use(session({
    secret: 'AhSDh7gj0a2da23lj',
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