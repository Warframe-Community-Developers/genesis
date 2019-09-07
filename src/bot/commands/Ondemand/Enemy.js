'use strict';

const Command = require('../../../models/Command');
const EnemyEmbed = require('../../../embeds/EnemyEmbed');
const DropsEmbed = require('../../../embeds/DropsEmbed');
const PatchnotesEmbed = require('../../../embeds/PatchnotesEmbed');
const { setupPages, createGroupedArray } = require('../../../CommonFunctions');


class EnemyStats extends Command {
  constructor(bot) {
    super(bot, 'warframe.misc.enemystats', 'enemy', 'Get stats for an enemy');
    this.regex = new RegExp(`^${this.call}\\s?(.+)?`, 'i');
    this.usages = [
      {
        description: 'Get stats for an enemy',
        parameters: ['enemy name'],
      },
    ];
  }

  async run(message) {
    let query = message.strippedContent.match(this.regex)[1];
    if (query) {
      query = query.trim().toLowerCase();
      try {
        const results = await this.ws.search('items', query);
        if (results.length > 0) {
          const pages = [];
          const known = [];
          const enemies = results.filter((result) => {
            if (!known.includes(result.name)) {
              known.push(result.name);
              return true;
            }
            return false;
          });

          enemies.forEach((result) => {
            const mainPage = new EnemyEmbed(this.bot, result);
            if (mainPage.fields.length) {
              pages.push(mainPage);

              pages.push(new DropsEmbed(this.bot, result.drops));

              if (result.patchlogs && result.patchlogs.length) {
                createGroupedArray(result.patchlogs, 4).forEach((patchGroup) => {
                  pages.push(new PatchnotesEmbed(this.bot, patchGroup));
                });
              }
            }
          });

          if (pages.length) {
            await setupPages(pages, { message, settings: this.settings, mm: this.messageManager });
            return this.messageManager.statuses.SUCCESS;
          }
        }
      } catch (e) {
        this.logger.error(e);
      }
    }
    this.messageManager.send(message.channel, 'No such enemy');
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = EnemyStats;
