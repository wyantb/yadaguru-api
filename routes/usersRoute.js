var express = require('express');
var router = express.Router();
var usersController = require('../controllers/usersController');

var routes = function() {

  router.route('/')
    .post(usersController.post);

  router.route('/:id')
    .put(usersController.putOnId)
    .delete(usersController.removeById);

  return router;
};

module.exports = routes();
