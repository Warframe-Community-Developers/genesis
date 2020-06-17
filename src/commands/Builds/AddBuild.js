'use strict';

const fetch = require('../../resources/Fetcher');

const Command = require('../../models/Command.js');
const BuildEmbed = require('../../embeds/BuildEmbed');
const { assetBase, setupPages } = require('../../CommonFunctions');

const outageThumb = `${assetBase}/img/outage.png`;

/**
 * Create temporary voice/text channels (can be expanded in the future)
 */
class AddBuild extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'builds.add', 'add build', 'Create a temporary room.', 'UTIL');
    this.regex = new RegExp(`^(?:${this.call}|ab)\\s(.+)?`, 'i');

    this.usages = [
      { description: 'Display instructions for creating a new build with Genesis', parameters: [] },
      {
        description: 'Add a build with the provided title, body, and image URL',
        parameters: ['title', 'body', 'image url'],
        delimBefore: ' ',
        delimAfter: ' ',
        separator: ' | ',
      },
      {
        description: 'Add one or more builds from a structured json file. [Example file.](https://pastebin.com/raw/EU9ZX1uQ)',
        parameters: [],
      },
    ];

    this.allowDM = false;
  }

  async run(message) {
    const matches = message.strippedContent.match(this.regex)[1];
    const params = (matches || '').split('|');

    // json attachment
    if (message.attachments.first()) {
      let firstAttach;
      try {
        firstAttach = message.attachments.first();
      } catch (e) {
        this.logger.error(e);
        return this.messageManager.statuses.FAILURE;
      }

      if (firstAttach.name.indexOf('.json') === -1) {
        this.messageManager.reply(message, 'Invalid file. Check here (<https://pastebin.com/raw/EU9ZX1uQ>)', true, true);
        return this.messageManager.statuses.FAILURE;
      }
      let buildsConfig;

      try {
        buildsConfig = await fetch(firstAttach.url);
      } catch (e) {
        message.reply('Couldn\'t get file.');
        this.logger.error(e);
        message.delete({ timeout: 30000 });
        return this.messageManager.statuses.FAILURE;
      }
      let unfoundOwners = [];
      const builds = await this.settings.addNewBuilds(buildsConfig.builds.map((build) => {
        if ((typeof build.owner !== 'undefined' && this.bot.client.cache.users.get(build.owner)) || typeof build.owner === 'undefined') {
          return {
            title: build.title,
            body: `${buildsConfig.common.prefix || ''}${build.body}${buildsConfig.common.postfix || ''}`,
            image: build.image,
            ownerId: build.owner || message.author.id,
            owner: this.bot.client.cache.users.get(build.owner) || build.owner || message.author,
            isPublic: build.is_public || false,
          };
        }
        unfoundOwners.push(build.owner);
        return undefined;
      }));

      unfoundOwners = Array.from(new Set(unfoundOwners));
      if (unfoundOwners.length) {
        this.messageManager.reply(message, `Could not find users for ownership:\n${unfoundOwners.map(id => `${id}`).join('\n')}`);
        return this.messageManager.statuses.FAILURE;
      }

      const pages = builds.map(build => new BuildEmbed(this.bot, build));
      setupPages(pages, { message, settings: this.settings, mm: this.messageManager });
      return this.messageManager.statuses.SUCCESS;
    }

    // non-attachment route
    if (params.length < 1) {
      // let them know there's not enough params
      return this.messageManager.statuses.FAILURE;
    }
    // save params based on order
    const title = params[0] || 'My Build';
    const body = params[1] || 'My Build Body';
    const image = params[2] || outageThumb;
    const build = await this.settings.addNewBuild(title, body, image, message.author);
    const embed = new BuildEmbed(this.bot, build);
    this.messageManager.embed(message, embed, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = AddBuild;
