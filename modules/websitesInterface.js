
const winston = require('winston');
const path = require('path');

let levelFilter = winston.format((info, level) => {
    return info.level == level ? info : false
})
let logFormat = (info) => {
    let { level, message, timestamp, ...args } = info;
    let formatted = {
        timestamp,
        level,
        // ...(context && { context }),
        message,
        metadata: { ...args }
    }
    return JSON.stringify(formatted)
}

const createWebsite = (options) => {
    const transports = [
        new winston.transports.File({
            level: 'debug',
            filename: path.join(__dirname, '../log/websites/' + options.name + '/errors.log'),
            format: winston.format.combine(
                levelFilter('error'),
                winston.format.timestamp({ format: 'DD/MM/YYYY HH:mm:ss' }),
                winston.format.json(),
                winston.format.printf(logFormat)
            )
        }),
        new winston.transports.File({
            level: 'debug',
            filename: path.join(__dirname, '../log/websites/' + options.name + '/warns.log'),
            format: winston.format.combine(
                levelFilter('warn'),
                winston.format.timestamp({ format: 'DD/MM/YYYY HH:mm:ss' }),
                winston.format.json(),
                winston.format.printf(logFormat)
            )
        }),
        new winston.transports.DailyRotateFile({
            filename: '%DATE%.log',
            dirname: path.join(__dirname, '../log/websites/' + options.name + '/combined/'),
            datePattern: 'YYYY-MM-DD-HH',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            level: 'verbose',
            format: winston.format.combine(
                winston.format.timestamp({ format: 'DD/MM/YYYY HH:mm:ss' }),
                winston.format.json(),
                winston.format.printf(logFormat)
            )
        })
    ]

    return winston.createLogger({transports, ...options})
}

module.exports = {
    createWebsite
}