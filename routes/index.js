var db = require('../mongo/db');

exports.index = function(req, res) {
  res.render('index', { title: 'Express' });
};

exports.signals = function(req, res) {
    res.render('signals', { title: 'Express' });
};

exports.signal = function(req, res) {
    res.render('signal', { id: req.params.id });
};

exports.addSignal = function(req, res) {
    res.render('add-signal', { title: 'Express' });
};

exports.users = function(req, res) {
    res.render('users', { title: 'Express' });
};

exports.user = function(req, res) {
    var id = req.params.id;
    db.user.findById(id, function(err, user) {
        res.render('user', {
            user: user,
            error: err
        });
    });
};

exports.faq = function(req, res) {
    res.render('faq', { title: 'Express' });
};

exports.about = function(req, res) {
    res.render('about', { title: 'Express' });
};

exports.contacts = function(req, res) {
    res.render('contacts', { title: 'Express' });
};

exports.forDevelopers = function(req, res) {
    res.render('for-developers', { title: 'Express' });
};

exports.forАuthorities = function(req, res) {
    res.render('for-authorities', { title: 'Express' });
};

exports.registerUser = function(req, res) {
    if(req.body.email && req.body.password) {
        var newUser = db.user({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        }).save(function(err, user) {
            var success = err ? false : true;
            res.render('register-user', {
                user: user,
                error: err,
                success: success
            });
        });
    } else {
        res.render('register-user');
    }
};