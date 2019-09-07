'use strict';

const Command = require('../../../models/Command');
const { resolvePool } = require('../../../CommonFunctions');

class SetPoolPassword extends Command {
  constructor(bot) {
    super(bot, 'promocode.pool.password', 'glyphs set password', 'Set a pool\'s password');
    this.regex = new RegExp(`^${this.call}\\s?(?:--pool\\s?(?:.*))?\\s?(.*)?`, 'i');
    this.usages = [
      {
        description: 'Set a pool\'s password.',
        parameters: ['--pool <pool id>*', '<new pool password>'],
        delimBefore: ' ',
        delimAfter: ' ',
      },
    ];
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const password = message.strippedContent.match(this.regex)[1] || 0;
    const pool = await resolvePool(message, this.settings);
    if (typeof pool === 'undefined') {
      this.messageManager.reply(message, 'You either manage none or too many pools. Please specify the pool ID.');
      return this.messageManager.statuses.FAILURE;
    }
    if (password) {
      await this.settings.setPoolPassword(pool, password);
      return this.messageManager.statuses.SUCCESS;
    }
    await this.messageManager.reply(message, 'Please specify a password.');
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = SetPoolPassword;
