var env = process.env.NODE_ENV || 'development';
var config = require('../config/config.json')[env];
var testDateService = require('yadaguru-data')(config).testDateService;

var schema = {
  testId: {
    required: true,
    rules: [{
      validator: 'isNumeric',
      message: 'must be a number'
    }]
  },
  registrationDate: {
    required: true,
    rules: [{
      validator: 'isDate',
      message: 'must be a date'
    }]

  },
  adminDate: {
    required: true,
    rules: [{
      validator: 'isDate',
      message: 'must be a date'
    }]
  }
};

var requiredRoles = {
  getAll: ['admin'],
  post: ['admin'],
  getById: ['admin'],
  putOnId: ['admin'],
  removeById: ['admin']
};

module.exports = require('./baseController')('TestDate', testDateService, schema, requiredRoles);
