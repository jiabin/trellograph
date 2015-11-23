'use strict';

// module dependencies
var convict = require('convict');
var dotenv = require('dotenv');
var path = require('path');

// load dotenv
dotenv.load({
  silent: true,
  path: path.join(__dirname, '.env')
});

// initialize convict
var config = convict({
  env: {
    doc: 'The applicaton environment',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV'
  },
  key: {
    doc: 'Trello developer api key',
    format: String,
    default: null,
    env: 'API_KEY'
  },
  home: {
    doc: 'User home directory',
    format: String,
    default: process.env.HOME || process.env.USERPROFILE,
  }
});

// perform validation
config.validate({ strict: true });

// move on
module.exports = config;
