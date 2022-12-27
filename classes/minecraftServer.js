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

        if(!fs.existsSync(path.join(__dirname, '../log/minecraft', this.name))) fs.mkdirSync(path.join(__dirname, '../log/minecraft', this.name))

        const jsonPath = path.join(__dirname, '../log/minecraft', this.name, 'log.json')
        if(!fs.existsSync(jsonPath)) fs.writeFileSync(jsonPath, JSON.stringify([]))

        let json = JSON.parse(fs.readFileSync(jsonPath))
        let index = json.length
        let logPath = path.join(__dirname, '../log/minecraft', this.name, index + '.log')
        if(!fs.existsSync(jsonPath)) fs.writeFileSync(jsonPath, JSON.stringify([]))
        fs.appendFileSync(logPath, "", 'utf8')
    }

    start(ram = '1024M') {
        if (this.#running) return { err: 'Server online' }
        this.#running = true

        this.#process = spawn(process.env.JAVA, [
            '-Xmx' + ram, '-Xms' + ram,
            '-jar', this._jarName,
            '--port', this.#port,
            'nogui'
        ], { cwd: this._path })
            .on('error', (err) => {
                this.#eventEmitter.emit('error', err)
                this.#running = false
            })
            .on('exit', (code, signal) => {
                this.#eventEmitter.emit('exit', code, signal)
                this.#running = false
            })
    }

    sendCommand(command) {
        if (!this.#running) return { err: 'Server offline' }

        let instance = this
        this.#process.stdin.write(command + '\n');
        
        // buffer output for a quarter of a second, then reply to HTTP request
        var buffer = [];
        var collector = function (data) {
            data = data.toString();
            buffer.push(data.split(']: ')[1]);
        };
        this.#process.stdout.on('data', collector);

        return new Promise((resolve, reject) => {
            setTimeout(function () {
                instance.#process.stdout.removeListener('data', collector);
                if (instance.#process.exitCode != null)
                    instance.#running = false;

                resolve(buffer.join(''));
            }, 250);
        })
    }

    running() { return this.#running; }

    stop() {
        if (!this.#running) return { err: 'Server offline' }
        this.#running = false
        this.sendCommand('stop')
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

    log() {
        if(!this.#running) return { err: 'Server offline' }
        if(this.logPath) return { err: 'Server already logging' }

        if(!fs.existsSync(path.join(__dirname, '../log/minecraft', this.name))) fs.mkdirSync(path.join(__dirname, '../log/minecraft', this.name))

        const jsonPath = path.join(__dirname, '../log/minecraft', this.name, 'log.json')
        if(!fs.existsSync(jsonPath)) fs.writeFileSync(jsonPath, JSON.stringify([]))

        let json = JSON.parse(fs.readFileSync(jsonPath))
        let index = json.length
        
        let logPath = path.join(__dirname, '../log/minecraft', this.name, index + '.log')

        let started_at = new Date()

        this.#process.on('close', () => {
            json.push({started_at, index, ended_at: new Date()})
            fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2))
            this.logPath = undefined
        })
        this.#process.stdout.on('data', (data) => {
            fs.appendFileSync(logPath, data.toString(), 'utf8')
        });

        this.logPath = logPath
        return logPath
    }

    static getServers = () => {
        let servers = fs.readdirSync(process.env.SERVER_FOLDER, { withFileTypes: true }).filter(dir => dir.isDirectory()).map(dir => {
            return dir.name
        })
        servers = servers.filter(server => {
            let jars = fs.readdirSync(path.join(process.env.SERVER_FOLDER, server), { withFileTypes: true }).filter(file => file.name.includes('.jar'))
            return jars.length > 0
        })

        return servers
    }
}

module.exports = {Server, isPortFree}