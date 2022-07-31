var express = require('express');
var router = express.Router();
var session = require('express-session');

router.use(session({
    secret: 'AhSDh7gj0a2da23lj',
    resave: false,
    saveUninitialized: true,
}))

router.post('/telegram', (req, res) => {
    if(req.headers["x-telegram-bot-api-secret-token"] != process.env.TELEGRAM_AUTH_TOKEN) return res.json('error')
    console.log(req.body)
    res.send("hi ")
})
router.post('/ifttt', (req, res) => {
    if(req.headers["x-ifttt-secret-token"] != process.env.IFTTT_AUTH_TOKEN) return res.json('error')
    console.log(req.body)
    res.send("hi ").status(200)
})


router.post('/google', (req, res) => {
    //if(req.headers["x-ifttt-secret-token"] != process.env.IFTTT_AUTH_TOKEN) return res.json('error')
    console.log(req.body)
    res.send("hi ").status(200)
})
router.get('/google', (req, res) => {
    //if(req.headers["x-ifttt-secret-token"] != process.env.IFTTT_AUTH_TOKEN) return res.json('error')
    console.log(req.body)
    res.send("hi ").status(200)
})
router.post('/google/token', (req, res) => {
    //if(req.headers["x-ifttt-secret-token"] != process.env.IFTTT_AUTH_TOKEN) return res.json('error')
    console.log(req.body)
    res.send("hi ").status(200)
})
router.get('/google/token', (req, res) => {
    //if(req.headers["x-ifttt-secret-token"] != process.env.IFTTT_AUTH_TOKEN) return res.json('error')
    console.log(req.body)
    res.send("hi ").status(200)
})
router.post('/google/oauth/oauth', (req, res) => {
    //if(req.headers["x-ifttt-secret-token"] != process.env.IFTTT_AUTH_TOKEN) return res.json('error')
    console.log(req.body)
    res.send("hi ").status(200)
})
router.get('/google/oauth/oauth', (req, res) => {
    //if(req.headers["x-ifttt-secret-token"] != process.env.IFTTT_AUTH_TOKEN) return res.json('error')
    console.log(req.body)
    res.send("hi ").status(200)
})

module.exports = router;