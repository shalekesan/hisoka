var express = require('express'),
    session = require('express-session'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    evercookie = require('evercookie'),
    favicon = require('serve-favicon');
    mongoose = require('mongoose'),
    logger = require('morgan'),
    csrf = require('csurf'),
    ejs = require('ejs'),
    app = express(),
    server = require('http').createServer(app),
    ews = require('express-ws')(app, server);

config = require('./config/config');
fs = require('fs');
sql = require('./config/models');
mongoose.connect(config.db);

app.set('view engine', 'ejs');
app.engine('html', ejs.renderFile);
ejs.open = '{{';
ejs.close = '}}';

app.use(logger());
app.use(cookieParser());
app.use(evercookie.backend());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(session({
    name:'session',
    secret:'hey',
    cookie:{
        httpOnly:true,
        path:'/home'
    }
}));
app.use(session({
    name:'victim',
    secret:'page',
    cookie:{
        httpOnly:true,
        path:'/e'
    }
}));
app.use('/home', csrf());
function err404(req, res, next){
    return res.status(404).json({err:404});
};
app.use(favicon(__dirname+'/static/favicon.ico'));
app.use('/static', express.static(__dirname+'/static'));
app.use('/home', function(req, res, next){
    for(var i in req.query)if(typeof req.query[i] != 'string')delete req.query[i];
//    for(var i in req.body)if(typeof req.body[i] != 'string')req.body[i] = JSON.stringify(req.body[i]);
    if(req.path != '/login')if(!req.session.user)return err404(req, res);
    res.locals.token = req.csrfToken();
    res.header('X-Frame-Options', 'DENY');
    next();
});

var page = require('./routes/page'),
    home = require('./routes/home');

app.use('/home', home.router);
app.use('/', page.router);
app.ws('/home/page/:uri', page.ws);
app.ws('/e/:uri', page.ws);

app.use('*', err404);
app.listen(config.port, config.ip);
