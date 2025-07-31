// src/app/iframe-page/iframe-page.component.ts
// Fixed version with correct move handling

import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { NgxChessBoardView } from 'ngx-chess-board';
import { ChessMessage } from '../models/chess-message.interface';

@Component({
  selector: 'app-iframe-page',
  templateUrl: './iframe-page.component.html',
  styleUrls: ['./iframe-page.component.scss']
})
export class IframePageComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('board', { static: false }) board!: NgxChessBoardView;

  playerId: 'player1' | 'player2' = 'player1';
  currentPlayer: 'white' | 'black' = 'white';
  gameOver = false;
  isFlipped = false;
  isDisabled = true;
  boardSize = 300;
  private boardFlipped = false; // Track if board has been flipped

  constructor() {
    console.log('🏗️ IframePageComponent constructed');
  }

  ngOnInit(): void {
    console.log('🔄 IframePageComponent ngOnInit');
    
    window.addEventListener('message', this.handleMessage.bind(this));
    console.log('✅ Message listener added');
    
    this.sendReadyMessage();
  }

  ngAfterViewInit(): void {
    console.log('🔄 IframePageComponent ngAfterViewInit');
    
    setTimeout(() => {
      console.log('📤 Sending ready message after view init');
      this.sendReadyMessage();
    }, 500);
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.handleMessage.bind(this));
  }

  private sendReadyMessage(): void {
    console.log('=== SENDING READY MESSAGE ===');
    console.log('Current playerId:', this.playerId);
    
    if (window.parent && window.parent !== window) {
      try {
        const message = {
          type: 'READY',
          playerId: this.playerId
        };
        
        console.log('📤 Sending ready message:', message);
        window.parent.postMessage(message, window.location.origin);
        console.log('✅ Ready message sent successfully');
        
      } catch (error) {
        console.error('❌ Error sending ready message:', error);
      }
    }
  }

  private handleMessage(event: MessageEvent): void {
    if (event.origin !== window.location.origin) {
      console.warn('⚠️ Message from different origin, ignoring:', event.origin);
      return;
    }

    if (event.data.type === 'webpackOk' || event.data.type === 'webpackInvalid') {
      return;
    }

    const message: ChessMessage = event.data;
    console.log('=== IFRAME RECEIVED MESSAGE ===');
    console.log('📨 Message:', message);
    
    switch (message.type) {
      case 'INIT':
        console.log('🎯 INIT MESSAGE RECEIVED');
        this.initializeBoard(message);
        break;
      case 'MOVE':
        console.log('♟️ MOVE MESSAGE RECEIVED');
        this.handleIncomingMove(message);
        break;
      case 'CHECKMATE':
        console.log('🏁 CHECKMATE MESSAGE RECEIVED');
        this.handleGameEnd(message);
        break;
      case 'RESET':
        console.log('🔄 RESET MESSAGE RECEIVED');
        this.resetBoard(message);
        break;
    }
  }

  private initializeBoard(message: ChessMessage): void {
    console.log('=== INITIALIZING BOARD ===');
    console.log('📝 Setting Player ID to:', message.playerId);
    
    this.playerId = message.playerId!;
    this.currentPlayer = message.currentPlayer!;
    this.gameOver = message.gameOver!;
    
    console.log('✅ Player ID set to:', this.playerId);
    console.log('✅ Current player set to:', this.currentPlayer);
    
    this.isFlipped = this.playerId === 'player2';
    console.log('🔄 Board should be flipped:', this.isFlipped);
    
    if (this.board && message.fen) {
      console.log('♟️ Setting FEN on board:', message.fen);
      this.board.setFEN(message.fen);
    }
    
    setTimeout(() => {
      console.log('🔄 Updating board state...');
      this.updateBoardState();
    }, 200);
  }

  private handleIncomingMove(message: ChessMessage): void {
    console.log('=== HANDLING INCOMING MOVE ===');
    console.log('📨 Move from player:', message.playerId);
    console.log('📨 My player ID:', this.playerId);
    console.log('📨 Should process move:', message.playerId !== this.playerId);
    
    // Only process moves from the OTHER player
    if (message.playerId !== this.playerId && this.board) {
      console.log('✅ Processing move from other player');
      
      if (message.fen) {
        console.log('♟️ Updating board with FEN:', message.fen);
        this.board.setFEN(message.fen);
      }
      
      this.currentPlayer = message.currentPlayer!;
      console.log('✅ Current player updated to:', this.currentPlayer);
      
      this.updateBoardState();
    } else {
      console.log('❌ Ignoring move - same player or no board');
      console.log('    Message playerId:', message.playerId);
      console.log('    My playerId:', this.playerId);
    }
  }

  private handleGameEnd(message: ChessMessage): void {
    console.log('=== HANDLING GAME END ===');
    this.gameOver = true;
    this.isDisabled = true;
    this.updateBoardState();
  }

  private resetBoard(message: ChessMessage): void {
    console.log('=== RESETTING BOARD ===');
    this.currentPlayer = 'white';
    this.gameOver = false;
    this.isDisabled = false;
    this.boardFlipped = false; // Reset flip state
    
    if (this.board) {
      this.board.reset();
      this.updateBoardState();
    }
  }

  private updateBoardState(): void {
    console.log('=== UPDATING BOARD STATE ===');
    console.log('📝 Player ID:', this.playerId);
    console.log('📝 Current player:', this.currentPlayer);
    
    if (!this.board) {
      console.warn('⚠️ No board available for update');
      return;
    }

    // Only flip the board once for player2 (black player)
    if (this.isFlipped && !this.boardFlipped) {
      console.log('🔄 Flipping board for black player (one time only)');
      this.board.reverse();
      this.boardFlipped = true;
    }
    
    // Calculate turn state
    const isMyTurn = (this.playerId === 'player1' && this.currentPlayer === 'white') ||
                     (this.playerId === 'player2' && this.currentPlayer === 'black');
    
    this.isDisabled = this.gameOver || !isMyTurn;
    
    console.log('✅ Is my turn:', isMyTurn);
    console.log('✅ Is disabled:', this.isDisabled);
  }

  onMoveChange(event: any): void {
    console.log('=== MOVE MADE ===');
    console.log('♟️ Move by:', this.playerId);
    console.log('♟️ Raw event:', event);
    
    if (this.gameOver || this.isDisabled) {
      console.log('❌ Move ignored - game over or disabled');
      return;
    }

    // Parse the move correctly - ngx-chess-board uses string format like 'e2e4'
    let move;
    if (typeof event.move === 'string') {
      // Parse move string like 'e2e4' into from/to
      const moveStr = event.move;
      move = {
        from: moveStr.substring(0, 2),
        to: moveStr.substring(2, 4),
        piece: event.piece,
        moveString: moveStr
      };
    } else {
      // Handle object format if it exists
      move = {
        from: event.move?.from || event.from,
        to: event.move?.to || event.to,
        piece: event.piece,
        moveString: event.move
      };
    }

    console.log('✅ Parsed move:', move);

    const currentFEN = this.board.getFEN();
    console.log('📝 Current FEN after move:', currentFEN);
    
    const nextPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
    console.log('📝 Next player should be:', nextPlayer);
    
    const message: ChessMessage = {
      type: 'MOVE',
      playerId: this.playerId,
      move: move,
      fen: currentFEN,
      currentPlayer: nextPlayer,
      gameOver: false
    };

    console.log('📤 Sending move message to parent:', message);
    this.sendMessageToParent(message);
    
  }

  private sendMessageToParent(message: ChessMessage): void {
    console.log('=== SENDING MESSAGE TO PARENT ===');
    console.log('📤 Message:', message);
    
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage(message, window.location.origin);
        console.log('✅ Message sent successfully to parent');
      } catch (error) {
        console.error('❌ Error sending message to parent:', error);
      }
    }
  }

  getPlayerLabel(): string {
    return this.playerId === 'player1' ? 'White Player' : 'Black Player';
  }

  getTurnStatus(): string {
    if (this.gameOver) return 'Game Over';
    if (this.isDisabled) return 'Waiting...';
    return 'Your Turn!';
  }
}