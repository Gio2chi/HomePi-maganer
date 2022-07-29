require('dotenv').config()
const TorrentSearchApi = require('torrent-search-api');
const TransmissionApi = require('transmission');
const fs = require('fs');
const path = require('path');

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
    return torrents
}

let download = (magnet, path) => {
    if(path)
        transmission.addUrl(magnet, {"download-dir": path}, (err, args) => {
            console.log(err, args);
        })
    else
        transmission.addUrl(magnet, (err, args) => {
            console.log(err, args);
        })
}

let details
let updateDetails = () => {
    transmission.get((err, result) => {
        if (err) {
            console.log(err);
        }
        details = result.torrents
    });
}
let getDetails = () => {
    return details;
}

let getAllTorrentDetails = async () => {
    return new Promise((resolve, reject) => {
        transmission.get((err, result) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            details = result.torrents
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
        let pathToFolder = path.join(config.default_media_folder, dest)
        if(fs.existsSync(pathToFolder)){
            folders = fs.readdirSync(pathToFolder, {withFileTypes: true});
            folders = folders.filter(folder => folder.isDirectory()).map(folder => folder.name)
        }
    } else {
        folders = fs.readdirSync(path.join(config.default_media_folder), {withFileTypes: true})
        folders = folders.filter(folder => folder.isDirectory()).map(folder => folder.name)
    }
    
    return folders
}

let getAbsolutePath = (dest) => {
    return path.join(config.default_media_folder, dest)
}

let isHackingFolders = (folder) => {
    if(folder.includes("../") || folder.includes("..\\")) return true;
    return false;
} 

module.exports = {
    search,
    download,
    getDetails,
    getAllTorrentDetails,
    getTorrentDetails,
    getMediaFolders,
    getAbsolutePath,
    isHackingFolders
}