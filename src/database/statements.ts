import fs from 'fs';

import { LangType } from '@/types';
import db from '.';

interface GuildUser {
  guildId: string;
  userId: string;
}

interface GuildUserDate extends GuildUser {
  date: string; // ISO
}
interface GuildChannelUser extends GuildUserDate {
  channelId: string;
}

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

export const getDatabaseFileSize = () => {
  const fileName = db.name;
  if (fs.existsSync(fileName)) {
    return humanFileSize(fs.statSync(fileName).size);
  }
};

export const getMessagesForUsers = db.prepare<{
  guildId: string;
  userIds: string[];
}>(`
    SELECT user_id, SUM(message_count) as count
    FROM messages
    WHERE guild_id = $guildId AND user_id IN ($userIds)
    GROUP BY user_id
`);

export const getTop3EmojiForUser = db.prepare<GuildUser>(`
    SELECT emoji, SUM(emoji_count) as count
    FROM emojis
    WHERE guild_id = $guildId AND user_id = $userId
    GROUP BY emoji
    ORDER BY count DESC
    LIMIT 3
`);

export const getVoiceSecondsForUser = db.prepare<GuildUser>(`
    SELECT SUM(second_count) as count
    FROM voice
    WHERE guild_id = $guildId AND user_id = $userId
`);

export const getDeletesForUser = db.prepare<GuildUser>(`
    SELECT SUM(delete_count) as count
    FROM deletes
    WHERE guild_id = $guildId AND user_id = $userId
`);

export const getLangPercentForUser = db.prepare<
  GuildUser & {
    channelIds: string[];
  }
>(`
    WITH records AS (
        SELECT channel_id, lang, message_count, utc_date
        FROM messages
        WHERE guild_id = $guildId AND user_id = $userId AND channel_id NOT IN ($channelIds)
    )
        SELECT NULL AS channel_id, NULL AS lang, SUM(message_count) AS count
        FROM records
    UNION ALL
        SELECT NULL, lang, SUM(message_count) AS count
        FROM records
        GROUP BY lang
    UNION ALL
        SELECT channel_id, NULL, SUM(message_count) AS count
        FROM records
        GROUP BY channel_id
    UNION ALL 
        SELECT NULL, NULL, SUM(message_count) as count
        FROM records
        WHERE utc_date > datetime('now', '-7 days')
`);

export const getLeaderboard = db.prepare<GuildUser>(`
    WITH ranked AS (
        SELECT *, RANK() OVER(ORDER BY count DESC)
        FROM (
            SELECT user_id, SUM(message_count) AS count
            FROM messages
            WHERE guild_id = $guildId
            GROUP BY user_id
        ) AS lb
    )
        SELECT * FROM ranked
    UNION ALL
        SELECT * FROM ranked WHERE user_id = $userId
`);

export const getChannelLeaderboard = db.prepare<
  GuildUser & {
    channelIds: string[];
  }
>(`
    WITH ranked AS (
        SELECT *, RANK() OVER (ORDER BY count DESC)
        FROM (
            SELECT user_id, SUM(message_count) as count
            FROM messages
            WHERE guild_id = $guildId AND channel_id IN ($channelIds)
            GROUP BY user_id
            ORDER BY count DESC
        ) AS cl
    )
        SELECT * FROM ranked
    UNION ALL
        SELECT * FROM ranked WHERE user_id = $userId
        
`);

export const getJapaneseLeaderboard = db.prepare<{
  guildId: string;
  lowerLimit: number;
}>(`
    WITH lang_usage AS (
        SELECT user_id, COALESCE(SUM(CASE WHEN lang = 'JP' THEN message_count END),0) as jp_count, SUM(message_count) as total
        FROM messages
        WHERE guild_id = $guildId AND lang IN ('EN', 'JP')
        GROUP BY user_id
        HAVING SUM(message_count) > $lowerLimit
    )
        SELECT user_id, 100.0 * jp_count / total AS jp_ratio
        FROM lang_usage
        ORDER BY jp_ratio DESC
`);

export const getEnglishLeaderboard = db.prepare<{
  guildId: string;
  lowerLimit: number;
}>(`
    WITH lang_usage AS (
        SELECT user_id, COALESCE(SUM(CASE WHEN lang = 'EN' THEN message_count END),0) as en_count, SUM(message_count) as total
        FROM messages
        WHERE guild_id = $guildId AND lang IN ('EN', 'JP')
        GROUP BY user_id
        HAVING SUM(message_count) > $lowerLimit
    )
        SELECT user_id, 100.0 * en_count / total AS en_ratio
        FROM lang_usage
        ORDER BY en_ratio DESC
`);

export const getEmojiLeaderboarByNumUsers = db.prepare<{ guildId: string }>(`
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
        SELECT *, RANK() OVER (ORDER BY spread DESC) from emoji_counts
`);

export const getEmojiLeaderboard = db.prepare<{ guildId: string }>(`
    SELECT *, RANK() OVER (ORDER BY count DESC)
    FROM (
        SELECT emoji, SUM(emoji_count) as count
        FROM emojis
        WHERE guild_id = $guildId
        GROUP BY emoji
    ) AS el
`);

export const getSingleEmojiLeaderboard = db.prepare<
  GuildUser & { emojiName: string }
>(`
    WITH ranked AS (
        SELECT *, RANK() OVER (ORDER BY count DESC)
        FROM (
            SELECT user_id, SUM(emoji_count) as count
            FROM emojis
            WHERE guild_id = $guildId AND emoji = $emojiName
            GROUP BY user_id
            ORDER BY count DESC
        ) AS el
    )
        SELECT * FROM ranked
    UNION ALL
        SELECT * FROM ranked WHERE user_id = $userId
`);

export const getVoiceLeaderboard = db.prepare<GuildUser>(`
    WITH ranked AS (
        SELECT *, RANK() OVER (ORDER BY count DESC)
        FROM (
            SELECT user_id, SUM(second_count) as count
            FROM voice
            WHERE guild_id = $guildId
            GROUP BY user_id
            ORDER BY count DESC
        ) AS vl
    )
        SELECT * FROM ranked
    UNION ALL
        SELECT * FROM ranked WHERE user_id = $userId
`);

export const getUserActivity = db.prepare<GuildUser>(`
    SELECT SUM(message_count) as count, utc_date
    FROM messages
    WHERE guild_id = $guildId AND user_id = $userId
    GROUP BY utc_date
    ORDER BY utc_date ASC
`);

export const getChannelActivity = db.prepare<{
  guildId: string;
  channelIds: string;
}>(`
    SELECT SUM(message_count) as count, utc_date
    FROM messages
    WHERE guild_id = $guildId AND channel_id IN ($channelIds)
    GROUP BY utc_date
    ORDER BY utc_date ASC
`);

export const getServerActivity = db.prepare<{ guildId: string }>(`
    SELECT SUM(message_count) as count, utc_date
    FROM messages
    WHERE guild_id = $guildId
    GROUP BY utc_date
    ORDER BY utc_date ASC
`);

export const getModLog = db.prepare<GuildUser>(`
    SELECT * FROM modlog
    WHERE guild_id = $guildId AND user_id = $userId
    ORDER BY utc_date ASC
`);

export const deleteModLogEntry = db.prepare<GuildUser & { index: number }>(`
    DELETE FROM modlog
    WHERE guild_id = $guildId AND user_id = $userId
    ORDER BY utc_date ASC
    LIMIT 1 OFFSET $index
`);

export const clearModLogForUser = db.prepare<GuildUser>(`
    DELETE FROM modlog
    WHERE guild_id = $guildId AND user_id = $userId
`);

export const clearModLogForGuild = db.prepare<{ guildId: string }>(`
    DELETE FROM modlog
    WHERE guild_id = $guildId
`);

export const getWatched = db.prepare<{ guildId: string }>(`
    SELECT user_id FROM watched
    WHERE guild_id = $guildId
`);

export const deleteWatched = db.prepare<GuildUser>(`
    DELETE FROM watched  
    WHERE guild_id = $guildId AND user_id = $userId
`);

export const clearWatchedForGuild = db.prepare<{ guildId: string }>(`
    DELETE FROM watched  
    WHERE guild_id = $guildId
`);

export const deleteGuild = db.prepare<{ guildId: string }>(`
  DELETE FROM guilds
  WHERE guild_id = $guildId
`);

export const dbInsertServer = db.prepare<{ guildId: string }>(`
    INSERT OR IGNORE INTO guilds (guild_id)
    VALUES ($guildId)
`);

export const dbInsertMessages = db.prepare<
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

export const dbInsertEmojis = db.prepare<
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

export const dbInsertVoiceSeconds = db.prepare<
  GuildUserDate & {
    secondCount: number;
  }
>(`
    INSERT INTO voice (guild_id, user_id, utc_date, second_count)
    VALUES($guildId, $userId, $date, $secondCount)
    ON CONFLICT (guild_id, user_id, utc_date) DO UPDATE
    SET second_count = voice.second_count + EXCLUDED.second_count
`);

export const dbInsertDeletes = db.prepare<
  GuildUserDate & {
    deleteCount: number;
  }
>(`
    INSERT INTO deletes (guild_id, user_id, utc_date, delete_count)
    VALUES($guildId, $userId, $date, $deleteCount)
    ON CONFLICT (guild_id, user_id, utc_date) DO UPDATE
    SET delete_count = deletes.delete_count + EXCLUDED.delete_count
`);

export const dbInsertStickers = db.prepare<
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

export const dbInsertCommands = db.prepare<
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

export const dbInsertModLogEntry = db.prepare<
  GuildUserDate & {
    issuerId: string;
    messageLink: string;
    kind: string;
    silent: boolean;
    content: string;
  }
>(`
    INSERT INTO modlog (guild_id, user_id, utc_date, issuer_id, message_link, kind, silent, content)
    VALUES($guildId, $userId, $date, $issuerId, $messageLink, $kind, $silent, $content)
`);

export const dbInsertWatchedUser = db.prepare<GuildUser>(`
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
