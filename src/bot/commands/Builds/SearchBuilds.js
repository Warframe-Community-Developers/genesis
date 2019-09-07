'use strict';

const Command = require('../../../models/Command');
const BuildEmbed = require('../../../embeds/BuildEmbed');
const { setupPages, createGroupedArray } = require('../../../CommonFunctions');

/**
 * Create temporary voice/text channels (can be expanded in the future)
 */
class GetBuild extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'builds.search', 'search builds', 'Search for a build in the public builds');
    this.regex = new RegExp(`^(?:${this.call}|sb)\\s?(.+)?`, 'i');

    this.usages = [
      { description: 'Display information on an existing build from Genesis', parameters: ['query'] },
    ];
  }

  async run(message) {
    const query = message.strippedContent.match(this.regex)[1];
    if (!query || query.length < 1) {
      return this.messageManager.statuses.FAILURE;
    }
    try {
      const results = await this.settings.getBuildSearch(query);
      if (results.length > 1) {
        const buildGroups = createGroupedArray(results, 10);
        const titleLen = (results.length ? results.map(result => result.title.trim())
          .reduce((a, b) => (a.length > b.length ? a : b)) : '').length;

        const tokens = buildGroups.map(buildGroup => ({
          name: '\u200B',
          value: buildGroup.map(build => `\`${build.id} | ${build.title.padEnd(titleLen, '\u2003')} | Added by ${typeof build.owner === 'object' ? build.owner.tag : build.owner}\``).join('\n'),
        }));

        const tokenGroups = createGroupedArray(tokens, 5);
        const embeds = [];
        tokenGroups.forEach((tokenGroup) => {
          const fields = tokenGroup;
          fields[0].value = `\`Build ID | ${'Title'.padEnd(titleLen, '\u2003')} | Owner\`\n${tokenGroup[0].value}`;
          embeds.push({
            color: 0xcda2a3,
            fields,
          });
        });
        results.forEach((build) => {
          const embed = new BuildEmbed(this.bot, build);
          embeds.push(embed);
        });

        await setupPages(embeds, { message, settings: this.settings, mm: this.messageManager });
        return this.messageManager.statuses.SUCCESS;
      } if (results.length === 1) {
        const build = results[0];
        const embed = new BuildEmbed(this.bot, build);
        this.messageManager.embed(message, embed, true, true);
        return this.messageManager.statuses.SUCCESS;
      }
      await this.messageManager.embed(message, { color: 0xcda2a3, title: `No builds for query: **${query}**` }, true, true);
    } catch (e) {
      this.logger.error(e);
      return this.messageManager.statuses.FAILURE;
    }
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = GetBuild;
