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
const intersectionOrAll = (all, items) => (items === '*') ? all : _.intersection(all, items);

const SearchAPI = (config, runQuery, tableColumns) => {
  // ensure not querying unexisting columns:
  const existingFields = _.partial(intersectionOrAll, tableColumns);
  let fields = {
      toMatch: existingFields(config.search_fields),
      toSelect: existingFields(config.display_fields)
  };
  return {
      get_columns: () => tableColumns,
      get_columns_selected: () => fields.toSelect,
      get_search: params => {
          // offset and page are incompatible . user should provide: limit, page
          // override frontend offset
          // what if user provides page and no limit? offset will be 0 because limit is not here yet
          // (default limit is inside QueryBuilder)
          // params.offset = ~~params.limit * Math.max(~~params.page - 1, 0)
          // delete params.page;
          // @TODO: handle { page, limit } if page > totalPages
          console.log(params);
          let query = QueryBuilder(params, fields);
          if (params.order) {
              // @TODO handle order as:
              // &order[0]=field1 &direction[0]=desc &order[1]=field2 &direction[1]=asc
              let
                  direction = _.get(params.order.match(/ASC|DESC/), 0, ""),
                  orderFields = params.order.replace(/ASC|DESC/,'').trim().split(","),
                  existingOrderFields = existingFields(orderFields);
              // this is to ensure no unexisting field gets passed as ORDER BY
              query.order = existingOrderFields.length
                  ? existingOrderFields.join(", ") + " " + direction
                  : config.default_order;
          }
          return runQuery(query).then(result => {
              // @TODO obtain postProcesses from outer world ?
              let postProcess = [ Pagination ];
              let augments = postProcess.map(fn => fn(query, result));
              // @TODO use ES6 return Object.assign(result, ...augments);
              return Object.assign.apply({}, [result].concat(augments))
          });
      }
  };
};

const Pagination = (query, result) => {
    let currentPage = 1 + Math.ceil(query.offset / query.limit),
        totalPages  = Math.floor(result.count / query.limit) + 1;
    const prevTo = page => (currentPage > 1) ? currentPage - 1 : null;
    const nextTo = page => (currentPage < totalPages) ? currentPage + 1 : null;
    return {
        _pages: {
          total: totalPages,
          current: currentPage,
          prev: prevTo(currentPage),
          next: nextTo(currentPage)
        },
        limit: query.limit,
        offset: query.offset
    }
}

// example:
/* const PostProcessThatChangesRows = (query, result) => {
    let rows = Array.from(result.rows).map(row => {
        row.something = "something";
        return row;
    });
    return { rows };
} */

/**
* initialize search engine
* @param {Object} config
   keys: db_user, db_password, db_host, db_name, db_table, db_driver,
   {Array} search_fields
   {Array} display_fields
 * @return {Promise} resolved once table is describe()'d
*/
exports.init = config => {
    let
        dbh = new Sequelize(config.db_name, config.db_user, config.db_password, {
            host: config.db_host,
            dialect: config.db_driver
        }),
        Model = dbh.define(config.db_table),
        runQuery = Model.findAndCountAll.bind(Model),
        createAPI = cols => SearchAPI(config, runQuery, Object.keys(cols));
    return Model.describe().then(createAPI);
}
