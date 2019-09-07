'use strict';

const fetch = require('../../../tools/Fetcher');
const Command = require('../../../models/Command');
const WeaponEmbed = require('../../../embeds/WeaponEmbed.js');
const ComponentEmbed = require('../../../embeds/ComponentEmbed.js');
const RivenStatEmbed = require('../../../embeds/RivenStatEmbed.js');
const PatchnotesEmbed = require('../../../embeds/PatchnotesEmbed.js');
const { setupPages, apiBase, createGroupedArray } = require('../../../CommonFunctions');


/**
 * Displays the stats for a weapon
 */
class WeaponStats extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.weaponstats', 'weapon', 'Get stats for a weapon');
    this.regex = new RegExp(`^${this.call}\\s?(.+)?`, 'i');
    this.usages = [
      {
        description: 'Get stats for a weapon',
        parameters: ['weapon name'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {CommandContext} ctx Context for the command, such as platform, etc.
   * @returns {string} success status
   */
  async run(message, ctx) {
    let weapon = message.strippedContent.match(this.regex)[1];
    if (weapon) {
      weapon = weapon.trim().toLowerCase();
      try {
        const results = await fetch(`${apiBase}/weapons/search/${weapon}`);
        const strippedWeaponN = weapon.replace(/(prime|vandal|wraith|prisma)/ig, '').trim();
        const rivenResults = await fetch(`${apiBase}/${ctx.platform}/rivens/search/${strippedWeaponN}`);
        if (results.length > 0) {
          const pages = [];
          results.forEach((result) => {
            pages.push(new WeaponEmbed(this.bot, result));

            if (Object.keys(rivenResults).length > 0) {
              const strippedRes = result.name.replace(/(prime|vandal|wraith|prisma)/ig, '').trim();
              if (rivenResults[strippedRes]) {
                pages.push(new RivenStatEmbed(
                  this.bot, rivenResults[strippedRes], result.name, ctx.i18n,
                ));
              }
            }

            if (result.components && result.components.length) {
              pages.push(new ComponentEmbed(this.bot, result.components));
            }

            if (result.patchlogs && result.patchlogs.length) {
              createGroupedArray(result.patchlogs, 4).forEach((patchGroup) => {
                pages.push(new PatchnotesEmbed(this.bot, patchGroup));
              });
            }
          });

          await setupPages(pages, { message, settings: this.settings, mm: this.messageManager });
          return this.messageManager.statuses.SUCCESS;
        }
        this.messageManager.embed(message, new WeaponEmbed(this.bot, undefined), true, false);
        return this.messageManager.statuses.FAILURE;
      } catch (e) {
        this.logger.error(e);
        this.messageManager.embed(message, new WeaponEmbed(this.bot, undefined), true, false);
        return this.messageManager.statuses.FAILURE;
      }
    }
    this.messageManager.embed(message, new WeaponEmbed(this.bot, undefined), true, false);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = WeaponStats;
