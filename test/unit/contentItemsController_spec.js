/* globals describe, beforeEach, it, afterEach */
var sinon = require('sinon');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var sinonChai = require('sinon-chai');
chai.use(chaiAsPromised);
chai.use(sinonChai);
chai.should();
var errors = require('../../services/errorService');
var Promise = require('bluebird');
var auth = require('../../services/authService');
var proxyquire = require('proxyquire');
var mocks = require('../mocks');

describe('Content Items Controller', function() {
  var req, res, contentItemsController, reqGet, getUserData, yadaguruDataMock;

  beforeEach(function() {
    yadaguruDataMock = mocks.getYadaguruDataMock('contentItemService');
    yadaguruDataMock.stubMethods();
    req = {
      get: function(){}
    };
    res = {
      status: sinon.spy(),
      json: sinon.spy()
    };
    reqGet = sinon.stub(req, 'get');
    getUserData = sinon.stub(auth, 'getUserData');
    contentItemsController = proxyquire('../../controllers/contentItemsController', {
      'yadaguru-data': yadaguruDataMock.getMockObject()
    });
  });

  afterEach(function() {
    res.status.reset();
    res.json.reset();
    reqGet.restore();
    getUserData.restore();
    yadaguruDataMock.restoreStubs();
  });

  describe('GET /content_items', function() {
    it('should respond with an array of all content items and a 200 status', function() {
      var contentItems = [{
        id: 1,
        name: 'faqs',
        content: 'Some frequently asked questions...'
      }, {
        id: 2,
        name: 'privacy',
        content: 'Our privacy policy...'
      }];
      reqGet.withArgs('Authorization')
        .returns('Bearer a valid token');
      getUserData.withArgs('Bearer a valid token')
        .returns({userId: 1, role: 'admin'});
      yadaguruDataMock.services.contentItemService.stubs.findAll.returns(Promise.resolve(contentItems));

      return contentItemsController.getAll(req, res).then(function() {
        res.json.should.have.been.calledWith(contentItems);
        res.status.should.have.been.calledWith(200);
      });

    });

    it('should respond with an empty array and a 200 status if there are no content items', function() {
      reqGet.withArgs('Authorization')
        .returns('Bearer a valid token');
      getUserData.withArgs('Bearer a valid token')
        .returns({userId: 1, role: 'admin'});
      yadaguruDataMock.services.contentItemService.stubs.findAll.returns(Promise.resolve([]));

      return contentItemsController.getAll(req, res).then(function() {
        res.json.should.have.been.calledWith([]);
        res.status.should.have.been.calledWith(200);
      });

    });

    it('should respond with an error object and a 500 status on a database error', function() {
      var error = new Error('database error');
      reqGet.withArgs('Authorization')
        .returns('Bearer a valid token');
      getUserData.withArgs('Bearer a valid token')
        .returns({userId: 1, role: 'admin'});
      yadaguruDataMock.services.contentItemService.stubs.findAll.returns(Promise.reject(error));

      return contentItemsController.getAll(req, res).then(function() {
        res.json.should.have.been.calledWith(error);
        res.status.should.have.been.calledWith(500);
      });

    });

    it('should respond a 401 error if the user role is not authorized for this route', function() {
      reqGet.withArgs('Authorization')
        .returns('Bearer a valid token');
      getUserData.withArgs('Bearer a valid token')
        .returns({userId: 1, role: 'user'});

      return contentItemsController.getAll(req, res).then(function() {
        res.json.should.have.been.calledWith(new errors.NotAuthorizedError());
        res.status.should.have.been.calledWith(401);
      });
    });

    it('should respond a 401 error if the user token is invalid', function() {
      reqGet.withArgs('Authorization')
        .returns('Bearer an invalid token');
      getUserData.withArgs('Bearer an invalid token')
        .returns(false);

      return contentItemsController.getAll(req, res).then(function() {
        res.json.should.have.been.calledWith(new errors.NotAuthorizedError());
        res.status.should.have.been.calledWith(401);
      });
    });
  });

  describe('GET /content_items/:name', function() {
    it('should respond with an array with the matching content item and a 200 status', function() {
      req.params = {name: 'faqs'};
      var contentItem = {
        id: 1,
        name: 'faqs',
        content: 'Some frequently asked questions...'
      };
      yadaguruDataMock.services.contentItemService.stubs.findByName.withArgs('faqs')
        .returns(Promise.resolve([contentItem]));

      return contentItemsController.getByName(req, res).then(function() {
        res.json.should.have.been.calledWith([contentItem]);
        res.status.should.have.been.calledWith(200);
      });
    });

    it('should an error object and a 404 status if the content item does not exist', function() {
      req.params = {name: 'foobar'};
      var error = new errors.ResourceNotFoundError('ContentItem', req.params.name);
      yadaguruDataMock.services.contentItemService.stubs.findByName.withArgs('foobar')
        .returns(Promise.resolve([]));

      return contentItemsController.getByName(req, res).then(function() {
        res.json.should.have.been.calledWith(error);
        res.status.should.have.been.calledWith(404);
      });

    });

    it('should respond with an error object and a 500 status on a database error', function() {
      req.params = {id: 1};
      reqGet.withArgs('Authorization')
        .returns('Bearer a valid token');
      getUserData.withArgs('Bearer a valid token')
        .returns({userId: 1, role: 'admin'});
      var error = new Error('database error');
      yadaguruDataMock.services.contentItemService.stubs.findByName.returns(Promise.reject(error));

      return contentItemsController.getByName(req, res).then(function() {
        res.json.should.have.been.calledWith(error);
        res.status.should.have.been.calledWith(500);
      });

    });
  });

  describe('POST /content_items', function() {
    it('should respond with new contentItem object and 200 status on success', function() {
      req.body = {name: 'Help Tip', content: 'Here is a help tip'};
      var successfulCreateResponse = {
        id: '2',
        name: req.body.name,
        content: req.body.content
      };
      reqGet.withArgs('Authorization')
        .returns('Bearer a valid token');
      getUserData.withArgs('Bearer a valid token')
        .returns({userId: 1, role: 'admin'});
      yadaguruDataMock.services.contentItemService.stubs.create.returns(Promise.resolve([successfulCreateResponse]));

      return contentItemsController.post(req, res).then(function() {
        res.json.should.have.been.calledWith([successfulCreateResponse]);
        res.status.should.have.been.calledWith(200);
      });
    });

    it('should respond with an error and 400 status on if name is missing', function() {
      req.body = {content: 'Some help text'};
      reqGet.withArgs('Authorization')
        .returns('Bearer a valid token');
      getUserData.withArgs('Bearer a valid token')
        .returns({userId: 1, role: 'admin'});
      var error = new errors.ValidationError([{
        field: 'name',
        message: 'is required'
      }]);

      return contentItemsController.post(req, res).then(function() {
        res.json.should.have.been.calledWith(error);
        res.status.should.have.been.calledWith(400);
      });
    });

    it('should respond with an error and 400 status on if content is missing', function() {
      req.body = {name: 'Help Tip'};
      reqGet.withArgs('Authorization')
        .returns('Bearer a valid token');
      getUserData.withArgs('Bearer a valid token')
        .returns({userId: 1, role: 'admin'});
      var error = new errors.ValidationError([{
        field: 'content',
        message: 'is required'
      }]);

      return contentItemsController.post(req, res).then(function() {
        res.json.should.have.been.calledWith(error);
        res.status.should.have.been.calledWith(400);
      });
    });

    it('should respond with an error and a 500 status on a database error', function() {
      req.body = {name: 'Help Tip', content: 'Some Help Text'};
      reqGet.withArgs('Authorization')
        .returns('Bearer a valid token');
      getUserData.withArgs('Bearer a valid token')
        .returns({userId: 1, role: 'admin'});
      var databaseError = new Error('some database error');
      yadaguruDataMock.services.contentItemService.stubs.create.returns(Promise.reject(databaseError));

      return contentItemsController.post(req, res).then(function() {
        res.json.should.have.been.calledWith(databaseError);
        res.status.should.have.been.calledWith(500);
      });
    });

    it('should respond a 401 error if the user role is not authorized for this route', function() {
      reqGet.withArgs('Authorization')
        .returns('Bearer a valid token');
      getUserData.withArgs('Bearer a valid token')
        .returns({userId: 1, role: 'user'});

      return contentItemsController.post(req, res).then(function() {
        res.json.should.have.been.calledWith(new errors.NotAuthorizedError());
        res.status.should.have.been.calledWith(401);
      });
    });

    it('should respond a 401 error if the user token is invalid', function() {
      reqGet.withArgs('Authorization')
        .returns('Bearer an invalid token');
      getUserData.withArgs('Bearer an invalid token')
        .returns(false);

      return contentItemsController.post(req, res).then(function() {
        res.json.should.have.been.calledWith(new errors.NotAuthorizedError());
        res.status.should.have.been.calledWith(401);
      });
    });
  });

  describe('PUT /content_items/:id', function() {
    it('should respond with the updated contentItem object and 200 status on success', function() {
      req.body = {name: 'Help Tip', content: 'Some Help Text'};
      req.params = {id: 1};
      var updatedContentItem = {
        id: '1',
        name: req.body.name,
        content: req.body.content
      };
      reqGet.withArgs('Authorization')
        .returns('Bearer a valid token');
      getUserData.withArgs('Bearer a valid token')
        .returns({userId: 1, role: 'admin'});
      yadaguruDataMock.services.contentItemService.stubs.update.withArgs(req.params.id, req.body)
        .returns(Promise.resolve([updatedContentItem]));

      return contentItemsController.putOnId(req, res).then(function() {
        res.json.should.have.been.calledWith([updatedContentItem]);
        res.status.should.have.been.calledWith(200);
      });
    });

    it('should respond with an error and 404 status if content item does not exist', function() {
      req.body = {name: 'Help Tip', content: 'Some Help Text'};
      req.params = {id: 2};
      reqGet.withArgs('Authorization')
        .returns('Bearer a valid token');
      getUserData.withArgs('Bearer a valid token')
        .returns({userId: 1, role: 'admin'});
      var error = new errors.ResourceNotFoundError('ContentItem', req.params.id);
      yadaguruDataMock.services.contentItemService.stubs.update.withArgs(2)
        .returns(Promise.resolve(false));

      return contentItemsController.putOnId(req, res).then(function() {
        res.json.should.have.been.calledWith(error);
        res.status.should.have.been.calledWith(404);
      })
    });

    it('should respond with an error and a 500 status on a database error', function() {
      req.body = {name: 'Essay'};
      req.params = {id: 1};
      reqGet.withArgs('Authorization')
        .returns('Bearer a valid token');
      getUserData.withArgs('Bearer a valid token')
        .returns({userId: 1, role: 'admin'});
      var error = new Error('database error');
      yadaguruDataMock.services.contentItemService.stubs.update.withArgs(req.params.id, req.body)
        .returns(Promise.reject(error));

      return contentItemsController.putOnId(req, res).then(function() {
        res.json.should.have.been.calledWith(error);
        res.status.should.have.been.calledWith(500);
      })
    });

    it('should respond a 401 error if the user role is not authorized for this route', function() {
      reqGet.withArgs('Authorization')
        .returns('Bearer a valid token');
      getUserData.withArgs('Bearer a valid token')
        .returns({userId: 1, role: 'user'});

      return contentItemsController.putOnId(req, res).then(function() {
        res.json.should.have.been.calledWith(new errors.NotAuthorizedError());
        res.status.should.have.been.calledWith(401);
      });
    });

    it('should respond a 401 error if the user token is invalid', function() {
      reqGet.withArgs('Authorization')
        .returns('Bearer an invalid token');
      getUserData.withArgs('Bearer an invalid token')
        .returns(false);

      return contentItemsController.putOnId(req, res).then(function() {
        res.json.should.have.been.calledWith(new errors.NotAuthorizedError());
        res.status.should.have.been.calledWith(401);
      });
    });
  });

  describe('DELETE /content_items/:id', function() {
    it('should respond with the content item ID and 200 status on success', function() {
      req.params = {id: 1};
      reqGet.withArgs('Authorization')
        .returns('Bearer a valid token');
      getUserData.withArgs('Bearer a valid token')
        .returns({userId: 1, role: 'admin'});
      yadaguruDataMock.services.contentItemService.stubs.destroy.withArgs(req.params.id)
        .returns(Promise.resolve(true));

      return contentItemsController.removeById(req, res).then(function() {
        res.json.should.have.been.calledWith([{deletedId: 1}]);
        res.status.should.have.been.calledWith(200);
      })
    });

    it('should respond with an error and 404 status if contentItem does not exist', function() {
      req.params = {id: 2};
      reqGet.withArgs('Authorization')
        .returns('Bearer a valid token');
      getUserData.withArgs('Bearer a valid token')
        .returns({userId: 1, role: 'admin'});
      var error = new errors.ResourceNotFoundError('ContentItem', req.params.id);
      yadaguruDataMock.services.contentItemService.stubs.destroy.withArgs(req.params.id)
        .returns(Promise.resolve(false));

      return contentItemsController.removeById(req, res).then(function() {
        res.json.should.have.been.calledWith(error);
        res.status.should.have.been.calledWith(404);
      })
    });

    it('should respond with an error and a 500 status on a database error', function() {
      req.params = {id: 1};
      reqGet.withArgs('Authorization')
        .returns('Bearer a valid token');
      getUserData.withArgs('Bearer a valid token')
        .returns({userId: 1, role: 'admin'});
      var error = new Error('database error');
      yadaguruDataMock.services.contentItemService.stubs.destroy.withArgs(req.params.id)
        .returns(Promise.reject(error));

      return contentItemsController.removeById(req, res).then(function() {
        res.json.should.have.been.calledWith(error);
        res.status.should.have.been.calledWith(500);
      })
    });

    it('should respond a 401 error if the user role is not authorized for this route', function() {
      reqGet.withArgs('Authorization')
        .returns('Bearer a valid token');
      getUserData.withArgs('Bearer a valid token')
        .returns({userId: 1, role: 'user'});

      return contentItemsController.removeById(req, res).then(function() {
        res.json.should.have.been.calledWith(new errors.NotAuthorizedError());
        res.status.should.have.been.calledWith(401);
      });
    });

    it('should respond a 401 error if the user token is invalid', function() {
      reqGet.withArgs('Authorization')
        .returns('Bearer an invalid token');
      getUserData.withArgs('Bearer an invalid token')
        .returns(false);

      return contentItemsController.removeById(req, res).then(function() {
        res.json.should.have.been.calledWith(new errors.NotAuthorizedError());
        res.status.should.have.been.calledWith(401);
      });
    });
  });
});
