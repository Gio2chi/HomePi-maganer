require('dotenv').config();
require('./modules/winston')
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/session');
var apiRouter = require('./routes/api');

var app = express();

const morganParams = {
  'http-version': 'HTTP/:http-version',
  method: ':method',
  url: ':url',
  status: ':status',
  'response-time': ':response-time',
  referrer: ':referrer',
  'content-length': ':res[content-length]',
  remote: {
    address: ':remote-addr',
    user: ':remote-user',
    agent: ':user-agent'
  }
}
const logger = winston.loggers.get('logger')
const logStream = {
  // Use the http severity
  write: (dataString) => {
    while(dataString.includes('\n')) dataString = dataString.replace('\n', '')

    let colorStatus = (status) => {
      status = parseInt(status)
      if (status >=100 && status <= 199) return "\x1b[34m" + status + "\x1b[0m"
      else if (status >=200 && status <= 299) return "\x1b[32m" + status + "\x1b[0m"
      else if (status >=300 && status <= 399) return "\x1b[36m" + status + "\x1b[0m"
      else if (status >=400 && status <= 499) return "\x1b[33m" + status + "\x1b[0m"
      else if (status >=500 && status <= 599) return "\x1b[31m" + status + "\x1b[0m"
      return status;
    }

    let message = `${JSON.parse(dataString).method} ${JSON.parse(dataString).url} ${colorStatus(JSON.parse(dataString).status)} ${JSON.parse(dataString)['response-time']} ms - ${JSON.parse(dataString)['content-length']}`

    logger.http({message, metadata: JSON.parse(dataString)})
  },
};
// GET / 304 192.793 ms - -
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(helmet());
app.use(cors());
app.use(morgan(JSON.stringify(morganParams), {stream: logStream}));
// app.use(morgan(format))
// app.use(morgan("combined", {stream: winston.stream}));
// app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
