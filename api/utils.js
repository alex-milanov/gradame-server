/**
 * Created by nikolaialeksandrenko on 3/9/14.
 */

var defaultLimit = 10;
var defaultOffset = 0;

module.exports = {
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

    var next = url + '?offset=' + nextPage;
    var previous = url + '?offset=' + prevPage;

    if(limit !== defaultLimit) {
      next += '&limit=' + limit;
      previous += '&limit=' + limit;
    }

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