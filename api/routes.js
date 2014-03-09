/**
 * Created by nikolaialeksandrenko on 3/9/14.
 */

var db = require('../mongo/db'),
  fileupload = require('../utils/upload'),
  utils = require('./utils'),
  urls = require('./urls');

// ===================================================================================================================

var defaultLimit = 10;
var defaultOffset = 0;

// ===================================================================================================================

var routes = {};

// ===================================================================================================================
// 1. Login
// ===================================================================================================================

routes.login = function(req, res) {
  //var token = req.header('token');
  var email = req.body.username;
  var password = req.body.password;

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
};

// ===================================================================================================================
// 9. Register user
// ===================================================================================================================

routes.register = function(req, res) {
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
};

// ===================================================================================================================
// 2. Get signal types
// ===================================================================================================================

routes.getSignalTypes = function(req, res) {
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
};

// ===================================================================================================================
// 3. Get signals
// ===================================================================================================================

routes.getSignals = function(req, res) {
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
          entities[i]._url = urls.signals + '/' + entities[i]._id;
        }
      }

      var response = {
        metadata: utils.createMetaData(urls.signals, totalCount, req),
        data: entities ? entities : []
      };

      res.send(response);
    });
  })
};

// ===================================================================================================================
// 4. Add signal
// ===================================================================================================================

routes.addSignal = function(req, res) {
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
        signalObj._url = urls.signals + '/' + signalObj._id;

        res.send({data: signalObj});
      });
    }
  }
};

// ===================================================================================================================
// 5. Get signal
// ===================================================================================================================

routes.getSignal = function(req, res) {
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
};

// ===================================================================================================================
// 6. Update signal
// ===================================================================================================================

routes.updateSignal = function(req, res) {
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
};

// ===================================================================================================================
// 7. Delete signal
// ===================================================================================================================

routes.deleteSignal = function(req, res) {
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
};

// ===================================================================================================================
// 8. Get users
// ===================================================================================================================

routes.getUsers = function(req, res) {
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

  var countFilter = {};

  if(name) {
    q.where('name', new RegExp(name, 'i'));
    countFilter.name = new RegExp(name, 'i');
  }

  if(email) {
    q.where('email', new RegExp(email, 'i'));
    countFilter.email = new RegExp(email, 'i');
  }

  if (sort) {
    q.sort(sort);
  }

  db.User.count(countFilter, function(err, totalCount) {
    if(utils.returnErrorIf(err, err, res)) return false;

    q.exec(function(err, entities) {
      if(utils.returnErrorIf(err, err, res)) return false;

      //adds _url to the data
      if(entities) {
        for (var i = 0; i < entities.length; i++) {
          entities[i] = entities[i].toObject();
          entities[i]._url = urls.users + '/' + entities[i]._id;
          delete entities[i].__v;
          delete entities[i].password;
          delete entities[i].email;
        }
      }

      res.send({
        metadata: utils.createMetaData(urls.users, totalCount, req),
        data: entities ? entities : []
      });
    });
  })
};

// ===================================================================================================================
// 10. Get user
// ===================================================================================================================

routes.getUser = function(req, res) {
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
};

// ===================================================================================================================
// 11. Update user
// ===================================================================================================================

routes.updateUser = function(req, res) {
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
};

// ===================================================================================================================
// 12. Delete user
// ===================================================================================================================

routes.deleteUser = function(req, res) {
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
};

// ===================================================================================================================
// 13. Add comment
// ===================================================================================================================

routes.addComment = function(req, res) {
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
};

// ===================================================================================================================
// 14. Update comment
// ===================================================================================================================

routes.updateComment = function(req, res) {
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
};

// ===================================================================================================================
// 15. Delete comment
// ===================================================================================================================

routes.deleteComment = function(req, res) {
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
};

// ===================================================================================================================
// 16. Flag user
// ===================================================================================================================

routes.flagUser = function(req, res) {
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
};

// ===================================================================================================================
// 17. flag comment
// ===================================================================================================================

routes.flagComment = function(req, res) {
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
};

// ===================================================================================================================
// 18. flag signal
// ===================================================================================================================

routes.flagSignal = function(req, res) {
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
};

// ===================================================================================================================
// 19. Vote up a signal
// ===================================================================================================================

routes.voteUpSignal = function(req, res) {
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
};

// ===================================================================================================================
// 19a. VoteDown up a signal
// ===================================================================================================================

routes.voteDownSignal = function(req, res) {
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
};

// ===================================================================================================================
// 20. Say thanks to a closed signal
// ===================================================================================================================

routes.sayThanks = function(req, res) {
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
};

// ===================================================================================================================
// 20a. UnThanks a signal
// ===================================================================================================================

routes.unThanks = function(req, res) {
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
};

// ===================================================================================================================

module.exports = routes;