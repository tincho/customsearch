var express   = require("express");
var Sequelize = require('sequelize');
var config    = require('./config');

var sequelize = new Sequelize(config.db_name, config.db_user, config.db_password, {
  host: 'localhost',
  dialect: 'mysql',
});

var searchFields = config.search_fields;
if (config.search_fields === '$all') {
    sequelize.define(config.db_table).describe().then(function(cols) {
        searchFields = Object.keys(cols));

        // hacer el listen acá ?
    });
}

var app = express();
app.get("/search", get_search);
app.listen(config.listen_on);

function get_search(req, res) {

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
        '$or': searchFields.map(fieldConditionsMaker, {
            "conditions": terms.map($likeMaker),
            "inclusionType": ['$or', '$and'][+!!matchAllTerms]
        })
    };

    sequelize.define(config.db_table).findAll({
        attributes: config.display_fields,
        where: conditions,
        raw: true
    }).then(res.json.bind(res));

};

function fieldConditionsMaker(field) {
    return {
        [field]: {
            [this.inclusionType]: this.conditions
        }
    };
};


function $likeMaker(term) {
    return {'$like': '%'+term+'%'};
};
