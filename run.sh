#!/bin/bash
echo "Running bot.js"

until node ./bot.js
do
  if [ $? -eq 0 ]
  then
    echo "Shutting down the bot"
    break
  fi
  echo "Restarting..."
done
