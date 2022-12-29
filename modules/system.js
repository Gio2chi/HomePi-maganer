const si = require('systeminformation')
const fs = require('fs')
const path = require('path')

//TODO: Add cache to store usage and temperature to create a time graph

let cpu = {}
let mem = {}
let network = {}
let disk = {}

let updateSystemInformation = async () => {
    console.time('\033[36mupdated system info\033[0m')
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
    
    console.log(cpu, mem, disk, network)

    console.timeEnd('\033[36mupdated system info\033[0m')
    return
}

let usagePerProcess
let updateUsagePerProcess = async () => {
    console.time('\033[36mupdated usage per process\033[0m')

    let json = JSON.parse(fs.readFileSync(path.join(__dirname, '../log/processesAllowed.json')))
    if (json.lenth == 0) {
        console.log("process allowed json empty")
        console.timeEnd('\033[36mupdated usage per process\033[0m')
        return
    }

    let names = []
    json.forEach(process => {
        if (!names.includes(process.name)) names.push(process.name)
    });

    let infos = await si.processLoad(names.join(', '))
    usagePerProcess = []
    infos.forEach(process => {
        usagePerProcess.push({ name: process.proc, cpuUsage: process.cpu, memUsage: process.mem })
    })

    console.log(usagePerProcess)
    console.timeEnd('\033[36mupdated usage per process\033[0m')
    return
}

let updateProcessList = async () => {
    console.time('\033[36mupdated process list\033[0m')

    let possibles = ['Plex', 'node', 'PM2', 'mariadbd', 'nginx', 'transmission-daemon']
    let users = ['daemon', 'pi', 'openmediavault-webgui', 'admin', 'openmediavault-notify', 'nas', 'plex', 'minecraft', 'mysql', 'debian-transmission']
    let services = await si.processes()

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

    console.log("apps: " + arr.length)
    fs.writeFileSync(path.join(__dirname, '../log/processesAllowed.json'), JSON.stringify(arr, null, 2))
    console.timeEnd('\033[36mupdated process list\033[0m')
    return
}

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
}
let isRunning = () => { return running }

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

let asyncInterval = async (asyncFunction, ms) => {
    while (running) {
        await asyncFunction()
        await delay(ms)
    }
    console.log("exiting asyncInterval")
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

let getInfos = () => {
    return { cpu, mem, network, disk }
}

module.exports = {
    startSession,
    updateExpiration,
    getExpiration,
    isRunning,
    getInfos
}