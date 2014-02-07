var db = require('../mongo/db');

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.signals = function(req, res){
    res.render('signals', { title: 'Express' });
};

exports.signal = function(req, res){
    res.render('signal', { title: 'Express' });
};

exports.addSignal = function(req, res){
    res.render('add-signal', { title: 'Express' });
};

exports.users = function(req, res){
    res.render('users', { title: 'Express' });
};

exports.user = function(req, res){
    res.render('user', { title: 'Express' });
};

exports.faq = function(req, res){
    res.render('faq', { title: 'Express' });
};

exports.about = function(req, res){
    res.render('about', { title: 'Express' });
};

exports.contacts = function(req, res){
    res.render('contacts', { title: 'Express' });
};

exports.forDevelopers = function(req, res){
    res.render('for-developers', { title: 'Express' });
};

exports.forАuthorities = function(req, res){
    res.render('for-authorities', { title: 'Express' });
};