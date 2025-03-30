#!/bin/bash

# Script to send a winning board configuration to the Tic Tac Toe API server

# Configuration
SERVER_HOST="localhost"
SERVER_PORT="${TIC_TAC_PORT:-10101}"  # Use TIC_TAC_PORT env var or default to 10101
ENDPOINT="/games/evaluate"
URL="http://${SERVER_HOST}:${SERVER_PORT}${ENDPOINT}"

# Colors for console output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Winning board with 'X' in the top row
WINNING_BOARD='{
  "board": [
    ["X", "X", "X"],
    ["O", "O", null],
    [null, null, null]
  ],
  "winLength": 3
}'

echo -e "${YELLOW}Sending winning board to: ${URL}${NC}"
echo -e "${YELLOW}Board configuration:${NC}"
echo "$WINNING_BOARD" | jq . 2>/dev/null || echo "$WINNING_BOARD"

# Send the request
response=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$WINNING_BOARD" \
  "$URL")

# Check if curl command was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to connect to the server at ${URL}${NC}"
  exit 1
fi

# Check if the response is valid JSON
if echo "$response" | jq . >/dev/null 2>&1; then
  # Format and display the response
  echo -e "${GREEN}Server response:${NC}"
  echo "$response" | jq .
  
  # Check if there's a winner
  winner=$(echo "$response" | jq -r '.winner // "null"')
  
  if [ "$winner" != "null" ]; then
    echo -e "${GREEN}Success! Winner: ${winner}${NC}"
    exit 0
  else
    echo -e "${YELLOW}No winner detected!${NC}"
    exit 2
  fi
else
  # Response is not valid JSON
  echo -e "${RED}Error: Invalid response from server${NC}"
  echo "$response"
  exit 3
fi
