'use strict';

const Command = require('../../../models/Command');
const VoidTraderEmbed = require('../../../embeds/VoidTraderEmbed.js');
const { captures, createGroupedArray, setupPages } = require('../../../CommonFunctions');

/**
 * Displays the currently active Invasions
 */
class Baro extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.baro', 'baro', 'Display the current status of the Void Trader');
    this.regex = new RegExp(`^${this.call}(?:\\s+on\\s+${captures.platforms})?`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || ctx.platform;
    const pages = [];
    const embed = new VoidTraderEmbed(this.bot, await this.ws.get('voidTrader', platform, ctx.language), platform);
    if (embed.fields.length > 25) {
      createGroupedArray(embed.fields, 15).forEach((fieldGroup) => {
        this.logger.debug(fieldGroup);
        const tembed = Object.assign({}, embed);
        tembed.fields = fieldGroup;
        pages.push(tembed);
      });
    } else {
      pages.push(embed);
    }
    await setupPages(pages, { message, settings: this.settings, mm: this.messageManager });
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Baro;
