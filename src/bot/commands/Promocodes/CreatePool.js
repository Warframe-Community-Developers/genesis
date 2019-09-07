'use strict';

const Command = require('../../../models/Command');

/**
 * Reloads the script containing the commands
 */
class CreatePool extends Command {
  constructor(bot) {
    super(bot, 'promocode.pools.add', 'glyphs create pool', 'Create a new Glyph Pool');
    this.regex = new RegExp(`^${this.call}\\s?(.+)?`, 'i');
    this.usages = [
      {
        description: 'Create a pool from a name',
        parameters: ['new pool name'],
      },
    ];
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const name = (message.strippedContent.match(this.regex)[1] || '').trim();
    // Make sure there's a name
    if (name.length === 0) {
      await this.messageManager.sendMessage(message, 'Specify a name for the Pool');
      return this.messageManager.statuses.FAILURE;
    }

    const id = name.toLowerCase().replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '');
    await this.settings.addPool(id, name, message.author.id, 'glyph', message.guild);
    await this.settings.addPoolManager(id, message.author.id);
    await this.messageManager.sendDirectMessageToUser(message.author, `Added new pool ${id} on ${message.guild.name} with name \`${name}\`.`);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = CreatePool;
