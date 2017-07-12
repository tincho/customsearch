console.log("---------------------------");
console.log("Configuring customsearch");
console.log("---------------------------");

var readlineSync = require('readline-sync');
var Sequelize    = require('sequelize');
var _            = Sequelize.Utils._;
var writeFile    = require('fs').writeFile;

var config = {
    db_driver: "mysql" // @TODO support others !
};
const assignToConfig = data => _.assign(config, data);

var outputFile = "config.json.generated";
const writeStringToFile = str => writeFile(outputFile, str, err => {
  var message = err
    ? err
    : `Config saved to ${outputFile}. Rename to config.json to use this setup`;
  console.log(message);
});


assignToConfig(promptConnInfo());

var sequelize = new Sequelize(config.db_name, config.db_user, config.db_password, {
  host: config.db_host,
  dialect: config.db_driver
});

sequelize.showAllSchemas().then(schemas => {
  // all first values are the table names:
  var tables = schemas.map(schema =>  _.first(_.values(schema)));
  assignToConfig(promptTable(tables));
  // config.db_table was set in the previous statement
  sequelize.define(config.db_table).describe().then(table => {
    var fields = Object.keys(table);
    assignToConfig(promptFields(fields));
    writeStringToFile(JSON.stringify(config));
  })
});

function promptConnInfo() {
    console.log('Please provide DB connection data. Only MySQL supported by now \n');
    var questions = {
        "db_host"     : { label: "Host (empty: $<defaultInput>): ", options: { defaultInput: "localhost" } },
        "db_user"     : { label: "Username: " },
        "db_password" : { label: "Password: ", options: { hideEchoBack: true } },
        "db_name"     : { label: "DB name: " }
    };
    return  _.reduce(questions, function(answers, question, key) {
        answers[key] = readlineSync.question(question.label, question.options || undefined);
        return answers;
    }, {});
};

function promptTable(tables) {
    return {
        db_table: tables[readlineSync.keyInSelect(tables, 'Table: ')]
    };
};

function promptFields(fields) {
    var selectedFields = f => (f !== '*') ? f.replace(' ', '').split(',') : f;
    console.log("---------------------------");
    console.log('Columns are: ' + fields.join(', '));
    console.log("---------------------------");
    var searchFields  = readlineSync.question('Columns to search in (separated by "," or leave empty for all): ', { defaultInput: '*' });
    console.log("---------------------------");
    var displayFields = readlineSync.question('Columns to return (separated by "," or leave empty for all): ', { defaultInput: '*' });
    var configFields = {
        search_fields:  selectedFields(searchFields),
        display_fields: selectedFields(displayFields)
    };

    console.log("---------------------------");
    console.log("Pick default ORDER column or cancel to finish.");
    var orderFieldKey = readlineSync.keyInSelect(fields, 'Default ORDER BY column? (cancel for no default order) ');
    if (orderFieldKey === -1 || typeof fields[orderFieldKey] === 'undefined') {
      return configFields;
    }
    var direction = readlineSync.question('Direction?: ASC/DESC (defaults to ASC) ', { defaultInput: 'ASC' });
    configFields.default_order = fields[orderFieldKey] + " " + direction;
    return configFields;
}
