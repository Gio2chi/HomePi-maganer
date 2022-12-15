require('dotenv').config()
const { authenticator } = require('otplib')
const telegram = require('./telegramInterface')

const username = 'Gio2chi'

// implement one time password
const checkUser = (params) => {
    if(process.env.NODE_ENV === 'DEBUG') return true
    if (params.username === username && authenticator.check(params.password, process.env.GA_SECRET)) {
        let msg = telegram.appsConstants.application
        msg.from = "AP"
        msg.value = params.username + " logged in"
        telegram.sendMessage(msg)
        return true;
    }
    return false;
}

module.exports = {
    checkUser
}