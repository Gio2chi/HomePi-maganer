const { authenticator } = require('otplib')

let secret = "N5WU4U36BMAHUPYT"
const username = 'Gio2chi'

// implement one time password
const checkUser = (params) => {
    if (params.username === username && authenticator.check(params.password, secret)) return true;
    return false;
}

module.exports = {
    checkUser
}