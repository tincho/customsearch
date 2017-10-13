'use strict';
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

const BuildWhere = require("../buildWhere");
describe("build WHERE statement objects for Sequelize Model.find/findAndCountAll", () => {

  it("should build query for search type: ANY ", () => {
    let where = BuildWhere(["p", "q", "r"], "any", ["A", "B", "C"]);

    assert(Object.keys(where)[0] === "$or");
    assert(where["$or"].length === 3);
  });

  it("should build query for search type: ALL ", () => {
    let where = BuildWhere(["p", "q", "r"], "all", ["A", "B", "C"]);

    assert(Object.keys(where)[0] == "$and");

    assert(Object.keys(where["$and"][0])[0] === '$or');
    assert(Object.keys(where["$and"][1])[0] === '$or');
    assert(Object.keys(where["$and"][2])[0] === '$or');

    assert(where["$and"][0]["$or"].length === 3);
    assert(where["$and"][1]["$or"].length === 3);
    assert(where["$and"][2]["$or"].length === 3);

  });

  it("should build query for search type: FULL ", () => {
    let where = BuildWhere(["p", "q", "r"], "full", ["A B C"]);
    assert(Object.keys(where)[0] === "$or");
  });

});
