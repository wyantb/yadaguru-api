var models = require('../models/');
var validators = require('../lib/validators');
var errors = require('../lib/errors');
var Promise = require('bluebird');
var User = models.User;

var usersController = function() {

  var validationSchema = {
    phoneNumber: {
      required: true,
      rules: [{
        validator: 'isPhoneNumber',
        message: 'must be a string of 10 digits'
      }],
      sanitizers: ['sanitizeDigitString']
    },
    confirmCode: {
      rules: [{
        validator: 'isSixDigits',
        message: 'must be a string of 6 digits'
      }],
      sanitizers: ['sanitizeDigitString']
    },
    sponsorCode: {
      required: false
    }
  };

  /**
   * GET /users
   */
  var getAll = function(req, res) {
    return User.findAll().then(function(users) {
      res.status(200);
      res.json(users.map(function(user) {
        return user.dataValues;
      }));
    }).catch(function(error) {
      res.status(500);
      res.json(error);
    })
  };

  /**
   * GET /users/:id
   */
  var getById = function(req, res) {
    return User.findById(req.params.id).then(function(user) {
      if (!user) {
        res.status(404);
        res.json(new errors.ResourceNotFoundError('User', req.params.id));
        return;
      }
      res.status(200);
      res.json([user.dataValues]);
    }).catch(function(error) {
      res.status(500);
      res.json(error);
    })
  };

  /**
   * POST /users
   */
  var post = function(req, res) {
    var validation = validators.sanitizeAndValidate(req.body, validationSchema, true);

    if (!validation.isValid) {
      res.status(400);
      res.json(validation.errors);
      return Promise.resolve();
    }

    return User.create({
      phoneNumber: validation.sanitizedData.phoneNumber
    }).then(function(resp) {
      res.status(200);
      res.json([resp.dataValues]);
    }).catch(function(error) {
      res.status(500);
      res.json(error);
    });
  };

  /**
   * PUT /users/:id
   */
  var putOnId = function(req, res) {
    var id = req.params.id;
    var validation = validators.sanitizeAndValidate(req.body, validationSchema);

    if (!validation.isValid) {
      res.status(400);
      res.json(validation.errors);
      return Promise.resolve();
    }

    return User.findById(id).then(function(user) {
      if (!user) {
        res.status(404);
        res.json(new errors.ResourceNotFoundError('User', id));
        return Promise.resolve();
      }
      return user.update(validation.sanitizedData).then(function(resp) {
        res.status(200);
        res.json([resp.dataValues]);
      }).catch(function(error) {
        res.status(500);
        res.json(error);
      });
    })
  };

  /**
   * DELETE /users/:id
   */
  var removeById = function(req, res) {
    var id = req.params.id;

    return User.findById(id).then(function(user) {
      if (!user) {
        res.status(404);
        res.json(new errors.ResourceNotFoundError('User', id));
        return Promise.resolve();
      }
      return user.destroy().then(function() {
        res.status(200);
        res.json([{
          deletedId: id
        }])
      }).catch(function(error) {
        res.status(500);
        res.json(error);
      })
    });
  };

  return {
    getAll: getAll,
    getById: getById,
    post : post,
    putOnId : putOnId,
    removeById : removeById
  };
};

module.exports = usersController();
