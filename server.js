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
var _          = require('sequelize').Utils._;


var API_ROOT = process.env.API_ROOT || '';
var app = express();

var APIready = Search.init(config);
APIready.then(function() {
    console.log("Config ready");
});

app.use("/", express.static("./public"));
app.get(API_ROOT + "/search", (req, res) => {
    APIready.then(search => {
        //console.log(search);
        search.get_search(req.query).then(function(result) {
            res.type('json');
            result.limit = parseInt(req.query.limit);
            result.offset = parseInt(req.query.offset);
            let response = JSON.stringify(result, utf8decode);
            res.send(response);
          });
    });
});
app.get(API_ROOT + "/columns", (req, res) => {
    APIready.then(search => res.json(search.get_columns()));
});
app.get(API_ROOT + "/columns/selected", (req, res) => {
    APIready.then(search => res.json(search.get_columns_selected()));
});

var PORT = process.env.PORT || 3000;
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
