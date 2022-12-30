require('dotenv').config()
var express = require('express');
var router = express.Router();
var session = require('express-session');

const torrent = require('../../modules/torrentInterface');

const winston = require('winston');
const logger = winston.loggers.get('logger')

router.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}))

router.post('/destinations', (req, res) => {

    // Handle clients bad requests
    if (!req.session.user) {
        req.metadata = { 'error-message': 'user not logged' }
        return res.status(401).json({ status: 'error' });
    } else if (torrent.isHackingFolder(req.body.destination)) {
        req.metadata = { 'error-message': 'folder not allowed' }
        return res.status(401).json({ status: 'error' });
    }

    // get folders in the media directory
    let folders = torrent.getMediaFolders(req.body.destination)

    // Handle clients bad requests
    if (!folders) {
        req.metadata = { 'error-message': 'no such directory' }
        return res.status(401).json({ status: 'error', message: 'no such directory' });
    }

    req.metadata = { destinations: folders }
    return res.json({ destinations: folders })
})

router.post('/download', (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Handle clients bad requests
    if (!req.session.user) {
        req.metadata = { 'error-message': 'user not logged' }
        return res.status(401).json({ status: 'error' });
    } else if (!req.body.url) {
        req.metadata = { 'error-message': 'url not provided' }
        return res.status(401).json({ status: 'error' });
    } else if (torrent.isHackingFolder(req.body.destination)) {
        req.metadata = { 'error-message': 'folder not allowed' }
        return res.status(401).json({ status: 'error' });
    }

    // Download torrent file from magnet link in a folder
    if (req.body.destination != "/" || !req.body.destination) {
        torrent.download(req.body.url, req.body.destination)
    } else {
        torrent.download(req.body.url)
    }

    return res.json({ status: 'success' });
})

router.get('/info', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Handle clients bad requests
    if (!req.session.user) {
        req.metadata = { 'error-message': 'user not logged' }
        return res.status(401).json({ status: 'error' });
    }

    logger.verbose('Updating torrent session expiration')
    torrent.updateExpirationTorrent(30)

    res.json({ torrents: torrent.getDetails() })
})

router.post('/setTorrentOrder', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Handle clients bad requests
    if (!req.session.user) {
        req.metadata = { 'error-message': 'user not logged' }
        return res.status(401).json({ status: 'error' });
    } else if (!req.body.jsonStr) {
        req.metadata = { 'error-message': 'order not provided' }
        return res.status(401).json({ status: 'error' });
    }
    let arr = (JSON.parse(req.body.jsonStr)).torrentIds
    if (!arr) {
        req.metadata = { 'error-message': 'order not provided' }
        return res.status(401).json({ status: 'error' });
    }

    try {
        for (let i = 0; i < arr.length; i++) {
            if (typeof arr[i] != "number") {
                req.metadata = { 'error-message': 'wrong order format' }
                return res.status(401).json({ status: 'error' });
            }
        }
    } catch (error) {
        req.metadata = { error };
        return res.status(500).json({ status: 'Internal Error' });
    }

    // Set the order of the torrents
    torrent.setOrder(arr)
    res.json({ status: 'success' });
})

router.post('/setTorrentStatus', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Handle clients bad requests
    if (!req.session.user) {
        req.metadata = { 'error-message': 'user not logged' }
        return res.status(401).json({ status: 'error' });
    } else if (!req.body.status) {
        req.metadata = { 'error-message': 'status not provided' }
        return res.status(401).json({ status: 'error' });
    } else if (!(req.body.status == 'START_ALL' || req.body.status == 'PAUSE_ALL' || req.body.status == 'REMOVE_ALL') && !req.body.ids) {
        req.metadata = { 'error-message': 'ids not provided in  status setter' }
        return res.status(401).json({ status: 'error' });
    }

    // Set global status to all torrent
    if (req.body.status == 'START_ALL' || req.body.status == 'PAUSE_ALL' || req.body.status == 'REMOVE_ALL') {
        torrent.setTorrentStatus(req.body.status)
        req.metadata = { 'message': req.body.status + ' on all torrents' }
        return res.json({ status: 'success' });
    }

    let ids = JSON.parse(req.body.ids);
    try {
        for (let i = 0; i < ids.length; i++) {
            if (typeof ids[i] != "number") {
                req.metadata = { 'error-message': 'wrong ids format' }
                return res.status(401).json({ status: 'error' });
            }
        }
    } catch (error) {
        req.metadata = { error };
        return res.status(500).json({ status: 'Internal Error' });
    }

    // Set status on specific torrents
    for (let i = 0; i < ids.length; i++) {
        torrent.setTorrentStatus(req.body.status, ids[i]);
    }

    res.json({ status: 'success' });
})

router.post('/search', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Handle clients bad requests
    if (!req.session.user) {
        req.metadata = { 'error-message': 'user not logged' }
        return res.status(401).json({ status: 'error' });
    } else if (!req.body.search) {
        req.metadata = { 'error-message': 'search param not provided' }
        return res.status(401).json({ status: 'error' });
    }

    let torrents = await torrent.search(req.body.search)
    req.metadata = { torrents }
    res.json({ torrents, status: 'success' });
})

router.post('/getMagnet', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Handle clients bad requests
    if (!req.session.user) {
        req.metadata = { 'error-message': 'user not logged' }
        return res.status(401).json({ status: 'error' });
    } else if (!req.body.torrent) {
        req.metadata = { 'error-message': 'torrent magnet param not provided' }
        return res.status(401).json({ status: 'error' });
    }

    // Send magnet link
    let torrentObj = JSON.parse(req.body.torrent);
    let magnet = await torrent.getMagnet(torrentObj)
    req.metadata = { magnet }
    res.json({ magnet, status: 'success' });
})

module.exports = router;