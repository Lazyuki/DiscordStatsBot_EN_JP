#!/bin/bash
echo "Running bot.js"

until node ./bot.js
do
  exitCode=$?
  if [ $exitCode -eq 0 ]
  then
    echo "Shutting down the bot"
    break
  fi
  if [ $exitCode -ne 2 ]
  then
    echo "There was an error with the bot. Restarting in 10 seconds"
    sleep 10
  fi
  echo "Restarting..."
done
