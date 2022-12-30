require('dotenv').config()
const path = require('path');
const spawn = require('child_process').spawn;
const kill = require('tree-kill')
const EventEmitter = require('events').EventEmitter;
const fs = require('fs');

const isPortFree = port =>
    new Promise(resolve => {
        const server = require('http')
            .createServer()
            .listen(port, () => {
                server.close()
                resolve(true)
            })
            .on('error', () => {
                resolve(false)
            })
    })

class Server {
    #eventEmitter = new EventEmitter()
    #process = undefined;
    #running = false;
    #port = 25565
    logPath

    constructor(serverName, port = 25565, jarName = 'server.jar') {
        // Throw an error if the server does not exist
        if (!Server.getServers().includes(serverName)) throw new Error('Server ' + serverName + ' not found')

        // Throw an error if the server jar does not exist
        if (!fs.readdirSync(path.join(process.env.SERVER_FOLDER, 'bukkit')).includes('server.jar')) throw new Error(jarName + ' not found')

        // Throw an error if the port is not available
        if(!isPortFree(port)) throw new Error('port ' + port + ' is not available')

        this.name = serverName
        this._path = path.join(process.env.SERVER_FOLDER, this.name)
        this._jarName = jarName
        this.#port = port

        // Creating default log path
        if(!fs.existsSync(path.join(__dirname, '../log/minecraft', this.name))) fs.mkdirSync(path.join(__dirname, '../log/minecraft', this.name))

        // Creating default history log
        const jsonPath = path.join(__dirname, '../log/minecraft', this.name, 'log.json')
        if(!fs.existsSync(jsonPath)) fs.writeFileSync(jsonPath, JSON.stringify([]))

        // Creating instance log file
        let json = JSON.parse(fs.readFileSync(jsonPath))
        let index = json.length
        let logPath = path.join(__dirname, '../log/minecraft', this.name, index + '.log')
        fs.appendFileSync(logPath, "", 'utf8')
    }

    // Start the server
    start(ram = '1024M') {
        // Check if the server is running
        if (this.#running) return { err: 'Server online' }
        
        // Start the server
        this.#running = true
        this.#process = spawn(process.env.JAVA, [
            '-Xmx' + ram, '-Xms' + ram, // Default ram is 1024Megabytes
            '-jar', this._jarName,  // Default jar name is 'server.jar'
            '--port', this.#port,  // Default port is 25565
            'nogui'
        ], { cwd: this._path }) // Set environment for the server process
            .on('error', (err) => {
                this.#eventEmitter.emit('error', err) // on process error stop the server
                this.#running = false
            })
            .on('exit', (code, signal) => {
                this.#eventEmitter.emit('exit', code, signal) // on process exit stop the server
                this.#running = false
            })
    }

    // send a command to the server
    sendCommand(command) {
        // Check if the server is running
        if (!this.#running) return { err: 'Server offline' }

        // Collect the instance in a variable in order to be modified in a promise
        let instance = this
        this.#process.stdin.write(command + '\n');
        
        // buffer console output for a quarter of a second  
        var buffer = [];
        var collector = function (data) {
            data = data.toString();
            buffer.push(data.split(']: ')[1]);
        };
        this.#process.stdout.on('data', collector);

        // return console output
        return new Promise((resolve, reject) => {
            setTimeout(function () {
                instance.#process.stdout.removeListener('data', collector);
                if (instance.#process.exitCode != null)
                    instance.#running = false;

                resolve(buffer.join(''));
            }, 250);
        })
    }

    // return server status
    running() { return this.#running; }

    // return server port
    port() { return this.#port; }

    // Stop the server
    stop() {
        // Check if the server is not running
        if (!this.#running) return { err: 'Server offline' }

        this.#running = false
        this.sendCommand('stop') // Stop the server via command

        // Bruteforce the server to stop itself if the server is still running
        setTimeout(() => {
            if (this.#process.exitCode == null)
                kill(this.#process.pid, 'SIGINT')
        }, 5000)
    }

    on(e, callback) {
        if (e == 'start') this.#eventEmitter.on('start', callback)
        if (e == 'stop') this.#eventEmitter.on('exit', callback)
        if (e == 'error') this.#eventEmitter.on('error', callback)
        if (e == 'command') this.#eventEmitter.on('command', callback)
        return this
    }

    // Start logging the console in a file
    log() {
        // Check if the server is offline or if it is already logging
        if(!this.#running) return { err: 'Server offline' }
        if(this.logPath) return { err: 'Server already logging' }

        // Creating log folder
        if(!fs.existsSync(path.join(__dirname, '../log/minecraft', this.name))) fs.mkdirSync(path.join(__dirname, '../log/minecraft', this.name))

        // Creating default history log
        const jsonPath = path.join(__dirname, '../log/minecraft', this.name, 'log.json')
        if(!fs.existsSync(jsonPath)) fs.writeFileSync(jsonPath, JSON.stringify([]))

        // Creating log file
        let json = JSON.parse(fs.readFileSync(jsonPath))
        let index = json.length
        let logPath = path.join(__dirname, '../log/minecraft', this.name, index + '.log')

        // Updating default history log with session information
        let started_at = new Date()
        this.#process.on('close', () => {
            json.push({started_at, index, ended_at: new Date()})
            fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2))
            this.logPath = undefined
        })

        // Logging console to file
        this.#process.stdout.on('data', (data) => {
            fs.appendFileSync(logPath, data.toString(), 'utf8')
        });

        this.logPath = logPath
        return logPath
    }

    // Get all the servers available
    static getServers = () => {
        // Get all the folders
        let servers = fs.readdirSync(process.env.SERVER_FOLDER, { withFileTypes: true }).filter(dir => dir.isDirectory()).map(dir => {
            return dir.name
        })
        // Filter the folders accepting only those with a jar in
        servers = servers.filter(server => {
            let jars = fs.readdirSync(path.join(process.env.SERVER_FOLDER, server), { withFileTypes: true }).filter(file => file.name.includes('.jar'))
            return jars.length > 0
        })

        return servers
    }
}

module.exports = {Server, isPortFree}