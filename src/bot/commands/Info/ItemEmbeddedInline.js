'use strict';

const Wikia = require('node-wikia');
const fetch = require('../../../tools/Fetcher');

const Command = require('../../../models/InlineCommand.js');
const FrameEmbed = require('../../../embeds/FrameEmbed.js');
const WeaponEmbed = require('../../../embeds/WeaponEmbed.js');
const WikiEmbed = require('../../../embeds/WikiEmbed.js');
const { apiBase, assetBase } = require('../../../CommonFunctions');

const warframe = new Wikia('warframe');

const ancientRetributionThumb = `${assetBase}/img/ancient-retribution.png`;

const checkResult = (prompt, results) => {
  let res;
  results.forEach((result) => {
    if (result.name) {
      if (result.name.toLowerCase() === prompt.toLowerCase()) {
        res = result;
      }
      if (!res && result.name.toLowerCase().indexOf(prompt.toLowerCase() > -1)) {
        res = result;
      }
    }
  });
  if (!res) {
    [res] = results;
  }
  return res;
};

const checkFrames = async (prompt) => {
  const results = await fetch(`${apiBase}/warframes/search/${prompt}`);
  if (results.length > 0) {
    return new FrameEmbed(this.bot, checkResult(prompt, results));
  }
  return undefined;
};

const checkWeapons = async (prompt) => {
  const results = await fetch(`${apiBase}/weapons/search/${prompt}`);
  if (results.length > 0) {
    return new WeaponEmbed(this.bot, checkResult(prompt, results));
  }
  return undefined;
};

const checkWikia = async (prompt) => {
  try {
    const articles = await warframe.getSearchList({
      query: encodeURIComponent(prompt),
      limit: 1,
    });
    const details = await warframe.getArticleDetails({
      ids: articles.items.map(i => i.id),
    });
    return new WikiEmbed(this.bot, details, true);
  } catch (e) {
    return undefined;
  }
};

const checkMods = async (prompt) => {
  try {
    const searchJson = await warframe.getSearchList({ query: prompt, limit: 1 });
    const [{ id }] = searchJson.items;
    const detailsJson = await warframe.getArticleDetails({ ids: [id] });
    let thumbUrl = detailsJson.items[`${id}`].thumbnail;
    thumbUrl = thumbUrl ? thumbUrl.replace(/\/revision\/.*/, '') : ancientRetributionThumb;
    const list = await warframe.getArticlesList({ category: 'Mods', limit: 1000 });
    let result;
    list.items.forEach((item) => {
      if (item.id === id) {
        result = {
          title: detailsJson.items[id].title,
          url: detailsJson.basepath + detailsJson.items[id].url,
          color: 0xC0C0C0,
          description: `Mod result for ${prompt}`,
          image: {
            url: thumbUrl,
          },
        };
      }
    });
    return result;
  } catch (e) {
    return undefined;
  }
};

/**
 * Displays the stats for a warframe
 */
class FrameStatsInline extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.info', '[Query]', 'Get stats for a Warframe');
    this.regex = new RegExp('\\[(.*?)\\]', 'ig');
    this.usages = [
      {
        description: 'Get stats for a Warframe',
        parameters: ['[warframe name]'],
      },
    ];
  }

  async evalQuery(message, query) {
    const strippedQuery = query.replace(/\[|\]/ig, '').trim().toLowerCase();

    try {
      this.logger.debug(`Checking ${strippedQuery} for mod`);
      const modResult = await checkMods(query);
      this.logger.debug(`Checking ${strippedQuery} for frame`);
      const frameResult = await checkFrames(strippedQuery);
      this.logger.debug(`Checking ${strippedQuery} for weapon`);
      const weaponResult = await checkWeapons(strippedQuery);
      this.logger.debug(`Checking ${strippedQuery} from wiki`);
      const wikiResult = await checkWikia(query);

      const possibles = [modResult, frameResult, weaponResult, wikiResult];

      let sent = false;
      possibles.forEach((possible) => {
        if (!sent && possible && possible.title.toLowerCase() === strippedQuery.toLowerCase()) {
          sent = true;
          this.messageManager.embed(message, possible, false, true);
        }
      });

      possibles.forEach((possible) => {
        if (!sent && possible) {
          sent = true;
          this.messageManager.embed(message, possible, false, true);
        }
      });
    } catch (error) {
      this.logger.error(JSON.stringify(error));
      this.logger.error(error);
    }

    return this.messageManager.statuses.NO_ACCESS;
  }

  /**
   * Run the commandW
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const queries = message.strippedContent.match(this.regex);
    const strippedQueries = Array.from(new Set(queries.map(query => query.replace(/\[|\]/ig, '').trim().toLowerCase())));
    this.logger.debug(strippedQueries.join(','));

    if (strippedQueries.length > 0) {
      strippedQueries.forEach(query => this.evalQuery(message, query));
    }

    return this.messageManager.statuses.NO_ACCESS;
  }
}

module.exports = FrameStatsInline;
