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

var Sequelize = require('sequelize');
var _ = Sequelize.Utils._;
var QueryBuilder = require("./queryBuilder");

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
                // ensure not querying unexisting columns:
                const existingFields = f => (f === '*') ? tableColumns : _.intersection(tableColumns, f);

                let tableColumns = Object.keys(columns),
                    fields = {
                        toMatch: existingFields(config.search_fields),
                        toSelect: existingFields(config.search_fields),
                        orderBy: config.default_order
                    },
                    moduleAPI = {
                        get_columns: () => tableColumns,
                        get_columns_selected: () => fields.toSelect,
                        get_search: params => {
                            // @TODO prevent errors ensuring order field exists!
                            // let orderField = params.order.replace(/ASC|DESC/,'').trim();
                            return Model.findAndCountAll(QueryBuilder(params, fields));
                        }
                    };
                resolve(moduleAPI);
            });
        });
    }

})();
