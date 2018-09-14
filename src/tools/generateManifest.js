'use strict';

const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');

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
      if (Object.prototype.toString.call(Cmd) === '[object Function]') {
        const command = new Cmd({
          md: {}, messageManager: {}, settings: {}, path: f,
        });

        return command;
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
    // eslint-disable-next-line no-console
    console.log(colors.cyan('Wrote command manifest...'));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
};

module.exports = generateManifest;
