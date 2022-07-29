var express = require('express');
var router = express.Router();
var session = require('express-session');

const torrent = require('../modules/torrentInterface');

router.use(session({
    secret: 'AhSDh7gj0a2da23lj',
    resave: false,
    saveUninitialized: true,
}))

router.get('/isValidDestination', (req, res) => {
    if(!req.session.user || !req.body.destination) return res.json({ status: 'error' });
    
    res.json({ status: 'success' })
})

router.post('/destinations', (req, res) => {
    if(!req.session.user) return res.json({ status: 'error', code: 403 });
    if(torrent.isHackingFolders(req.body.destination)) return res.json({ status: 'error', code: 403 });
    let folders = torrent.getMediaFolders(req.body.destination)
    if(!folders) return res.json({ status: 'error', code: 404, message: 'no such directory' });
    res.json({ destinations: folders })
})

router.post('/upload', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if(!req.session.user || !req.body.url) return res.json({ status: 'error' });
    if(torrent.isHackingFolders(req.body.destination)) return res.json({ status: 'error' });
    if(req.body.destination != "/" || !req.body.destination)
        torrent.download(req.body.url)
    else torrent.download(req.body.url, req.body.destination)
    res.json({ status: 'success' });
})

module.exports = router;