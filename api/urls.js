/**
 * Created by nikolaialeksandrenko on 3/9/14.
 */

var apiBase =  '/api/';

var urls = {
  apiBase: apiBase,
  login: apiBase + 'login',
  register: apiBase + 'register',
  signalTypes: apiBase + 'signals-types',
  signals: apiBase + 'signals',
  signal: apiBase + 'signals/:id',
  users: apiBase + 'users',
  user: apiBase + 'users/:id',
  comments: apiBase + 'signals/:id/comments',
  comment: apiBase + 'signals/:id/comments/:comment_id',
  flagUser: apiBase + 'users/:id/flag',
  flagComment: apiBase + 'signals/:id/comments/:comment_id/flag',
  flagSignal: apiBase + 'signals/:id/flag',
  voteUpSignal: apiBase + 'signals/:id/voteup',
  voteDownSignal: apiBase + 'signals/:id/votedown',
  sayThanks: apiBase + 'signals/:id/thanks',
  unThanks: apiBase + 'signals/:id/unthanks'
};

module.exports = urls;
