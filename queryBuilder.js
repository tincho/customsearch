module.exports = QueryBuilder;

/**
 * Sequelize Query object Builder
 * @param {Object} query comes from Expres's BodyParser I think
 * @TODO someday support expressions as NOT:term or term{n-times}
 * @see 'defaults' below for query object keys
 * @param {Object} fields . @keys:
    toSelect {Array} (configured as display_fields) columns to be selected and returned
    toMatch {Array} (configured as search_fields) columns to match against term(s)
 * @return {Object} for sequelize Model.findAll
 * @TODO additional fixed conditions? from config?
 */
function QueryBuilder(query, fields) {
    var queryDefaults = {
        q: undefined, // the search term(s)
        type: 'any',
        // 'any' match any of the specified words. DEFAULT OPTION
        // 'all' : match each and every word but may be separate
        // 'full' : match the whole term without splitting words
        limit: 20,
        offset: 0
    };
    var data = Object.assign(queryDefaults, query);

    var terms = (data.type === 'full') ? [data.q] : data.q.replace(/\s+/g, ' ').split(' ');
    var conditionType = (data.type === 'all') ? '$and' : '$or';
    var orderBy = data.order || fields.orderBy || undefined;

    // @TODO utf8 encode ? solve that!
    var likeStatements = terms.map(term => ({'$like': term.wrap('%')}));
    var conditions = fields.toMatch.map(field => ({
        [field]: {
            [conditionType]: likeStatements
        }
    }));

    return {
        attributes: fields.toSelect,
        where: {
            '$or': conditions
        },
        raw: true,
        limit: parseInt(data.limit, 10),
        offset: parseInt(data.offset, 10),
        order: orderBy
    };
}

/**
 * wraps string with given chars if not already wrapped
 */
String.prototype.wrap = function(begin, end) {
    end = end || begin;
    return begin + this + end;
};
