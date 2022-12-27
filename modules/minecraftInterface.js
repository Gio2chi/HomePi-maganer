require('dotenv').config()
const {Server, isPortFree} = require('../classes/minecraftServer')
const kill = require('tree-kill')
const spawn = require('child_process').spawn;
const fs = require('fs');
const path = require('path');
const telegram = require('./telegramInterface');
// var StreamCache = require('stream-cache');
// let cacheStream = new StreamCache()

let getServers = () => {
    let servers = fs.readdirSync(process.env.SERVER_FOLDER, {withFileTypes: true}).filter(dir => dir.isDirectory()).map(dir => {
        return dir.name
    })
    servers = servers.filter(server => {
        let jars = fs.readdirSync(path.join(process.env.SERVER_FOLDER, server), {withFileTypes: true}).filter(file => file.name.includes('.jar'))
        return jars.length > 0
    })

    return servers
}

let servers = []
getServers().forEach(serverName => {
    servers[serverName] = ({ name: serverName, path: path.join(process.env.SERVER_FOLDER, serverName), process: undefined, running: false })
})

let startServer = (serverName, ram = '1024M') => {
    const server = servers[serverName]
    if(server == undefined) return '[ERR]: Unknown server'
    if (server.running) return '[ERR]: Server online';
    
    telegram.sendMessage("<b>[MC Server]</b>: " + serverName + " starting...")
    server.running = true;

    // Creating server log folder
    if(!fs.existsSync(path.join(__dirname,'../log/minecraft/' + serverName + '/'))) fs.mkdirSync(path.join(__dirname,'../log/minecraft/' + serverName + '/'))

    // Running the server process
    server.process = spawn('java', [
        '-Xmx' + ram, '-Xms' + ram,
        '-jar', `server.jar`,
        'nogui'
    ], { cwd: server.path })
        .on('error', (err) => {
            console.log(err)
            server.running  = false
        })
        .on('exit', (code, signal) => {
            if (code != 0 && signal != null) {
                console.log('process exited with code: ' + code + ' and signal: ' + signal)
            }
            
            server.running = false
        })

    function log(data) {
        // fs.appendFileSync(path.join(__dirname,'../log/minecraft/' + serverName + '/' + new Date().toISOString() + '.log'), buffer.toString())
        console.log(data.toString());
    }

    server.process.stdout.on('data', (buffer) => {
        fs.appendFileSync(path.join(__dirname,'../log/minecraft/' + serverName + '/' + new Date().toISOString() + '.log'), buffer.toString())
        cacheStream.write(buffer)
    });
    server.process.stderr.on('data', log);
}

let sendCommand = (command) => {
    if (!isRunning()) return "[ERR]: Server is not running";
    minecraftServerProcess.stdin.write(command + '\n');

    // buffer output for a quarter of a second, then reply to HTTP request
    var buffer = [];
    var collector = function (data) {
        data = data.toString();
        buffer.push(data.split(']: ')[1]);
    };
    minecraftServerProcess.stdout.on('data', collector);

    return new Promise((resolve, reject) => {
        setTimeout(function () {
            minecraftServerProcess.stdout.removeListener('data', collector);
            if (minecraftServerProcess.exitCode != null) {
                running = false;
                let msg = telegram.appsConstants.minecraftServer
                msg.value = "server closed"
                telegram.sendMessage(msg)

            }
            resolve(buffer.join(''));
        }, 250);
    })

}

let stopServer = () => {
    if (!running) return "[ERR]: Server is not running";
    if (minecraftServerProcess.exitCode != null) return "[INFO]: Server is not running, probably exited from within"
    sendCommand("stop")
    setTimeout(() => kill(minecraftServerProcess.pid, 'SIGINT'), 3000)

    let msg = telegram.appsConstants.minecraftServer
    msg.value = "server closed"
    telegram.sendMessage("<b>[MC Server]</b>: " + serverName + " starting...")

    cacheStream._buffers = []
    return "[INFO]: Server closed"
}

let isRunning = (serverName) => {
    if(!serverName) return -1
    return servers[serverName].running
}

module.exports = {
    getServers,
    startServer,
    sendCommand,
    stopServer,
    isRunning
}