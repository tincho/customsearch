/**
 * simple query tool for relational databases relying on Sequelize ORM
 * a config.json file must provide data source info such as db connection,
 * table containing data, where to search and what to return
 * ENDPOINTS:
    /search?q=terms%20to%20search&type=any|all|full (leave empty for "any")
    /columns (all table columns)
    /columns/selected (columns to display, set in config)
 */

'use strict';

var express    = require("express");
var bodyParser = require('body-parser');
var config     = require('./config');
var Search     = require('./search');
var utf8       = require('utf8');
const _ = require('./node_modules/sequelize/node_modules/lodash');

// this might come from config ?
var API_ROOT = process.env.API_ROOT || '';
var app = express();
app.use("/", express.static("./public"));

var APIready = Search.init(config);
APIready.then(function() {
    console.log("Config ready");
});

// all table columns... should be private??
app.get(API_ROOT + "/columns", (req, res) => {
    APIready.then(API => res.json(API.get_columns()));
});
// columns that will be visible to frontend result
app.get(API_ROOT + "/columns/selected", (req, res) => {
    APIready.then(API => res.json(API.get_columns_selected()));
});
// search itself
app.get(API_ROOT + "/search", (req, res) => {
    APIready.then(API => {
        //console.log(search);
        API.get_search(req.query).then(function(result) {
            res.type('json');
            let response = JSON.stringify(result, utf8decode);
            res.send(response);
        });
    });
});

// CONFIG MODULE
{
  const Authorize = (req, res, next) => {
    // @TODO implement auth res.send(error)
    next()
  };

  let config_public = _.pick(config, [
      "db_table",
      "search_fields",
      "display_fields",
      "default_order"
  ]);

  app.get(API_ROOT + "/configure", Authorize, (req, res) => {
      APIready.then(API => {
          let response = {
              current_config: config_public,
              // why include this here if there is /columns ? maybe soon /columns be deprecated
              fields: API.get_columns()
          }
          res.json(response);
      })
  });

  app.post(API_ROOT + "/configure", Authorize, bodyParser.json(), (req, res) => {
      let newConfig = _.get(req, "body.config", {});
      if (newConfig.search_fields) {
          newConfig.search_fields = Search.existingFields(newConfig.search_fields);
      }
      if (newConfig.display_fields) {
          newConfig.display_fields = Search.existingFields(newConfig.display_fields);
      }
      if (newConfig.default_order) {
          newConfig.default_order = Search.parseOrder(newConfig.default_order);
      }
      res.send(Object.assign({}, config_public, newConfig));
  });
}

const PORT = process.env.PORT || 3000;
console.log("Listening on http://localhost:" + PORT);
console.log("API Root: " + API_ROOT);
app.listen(PORT);

function utf8decode(key, value) {
    if (typeof value !== 'string') return value;
    try {
        value = utf8.decode(value);
    } catch(e) {
        console.log(e);
    }
    return value;
}
