'use strict';

const Command = require('../../../models/Command');
const InvasionEmbed = require('../../../embeds/InvasionEmbed.js');
const { setupPages, captures } = require('../../../CommonFunctions');

/**
 * Displays the currently active Invasions
 */
class Invasions extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.invasions', 'invasion', 'Display the currently active Invasions');
    this.regex = new RegExp(`^${this.call}s?(?:\\s?(compact))?(?:\\s+on\\s+${captures.platforms})?$`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(/[pcsxb14]{2,3}/ig);
    const compact = /compact/ig.test(message.strippedContent);
    const platform = platformParam && platformParam.length ? platformParam[0] : ctx.platform;
    const invasions = (await this.ws.get('invasions', platform, ctx.language)).filter(i => !i.completed);
    const pages = [];
    if (compact) {
      pages.push(new InvasionEmbed(this.bot, invasions, platform, ctx.i18n));
    } else {
      invasions.forEach((invasion) => {
        pages.push(new InvasionEmbed(this.bot, [invasion], platform, ctx.i18n));
      });
    }
    await setupPages(pages, { message, settings: this.settings, mm: this.messageManager });
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Invasions;
