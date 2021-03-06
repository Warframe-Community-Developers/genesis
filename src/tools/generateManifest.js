'use strict';

const fs = require('fs');
const path = require('path');
const BaseCommand = require('../models/Command');
const { games } = require('../CommonFunctions');
const logger = require('../Logger');

const generateManifest = async () => {
  const commandDir = path.join(__dirname, '../commands');
  let files = fs.readdirSync(commandDir);

  const categories = files.filter(f => f.indexOf('.js') === -1);
  files = files.filter(f => f.indexOf('.js') > -1);
  try {
    categories.forEach((category) => {
      files = files.concat(fs.readdirSync(path.join(commandDir, category))
        .map(f => path.join(category, f)));
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return;
  }

  const commands = files.map((f) => {
    try {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const Cmd = require(path.join(commandDir, f));
      if (Cmd.prototype instanceof BaseCommand) {
        const command = new Cmd({ messageManager: {}, settings: {}, path: f });
        if (command.enabled && games.includes(command.game)) {
          return command;
        }
      }
      return null;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      return null;
    }
  })
    .filter(c => c !== null).map(c => c.manifest());

  try {
    fs.writeFileSync('commands.json', JSON.stringify(commands), 'utf8');
    logger.info('Wrote command manifest...');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
};

module.exports = generateManifest;
