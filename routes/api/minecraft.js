var express = require('express');
var router = express.Router();
var session = require('express-session');
const { Server, isPortFree } = require('../../classes/minecraftServer')
const fs = require('fs')

router.use(session({
    secret: 'AhSDh7gj0a2da23lj',
    resave: false,
    saveUninitialized: true,
}))

const servers = []
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
        
        try {
            servers[req.body.server] = new Server(req.body.server, port)
        }
        catch (err) {console.log(err)}
    } // Check if the server is already running
    else if (servers[req.body.server].running()) return res.json({ status: 'server running' });

    // Run the server
    if(req.body.ram) servers[req.body.server].start(req.body.ram)
    else servers[req.body.server].start()

    servers[req.body.server].log()

    res.json({ status: 'server started' });
})

router.post('/stop-server', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (!req.session.user || !req.body.server) return res.json({ status: 'error' });
    if(servers[req.body.server]) servers[req.body.server].stop()
    res.json({ status: 'server stopped' });
})

router.post('/server-status', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (!req.session.user || !req.body.server) return res.json({ status: 'error' });
    if (servers[req.body.server] && servers[req.body.server].running()) return res.json({ status: 'server running' });
    res.json({ status: 'server stopped' });
})

router.post('/server-command', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (!req.session.user || !req.body.command || !req.body.server) return res.json({ status: 'error' });
    if (!servers[req.body.server] || !servers[req.body.server].running()) return res.json({ status: 'server not running' });
    if (servers[req.body.server] ) servers[req.body.server].sendCommand(req.body.command)
    res.json({ status: 'command sent successfully' });
})

router.post('/console', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (!req.session.user || !req.body.server || !req.body.lines || !req.body.index) return res.json({ status: 'error' });

    // Check if the server doesnt exist and is not running
    if (!servers[req.body.server] || !servers[req.body.server].running()) return res.json({ status: 'server not running' });

    // Check if the server is not logging
    if (!servers[req.body.server].logPath) return res.json({ status: 'server not logging' });
    
    let logPath = servers[req.body.server].logPath
    let lines = fs.readFileSync(logPath, 'utf8').split('\n')
    
    let response = []
    for(let i=parseInt(req.body.index); i!=(parseInt(req.body.index) + parseInt(req.body.lines)); i++) {
        if(lines[i]) response.push(lines[i])
        else return res.json({ data: response, index: i })
    }

    return res.json({ data: response, index: parseInt(req.body.index) + parseInt(req.body.lines) })
})

module.exports = router;