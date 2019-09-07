'use strict';

const fetch = require('../../../tools/Fetcher');
const Command = require('../../../models/Command');
const SimarisEmbed = require('../../../embeds/SimarisEmbed.js');
const SynthesisTargetEmbed = require('../../../embeds/SynthesisTargetEmbed.js');
const { apiBase } = require('../../../CommonFunctions');
const { setupPages, captures } = require('../../../CommonFunctions');

/**
 * Displays the current simaris target
 */
class Simaris extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.simaris', 'simaris', 'Display current Sanctuary status.');
    // Can only have 1 regex that a command can match on,
    // so this is a combination of platform or target
    this.regex = new RegExp(`(^${this.call}(?:\\s+on\\s+${captures.platforms})?$)|(^${this.call}(?:\\s+target\\s+([\\sa-zA-Z0-9]+))?$)`, 'i');
    this.platformRegex = new RegExp(`^${this.call}(?:\\s+on\\s+${captures.platforms})?$`, 'i');
    this.targetRegex = new RegExp(`^${this.call}(?:\\s+target\\s+([\\sa-zA-Z0-9]+))?$`, 'i');
  }

  async run(message, ctx) {
    const platformParam = await Simaris.getRegexParam(message, this.platformRegex);

    const targetParam = await Simaris.getRegexParam(message, this.targetRegex);

    if (targetParam !== undefined) {
      await this.handleTargetCommand(message, targetParam);
    } else {
      await this.handleSimarisCommmand(message, ctx, platformParam);
    }

    return this.messageManager.statuses.SUCCESS;
  }

  async handleSimarisCommmand(message, ctx, platformParam) {
    const platform = platformParam || ctx.platform;
    await this.messageManager.embed(
      message,
      new SimarisEmbed(this.bot, await this.ws.get('simaris', platform, ctx.language), platform), true, false,
    );
  }

  async handleTargetCommand(message, targetParam) {
    let query = targetParam;

    if (query) {
      query = query.trim().toLowerCase();
    }

    // Search the synth targets for the user's query
    const results = await fetch(`${apiBase}/synthtargets/search/${query}`);

    // If there is a single result, show it
    if (results.length === 1) {
      this.messageManager.embed(
        message,
        new SynthesisTargetEmbed(this.bot, results, query), true, false,
      );
    } else {
      // If there is more than one result, show a result list and the pages
      const pages = [];
      pages.push(new SynthesisTargetEmbed(this.bot, results, query));
      results.forEach((result) => {
        pages.push(new SynthesisTargetEmbed(this.bot, [result], query));
      });
      await setupPages(pages, { message, settings: this.settings, mm: this.messageManager });
    }
  }

  static getRegexParam(message, regex) {
    let param;
    const matchIndex = 1;
    const matches = message.strippedContent.match(regex);
    if (matches !== null) {
      param = matches[matchIndex];
    }
    return param;
  }
}

module.exports = Simaris;
