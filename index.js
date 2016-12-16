var express   = require("express");
var Sequelize = require('sequelize');
var _         = Sequelize.Utils._;
var config    = require('./config');

var sequelize = new Sequelize(config.db_name, config.db_user, config.db_password, {
  host: config.db_host,
  dialect: config.db_driver
});
var Model = sequelize.define(config.db_table);

var searchFields = config.search_fields;
Model.describe().then(function(cols) {
    searchFields = Object.keys(cols);
    if (config.search_fields !== '$all') {
        // this is to avoid querying unexisting columns
        searchFields = _.intersection(searchFields, config.search_fields);
    }
    init();
});

function init() {
    var app = express();
    app.get("/search", HandleSearch);
    app.listen(config.listen_on);
}

function HandleSearch(req, res) {

    var defaults = {
        q: undefined, // the term search
        full: false, // match the whole term without splitting words
        all: false // match each and every word, if not matching full obviously
    };
    var data = Object.assign(defaults, req.query);
    var matchFullTerm = !!data.full;
    var matchAllTerms = !!data.all;
    var terms = (matchFullTerm) ? [data.q] : data.q.replace(/\s+/g, ' ').split(' ');

    var conditions = {
        '$or': searchFields.map(fieldConditionsMaker, {
            "conditions": terms.map($likeMaker),
            "inclusionType": ['$or', '$and'][+matchAllTerms]
        })
    };

    Model.findAll({
        attributes: config.display_fields,
        where: conditions,
        raw: true
    }).then(res.json.bind(res));

};

/**
 * wraps string with given chars if not already wrapped
 */
String.prototype.wrap = function(begin, end) {
    end = end || begin;
    return this
        .replace(new RegExp("^([^\\"+begin+"])"),  begin + "$1")
        .replace(new RegExp( "([^\\"+ end +"])$"), "$1" + end);
};

/**
 * @see ES6 computed property names in object literal definition
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer
 */
function fieldConditionsMaker(field) {
    return {
        [field]: {
            [this.inclusionType]: this.conditions
        }
    };
};

function $likeMaker(term) {
    return {'$like': term.wrap('%')};
};
