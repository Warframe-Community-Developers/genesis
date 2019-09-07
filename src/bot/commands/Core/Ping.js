'use strict';

const ping = require('ping').promise;
const Command = require('../../../models/Command');
const { timeDeltaToString } = require('../../../CommonFunctions.js');

/**
 * Displays the response time for the bot and checks Warframe's servers to see if they are up
 */
class Ping extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.ping', 'ping', 'Ping Genesis to test connectivity');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const hosts = [
      'content.warframe.com',
      'forums.warframe.com',
      'store.warframe.com',
      'nexus-stats.com',
      'warframe.market',
      'warframestat.us',
      'hub.warframestat.us',
      'drops.warframestat.us',
    ];
    const results = [];

    hosts.forEach((host) => {
      ping.probe(host)
        .then((result) => {
          results.push({
            name: host,
            value: `${result.alive ? '\\✅' : '\\❎'} ${typeof result.time !== 'undefined' && result.time !== 'unknown' ? result.time : '--'}ms`,
          });
        });
    });

    results.unshift({
      name: 'Discord WS',
      value: `\\✅ ${this.bot.client.ws.ping.toFixed(2)}ms`,
    });

    const now = Date.now();
    const msg = await this.messageManager.reply(message, 'Testing Ping', { deleteOriginal: true, deleteResponse: false });
    const afterSend = Date.now();
    await msg.edit('', {
      embed: {
        title: 'PONG',
        type: 'rich',
        fields: [{
          name: `Response time (shard ${message.guild ? message.guild.shardID + 1 : 1} of ${this.bot.shardTotal})`,
          value: `${afterSend - now}ms`,
        },
        ...results,
        ],
        footer: {
          thumbnail_url: '\u200B',
          text: `Uptime: ${timeDeltaToString(this.bot.client.uptime)}`,
        },
      },
    });
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Ping;
