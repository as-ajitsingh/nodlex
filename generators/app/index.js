var Generator = require('yeoman-generator');
const path = require('path');
const chalk = require('chalk');
var isInvalid = require('is-invalid-path');
var jsonfile = require('jsonfile');

var esprima = require('esprima');
var fs = require('fs');
var escodegen = require('escodegen');


var packageProperties = require('../../package.json');



var nodlexFile = './.nodlex';

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);
        this.argument('action', { type: String });
        this.argument('actionDescription', { type: String, required: false });
    }
    intro() {
        let logo = chalk.green(`
        +-Welcome to-------------------------------------------------------------------------+
        | ____  _____     ___     ______     ________    _____      ________   ____  ____    |
        | |_   \\|_   _|  .'   \`.  |_   _ \`.  |_   __  |  |_   _|    |_   __  | |_  _||_  _|  |
        |   |   \\ | |   /  .-.  \\   | | \`. \\   | |_ \\_|    | |        | |_ \\_|   \\ \\  / /    |
        |   | |\\ \\| |   | |   | |   | |  | |   |  _| _     | |   _    |  _| _     > \`' <     |
        |  _| |_\\   |_  \\  \`-'  /  _| |_.' /  _| |__/ |   _| |__/ |  _| |__/ |  _/ /'\`\\ \\_   |
        | |_____|\\____|  \`.___.'  |______.'  |________|  |________| |________| |____||____|  |
        |                                                                                    |
        +-----------------------------------------------------------------By Ajit Singh------+`);
        this.log(logo);
        this.log(); // intentionally left blank for new line
    }
    init() {
        var done = this.async();
        this.useraction = this.options.action;
        switch (this.useraction.toLowerCase()) {
            case "create":
                this.log(chalk.cyan("Creating a new project"));
                this.prompt([{
                        type: 'input',
                        name: 'projectName',
                        message: 'Your Alexa nodejs project name',
                        default: this.options.actionDescription,
                        validate: (dirName) => {
                            if (isInvalid(dirName) || dirName.indexOf(' ') != -1) return 'This directory name is not valid';
                            else return true;
                        }

                    },
                    {
                        type: 'input',
                        name: 'applicationId',
                        message: 'Please provide Skill Application Id (If you don\'t have application id now, later you can add it to settings.json file)',
                    }
                ]).then(answers => {
                    this.projectName = answers.projectName;
                    this.projectPath = path.join(this.destinationRoot(), this.projectName);
                    /* Defining config description  */
                    this.config.name = this.projectName;
                    this.config.path = path.join(this.projectPath, 'settings.json');

                    this.config.set('applicationId', answers.applicationId);
                    this.fs.copy(this.templatePath('**'), this.projectPath)
                    this.fs.writeJSON(path.join(this.projectPath, nodlexFile), { version: packageProperties.version, description: "Alexa nodejs project created via Nodlex" });
                    this.fs.copyTpl(this.templatePath('package.json'), path.join(this.projectPath, 'package.json'), { appName: this.projectName });
                    this.log("Installing dependencies...");
                    done();
                });
                break;
            case "addintent":

                this.log(chalk.cyan("Adding a new intent"));
                this.projectPath = this.destinationRoot();
                if (!this.fs.readJSON(path.join(this.projectPath, nodlexFile)))
                    throw new Error("Your current directory is not a Nodlex project directory, please run this command from Nodlex project directory.");
                if ((isInvalid(this.options.actionDescription) || this.options.actionDescription.match(/^[A-z]+$/).len === 0) && (this.options.actionDescription))
                    throw new Error('This intent name is not valid')

                this.prompt([{
                    type: 'input',
                    name: 'intentName',
                    message: 'Name of the intent, you want to add',
                    default: this.options.actionDescription,
                    validate: (intentName) => {
                        if (isInvalid(intentName) || intentName.match(/^[A-z]+$/).len === 0) return 'This intent name is not valid';
                        else return true;
                    }
                }]).then(answers => {
                    let customIntentName = answers.intentName;
                    var switchCaseObject = {
                        type: "SwitchCase",
                        test: {
                            type: "Literal",
                            value: customIntentName,
                            raw: "\"customIntentName\""
                        },
                        consequent: [{
                            type: "ReturnStatement",
                            argument: {
                                type: "CallExpression",
                                callee: {
                                    type: "Identifier",
                                    name: customIntentName
                                },
                                arguments: [{
                                    type: "Identifier",
                                    name: "dataStore"
                                }]
                            }
                        }]
                    };

                    var methodObject = {
                        type: "VariableDeclaration",
                        declarations: [{
                            type: "VariableDeclarator",
                            id: {
                                type: "Identifier",
                                name: customIntentName
                            },
                            init: {
                                type: "FunctionExpression",
                                id: null,
                                params: [{
                                    type: "Identifier",
                                    name: "dataStore"
                                }],
                                body: {
                                    type: "BlockStatement",
                                    body: []
                                },
                                generator: false,
                                expression: false,
                                async: false
                            }
                        }],
                        kind: "var"
                    };
                    let projectPath = this.projectPath;
                    let project = this;
                    fs.readFile(path.join(projectPath, "intent-matcher.js"), 'utf8', function read(err, data) {
                        let program = data;
                        let syntaxTree = esprima.parseModule(program, { attachComment: true });
                        if (syntaxTree.type !== "Program")
                            throw new Error("Not a valid file: intent-matcher.js");
                        syntaxTree.body.forEach(object => {
                            if (object.type === "VariableDeclaration") {
                                object.declarations.forEach(object01 => {
                                    if (object01.id.name === "intentMatcher") {
                                        object01.init.body.body.forEach(object02 => {
                                            if (object02.type === "SwitchStatement") {
                                                object02.cases.splice((object02.cases.length - 1), 0, switchCaseObject);
                                            } else {
                                                throw new Error(`Switch Statement not found`);
                                            }
                                        });
                                    }
                                });
                            }
                            if (object.trailingComments) {
                                delete object.trailingComments;
                            }
                        });
                        syntaxTree.body.splice((syntaxTree.body.length - 1), 0, methodObject);
                        fs.writeFileSync(path.join(projectPath, "intent-matcher.js"), escodegen.generate(syntaxTree, { comment: true }));
                        project.log("Intent added successfully.");
                        done();
                    });
                });
                break;
            default:
        }
    }
    install() {
        if (this.useraction === 'create')
            this.spawnCommandSync('npm', ['--prefix', `./${this.projectName}`, 'install', `./${this.projectName}`]);
    }
};