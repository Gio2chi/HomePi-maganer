require('dotenv').config()
let winston = require('winston');

const logger = new winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `combined.log`
        //
        new winston.transports.Http({ host: 'localhost', port: 3001, path: '/api/websites/log/ciao', headers: { "x-websites-secret-token": process.env.WEBSITES_TOKEN } })
    ],
});

logger.info('ciao')