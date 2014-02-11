
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
var BearerStrategy = require('passport-http-bearer').Strategy;
var urls = require('urls');
var api = require('./api/api');
var hbs = require('hbs');

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

//middleware for loged user
app.use(function(req, res, next) {
    res.locals.user = req.user;
    next();
});

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
    { pattern: "/signals/:id",      view: routes.signal,            name: "signal"},
    { pattern: "/signals/:id/thanks",      view: routes.thanks,     name: "thanks", methods: ['post']},
    { pattern: "/signals/:id/voteup",      view: routes.voteup,     name: "voteup", methods: ['post']},
    { pattern: "/signals/:id/comment",     view: routes.addComment, name: "comment", methods: ['post']},
    { pattern: "/add-signal",       view: routes.addSignal,         name: "add-signal", methods: ['post', 'get']},
    { pattern: "/users/",           view: routes.users,             name: "users"},
    { pattern: "/users/:id",        view: routes.user,              name: "user", methods: []},
    { pattern: "/register/",        view: routes.registerUser,      name: "register-user", methods: ['post', 'get'] },
    { pattern: "/faq/",             view: routes.faq,               name: "faq"},
    { pattern: "/about/",           view: routes.about,             name: "about"},
    { pattern: "/contacts/",        view: routes.contacts,          name: "contacts"},
    { pattern: "/for-developers/",  view: routes.forDevelopers,     name: "for-developers"},
    { pattern: "/for-authorities/", view: routes.forАuthorities,    name: "for-authorities"}
], app);


// handlebars extend

var blocks = {};

hbs.registerHelper('extend', function(name, context) {
    var block = blocks[name];
    if (!block) {
        block = blocks[name] = [];
    }

    block.push(context.fn(this)); // for older versions of handlebars, use block.push(context(this));
});

hbs.registerHelper('block', function(name) {
    var val = (blocks[name] || []).join('\n');

    // clear the block
    blocks[name] = [];
    return val;
});

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
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    db.User.findById(id, function(err, user) {
        done(err, user);
    });
});

app.post('/login/',
    passport.authenticate('local', {
        successRedirect: 'back',
        failureRedirect: 'back'})
);

// PASSPORT OAUTH2
passport.use(new BearerStrategy({
        realm: 'Clients'
    },
    function(token, done) {
        //always loged successfull
        console.log('api auth with token: ' + token);
        return done(null, {}, { scope: 'all' });
        /*
         // CHECK FOR TOKEN
         User.findOne({ token: token }, function (err, user) {
         if (err) { return done(err); }
         if (!user) { return done(null, false); }
         return done(null, user, { scope: 'read' });
         });
         */
    }
));

app.get('/api/auth',
    passport.authenticate('bearer', { session: false }),
    function(req, res) {
        console.log(req.host);
        res.send('success ' + req.host);
    });
//end oauth2

app.get('/api/authtest', function(req, res) {
    res.send('test' + req.authInfo);
});


http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});