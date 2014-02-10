
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
var api = require('./api/api');

var app = express();

// constatnts
var HOST_POST = 3001;

// all environments
app.set('port', HOST_POST);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
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
api.init(app);
// ---------------------------------------------------------

urls([
    { pattern: "/",                 view: routes.index,             name: "index"},
    { pattern: "/logout/",          view: routes.logOut,            name: "logout"},
    { pattern: "/signals/",         view: routes.signals,           name: "signals"},
    { pattern: "/signal/:id",       view: routes.signal,            name: "signal"},
    { pattern: "/add-signal",       view: routes.addSignal,         name: "add-signal"},
    { pattern: "/users/",           view: routes.users,             name: "users"},
    { pattern: "/users/:id",        view: routes.User,              name: "user", methods: []},
    { pattern: "/register/",        view: routes.registerUser,      name: "register-user",  methods: ['post', 'get'] },
    { pattern: "/faq/",             view: routes.faq,               name: "faq"},
    { pattern: "/about/",           view: routes.about,             name: "about"},
    { pattern: "/contacts/",        view: routes.contacts,          name: "contacts"},
    { pattern: "/for-developers/",  view: routes.forDevelopers,     name: "for-developers"},
    { pattern: "/for-authorities/", view: routes.forАuthorities,    name: "for-authorities"}
], app);

//LOGIN WITH PASSPORT AND USER/PASS
passport.use(new LocalStrategy(
    function(username, password, done) {
        console.log("LocalStrategy");

        db.User.findOne({ email: username }, function(err, user) {
            if (err) { return done(err); }
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            if (user.password != password) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        });
    }
));

passport.serializeUser(function(user, done) {
    console.log('serializeUser');
    console.log(user);
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    console.log('deserializeUser');
    db.User.findById(id, function(err, user) {
        done(err, user);
    });
});

app.post('/login/',
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true })
);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
