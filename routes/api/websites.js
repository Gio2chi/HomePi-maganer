var express = require('express');
var router = express.Router();
var session = require('express-session');
const web = require('../../modules/websitesInterface');

router.use(session({
    secret: 'AhSDh7gj0a2da23lj',
    resave: false,
    saveUninitialized: true,
}))

router.get('/console/:websiteName', (req, res) => {
    if(!req.session.user) return res.json({ status: 'error' });
    if(!web.websiteExists(req.params.websiteName)) return res.json({ status: 'server not found' });
    web.getConsoleStream(req.params.websiteName, res)
})

router.post('/stream/:websiteName', (req, res) => {
    if(req.headers["x-websites-secret-token"] != process.env.WEBSITES_TOKEN) return res.json({ status: 'error'})
    req.on('end', () => {
        res.json({ status: 'success' });
    })
    web.logToFile(req.params.websiteName, req)
})

module.exports = router;