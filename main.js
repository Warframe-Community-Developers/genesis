'use strict';

const Genesis = require('./src/bot');

const localShards = parseInt(process.env.LOCAL_SHARDS, 10) || 1;
const shardOffset = parseInt(process.env.SHARD_OFFSET, 10) || 0;

const commandManifest = require('./commands.json');

const shards = new Array(localShards)
  .fill(0, 0, localShards + 1)
  .map((val, index) => index + shardOffset);

new Genesis(process.env.TOKEN, {
  prefix: process.env.PREFIX,
  owner: process.env.OWNER,
  commandManifest,
  shards,
}).start();
