'use strict';

const Command = require('../../../models/Command');
const FissureEmbed = require('../../../embeds/FissureEmbed.js');
const { setupPages, captures } = require('../../../CommonFunctions');

/**
 * Displays the currently active Invasions
 */
class Fissures extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.fissures', 'fissure', 'Get the current list of Void Fissure Missions');
    this.regex = new RegExp(`^${this.call}s?(?:\\s?(compact))?(?:\\s+on\\s+${captures.platforms})?$`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(new RegExp(`(?:on\\s?${captures.platforms})`, 'ig'));
    const compact = /compact/ig.test(message.strippedContent);
    const platform = platformParam && platformParam.length ? platformParam[0].replace('on ', '') : ctx.platform;
    const fissures = (await this.ws.get('fissures', platform, ctx.language)).sort((a, b) => a.tierNum > b.tierNum);

    if (!fissures.length) {
      this.messageManager.reply(message, ctx.i18n`No Fissures Active`, true, true);
    }

    const pages = [];
    if (compact) {
      pages.push(new FissureEmbed(this.bot, fissures, platform, ctx.i18n));
    } else {
      const eras = {
        lith: [],
        meso: [],
        neo: [],
        axi: [],
      };

      fissures.forEach((fissure) => {
        eras[fissure.tier.toLowerCase()].push(fissure);
      });

      Object.keys(eras).forEach((eraKey) => {
        const embed = new FissureEmbed(this.bot, eras[eraKey],
          platform, ctx.i18n, eras[eraKey][0].tier);
        pages.push(embed);
      });
    }
    await setupPages(pages, { message, settings: this.settings, mm: this.messageManager });
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Fissures;
