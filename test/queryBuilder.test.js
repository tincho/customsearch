// improvised test harness
const output = console.log.bind(console);
const assert = (exp) => {
  if(!exp) { throw new Error("Assert failed") }
};
const justDoIt = (name, fn) => {
  output("***** " + name + ": *****");
  try {
    fn();
    output(" - OK");
  } catch (e) {
    output(" - " + e.message);
  }
}
const it = justDoIt;
const describe = justDoIt;

const QueryBuilder = require("../queryBuilder");
describe("build queries for Sequelize Model.find/findAndCountAll", () => {

  it("should build query for search type: ANY ", () => {
    let query = QueryBuilder({
      q: "A B C",
      type: "any"
    }, {
      toMatch: ["p", "q", "r"],
      toSelect: ["p", "q", "r"]
    });

    assert(Object.keys(query.where) === ["$or"]);
    assert(query.where["$or"].length === 3);
    assert(query.where["$or"] === []);

  });

  it("should build query for search type: ALL ", () => {
    let query = QueryBuilder({
      q: "A B C",
      type: "any"
    }, {
      toMatch: ["p", "q", "r"],
      toSelect: ["p", "q", "r"]
    });

    assert(Object.keys(query.where) == ["$and"]);

    assert(Object.keys(query.where["and"][0])[0] === '$or');
    assert(Object.keys(query.where["and"][1])[0] === '$or');
    assert(Object.keys(query.where["and"][2])[0] === '$or');

    assert(query.where["and"][0]["$or"].length === 3);
    assert(query.where["and"][1]["$or"].length === 3);
    assert(query.where["and"][2]["$or"].length === 3);

  });

  it("should build query for search type: FULL ", () => {
    let query = QueryBuilder({
      q: "A B C",
      type: "any"
    }, {
      toMatch: ["p", "q", "r"],
      toSelect: ["p", "q", "r"]
    });

    assert(Object.keys(query.where)[0] === "$or");
  });

});
