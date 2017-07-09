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

var app = express();

Search.init(config).then(function(search) {
    console.log("Config ready");
    app.get("/search", (req, res) => {
        res.type('json');
        search.get_search(req.query).then(result => {
            res.send(JSON.stringify(result, utf8decode));
        });
    });
    app.get("/columns", (req, res) => res.json(search.get_columns()));
    app.get("/columns/selected", (req, res) => res.json(search.get_columns_selected()));
    app.use("/", express.static("./public"));
});
console.log("Listening on http://localhost:" + process.env.PORT);
app.listen(process.env.PORT || 3000);

function utf8decode(key, value) {
    if (typeof value !== 'string') return value;
    try {
        value = utf8.decode(value);
    } catch(e) {
        console.log(e);
    }
    return value;
}
