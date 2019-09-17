'use strict';

const path = require('path');
const logger = require('../Logger');
const Notifier = require('./Notifier');

require('dotenv').config({ path: path.resolve(process.cwd(), '../../.env.notifier') });

const notifier = new Notifier(this);
notifier.start().catch(logger.error);

// eslint-disable-next-line
// console.error('Notifier not yet implemented');
// process.exit(0);
