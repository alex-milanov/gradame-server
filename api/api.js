var db = require('../mongo/db');


function initApp(app) {
  var apiBaseUrl = '/api/',
    loginUrl = apiBaseUrl + 'login',
    signalTypesUrl = apiBaseUrl + 'signals-types',
    signalsUrl = apiBaseUrl + 'signals',
    signalUrl = apiBaseUrl + 'signals/:id',
    usersUrl = apiBaseUrl + 'users',
    userUrl = apiBaseUrl + 'users/:id',
    commentsUrl = apiBaseUrl + 'signals/:id/comments',
    commentUrl = apiBaseUrl + 'signals/:id/comments/:comment_id',
    flagUserUrl = apiBaseUrl + 'users/:id/flag',
    flagCommentUrl = apiBaseUrl + 'signals/:id/comments/:comment_id/flag',
    flagSignalUrl = apiBaseUrl + 'api/signals/:id/flag',
    voteUpSignalUrl = apiBaseUrl + 'signals/:id/voteup',
    sayThanksUrl = apiBaseUrl + 'signals/:id/saythanks';

  var defaultLimit = 10;
  var defaultOffset = 0;

  app.get(apiBaseUrl, function (req, res) {
    var endPoints = [
      {
        url: loginUrl,
        method: 'POST'
      },
      {
        url: signalTypesUrl,
        method: 'GET'
      },
      {
        url: signalsUrl,
        method: 'GET'
      },
      {
        url: signalsUrl,
        method: 'POST'
      },
      {
        url: signalUrl,
        method: 'GET'
      },
      {
        url: signalUrl,
        method: 'PUT'
      },
      {
        url: signalUrl,
        method: 'DELETE'
      },
      {
        url: usersUrl,
        method: 'GET'
      },
      {
        url: usersUrl,
        method: 'POST'
      },
      {
        url: userUrl,
        method: 'GET'
      },
      {
        url: userUrl,
        method: 'POST'
      },
      {
        url: userUrl,
        method: 'DELETE'
      },
      {
        url: commentsUrl,
        method: 'POST'
      },
      {
        url: commentsUrl,
        method: 'POST'
      },
      {
        url: commentUrl,
        method: 'PUT'
      },
      {
        url: commentUrl,
        method: 'DELETE'
      },
      {
        url: flagUserUrl,
        method: 'POST'
      },
      {
        url: flagCommentUrl,
        method: 'POST'
      },
      {
        url: flagSignalUrl,
        method: 'POST'
      },
      {
        url: voteUpSignalUrl,
        method: 'POST'
      },
      {
        url: sayThanksUrl,
        method: 'POST'
      }
    ];

    res.send(endPoints);
  });

  // ===============================================
  // 1. Login
  // ===============================================
  app.post(loginUrl, function (req, res) {
    var token = req.header('token');
    var email = req.body.email;
    var password = req.body.password;

    if (!token) res.send({error: 'API key is missing.'});
    if (!email) res.send({error: 'Please provide username.'});
    if (!password) res.send({error: 'Please provide password.'});

    var fields = '_id name email registerAt';

    try {
      db.User.findOne({email: email, password: password}, fields, function(err, user) {
        if (user) {
          res.send(user);
        } else {
          res.send({error: 'Incorrect username or password.'});
        }

        if (err) {
          res.send({error: err});
          return false;
        };
      });
    } catch (err) {
      res.send({error: err});
    }
  });

  // ===============================================
  // 2. Get signal types
  // ===============================================
  app.get(signalTypesUrl, function (req, res) {
    try {
      db.SignalType.find({}, function (err, signalTypes) {
        if (signalTypes) {

          var metadata = {
            total_count: signalTypes.length
          };

          res.send({
            metadata: metadata,
            data: signalTypes
          });
        } else {
          res.send({});
        }

        if (err) {
          res.send({error: err});
          return false;
        };
      });
    } catch (err) {
      res.send({error: err});
    }
  });

  // ===============================================
  // 3. Get signals
  // ===============================================
  app.get(signalsUrl, function (req, res) {
    try {
      var limit = req.query.limit || defaultLimit;
      var offset = req.query.offset || defaultOffset;
      var sort = req.query.sort; // '-type date'
      var fields = 'type location description author status';

      if(req.query.fields) {
        fields = req.query.fields.replace(/,/g, ' ');
      }

      //filtering params
      var location = req.query.location; //42.425236,21.452352
      var radius = req.query.radius || 50;
      var status = req.query.status; //strings
      var user = req.query.user; //user id
      var types = req.query.types; //signal types strings
      var validated = req.query.validated; // true/false

      q = db.Signal.find();
      q.limit(limit);
      q.skip(offset);
      q.select(fields);

      //filter by user id
      if(user) {
        q.where('author', user);
      }
      if(validated) {
        q.where('validated', validated);
      }
      if(status) {
        //remove all whitespaces from the passed string
        status = status.replace(/ /g,'');
        var statusArray = status.split(',');
        q.where('status').in(statusArray);
      }
      if(types) {
        types = types.replace(/ /g,'');
        var typesArray = types.split(',');
        q.where('type').in(typesArray);
      }
      if(location) {
        console.log(location);
        var location = location.replace(/ /g,'');
        var locationArray = location.split(',');
        var maxDistance = radius * 0.00000900900901; //converts radians to meters
        q.where('location').near({ center: locationArray, maxDistance: maxDistance });
      }
      if(sort) {
        q.sort(sort);
      }

      var metadata = {
        per_page: '',
        next: '',
        page: '',
        previous: '',
        total_count: ''
      };

      q.exec(function (err, entities) {
        if(entities) {
          for (var i = 0; i < entities.length; i++) {
            entities[i] = entities[i].toObject();
            entities[i]._url = signalsUrl + '/' + entities[i]._id;
          }
        }

        var response = {
          metadata: metadata,
          data: entities ? entities : []
        };

        if(err) {
          res.send({error: err});
          return false;
        };

        res.send(response);
      });
    } catch (err) {
      res.send({error: err});
    }
  });

  // ===============================================
  // 4. Add signal
  // ===============================================
  app.post(signalsUrl, function (req, res) {
    //TODO Add author from token

    var lat = req.body.lat;
    var lng = req.body.lng;
    var type = req.body.type;
    var photo = req.files.photo;
    var description = req.body.description || '';

    if(!lat) {
      res.send({error: "Please provide geo lat."});
      return false;
    }
    if(!lng) {
      res.send({error: "Please provide geo lng."});
      return false;
    }
    if(!type) {
      res.send({error: "Please provide a signal type."});
      return false;
    }

    var signal = new db.Signal({
      location: [lat, lng],
      description: description,
      type: type
      //author: req.user,
      //authorName: req.user.name
    });

    signal.save(function (err, signal) {

      if (err) {
        res.send({error: err});
        return false;
      }

      if (!photo) {
        var signalObj = signal.toObject();
        delete signalObj.__v;
        signalObj._url = signalsUrl + '/' + signalObj._id;

        res.send({data: signalObj});
      } else {
        var publicFolder = "pictures";
        fileupload(photo.name, publicFolder, photo, function (err, image_url) {

          if (err) {
            res.send({error: err});
            return false;
          }
          signal.image = image_url;

          signal.save(function (err, signal) {
            if (err) {
              res.send({error: err});
              return false;
            }

            var signalObj = signal.toObject();
            delete signalObj.__v;
            signalObj._url = signalsUrl + '/' + signalObj._id;

            res.send({data: signalObj});
          });
        });
      }
    });

  });

  // ===============================================
  // 5. Get signal
  // ===============================================
  app.post(signalUrl, function (req, res) {
    res.send('login');
  });

  // ===============================================
  // 6. Update signal
  // ===============================================
  app.put(signalUrl, function (req, res) {
    res.send('login');
  });

  // ===============================================
  // 7. Delete signal
  // ===============================================
  app.delete(signalUrl, function (req, res) {
    res.send('Delete signal');
  });

  // ===============================================
  // 8. Get users
  // ===============================================
  app.get(usersUrl, function (req, res) {
    q = db.User.find();
    q.limit(defaultLimit);
    q.skip(defaultOffset);
    q.select('name registerAt validated');

    var metadata = metadata = {
      per_page: '',
      next: '',
      page: '',
      previous: '',
      total_count: ''
    };

    q.exec(function (err, entities) {
      //adds _url to the data
      if (entities) {
        for (var i = 0; i < entities.length; i++) {
          entities[i] = entities[i].toObject();
          entities[i]._url = usersUrl + '/' + entities[i]._id;
        }
      }

      var response = {
        metadata: metadata,
        data: entities ? entities : {}
      };

      if (err) {
        response.error = err;
      }

      res.send(response);
    });
  });

  // ===============================================
  // 9. Add user
  // ===============================================
  app.post(usersUrl, function (req, res) {
    res.send('login');
  });

  // ===============================================
  // 10. Get user
  // ===============================================
  app.get(userUrl, function (req, res) {
    res.send('login');
  });

  // ===============================================
  // 11. Update user
  // ===============================================
  app.put(userUrl, function (req, res) {
    res.send('login');
  });

  // ===============================================
  // 12. Delete user
  // ===============================================
  app.delete(userUrl, function (req, res) {
    res.send('login');
  });

  // ===============================================
  // 13. Add comment
  // ===============================================
  app.post(commentsUrl, function (req, res) {
    res.send('login');
  });

  // ===============================================
  // 14. Update comment
  // ===============================================
  app.put(commentUrl, function (req, res) {
    res.send('login');
  });

  // ===============================================
  // 15. Delete comment
  // ===============================================
  app.delete(commentUrl, function (req, res) {
    res.send('login');
  });

  // ===============================================
  // 16. Flag user
  // ===============================================
  app.post(flagUserUrl, function (req, res) {
    res.send('login');
  });

  // ===============================================
  // 17. flag comment
  // ===============================================
  app.post(flagCommentUrl, function (req, res) {
    res.send('login');
  });

  // ===============================================
  // 18. flag signal
  // ===============================================
  app.post(flagSignalUrl, function (req, res) {
    res.send('login');
  });

  // ===============================================
  // 19. Vote up a signal
  // ===============================================
  app.post(voteUpSignalUrl, function (req, res) {
    res.send('login');
  });

  // ===============================================
  // 20. Say thanks to a closed signal
  // ===============================================
  app.post(sayThanksUrl, function (req, res) {
    res.send('login');
  });

  // ===============================================
  // 21. Get avatar photo for user (out of the api)
  //     this files are static
  // ===============================================
  //get avatar/:user_id
}


module.exports = {
  init: function (app) {
    initApp(app);
  }
};