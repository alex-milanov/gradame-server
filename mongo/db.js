var mongoose = require('mongoose');
var schemas = require('./schemes');
var DATABASE_NAME = "test";

module.exports = {
    init: function(successHandler) {

        mongoose.connect('mongodb://localhost/' + DATABASE_NAME);

        var db = mongoose.connection;
        db.on('error', function(err) {
            console.log('');
            console.log("MongoDB connection error: " + err);
            console.log("1. Install: 'sudo brew install mongodb'");
            console.log("2. Run: 'mongod'");
            console.log('');
        });
        db.once('open', function callback () {
            console.log("MongoDB connection successful");

            if(successHandler) {
                successHandler();
            }
        });
    },

    user: mongoose.model('User', schemas.userSchema),
    avatar: mongoose.model('Avatar', schemas.avatarSchema),
    flagged: mongoose.model('Flagged', schemas.flaggedSchema),
    signal: mongoose.model('Signal', schemas.signalSchema)
};