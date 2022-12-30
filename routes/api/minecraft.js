require('dotenv').config()
var express = require('express');
var router = express.Router();
var session = require('express-session');
const { Server, isPortFree } = require('../../classes/minecraftServer')
const fs = require('fs')

const winston = require('winston');
const logger = winston.loggers.get('logger')

router.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}))

const servers = []

// Start server endpoint
router.post('/start-server', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Handle clients bad requests
    if (!req.session.user ) {
        req.metadata = { 'error-message': 'user not logged' }
        return res.status(401).json({ status: 'error' });
    } else if (!req.body.server) {
        req.metadata = { 'error-message': 'server name not provided' }
        return res.status(401).json({ status: 'server name not provided' });
    }

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
            logger.info(`Creating new Minecraft server instance`, {context: '[MC] ', port, serverName: req.body.server})
        }
        catch (err) {logger.error(err)}
    } 
    // Check if the server is already running
    else if (servers[req.body.server].running()) {
        req.metadata = { 'status': 'server online' }
        return res.json({ status: 'server running' });
    }

    // Run the server with or without default ram
    if(req.body.ram) servers[req.body.server].start(req.body.ram)
    else servers[req.body.server].start()

    logger.info(`starting server ${req.body.server} on port ${servers[req.body.server].port()}`, {context: '[MC] '})

    // Start logging to file
    servers[req.body.server].log()
    logger.verbose(`Start logging`, {context: '[MC]: ', server: req.body.server, filePath: servers[req.body.server].logPath})

    req.metadata = { 'status': 'server online' }
    res.json({ status: 'server started' });
})

// Stop server endpoint
router.post('/stop-server', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Handle clients bad requests
    if (!req.session.user ) {
        req.metadata = { 'error-message': 'user not logged' }
        return res.status(401).json({ status: 'error' });
    } else if (!req.body.server) {
        req.metadata = { 'error-message': 'server name not provided' }
        return res.status(401).json({ status: 'server name not provided' });
    }

    // Stop server
    if(servers[req.body.server]) {
        logger.info(`server ${req.body.server} has been stopped`, {context: '[MC]: '})
        servers[req.body.server].stop()
    }
    
    req.metadata = { 'status': 'server offline' }
    res.json({ status: 'server stopped' });
})

// Server status endpoint
router.post('/server-status', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    // Handle clients bad requests
    if (!req.session.user ) {
        req.metadata = { 'error-message': 'user not logged' }
        return res.status(401).json({ status: 'error' });
    } else if (!req.body.server) {
        req.metadata = { 'error-message': 'server name not provided' }
        return res.status(401).json({ status: 'server name not provided' });
    }

    // Check server status
    if (servers[req.body.server] && servers[req.body.server].running()) {
        req.metadata = { 'status': 'server online' }
        return res.json({ status: 'server running' });
    }
    return res.json({ status: 'server stopped' });
})

// Server command endpoint
router.post('/server-command', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    // Handle clients bad requests
    if (!req.session.user ) {
        req.metadata = { 'error-message': 'user not logged' }
        return res.status(401).json({ status: 'error' });
    } else if (!req.body.server) {
        req.metadata = { 'error-message': 'server name not provided' }
        return res.status(401).json({ status: 'server name not provided' });
    } else if (!req.body.command) {
        req.metadata = { 'error-message': 'command not provided' }
        return res.status(401).json({ status: 'command not provided' });
    }
    
    // Check if the server is running
    if (!servers[req.body.server] || !servers[req.body.server].running()) {
        req.metadata = { 'status': 'server offline' }
        return res.json({ status: 'server not running' });
    }

    // Send command
    if (servers[req.body.server] ) {
        servers[req.body.server].sendCommand(req.body.command)
        req.metadata = { 'status': 'command sent' }
        return res.json({ status: 'command sent successfully' });
    } 
    
    req.metadata = { 'status': 'server not found' }
    return res.json({ status: 'server not found' });
})

// Server console endpoint 
router.post('/console', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Handle clients bad requests
    if (!req.session.user ) {
        req.metadata = { 'error-message': 'user not logged' }
        return res.status(401).json({ status: 'error' });
    } else if (!req.body.server) {
        req.metadata = { 'error-message': 'server name not provided' }
        return res.status(401).json({ status: 'server name not provided' });
    } else if (!req.body.lines) {
        req.metadata = { 'error-message': 'lines not provided' }
        return res.status(401).json({ status: 'lines not provided' });
    } else if (!req.body.index) {
        req.metadata = { 'error-message': 'index not provided' }
        return res.status(401).json({ status: 'index not provided' });
    }

    // Check if the server doesnt exist and is not running
    if (!servers[req.body.server] || !servers[req.body.server].running()) {
        req.metadata = { 'status': 'server offline' }
        return res.json({ status: 'server not running' });
    }

    // Check if the server is not logging
    if (!servers[req.body.server].logPath || !fs.existsSync(servers[req.body.server].logPath)) {
        req.metadata = { 'status': 'server not logging' }
        return res.json({ status: 'server not logging' });
    }
    
    // Getting entire log from file
    let logPath = servers[req.body.server].logPath
    let lines = fs.readFileSync(logPath, 'utf8').split('\n')
    
    // Filtering logs by request parameters
    let response = []
    for(let i=parseInt(req.body.index); i!=(parseInt(req.body.index) + parseInt(req.body.lines)); i++) {
        if(lines[i]) response.push(lines[i])
        else {
            req.metadata = { file: pathToMetadata(logPath), index: parseInt(req.body.index), lines: lines.length - parseInt(req.body.index) }
            return res.json({ data: response, index: i })
        }
    }

    req.metadata = { file: pathToMetadata(logPath), index: parseInt(req.body.index), lines: lines.length }
    return res.json({ data: response, index: parseInt(req.body.index) + parseInt(req.body.lines) })
})

let pathToMetadata = (path) => {
    return path.split('\\').join('\\\\')
}

module.exports = router;