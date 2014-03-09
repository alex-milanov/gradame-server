var routes = require('./routes'),
    urls = require('./urls');

function initApp(app) {

  // ===================================================================================================================
  // Creating routes based on ednPoints array
  // ===================================================================================================================

  var endPoints = [
    {
      url: urls.login,
      method: 'post',
      callback: routes.login
    },
    {
      url: urls.register,
      method: 'post',
      callback: routes.register
    },
    {
      url: urls.signalTypes,
      method: 'get',
      callback: routes.getSignalTypes
    },
    {
      url: urls.signals,
      method: 'get',
      callback: routes.getSignals
    },
    {
      url: urls.signals,
      method: 'post',
      callback: routes.addSignal
    },
    {
      url: urls.signal,
      method: 'get',
      callback: routes.getSignal
    },
    {
      url: urls.signal,
      method: 'put',
      callback: routes.updateSignal
    },
    {
      url: urls.signal,
      method: 'delete',
      callback: routes.deleteSignal
    },
    {
      url: urls.users,
      method: 'get',
      callback: routes.getUsers
    },
    {
      url: urls.user,
      method: 'get',
      callback: routes.getUser
    },
    {
      url: urls.user,
      method: 'delete',
      callback: routes.deleteUser
    },
    {
      url: urls.comments,
      method: 'post',
      callback: routes.addComment
    },
    {
      url: urls.comment,
      method: 'put',
      callback: routes.updateComment
    },
    {
      url: urls.comment,
      method: 'delete',
      callback: routes.deleteComment
    },
    {
      url: urls.flagUser,
      method: 'post',
      callback: routes.flagUser
    },
    {
      url: urls.flagComment,
      method: 'post',
      callback: routes.flagComment
    },
    {
      url: urls.flagSignal,
      method: 'post',
      callback: routes.flagSignal
    },
    {
      url: urls.voteUpSignal,
      method: 'post',
      callback: routes.voteUpSignal
    },
    {
      url: urls.voteDownSignal,
      method: 'post',
      callback: routes.voteDownSignal
    },
    {
      url: urls.sayThanks,
      method: 'post',
      callback: routes.sayThanks
    },
    {
      url: urls.unThanks,
      method: 'post',
      callback: routes.unThanks
    }
  ];

  app.get(urls.apiBase, function(req, res) {
    res.send(endPoints);
  });

  for(var i=0; i<endPoints.length; i++) {
    var endPoint = endPoints[i];
    app[endPoint.method](endPoint.url, endPoint.callback);
  }

};


module.exports = {
  init: function(app) {
    initApp(app);
  }
};