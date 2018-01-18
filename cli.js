#!/usr/bin/env node

var yeoman = require('yeoman-environment');
var env = yeoman.createEnv();
var program = require('commander');

program
    .version('0.1.0')
    .parse(process.argv);

var arguments = "";
program.args.forEach(argument => {
    arguments += ` ${argument}`;
});

env.register(require.resolve('./generators/app/index.js'), 'nodlex');
env.run(`nodlex${arguments}`);