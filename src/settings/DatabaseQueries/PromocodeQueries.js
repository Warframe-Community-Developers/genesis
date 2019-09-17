'use strict';

const SQL = require('sql-template-strings');

const logger = require('../../Logger');

class PromocodeQueries {
  constructor(db) {
    this.db = db;
  }

  async addPool(id, name, ownerId, type, guild) {
    const query = SQL`INSERT IGNORE INTO code_pool
      (pool_id, pool_name, pool_owner, pool_type, pool_default_guild)
      VALUES
      (${id}, ${name}, ${ownerId}, ${type || 'glyph'}, ${guild.id});`;
    return this.db.query(query);
  }

  async deletePool(id) {
    return this.db.query(SQL`DELETE FROM code_pool WHERE pool_id = ${id}`);
  }

  async setPoolName(id, name) {
    const query = SQL`UPDATE code_pool SET pool_name = ${name} WHERE pool_id = ${id};`;
    return this.db.query(query);
  }

  async setPoolPassword(id, password) {
    const query = SQL`UPDATE code_pool SET pool_password = ${password} WHERE pool_id = ${id};`;
    return this.db.query(query);
  }

  async setPoolType(id, type) {
    const query = SQL`UPDATE code_pool SET pool_type = ${type} WHERE pool_id = ${id};`;
    return this.db.query(query);
  }

  async clearPoolPassword(id) {
    const query = SQL`UPDATE code_pool SET pool_password = NULL WHERE pool_id = ${id};`;
    return this.db.query(query);
  }

  async restrictPool(id, status) {
    const query = SQL`UPDATE code_pool SET pool_restricted = ${status} WHERE pool_id = ${id};`;
    return this.db.query(query);
  }

  async isPoolRestricted(id) {
    const query = SQL`SELECT pool_restricted FROM code_pool WHERE pool_id = ${id};`;
    const res = await this.db.query(query);
    if (res[0].length === 0) {
      return undefined;
    }
    return res[0].pool_restricted;
  }

  async hasCodeInPool(member, pool) {
    const query = SQL`SELECT count(cm.code) as count
      FROM code_pool_member cm
      WHERE granted_to = ${member.id} and pool_id = ${pool};`;
    const res = await this.db.query(query);
    if (res[0].length === 0) {
      return undefined;
    }
    return res[0].count > 0;
  }

  async isPoolPublic(id) {
    const query = SQL`SELECT pool_public FROM code_pool WHERE pool_id = ${id};`;
    const res = await this.db.query(query);
    if (res[0].length === 0) {
      return undefined;
    }
    return res[0].pool_public;
  }

  async setPoolGuild(id, guildId) {
    const query = SQL`UPDATE code_pool SET pool_default_guild = ${guildId} WHERE pool_id = ${id};`;
    return this.db.query(query);
  }

  async setPoolPublic(id, status) {
    const query = SQL`UPDATE code_pool SET pool_public = ${status} WHERE pool_id = ${id};`;
    return this.db.query(query);
  }

  async addPoolManager(id, manager) {
    const query = SQL`INSERT IGNORE INTO code_pool_manager VALUES (${id}, ${manager});`;
    return this.db.query(query);
  }

  async addPoolManagers(id, newManagers) {
    const query = SQL`INSERT IGNORE INTO code_pool_manager VALUES ?;`;
    query.values = newManagers.map(manager => ([id, manager]));
    return this.db.query(query);
  }

  async removePoolManager(id, manager) {
    const query = SQL`DELETE FROM code_pool_manager WHERE pool_id = ${id} AND pool_manager = ${manager}`;
    return this.db.query(query);
  }

  async removePoolManagers(id, removeManagers) {
    const query = SQL`DELETE FROM code_pool_manager WHERE pool_id = ${id} AND pool_manager in (?)`;
    query.values = removeManagers;
    return this.db.query(query);
  }

  async addCode(id, platform, adder, grantedTo, grantedBy, code) {
    const query = SQL`INSERT IGNORE INTO code_pool_member
      VALUES (
        ${id},
        ${platform || 'pc'},
        ${adder},
        NOW(),
        ${grantedTo},
        ${grantedBy},
        ${grantedTo ? new Date.toLocaleString() : undefined},
        ${code})`;
    return this.query.db(query);
  }

  async getCode(code) {
    const query = SQL`SELECT * FROM code_pool_member WHERE code = ${code};`;
    return (await this.db.query(query))[0];
  }

  async getCodesInPools(poolIds) {
    const query = SQL`SELECT * from code_pool_member WHERE pool_id in (${poolIds})`;
    const res = await this.db.query(query);
    let codes = [];
    if (res[0]) {
      logger.debug(JSON.stringify(res[0]));
      codes = res[0].map(row => ({
        id: row.pool_id,
        platform: row.platform,
        addedBy: row.added_by || null,
        addedOn: JSON.stringify(new Date(row.added_on)) || null,
        grantedTo: row.granted_to || null,
        grantedBy: row.granted_by || null,
        grantedOn: row.granted_on === null ? null : JSON.stringify(new Date(row.granted_on)),
        code: row.code,
      }));
    }
    return codes;
  }

  async grantCode(code, grantedTo, grantedBy, platform) {
    const query = SQL`UPDATE code_pool_member
      SET granted_to = ${grantedTo},
        granted_by = ${grantedBy},
        granted_on = NOW()
      WHERE code=${code}
        AND platform=${platform};`;
    return this.db.query(query);
  }

  async revokeCode(code, poolId) {
    const query = SQL`UPDATE code_pool_member
      SET granted_to = NULL,
        granted_by = NULL,
        granted_on = NULL
      WHERE code = ${code}
        AND pool_id = ${poolId};`;
    return this.db.query(query);
  }

  async getNextCodeInPool(platform, pool) {
    const any = 'ANY';
    const query = SQL`
      SELECT
        m.code,
        m.added_on as addedOn,
        m.granted_to as grantedTo,
        p.pool_password as password,
        m.platform as platform
      FROM
        code_pool_member as m,
        code_pool as p
      WHERE m.platform = ${platform}
        AND p.pool_id = ${pool}
        AND p.pool_id = m.pool_id
        AND (m.granted_to IS NULL OR m.granted_to = ${any})
      ORDER BY m.added_on LIMIT 1;`;
    const res = await this.db.query(query);
    if (res[0].length === 0) {
      return undefined;
    }
    return res[0];
  }

  async addCodes(codes) {
    const query = SQL`INSERT IGNORE INTO code_pool_member VALUES ?;`;
    const val = codes.map(code => [
      code.id,
      code.platform || 'pc',
      code.adder,
      JSON.stringify(new Date()),
      code.grantedTo,
      code.grantedBy,
      code.grantedTo ? JSON.stringify(new Date()) : null,
      code.code,
    ]);
    query.values = [val];
    return this.db.query(query);
  }

  async getPoolsUserManages(user) {
    const query = SQL`SELECT code_pool_manager.pool_id,
      code_pool.pool_name as name,
        COUNT(code_pool_member.code) as len
      FROM code_pool_manager
      LEFT JOIN code_pool
        ON code_pool.pool_id = code_pool_manager.pool_id
      LEFT JOIN code_pool_member
        ON (code_pool_member.pool_id = code_pool_manager.pool_id)
      WHERE code_pool_manager.pool_manager = ${user.id}
      GROUP BY code_pool_manager.pool_id;`;
    const res = await this.db.query(query);

    if (!(res && res[0]) || res[0].length === 0) {
      return [];
    }
    return res[0];
  }

  async userManagesPool(user, pool) {
    const query = SQL`SELECT pool_id FROM code_pool_manager WHERE pool_manager = ${user.id} AND pool_id = ${pool}`;
    const res = await this.db.query(query);
    if (res[0].length === 0) {
      return false;
    }
    return true;
  }

  async getGuildsPool(guild) {
    const query = SQL`SELECT pool_id FROM code_pool WHERE pool_default_guild = ${guild.id};`;
    const res = await this.db.query(query);
    if (res[0].length === 0) {
      return [];
    }
    return res[0][0];
  }

  async getUserCodes(user) {
    const query = SQL`SELECT p.pool_name, m.platform, m.code
      FROM code_pool_member as m, code_pool as p
      WHERE m.granted_to = ${user.id} and m.pool_id = p.pool_id;`;
    return (await this.db.query(query))[0];
  }
}

module.exports = PromocodeQueries;
