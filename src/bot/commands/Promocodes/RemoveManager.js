'use strict';

const Command = require('../../../models/Command');
const { resolvePool } = require('../../../CommonFunctions');

class RemoveManager extends Command {
  constructor(bot) {
    super(bot, 'promocode.managers.remove', 'glyphs del manager', 'Remove a manager from a glyph pool');
    this.regex = new RegExp(`^${this.call}\\s?(?:--pool\\s?(.*))?\\s?(?:<@([0-9]{15,20})>)?`, 'i');
    this.usages = [
      {
        description: 'Remove a manager from a code pool',
        parameters: ['--pool <pool id>*', '<user mention or id>'],
        delimBefore: ' ',
        delimAfter: ' ',
      },
    ];
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const user = message.strippedContent.match(/[0-9]{15,20}/i)[0] || 0;
    const pool = await resolvePool(message, this.settings);
    if (user === message.author.id) {
      this.messageManager.reply(message, 'Tenno, you can\'t remove yourself!');
      return this.messageManager.statuses.FAILURE;
    }

    if (typeof pool === 'undefined') {
      this.messageManager.reply(message, 'You either manage none or too many pools. Please specify the pool ID.');
      return this.messageManager.statuses.FAILURE;
    }
    if (this.bot.client.users.has(user.trim())) {
      await this.settings.removePoolManager(pool, user.trim());
      return this.messageManager.statuses.SUCCESS;
    }
    await this.messageManager.reply(message, 'Please specify a valid user ID or mention the user.');
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = RemoveManager;
