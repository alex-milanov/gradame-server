/**
 * Created by nikolaialeksandrenko on 2/8/14.
 */
var db = require('../mongo/db');

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
    var apiResponseResources = [];
    var resources = [];

    var defaultPerPage = 20;

    var userResource = {
        name: "users",
        model: db.User,
        listFields: 'name',
        detailedFields: 'name registerAt validated',
        methods: ['get', 'post']
    };

    var signalsResource = {
        name: "signals",
        model: db.Signal,
        listFields: 'type image author authorName description location',
        detailedFields: 'type author authorName description location address status image votes thanks comments validated registerAt',
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
            var resourceDetailedUrl = resourceUrl + '/:id';

            //TODO: validator for resource - name, model - existing, selectedFields can me optional, methods

            //create methods
            for(var m=0; m < resource.methods.length; m++) {
                var method = resource.methods[m];

                //create api metadata
                apiResponseResources.push(
                    {
                        url: resourceUrl,
                        method: method
                    },
                    {
                        url: resourceDetailedUrl,
                        method: method
                    }
                );
                //end creating api metadata

                var requestHandler = function(req, res) {
                    var query = req.query;
                    var id = req.params.id;
                    var perPage = query.per_page ? query.per_page : defaultPerPage;
                    var page = query.page ? query.page : 0;
                    var metadata = {};
                    // the mongoose query
                    var q = {};
                    if(id) {
                        //current item by id
                        q = resource.model.findById(id);
                        q.select(resource.detailedFields);
                    } else {
                        //get list
                        var nextPageUrl = resourceUrl + '?page=' + (parseInt(page) + 1);
                        var previousPageUrl = parseInt(page) === 0 ? null : resourceUrl + '?page=' + (parseInt(page) - 1);

                        if(perPage !== defaultPerPage) {
                            nextPageUrl += '&perPage=' + perPage;
                        }

                        q = resource.model.find({});
                        q.limit(perPage);
                        q.skip(page * perPage);
                        q.select(resource.listFields);

                        //sort
                        if(query.sort) {
                            q.sort(query.sort);
                        }

                        metadata = {
                            per_page: perPage,
                            next: nextPageUrl,
                            page: page,
                            previous: previousPageUrl,
                            total_count: ''
                        };
                    }

                    //fields
                    //populate
                    //filter

                    var executeQuery = function() {
                        q.exec(function(err, entities) {
                            var response = {
                                metadata: metadata,
                                data: entities ? entities : {}
                            };

                            if(err) { response.error = err; }

                            res.send(response);
                        });
                    }

                    if(!id) {
                        var total = '-';
                        resource.model.count(function(err, count) {
                            metadata.total_count = count;
                            executeQuery();
                        });
                    } else {
                        executeQuery();
                    }
                };

                app[method](resourceUrl, requestHandler);
                app[method](resourceDetailedUrl, requestHandler);

            }
        })();
    }

    //the standart api/ url with metadata responce
    app.get(apiBaseUrl, function(req, res) {
        res.send( {
            resources: apiResponseResources
        });
    });
}

module.exports = {
    init: function(app) {

        initApp(app);
    }
};