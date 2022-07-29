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
        torrent.download(req.body.url, req.body.destination)
    else torrent.download(req.body.url)
    res.json({ status: 'success' });
})

router.get('/info', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if(!req.session.user) return res.json({ status: 'error' });
    torrent.updateExpirationTorrent(30)
    res.json({
        torrents: torrent.getDetails()
    })
})

router.post('/setTorrentOrder', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if(!req.session.user || !req.body.jsonStr) return res.json({ status: 'error' });
    let arr = (JSON.parse(req.body.jsonStr)).torrentIds
    if(!arr) return res.json({ status: 'error' });
    try {
        for(let i=0; i<arr.length; i++) {
            if(typeof arr[i] != "number") return res.json({ status: 'error' });
        }
    } catch (error) {
        return res.json({ status: 'error' });
    }
    
    torrent.setOrder(arr)
    res.json({ status: 'success' });
})

router.post('/setTorrentStatus', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if(!req.session.user || !req.body.status) return res.json({ status: 'error' });
    if(!(req.body.status == 'START_ALL' || req.body.status == 'PAUSE_ALL' || req.body.status == 'REMOVE_ALL') && !req.body.ids) return res.json({ status: 'error' });
    if(req.body.status == 'START_ALL' || req.body.status == 'PAUSE_ALL' || req.body.status == 'REMOVE_ALL') {
        torrent.setTorrentStatus(req.body.status)
        return res.json({ status: 'success' });
    }

    let ids = JSON.parse(req.body.ids);
    try {
        for(let i=0; i<ids.length; i++) {
            if(typeof ids[i] != "number") return res.json({ status: 'error' });
        }
    } catch (error) {
        return res.json({ status: 'error' });
    }

    for(let i=0; i<ids.length; i++) {
        torrent.setTorrentStatus(req.body.status, ids[i]);
    }

    res.json({ status: 'success' });
})

router.post('/search', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if(!req.session.user || !req.body.search) return res.json({ status: 'error' });

    res.json({torrents: await torrent.search(req.body.search), status: 'success' });
})

router.post('/getMagnet', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if(!req.session.user || !req.body.torrent) return res.json({ status: 'error' });
    let torrentObj = JSON.parse(req.body.torrent);
    res.json({magnet: await torrent.getMagnet(torrentObj), status: 'success' });
})

module.exports = router;