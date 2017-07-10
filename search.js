/**
 * DB Search module "Kind of Query Builder"
 * @usage:
Search = require('search');
Search.init(require('config.json')).then(function(search) {
    let allColumns    = search.get_columns();
    // get those searchFields defined in config object
    let searchColumns = search.get_columns_selected();
    let result        = search.get_search(paramsObject); // @see QueryBuilder
});
 */

'use strict';

var Sequelize  = require('sequelize');
var _          = Sequelize.Utils._;

/**
 * wraps string with given chars if not already wrapped
 */
String.prototype.wrap = function(begin, end) {
    end = end || begin;
    return begin + this + end;
};

// IIFE to not pollute the global environment
(function() {

    var Model;

    /**
    * initialize search engine
    * @param {Object} config
       keys: db_user, db_password, db_host, db_name, db_table, db_driver,
       {Array} search_fields
       {Array} display_fields
     * @return {Promise} resolved once table is describe()'d
    */
    exports.init = function init(config) {
        var dbh = new Sequelize(config.db_name, config.db_user, config.db_password, {
            host: config.db_host,
            dialect: config.db_driver
        });
        Model = dbh.define(config.db_table);
        return new Promise(resolve => {
            Model.describe().then(columns => {
                let tableColumns = Object.keys(columns),
                    // avoid querying unexisting columns:
                    searchFields  = (config.search_fields  === '*') ? tableColumns : _.intersection(tableColumns, config.search_fields),
                    displayFields = (config.display_fields === '*') ? tableColumns : _.intersection(tableColumns, config.display_fields),
                    moduleAPI = {
                        get_columns: () => tableColumns,
                        get_columns_selected: () => displayFields,
                        get_search: params => Model.findAndCountAll(QueryBuilder(params, displayFields, searchFields))
                    };
                resolve(moduleAPI);
            });
        });
    }

    /**
     * Query Builder properly
     * @param {Object} query comes from Expres's BodyParser I think
     * @TODO someday support expressions as NOT:term or term{n-times}
     * @see 'defaults' below for query object keys
     * @param {Array} displayFields columns to be selected
     * @param {Array} searchFields columns to match against terms
     * @return {Promise}
     */
    function QueryBuilder(query, displayFields, searchFields) {
        var defaults = {
            q: undefined, // the search term
            type: 'any',
            // 'any' match any of the specified words. DEFAULT OPTION
            // 'all' : match each and every word but may be separate
            // 'full' : match the whole term without splitting words
            limit: 20,
            offset: 0
        };
        var data = Object.assign(defaults, query);

        var terms = (data.type === 'full') ? [data.q] : data.q.replace(/\s+/g, ' ').split(' ');
        var conditionType = (data.type === 'all') ? '$and' : '$or';

        // @TODO utf8 encode ? solve that!
        var likeStatements = terms.map(term => ({'$like': term.wrap('%')}));
        var conditions = searchFields.map(field => ({
            [field]: {
                [conditionType]: likeStatements
            }
        }));

        return {
            attributes: displayFields,
            where: {
                '$or': conditions
                // @TODO additional fixed conditions?
            },
            raw: true,
            limit: parseInt(data.limit, 10),
            offset: parseInt(data.offset, 10),
            order: data.order
        }
    }
})();
