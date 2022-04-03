import fs from 'fs';

import { LangType, ModLogEntry } from '@/types';
import db from '.';
import { Statement } from 'better-sqlite3';

interface GuildId {
  guildId: string;
}

interface GuildUser extends GuildId {
  userId: string;
}

interface GuildUserDate extends GuildUser {
  date: string; // ISO
}
interface GuildChannelUser extends GuildUserDate {
  channelId: string;
}

interface Count {
  count: number;
}

interface UserCount extends Count {
  userId: string;
}

interface DateCount extends Count {
  date: string;
}

const BOOLEAN_KEYS = ['silent'];

function humanFileSize(bytes: number, dp = 1) {
  const threshold = 1024;
  if (Math.abs(bytes) < threshold) {
    return bytes + ' B';
  }
  const units = ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= threshold;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= threshold &&
    u < units.length - 1
  );

  return bytes.toFixed(dp) + ' ' + units[u];
}

function snakeToCamelCase(snake: string) {
  return snake.replace(/_(.)/g, (g) => g.replace('_', '').toUpperCase());
}

const arrayStatements: Record<string, Statement[]> = {};

function getArrayStatement(key: string, sql: string, arr: any[]) {
  if (!(key in arrayStatements)) {
    arrayStatements[key] = [];
  }
  if (!arrayStatements[key][arr.length]) {
    const statement = db.prepare(
      sql.replace('ARRAY_VALUES', arr.map(() => '?').join(','))
    );
    arrayStatements[key][arr.length] = statement;
  }
  return arrayStatements[key][arr.length];
}

function makeGetAllWithArray<P, R>(key: string, sql: string) {
  return (params: P, array: string[]) => {
    const statement = getArrayStatement(key, sql, array);
    return sqlToJs(statement.all(...array, jsToSql(params))) as R[];
  };
}

function makeStatementWithArray<P>(key: string, sql: string) {
  return (params: P, array: string[]) => {
    const statement = getArrayStatement(key, sql, array);
    return statement.run(...array, jsToSql(params));
  };
}

function sqlToJs(rows: any[]) {
  if (Array.isArray(rows)) {
    return rows.map((row) => {
      const ret: Record<string, any> = {};
      for (const [key, value] of Object.entries(row)) {
        const camelCaseKey = snakeToCamelCase(key);
        if (key.endsWith('_id')) {
          ret[camelCaseKey] =
            typeof value === 'bigint' || typeof value === 'number'
              ? String(value)
              : value;
        } else if (key in BOOLEAN_KEYS) {
          ret[camelCaseKey] = value === 1;
        } else if (key === 'utc_date') {
          ret['date'] = value;
        } else if (typeof value === 'bigint') {
          ret[camelCaseKey] = Number(value);
        } else {
          ret[camelCaseKey] = value;
        }
      }
      return ret;
    });
  }
  return null;
}

function jsToSql<T>(params: T) {
  const ret = {} as any;
  Object.entries(params).forEach(([key, value]) => {
    if (BOOLEAN_KEYS.includes(key)) {
      ret[key] = value ? 1 : 0;
    } else if (Array.isArray(value)) {
      ret[key] = value.join(', ');
    } else {
      ret[key] = value;
    }
  });
  return ret;
}

function makeGetAllRows<P, R>(sql: string) {
  const statement = db.prepare<P>(sql);
  return (params: P) => sqlToJs(statement.all(jsToSql(params))) as R[];
}

function makeStatement<P>(sql: string) {
  const statement = db.prepare<P>(sql);
  return (params: P) => statement.run(jsToSql(params));
}

export const getDatabaseFileSize = () => {
  const fileName = db.name;
  if (fs.existsSync(fileName)) {
    return humanFileSize(fs.statSync(fileName).size);
  }
};

export const getTop3EmojiForUser = makeGetAllRows<
  GuildUser,
  Count & { emoji: string }
>(`
    SELECT emoji, SUM(emoji_count) as count
    FROM emojis
    WHERE guild_id = $guildId AND user_id = $userId
    GROUP BY emoji
    ORDER BY count DESC
    LIMIT 3
`);

export const getVoiceSecondsForUser = makeGetAllRows<GuildUser, Count>(`
    SELECT SUM(second_count) as count
    FROM voice
    WHERE guild_id = $guildId AND user_id = $userId
`);

export const getDeletesForUser = makeGetAllRows<GuildUser, Count>(`
    SELECT SUM(delete_count) as count
    FROM deletes
    WHERE guild_id = $guildId AND user_id = $userId
`);

export const getActiveUserMessages = makeGetAllRows<
  GuildId & { threshold: number },
  UserCount
>(`
    SELECT user_id, SUM(message_count) as count
    FROM messages
    WHERE guild_id = $guildId 
    GROUP BY user_id
    HAVING SUM(message_count) > $threshold 
`);

export const getActiveUserVoice = makeGetAllRows<
  GuildId & { threshold: number },
  UserCount
>(`
    SELECT user_id, SUM(second_count) as count
    FROM voice
    WHERE guild_id = $guildId 
    GROUP BY user_id
    HAVING SUM(second_count) > $threshold 
`);

export const getUserMessages = makeGetAllWithArray<
  GuildUser,
  { count: number; channelId?: string; lang?: LangType }
>(
  'getUserMessages',
  `
    WITH records AS (
        SELECT channel_id, lang, message_count, utc_date
        FROM messages
        WHERE guild_id = $guildId AND user_id = $userId AND channel_id NOT IN (ARRAY_VALUES)
    )
        SELECT NULL AS channel_id, NULL AS lang, SUM(message_count) AS count
        FROM records
    UNION ALL 
        SELECT NULL, NULL, SUM(message_count) as count
        FROM records
        WHERE utc_date > datetime('now', '-7 days')
    UNION ALL
        SELECT NULL, lang, SUM(message_count) AS count
        FROM records
        GROUP BY lang
    UNION ALL
        SELECT channel_id, NULL, SUM(message_count) AS count
        FROM records
        GROUP BY channel_id
`
);

export const getMessagesForUsers = makeGetAllWithArray<
  GuildId,
  { count: number; userId: string }
>(
  'getMessagesForUsers',
  `
    SELECT user_id, SUM(message_count)
    FROM messages
    WHERE guild_id = $guildId AND user_id IN (ARRAY_VALUES)
    GROUP BY user_id
    ORDER BY count DESC
`
);

export const getUserChannels = makeGetAllWithArray<
  GuildUser,
  { count: number; channelId: string }
>(
  'getUserChannels',
  `
    SELECT channel_id, SUM(message_count) as count
    FROM messages
    WHERE guild_id = $guildId AND user_id = $userId AND channel_id NOT IN (ARRAY_VALUES)
    GROUP BY channel_id
    ORDER BY count DESC
`
);

export const getChannels = makeGetAllWithArray<
  GuildId,
  { count: number; channelId: string }
>(
  'getChannels',
  `
    SELECT channel_id, SUM(message_count) as count
    FROM messages
    WHERE guild_id = $guildId AND channel_id NOT IN (ARRAY_VALUES)
    GROUP BY channel_id
    ORDER BY count DESC
`
);

export const getLeaderboard = makeGetAllRows<GuildId, UserCount>(`
  SELECT user_id, SUM(message_count) AS count
  FROM messages
  WHERE guild_id = $guildId
  GROUP BY user_id
  ORDER BY count DESC
`);

export const getChannelLeaderboard = makeGetAllWithArray<GuildId, UserCount>(
  'getChannelLeaderboard',
  `
  SELECT user_id, SUM(message_count) as count
  FROM messages
  WHERE guild_id = $guildId AND channel_id IN (ARRAY_VALUES)
  GROUP BY user_id
  ORDER BY count DESC
`
);

export const getJapaneseLeaderboard = makeGetAllRows<
  {
    guildId: string;
    threshold: number;
  },
  {
    userId: string;
    jpRatio: number;
  }
>(`
    WITH lang_usage AS (
        SELECT user_id, COALESCE(SUM(CASE WHEN lang = 'JP' THEN message_count END),0) as jp_count, SUM(message_count) as total
        FROM messages
        WHERE guild_id = $guildId AND lang IN ('EN', 'JP')
        GROUP BY user_id
        HAVING SUM(message_count) > $threshold
    )
        SELECT user_id, 100.0 * jp_count / total AS jp_ratio
        FROM lang_usage
        ORDER BY jp_ratio DESC
`);

export const getEnglishLeaderboard = makeGetAllRows<
  {
    guildId: string;
    threshold: number;
  },
  { userId: string; enRatio: number }
>(`
    WITH lang_usage AS (
        SELECT user_id, COALESCE(SUM(CASE WHEN lang = 'EN' THEN message_count END),0) as en_count, SUM(message_count) as total
        FROM messages
        WHERE guild_id = $guildId AND lang IN ('EN', 'JP')
        GROUP BY user_id
        HAVING SUM(message_count) > $threshold
    )
        SELECT user_id, 100.0 * en_count / total AS en_ratio
        FROM lang_usage
        ORDER BY en_ratio DESC
`);

export const getEmojiLeaderboarByNumUsers = makeGetAllRows<
  GuildId,
  UserCount & { emoji: string }
>(`
    WITH emoji_counts AS (
        SELECT emoji, SUM(count) as count, COUNT(user_id) AS spread
        FROM (
            SELECT emoji, user_id, SUM(emoji_count) as count
            FROM emojis
            WHERE guild_id = $guildId
            GROUP BY emoji, user_id
            ORDER BY count DESC
        ) AS el
        GROUP BY emoji
    )
        SELECT * from emoji_counts
        ORDER BY spread DESC
`);

export const getEmojiLeaderboard = makeGetAllRows<
  GuildId,
  { emoji: string; count: number }
>(`
  SELECT emoji, SUM(emoji_count) as count
  FROM emojis
  WHERE guild_id = $guildId
  GROUP BY emoji
  ORDER BY count DESC
`);

export const getSingleEmojiLeaderboard = makeGetAllRows<
  GuildId & { emojiName: string },
  UserCount
>(`
  SELECT user_id, SUM(emoji_count) as count
  FROM emojis
  WHERE guild_id = $guildId AND emoji = $emojiName
  GROUP BY user_id
  ORDER BY count DESC
`);

export const getVoiceLeaderboard = makeGetAllRows<GuildId, UserCount>(`
  SELECT user_id, SUM(second_count) as count
  FROM voice
  WHERE guild_id = $guildId
  GROUP BY user_id
  ORDER BY count DESC
`);

export const getUserActivity = makeGetAllRows<GuildUser, DateCount>(`
    SELECT SUM(message_count) as count, utc_date
    FROM messages
    WHERE guild_id = $guildId AND user_id = $userId
    GROUP BY utc_date
    ORDER BY utc_date ASC
`);

export const getChannelActivity = makeGetAllWithArray<GuildId, DateCount>(
  'getChannelActivity',
  `
    SELECT SUM(message_count) as count, utc_date
    FROM messages
    WHERE guild_id = $guildId AND channel_id IN (ARRAY_VALUES)
    GROUP BY utc_date
    ORDER BY utc_date ASC
`
);

export const getServerActivity = makeGetAllRows<GuildId, DateCount>(`
    SELECT SUM(message_count) as count, utc_date
    FROM messages
    WHERE guild_id = $guildId
    GROUP BY utc_date
    ORDER BY utc_date ASC
`);

export const getModLogForGuild = makeGetAllRows<GuildId, UserCount>(`
    SELECT user_id, COUNT(content) as count
    FROM modlog
    WHERE guild_id = $guildId 
    GROUP BY user_id
`);

export const getModLogForUser = makeGetAllRows<GuildUser, ModLogEntry>(`
    SELECT * FROM modlog
    WHERE guild_id = $guildId AND user_id = $userId
    ORDER BY utc_date ASC
`);

export const deleteModLogEntries = makeStatementWithArray<GuildUser>(
  'deleteModLogEntries',
  `
    WITH indexed AS (
      SELECT *, ROW_NUMBER() OVER (ORDER BY utc_date ASC) index FROM modlog
      WHERE guild_id = $guildId AND user_id = $userId
      ORDER BY utc_date ASC
    )
      DELTE FROM indexed
      WHERE index IN (ARRAY_VALUES)
`
);

export const clearModLogForUser = makeStatement<GuildUser>(`
    DELETE FROM modlog
    WHERE guild_id = $guildId AND user_id = $userId
`);

export const clearModLogForGuild = makeStatement<GuildId>(`
    DELETE FROM modlog
    WHERE guild_id = $guildId
`);

export const getWatched = makeGetAllRows<GuildId, { userId: string }>(`
    SELECT user_id
    FROM watched
    WHERE guild_id = $guildId
`);

export const deleteWatched = makeStatement<GuildUser>(`
    DELETE FROM watched  
    WHERE guild_id = $guildId AND user_id = $userId
`);

export const clearWatchedForGuild = makeStatement<GuildId>(`
    DELETE FROM watched  
    WHERE guild_id = $guildId
`);

export const deleteGuild = makeStatement<GuildId>(`
  DELETE FROM guilds
  WHERE guild_id = $guildId
`);

export const insertServer = makeStatement<GuildId>(`
    INSERT OR IGNORE INTO guilds (guild_id)
    VALUES ($guildId)
`);

export const insertMessages = makeStatement<
  GuildChannelUser & {
    lang: LangType;
    messageCount: number;
  }
>(`
    INSERT INTO messages (guild_id, channel_id, user_id, lang, utc_date, message_count)
    VALUES($guildId, $channelId, $userId, $lang, $date, $messageCount)
    ON CONFLICT (guild_id, channel_id, user_id, lang, utc_date) DO UPDATE
    SET message_count = messages.message_count + EXCLUDED.message_count
`);

export const insertEmojis = makeStatement<
  GuildUserDate & {
    emoji: string;
    emojiCount: number;
  }
>(`
    INSERT INTO emojis (guild_id, user_id, emoji, utc_date, emoji_count)
    VALUES($guildId, $userId, $emoji, $date, $emojiCount)
    ON CONFLICT (guild_id, user_id, emoji, utc_date) DO UPDATE
    SET emoji_count = emojis.emoji_count + EXCLUDED.emoji_count
`);

export const insertVoiceSeconds = makeStatement<
  GuildUserDate & {
    secondCount: number;
  }
>(`
    INSERT INTO voice (guild_id, user_id, utc_date, second_count)
    VALUES($guildId, $userId, $date, $secondCount)
    ON CONFLICT (guild_id, user_id, utc_date) DO UPDATE
    SET second_count = voice.second_count + EXCLUDED.second_count
`);

export const insertDeletes = makeStatement<
  GuildUserDate & {
    deleteCount: number;
  }
>(`
    INSERT INTO deletes (guild_id, user_id, utc_date, delete_count)
    VALUES($guildId, $userId, $date, $deleteCount)
    ON CONFLICT (guild_id, user_id, utc_date) DO UPDATE
    SET delete_count = deletes.delete_count + EXCLUDED.delete_count
`);

export const insertStickers = makeStatement<
  GuildUserDate & {
    sticker: string;
    stickerCount: number;
  }
>(`
    INSERT INTO stickers (guild_id, user_id, sticker, utc_date, sticker_count)
    VALUES($guildId, $userId, $sticker, $date, $stickerCount)
    ON CONFLICT (guild_id, user_id, sticker, utc_date) DO UPDATE
    SET sticker_count = stickers.sticker_count + EXCLUDED.sticker_count
`);

export const insertCommands = makeStatement<
  GuildUserDate & {
    command: string;
    commandCount: number;
  }
>(`
    INSERT INTO commands (guild_id, user_id, command, utc_date, command_count)
    VALUES($guildId, $userId, $command, $date, $commandCount)
    ON CONFLICT (guild_id, user_id, command, utc_date) DO UPDATE
    SET command_count = commands.command_count + EXCLUDED.command_count
`);

type DbModLog = GuildUserDate & {
  issuerId: string;
  messageLink: string;
  kind: string;
  silent: boolean;
  content: string;
};
export const insertModLog = makeStatement<DbModLog>(`
    INSERT INTO modlog (guild_id, user_id, utc_date, issuer_id, message_link, kind, silent, content)
    VALUES($guildId, $userId, $date, $issuerId, $messageLink, $kind, $silent, $content)
`);

export const insertWatchedUser = makeStatement<GuildUser>(`
    INSERT OR IGNORE INTO watched (guild_id, user_id)
    VALUES($guildId, $userId)
`);

const tablesToClean = [
  'messages',
  'emojis',
  'voice',
  'deletes',
  'stickers',
  'commands',
];

const clearOldRecordStatements = (() => {
  const statements = [];
  for (const table of tablesToClean) {
    statements.push(
      db.prepare(`
            DELETE FROM ${table} WHERE utc_date < datetime('now', '-30 days'); 
        `)
    );
  }
  return statements;
})();

export const clearOldRecords = () => {
  clearOldRecordStatements.forEach((statement) => statement.run());
};
