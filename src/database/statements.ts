import logger from '@/logger';
import { LangType } from '@/types';
import db from '.';

export const getMessagesForUsers = db.prepare<{
  guildId: string;
  userIds: string[];
}>(`
    SELECT user_id, SUM(message_count) as count
    FROM messages
    WHERE guild_id = $guildId AND user_id IN ($userIds)
    GROUP BY user_id
`);

export const getTop3EmojiForUser = db.prepare(`
    SELECT emoji, SUM(emoji_count) as count
    FROM emojis
    WHERE guild_id = $guildId AND user_id = $userId
    GROUP BY emoji
    ORDER BY count DESC
    LIMIT 3
`);

export const getVoiceMinutesForUser = db.prepare(`
    SELECT SUM(minute_count) as count
    FROM voice
    WHERE guild_id = $guildId AND user_id = $userId
`);

export const getDeletesForUser = db.prepare(`
    SELECT SUM(delete_count) as count
    FROM deletes
    WHERE guild_id = $guildId AND user_id = $userId
`);

export const getLangPercentForUser = db.prepare(`
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

export const getLeaderboard = db.prepare(`
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

export const getChannelLeaderboard = db.prepare(`
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

export const getJapaneseLeaderboard = db.prepare(`
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

export const getEnglishLeaderboard = db.prepare(`
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

// no percentile_disc in sqlite
// export const getEmojiLeaderboardWithPercentile = db.prepare(`
//     WITH emoji_counts AS (
//         SELECT emoji, PERCENTILE_DISC($percentile) WITHIN GROUP(ORDER BY count) AS median, COUNT(user_id) AS spread
//         FROM (
//             SELECT emoji, user_id, SUM(emoji_count) as count
//             FROM emojis
//             WHERE guild_id = $guildId
//             GROUP BY emoji, user_id
//             ORDER BY count DESC
//         ) AS el
//         GROUP BY emoji
//     )
//         SELECT *, RANK() OVER (ORDER BY median DESC) from emoji_counts
// `);

export const getEmojiLeaderboarByNumUsers = db.prepare(`
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

export const getEmojiLeaderboard = db.prepare(`
    SELECT *, RANK() OVER (ORDER BY count DESC)
    FROM (
        SELECT emoji, SUM(emoji_count) as count
        FROM emojis
        WHERE guild_id = $guildId
        GROUP BY emoji
    ) AS el
`);

export const getSingleEmojiLeaderboard = db.prepare(`
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

export const getVoiceLeaderboard = db.prepare(`
    WITH ranked AS (
        SELECT *, RANK() OVER (ORDER BY count DESC)
        FROM (
            SELECT user_id, SUM(minute_count) as count
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

export const getUserActivity = db.prepare(`
    SELECT SUM(message_count) as count, utc_date
    FROM messages
    WHERE guild_id = $guildId AND user_id = $userId
    GROUP BY utc_date
    ORDER BY utc_date ASC
`);

export const getChannelActivity = db.prepare(`
    SELECT SUM(message_count) as count, utc_date
    FROM messages
    WHERE guild_id = $guildId AND channel_id IN ($channelIds)
    GROUP BY utc_date
    ORDER BY utc_date ASC
`);

export const getServerActivity = db.prepare(`
    SELECT SUM(message_count) as count, utc_date
    FROM messages
    WHERE guild_id = $guildId
    GROUP BY utc_date
    ORDER BY utc_date ASC
`);

export const getModLog = db.prepare(`
    SELECT * FROM modlog
    WHERE guild_id = $guildId AND user_id = $userId
    ORDER BY utc_date ASC
`);

export const deleteModLogEntry = db.prepare(`
    DELETE FROM modlog
    WHERE guild_id = $guildId AND user_id = $userId
    ORDER BY utc_date ASC
    LIMIT 1 OFFSET $index
`);

export const clearModLogForUser = db.prepare(`
    DELETE FROM modlog
    WHERE guild_id = $guildId AND user_id = $userId
`);

export const insertMessages = db.prepare<{
  guildId: string;
  channelId: string;
  userId: string;
  lang: LangType;
  date: string;
  messageCount: number;
}>(`
    INSERT INTO messages (guild_id, channel_id, user_id, lang, utc_date, message_count)
    VALUES($guildId, $channelId, $userId, $lang, $date, $messageCount)
    ON CONFLICT (guild_id, channel_id, user_id, lang, utc_date) DO UPDATE
    SET message_count = messages.message_count + EXCLUDED.message_count
`);
// `
// INSERT INTO messages (guild_id, channel_id, user_id, lang, utc_date, message_count)
//     VALUES(123456, 123456, 123456, 'JP', 2022-02-14, 1)
//     ON CONFLICT (guild_id, channel_id, user_id, lang, utc_date) DO UPDATE
//     SET message_count = messages.message_count + EXCLUDED.message_count;
// `;

export const insertEmojis = db.prepare(`
    INSERT INTO emojis (guild_id, user_id, emoji, utc_date, emoji_count)
    VALUES($guildId, $userId, $emoji, $date, $emojiCount)
    ON CONFLICT (guild_id, user_id, emoji, utc_date) DO UPDATE
    SET emoji_count = emojis.emoji_count + EXCLUDED.emoji_count
`);

export const insertVoiceMinutes = db.prepare(`
    INSERT INTO voice (guild_id, user_id, utc_date, minute_count)
    VALUES($guildId, $userId, $date, $minuteCount)
    ON CONFLICT (guild_id, user_id, utc_date) DO UPDATE
    SET minute_count = voice.minute_count + EXCLUDED.minute_count
`);
export const insertDeletes = db.prepare(`
    INSERT INTO deletes (guild_id, user_id, utc_date, delete_count)
    VALUES($guildId, $userId, $date, $deleteCount)
    ON CONFLICT (guild_id, user_id, utc_date) DO UPDATE
    SET delete_count = deletes.delete_count + EXCLUDED.delete_count
`);

export const insertStickers = db.prepare(`
    INSERT INTO stickers (guild_id, user_id, sticker, utc_date, sticker_count)
    VALUES($guildId, $userId, $sticker, $date, $stickerCount)
    ON CONFLICT (guild_id, user_id, sticker, utc_date) DO UPDATE
    SET sticker_count = stickers.sticker_count + EXCLUDED.sticker_count
`);

export const insertCommands = db.prepare(`
    INSERT INTO commands (guild_id, user_id, command, utc_date, command_count)
    VALUES($guildId, $userId, $command, $date, $commandCount)
    ON CONFLICT (guild_id, user_id, command, utc_date) DO UPDATE
    SET command_count = commands.command_count + EXCLUDED.command_count
`);

const tablesToClean = [
  'messages',
  'emojis',
  'voice',
  'deletes',
  'stickers',
  'commands',
];

export const clearOldRecordStatements = (() => {
  const statements = [];
  for (const table of tablesToClean) {
    statements.push(
      db.prepare(`
            DELETE FROM ${table} WHERE utc_date < datetime('now', '-30 days'); 
        `).run
    );
  }
  return statements;
})();
