require('dotenv').config()
const { authenticator } = require('otplib')

const username = 'Gio2chi'

// implement one time password
const checkUser = (params) => {
    if(process.env.NODE_ENV === 'DEBUG') return true
    if (params.username === username && authenticator.check(params.password, process.env.GA_SECRET)) {
        return true;
    }
    return false;
}

module.exports = {
    checkUser
}