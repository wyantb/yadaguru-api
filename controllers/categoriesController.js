var models = require('../models/');
var validators = require('../lib/validators');
var errors = require('../lib/errors');
var Promise = require('bluebird');
var Category = models.Category;

var categoriesController = function() {

  var validationSchema = {
    name: {
      required: true
    }
  };

  /**
   * GET /categories
   */
  var getAll = function(req, res) {
    return Category.findAll().then(function(categories) {
      res.status(200);
      res.json(categories.map(function(categories) {
        return categories.dataValues;
      }));
    }).catch(function(error) {
      res.status(500);
      res.json(error);
    })
  };

  /**
   * GET /categories/:id
   */
  var getById = function(req, res) {
    return Category.findById(req.params.id).then(function(category) {
      if (!category) {
        res.status(404);
        res.json(new errors.ResourceNotFoundError('Category', req.params.id));
        return;
      }
      res.status(200);
      res.json([category.dataValues]);
    }).catch(function(error) {
      res.status(500);
      res.json(error);
    })
  };

  /**
   * POST /categories
   */
  var post = function(req, res) {
    var validation = validators.sanitizeAndValidate(req.body, validationSchema, true);

    if (!validation.isValid) {
      res.status(400);
      res.json(validation.errors);
      return Promise.resolve();
    }

    return Category.create({
      name: validation.sanitizedData.name
    }).then(function(resp) {
      res.status(200);
      res.json([resp.dataValues]);
    }).catch(function(error) {
      res.status(500);
      res.json(error);
    });
  };

  /**
   * PUT /categories/:id
   */
  var putOnId = function(req, res) {
    var id = req.params.id;
    var validation = validators.sanitizeAndValidate(req.body, validationSchema);

    if (!validation.isValid) {
      res.status(400);
      res.json(validation.errors);
      return Promise.resolve();
    }

    return Category.findById(id).then(function(category) {
      if (!category) {
        res.status(404);
        res.json(new errors.ResourceNotFoundError('Category', id));
        return Promise.resolve();
      }
      return category.update(validation.sanitizedData).then(function(resp) {
        res.status(200);
        res.json([resp.dataValues]);
      }).catch(function(error) {
        res.status(500);
        res.json(error);
      });
    })
  };

  /**
   * DELETE /categories/:id
   */
  var removeById = function(req, res) {
    var id = req.params.id;

    return Category.findById(id).then(function(category) {
      if (!category) {
        res.status(404);
        res.json(new errors.ResourceNotFoundError('Category', id));
        return Promise.resolve();
      }
      return category.destroy().then(function() {
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

module.exports = categoriesController();
