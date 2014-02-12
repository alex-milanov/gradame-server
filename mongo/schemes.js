/**
 * Created by nikolaialeksandrenko on 2/6/14.
 */

var Schema = require('mongoose').Schema;

module.exports = {

    signalTypesSchema: {
        type: String,
        icon: String
    },

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
        description: String,
        location: {
            lat: String,
            lng: String
        },
        address: String,
        status: String,
        image: String,
        votes: [{
            author: { type: Schema.Types.ObjectId, ref: 'User'}
        }],
        thanks: [{
            author: { type: Schema.Types.ObjectId, ref: 'User'}
        }],
        comments: [ {
            author: { type: Schema.Types.ObjectId, ref: 'User' },
            authorName: String,
            date: { type: Date, default: Date.now },
            image: String,
            text: String
        } ],
        validated: Boolean,
        validatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        created: { type: Date, default: Date.now }
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