'use strict';

const Command = require('../../../models/Command');

/**
 * Create temporary voice/text channels (can be expanded in the future)
 */
class SetBuildsPublic extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'builds.setpublic', 'set public build|spb', 'Set whether or not a build is public.');
    this.regex = new RegExp(`^(?:${this.call})\\s?(.+)?`, 'i');

    this.usages = [
      { description: 'Set a build or builds to be public', parameters: ['build id(s)', 'on/off'] },
    ];
  }

  async run(message, ctx) {
    const onOrOff = message.strippedContent.match(/on|off/ig)[0];
    if (!onOrOff) {
      return this.messageManager.statuses.FAILURE;
    }

    const buildIds = message.strippedContent
      .replace(new RegExp(this.call, 'i'), '')
      .replace(onOrOff, '')
      .split(',')
      .map(id => id.trim());

    if (!buildIds.length) {
      return this.messageManager.statuses.FAILURE;
    }

    const ownedBuilds = (await this.settings.getBuilds(ctx.owner, message.author, buildIds))
      .map(build => build.id);
    this.logger.debug(ownedBuilds);
    try {
      await this.settings.setBuildPublicity(ownedBuilds, (onOrOff.trim() === 'on') ? '1' : '0');
      await this.messageManager.sendMessage(message, `**Builds set to __${onOrOff === 'on' ? 'public' : 'private'}__**\n${ownedBuilds.join('\n')}`, true, true);
      return this.messageManager.statuses.SUCCESS;
    } catch (e) {
      this.logger.error(e);
    }
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = SetBuildsPublic;
