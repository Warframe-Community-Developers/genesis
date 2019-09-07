'use strict';

const Command = require('../../../models/Command');

class DeleteCustomCommand extends Command {
  constructor(bot) {
    super(bot, 'customcommands.delete', 'delete cc');
    this.usages = [
      { description: 'Delete a custom command', parameters: ['command call'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s+(\\w+)?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const params = message.strippedContent.match(this.regex);
    if (!params[1]) {
      this.messageManager.embed(message, {
        title: 'Delete Custom Command',
        fields: [{ name: '\u200B', value: `**${this.call}**\n**command call**: command trigger to delete` }],
      }, true, false);
      return this.messageManager.statuses.FAILURE;
    }
    await this.settings.deleteCustomCommand(message, params[1]);
    await this.commandManager.loadCustomCommands();
    await this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = DeleteCustomCommand;
