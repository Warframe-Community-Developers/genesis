'use strict';

const Command = require('../../../models/Command');
const { captures } = require('../../../CommonFunctions');

class SetLFGChannel extends Command {
  constructor(bot) {
    super(bot, 'settings.lfgChannel', 'set lfg channel', 'Sets the LFG Channel.');
    this.usages = [
      { description: 'Set the LFG channel', parameters: ['platform', 'channel id'] },
    ];
    this.regex = new RegExp(`^${this.call}(.*)`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {CommandContext} ctx Context for the command
   * @returns {string} success status
   */
  async run(message, ctx) {
    let matchable = message.strippedContent.replace(this.call, '');

    const plm = matchable.match(new RegExp(captures.platforms, 'i'));
    const platform = (plm[1] || ctx.platform || 'pc').toLowerCase();

    matchable = matchable.replace(platform);

    const chm = matchable.match(new RegExp(captures.channel, 'i'));
    const channel = (chm || [])[1];

    if (channel && this.bot.client.channels.has(channel.trim())) {
      await this.settings.setGuildSetting(message.guild, `lfgChannel${platform !== 'pc' ? `.${platform}` : ''}`, channel);
      this.messageManager.notifySettingsChange(message, true, true);
      return this.messageManager.statuses.SUCCESS;
    }
    await this.settings.deleteGuildSetting(message.guild, `lfgChannel${platform !== 'pc' ? `.${platform}` : ''}`);
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = SetLFGChannel;
