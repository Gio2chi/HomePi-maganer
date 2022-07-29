const { authenticator } = require('otplib')
const telegram = require('./telegramInterface')

let secret = "N5WU4U36BMAHUPYT"
const username = 'Gio2chi'

// implement one time password
const checkUser = (params) => {
    if (params.username === username && authenticator.check(params.password, secret)) {
        let msg = telegram.appsConstants.application
        msg.from = "AP"
        msg.value = params.username + "logged in"
        telegram.sendMessage(msg)
        return true;
    }
    return false;
}

module.exports = {
    checkUser
}