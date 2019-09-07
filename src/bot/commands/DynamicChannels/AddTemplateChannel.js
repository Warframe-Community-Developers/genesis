'use strict';

const Command = require('../../../models/Command');

const relayRegex = new RegExp('--relay', 'ig');

class AddTemplateChannel extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'dynamicchannels.add', 'templates add', 'Add Template Channel');
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

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const newTemplateChannelId = message.strippedContent.match(this.regex)[1];
    const isRelay = relayRegex.test(message.strippedContent);
    if (newTemplateChannelId && this.bot.client.channels.has(newTemplateChannelId.trim())) {
      const newTemplateChannel = this.bot.client.channels.get(newTemplateChannelId.trim());
      await this.settings.addTemplate(newTemplateChannel, isRelay);
      this.messageManager.reply(message, `${newTemplateChannel} added as a template.`, true, true);
      return this.messageManager.statuses.SUCCESS;
    }
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = AddTemplateChannel;
