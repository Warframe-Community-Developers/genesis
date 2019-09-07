'use strict';

const Command = require('../../../models/Command');
const ServerInfoEmbed = require('../../../embeds/ServerInfoEmbed');
/**
 * Get a list of all servers
 */
class ServerInfo extends Command {
  /**
   * Constructs a callable command
   * @param {Bot} bot The bot object
   */
  constructor(bot) {
    super(bot, 'util.serverInfo', 'serverinfo', 'Get info about current server');
  }

  async run(message) {
    const { guild } = message;
    if (!guild) {
      this.messageManager.reply(message, 'Operator, this is a DM, you can\'t do that!', false, false);
      return this.messageManager.statuses.FAILURE;
    }
    const embed = new ServerInfoEmbed(this.bot, guild);
    this.messageManager.embed(message, embed, true, false);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = ServerInfo;
