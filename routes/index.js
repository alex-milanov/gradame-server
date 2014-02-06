var db = require('../mongo/db');

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};
