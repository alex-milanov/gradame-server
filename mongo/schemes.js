/**
 * Created by nikolaialeksandrenko on 2/6/14.
 */

var Schema = require('mongoose').Schema;

module.exports = {

    signalTypesSchema: {
        type: String,
        icon: String,
        thumbnail: String
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
        location: { type: [Number], index: '2dsphere' },
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
            updatedAd: Date,
            image: String,
            text: String,
            action: String
        } ],
        validated: Boolean,
        validatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        created: { type: Date, default: Date.now },
        updated: Date
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