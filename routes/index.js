var express = require('express');
var router = express.Router();
var session = require('express-session');
const { checkUser } = require('../modules/user')
const telegram = require('../modules/telegramInterface')

router.use(session({
  secret: 'AhSDh7gj0a2da23lj',
  resave: false,
  saveUninitialized: true,
}))

/* GET home page. */
router.get('/', function (req, res, next) {
  if(req.session.user) return res.redirect('/users')
  res.render('login');
});

router.post('/login', function (req, res, next) {
  if (!checkUser(req.body)) return res.redirect('/');
  let msg = telegram.appsConstants.application
  msg.from = "AP"
  msg.value = "user logged in!"
  telegram.sendMessage(msg)
  req.session.user = req.body.username;
  res.redirect('/users')
});

module.exports = router;