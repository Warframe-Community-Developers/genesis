'use strict';

const Command = require('../../../models/Command');
const ProfileEmbed = require('../../../embeds/ProfileEmbed.js');

const inProgressEmbed = { title: 'Processing search...', color: 0xF1C40F };
const offlineMessage = 'Profile Engine Offline. New Entries will not be processed.';

/**
 * Looks up items from Nexus-stats.com
 */
class PriceCheck extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.profile', 'profile', 'profile');
    this.regex = new RegExp(`^${this.call}(?:\\s+(.+))?`, 'i');
    this.usages = [
      {
        description: 'Search for a player\'s profile',
        parameters: ['in-game name (PC only)'],
      },
    ];
    this.enabled = false;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    let username = message.strippedContent.match(this.regex)[1];
    if (typeof username === 'undefined') {
      await this.sendUsageEmbed(message);
      return this.messageManager.statuses.FAILURE;
    }
    username = username.trim();

    const inProgressMesage = await message.channel.send('', { embed: inProgressEmbed });
    const status = await this.bot.nexusFetcher.get('/warframe/v1/bots/status');
    let embedWithTime = {};
    if (!status['Player-Sentry'].online) {
      embedWithTime = { title: 'Profile Engine Offline. New Entries will not be processed.', color: 0xaa0000 };
    } else {
      embedWithTime = { title: `Profile Engine Online... ${status['Player-Sentry'].queue.timeRemaining} remaining...` };
    }
    const messageWithTime = await inProgressMesage.edit('', { embed: embedWithTime });
    const profile = await this.bot.nexusFetcher.get(`/warframe/v1/players/${username}/profile`);
    const profileIsOk = profile && (profile.name || (profile.error === `${username} could not be found.`
                         && (messageWithTime.embeds.length > 0
                             && messageWithTime.embeds[0].title !== offlineMessage)));
    if (profileIsOk) {
      await messageWithTime.edit('', { embed: new ProfileEmbed(this.bot, profile.name ? profile : {}) });
      return this.messageManager.statuses.SUCCESS;
    }
    return this.messageManager.statuses.FAILURE;
  }

  async sendUsageEmbed(message) {
    const prefix = await this.settings.getGuildSetting(message.guild, 'prefix');
    const embed = {
      type: 'rich',
      color: 0x0000ff,
      fields: [
        {
          name: `${prefix}${this.call} <ign>`,
          value: 'Search for Player Profile',
          inline: true,
        },
        {
          name: 'Parameters:',
          value: '`player in-game name` : In-game name of user whose profile you wish to fetch',
          inline: false,
        },
      ],
    };
    await this.messageManager.embed(message, embed, true, true);
  }
}

module.exports = PriceCheck;
