'use strict';

const Command = require('../../../models/Command');
const ConclaveChallengeEmbed = require('../../../embeds/ConclaveChallengeEmbed.js');
const { captures } = require('../../../CommonFunctions');

const values = ['all', 'day', 'week'];


/**
 * Displays the currently active Invasions
 */
class ConclaveChallenges extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.conclaveChallenges', 'conclave', 'Gets the current conclave challenges for a category of challenge, or all.');
    this.regex = new RegExp(`^${this.call}(?:\\s+(${values.join('|')}))?(?:\\s+on\\s+${captures.platforms})?$`, 'i');

    this.usages = [
      {
        description: 'Display conclave challenges for a challenge type.',
        parameters: ['conclave category'],
      },
    ];
  }

  async run(message, ctx) {
    const matches = message.strippedContent.match(this.regex);
    const param1 = (matches[1] || '').toLowerCase();
    const param2 = (matches[2] || '').toLowerCase();
    const category = values.indexOf(param1) > -1 ? param1 : 'all';
    let platformParam;
    if (this.platforms.indexOf(param2) > -1) {
      platformParam = param2;
    } else if (this.platforms.indexOf(param1) > -1) {
      platformParam = param1;
    }
    const platform = platformParam || ctx.context;
    const embed = new ConclaveChallengeEmbed(this.bot, await this.ws.get('conclaveChallenges', platform, ctx.language), category, platform);
    await this.messageManager.embed(message, embed, true, false);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = ConclaveChallenges;
