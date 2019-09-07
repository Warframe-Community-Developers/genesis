'use strict';

const Command = require('../../../models/Command');

/**
 * Sets the avatar for the bot
 */
class DeleteWebhook extends Command {
  /**
   * Constructs a callable command
   * @param {Bot} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.webhooks.delete', 'delete webhook in', 'Delete webhook in a provided channel');
    this.ownerOnly = true;
    this.regex = new RegExp(`^${this.call}\\s*(.*)?`, 'i');
    this.usages = [
      {
        description: 'Delete the webhook for a given channel id',
        parameters: ['channel id'],
      },
    ];
  }

  async run(message) {
    const channelId = message.strippedContent.match(this.regex)[1];
    try {
      await this.settings.deleteWebhooksForChannel(channelId.trim());
      this.messageManager.reply(message, 'Done. ', true, true);
      return this.messageManager.statuses.SUCCESS;
    } catch (e) {
      this.logger.error(e);
      return this.messageManager.statuses.FAILURE;
    }
  }
}

module.exports = DeleteWebhook;
