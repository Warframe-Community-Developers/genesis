'use strict';

const Command = require('../../../models/Command');
const { resolvePool } = require('../../../CommonFunctions');

class ClearPoolPassword extends Command {
  constructor(bot) {
    super(bot, 'promocode.pool.clearpassword', 'glyphs clear password', 'Clear a pool\'s password');
    this.regex = new RegExp(`^${this.call}\\s?(?:--pool\\s(.*))?`, 'i');
    this.usages = [
      {
        description: 'Clear a pool\'s password',
        parameters: ['--pool <pool id>*'],
        delimBefore: ' ',
        delimAfter: ' ',
      },
    ];
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const pool = await resolvePool(message, this.settings);
    if (typeof pool === 'undefined') {
      this.messageManager.reply(message, 'You either manage none or too many pools. Please specify the pool ID.');
      return this.messageManager.statuses.FAILURE;
    }
    await this.settings.clearPoolPassword(pool);
    this.messageManager.reply(message, 'Cleared.');
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = ClearPoolPassword;
