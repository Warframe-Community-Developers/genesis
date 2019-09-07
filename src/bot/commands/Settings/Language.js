'use strict';

const Command = require('../../../models/Command');
const { getChannel, captures } = require('../../../CommonFunctions');

const languages = require('../../../assets/locales').map(lang => lang.toLowerCase());

class Language extends Command {
  constructor(bot) {
    super(bot, 'settings.language', 'language');
    this.usages = [
      { description: 'Change this channel\'s language', parameters: ['language'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?(${languages.join('|')})?(?:\\s+in\\s+(${captures.channel}|here))?$`, 'i');
    this.requiresAuth = true;
  }

  async run(message) {
    const language = message.strippedContent.match(this.regex)[1];
    if (!language || !languages.includes(language.toLowerCase())) {
      const embed = {
        title: 'Usage',
        type: 'rich',
        color: 0x0000ff,
        fields: [
          {
            name: `${this.bot.prefix}${this.call} <language>`,
            value: `Language is one of ${languages.join(', ')}`,
          },
        ],
      };
      this.messageManager.embed(message, embed, true, true);
      return this.messageManager.statuses.FAILURE;
    }
    const channelParam = message.strippedContent.match(this.regex)[2] ? message.strippedContent.match(this.regex)[2].trim().replace(/<|>|#/ig, '') : undefined;
    let m = '';
    languages.forEach((lang) => {
      if (language.toLowerCase() === lang.toLowerCase()) {
        m = lang;
      }
    });
    const channel = getChannel(channelParam, message);
    await this.settings.setChannelSetting(channel, 'language', m || language.toLowerCase());
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Language;
