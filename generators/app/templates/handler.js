'use strict';
var Promise = require('bluebird');
var intentMatcher = require('./intent-matcher');
var DataStore = require('./models/DataStore');

var Storage = require('./settings.json');
var packageProperties = require('./package.json');

const APPLICATION_ID = process.env.APPLICATION_ID || Storage[packageProperties['name']].applicationId;

var responseBuilder = (dataStore) => {
    var response = {
        version: "1.0",
        sessionAttributes: JSON.parse(JSON.stringify(dataStore.attributes)),
        response: JSON.parse(JSON.stringify(dataStore.response))
    };
    return response;
}
module.exports.handler = (event, context, callback) => {
    console.log(`Event: [${JSON.stringify(event)}]`);
    var dataStore = new DataStore();
    dataStore.userData = event.session.user;
    dataStore.attributes = event.session.attributes || {};
    try {
        if (event.session.application.applicationId !== APPLICATION_ID) {
            console.log(`Invoking with un-identified application id [Application Id: ${event.session.application.applicationId}]`);
            throw "Invalid application id.";
        }
        if (event.session.new) {
            console.log(`New session started [requestId: ${event.request.requestId}, session: ${event.session.sessionId}]`);
        }
        if (event.request.type === 'LaunchRequest') {
            dataStore.intent = "default.launch";
            dataStore.slots = {};
            intentMatcher(dataStore).then(datastore => callback(null, responseBuilder(datastore)));
        }
        if (event.request.type === 'IntentRequest') {
            dataStore.intent = event.request.intent.name;
            dataStore.slots = event.request.intent.slots;
            intentMatcher(dataStore).then(datastore => callback(null, responseBuilder(datastore)));
        }
        if (event.request.type === 'SessionEndedRequest') {
            dataStore.intent = "default.sessionended";
            dataStore.slots = {};
            intentMatcher(dataStore).then(datastore => callback(null, responseBuilder(datastore)));
        }
    } catch (e) {
        callback(e, null);
    }
};