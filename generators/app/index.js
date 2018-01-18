var Generator = require('yeoman-generator');
const path = require('path');
const chalk = require('chalk');
var isInvalid = require('is-invalid-path');
var jsonfile = require('jsonfile');
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
        let action = this.options.action;
        switch (action.toLowerCase()) {
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
                    // jsonfile.writeFileSync(path.join(this.projectPath, nodlexFile), { version: packageProperties.version, description: "Alexa nodejs project created via Nodlex" })
                    this.fs.copyTpl(this.templatePath('package.json'), path.join(this.projectPath, 'package.json'), { appName: this.projectName });
                    done();
                });
                break;
            case "addintent":
                this.log(chalk.cyan("Adding a new intent"));
                this.projectPath = this.destinationRoot();
                if (!this.fs.readJSON(path.join(this.projectPath, nodlexFile)))
                    throw new Error("Your current directory is not a Nodlex project directory, please run this command from Nodlex project directory.");

                if (isInvalid(this.options.actionDescription) || this.options.actionDescription.match(/^[A-z]+$/).len === 0)
                    throw new Error('This intent name is not valid')

                if (!this.options.actionDescription)
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

                        done();
                    });
                this.log("Adding  a new intent")
                break;
            default:

        }
    }
    install() {
        this.log("Installing dependencies...");
        this.spawnCommandSync('npm', ['--prefix', `./${this.projectName}`, 'install', `./${this.projectName}`]);
    }
};