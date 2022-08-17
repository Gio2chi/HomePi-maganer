require('dotenv').config()
const TorrentSearchApi = require('torrent-search-api');
const TransmissionApi = require('transmission');
const fs = require('fs');
const path = require('path');
const telegram = require('./telegramInterface');

//if the url of the provider does change, update it in the .dotev file and in the node_modules folder
// the pirate bay does not provide the best results
//TorrentSearchApi.enableProvider('ThePirateBay')
TorrentSearchApi.enableProvider('1337x')

const transmission = new TransmissionApi({
    username: 'Gio2chi',
    password: "09JKShd23ad",
    host: '192.168.0.21',
});

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json')));

let search = async (torrentName) => {
    let torrents = await TorrentSearchApi.search(torrentName, 'All', 20)
    //for(let i = 0; i != torrents.length; i++) torrents[i].magnet = await TorrentSearchApi.getMagnet(torrents[i])
    return torrents
}

let getMagnet = async (torrent) => {
    return await TorrentSearchApi.getMagnet(torrent)
}

let download = (magnet, dir) => {
    if (dir)
        transmission.addUrl(magnet, { "download-dir": "/export/Gio_A_NAS/Plex" + dir }, (err, args) => {
            if(err) {
                console.log(err)
                return;
            }
            let msg = telegram.appsConstants.application
            msg.from = "AP"
            msg.value = "Downloading " +args.name
            telegram.sendMessage(msg)
        })
    else
        transmission.addUrl(magnet, (err, args) => {
            console.log(err, args);
        })
}

let torrents 
let getDetails = () => {
    return torrents
}

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

let getMediaFolders = (dest) => {
    let folders
    if (dest) {
        console.log(dest)
        let pathToFolder = path.join(config.default_media_folder, dest)
        if (fs.existsSync(pathToFolder)) {
            folders = fs.readdirSync(pathToFolder, { withFileTypes: true });
            folders = folders.filter(folder => folder.isDirectory()).map(folder => folder.name)
        }
    } else {
        folders = fs.readdirSync(path.join(config.default_media_folder), { withFileTypes: true })
        folders = folders.filter(folder => folder.isDirectory()).map(folder => folder.name)
    }

    return folders
}

let getAbsolutePath = (dest) => {
    return path.join(config.default_media_folder, dest)
}

let isHackingFolders = (folder) => {
    if (folder.includes("../") || folder.includes("..\\") || folder.includes("\\..") || folder.includes("/..")) return true;
    return false;
}

var orderList = []
let setOrder = (order) => {
    orderList = []
    orderList = order
}
let getOrder = async () => {
    if((await getAllTorrentDetails()).length > orderList.length)
        return orderList
    else return []
}

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

let runningTorrent
let startSessionTorrent = (s) => {
    if (runningTorrent) return
    runningTorrent = true
    asyncInterval(getAllTorrentDetails, 1500)

    setExpirationTorrent(s)
}
let stopSessionTorrent = () => {
    runningTorrent = false
}
let isRunningTorrent = () => { return runningTorrent }

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

let asyncInterval = async (asyncFunction, ms) => {
    while (runningTorrent) {
        await asyncFunction()
        await delay(ms)
    }
    console.log("exiting asyncInterval")
}

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
let updateExpirationTorrent = (s, str) => {
    if (str == "add") sessionExpiredTorrent += s
    sessionExpiredTorrent = s
}

let getExpirationTorrent = () => {
    return sessionExpiredTorrent
}

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