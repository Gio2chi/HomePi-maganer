require('dotenv').config()
const telegramApi = require('node-telegram-bot-api');

//const bot = new telegramApi(process.env.TOKEN, {polling: true})

const chatIDs = process.env.CHAT_IDs.split(', ')
/*bot.on('message', (message) => {
    bot.sendMessage(message.chat.id, 'ciao')
    console.log(message)
})*/
const appsConstants = {
    telegramBot: {
        from: "TG Bot",
        name: "",
        value: ""
    },
    minecraftServer: {
        from: "MC Server",
        name: "",
        value: ""
    },
    discordBot: {
        from: "DS Bot",
        name: "",
        value: ""
    },
    website: {
        from: "Web APP",
        name: "",
        value: ""
    }, 
    application: {
        from: "",
        name: "",
        value: ""
    }
}

const sendMessage = (textObj) => {
    const bot = new telegramApi(process.env.TOKEN)
    chatIDs.forEach((chatID) => bot.sendMessage(chatID, normalizeTextObj(textObj), { parse_mode: 'HTML' }))
}

const normalizeTextObj = (textObj) => {
    let result = "<b>[" + textObj.from + "]</b>: " 
    result += textObj.name ? "<i>" + textObj.name + "</i>: " + textObj.value : textObj.value;
    return result
} 

module.exports = {
    sendMessage,
    appsConstants
}