/**
 * @usage _search = require('search')
 * _search.init(config_obj).then(function(search) {
        search.get_search()
    })
 * config_obj = {
    "db_user": "",
    "db_password": "",
    "db_host": "localhost",
    "db_name": "",
    "db_table": "",
    "db_driver": "mysql",
    "search_fields": [],
    "display_fields": []
   }
 */

var Sequelize  = require('sequelize');
var _          = Sequelize.Utils._;

/**
 * wraps string with given chars if not already wrapped
 */
String.prototype.wrap = function(begin, end) {
    end = end || begin;
    return begin+this+end;
};

(function() {

    var Model;

    function exposeAPI(config, tables) {
        var tableColumns = Object.keys(tables);
        // avoid querying unexisting columns
        var searchFields  = (config.search_fields  === '*') ? tableColumns : _.intersection(tableColumns, config.search_fields);
        var displayFields = (config.display_fields === '*') ? tableColumns : _.intersection(tableColumns, config.display_fields);

        var API = {
            searchFields: searchFields,
            displayFields: displayFields,
            get_columns: _.constant(tableColumns),
            get_columns_selected: _.constant(displayFields)
        };
        API.get_search = search.bind(API);
        return API;
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
        var fieldConditionsType = (data.type === 'all') ? '$and' : '$or';

        var mkConditionObjForThisSearch = _.partial(mkConditionObj, fieldConditionsType, terms.map(mkLikeObj));
        var fieldsConditionList = this.searchFields.map(mkConditionObjForThisSearch);

        return Model.findAll({
            attributes: this.displayFields,
            where: {
                '$or': fieldsConditionList
            },
            raw: true,
            limit: parseInt(data.limit, 10),
            offset: parseInt(data.offset, 10)
        });

    }

    /**
     * @see ES6 computed property names in object literal definition
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer
     */
    function mkConditionObj(conditionType, conditions, field) {
        return {
            [field]: {
                [conditionType]: conditions
            }
        };
    }

    function mkLikeObj(term) {
        return {'$like': term.wrap('%')};
    }

    var dbh;
    module.exports = {
        init: function(config) {
            dbh = new Sequelize(config.db_name, config.db_user, config.db_password, {
                host: config.db_host,
                dialect: config.db_driver
            });
            Model = dbh.define(config.db_table);
            return new Promise(function(resolve) {
                Model.describe().then(
                    _.flow(
                        _.partial(exposeAPI, config),
                        resolve
                    ));
            });
        }
    };

})();
