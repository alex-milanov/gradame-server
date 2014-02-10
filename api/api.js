/**
 * Created by nikolaialeksandrenko on 2/8/14.
 */
var db = require('../mongo/db');
var fs = require('fs');

//"meta": {
//    "limit": 20,
//        "next": null,
//        "offset": 0,
//        "previous": null,
//        "total_count": 2
//},

// api/ - meta with all resources
// api/User - filtering, paging, meta with limit, next, previous, offset, total_count
// api/User/id - get,post,put,delete - configurable
//GET api/resources
//GET api/resources/:id
//POST api/resources
//PUT api/resources/:id
//DELETE api/resources/:id

function initApp(app) {

    var apiBaseUrl = '/api';
    var apiResponseMetadata = {};
    var resources = [];

    var defaultPerPage = 20;

    var userResource = {
        name: "users",
        model: db.User,
        selectedFields: 'name registerAt',
        methods: ['get', 'post']
    };

    var signalsResource = {
        name: "signals",
        model: db.Signal,
        selectedFields: 'type author authorName description location address status image votes thanks comments validated registerAt',
        methods: ['get', 'post']
    };

    resources.push(userResource);
    resources.push(signalsResource);

    //go through resources
    console.log('Go through resources:');
    for(var i=0; i < resources.length; i++) {

        //local scope so variables are scoped
        (function() {

            var resource = resources[i];
            var resourceUrl = apiBaseUrl + '/' + resource.name;

            //TODO: validator for resource - name, model - existing, selectedFields can me optional, methods

            //create api metadata
            apiResponseMetadata[resource.name] = resourceUrl;
            //end creating api metadata

            //create methods
            for(var m=0; m < resource.methods.length; m++) {
                var method = resource.methods[m];

                app[method](resourceUrl, function(req, res) {
                    var query = req.query;
                    var perPage = query.perPage ? query.perPage : defaultPerPage;
                    var page = query.page ? query.page : 0;

                    var nextPageUrl = resourceUrl + '?page=' + (parseInt(page) + 1);
                    var previousPageUrl = parseInt(page) === 0 ? null : resourceUrl + '?page=' + (parseInt(page) - 1);

                    if(perPage !== defaultPerPage) {
                        nextPageUrl += '&perPage=' + perPage;
                    }

                    //sort
                    //fields
                    //filter

                    var q = resource.model.find({})
                        .limit(perPage)
                        .skip(page * perPage)
                        .select(resource.selectedFields);

                    q.exec(function(err, entities) {
                        var response = {
                            metadata: {
                                per_page: perPage,
                                next: nextPageUrl,
                                page: page,
                                previous: previousPageUrl
                            },
                            data: entities ? entities : {}
                        };

                        if(err) { response.error = err; }

                        res.send(response);
                    });
                });
            }
        })();
    }

    //the standart api/ url with metadata responce
    app.get(apiBaseUrl, function(req, res) {
        res.send( {
            metadata: apiResponseMetadata
        });
    });
}

module.exports = {
    init: function(app) {

        initApp(app);

        app.get('/api2', function(req, res) {

            var response = {
                metadata: {
                    users: 'http://127.0.0.1/api/users',
                    signals: 'http://127.0.0.1/api/signals'
                }
            };

            res.send(response);
        });
    }
};