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


// this might come from config ?
var API_ROOT = process.env.API_ROOT || '';
var app = express();
app.use("/", express.static("./public"));

Search.init(config).then(API => {
    console.log("Config ready");

    // all table columns... should be private??
    app.get(API_ROOT + "/columns", (req, res) => res.json(API.get_columns()));

    // columns that will be visible to frontend result
    app.get(API_ROOT + "/columns/selected", (req, res) => res.json(API.get_columns_selected()));

    // search itself
    app.get(API_ROOT + "/search", (req, res) => {
        res.type('json');
        API.get_search(req.query).then(result => {
            let response = JSON.stringify(result, utf8decode);
            res.send(response);
        });
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
