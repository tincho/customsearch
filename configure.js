var readlineSync = require('readline-sync');
var Sequelize    = require('sequelize');
var _            = Sequelize.Utils._;
var fs           = require('fs');

var config = {
    db_driver: "mysql"
};

Object.assign(config, promptBasicAuth());

var sequelize = new Sequelize(config.db_name, config.db_user, config.db_password, {
  host: config.db_host,
  dialect: config.db_driver
});

sequelize.showAllSchemas().then(
    _.flow(
        _.method('map', _.flow(_.values, _.first)),
        promptTable,
        _.partial(_.assign, config),
        _.flow(
            _.partial(_.get, _, "db_table"),
            sequelize.define.bind(sequelize),
            getColumns
        )
    )
);

function promptBasicAuth() {
    console.log('Please provide DB connection data. Only MySQL supported by now \n');

    var questions = {
        "db_name"     : { label: "DB name: " },
        "db_host"     : { label: "Host (empty: $<defaultInput>): ", options: { defaultInput: "localhost" } },
        "db_user"     : { label: "Username: " },
        "db_password" : { label: "Password: ", options: { hideEchoBack: true } }
    };
    var answers = {};

    Object.keys(questions).forEach(function(key) {
        answers[key] = readlineSync.question(questions[key].label, questions[key].options || undefined);
    });

    return answers;
};

function promptTable(tables) {
    return {
        db_table: tables[readlineSync.keyInSelect(tables, 'Table: ')]
    };
};

function getColumns(Model) {
    Model.describe().then(
        _.flow(
            Object.keys,
            promptFields,
            _.partial(_.assign, config),
            writeConfig
        )
    );
}

function promptFields(fields) {
    console.log('Columns are: ' + fields.join(', '));
    var searchFields = readlineSync.question('Columns to search in (separated by "," or leave empty for all): ', { defaultInput: '*' });
    var displayFields = readlineSync.question('Columns to return (separated by "," or leave empty for all): ', { defaultInput: '*' });
    return {
        search_fields: (searchFields  !== '*') ?  searchFields.replace(' ', '').split(',') : searchFields,
        display_fields: (displayFields !== '*') ? displayFields.replace(' ', '').split(',') : displayFields,
    };
}

function writeConfig(config) {
    fs.writeFile("config.json.generated", JSON.stringify(config), function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("Config saved in config.json.generated");
    });
}
