console.log("---------------------------");
console.log("Configuring customsearch");
console.log("---------------------------");

var readlineSync = require('readline-sync');
var Sequelize    = require('sequelize');
var _            = Sequelize.Utils._; // give thanks and praises, hail to the _!
var writeFile    = require('fs').writeFile;

var outputFile = "config.json.generated";
var writeFileCallback = err => err ? console.log(err) :
    console.log(`Config saved to ${outputFile}. Rename to config.json to use this setup`);
var writeStringToFile = _.partial(writeFile, outputFile, _, writeFileCallback);

var config = {
    db_driver: "mysql"
};
var assignToConfig = _.partial(_.assign, config);

assignToConfig(promptBasicAuth());

var sequelize = new Sequelize(config.db_name, config.db_user, config.db_password, {
  host: config.db_host,
  dialect: config.db_driver
});

sequelize.showAllSchemas().then(
    _.flow(
        // all first values are the table names:
        _.method('map', _.flow(_.values, _.first)),
        promptTable,
        // once i get the answer set it to global var config
        assignToConfig,
        // and get it from there (config)
        _.property("db_table"),
        // to run sequelize.define(config.db_table)
        _.bind(sequelize.define, sequelize),
        // and get its columns
        _.method('describe'),
        // which returns a promise so we call promise.then( fn )
        _.method('then',
            _.flow(
                // promise result is an object whose keys are the fields array
                Object.keys,
                // print them and ask to select search and display fields
                promptFields,
                assignToConfig,
                // finally save it stringified in outputFile
                JSON.stringify,
                writeStringToFile
            )
        )
    )
);

function promptBasicAuth() {
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
    console.log("---------------------------");
    console.log('Columns are: ' + fields.join(', '));
    console.log("---------------------------");
    var searchFields  = readlineSync.question('Columns to search in (separated by "," or leave empty for all): ', { defaultInput: '*' });
    console.log("---------------------------");
    var displayFields = readlineSync.question('Columns to return (separated by "," or leave empty for all): ', { defaultInput: '*' });
    console.log("---------------------------");
    return {
        search_fields:  (searchFields  !== '*') ?  searchFields.replace(' ', '').split(',') : searchFields,
        display_fields: (displayFields !== '*') ? displayFields.replace(' ', '').split(',') : displayFields,
    };
}
