'use strict';

const Command = require('../../../models/Command');

/**
 * Displays the response time for the bot and checks Warframe's servers to see if they are up
 */
class FrameProfile extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.tutorial', 'tutorial', 'Get a Warframe Tutorial Video');
    this.regex = new RegExp(`^${this.call}s?\\s?(.+)?`, 'i');
    this.usages = [
      {
        description: 'Get a Warframe Tutorial Video',
        parameters: ['subject'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    let query = message.strippedContent.match(this.regex)[1];

    if (query) {
      query = query.trim().toLowerCase();
      const results = await this.ws.search('tutorials', query);
      if (results.length > 0) {
        results.forEach((tutorial) => {
          this.messageManager.send(message.channel, `Warfame Tutorial | ${tutorial.name}: ${tutorial.url}`);
        });
        return this.messageManager.statuses.SUCCESS;
      }
    }
    const tutorials = await this.ws.g('tutorials');
    this.messageManager.embed(message, {
      title: 'Available Tutorials',
      fields: [{ name: '\u200B', value: tutorials.map(tutorial => tutorial.name).join('\n') }],
      footer: {
        icon_url: 'https://warframestat.us/wfcd_logo_color.png',
        text: 'Data evaluated by Warframe Community Developers',
      },
    }, true, false);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = FrameProfile;
