require('dotenv').config()
const telegramApi = require('node-telegram-bot-api');

const bot = new telegramApi(process.env.TOKEN)
//const bot = new telegramApi(process.env.TOKEN, {polling: true})

const chatIDs = process.env.CHAT_IDs.split(', ')
/*bot.on('message', (message) => {
    bot.sendMessage(message.chat.id, 'ciao')
    console.log(message)
})*/

const sendMessage = (message) => {
    chatIDs.forEach((chatID) => bot.sendMessage(chatID, message, { parse_mode: 'HTML' }))
}

module.exports = {
    sendMessage
}