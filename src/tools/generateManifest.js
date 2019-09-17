'use strict';

process.env.SCOPE = 'TASK';

const fs = require('fs');
const path = require('path');
const logger = require('../Logger');
const BaseCommand = require('../models/Command');

const generateManifest = async () => {
  const commandDir = path.join(__dirname, '../bot/commands');
  let files = fs.readdirSync(commandDir);

  const categories = files.filter(f => f.indexOf('.js') === -1);
  files = files.filter(f => f.indexOf('.js') > -1);
  categories.forEach((category) => {
    files = files
      .concat(fs.readdirSync(path.join(commandDir, category))
        .map(f => path.join(category, f)));
  });

  const commands = files
    .map((f) => {
      try {
      // eslint-disable-next-line import/no-dynamic-require, global-require
        const Cmd = require(path.join(commandDir, f));
        if (Cmd.prototype instanceof BaseCommand) {
          const command = new Cmd({ messageManager: {}, settings: {}, path: f });
          if (command.enabled) {
            return command;
          }
        }
        return null;
      } catch (err) {
        logger.error(err);
        return null;
      }
    })
    .filter(c => c !== null)
    .map(c => c.manifest());

  try {
    fs.writeFileSync('commands.json', JSON.stringify(commands), 'utf8');
    logger.info(`Wrote command manifest... ${commands.length} commands in ${categories.length} categories`);
  } catch (e) {
    logger.error(e);
  }
};

if (process.env.RUN_AT_ONCE) {
  generateManifest();
}

module.exports = generateManifest;
