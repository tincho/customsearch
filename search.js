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

const Sequelize = require('sequelize');
const QueryBuilder = require('./queryBuilder');
const _ = Sequelize.Utils._;

const SearchAPI = (config, runQuery, tableColumns) => {
  // ensure not querying unexisting columns:
  const existingFields = f => (f === '*') ? tableColumns : _.intersection(tableColumns, f);
  let fields = {
      toMatch: existingFields(config.search_fields),
      toSelect: existingFields(config.display_fields)
  };
  return {
      get_columns: () => tableColumns,
      get_columns_selected: () => fields.toSelect,
      get_search: params => {
          // offset and page are incompatible . user should choose either
          // override frontend offset ?
          // params.offset = ~~params.limit * Math.max(~~params.page - 1, 0)
          // delete params.page;
          // todo: handle { page, limit } if page > totalPages
          console.log(params);
          let query = QueryBuilder(params, fields);
          if (params.order) {
              let
                  direction = _.get(params.order.match(/ASC|DESC/), 0, ""),
                  orderFields = params.order.replace(/ASC|DESC/,'').trim().split(","),
                  existingOrderFields = existingFields(orderFields);
              query.order = existingOrderFields.length
                  ? existingOrderFields.join(", ") + " " + direction
                  : config.default_order;
          }
          return runQuery(query).then(result => {
              let currentPage = 1 + Math.ceil(query.offset / query.limit),
                  totalPages  = Math.floor(result.count / query.limit) + 1;
              const prevTo = page => (currentPage > 1) ? currentPage - 1 : null;
              const nextTo = page => (currentPage < totalPages) ? currentPage + 1 : null;
              return Object.assign({
                  _pages: {
                    total: totalPages,
                    current: currentPage,
                    prev: prevTo(currentPage),
                    next: nextTo(currentPage)
                  },
                  limit: query.limit,
                  offset: query.offset
              }, result);
              // return Object.assign(result, postProcess(query, result))
              // postProcess = (query, result) => augment result with all given postProcess callbacks (should return object to be merged)
              // e.g = Pagination, HATEOAS
          });
      }
  };
};

/**
* initialize search engine
* @param {Object} config
   keys: db_user, db_password, db_host, db_name, db_table, db_driver,
   {Array} search_fields
   {Array} display_fields
 * @return {Promise} resolved once table is describe()'d
*/
module.exports = {
    init: config => {
        let
            dbh = new Sequelize(config.db_name, config.db_user, config.db_password, {
                host: config.db_host,
                dialect: config.db_driver
            }),
            Model = dbh.define(config.db_table);
        return Model.describe().then(cols => SearchAPI(
          // {
              // config:
              config,
              // runQuery:
              Model.findAndCountAll.bind(Model),
              // tableColumns:
              Object.keys(cols)
        // }
        ));
    }
}
