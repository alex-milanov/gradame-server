var db = require('../mongo/db'),
    fileupload = require('../utils/upload');


function initApp(app) {
  var apiBaseUrl = '/api/',
    loginUrl = apiBaseUrl + 'login',
    registerUrl = apiBaseUrl + 'register',
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
    voteDownSignalUrl = apiBaseUrl + 'signals/:id/votedown',
    sayThanksUrl = apiBaseUrl + 'signals/:id/thanks';
    unThanksUrl = apiBaseUrl + 'signals/:id/unthanks';

  var defaultLimit = 10;
  var defaultOffset = 0;

  app.get(apiBaseUrl, function(req, res) {
    var endPoints = [
      {
        url: loginUrl,
        method: 'POST'
      },

      {
        url: registerUrl,
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
        url: voteDownSignalUrl,
        method: 'POST'
      },
      {
        url: sayThanksUrl,
        method: 'POST'
      },
      {
        url: unThanksUrl,
        method: 'POST'
      }
    ];

    res.send(endPoints);
  });

  var utils = {
    returnErrorIf: function(bool, reason, res) {
      if (bool) {
        res.send({error: reason});
        return true;
      }
      return false;
    },
    isLogged: function(req, res) {
      var isLogged = true;

      if(!req.user) {
        res.send({
          error: 'Please login to use the api.'
        });
        isLogged = false;
      }

      return isLogged;
    },
    createMetaData: function(url, totalCount, req) {
      var limit = req.query.limit || defaultLimit;
      var offset = req.query.offset || defaultOffset;

      var total = totalCount || 0;

      var nextPage = (parseInt(offset) + parseInt(limit));
      var prevPage = (parseInt(offset) - parseInt(limit));

      var next = url + '?offset=' + nextPage + '&limit=' + limit;
      var previous = url + '?offset=' + prevPage + '&limit=' + limit;

      var metadata = {
        limit: limit,
        total_count: total
      };

      if(prevPage >= 0) {
        metadata.previous = previous;
      }

      if(nextPage <= total) {
        metadata.next = next;
      }

      return metadata;
    }
  };

  // ===============================================
  // 1. Login
  // ===============================================
  app.post(loginUrl, function(req, res) {
    //var token = req.header('token');
    var email = req.body.username;
    var password = req.body.password;

    //utils.returnErrorIf(!token, 'API key is missing.', res);
    if(utils.returnErrorIf(!email, 'Please provide username.', res)) return false;
    if(utils.returnErrorIf(!password, 'Please provide password.', res)) return false;

    var fields = '_id name email registerAt';

    db.User.findOne({email: email, password: password}, fields, function(err, user) {
      if(utils.returnErrorIf(err, err, res)) return false;
      if(utils.returnErrorIf(!user, 'Incorrect username or password.', res)) return false;

      req.login(user, function(err) {
        if(utils.returnErrorIf(err, err, res)) return false;
        res.send(user);
      });

    });
  });

  // ===============================================
  // 9. Register user
  // ===============================================
  app.post(registerUrl, function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var name = req.body.name || '';

    if(utils.returnErrorIf(!username, 'Please provide an email.', res)) return false;
    if(utils.returnErrorIf(!password, 'Please provide a password.', res)) return false;

    var newUser = new db.User({
      name: name,
      email: username,
      password: password
    });

    newUser.save(function(err, user) {
      if(utils.returnErrorIf(err && err.code == 11000, 'This email is already registered, please choose another one.', res)) return false;
      if(utils.returnErrorIf(err, err, res)) return false;

      user = user.toObject();
      delete user.__v;

      res.send(user);
    });
  });

  // ===============================================
  // 2. Get signal types
  // ===============================================
  app.get(signalTypesUrl, function(req, res) {
    //if(!utils.isLogged(req, res)) return false;

    db.SignalType.find({}, function(err, signalTypes) {
      if(utils.returnErrorIf(err, err, res)) return false;

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
    });
  });

  // ===============================================
  // 3. Get signals
  // ===============================================
  app.get(signalsUrl, function(req, res) {
    //if(!utils.isLogged(req, res)) return false;

    var limit = req.query.limit || defaultLimit;
    var offset = req.query.offset || defaultOffset;
    var sort = req.query.sort; // '-type date'
    var fields = '';

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

    db.Signal.count(function(err, totalCount) {
      if(utils.returnErrorIf(err, err, res)) return false;

      q.exec(function(err, entities) {
        if(utils.returnErrorIf(err, err, res)) return false;
        if (entities) {
          for (var i = 0; i < entities.length; i++) {
            entities[i] = entities[i].toObject();
            entities[i]._url = signalsUrl + '/' + entities[i]._id;
          }
        }

        var response = {
          metadata: utils.createMetaData(signalsUrl, totalCount, req),
          data: entities ? entities : []
        };

        res.send(response);
      });
    })
  });

  // ===============================================
  // 4. Add signal
  // ===============================================
  app.post(signalsUrl, function(req, res) {
    if(!utils.isLogged(req, res)) return false;

    var lat = req.body.lat;
    var lng = req.body.lng;
    var type = req.body.type;
    var image = req.files.photo;
    var description = req.body.description || '';
    var address = req.body.address;

    if(utils.returnErrorIf(!lat, "Please provide geo lat.", res)) return false;
    if(utils.returnErrorIf(!lng, "Please provide geo lng.", res)) return false;
    if(utils.returnErrorIf(!type, "Please a signal type.", res)) return false;
    if(utils.returnErrorIf(!address, "Please provide a signal address.", res)) return false;

    if(req.user) {
      var signal = new db.Signal({
        location: [lat, lng],
        description: description,
        type: type,
        address: address,
        author: req.user,
        authorName: req.user.name
      });

      if(image) {
        fileupload.avatarUpload(user.id, image, function(err, imageUrl) {
          if(utils.returnErrorIf(err, err, res)) return false;
          signal.image = imageUrl;
          saveSignal();
        });
      } else {
        saveSignal();
      }

      function saveSignal() {
        signal.save(function(err, signal) {
          if(utils.returnErrorIf(err, err, res)) return false;
            var signalObj = signal.toObject();
            delete signalObj.__v;
            signalObj._url = signalsUrl + '/' + signalObj._id;

            res.send({data: signalObj});
        });
      }
    }
  });

  // ===============================================
  // 5. Get signal
  // ===============================================
  app.get(signalUrl, function(req, res) {
    //if(!utils.isLogged(req, res)) return false;

    var fields = '';
    var signalId = req.params.id;

    if (req.query.fields) {
      fields = req.query.fields.replace(/,/g, ' ');
    }

    db.Signal.findById(signalId, fields, function(err, signal) {
      if(utils.returnErrorIf(err, err, res)) return false;
      if(utils.returnErrorIf(!signal, 'No signal with this Id', res)) return false;

      signal = signal.toObject();
      delete signal.__v;

      res.send(signal);
    });
  });

  // ===============================================
  // 6. Update signal
  // ===============================================
  app.put(signalUrl, function(req, res) {
    if(!utils.isLogged(req, res)) return false;

    var signalId = req.params.id,
        lat = req.body.lat,
        lng = req.body.lng,
        type = req.body.type,
        description = req.body.description || '',
        address = req.body.address,
        validated = req.body.validated;

    if(req.user) {
      db.Signal.findById(signalId, function(err, signal) {
        if(utils.returnErrorIf(err, err, res)) return false;

        if(signal.author == req.user.id) {

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

          if(image) {
            fileupload.avatarUpload(user.id, image, function(err, imageUrl) {
              if(utils.returnErrorIf(err, err, res)) return false;
              signal.image = imageUrl;
              saveSignal();
            });
          } else {
            saveSignal();
          }

          function saveSignal() {
            signal.updated = new Date();

            signal.save(function(err, signal) {
              if(utils.returnErrorIf(err, err, res)) return false;

              signal = signal.toObject();
              delete signal.__v;

              res.send(signal);
            });
          }
        } else {
          if(utils.returnErrorIf(true, 'This is not your signal to update.', res)) return false;
        }
      });
    }
  });

  // ===============================================
  // 7. Delete signal
  // ===============================================
  app.delete(signalUrl, function(req, res) {
    if(!utils.isLogged(req, res)) return false;

    var signalId = req.params.id;

    if(req.user) {
      db.Signal.findById(signalId, function(err, signal) {
        if(utils.returnErrorIf(err, err, res)) return false;
        if(utils.returnErrorIf(!signal, 'No signal with this Id', res)) return false;

        if(signal.author == req.user.id) {
          signal.remove(function(err, signal) {
            if(utils.returnErrorIf(err, err, res)) return false;
            res.send(signal);
          })
        } else {
          if(utils.returnErrorIf(true, 'This is not your signal to delete.', res)) return false;
        }
      });
    }
  });

  // ===============================================
  // 8. Get users
  // ===============================================
  app.get(usersUrl, function(req, res) {
    //if(!utils.isLogged(req, res)) return false;

    var limit = req.query.limit || defaultLimit;
    var offset = req.query.offset || defaultOffset;
    var sort = req.query.sort; // '-type date'
    var name = req.query.name;
    var email = req.query.email;
    var fields = '';

    if (req.query.fields) {
      fields = req.query.fields.replace(/,/g, ' ');
    }

    q = db.User.find();
    q.limit(limit);
    q.skip(offset);
    q.select(fields);

    if(name) {
      q.where('name', new RegExp(name, 'i'));
    }

    if(email) {
      q.where('email', new RegExp(email, 'i'));
    }

    if (sort) {
      q.sort(sort);
    }

    db.User.count(function(err, totalCount) {
      if(utils.returnErrorIf(err, err, res)) return false;

      q.exec(function(err, entities) {
        if(utils.returnErrorIf(err, err, res)) return false;

        //adds _url to the data
        if(entities) {
          for (var i = 0; i < entities.length; i++) {
            entities[i] = entities[i].toObject();
            entities[i]._url = usersUrl + '/' + entities[i]._id;
            delete entities[i].__v;
            delete entities[i].password;
            delete entities[i].email;
          }
        }

        res.send({
          metadata: utils.createMetaData(signalsUrl, totalCount, req),
          data: entities ? entities : []
        });
      });
    })
  });

  // ===============================================
  // 10. Get user
  // ===============================================
  app.get(userUrl, function(req, res) {
    //if(!utils.isLogged(req, res)) return false;

    var userId = req.params.id;
    var fields = '';

    if (req.query.fields) {
      fields = req.query.fields.replace(/,/g, ' ');
    }

    db.User.findById(userId, fields, function(err, user) {
      if(utils.returnErrorIf(err, err, res)) return false;
      if(utils.returnErrorIf(!user, 'No user with this id.', res)) return false;

      user = user.toObject();
      delete user.__v;

      res.send(user);
    });
  });

  // ===============================================
  // 11. Update user
  // ===============================================
  app.put(userUrl, function(req, res) {
    if(!utils.isLogged(req, res)) return false;

    var userId = req.params.id,
        password = req.body.password,
        image = req.files.image,
        name = req.body.name;

    db.User.findById(userId, function(err, user) {
      if(utils.returnErrorIf(err, err, res)) return false;
      if(utils.returnErrorIf(!user, 'No user with this id.', res)) return false;

      if(user.id !== req.user.id) {
        if(utils.returnErrorIf(true, 'You don\'t have permission to update this user.', res)) return false;
      } else {

        if(password) {
          user.password = password;
        }

        if(name) {
          user.name = name;
        }

        if(image) {
          fileupload.avatarUpload(user.id, image, function(err, imageUrl) {
            if(utils.returnErrorIf(err, err, res)) return false;
            saveUser();
          });
        } else {
          saveUser();
        }

        function saveUser() {
          if(password || name) {
            user.save(function(err, user) {
              if(utils.returnErrorIf(err, err, res)) return false;
              user = user.toObject();
              delete user.__v;
              delete user.password;
              delete user.email;
              res.send(user);
            });
          }
        }
      }
    });
  });

  // ===============================================
  // 12. Delete user
  // ===============================================
  app.delete(userUrl, function(req, res) {
    if(!utils.isLogged(req, res)) return false;

    var userId = req.params.id;

    if(req.user.id == userId) {
      db.User.findByIdAndRemove(userId, function(err, user) {
        if(utils.returnErrorIf(err, err, res)) return false;
        if(utils.returnErrorIf(!user, 'No user with this id.', res)) return false;

        user = user.toObject();
        delete user.__v;

        res.send(user);
      });
    } else {
      if(utils.returnErrorIf(true, 'You have no permissions to delete this user.', res)) return false;
    }
  });

  // ===============================================
  // 13. Add comment
  // ===============================================
  app.post(commentsUrl, function(req, res) {
    if(!utils.isLogged(req, res)) return false;

    var signalId = req.params.id;
    var text = req.body.text;
    var action = req.body.action;
    var image = req.files.image;

    if(utils.returnErrorIf(!text, 'Please provide a text for the comment.', res)) return false;

    if(req.user) {
      db.Signal.findById(signalId, function(err, signal) {
        if(utils.returnErrorIf(err, err, res)) return false;
        if(utils.returnErrorIf(!signal, 'No signal with this id.', res)) return false;

        var newComment = {
          _author: req.user.id,
          authorName: req.user.name,
          date: new Date(),
          text: text,
          action: action
        };

        if(image) {
          fileupload.pictureUpload(image.name, image, function(err, imageUrl){
            if(utils.returnErrorIf(err, err, res)) return false;
            newComment.image = imageUrl;
            saveComment();
          });
        } else {
          saveComment();
        }

        //add the comment to the parent signal
        function saveComment() {
          signal.comments.push(newComment);
          signal.save(function(err, signal) {
            if(utils.returnErrorIf(err, err, res)) return false;
            res.send(newComment);
          });
        }
      });
    }

  });

  // ===============================================
  // 14. Update comment
  // ===============================================
  app.put(commentUrl, function(req, res) {
    if(!utils.isLogged(req, res)) return false;

    var signalId = req.params.id;
    var commentId = req.params.comment_id;

    var text = req.body.text;
    var action = req.body.action;
    var image = req.files.image;

    if(req.user) {
      db.Signal.findById(signalId, function(err, signal) {
        if(utils.returnErrorIf(err, err, res)) return false;
        if(utils.returnErrorIf(!signal, 'No Signal with this id.', res)) return false;

        var comment = signal.comments.id(commentId);
        if(utils.returnErrorIf(!comment, 'No Comment with this id.', res)) return false;

        if(comment) {
          if(comment._author == req.user.id) {

            if(text) {
              comment.text = text;
            }
            if(action) {
              comment.action = action;
            }

            if(image) {
              fileupload.pictureUpload(image.name, image, function(err, imageUrl){
                if(utils.returnErrorIf(err, err, res)) return false;
                comment.image = imageUrl;
                saveComment();
              });
            } else {
              saveComment();
            }
          } else {
            if(utils.returnErrorIf(true, 'This is not your comment to update.', res)) return false;
          }
        }

        function saveComment() {
          comment.updated = new Date();

          signal.save(function(err) {
            if(utils.returnErrorIf(err, err, res)) return false;
            res.send(comment);
          });
        }
      });
    }
  });

  // ===============================================
  // 15. Delete comment
  // ===============================================
  app.delete(commentUrl, function(req, res) {
    if(!utils.isLogged(req, res)) return false;

    var signalId = req.params.id;
    var commentId = req.params.comment_id;

    if(req.user) {
      db.Signal.findById(signalId, function(err, signal) {
        if(utils.returnErrorIf(err, err, res)) return false;
        if(utils.returnErrorIf(!signal, 'No Signal with this id.', res)) return false;

        var comment = signal.comments.id(commentId);
        if(utils.returnErrorIf(!comment, 'No Comment with this id.', res)) return false;

        if(comment) {
          if(comment._author == req.user.id) {
            comment.remove();
          } else {
            if(utils.returnErrorIf(true, 'This is not your comment to delete.', res)) return false;
          }
        }

        signal.save(function(err) {
          if(utils.returnErrorIf(err, err, res)) return false;

          res.send(comment);
        });
      });
    }
  });

  // ===============================================
  // 16. Flag user
  // ===============================================
  app.post(flagUserUrl, function(req, res) {
    if(!utils.isLogged(req, res)) return false;

    var userId = req.params.id;
    var reason = req.body.reason;

    if(utils.returnErrorIf(!reason, 'Please provide a reason.', res)) return false;

    if(req.user) {
      db.User.findById(userId, function(err, user) {
        if(utils.returnErrorIf(err, err, res)) return false;
        if(utils.returnErrorIf(!user, 'No user with this id.', res)) return false;

        var newFlag = new db.Flagged({
          targetType: "User",
          reason: reason,
          _reportedBy: req.user,
          _flagged: user
        });

        newFlag.save(function(err, flag) {
          if(utils.returnErrorIf(err, err, res)) return false;

          var flag = flag.toObject();
          delete flag.__v;
          res.send(flag);
        });
      });
    }
  });

  // ===============================================
  // 17. flag comment
  // ===============================================
  app.post(flagCommentUrl, function(req, res) {
    if(!utils.isLogged(req, res)) return false;

    var signalId = req.params.id;
    var commentId = req.params.comment_id;
    var reason = req.body.reason;

    if(utils.returnErrorIf(!reason, 'Please provide a reason.', res)) return false;

    if(req.user) {
      db.Signal.findById(signalId, function(err, signal) {
        if(utils.returnErrorIf(err, err, res)) return false;
        if(utils.returnErrorIf(!signal, 'No Signal with this id.', res)) return false;

        var comment = signal.comments.id(commentId);
        if(utils.returnErrorIf(!comment, 'No Comment with this id.', res)) return false;

        if (comment) {
          var newFlag = new db.Flagged({
            targetType: "Comment",
            reason: reason,
            _reportedBy: req.user,
            _flagged: comment
          });

          newFlag.save(function(err, flag) {
            if(utils.returnErrorIf(err, err, res)) return false;

            var flag = flag.toObject();
            delete flag.__v;
            res.send(flag);
          });
        }
      });
    }

  });

  // ===============================================
  // 18. flag signal
  // ===============================================
  app.post(flagSignalUrl, function(req, res) {
    if(!utils.isLogged(req, res)) return false;

    var signalId = req.params.id;
    var reason = req.body.reason;

    if(utils.returnErrorIf(!reason, 'Please provide a reason.', res)) return false;

    if(req.user) {
      db.Signal.findById(signalId, function(err, signal) {
        if(utils.returnErrorIf(err, err, res)) return false;
        if(utils.returnErrorIf(!signal, 'No signal with this id.', res)) return false;

        var newFlag = new db.Flagged({
          targetType: "Signal",
          reason: reason,
          _reportedBy: req.user,
          _flagged: signal
        });

        newFlag.save(function(err, flag) {
          if(utils.returnErrorIf(err, err, res)) return false;

          var flag = flag.toObject();
          delete flag.__v;
          res.send(flag);
        });
      });
    }
  });

  // ===============================================
  // 19. Vote up a signal
  // ===============================================
  app.post(voteUpSignalUrl, function(req, res) {
    if(!utils.isLogged(req, res)) return false;

    var signalId = req.params.id;

    if(req.user) {
      db.Signal.findById(signalId, function(err, signal) {
        if(utils.returnErrorIf(err, err, res)) return false;
        if(utils.returnErrorIf(!signal, 'No signal with this id.', res)) return false;

        for(var i=0; i < signal.votes.length; i++) {
          if(signal.votes[i]._author == req.user.id) {
            utils.returnErrorIf(true, 'You already voted for this signal.', res);
            return false;
          }
        }

        var vote = { _author: req.user.id };
        signal.votes.push(vote);

        signal.save(function(err, signal) {
          if(utils.returnErrorIf(err, err, res)) return false;
          res.send(signal);
        });
      });
    }
  });

  // ===============================================
  // 19a. VoteDown up a signal
  // ===============================================
  app.post(voteDownSignalUrl, function(req, res) {
    if(!utils.isLogged(req, res)) return false;
    var signalId = req.params.id;

    if(req.user) {
      db.Signal.findById(signalId, function(err, signal) {
        if(utils.returnErrorIf(err, err, res)) return false;
        if(utils.returnErrorIf(!signal, 'No signal with this id.', res)) return false;

        var votedDown = false;

        for(var i=0; i < signal.votes.length; i++) {
          if(signal.votes[i]._author == req.user.id) {
            signal.votes.splice(i, 1);
            votedDown = true;
            i--;
          }
        }

        if(votedDown) {
          signal.save(function(err, signal) {
            if(utils.returnErrorIf(err, err, res)) return false;
            res.send(signal);
          });
        } else {
          if(utils.returnErrorIf(true, 'You didn\'t vote for this signal', res)) return false;
        }
      });
    }
  });

  // ===============================================
  // 20. Say thanks to a closed signal
  // ===============================================
  app.post(sayThanksUrl, function(req, res) {
    if(!utils.isLogged(req, res)) return false;

    var signalId = req.params.id;

    if(req.user) {
      db.Signal.findById(signalId, function(err, signal) {
        if(utils.returnErrorIf(err, err, res)) return false;
        if(utils.returnErrorIf(!signal, 'No signal with this id.', res)) return false;

        for(var i=0; i < signal.thanks.length; i++) {
          if(signal.thanks[i]._author == req.user.id) {
            utils.returnErrorIf(true, 'You already say thanks for this signal.', res);
            return false;
          }
        }

        var thanks = { _author: req.user.id };
        signal.thanks.push(thanks);

        signal.save(function(err, signal) {
          if(utils.returnErrorIf(err, err, res)) return false;
          res.send(signal);
        });
      });
    }
  });

  // ===============================================
  // 20a. VoteDown up a signal
  // ===============================================
  app.post(unThanksUrl, function(req, res) {
    if(!utils.isLogged(req, res)) return false;
    var signalId = req.params.id;

    if(req.user) {
      db.Signal.findById(signalId, function(err, signal) {
        if(utils.returnErrorIf(err, err, res)) return false;
        if(utils.returnErrorIf(!signal, 'No signal with this id.', res)) return false;

        var unThanks = false;

        for(var i=0; i < signal.thanks.length; i++) {
          if(signal.thanks[i]._author == req.user.id) {
            signal.thanks.splice(i, 1);
            unThanks = true;
            i--;
          }
        }

        if(unThanks) {
          signal.save(function(err, signal) {
            if(utils.returnErrorIf(err, err, res)) return false;
            res.send(signal);
          });
        } else {
          if(utils.returnErrorIf(true, 'You didn\'t say thanks for this signal', res)) return false;
        }
      });
    }
  });

  // ===============================================
  // 21. Get avatar photo for user (out of the api)
  //     this files are static
  // ===============================================
  //get avatar/:user_id
}


module.exports = {
  init: function(app) {
    initApp(app);
  }
};