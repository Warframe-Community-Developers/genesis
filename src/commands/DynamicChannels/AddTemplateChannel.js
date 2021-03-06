'use strict';

const Command = require('../../models/Command.js');

const relayRegex = new RegExp('--relay', 'ig');

class AddTemplateChannel extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'dynamicchannels.add', 'templates add', 'Add Template Channel', 'UTIL');
    this.regex = new RegExp(`^${this.call}\\s?(?:(?:<#)?(\\d+)(?:>)?)?(?:\\s+(--relay))?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
    this.usages = [
      {
        description: 'Add a template channel. If `--relay` is specified, it will use relay naming.',
        parameters: ['channel mention', '--relay'],
      },
    ];
  }

  async run(message, ctx) {
    const newTemplateChannelId = message.strippedContent.match(this.regex)[1];
    const isRelay = relayRegex.test(message.strippedContent);
    if (newTemplateChannelId && this.bot.client.channels.cache.has(newTemplateChannelId.trim())) {
      const newTemplateChannel = this.bot.client.channels.cache.get(newTemplateChannelId.trim());
      await this.settings.addTemplate(newTemplateChannel, isRelay);
      this.messageManager.reply(message, ctx.i18n`${newTemplateChannel} added as a template.`, true, true);
      return this.messageManager.statuses.SUCCESS;
    }
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = AddTemplateChannel;
