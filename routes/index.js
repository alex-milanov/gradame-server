var db = require('../mongo/db');
var fileupload = require('../utils/upload').upload;

exports.index = function(req, res) {
  res.render('index');
};

exports.signals = function(req, res) {
    var q = db.Signal.find().limit(10).sort('-created');

    q.exec(function(err, signals) {
        res.render('signals', { error: err, signals: signals });
    });
};

exports.signal = function(req, res) {

    var q = db.Signal.findById(req.params.id);

    q.exec(function(err, signal) {
        res.render('signal', {
            error: err,
            signal: signal
        });
    });
};

exports.addSignal = function(req, res) {

    if(req.method == "POST") {

        var lat = req.body.lat;
        var lng = req.body.lng;
        var type = req.body.type;
        var photo = req.files.photo;
        var description = req.body.description;

        var signal = new db.Signal({
            location: {
                lat: lat,
                lng: lng
            },
            description: description,
            type: type,
            author: req.user,
            authorName: req.user.name
        });

        signal.save(function(err, signal) {

            if(err) {
                res.render('add-signal', {
                    error: err
                });
            }

            var publicFolder = "pictures";
            fileupload(photo.name, publicFolder, photo, function(err, image_url) {

                if(err) {
                    res.render('add-signal', {
                        error: err
                    });
                } else {
                    signal.image = image_url;
                }

                signal.save(function(err, signal) {
                    res.render('add-signal', {
                        error: err,
                        signal: signal
                    });
                });
            });
        });
    } else {
        res.render('add-signal');
    }
};

exports.addComment = function(req, res) {
    var signalId = req.body.signal_id;

    var photo = req.body.photo;
    var comment = req.body.comment;
    //TODO if action change status on signal
    var action = req.body.action;

    db.Signal.findById(signalId).exec(function(err, signal) {

        var newComment = {
            author: req.user,
            authorName: req.user.name,
            date: { type: Date, default: Date.now },
            image: photo,
            text: comment
        }

        signal.comments.push(newComment);
        signal.save(function(err) {
            res.redirect('back');
        });
    });
};

exports.voteup = function(req, res) {
    var signal_id = req.params.id;

    db.Signal.findById(signal_id).exec(function(err, signal) {

        var thanks = {
            author: req.user
        }

        signal.votes.push(thanks);
        signal.save(function(err) {
            res.redirect('back');
        });
    });
};

exports.thanks = function(req, res) {
    var signal_id = req.params.id;

    db.Signal.findById(signal_id).exec(function(err, signal) {

        var voteup = {
            author: req.user
        }

        signal.thanks.push(voteup);
        signal.save(function(err) {
            res.redirect('back');
        });
    });
};

exports.users = function(req, res) {

    var q = db.User.find().limit(10).sort('-registerAt');

    q.exec(function(err, users) {
        res.render('users', { users: users, error: err });
    });
};

exports.user = function(req, res) {
    var id = req.params.id;

    db.User.findById(id, function(err, _user) {

        db.Signal.find({'author' : _user._id}).limit(3).sort('-created').exec(function(err, signals) {
            res.render('user', {
                user: _user,
                signals: signals,
                error: err
            });
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

exports.flagUser = function(req, res) {
    var user_id = req.params.id;
    var reason = req.body.reason;

    db.User.findById(user_id).exec(function(err, user) {
        var newFlag = db.Flagged({
            targetType: "User",
            _flagged: user,
            reason: reason
        }).save(function(err) {
            res.redirect('back');
        });
    });
};

exports.flagComment = function(req, res) {
    var comment_id = req.params.comment_id;
    var reason = req.body.reason;

    db.Signal.find({ "comments": ObjectId(comment_id) }).exec(function(err, comment) {
        var newFlag = db.Flagged({
            targetType: "Comment",
            _flagged: comment,
            reason: reason
        }).save(function(err) {
            res.redirect('back');
        });
    });
};

exports.flagSignal = function(req, res) {
    var signal_id = req.params.id;
    var reason = req.body.reason;

    db.Signal.findById(signal_id).exec(function(err, signal) {
        var newFlag = db.Flagged({
            targetType: "Signal",
            _flagged: signal,
            reason: reason
        }).save(function(err) {
                res.redirect('back');
        });
    });
};