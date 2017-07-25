#!/bin/bash
echo "Running bot.js"

until node ./bot.js
do
  if [ $? -eq 1 ]
  then
    echo "Exited with an error"
    break
  fi
  echo "Restarting..."
done
