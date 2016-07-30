var schema = {
  name: {
    required: true
  },
  message: {
    required: true
  },
  detail: {
    required: true
  },
  lateMessage: {
    required: false
  },
  lateDetail: {
    required: false
  },
  categoryId: {
    required: true,
    rules: [{
      validator: 'isNumeric',
      message: 'must be a category ID number'
    }]
  },
  timeframeIds: {
    required: true,
    rules: [{
      validator: 'isNonEmptyArray',
      message: 'must be a non-empty array'
    }, {
      validator: 'isArrayOfNumbers',
      message: 'must be an array of timeframe ID numbers'
    }]
  }
};

module.exports = require('./baseController')('BaseReminder', schema);