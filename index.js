/**
 * simple query tool for relational databases relying on Sequelize ORM
 * a config.json file must provide data source info such as db connection,
 * table containing data, where to search and what to return
 * use via /search?q=terms%20to%20search&type=any|all|full (leave empty for "any")
 */

var express    = require("express");
var bodyParser = require('body-parser');
var config     = require('./config');
var _search    = require('./search');

var app = express();

_search.init(config).then(function(search) {
    app.get("/search", function(req, res) {
        search.get_search(req.query).then(res.json.bind(res));
    });
    app.get("/columns", (req, res) => res.json(search.get_columns()));
    app.get("/columns/selected", (req, res) => res.json(search.get_columns_selected()));
    app.use("/demo", express.static("demo"));
});

app.listen(process.env.PORT || 3000);
