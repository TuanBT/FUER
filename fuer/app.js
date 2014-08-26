/**
 * Module dependencies.
 */

var express = require('express')
    , indexRoute = require('./routes/index.js')
    , termRoute = require('./routes/terms.js')
    , index2Route = require('./routes/index2.js')
    , adminRoute = require('./routes/admin.js')
    , searchRoute = require('./routes/search.js')
    , testRoute = require('./routes/test.js')
    , http = require('http')
    , path = require('path')
    , db = require('./lib/db.js');

//register event


var app = express();
// all environments
app.set('port', process.env.PORT || 4000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
db.init();


// development only
if ('development' == app.get('env')) {
    app.set('photos', __dirname + '/public/photos');
    app.use(express.errorHandler());
}
if ('production' == app.get('env')) {
    app.set('photos', '/mounted-volume/photos');
}

app.get('/', index2Route.index);
app.post('/', index2Route.postdata);
app.post('/getLink',adminRoute.postdata)
app.post('/login',index2Route.postLogindata)
app.get('/terms', termRoute.index);
app.get('/index', indexRoute.index);
app.get('/index2', index2Route.index);
app.get('/admin', adminRoute.index);
app.get('/search', searchRoute.index);
app.get('/test', testRoute.index);
http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

