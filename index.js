/**
 * simple query tool for relational databases relying on Sequelize ORM
 * a config.json file must provide data source info such as db connection,
 * table containing data, where to search and what to return
 * use via /search?q=terms%20to%20search&type=any|all|full (leave empty for "any")
 */

var express    = require("express");
var Sequelize  = require('sequelize');
var _          = Sequelize.Utils._;
var config     = require('./config');
var bodyParser = require('body-parser');
var fs         = require('fs');

var sequelize = new Sequelize(config.db_name, config.db_user, config.db_password, {
  host: config.db_host,
  dialect: config.db_driver
});
var Model = sequelize.define(config.db_table);

var searchFields = config.search_fields;
var tableColumns = [];
Model.describe().then(function(cols) {
    tableColumns = Object.keys(cols);
    searchFields = tableColumns;
    if (config.search_fields !== '$all') {
        // this is to avoid querying unexisting columns
        searchFields = _.intersection(tableColumns, config.search_fields);
    }
    init();
});

function init() {
    var app = express();

    app.get("/search", HandleSearch);

    app.get("/columns", (req, res) => res.json(tableColumns));
    app.use("/demo", express.static("demo"));

    // @TODO deprecate web interface for CLI prompt!
    app.use("/configure", express.static("configure"));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.post("/configure/save", function(req, res) {
        fs.writeFile("config.json.generated", JSON.stringify(req.body), function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        });
        res.json(req.body);
    });

    app.listen(process.env.PORT || 3000);
}

function HandleSearch(req, res) {

    var defaults = {
        q: undefined, // the search term
        type: 'any'
        // 'any' match any of the specified words. DEFAULT OPTION
        // 'all' : match each and every word but may be separate
        // 'full' : match the whole term without splitting words
    };
    var data = Object.assign(defaults, req.query);
    var terms = (data.type === 'full') ? [data.q] : data.q.replace(/\s+/g, ' ').split(' ');

    var conditions = {
        '$or': searchFields.map(fieldConditionsMaker, {
            "conditions": terms.map($likeMaker),
            "conditionType": ['$or', '$and'][+(data.type === 'all')]
        })
    };

    Model.findAll({
        attributes: config.display_fields,
        where: conditions,
        raw: true,
        limit: 148 // @TODO paginatioN!!!!!
    }).then(res.json.bind(res));

};

/**
 * wraps string with given chars if not already wrapped
 */
String.prototype.wrap = function(begin, end) {
    end = end || begin;
    return begin+this+end;
};

/**
 * @see ES6 computed property names in object literal definition
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer
 */
function fieldConditionsMaker(field) {
    return {
        [field]: {
            [this.conditionType]: this.conditions
        }
    };
};

function $likeMaker(term) {
    return {'$like': term.wrap('%')};
};
