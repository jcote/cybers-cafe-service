// Copyright 2015-2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var config = require('../config');

function getModel () {
  return require('./model-' + config.get('DATA_BACKEND'));
}

var router = express.Router();

// Automatically parse request body as JSON
router.use(bodyParser.json());

/**
 * GET /api/entity
 *
 * Retrieve a page of entity (up to ten at a time).
 */
router.get('/', function list (req, res, next) {
  getModel().list(10, req.query.pageToken, function (err, entities, cursor) {
    if (err) {
      return next(err);
    }
    res.json({
      items: entities,
      nextPageToken: cursor
    });
  });
});

/**
 * POST /api/entity
 *
 * Create a new entity.
 */
router.post('/', function insert (req, res, next) {
  getModel().create(req.body, function (err, entity) {
    if (err) {
      return next(err);
    }
    res.json(entity);
  });
});

/**
 * GET /api/entity/:id
 *
 * Retrieve a entity.
 */
router.get('/:entity', function get (req, res, next) {
  getModel().read(req.params.entity, function (err, entity) {
    if (err) {
      return next(err);
    }
    res.json(entity);
  });
});

/**
 * PUT /api/entity/:id
 *
 * Update a entity.
 */
router.put('/:entity', function update (req, res, next) {
  getModel().update(req.params.entity, req.body, function (err, entity) {
    if (err) {
      return next(err);
    }
    res.json(entity);
  });
});

/**
 * DELETE /api/entity/:id
 *
 * Delete a entity.
 */
router.delete('/:entity', function _delete (req, res, next) {
  getModel().delete(req.params.entity, function (err) {
    if (err) {
      return next(err);
    }
    res.status(200).send('OK');
  });
});

/**
 * Errors on "/api/entity/*" routes.
 */
router.use(function handleRpcError (err, req, res, next) {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  err.response = {
    message: err.message,
    internalCode: err.code
  };
  next(err);
});

module.exports = router;
