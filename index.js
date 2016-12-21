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

// @see _.flow! "compose"-like functional utility
Model.describe().then(_.flow(Object.keys, init));

function init(tableColumns) {
    // avoid querying unexisting columns
    var searchFields  = (config.search_fields  === '*') ? tableColumns : _.intersection(tableColumns, config.search_fields);
    var displayFields = (config.display_fields === '*') ? tableColumns : _.intersection(tableColumns, config.display_fields);

    var app = express();
    app.get("/search", HandleSearch.bind({
        searchFields: searchFields,
        displayFields: displayFields
    }));

    app.get("/columns", (req, res) => res.json(tableColumns));
    app.get("/columns/selected", (req, res) => res.json(displayFields));
    app.use("/demo", express.static("demo"));

    app.listen(process.env.PORT || 3000);
}

function HandleSearch(req, res) {

    var defaults = {
        q: undefined // the search term
        , type: 'any'
        // 'any' match any of the specified words. DEFAULT OPTION
        // 'all' : match each and every word but may be separate
        // 'full' : match the whole term without splitting words
        , limit: 148
        , offset: 0
    };
    var data = Object.assign(defaults, req.query);
    var terms = (data.type === 'full') ? [data.q] : data.q.replace(/\s+/g, ' ').split(' ');

    var conditions = {
        '$or': this.searchFields.map(fieldConditionsMaker, {
            "conditions": terms.map($likeMaker),
            "conditionType": ['$or', '$and'][+(data.type === 'all')]
        })
    };

    Model.findAll({
        attributes: this.displayFields,
        where: conditions,
        raw: true,
        limit: parseInt(data.limit, 10),
        offset: parseInt(data.offset, 10)
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
