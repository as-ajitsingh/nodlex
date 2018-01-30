# Nodlex

Nodlex is a CLI tool that can generate boilerplate code for Alexa Skill Developement. Nodlex generate code on the boilerplate based on the repository [alexa-nodejs-boilerplate](https://github.com/as-ajitsingh/alexa-nodejs-boilerplate.git). Nodlex also provides functionality to **Add Intent** from CLI itself. So no overhead of writing basic code everytime you add a new intent to your skill. 

## Installation
  
 To use Nodlex you must have [**nodejs**](https://nodejs.org/) and [**npm**](https://nodejs.org/) preinstalled in your system. To install Nodlex globally use 

    npm install -g nodlex

This will install Nodlex globally so that it can be used from anywhere in the system.

## How to use

 - To create a new nodlex project, type in console  

    nodlex create \<your alexa project name\>

 - To add a new intent into already existing nodlex project

    nodlex addintent \<your intent name\>

## License

Apache 2.0