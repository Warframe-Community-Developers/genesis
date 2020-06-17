'use strict';

const { MessageEmbed } = require('discord.js');

const defaults = {
  url: process.env.EMBED_URL || 'https://warframestat.us',
  icon: process.env.EMBED_ICON_URL || 'https://warframestat.us/wfcd_logo_color.png',
};

/**
 * Utility class for making rich embeds
 */
class BaseEmbed extends MessageEmbed {
  constructor(bot) {
    super({
      url: defaults.url,
      footer: {
        text: 'Sent',
        icon_url: defaults.icon,
      },
      timestamp: new Date(),
      thumbnail: {
        url: undefined,
      },
    });
    if (bot) {
      this.bot = bot;
    }
  }
}

module.exports = BaseEmbed;
