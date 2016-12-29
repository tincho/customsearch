var Sequelize  = require('sequelize');
var _          = Sequelize.Utils._;
var config     = require('../config.json');

var sequelize = new Sequelize(config.db_name, config.db_user, config.db_password, {
  host: config.db_host,
  dialect: config.db_driver
});
var Model = sequelize.define(config.db_table);

module.exports = new Promise(function(resolve) {
    Model.describe().then(_.flow(init, resolve));
});

function init(tables) {
    var tableColumns = Object.keys(tables);
    // avoid querying unexisting columns
    var searchFields  = (config.search_fields  === '*') ? tableColumns : _.intersection(tableColumns, config.search_fields);
    var displayFields = (config.display_fields === '*') ? tableColumns : _.intersection(tableColumns, config.display_fields);

    return {
        searchFields: searchFields,
        displayFields: displayFields,
        get_columns: _.constant(tableColumns),
        get_columns_selected: _.constant(displayFields),
        get_search: search
    };
}

function search(query) {
    var defaults = {
        q: undefined, // the search term
        type: 'any',
        // 'any' match any of the specified words. DEFAULT OPTION
        // 'all' : match each and every word but may be separate
        // 'full' : match the whole term without splitting words
        limit: 148,
        offset: 0
    };
    var data = Object.assign(defaults, query);
    var terms = (data.type === 'full') ? [data.q] : data.q.replace(/\s+/g, ' ').split(' ');

    var conditions = {
        '$or': this.searchFields.map(fieldConditionsMaker, {
            "conditions": terms.map($likeMaker),
            "conditionType": ['$or', '$and'][+(data.type === 'all')]
        })
    };

    return Model.findAll({
        attributes: this.displayFields,
        where: conditions,
        raw: true,
        limit: parseInt(data.limit, 10),
        offset: parseInt(data.offset, 10)
    });

}


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
}

function $likeMaker(term) {
    return {'$like': term.wrap('%')};
}
