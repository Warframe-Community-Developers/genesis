'use strict';

const Command = require('../../../models/Command');
const { createGroupedArray } = require('../../../CommonFunctions');

const promocodes = ['ADMIRALBAHROO', 'KINGGOTHALION', 'PROFESSORBROMAN', 'SP00NERISM', 'SUMMIT1G',
  'BIKEMAN', 'TACTICALPOTATO', 'IFLYNN', 'MOGAMU', 'SKILLUP', 'ORIGINALWICKEDFUN', 'MCGAMERCZ',
  'HOMIINVOCADO', 'MCIK', 'TVSBOH', 'SHUL', 'r/warframe', 'LYNXARIA', 'BWANA', 'LILLEXI', 'INEXPENSIVEGAMER',
  'BROZIME', 'N00BLSHOWTEK', 'BRICKY', 'DEEJAYKNIGHT'];
const divider = ' • ';

const promoCodeEmbed = {
  title: 'Promocodes',
  color: 7506394,
  fields: createGroupedArray(promocodes.map(code => `[${code}](https://warframe.com/promocode?code=${code})`), 10).map(group => ({
    name: '\u200B',
    value: group.join(divider),
  })),
};


/**
 * Promocodes
 */
class Jokes extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'silly.promocode', 'promocodes', 'Get promocodes');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    await this.messageManager.embed(message, promoCodeEmbed, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Jokes;
