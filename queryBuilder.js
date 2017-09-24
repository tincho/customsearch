'use strict';
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
    var orderBy = data.order || fields.orderBy || undefined;

    return {
        attributes: fields.toSelect,
        where: Conditions(terms, fields.toMatch, data.type),
        raw: true,
        limit: parseInt(data.limit, 10),
        offset: parseInt(data.offset, 10),
        order: orderBy
    };
}

function Conditions(terms, fields, matchType) {
    var matchStrategies = {
        'any': defaultConditions,
        'full': defaultConditions,
        'all': function allInAnyFields() {
            return {
                '$and': terms.map(term => ({
                    '$or': fields.map(field => ({
                        [field]: {'$like': term.wrap('%')}
                    }) )
                }) )
            }
        }
        // 'all' used to be like this: (see https://github.com/tincho/customsearch/issues/5)
        // function allInSameField() {
        //  return defaultConditions('$and');
        // }
    }

    return matchStrategies[matchType]();

    function defaultConditions(conditionType) {
        conditionType = conditionType || '$or';
        return {
            '$or' : fields.map(field => ({
                [field]: { [conditionType]: terms.map(term => ({'$like': term.wrap('%')})) }
            }))
        }
    }

}

/**
 * wraps string with given chars if not already wrapped
 */
String.prototype.wrap = function(begin, end) {
    end = end || begin;
    return begin + this + end;
};
