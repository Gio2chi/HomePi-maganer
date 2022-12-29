require('dotenv').config()
const TransmissionApi = require('transmission');
const fs = require('fs');
const path = require('path');

//if the url of the provider does change, update it in the .dotev file and in the node_modules folder
// the pirate bay does not provide the best results
//TorrentSearchApi.enableProvider('ThePirateBay')

const TorrentSearchApi = require('torrent-search-api');
const MyCustomProvider = require('./providers/1337x');
TorrentSearchApi.loadProvider(MyCustomProvider);
TorrentSearchApi.enableProvider('custom1337x')

const transmission = new TransmissionApi({
    username: process.env.TRANSMISSION_USERNAME,
    password: process.env.TRANSMISSION_PASSWORD,
    host: process.env.TRANSMISSION_HOST,
});

// Search for torrents
let search = async (torrentName) => { return await TorrentSearchApi.search(torrentName, 'All', 20) }

// Get magnet link
let getMagnet = async (torrent) => { return await TorrentSearchApi.getMagnet(torrent) }

// Download torrent from magnet
let download = (magnet, dir) => {
    if (dir)
        // Download torrent in directory
        transmission.addUrl(magnet, { "download-dir": "/export/Gio_A_NAS/Plex" + dir }, (err, args) => {
            if(err) {
                console.log(err)
                return;
            }
            // get torrent name args.name
        })
    else
        // Download torrent in default directory
        transmission.addUrl(magnet, (err, args) => {
            console.log(err, args);
        })
}

let torrents 
// Get all torrents details saved in cache
let getDetails = () => { return torrents }
// Get all torrents details and save them in cache torrent
let getAllTorrentDetails = async () => {
    return new Promise((resolve, reject) => {
        transmission.get((err, result) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            torrents = result.torrents
            resolve(result.torrents)
        });
    })
}
// Get torrents details from ids
let getTorrentDetails = (ids) => {
    return new Promise((resolve, reject) => {
        transmission.get(ids, (err, result) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            if (result.torrents.length > 0) {
                resolve(result.torrents[0]);
            }
        });
    })
}

// Get folders inside one directory
let getMediaFolders = (dest) => {
    let folders
    if (dest) {
        let pathToFolder = path.join(process.env.MEDIA_FOLDER, dest)
        if (fs.existsSync(pathToFolder)) {
            folders = fs.readdirSync(pathToFolder, { withFileTypes: true });
            folders = folders.filter(folder => folder.isDirectory()).map(folder => folder.name)
        }
    } else {
        folders = fs.readdirSync(path.join(process.env.MEDIA_FOLDER), { withFileTypes: true })
        folders = folders.filter(folder => folder.isDirectory()).map(folder => folder.name)
    }

    return folders
}
// Get absolute path to directory in Nas
let getAbsolutePath = (dest) => { return path.join(process.env.MEDIA_FOLDER, dest) }
// Safety check for path not allowed
let isHackingFolders = (folder) => {
    if (folder.includes("../") || folder.includes("..\\") || folder.includes("\\..") || folder.includes("/..")) return true;
    return false;
}

// Set order of the torrents displayed in the web interface
var orderList = []
let setOrder = (order) => { orderList = order }
// Get order of the torrents displayed in the web interface
let getOrder = async () => {
    if((await getAllTorrentDetails()).length > orderList.length)
        return orderList
    else return []
}

// Torrent status to string 
let getStatus = (code) => {
    switch (code) {
        case 0: {
            return "PAUSED"
        }
        case 1: {
            return "CHECK_WAIT"
        }
        case 2: {
            return "CHECK"
        }
        case 3: {
            return "DOWNLOAD_WAIT"
        }
        case 4: {
            return "DOWNLOAD"
        }
        case 5: {
            return "SEED_WAIT"
        }
        case 6: {
            return "SEED"
        }
        case 7: {
            return "ISOLATED"
        }
    }
}
// Set torrent status in transmission 
let setTorrentStatus = async (status, id) => {
    switch(status) {
        case "START": {
            transmission.start(id, function(err, result){if(err) console.log(err)});
            break;
        }
        case "PAUSE": {
            transmission.stop(id, function(err, result){if(err) console.log(err)});
            break;
        }
        case "REMOVE": {
            transmission.remove(id, function(err, result){if(err) console.log(err)});
            break;
        }
        case "START_ALL": {
            let allTorrentDetails = await getAllTorrentDetails()
            for(let i = 0; i < allTorrentDetails.length; i++) {
                if(allTorrentDetails[i].status == 0) transmission.start(allTorrentDetails[i].id, (err) => {if(err) console.log(err)})
            }
            break;
        }
        case "PAUSE_ALL": {
            transmission.active((err, res) => {
                if(err) console.log(err)
                else for(let i=0; i != res.torrents.length; i++){
                    transmission.stop(res.torrents[i].id, function(err, result){if(err) console.log(err)});
                }
            })
            break;
        }
        case "REMOVE_ALL": {
            let allTorrentDetails = await getAllTorrentDetails()
            for(let i = 0; i < allTorrentDetails.length; i++) {
                if(allTorrentDetails[i].status == 0) transmission.remove(allTorrentDetails[i].id, (err) => {if(err) console.log(err)})
            }
            break;
        }
    }
}

// Start session of retrieving information from transmission 
let runningTorrent
let startSessionTorrent = (s) => {
    if (runningTorrent) return
    runningTorrent = true
    asyncInterval(getAllTorrentDetails, 1500)

    setExpirationTorrent(s)
}
// Stop session of retrieving information from transmission 
let stopSessionTorrent = () => {
    runningTorrent = false
}
// Get session status of retrieving information from transmission 
let isRunningTorrent = () => { return runningTorrent }

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

// loop to retrieve information from transmission every tot ms
let asyncInterval = async (asyncFunction, ms) => {
    while (runningTorrent) {
        await asyncFunction()
        await delay(ms)
    }
    console.log("exiting asyncInterval")
}

// Set session expiration in seconds
let sessionExpiredTorrent
let setExpirationTorrent = async (s) => {
    sessionExpiredTorrent = s
    let interval = setInterval(() => {
        sessionExpiredTorrent = sessionExpiredTorrent - 1;
    }, 1000)
    while (sessionExpiredTorrent != 0) {
        await delay(1000)
    }
    clearInterval(interval)
    stopSessionTorrent()
}
// Update session expiration in seconds
let updateExpirationTorrent = (s, str) => { str == "add" ? sessionExpiredTorrent += s : sessionExpiredTorrent = s }
// Get session expiration
let getExpirationTorrent = () => { return sessionExpiredTorrent }

module.exports = {
    startSessionTorrent,
    stopSessionTorrent,
    isRunningTorrent,
    setExpirationTorrent,
    updateExpirationTorrent,
    getExpirationTorrent,
    search,
    download,
    getDetails,
    getAllTorrentDetails,
    getTorrentDetails,
    getMediaFolders,
    getAbsolutePath,
    isHackingFolders,
    setOrder,
    getOrder,
    setTorrentStatus,
    getStatus,
    getMagnet,

}