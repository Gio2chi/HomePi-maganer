const fs = require('fs');
const Path = require('path');
const StreamCache = require('stream-cache');

const logFolder = Path.join(__dirname, '../log/websites');
let websitesArr = [];

let logToFile = (websiteName, stream) => {
    if (!fs.existsSync(Path.join(logFolder, websiteName))) fs.mkdirSync(Path.join(logFolder, websiteName))

    setData(websiteName)
    setInterval(() => { setData(websiteName) }, 24 * 60 * 60 * 1000)

    websitesArr[websiteName].stream = stream

    stream.on('data', (buffer) => {
        let file = websitesArr[websiteName].path
        let lines = buffer.toString().split('\n')
        fs.appendFileSync(Path.join(file), buffer.toString())
        lines.forEach(line => {
            if (websitesArr[websiteName].cache._buffers.length >= 1000) websitesArr[websiteName].cache._buffers.shift();
            websitesArr[websiteName].cache._buffers.push(line + '\n')
        }) 
        if (websitesArr[websiteName].cache._buffers.length > 0)
            websitesArr[websiteName].cache.pipe(fs.createWriteStream(Path.join(logFolder, websiteName, 'temp.log')))
    })
}

let setData = (websiteName) => {
    let date = new Date().toISOString().substring(0, 10)
    let filePath = Path.join(logFolder, websiteName, date + '.log')
    fs.writeFileSync(filePath, '')
    websitesArr[websiteName] = { path: filePath, name: websiteName, cache: new StreamCache() }
}

let getConsoleStream = (websiteName, stream) => {
    let readable = fs.createReadStream(Path.join(logFolder, 'default.log'))
    if (fs.existsSync(Path.join(logFolder, websiteName, 'temp.log')))
        readable = fs.createReadStream(Path.join(logFolder, websiteName, 'temp.log'))
    
    readable.pipe(stream, { end: false })
    process.nextTick(function () {
        websitesArr[websiteName].stream.pipe(stream, { end: false })

        /*websitesArr[websiteName].stream.once('end', function () {
            stream.end()
        })*/
    })
}

let getWebsites = () => {
    let websites = fs.readdirSync(logFolder, { withFileTypes: true })
    return websites.filter(folder => folder.isDirectory()).map(folder => folder.name)
}

let websiteExists = (websiteName) => {
    if (getWebsites().includes(websiteName)) return true;
    return false;
}

module.exports = {
    getWebsites,
    logToFile,
    getConsoleStream,
    websiteExists
}