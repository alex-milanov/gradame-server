var db = require('../mongo/db');
var fs = require('fs');
var md5 = require('../utils/md5');

exports.index = function(req, res) {
  res.render('index', { user: req.user });
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

exports.logOut = function(req, res) {
    req.logout();
    res.redirect('back');
};

exports.registerUser = function(req, res) {
    if(req.body.email && req.body.password) {

        if(req.files.avatar.size != 0) {
            var fileType = req.files.avatar.type;

            console.log(req.files.avatar);

            if(fileType === 'image/gif' || fileType === 'image/jpeg' || fileType === 'image/jpg' || fileType === 'image/png') {
                fs.readFile(req.files.avatar.path, function (err, data) {
                    // ...

                    var ext = '.jpg';
                    if(fileType === 'image/gif') {
                        ext = '.gif';
                    } else if(fileType ==='image/png') {
                        ext = '.png';
                    }

                    var imgName = md5(req.body.email) + ext;

                    var newPath = __dirname + "/../public/avatars/" + imgName;
                    fs.writeFile(newPath, data, function (err) {
                        console.log(err);
                        console.log('uploaded');
                    });
                });
            }
        }

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