'use strict';

const Command = require('../../../models/Command');
const { resolvePool } = require('../../../CommonFunctions');

class AddManager extends Command {
  constructor(bot) {
    super(bot, 'promocode.managers.add', 'glyphs add manager', 'Add a manager to a glyph pool');
    this.regex = new RegExp(`^${this.call}\\s?(?:--pool\\s?(.*))?([0-9]{0,20})?`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
    this.usages = [
      {
        description: 'Add a manager to a glyph pool',
        parameters: ['--pool <pool id>*', '<user mention or id>'],
        delimBefore: ' ',
        delimAfter: ' ',
      },
    ];
  }

  async run(message) {
    const user = message.strippedContent.match(/[0-9]{15,20}/i)[0] || 0;
    const pool = await resolvePool(message, this.settings);
    if (typeof pool === 'undefined') {
      this.messageManager.reply(message, 'You either manage none or too many pools. Please specify the pool ID.');
      return this.messageManager.statuses.FAILURE;
    }
    if (this.bot.client.users.has(user.trim())) {
      await this.settings.addPoolManager(pool, user.trim());
      return this.messageManager.statuses.SUCCESS;
    }
    await this.messageManager.reply(message, 'Please specify a valid user ID or mention the user.');
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = AddManager;
