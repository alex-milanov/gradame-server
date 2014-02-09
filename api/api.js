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

module.exports = {
    init: function(app) {

        app.get('/api', function(req, res) {

            var response = {
                metadata: {
                    users: 'http://127.0.0.1/api/users',
                    signals: 'http://127.0.0.1/api/signals'
                }
            };

            res.send(response);
        });

        // =====================================================
        // Users
        // =====================================================

        // get users with filter and paging
        app.get('/api/users', function(req, res) {
            var perPage = req.query.perPage ? req.query.perPage : 20;
            var page = req.query.page ? req.query.page : 0;

            //populate
            //filter
            //sort

            db.User.find({})
                .limit(perPage)
                .skip(page*perPage)
                .select('name registerAt')
                .exec(function(err, users) {

                    var nextPageUrl = users.length < perPage ? null : '/api/users/' + '?perPage=' + perPage + "&page=" + (parseInt(page) + 1);
                    var previousPageUrl = parseInt(page) == 0 ? null : '/api/users/' + '?perPage=' + perPage + "&page=" + (parseInt(page) - 1);

                    var response = {
                        metadata: {
                            limit: perPage,
                            next: nextPageUrl,
                            page: page,
                            previous: previousPageUrl,
                            total_count: users.length
                        },
                        data: users ? users : {}
                    };

                    if(err) { response.error = "Erorr: " + err; }

                    res.send(response);
                });
        });

        // create new user
        app.post('/api/users', function(req, res) {
            res.send('users');
        });

        // -----------------------------------------------------

        // get user
        app.get('/api/users/:id', function(req, res) {

            var id = req.params.id;

            db.User.findById(id)
                .select('name registerAt')
                .exec(function (err, user) {
                var response = {
                    metadata: {},
                    data: user ? user : {}
                };

                if(err) { response.error = "Erorr: " + err; }

                res.send(response);
            });

        });

        // update user
        app.put('/api/users/:id', function(req, res) {
            res.send('users');
        });

        // delete user
        app.delete('/api/users/:id', function(req, res) {
            res.send('users');
        });

        // =====================================================
        // Signals
        // =====================================================

        app.get('/api/signals', function(req, res) {
            var response = {
                metadata: {
                    limit: 20,
                    next: null,
                    offset: 0,
                    previous: null,
                    total_count: 2
                },
                data: []
            };

            res.send(response);
        });

        app.post('/api/signals', function(req, res) {
            res.send('signals');
        });
    }
};