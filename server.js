/**
 * simple query tool for relational databases relying on Sequelize ORM
 * a config.json file must provide data source info such as db connection,
 * table containing data, where to search and what to return
 * use via /search?q=terms%20to%20search&type=any|all|full (leave empty for "any")
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
    app.get("/search", function handleSearch(req, res) {
        // before i was like :
        // search.get_search(req.query).then(res.json.bind(res));
        // but then...
        res.type('json');
        search.get_search(req.query).then(
            _.flow(
                _.partial(JSON.stringify, _, utf8decode),
                _.bind(res.send, res)
            )
        );
    });
    app.get("/columns", (req, res) => res.json(search.get_columns()));
    app.get("/columns/selected", (req, res) => res.json(search.get_columns_selected()));
    app.use("/", express.static("./public"));
});

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
