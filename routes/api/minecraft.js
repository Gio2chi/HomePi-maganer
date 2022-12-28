require('dotenv').config()
var express = require('express');
var router = express.Router();
var session = require('express-session');
const { Server, isPortFree } = require('../../classes/minecraftServer')
const fs = require('fs')

router.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}))

const servers = []

// Start server endpoint
router.post('/start-server', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (!req.session.user || !req.body.server) return res.json({ status: 'error' });

    // Create server instance
    if (!servers[req.body.server]) {
        // Searching for a free port
        let port = 25565
        while (! (await isPortFree(port))) {
            port++;
        }
        
        // Create server instance
        try {
            servers[req.body.server] = new Server(req.body.server, port)
        }
        catch (err) {console.log(err)}
    } 
    // Check if the server is already running
    else if (servers[req.body.server].running()) return res.json({ status: 'server running' });

    // Run the server with or without default ram
    if(req.body.ram) servers[req.body.server].start(req.body.ram)
    else servers[req.body.server].start()

    // Start logging to file
    servers[req.body.server].log()

    res.json({ status: 'server started' });
})

// Stop server endpoint
router.post('/stop-server', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    // Check user and body of request
    if (!req.session.user || !req.body.server) return res.json({ status: 'error' });

    // Stop server
    if(servers[req.body.server]) servers[req.body.server].stop()
    res.json({ status: 'server stopped' });
})

// Server status endpoint
router.post('/server-status', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    // Check user and body of request
    if (!req.session.user || !req.body.server) return res.json({ status: 'error' });

    // Check server status
    if (servers[req.body.server] && servers[req.body.server].running()) return res.json({ status: 'server running' });
    res.json({ status: 'server stopped' });
})

// Server command endpoint
router.post('/server-command', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    // Check user and body of request
    if (!req.session.user || !req.body.command || !req.body.server) return res.json({ status: 'error' });

    // Check if the server is running
    if (!servers[req.body.server] || !servers[req.body.server].running()) return res.json({ status: 'server not running' });

    // Send command
    if (servers[req.body.server] ) servers[req.body.server].sendCommand(req.body.command)
    res.json({ status: 'command sent successfully' });
})

// Server console endpoint 
router.post('/console', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    // Check user and body of request
    if (!req.session.user || !req.body.server || !req.body.lines || !req.body.index) return res.json({ status: 'error' });

    // Check if the server doesnt exist and is not running
    if (!servers[req.body.server] || !servers[req.body.server].running()) return res.json({ status: 'server not running' });

    // Check if the server is not logging
    if (!servers[req.body.server].logPath || !fs.existsSync(servers[req.body.server].logPath)) return res.json({ status: 'server not logging' });
    
    // Getting entire log from file
    let logPath = servers[req.body.server].logPath
    let lines = fs.readFileSync(logPath, 'utf8').split('\n')
    
    // Filtering logs by request parameters
    let response = []
    for(let i=parseInt(req.body.index); i!=(parseInt(req.body.index) + parseInt(req.body.lines)); i++) {
        if(lines[i]) response.push(lines[i])
        else return res.json({ data: response, index: i })
    }

    return res.json({ data: response, index: parseInt(req.body.index) + parseInt(req.body.lines) })
})

module.exports = router;