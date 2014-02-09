/**
 * Created by nikolaialeksandrenko on 2/6/14.
 */

var Schema = require('mongoose').Schema;

module.exports = {

    userSchema: {
        name: String,
        email: String,
        password: String,
        validated: String,
        registerAt: { type: Date, default: Date.now },
        location: {
            lat: String,
            Lng: String
        }
    },

    signalSchema: {
        type: String,
        author: { type: Schema.Types.ObjectId, ref: 'User' },
        authorName: String,
        authorEmail: String, //with the hash of the email we will can take the User's avatar
        description: String,
        location: {
            lat: String,
            Lng: String
        },
        address: String,
        status: String,
        imageUrl: String,
        votes: [{
            author: { type: Schema.Types.ObjectId, ref: 'User'}
        }],
        thanks: [{
            author: { type: Schema.Types.ObjectId, ref: 'User'}
        }],
        comments: [ {
            author: { type: Schema.Types.ObjectId, ref: 'User' },
            authorName: String,
            authorEmail: String, //with the hash of the email we will can take the User's avatar
            date: { type: Date, default: Date.now },
            imageUrl: String,
            text: String
        } ],
        validate: Boolean,
        validatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    },

    flaggedSchema: {
        _flagged: Schema.Types.ObjectId,
        targetType: String,
        reason: String,
        decision: String,
        checked: Boolean,
        _revisitedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    }
};