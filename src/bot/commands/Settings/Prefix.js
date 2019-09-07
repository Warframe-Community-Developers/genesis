'use strict';

const Command = require('../../../models/Command');

/**
 * Sets the current guild's custom prefix
 */
class Prefix extends Command {
  constructor(bot) {
    super(bot, 'settings.prefix', 'prefix');
    this.usages = [
      { description: 'Change this channel\'s prefix', parameters: ['prefix (up to 3 characters)'] },
    ];
    this.regex = new RegExp(
      `^${this.call}(?:\\s+(.+))?`,
      'i',
    );
    this.requiresAuth = true;
  }

  async run(message, ctx) {
    const prefix = message.strippedContent.match(this.regex)[1];
    if (!prefix) {
      this.messageManager.embed(message, {
        title: 'Usage',
        type: 'rich',
        color: 0x0000ff,
        fields: [
          {
            name: `${ctx.prefix}${this.call} <prefix>`,
            value: 'Set the channel\'s custom prefix',
          },
        ],
      }, true, false);
      return this.messageManager.statuses.FAILURE;
    }
    if (prefix === 'reset') {
      if (message.channel.type === 'text') {
        await this.settings.setGuildSetting(message.channel.guild, 'prefix', this.bot.prefix);
      } else {
        await this.settings.setChannelSetting(message.channel, 'prefix', this.bot.prefix);
      }
    } else if (message.channel.type === 'text') {
      await this.settings.setGuildSetting(message.channel.guild, 'prefix', prefix);
    } else {
      await this.settings.setChannelSetting(message.channel, 'prefix', prefix);
    }
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Prefix;
