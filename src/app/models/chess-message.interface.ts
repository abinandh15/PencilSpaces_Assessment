export interface ChessMessage {
  type: 'READY' | 'MOVE' | 'RESET' | 'CHECKMATE' | 'TURN_CHANGE' | 'INIT';
  data?: any;
  playerId?: 'player1' | 'player2';
  fen?: string;
  currentPlayer?: 'white' | 'black';
  gameOver?: boolean;
  winner?: string;
  move?: {
    from: string;
    to: string;
    piece?: string;
    moveString: string;
  };
}