'use strict';

const Command = require('../../../models/Command');
const { assetBase } = require('../../../CommonFunctions');

/**
 * Calculates the damage reduction for a given armor value
 * @param {number} currentArmor The enemy's armor
 * @returns {number}
 */
function damageReduction(currentArmor) {
  return currentArmor / (currentArmor + 300);
}

/**
 * Calculates the number of corrosive procs that would be needed to completely
 * strip armor from an enemy
 * @param {number} armor The enemy's armor
 * @returns {number}
 */
function armorStrip(armor) {
  return Math.ceil(8 * Math.log10(armor));
}

/**
 * Calculates an enemy armor at a given level
 * @param {number} baseArmor    The enemy's armor at the base level
 * @param {number} baseLevel    The enemy's base level
 * @param {number} currentLevel The level to calculate armor at
 * @returns {number}
 */
function armorAtLevel(baseArmor, baseLevel, currentLevel) {
  return baseArmor * (1 + (((currentLevel - baseLevel) ** 1.75) / 200));
}

/**
 * Returns a string with details on an enemy's armor at a certain level
 * @param {number} baseArmor    The enemy's armor at the base level
 * @param {number} baseLevel    The enemy's base level
 * @param {number} currentLevel The level to calculate armor at
 * @returns {string}
 */
function armorFull(baseArmor, baseLevel, currentLevel) {
  const armor = armorAtLevel(baseArmor, baseLevel, currentLevel);
  return [
    `At level ${Math.round(currentLevel)} your enemy would have ${armor.toFixed(2)} Armor`,
    `${(damageReduction(armor) * 100).toFixed((2))}% damage reduction`,
    `You will need ${armorStrip(armor)} corrosive procs to strip your enemy of armor.`,
  ].join('\n');
}

/**
 * Returns a string with details on an enemy's armor
 * @param {number} armor    The enemy's armor
 * @returns {string}
 */
function armorSimple(armor) {
  return `\`\`\`haskell${
    [
      `${(damageReduction(armor) * 100).toFixed(2)}% damage reduction`,
      `You will need ${armorStrip(armor)} corrosive procs to strip your enemy of armor.`,
    ].join('\n')}\`\`\``;
}


/**
 * Performs armor calculations
 */
class Armor extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.armor', 'armor', 'armor');
    this.regex = new RegExp(`^${this.call}(?:\\s+([\\d+\\.?\\d*\\s]+))?`, 'i');
    this.usages = [
      { description: 'Display instructions for calculating armor', parameters: [] },
      {
        description: 'Display current damage resistance and amount of corrosive procs '
          + 'required to strip it.',
        parameters: ['current armor'],
      },
      {
        description: 'Display the current armor, damage resistance, and necessary '
          + 'corrosive procs to strip armor.',
        parameters: ['base armor', 'base level', 'current level'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const pattern3Params = /(\d+\.?\d*)(?:\s+(\d+\.?\d*)\s+(\d+\.?\d*))?/;
    const params3 = message.content.match(pattern3Params);
    let armorString = '';
    if (params3 && params3.length > 3) {
      const armor = params3[1];
      const baseLevel = params3[2];
      const currentLevel = params3[3];
      if (typeof baseLevel === 'undefined') {
        this.logger.debug('Entered 1-param armor');
        armorString = armorSimple(parseInt(armor, 10));
      } else {
        this.logger.debug('Entered 3-param armor');
        armorString = armorFull(
          parseFloat(armor), parseFloat(baseLevel),
          parseFloat(currentLevel),
        );
      }

      const embed = {
        color: 0xffa500,
        thumbnail: {
          url: `${assetBase}/grineer.png`,
        },
        fields: [
          {
            name: 'Armor Calculation:',
            value: armorString,
          },
        ],
        footer: {
          icon_url: 'https://warframestat.us/wfcd_logo_color.png',
        },
      };
      this.messageManager.embed(message, embed, true, false);
      return this.messageManager.statuses.SUCCESS;
    }
    this.logger.debug('Entered 0-param armor');
    this.sendUsage(message);
    return this.messageManager.statuses.FAILURE;
  }

  /**
   * Replies with details on the command's usage
   * @param {Message} message The message to reply to
   */
  sendUsage(message) {
    const embed = {
      color: 0xff0000,
      thumbnail: {
        url: `${assetBase}/grineer.png`,
      },
      fields: [
        {
          name: 'Possible uses include:',
          value: `${this.bot.prefix}armor (Base Armor) (Base Level) (Current Level) calculate armor and stats.\n`
            + `${this.bot.prefix}armor (Current Armor) Calculate damage resistance.`,
        },
      ],
      footer: {
        icon_url: 'https://warframestat.us/wfcd_logo_color.png',
      },
    };

    this.messageManager.embed(message, embed, true, false);
  }
}

module.exports = Armor;
