require('dotenv').config()
const Transport = require('winston-transport');
require('winston-daily-rotate-file');
const winston = require('winston');
// const { format } = winston;
const path = require('path');
const { Telegraf } = require('telegraf');
const format = require('telegraf/format')

class Telegram extends Transport {
    constructor(opts) {
        super(opts);
        this.telegraf = new Telegraf(process.env.TOKEN)
    }

    log(info, callback) {
        setImmediate(() => {
            this.emit('logged', info);
        });

        // Perform the writing to the remote service
        this.telegraf.telegram.sendMessage(process.env.CHAT_ID, info.message);
        callback();
    }
}

let levelFilter = winston.format((info, level) => {
    return info.level == level ? info : false
})
let telegramFilter = winston.format((info, levels) => {
    let context = info.level == 'error' ? '[ER]: ' : info.context || '[AP]: '
    let text = format.bold(context)
    text.text += info.message
    info.message = text

    if(typeof levels === 'string') return info.level == levels ? info : false
    if(!(levels instanceof Array)) throw new Error('levels must be a string or an array')
    if(levels.includes(info.level)) return info
    
    return false
})
let simpleFormat = ({ level, message, label, timestamp }) => {
    return `\x1b[90m${timestamp} ${label ? '\x1b[1m[' + label  + ']': '|' }\x1b[0m ${level}: ${message}`;
}
let logFormat = (info) => {
    let { level, message, timestamp, ...args } = info;
    let formatted = {
            timestamp,
            level,
            // ...(context && { context }),
            message,
            metadata: {...args}
        }
    return JSON.stringify(formatted)
}
const colors = {
    error: 'underline bold red',
    warn: 'yellow',
    info: 'italic blue',
    http: 'cyan',
    verbose: 'green',
    debug: 'underline magenta'
}

let transports = {
    console: new winston.transports.Console({
        level: 'debug',
        format: winston.format.combine(
            winston.format.timestamp({ format: 'DD/MM/YYYY HH:mm:ss' }),
            winston.format.colorize({colors}),
            winston.format.printf(simpleFormat)
        )
    }),
    errorFile: new winston.transports.File({
        level: 'debug',
        filename: path.join(__dirname, '../log/websites/admin_panel/errors.log'),
        format: winston.format.combine(
            levelFilter('error'),
            winston.format.timestamp({ format: 'DD/MM/YYYY HH:mm:ss' }),
            winston.format.json(),
            winston.format.printf(logFormat)
        )
    }),
    warnFile: new winston.transports.File({
        level: 'debug',
        filename: path.join(__dirname, '../log/websites/admin_panel/warn.log'),
        format: winston.format.combine(
            levelFilter('warn'),
            winston.format.timestamp({ format: 'DD/MM/YYYY HH:mm:ss' }),
            winston.format.json(),
            winston.format.printf(logFormat)
        )
    }),
    combinedFile: new winston.transports.File({
        level: 'verbose',
        filename: path.join(__dirname, '../log/websites/admin_panel/combined.log'),
        format: winston.format.combine(
            winston.format.timestamp({ format: 'DD/MM/YYYY HH:mm:ss' }),
            winston.format.json(),
            winston.format.printf(logFormat)
        )
    }),
    telegram: new Telegram({
        level: 'debug',
        format: telegramFilter(['error', 'info'])
    })
}

winston.loggers.add('logger', {
    level: 'info',
    defaultMeta: { service: 'admin-panel' },
    transports: [
        transports.console,
        transports.errorFile,
        transports.warnFile,
        transports.combinedFile,
        transports.telegram,
        // new winston.transports.Http({ host: process.env.LOG_HOST, port: process.env.LOG_PORT, path: process.env.LOG_PATH})
    ]
});
