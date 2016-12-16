/**
 * @TODO: if config.search_fields == '$all' (or some other wildcard)
 * inspect the table and get all the fields
 * var fieldNames;
 * s.define(config.db_table).describe().then(function(fields) { fieldNames = Object.keys(fields)); });
 */

var config    = require('./config');
var express   = require("express");
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.db_name, config.db_user, config.db_password, {
  host: 'localhost',
  dialect: 'mysql',
});

var app = express();
app.get("/search", function(req, res) {

    var defaults = {
        q: undefined, // the term search
        full: false, // match the whole term without splitting words
        all: false // match each and every word, if not matching full obviously
    };
    var data = Object.assign(defaults, req.query);
    var matchFullTerm = data.full;
    var matchAllTerms = data.all;
    var terms = (matchFullTerm) ? [data.q] : data.q.replace(/\s+/g, ' ').split(' ');

    var conditions = {
        '$or': config.search_fields.map(fieldConditionsMaker, {
            "conditions": terms.map($likeMaker),
            "inclusionType": ['$or', '$and'][+matchAllTerms]
        })
    };

    var Model = sequelize.define(config.db_table);
    Model.findAll({
        attributes: config.display_fields,
        where: conditions,
        raw: true
    }).then(function(result) {
        res.json(result);
    });

    function $likeMaker(term) {
        return {
            '$like': '%'+term+'%'
        };
    };
    function fieldConditionsMaker(field) {
        var condition = {};
        condition[field] = {};
        condition[field][this.inclusionType] = this.conditions;
        return condition;
    };
});

app.listen(3000);
