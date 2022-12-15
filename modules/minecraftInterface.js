const kill = require('tree-kill')
const spawn = require('child_process').spawn;
const fs = require('fs');
const path = require('path');
const telegram = require('./telegramInterface');
var StreamCache = require('stream-cache');

const confJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json')));

let cacheStream = new StreamCache()

let minecraftServerProcess
let running

let startServer = (serverName) => {
    if (isRunning()) return;
    running = true;

    let msg = telegram.appsConstants.minecraftServer
    msg.value = "starting server..."
    telegram.sendMessage(msg)

    let server = getServerFolderAbsPath(serverName)

    if(!fs.existsSync(path.join(__dirname,'../log/minecraft/' + serverName + '/'))) fs.mkdirSync(path.join(__dirname,'../log/minecraft/' + serverName + '/'))

    minecraftServerProcess = spawn('java', [
        '-Xmx1024M',
        '-Xms1024M',
        '-jar',
        `server.jar`,
        'nogui'
    ], { cwd: server })
        .on('error', (err) => {
            console.log(err)
        })
        .on('exit', (code, signal) => {
            if (code != 0 && signal != null) {
                console.log('process exited with code: ' + code + ' and signal: ' + signal)
            }
            
            writable.close()
            running = false
        })

    function log(data) {
        fs.appendFileSync(path.join(__dirname,'../log/minecraft/' + serverName + '/' + new Date().toISOString() + '.log'), buffer.toString())
        process.stdout.write(data.toString());
    }

    minecraftServerProcess.stdout.on('data', (buffer) => {
        fs.appendFileSync(path.join(__dirname,'../log/minecraft/' + serverName + '/' + new Date().toISOString() + '.log'), buffer.toString())
        cacheStream.write(buffer)
    });
    minecraftServerProcess.stderr.on('data', log);
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

let getConsoleStream = (stream) => {
    if (!isRunning) return "[ERR]: Server is not running"

    cacheStream.pipe(stream);
}

let stopServer = () => {
    if (!running) return "[ERR]: Server is not running";
    if (minecraftServerProcess.exitCode != null) return "[INFO]: Server is not running, probably exited from within"
    sendCommand("stop")
    setTimeout(() => kill(minecraftServerProcess.pid, 'SIGINT'), 3000)

    let msg = telegram.appsConstants.minecraftServer
    msg.value = "server closed"
    telegram.sendMessage(msg)

    cacheStream._buffers = []
    return "[INFO]: Server closed"
}

let getServerFolderAbsPath = (serverName) => {
    return confJson.default_servers_folder + '\\' + serverName
}

let getServers = () => {
    return fs.readdirSync(confJson.default_servers_folder)
}

let getCache = () => {
    return cache
}

let isRunning = () => {
    if (!running || minecraftServerProcess.exitCode != null) {
        cacheStream._buffers = []
        return false
    }
    return true
}

module.exports = {
    getServers,
    startServer,
    sendCommand,
    stopServer,
    getConsoleStream,
    getCache,
    isRunning
}