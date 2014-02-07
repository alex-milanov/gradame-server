
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var db = require('./mongo/db');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var urls = require('urls');

var app = express();

// constatnts
var HOST_POST = 3001;

// all environments
app.set('port', HOST_POST);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);
//app.use(express.favicon());
app.use(express.logger('dev'));
//app.use(express.json());
//app.use(express.urlencoded());
//app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.bodyParser()); // BODY PARSER IS CAUSING WARNING IT WILL BREAK IN CONNECT-3 upgrade
app.use(express.session({ secret: '3264ytgerw3454tr' }));
app.use(passport.initialize());
app.use(passport.session());

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// ---------------------------------------------------------
db.init();
// ---------------------------------------------------------

urls([
    { pattern: "/",                 view: routes.index,             name: "index",          get: true },
    { pattern: "/signals/",         view: routes.signals,           name: "signals",        get: true },
    { pattern: "/signal/:id",       view: routes.signal,            name: "signal",         get:true },
    { pattern: "/add-signal",       view: routes.addSignal,         name: "add-signal",     get:true },
    { pattern: "/users/",           view: routes.users,             name: "users",          get:true },
    { pattern: "/users/:id",        view: routes.user,              name: "user",           get:true },
    { pattern: "/register/",        view: routes.registerUser,      name: "register-user",  get:true, post: true },
    { pattern: "/faq/",             view: routes.faq,               name: "faq",            get:true },
    { pattern: "/about/",           view: routes.about,             name: "about",          get:true },
    { pattern: "/contacts/",        view: routes.contacts,          name: "contacts",       get:true },
    { pattern: "/for-developers/",  view: routes.forDevelopers,     name: "for-developers", get:true },
    { pattern: "/for-authorities/", view: routes.forАuthorities,    name: "for-authorities", get:true }
], app);

// LOGIN WITH PASSPORT AND USER/PASS
//passport.use(new LocalStrategy(
//    function(username, password, done) {
//        db.user.findOne({ name: username }, function(err, user) {
//            if (err) { return done(err); }
//            if (!user) {
//                return done(null, false, { message: 'Incorrect username.' });
//            }
//            if (user.password != password) {
//                return done(null, false, { message: 'Incorrect password.' });
//            }
//            return done(null, user);
//        });
//    }
//));
//
//passport.serializeUser(function(user, done) {
//    console.log('serializeUser');
//    done(null, user.id);
//});
//
//passport.deserializeUser(function(id, done) {
//    console.log('deserializeUser');
//    User.findById(id, function(err, user) {
//        done(err, user);
//    });
//});
//
//app.post('/login', passport.authenticate('local'),
//    function(req, res) {
//        res.send("SUCCESS");
//        // If this function gets called, authentication was successful.
//        // `req.user` contains the authenticated user.
//
//    });

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
