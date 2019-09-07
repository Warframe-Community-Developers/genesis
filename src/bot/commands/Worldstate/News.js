'use strict';

const Command = require('../../../models/Command');
const NewsEmbed = require('../../../embeds/NewsEmbed.js');
const { captures, setupPages } = require('../../../CommonFunctions');

/**
 * Displays the currently active warframe news
 */
class News extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.news', 'news', 'Display the currently active news');
    this.regex = new RegExp(`^${this.call}\\s?(?:(compact))?(?:\\s+on\\s+${captures.platforms})?$`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || ctx.platform;
    const compact = /compact/ig.test(message.strippedContent);
    const news = (await this.ws.get('news', platform, ctx.language))
      .filter(n => !n.update && !n.primeAccess && n.translations[ctx.language]);

    if (compact) {
      await this.messageManager
        .embed(message, new NewsEmbed(this.bot, news, undefined, platform), true, true);
    } else {
      const pages = [];
      news.forEach((article) => {
        pages.push(new NewsEmbed(this.bot, [article], undefined, platform));
      });
      await setupPages(pages, { message, settings: this.settings, mm: this.messageManager });
    }
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = News;
