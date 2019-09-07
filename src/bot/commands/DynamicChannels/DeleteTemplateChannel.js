'use strict';

const Command = require('../../../models/Command');

class DeleteTemplateChannel extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'dynamicchannels.delete', 'templates delete', 'Delete Template Channel');
    this.regex = new RegExp(`^${this.call}\\s?(?:(?:<#)?(\\d+)(?:>)?)?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
    this.usages = [
      {
        description: 'Remove a template channel',
        parameters: ['channel mention'],
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
    const templateId = message.strippedContent.match(this.regex)[1];
    if (templateId && this.bot.client.channels.has(templateId.trim())) {
      const template = this.bot.client.channels.get(templateId.trim());
      await this.settings.deleteTemplate(template);
      this.messageManager.reply(message, `${template} removed as a template.`, true, true);
      return this.messageManager.statuses.SUCCESS;
    }
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = DeleteTemplateChannel;
