require('dotenv').config()
var express = require('express');
var router = express.Router();
var session = require('express-session');

const web = require('../../modules/websitesInterface');

router.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}))

// reorganize endpoint
// router.get('/console/:websiteName', (req, res) => {
//     if (!req.session.user) {
//         req.metadata = { 'error-message': 'user not logged' }
//         return res.status(401).json({ status: 'error' });
//     }
    
// })

let websites = []
router.post('/log/:websiteName', (req, res) => {
    if(req.headers["x-websites-secret-token"] != process.env.WEBSITES_TOKEN) return res.status(401).json({ status: 'Authentication required' })
    
    let name = req.params.websiteName

    if(!websites[name]) websites[name] = web.createWebsite({ level: 'info',  name })
    websites[name].log(req.body)

    res.sendStatus(200).json({ status: 'success' })
})

module.exports = router;