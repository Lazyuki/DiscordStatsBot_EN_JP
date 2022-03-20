CREATE TABLE IF NOT EXISTS guilds(
  guild_id BIGINT UNIQUE PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS messages(
  guild_id BIGINT NOT NULL REFERENCES guilds(guild_id),
  channel_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  lang TEXT CHECK(lang IN ('JP', 'EN', 'OL')) NOT NULL, 
  utc_date DATE NOT NULL,
  message_count INT NOT NULL,
  CONSTRAINT messages_pk PRIMARY KEY ( guild_id, channel_id, user_id, lang, utc_date )
);

CREATE TABLE IF NOT EXISTS emojis(
  guild_id BIGINT NOT NULL REFERENCES guilds(guild_id),
  user_id BIGINT NOT NULL,
  emoji TEXT NOT NULL,
  utc_date DATE NOT NULL,
  emoji_count INT NOT NULL,
  CONSTRAINT emojis_pk PRIMARY KEY ( guild_id, user_id, emoji, utc_date )
);

CREATE TABLE IF NOT EXISTS voice(
  guild_id BIGINT NOT NULL REFERENCES guilds(guild_id),
  user_id BIGINT NOT NULL,
  utc_date DATE NOT NULL,
  second_count INT NOT NULL,
  CONSTRAINT voice_pk PRIMARY KEY (guild_id, user_id, utc_date)
);

CREATE TABLE IF NOT EXISTS deletes(
  guild_id BIGINT NOT NULL REFERENCES guilds(guild_id),
  user_id BIGINT NOT NULL,
  utc_date DATE NOT NULL,
  delete_count INT NOT NULL,
  CONSTRAINT deletes_pk PRIMARY KEY (guild_id, user_id, utc_date)
);

CREATE TABLE IF NOT EXISTS stickers(
  guild_id BIGINT NOT NULL REFERENCES guilds(guild_id),
  user_id BIGINT NOT NULL,
  sticker TEXT NOT NULL,
  utc_date DATE NOT NULL,
  sticker_count INT NOT NULL,
  CONSTRAINT sticker_pk PRIMARY KEY (guild_id, user_id, sticker, utc_date)
);

CREATE TABLE IF NOT EXISTS modlog(
  guild_id BIGINT NOT NULL REFERENCES guilds(guild_id),
  user_id BIGINT NOT NULL,
  utc_date DATE NOT NULL,
  issuer_id BIGINT NOT NULL,
  message_link TEXT NOT NULL,
  kind TEXT NOT NULL,
  silent BOOLEAN NOT NULL,
  content TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS watched(
  guild_id BIGINT NOT NULL REFERENCES guilds(guild_id),
  user_id BIGINT NOT NULL,
  CONSTRAINT watched_pk PRIMARY KEY (guild_id, user_id)
);

CREATE TABLE IF NOT EXISTS commands(
  guild_id BIGINT NOT NULL REFERENCES guilds(guild_id),
  user_id BIGINT NOT NULL,
  command TEXT NOT NULL,
  utc_date DATE NOT NULL,
  command_count INTEGER NOT NULL,
  CONSTRAINT commands_pk PRIMARY KEY (guild_id, user_id, command, utc_date)
);


-- indices -- 

-- ,u
CREATE INDEX IF NOT EXISTS message_guild_user_id_idx ON messages(guild_id, user_id);
CREATE INDEX IF NOT EXISTS emoji_guild_user_id_idx ON emojis(guild_id, user_id);
CREATE INDEX IF NOT EXISTS voice_guild_user_id_idx ON voice(guild_id, user_id);
CREATE INDEX IF NOT EXISTS sticker_guild_user_id_idx ON stickers(guild_id, user_id);
CREATE INDEX IF NOT EXISTS delete_guild_user_id_idx ON deletes(guild_id, user_id);

-- ,channel-leaderboard
CREATE INDEX IF NOT EXISTS message_channel_idx ON messages(channel_id);

-- ,warnlog
CREATE INDEX IF NOT EXISTS modlog_guild_user_id_idx ON modlog(guild_id, user_id); 

-- For deleting old ones
CREATE INDEX IF NOT EXISTS message_date_idx ON messages(utc_date); 
CREATE INDEX IF NOT EXISTS emoji_date_idx ON emojis(utc_date);
CREATE INDEX IF NOT EXISTS voice_date_idx ON voice(utc_date);
CREATE INDEX IF NOT EXISTS delete_date_idx ON deletes(utc_date);
CREATE INDEX IF NOT EXISTS sticker_date_idx ON stickers(utc_date);
CREATE INDEX IF NOT EXISTS command_date_idx ON commands(utc_date);
