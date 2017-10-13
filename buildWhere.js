'use strict';
module.exports = BuildWhere;

/**
* BuildWhere
* @param {Array} fields
* @param {String} matchType
* 'any' match any of the specified words. DEFAULT OPTION
* 'all' : match each and every word but may be separate
* 'full' : match the whole term without splitting words
* @param {Array} terms
* @return {Object} compatible with Sequelize's Model.findAll or Model.findAndCountAll
*/
function BuildWhere(fields, matchType, terms) {
    var matchStrategies = {
        'any': defaultConditions,
        'full': defaultConditions,
        'all': allInAnyFields
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

    function allInAnyFields() {
        return {
            '$and': terms.map(term => ({
                '$or': fields.map(field => ({
                    [field]: {'$like': term.wrap('%')}
                }) )
            }) )
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
