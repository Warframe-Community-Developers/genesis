'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const { assetBase } = require('../CommonFunctions');

const arbiThumb = `${assetBase}/img/arbitrations.png`;

/**
 * Generates alert embeds
 */
class ArbitrationEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {ExternalMission} arbitration - The alerts to be included in the embed
   * @param {string} platform - platform
   * @param {I18n} i18n - string template function for internationalization
   */
  constructor(bot, arbitration, platform, i18n) {
    super();
    this.thumbnail.url = arbiThumb;
    this.color = 0x742725;
    this.title = i18n`[${platform.toUpperCase()}] Worldstate - Arbitration`;
    this.addField(arbitration.node, `${arbitration.type} against ${arbitration.enemy}`);

    this.footer.text = 'Expires';
    this.timestamp = arbitration.expiry;
  }
}

module.exports = ArbitrationEmbed;
