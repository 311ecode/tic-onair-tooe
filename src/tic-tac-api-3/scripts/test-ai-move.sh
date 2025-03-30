#!/bin/bash

# Function to test the auto-mover feature on the Tic Tac Toe API
test_ai_move() {
  echo "🎮 Testing AI Move Feature on port 10101 🎮"
  echo "---------------------------------------"

  # Set API endpoint
  API_URL="http://localhost:10101/games/move"
  
  # Create an empty 3x3 board in JSON format
  BOARD='[
    [null, null, null],
    [null, null, null],
    [null, null, null]
  ]'
  
  # Initial move (player X moves at 0,0)
  echo "Making initial move at (0,0)..."
  RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{
      "board": '"$BOARD"',
      "x": 0,
      "y": 0,
      "winLength": 3,
      "withAI": true,
      "difficulty": "medium"
    }' \
    "$API_URL")
  
  # Check if the request was successful
  if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to connect to API at $API_URL"
    echo "Make sure the server is running on port 10101"
    return 1
  fi
  
  # Parse and display the response
  echo "Response received:"
  echo "$RESPONSE" | jq '.' 2>/dev/null
  
  # Check if jq command failed (invalid JSON)
  if [ $? -ne 0 ]; then
    echo "❌ Error: Received invalid JSON response"
    echo "Raw response: $RESPONSE"
    return 1
  fi
  
  # Check if response contains an error
  if echo "$RESPONSE" | jq -e 'has("error")' > /dev/null; then
    echo "❌ Error: $(echo "$RESPONSE" | jq -r '.message')"
    
    # Ask for another move
    echo ""
    echo "Play another move? (y/n)"
    read -r CONTINUE
    
    if [[ "$CONTINUE" == "y" || "$CONTINUE" == "Y" ]]; then
      echo "Let's try again with the original empty board."
      # Get coordinates for next move
      echo "Enter x coordinate (0-2):"
      read -r NEXT_X
      echo "Enter y coordinate (0-2):"
      read -r NEXT_Y
      
      # Make next move with empty board
      test_ai_move_with_board "$BOARD" "$NEXT_X" "$NEXT_Y"
    else
      echo "Test completed."
    fi
    return 0
  fi
  
  # Extract AI move from response
  AI_MOVE_X=$(echo "$RESPONSE" | jq -r '.aiMove.x')
  AI_MOVE_Y=$(echo "$RESPONSE" | jq -r '.aiMove.y')
  
  if [[ "$AI_MOVE_X" == "null" || "$AI_MOVE_Y" == "null" ]]; then
    echo "❌ No AI move found in response"
  else
    echo "✅ AI moved at position ($AI_MOVE_X, $AI_MOVE_Y)"
  fi
  
  # Extract updated board
  UPDATED_BOARD=$(echo "$RESPONSE" | jq '.board')
  
  # Extract game status
  WINNER=$(echo "$RESPONSE" | jq -r '.winner')
  GAME_OVER=$(echo "$RESPONSE" | jq -r '.gameOver')
  NEXT_PLAYER=$(echo "$RESPONSE" | jq -r '.nextPlayer')
  
  echo ""
  echo "📋 Game Status:"
  echo "Winner: $WINNER"
  echo "Game Over: $GAME_OVER"
  echo "Next Player: $NEXT_PLAYER"
  
  # Pretty print the board
  echo ""
  echo "📋 Current Board State:"
  echo "$UPDATED_BOARD" | jq -r '
    def cell_display:
      if . == null then " " else . end;
    def row_display:
      map(cell_display) | join(" | ");
    map(row_display) | join("\n---------\n")
  '
  
  echo ""
  echo "Play another move? (y/n)"
  read -r CONTINUE
  
  if [[ "$CONTINUE" == "y" || "$CONTINUE" == "Y" ]]; then
    # Get coordinates for next move
    echo "Enter x coordinate (0-2):"
    read -r NEXT_X
    echo "Enter y coordinate (0-2):"
    read -r NEXT_Y
    
    # Make next move with updated board
    test_ai_move_with_board "$UPDATED_BOARD" "$NEXT_X" "$NEXT_Y"
  else
    echo "Test completed."
  fi
}

# Helper function to make a move with a specific board state
test_ai_move_with_board() {
  local BOARD="$1"
  local X="$2"
  local Y="$3"
  
  echo "Making move at ($X,$Y)..."
  RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{
      "board": '"$BOARD"',
      "x": '"$X"',
      "y": '"$Y"',
      "winLength": 3,
      "withAI": true,
      "difficulty": "medium"
    }' \
    "http://localhost:10101/games/move")
  
  # Parse and display the response
  echo "Response received:"
  echo "$RESPONSE" | jq '.' 2>/dev/null
  
  # Check if response contains an error
  if echo "$RESPONSE" | jq -e 'has("error")' > /dev/null; then
    echo "❌ Error: $(echo "$RESPONSE" | jq -r '.message')"
    
    # Ask for another move
    echo ""
    echo "Play another move? (y/n)"
    read -r CONTINUE
    
    if [[ "$CONTINUE" == "y" || "$CONTINUE" == "Y" ]]; then
      echo "Let's try again with the current board."
      # Get coordinates for next move
      echo "Enter x coordinate (0-2):"
      read -r NEXT_X
      echo "Enter y coordinate (0-2):"
      read -r NEXT_Y
      
      # Make next move with same board
      test_ai_move_with_board "$BOARD" "$NEXT_X" "$NEXT_Y"
    else
      echo "Test completed."
    fi
    return 0
  fi
  
  # Extract AI move from response
  AI_MOVE_X=$(echo "$RESPONSE" | jq -r '.aiMove.x')
  AI_MOVE_Y=$(echo "$RESPONSE" | jq -r '.aiMove.y')
  
  if [[ "$AI_MOVE_X" == "null" || "$AI_MOVE_Y" == "null" ]]; then
    echo "❌ No AI move found in response"
  else
    echo "✅ AI moved at position ($AI_MOVE_X, $AI_MOVE_Y)"
  fi
  
  # Extract updated board
  UPDATED_BOARD=$(echo "$RESPONSE" | jq '.board')
  
  # Extract game status
  WINNER=$(echo "$RESPONSE" | jq -r '.winner')
  GAME_OVER=$(echo "$RESPONSE" | jq -r '.gameOver')
  NEXT_PLAYER=$(echo "$RESPONSE" | jq -r '.nextPlayer')
  
  echo ""
  echo "📋 Game Status:"
  echo "Winner: $WINNER"
  echo "Game Over: $GAME_OVER"
  echo "Next Player: $NEXT_PLAYER"
  
  # Pretty print the board
  echo ""
  echo "📋 Current Board State:"
  echo "$UPDATED_BOARD" | jq -r '
    def cell_display:
      if . == null then " " else . end;
    def row_display:
      map(cell_display) | join(" | ");
    map(row_display) | join("\n---------\n")
  '
  
  # Check if game is over
  if [ "$GAME_OVER" == "true" ]; then
    echo ""
    echo "🎮 Game Over! 🎮"
    if [ "$WINNER" != "null" ]; then
      echo "🏆 Winner: Player $WINNER 🏆"
    else
      echo "🤝 It's a draw! 🤝"
    fi
    return 0
  fi
  
  echo ""
  echo "Play another move? (y/n)"
  read -r CONTINUE
  
  if [[ "$CONTINUE" == "y" || "$CONTINUE" == "Y" ]]; then
    # Get coordinates for next move
    echo "Enter x coordinate (0-2):"
    read -r NEXT_X
    echo "Enter y coordinate (0-2):"
    read -r NEXT_Y
    
    # Make next move with updated board
    test_ai_move_with_board "$UPDATED_BOARD" "$NEXT_X" "$NEXT_Y"
  else
    echo "Test completed."
  fi
}

# Execute the function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  # Check if jq is installed
  if ! command -v jq &> /dev/null; then
    echo "❌ Error: jq is required but not installed."
    echo "Please install jq using your package manager:"
    echo "  - Ubuntu/Debian: sudo apt-get install jq"
    echo "  - CentOS/RHEL: sudo yum install jq"
    echo "  - macOS: brew install jq"
    exit 1
  fi
  
  test_ai_move
fi
