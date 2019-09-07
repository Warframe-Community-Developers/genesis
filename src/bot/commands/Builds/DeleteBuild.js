'use strict';

const Command = require('../../../models/Command');

/**
 * Create temporary voice/text channels (can be expanded in the future)
 */
class DeleteBuild extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'builds.delete', 'delete build', 'Create a temporary room.');
    this.regex = new RegExp(`^(?:${this.call}|db)\\s?(.+)?`, 'i');

    this.usages = [
      { description: 'Delete an existing build from Genesis', parameters: ['build id'] },
    ];
  }

  async run(message) {
    const buildId = message.strippedContent.match(this.regex)[1];

    if (buildId.length > 0) {
      const build = await this.settings.getBuild(buildId);
      const owner = typeof build.owner === 'object' ? build.owner.id : build.owner;
      if (owner === message.author.id || message.author.id === this.bot.owner) {
        await this.settings.deleteBuild(buildId);
        this.messageManager.embed(message, { title: `Build ${buildId} deleted.`, color: 0xcda2a3 }, true, true);
        return this.messageManager.statuses.SUCCESS;
      }
    }

    this.messageManager.embed(message, {
      title: `You couldn't delete build ${buildId}.`,
      description: 'You either don\'t own it or it doesn\'t exist',
      color: 0x83181b,
    }, true, true);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = DeleteBuild;
