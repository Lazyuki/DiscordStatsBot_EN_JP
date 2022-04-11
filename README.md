# Discord-Stats-Bot

Show various stats for the last 30 days in a server.

This is made for English & Japanese servers.

## Testing

1. Set `DEBUG=true` in `.env`
2. Run the bot
   ```bash
   npm run dev
   ```

## Deploying

1. Install dependencies

   ```bash
   npm install
   ```

2. Install pm2-logrotate

   ```bash
   ./node_modules/.bin/pm2 install pm2-logrotate
   ```

3. Create `.env` based on `sample.env`

4. Run the bot

   ```bash
   npm start
   ```
