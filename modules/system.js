const si = require('systeminformation')
const fs = require('fs')
const path = require('path')

//TODO: Add cache to store usage and temperature to create a time graph

const winston = require('winston');
const logger = winston.loggers.get('logger')

let cpu = {}
let mem = {}
let network = {}
let disk = {}

// Because some of these tasks take some time to complete i prefer to set global variables to store the results and  
// run them in a separate thread, logging the time each task requires to be completed
// The responses can be retrieved with other functions

// Get the usage of cpu, ram, disk and network and set it in global variables
let updateSystemInformation = async () => {
    // Start profiling
    const profiler = logger.startTimer();

    // Start getting metrics
    cpu.temperature = (await si.cpuTemperature()).main
    let cpuLoad = await si.currentLoad()
    cpu.totalUsage = cpuLoad.currentLoad
    cpu.totalIdle = cpuLoad.currentLoadIdle

    cpu.cpusUsage = []
    cpu.cpusIdle = []

    for (let i = 0; i != cpuLoad.cpus.length; i++) {
        cpu.cpusUsage[i] = cpuLoad.cpus[i].load
        cpu.cpusIdle[i] = cpuLoad.cpus[i].loadIdle
    }

    let memLoad = await si.mem()
    mem.used = memLoad.used
    mem.free = memLoad.free
    mem.total = memLoad.total

    let networkLoad = await si.networkStats()
    network.readSpeed = networkLoad[0].rx_sec
    network.transferSpeed = networkLoad[0].tx_sec

    let diskLoad = await si.fsStats()
    try {
        disk.readSpeed = diskLoad.rx_sec
        disk.writeSpeed = diskLoad.wx_sec
    } catch (e) {}
    
    profiler.done({ message: 'updated system info', level: 'debug', metadata: { cpu, ram, disk, network } });
    return
}

// Get the usage of cpu and ram for all allowed processes (in log/processesAllowed.json) 
// and set it in global variables
let usagePerProcess
let updateUsagePerProcess = async () => {
    // Start profiling
    const profiler = logger.startTimer();

    // Parse allowed processes json file
    let json = JSON.parse(fs.readFileSync(path.join(__dirname, '../log/processesAllowed.json')))
    // Handle json file without data
    if (json.lenth == 0) {
        profiler.done({ message: 'updated usage per process', level: 'debug', metadata: { 'error-message': "process allowed json empty" }})
        return
    }

    // Get names of allowed processes 
    let names = []
    json.forEach(process => {
        if (!names.includes(process.name)) names.push(process.name)
    });

    // Get infos pre process
    let infos = await si.processLoad(names.join(', '))
    usagePerProcess = []
    infos.forEach(process => {
        usagePerProcess.push({ name: process.proc, cpuUsage: process.cpu, memUsage: process.mem })
    })

    profiler.done({ message: 'updated usage per process', level: 'debug', metadata: usagePerProcess })
    return
}

// Update allowed processes json file
let updateProcessList = async () => {
    // Start profiling
    const profiler = logger.startTimer();

    // All possible users and processes ever created
    let possibles = ['Plex', 'node', 'PM2', 'mariadbd', 'nginx', 'transmission-daemon']
    let users = ['daemon', 'pi', 'openmediavault-webgui', 'admin', 'openmediavault-notify', 'nas', 'plex', 'minecraft', 'mysql', 'debian-transmission']
    let services = await si.processes()

    // update allowed processes json file
    let arr = []
    for (let i = 0; i != services.list.length; i++)
        if (users.includes(services.list[i].user) || possibles.includes(services.list[i].name)) {
            delete services.list[i].cpu
            delete services.list[i].cpuu
            delete services.list[i].cpus
            delete services.list[i].mem
            delete services.list[i].memRss
            delete services.list[i].memVsz
            delete services.list[i].nice
            delete services.list[i].priority
            arr.push(services.list[i])
        }

    fs.writeFileSync(path.join(__dirname, '../log/processesAllowed.json'), JSON.stringify(arr, null, 2))

    profiler.done({ message: 'updated process list', level: 'debug' })
    return
}

// All boring session things
let running
let startSession = (s) => {
    if (running) return
    running = true
    asyncInterval(updateUsagePerProcess, 2000)
    asyncInterval(updateProcessList, 5 * 60 * 1000)
    asyncInterval(updateSystemInformation, 500)

    setExpiration(s)
}
let stopSession = () => {
    running = false
    logger.verbose('Stats session stopped', { context: '[Stats]: ' })
}
let isRunning = () => { return running }

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

let asyncInterval = async (asyncFunction, ms) => {
    while (running) {
        await asyncFunction()
        await delay(ms)
    }
    logger.verbose("exiting asyncInterval")
}

let sessionExpired
let setExpiration = async (s) => {
    sessionExpired = s
    let interval = setInterval(() => {
        sessionExpired = sessionExpired - 1;
    }, 1000)
    while (sessionExpired != 0) {
        await delay(1000)
    }
    clearInterval(interval)
    stopSession()
}
let updateExpiration = (s, str) => {
    if (str == "add") sessionExpired += s
    sessionExpired = s
}

let getExpiration = () => {
    return sessionExpired
}

let getInfos = () => { return { cpu, mem, network, disk } }

module.exports = {
    startSession,
    updateExpiration,
    getExpiration,
    isRunning,
    getInfos
}