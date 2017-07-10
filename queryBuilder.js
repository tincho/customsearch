module.exports = QueryBuilder;

/**
 * Sequelize Query object Builder
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

/**
 * wraps string with given chars if not already wrapped
 */
String.prototype.wrap = function(begin, end) {
    end = end || begin;
    return begin + this + end;
};
