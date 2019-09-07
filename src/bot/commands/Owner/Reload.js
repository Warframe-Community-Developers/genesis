'use strict';


const decache = require('decache');
const path = require('path');
const Command = require('../../../models/Command');

/**
 * Reloads the script containing the commands
 */
class Reload extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.reload', 'reload', 'Reload bot modules');
    this.ownerOnly = true;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    this.logger.debug('Reloading modules');
    const precache = Object.keys(this.commandManager.commandCache);

    // decache processes
    const commandDir = path.join(__dirname, '../commands');
    this.commandManager.commands
      .filter(command => precache.includes(command.id))
      .forEach((command) => {
        try {
          decache(path.join(commandDir, command.path));
          this.logger.debug(`Decached ${command.id} @ ${command.path}`);
        } catch (e) {
          this.logger.error(`Could not decache ${command.id} @ ${command.path}`);
        }
      });

    delete this.commandManager.commandCache;
    this.commandManager.commandCache = {};
    const precacheString = precache.length > 0 ? precache.sort().join('\n- ') : 'No Commands decached';

    await this.messageManager.send(message, `**Commands reloaded!**
**Decached**
\`\`\`diff
- ${precacheString}
\`\`\``,
    {
      deleteOriginal: true,
      deleteResponse: true,
      message,
    });
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Reload;
