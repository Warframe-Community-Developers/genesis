'use strict';

const { MessageEmbed } = require('discord.js');

const Command = require('../../../models/Command');
const { timeDeltaToString } = require('../../../CommonFunctions.js');

/**
 * Displays the response time for the bot and checks Warframe's servers to see if they are up
 */
class Diagnostics extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.diag', 'diag', 'Run some basic diagnostics');
    this.requiresAuth = true;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const embed = new MessageEmbed();
    embed.setTitle(`Diagnostics for Shard ${this.bot.shardId + 1}/${this.bot.shardCount}`);

    embed.addField('Discord WS', `\\✅ ${this.bot.client.ws.ping.toFixed(2)}ms`, true);
    // embed.addField('Worldstate Socket', this.bot.socket.connected
    // ? '\\✅ Connected' : '\\❎ Disconnected');

    // check what permissions the bot has in the current channel
    const perms = message.channel.permissionsFor(this.bot.client.user.id);

    // role management
    const rolePermTokens = [];
    rolePermTokens.push(`${perms.has('MANAGE_ROLES') ? '\\✅' : '\\❎'} Permission Present`);
    rolePermTokens.push(`\\🔲 Bot role position: ${message.guild.me.roles.highest.position}`);

    const rolesForGuild = await this.settings.getRolesForGuild(message.guild);

    if (rolesForGuild.length) {
      rolesForGuild.forEach((role) => {
        const canBeManaged = message.guild.me.roles.highest.comparePositionTo(role.guildRole) > 0;
        rolePermTokens.push(`${canBeManaged ? '\\✅ Manageable' : '\\❎ Unmanageable '} \`${role.guildRole.name}\`\n  \\➡ ID: \`${role.guildRole.id}\`\n  \\➡ Position: \`${role.guildRole.position}\``);
      });
    } else {
      rolePermTokens.push('\\❎ Not configured to manage any roles.');
    }
    embed.addField('Can Manage Roles', rolePermTokens.join('\n'));

    // Tracking
    const trackingReadinessTokens = [`${perms.has('MANAGE_WEBHOOKS') ? '\\✅ Can' : '\\❎ Cannot'} Manage Webhooks`];

    const trackables = {
      events: await this.settings.getTrackedEventTypes(message.channel),
      items: await this.settings.getTrackedItems(message.channel),
    };
    trackingReadinessTokens.push(trackables.events.length ? `\\✅ ${trackables.events.length} Events Tracked` : '\\❎ No Events tracked');
    trackingReadinessTokens.push(trackables.items.length ? `\\✅ ${trackables.items.length} Items Tracked` : '\\❎ No Items tracked');

    embed.addField('Trackable Ready', trackingReadinessTokens.join('\n'));

    // General
    embed.addField('General Ids', `Guild: \`${message.guild.id}\`\nChannel: \`${message.channel.id}\``);

    // embed.addField('Channel Permissions',
    //   message.channel.permissionsFor(this.bot.client.user.id)
    //     .toArray().map(permStr => `\`${permStr}\``).join(', '), false);

    embed.setTimestamp(new Date());
    embed.setFooter(`Uptime: ${timeDeltaToString(this.bot.client.uptime)} `);

    await message.channel.send(embed);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Diagnostics;
