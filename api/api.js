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
    flagSignalUrl = apiBaseUrl + 'signals/:id/flag',
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

  var utils = {
    returnErrorIf: function (bool, reason, res) {
      if (bool) {
        res.send({error: reason});
        return false;
      }
    }
  };

  // ===============================================
  // 1. Login
  // ===============================================
  app.post(loginUrl, function (req, res) {
    var token = req.header('token');
    var email = req.body.email;
    var password = req.body.password;

    utils.returnErrorIf(!token, 'API key is missing.', res);
    utils.returnErrorIf(!email, 'Please provide username.', res);
    utils.returnErrorIf(!password, 'Please provide password.', res);

    var fields = '_id name email registerAt';

    db.User.findOne({email: email, password: password}, fields, function (err, user) {
      if (user) {
        res.send(user);
      } else {
        res.send({error: 'Incorrect username or password.'});
      }

      utils.returnErrorIf(err, err, res);
    });
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

        utils.returnErrorIf(err, err, res);
      });
    } catch (err) {
      res.send({error: err});
    }
  });

  // ===============================================
  // 3. Get signals
  // ===============================================
  app.get(signalsUrl, function (req, res) {
    var limit = req.query.limit || defaultLimit;
    var offset = req.query.offset || defaultOffset;
    var sort = req.query.sort; // '-type date'
    var fields = 'type location description author status';

    if (req.query.fields) {
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
    if (user) {
      q.where('author', user);
    }
    if (validated) {
      q.where('validated', validated);
    }
    if (status) {
      //remove all whitespaces from the passed string
      status = status.replace(/ /g, '');
      var statusArray = status.split(',');
      q.where('status').in(statusArray);
    }
    if (types) {
      types = types.replace(/ /g, '');
      var typesArray = types.split(',');
      q.where('type').in(typesArray);
    }
    if (location) {
      console.log(location);
      var location = location.replace(/ /g, '');
      var locationArray = location.split(',');
      var maxDistance = radius * 0.00000900900901; //converts radians to meters
      q.where('location').near({ center: locationArray, maxDistance: maxDistance });
    }
    if (sort) {
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
      if (entities) {
        for (var i = 0; i < entities.length; i++) {
          entities[i] = entities[i].toObject();
          entities[i]._url = signalsUrl + '/' + entities[i]._id;
        }
      }

      var response = {
        metadata: metadata,
        data: entities ? entities : []
      };

      utils.returnErrorIf(err, err, res);

      res.send(response);
    });
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
    var address = req.files.address;

    utils.returnErrorIf(!lat, "Please provide geo lat.", res);
    utils.returnErrorIf(!lng, "Please provide geo lng.", res);
    utils.returnErrorIf(!type, "Please a signal type.", res);
    utils.returnErrorIf(!address, "Please provide a signal type.", res);

    var signal = new db.Signal({
      location: [lat, lng],
      description: description,
      type: type,
      address: address
      //author: req.user,
      //authorName: req.user.name
    });

    signal.save(function (err, signal) {

      utils.returnErrorIf(err, err, res);

      if (!photo) {
        var signalObj = signal.toObject();
        delete signalObj.__v;
        signalObj._url = signalsUrl + '/' + signalObj._id;

        res.send({data: signalObj});
      } else {
        var publicFolder = "pictures";
        fileupload(photo.name, publicFolder, photo, function (err, image_url) {
          utils.returnErrorIf(err, err, res);

          signal.image = image_url;

          signal.save(function (err, signal) {
            utils.returnErrorIf(err, err, res);

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
  app.get(signalUrl, function (req, res) {
    var fields = 'location description type created comments thanks votes image validated updated image author authorName';
    var signalId = req.params.id;

    if (req.query.fields) {
      fields = req.query.fields.replace(/,/g, ' ');
    }

    db.Signal.findById(signalId, fields, function (err, signal) {
      utils.returnErrorIf(err, err, res);
      utils.returnErrorIf(!signal, 'No signal with this Id', res);
      res.send(signal);
    });
  });

  // ===============================================
  // 6. Update signal
  // ===============================================
  app.put(signalUrl, function (req, res) {
    //TODO update only if author is the user trying to update it

    var signalId = req.params.id;
    var lat = req.body.lat;
    var lng = req.body.lng;
    var type = req.body.type;
    var description = req.body.description || '';
    var address = req.body.address;
    var validated = req.body.validated;

    db.Signal.findById(signalId, function (err, signal) {
      utils.returnErrorIf(err, err, res);

      if (lat && lng) {
        signal.location = [lat, lng];
      }

      if (type) {
        signal.type = type;
      }

      if (description) {
        signal.description = description;
      }

      if (address) {
        signal.address = address;
      }

      if (validated) {
        signal.validated = validated;
      }

      signal.updated = new Date();

      signal.save(function (err, signal) {
        utils.returnErrorIf(err, err, res);

        res.send(signal);
      })
    });

  });

  // ===============================================
  // 7. Delete signal
  // ===============================================
  app.delete(signalUrl, function (req, res) {
    var signalId = req.params.id;

    db.Signal.findByIdAndRemove(signalId, function (err, signal) {
      utils.returnErrorIf(err, err, res);
      utils.returnErrorIf(!signal, 'No signal with this Id', res);
      res.send(signal);
    });
  });

  // ===============================================
  // 8. Get users
  // ===============================================
  app.get(usersUrl, function (req, res) {
    //TODO filter by name - names like john /john/i
    var limit = req.query.limit || defaultLimit;
    var offset = req.query.offset || defaultOffset;
    var sort = req.query.sort; // '-type date'
    var fields = '';

    if (req.query.fields) {
      fields = req.query.fields.replace(/,/g, ' ');
    }

    q = db.User.find();
    q.limit(limit);
    q.skip(offset);
    q.select(fields);

    if (sort) {
      q.sort(sort);
    }

    var metadata = metadata = {
      per_page: '',
      next: '',
      page: '',
      previous: '',
      total_count: ''
    };

    q.exec(function (err, entities) {
      utils.returnErrorIf(err, err, res);

      //adds _url to the data
      if(entities) {
        for (var i = 0; i < entities.length; i++) {
          entities[i] = entities[i].toObject();
          entities[i]._url = usersUrl + '/' + entities[i]._id;
          delete entities[i].__v;
          delete entities[i].password;
        }
      }

      res.send({
        metadata: metadata,
        data: entities ? entities : []
      });
    });
  });

  // ===============================================
  // 9. Add user
  // ===============================================
  app.post(usersUrl, function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    var name = req.body.name || '';

    utils.returnErrorIf(!email, 'Please provide an email.', res);

    var newUser = new db.User({
      name: name,
      email: email,
      password: password
    });

    newUser.save(function (err, user) {
      utils.returnErrorIf(err.code === 11000, 'This email is already registered, please choose another one.', res);
      utils.returnErrorIf(err, err, res);

      user = user.toObject();
      delete user.__v;

      res.send(user);
    });
  });

  // ===============================================
  // 10. Get user
  // ===============================================
  app.get(userUrl, function (req, res) {
    var userId = req.params.id;
    var fields = '';

    if (req.query.fields) {
      fields = req.query.fields.replace(/,/g, ' ');
    }

    db.User.findById(userId, fields, function (err, user) {
      utils.returnErrorIf(err, err, res);
      utils.returnErrorIf(user, 'No user with this id., res');

      user = user.toObject();
      delete user.__v;

      res.send(user);
    });
  });

  // ===============================================
  // 11. Update user
  // ===============================================
  app.put(userUrl, function (req, res) {
    //TODO update user - change password, avatar image
    res.send('login');
  });

  // ===============================================
  // 12. Delete user
  // ===============================================
  app.delete(userUrl, function (req, res) {
    var userId = req.params.id;

    db.User.findByIdAndRemove(userId, function (err, user) {
      utils.returnErrorIf(err, err, res);
      utils.returnErrorIf(user, 'No user with this id., res');

      user = user.toObject();
      delete user.__v;

      res.send(user);
    })
  });

  // ===============================================
  // 13. Add comment
  // ===============================================
  app.post(commentsUrl, function (req, res) {
    //TODO add image upload support
    var signalId = req.params.id;
    var text = req.body.text;
    var action = req.body.action;
    //var photo = req.body.photo;

    utils.returnErrorIf(!text, 'Please provide a text for the comment.', res)

    db.Signal.findById(signalId, function (err, signal) {
      utils.returnErrorIf(err, err, res);
      utils.returnErrorIf(!signal, 'No signal with this id.', res);

      //TODO set author to the requesting user
      var newComment = {
        //author: req.user,
        //authorName: req.user.name,
        date: new Date(),
        //image: photo,
        text: text,
        action: action
      };

      //add the comment to the parent signal
      signal.comments.push(newComment);
      signal.save(function (err, signal) {
        utils.returnErrorIf(err, err, res);
        res.send(newComment);
      });
    });


  });

  // ===============================================
  // 14. Update comment
  // ===============================================
  app.put(commentUrl, function (req, res) {
    //TODO Update only if requesting user is author
  });

  // ===============================================
  // 15. Delete comment
  // ===============================================
  app.delete(commentUrl, function (req, res) {
    //TODO Delete only if requesting user is author

    var signalId = req.params.id;
    var commentId = req.params.comment_id;

    db.Signal.findById(signalId, function (err, signal) {
      utils.returnErrorIf(err, err, res);
      utils.returnErrorIf(!signal, 'No Signal with this id.', res);

      var comment = signal.comments.id(commentId);
      utils.returnErrorIf(!comment, 'No Comment with this id.', res);

      if (comment) {
        comment.remove();
      }

      signal.save(function (err) {
        utils.returnErrorIf(err, err, res);

        res.send(comment);
      });
    });
  });

  // ===============================================
  // 16. Flag user
  // ===============================================
  app.post(flagUserUrl, function (req, res) {

    //TODO - Add flag author - requesting user
    var userId = req.params.id;
    var reason = req.body.reason;

    utils.returnErrorIf(!reason, 'Please provide a reason.', res);

    db.User.findById(userId, function(err, user) {
      utils.returnErrorIf(err, err, res);
      utils.returnErrorIf(!user, 'No user with this id.', res);

      var newFlag = new db.Flagged({
        targetType: "User",
        reason: reason,
        _flagged: user
      });

      newFlag.save(function (err, flag) {
        utils.returnErrorIf(err, err, res);

        var flag = flag.toObject();
        delete flag.__v;
        res.send(flag);
      });
    });
  });

  // ===============================================
  // 17. flag comment
  // ===============================================
  app.post(flagCommentUrl, function (req, res) {
    //TODO - Add flag author - requesting user
    var signalId = req.params.id;
    var commentId = req.params.comment_id;
    var reason = req.body.reason;

    utils.returnErrorIf(!reason, 'Please provide a reason.', res);

    db.Signal.findById(signalId, function (err, signal) {
      utils.returnErrorIf(err, err, res);
      utils.returnErrorIf(!signal, 'No Signal with this id.', res);

      var comment = signal.comments.id(commentId);
      utils.returnErrorIf(!comment, 'No Comment with this id.', res);

      if (comment) {
        var newFlag = new db.Flagged({
          targetType: "Comment",
          reason: reason,
          _flagged: comment
        });

        newFlag.save(function (err, flag) {
          utils.returnErrorIf(err, err, res);

          var flag = flag.toObject();
          delete flag.__v;
          res.send(flag);
        });
      }

    });
  });

  // ===============================================
  // 18. flag signal
  // ===============================================
  app.post(flagSignalUrl, function (req, res) {
    //TODO - Add flag author - requesting user
    var signalId = req.params.id;
    var reason = req.body.reason;

    utils.returnErrorIf(!reason, 'Please provide a reason.', res);

    db.Signal.findById(signalId, function(err, signal) {
      utils.returnErrorIf(err, err, res);
      utils.returnErrorIf(!signal, 'No signal with this id.', res);

      var newFlag = new db.Flagged({
        targetType: "Signal",
        reason: reason,
        _flagged: signal
      });

      newFlag.save(function (err, flag) {
        utils.returnErrorIf(err, err, res);

        var flag = flag.toObject();
        delete flag.__v;
        res.send(flag);
      });
    });

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