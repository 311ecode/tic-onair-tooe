#!/bin/bash

# Script to send a board configuration to the Tic Tac Toe API server

# Configuration
SERVER_HOST="localhost"
SERVER_PORT="${TIC_TAC_PORT:-10101}"  # Use TIC_TAC_PORT env var or default to 10101
ENDPOINT="/games/evaluate"
URL="http://${SERVER_HOST}:${SERVER_PORT}${ENDPOINT}"

# Colors for console output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default board configurations
HORIZONTAL_X_WIN='{
  "board": [
    ["X", "X", "X"],
    ["O", "O", null],
    [null, null, null]
  ],
  "winLength": 3
}'

VERTICAL_O_WIN='{
  "board": [
    ["X", "O", "X"],
    [null, "O", null],
    [null, "O", null]
  ],
  "winLength": 3
}'

DIAGONAL_X_WIN='{
  "board": [
    ["X", "O", null],
    [null, "X", "O"],
    [null, null, "X"]
  ],
  "winLength": 3
}'

NO_WINNER='{
  "board": [
    ["X", "O", "X"],
    ["X", "O", "O"],
    ["O", "X", "X"]
  ],
  "winLength": 3
}'

# Function to display available board configurations
show_boards() {
  echo -e "${BLUE}Available pre-configured boards:${NC}"
  echo -e "  ${YELLOW}1${NC}) Horizontal X win"
  echo -e "  ${YELLOW}2${NC}) Vertical O win"
  echo -e "  ${YELLOW}3${NC}) Diagonal X win"
  echo -e "  ${YELLOW}4${NC}) No winner (draw)"
  echo
}

# Function to send a board to the server
send_board() {
  local board_data=$1
  
  echo -e "${YELLOW}Sending board to: ${URL}${NC}"
  echo -e "${YELLOW}Board configuration:${NC}"
  echo "$board_data" | jq . 2>/dev/null || echo "$board_data"
  
  # Send the request
  response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$board_data" \
    "$URL")
  
  # Check if curl command was successful
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to connect to the server at ${URL}${NC}"
    return 1
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
    else
      echo -e "${YELLOW}No winner detected!${NC}"
    fi
  else
    # Response is not valid JSON
    echo -e "${RED}Error: Invalid response from server${NC}"
    echo "$response"
    return 1
  fi
  
  return 0
}

# Main script logic
if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
  echo "Usage: $0 [board_number]"
  echo "  board_number: 1-4 for pre-configured boards (optional)"
  echo "  If no board_number is provided, you will be prompted to choose one"
  show_boards
  exit 0
fi

# If a board number is provided as an argument
if [ -n "$1" ]; then
  case "$1" in
    1) send_board "$HORIZONTAL_X_WIN" ;;
    2) send_board "$VERTICAL_O_WIN" ;;
    3) send_board "$DIAGONAL_X_WIN" ;;
    4) send_board "$NO_WINNER" ;;
    *)
      echo -e "${RED}Invalid board number: $1${NC}"
      show_boards
      exit 1
      ;;
  esac
  exit $?
fi

# Interactive mode if no arguments provided
show_boards
echo -e "${BLUE}Enter board number (1-4):${NC} "
read -r board_num

case "$board_num" in
  1) send_board "$HORIZONTAL_X_WIN" ;;
  2) send_board "$VERTICAL_O_WIN" ;;
  3) send_board "$DIAGONAL_X_WIN" ;;
  4) send_board "$NO_WINNER" ;;
  *)
    echo -e "${RED}Invalid selection: $board_num${NC}"
    exit 1
    ;;
esac

exit $?
