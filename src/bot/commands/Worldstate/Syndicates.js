'use strict';

const Command = require('../../../models/Command');
const SyndicateEmbed = require('../../../embeds/SyndicateEmbed.js');
const { setupPages, captures } = require('../../../CommonFunctions');
const syndicates = require('../../../assets/syndicates.json');

const values = syndicates.map(s => s.display.toLowerCase());

/**
 * Displays the currently active Invasions
 */
class Syndicates extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.syndicate', 'syndicate', 'Gets the starchat nodes for the desired syndicate, or all.');
    this.regex = new RegExp(`^${this.call}\\s?(?:(${values.join('|')}))?(?:\\s+on\\s+${captures.platforms})?$`, 'i');
    this.usages = [
      {
        description: 'Display syndicate nodes for a syndicate.',
        parameters: ['syndicate'],
      },
    ];
  }

  async run(message, ctx) {
    const matches = message.strippedContent.match(this.regex);
    const param1 = (matches[1] || '').toLowerCase();
    const param2 = (matches[2] || '').toLowerCase();
    const syndicate = values.indexOf(param1) > -1 ? param1.toLowerCase() : 'all';
    let platformParam;
    if (this.platforms.indexOf(param2) > -1) {
      platformParam = param2;
    } else if (this.platforms.indexOf(param1) > -1) {
      platformParam = param1;
    }
    const platform = platformParam || ctx.platform;
    const pages = [];
    const matching = (await this.ws.get('syndicateMissions', platform, ctx.language))
      .filter(m => m.syndicate.toLowerCase() === syndicate || syndicate === 'all'); if (matching.length) {
      matching.forEach((mission) => {
        pages.push(new SyndicateEmbed(this.bot, [mission], mission.syndicate, platform, true));
      });
      await setupPages(pages, { message, settings: this.settings, mm: this.messageManager });
      return this.messageManager.statuses.SUCCESS;
    }
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = Syndicates;
