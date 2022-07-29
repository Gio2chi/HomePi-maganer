var express = require('express');
var router = express.Router();
var session = require('express-session');
const mc = require('../modules/minecraftInterface');

router.use(session({
    secret: 'AhSDh7gj0a2da23lj',
    resave: false,
    saveUninitialized: true,
}))

router.post('/start-server', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if(!req.session.user || !req.body.server) return res.json({ status: 'error' });
    if(mc.isRunning()) return res.json({ status: 'server running' });
    mc.startServer(req.body.server)
    res.json({ status: 'server started' });
})

router.get('/stop-server', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if(!req.session.user) return res.json({ status: 'error' });
    mc.stopServer()
    res.json({ status: 'server stopped' });
})

router.get('/server-status', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if(!req.session.user) return res.json({ status: 'error' });
    if(mc.isRunning()) return res.json({ status: 'server running' });
    res.json({ status: 'server stopped' });
})

router.get('/console', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if(!req.session.user) return res.json({ status: 'error' });
    if(mc.isRunning()) mc.getConsoleStream(res)
    else res.json({ status: 'server down' })
})

router.post('/server-command', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if(!req.session.user || !req.body.command) return res.json({ status: 'error' });
    if(!mc.isRunning()) return res.json({ status: 'server not running' });
    mc.sendCommand(req.body.command)
    res.json({ status: 'command sent successfully' });
})

module.exports = router;