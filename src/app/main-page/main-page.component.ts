// src/app/main-page/main-page.component.ts
// Fixed version with correct message routing

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { GameStateService } from '../services/game-state.service';
import { ChessMessage } from '../models/chess-message.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class MainPageComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('iframe1', { static: false }) iframe1!: ElementRef<HTMLIFrameElement>;
  @ViewChild('iframe2', { static: false }) iframe2!: ElementRef<HTMLIFrameElement>;

  currentPlayer: 'white' | 'black' = 'white';
  gameOver = false;
  winner?: string;
  safeIframeUrl: SafeResourceUrl;
  
  private gameStateSubscription?: Subscription;

  constructor(
    private gameStateService: GameStateService,
    private sanitizer: DomSanitizer
  ) {
    console.log('MainPageComponent constructed');
    const iframeUrl = `${window.location.origin}/iframepage`;
    this.safeIframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(iframeUrl);
  }

  ngOnInit(): void {
    this.gameStateSubscription = this.gameStateService.gameState$.subscribe(state => {
      this.currentPlayer = state.currentPlayer;
      this.gameOver = state.gameOver;
      this.winner = state.winner;
    });

    window.addEventListener('message', this.handleMessage.bind(this));
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      console.log('Force initializing iframes...');
      this.initializeIframes();
    }, 2000);
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.handleMessage.bind(this));
    if (this.gameStateSubscription) {
      this.gameStateSubscription.unsubscribe();
    }
  }

  private initializeIframes(): void {
    console.log('=== INITIALIZING IFRAMES ===');
    const gameState = this.gameStateService.getCurrentGameState();
    
    // Initialize iframe 1 (white player)
    this.sendMessageToIframe(this.iframe1, {
      type: 'INIT',
      playerId: 'player1',
      fen: gameState.fen,
      currentPlayer: gameState.currentPlayer,
      gameOver: gameState.gameOver
    });

    // Initialize iframe 2 (black player)
    this.sendMessageToIframe(this.iframe2, {
      type: 'INIT',
      playerId: 'player2',
      fen: gameState.fen,
      currentPlayer: gameState.currentPlayer,
      gameOver: gameState.gameOver
    });
  }

  private handleMessage(event: MessageEvent): void {
    if (event.origin !== window.location.origin) {
      return;
    }

    if (event.data.type === 'webpackOk' || event.data.type === 'webpackInvalid') {
      return;
    }

    const message: ChessMessage = event.data;
    console.log('=== MAIN PAGE RECEIVED MESSAGE ===');
    console.log('📨 Message type:', message.type);
    console.log('📨 From player:', message.playerId);
    
    switch (message.type) {
      case 'READY':
        console.log('*** READY MESSAGE RECEIVED ***:', message.playerId);
        break;
      case 'MOVE':
        console.log('*** MOVE MESSAGE RECEIVED ***');
        this.handleMove(message);
        break;
      case 'CHECKMATE':
        console.log('*** CHECKMATE MESSAGE RECEIVED ***');
        this.handleCheckmate(message);
        break;
    }
  }

  private handleMove(message: ChessMessage): void {
    console.log('=== HANDLING MOVE ===');
    console.log('📨 Move from player:', message.playerId);
    console.log('📨 Move details:', message.move);
    console.log('📨 New FEN:', message.fen);
    console.log('📨 Next player:', message.currentPlayer);
    
    // Update game state
    this.gameStateService.updateGameState({
      fen: message.fen!,
      currentPlayer: message.currentPlayer!,
      moveHistory: [...this.gameStateService.getCurrentGameState().moveHistory, message.move]
    });

    // FIXED: Send move to the OTHER player
    // If move came from player1, send to player2 (iframe2)
    // If move came from player2, send to player1 (iframe1)
    const targetIframe = message.playerId === 'player1' ? this.iframe2 : this.iframe1;
    const targetPlayerId = message.playerId === 'player1' ? 'player2' : 'player1';
    
    console.log('📤 Sending move to target player:', targetPlayerId);
    console.log('📤 Using target iframe:', message.playerId === 'player1' ? 'iframe2' : 'iframe1');
    
    const moveMessage: ChessMessage = {
      type: 'MOVE',
      playerId: message.playerId, // Keep original sender ID so receiver knows it's from the other player
      fen: message.fen,
      currentPlayer: message.currentPlayer,
      move: message.move
    };
    
    console.log('📤 Sending move message:', moveMessage);
    this.sendMessageToIframe(targetIframe, moveMessage);
  }

  private handleCheckmate(message: ChessMessage): void {
    console.log('=== HANDLING CHECKMATE ===');
    
    this.gameStateService.updateGameState({
      gameOver: true,
      winner: message.winner
    });

    this.sendMessageToIframe(this.iframe1, {
      type: 'CHECKMATE',
      playerId: 'player1',
      gameOver: true,
      winner: message.winner
    });

    this.sendMessageToIframe(this.iframe2, {
      type: 'CHECKMATE',
      playerId: 'player2',
      gameOver: true,
      winner: message.winner
    });

    setTimeout(() => {
      alert(`Game Over! ${message.winner} wins!`);
    }, 100);
  }

  private sendMessageToIframe(iframeRef: ElementRef<HTMLIFrameElement>, message: ChessMessage): void {
    console.log('=== SENDING MESSAGE TO IFRAME ===');
    console.log('📤 Message:', message);
    
    if (iframeRef?.nativeElement?.contentWindow) {
      try {
        iframeRef.nativeElement.contentWindow.postMessage(message, window.location.origin);
        console.log('✅ Message sent successfully to iframe');
      } catch (error) {
        console.error('❌ Error sending message to iframe:', error);
      }
    } else {
      console.error('❌ Iframe not available');
      setTimeout(() => {
        this.sendMessageToIframe(iframeRef, message);
      }, 1000);
    }
  }

  onCreateNewGame(): void {
    console.log('=== CREATING NEW GAME ===');
    this.gameStateService.resetGame();
    
    setTimeout(() => {
      this.initializeIframes();
    }, 500);
  }
}