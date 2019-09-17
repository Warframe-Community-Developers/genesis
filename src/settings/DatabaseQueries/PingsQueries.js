'use strict';

const SQL = require('sql-template-strings');

const logger = require('../../Logger');

class PingsQueries {
  constructor(db) {
    this.db = db;
  }

  /**
   * Enables or disables pings for an item in a channel
   * @param {TextChannel} channel The channel where to enable notifications
   * @param {string} item The item to set ping status for
   * @param {boolean} enabled true to enable pinging, false to disable
   * @returns {Promise}
   */
  async setItemPing(channel, item, enabled) {
    const query = SQL`UPDATE item_notifications SET ping = ${enabled} WHERE channel_id = ${channel.id}
      AND item = ${item};`;
    return this.db.query(query);
  }

  /**
   * Enables or disables pings for an event type in a channel
   * @param {TextChannel} channel The channel where to enable notifications
   * @param {string} type The event type to set ping status for
   * @param {boolean} enabled true to enable pinging, false to disable
   * @returns {Promise}
   */
  async setEventTypePing(channel, type, enabled) {
    const query = SQL`UPDATE type_notifications SET ping = ${enabled} WHERE channel_id = ${channel.id}
      AND type = ${type};`;
    return this.db.query(query);
  }

  /**
   * Sets a ping message for an item or event type in a guild
   * @param {Guild} guild The guild
   * @param {string} itemOrType The item or event type to set the ping message for
   * @param {string} text The text of the ping message
   * @returns {Promise}
   */
  async setPing(guild, itemOrType, text) {
    const query = SQL`INSERT INTO pings VALUES (${guild.id}, ${itemOrType}, ${text})
      ON DUPLICATE KEY UPDATE text = ${text};`;
    return this.db.query(query);
  }

  /**
   * Get all pings for a guild for the provided event types and items
   * @param  {Guild} guild                 Guild to get pings for
   * @param  {Array.<string>} itemsOrTypes array of strings corresponding to event and reward types
   * @returns {Promise.<string>}            Promise of a string to prepend to a message
   */
  async getPing(guild, itemsOrTypes) {
    const query = SQL`SELECT text FROM pings WHERE guild_id=${guild.id} AND item_or_type in (${itemsOrTypes})`;
    const res = await this.db.query(query);
    if (res[0].length === 0) {
      return '';
    }
    return res[0]
      .map(result => result.text).join(', ');
  }

  async getPingsForGuild(guild) {
    if (guild) {
      const query = SQL`SELECT item_or_type, text FROM pings WHERE guild_id=${guild.id}`;
      const res = await this.db.query(query);

      if (res[0].length === 0) {
        return [];
      }
      return res[0]
        .map(result => ({ text: result.text, thing: result.item_or_type }));
    }
    return [];
  }

  /**
   * Removes a ping message
   * @param {Guild} guild The guild where the ping message is currently being sent
   * @param {string} itemOrType The item or event type associated to the ping message
   * @returns {Promise}
   */
  async removePing(guild, itemOrType) {
    if (guild) {
      const query = SQL`DELETE FROM pings WHERE guild_id = ${guild.id} AND item_or_type = ${itemOrType};`;
      return this.db.query(query);
    }
    return false;
  }

  /**
   * Returns all the channels that should get a notification for the items in the list
   * @param {string} type The type of the event
   * @param {string} platform The platform of the event
   * @param {Array.<string>} items The items in the reward that is being notified
   * @returns {Promise.<Array.<{channel_id: string, webhook: string}>>}
   */
  async getNotifications(type, platform, items) {
    if (this.scope === 'worker') {
      return this.getAgnosticNotifications(type, platform, items);
    }
    try {
      const query = SQL`SELECT DISTINCT channels.id as channelId
          FROM type_notifications`
        .append(items && items.length
          ? SQL` INNER JOIN item_notifications ON type_notifications.channel_id = item_notifications.channel_id` : SQL``)
        .append(SQL` INNER JOIN channels ON channels.id = type_notifications.channel_id`)
        .append(SQL` INNER JOIN settings ON channels.id = settings.channel_id`)
        .append(SQL` WHERE type_notifications.type = ${String(type)}
          AND MOD(IFNULL(channels.guild_id, 0) >> 22, ${this.bot.shardTotal}) in (${this.bot.shards})
          AND settings.setting = "platform"  AND (settings.val = ${platform || 'pc'} OR settings.val IS NULL) `)
        .append(items && items.length ? SQL`AND item_notifications.item IN (${items})
          AND item_notifications.channel_id = settings.channel_id;` : SQL`;`);
      return (await this.db.query(query))[0];
    } catch (e) {
      logger.error(e);
      return [];
    }
  }

  /**
   * Returns all the channels that should get a notification for the items in the list
   *    - ignores shard id, because this is for the standalone notifications
   * @param {string} type The type of the event
   * @param {string} platform The platform of the event
   * @param {Array.<string>} items The items in the reward that is being notified
   * @returns {Promise.<Array.<{channel_id: string, webhook: string}>>}
   */
  async getAgnosticNotifications(type, platform, items) {
    if (this.scope !== 'worker') {
      return this.getNotifications(type, platform, items);
    }
    try {
      const query = SQL`SELECT DISTINCT channels.id as channelId
          FROM type_notifications`
        .append(items && items.length
          ? SQL` INNER JOIN item_notifications ON type_notifications.channel_id = item_notifications.channel_id` : SQL``)
        .append(SQL` INNER JOIN channels ON channels.id = type_notifications.channel_id`)
        .append(SQL` INNER JOIN settings ON channels.id = settings.channel_id`)
        .append(SQL`
        WHERE type_notifications.type = ${String(type)}
          AND settings.setting = "platform"  AND (settings.val = ${platform || 'pc'} OR settings.val IS NULL) `)
        .append(items && items.length ? SQL`AND item_notifications.item IN (${items})
          AND item_notifications.channel_id = settings.channel_id;` : SQL`;`);
      return (await this.db.query(query))[0];
    } catch (e) {
      logger.error(e);
      return [];
    }
  }

  /**
   * Remove pings corresponding to the guild id
   * @param  {snowflake} guildId guild identifier for removal
   * @returns {Promise.<string>} status of removal
   */
  async removePings(guildId) {
    const query = SQL`DELETE FROM pings WHERE guild_id = ${guildId}`;
    return this.db.query(query);
  }

  /**
   * Set the notified ids for a given platform and shard id
   * @param {string} platform    platform corresponding to notified ids
   * @param {JSON} notifiedIds list of oids that have been notifiedIds
   * @returns {Promise}
   */
  async setNotifiedIds(platform, notifiedIds) {
    const query = SQL`INSERT INTO notified_ids VALUES
      (${this.clusterId}, ${platform}, JSON_ARRAY(${notifiedIds}))
      ON DUPLICATE KEY UPDATE id_list = JSON_ARRAY(${notifiedIds});`;
    return this.db.query(query);
  }

  /**
   * Get list of notified ids for the given platform and shard id
   * @param  {string} platform Platform
   * @returns {Promise.<Array>} Array of notified oids
   */
  async getNotifiedIds(platform) {
    const query = SQL`SELECT id_list
      FROM notified_ids
      WHERE shard_id=${this.clusterId} AND platform=${platform};`;
    const res = await this.db.query(query);
    if (res[0].length === 0) {
      return [];
    }
    return res[0][0].id_list;
  }
}

module.exports = PingsQueries;
