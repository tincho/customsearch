var config    = require('./config');
var express   = require("express");
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.db_name, config.db_user, config.db_password, {
  host: 'localhost',
  dialect: 'mysql',
});


var app = express();
app.get("/", function(req, res) {

    // < request:
    var data = {
        q: 'pan integral',
        full: false,
        all: false
    };
    // >
    var matchFullTerm = data.full;
    var matchAllTerms = data.all;
    var terms = (matchFullTerm) ? [q] : q.replace(/\s+/g, ' ').split(' ');

    var comparers = terms.map($likeMaker);
    var inclusionType = ['$or', '$and'][+matchAllTerms];
    var conditions = { '$or': [] };
    config.search_fields.forEach(function(field) {
        var condition = {};
        condition[field] = {};
        condition[field][inclusionType] = comparers;
        conditions['$or'].push(condition);
    });
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
    }
});

app.listen(3000);
