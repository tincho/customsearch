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
const BuildWhere = require('./buildWhere');
const _ = Sequelize.Utils._;
const intersectionOrAll = (all, items) => (items === '*') ? all : _.intersection(all, items);

const SearchAPI = (config, runQuery, tableColumns) => {
  // ensure not querying unexisting columns:
  const existingFields = _.partial(intersectionOrAll, tableColumns);
  let fields = {
      toMatch: existingFields(config.search_fields),
      toSelect: existingFields(config.display_fields)
  };

  config.default_limit = 20;
  return {
      get_columns: () => tableColumns,
      get_columns_selected: () => fields.toSelect,
      get_search: params => {
          params = Object.assign({
            page: 1,
            limit: config.default_limit
          }, params);
          let query = Object.assign({
              attributes: fields.toSelect,
              raw: true
          }, BuildQuery(params, _.partial(BuildWhere, fields.toMatch)));
          return runQuery(query).then(result => {
              // @TODO obtain postProcesses from outer world ?
              let postProcess = [ Pagination ];
              // @TODO query and result should be passed as clones so postProcessors cant mutate them
              let augments = postProcess.map(fn => fn(query, result));
              // @TODO use ES6:
              // return Object.assign(result, ...augments);
              return Object.assign.apply({}, [result].concat(augments))
          });
      }
  };

  function BuildQuery(params, Where) {
    let query = {
        offset: ~~params.limit * Math.max(~~params.page -1, 0),
        limit: parseInt(params.limit)
    };

    if (typeof params.q === 'string' && params.q !== '') {
        let
          q = params.q,
          type = params.type || 'any',
          terms = (type === 'full')
            ? [q]
            : q.replace(/\s+/g, ' ').split(' ');
        query.where = Where(type, terms);
    }

    if (typeof params.order === 'string') {
        // @TODO handle order as:
        // &order[0]=field1 &direction[0]=desc &order[1]=field2 &direction[1]=asc
        let
            order = params.order,
            direction = _.get(order.match(/ASC|DESC/), 0, ""),
            orderFields = order.replace(/ASC|DESC/,'').trim().split(","),
            existingOrderFields = existingFields(orderFields);
        // this is to ensure no unexisting field gets passed as ORDER BY
        query.order = existingOrderFields.length
          ? existingOrderFields.join(", ") + " " + direction
          : config.default_order;
    }
    return query;
  };

};

//  Post-Query
const Pagination = (query, result) => {
    let currentPage = 1 + ~~Math.ceil(query.offset / query.limit),
        pageFix = (~~query.limit === 1) ? 0 : 1,
        totalPages  = Math.floor(result.count / query.limit) + pageFix;
    const prevTo = page => (currentPage > 1) ? Math.min(currentPage - 1, totalPages) : null;
    const nextTo = page => (currentPage < totalPages) ? currentPage + 1 : null;
    return {
        limit: query.limit,
        offset: query.offset,
        _pages: {
            total: totalPages,
            current: currentPage,
            prev: prevTo(currentPage),
            next: nextTo(currentPage)
      }
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
