var db = require('../mongo/db');
var fs = require('fs');
var md5 = require('../utils/md5');

exports.index = function(req, res) {
  res.render('index');
};

exports.signals = function(req, res) {

    var q = db.Signal.find().limit(10);

    q.exec(function(err, signals) {
        res.render('signals', { error: err, signals: signals });
    });
};

exports.signal = function(req, res) {
    res.render('signal', { id: req.params.id });
};

exports.addSignal = function(req, res) {

    console.log(req);

    var lat = req.body.lat;
    var lng = req.body.lng;
    var type = req.body.type;
    var photo = req.files.photo;
    var description = req.body.description;

    if(lat && lng && type && description) {

        var signal = new db.Signal({
            location: {
                lat: lat,
                lng: lng
            },
            description: description,
            type: type
        });

        signal.save(function(err, signal) {

            if(err) {
                res.render('add-signal', {
                    error: err
                });
            }

            if(photo) {
                if(photo.size != 0) {
                    var fileType = photo.type;

                    if(fileType === 'image/gif' || fileType === 'image/jpeg' || fileType === 'image/jpg' || fileType === 'image/png') {
                        fs.readFile(photo.path, function (err, data) {;
                            var newPath = __dirname + "/../public/pictures/" + photo.name;
                            fs.writeFile(newPath, data, function (err) {

                            });
                        });
                    }
                } else {
                    res.render('add-signal', {
                        signal: signal
                    });
                }
            }
        });
    } else {
        res.render('add-signal', {});
    }
};

exports.users = function(req, res) {

    var q = db.User.find().limit(10);

    q.exec(function(err, users) {
        res.render('users', { users: users, error: err });
    });
};

exports.user = function(req, res) {
    var id = req.params.id;

    db.User.findById(id, function(err, user) {

        db.Signal.find({'author' : user._id});

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

        var newUser = db.User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        }).save(function(err, user) {

            if(!err) {
                var success = err ? false : true;

                if(req.files.avatar.size != 0) {
                    var fileType = req.files.avatar.type;

                    if(fileType === 'image/gif' || fileType === 'image/jpeg' || fileType === 'image/jpg' || fileType === 'image/png') {
                        fs.readFile(req.files.avatar.path, function (err, data) {;
                            var newPath = __dirname + "/../public/avatar/" + user._id;
                            fs.writeFile(newPath, data, function (err) {
                                console.log(err);
                                console.log('uploaded');
                            });
                        });
                    }
                }
            }

            res.render('register-User', {
                User: user,
                error: err,
                success: success
            });
        });
    } else {
        res.render('register-User');
    }
};