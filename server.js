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

// config
// @Authorize
app.get(API_ROOT + "/configure", (req, res) => {
    APIready.then(API => {
        var
          config_keys   = [ "db_table", "search_fields", "display_fields", "default_order" ],
          config_public = _.pick(config, config_keys);
        res.json(config_public)
    });
});

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
