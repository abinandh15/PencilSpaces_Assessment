import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface GameState {
  fen: string;
  currentPlayer: 'white' | 'black';
  gameOver: boolean;
  winner?: string;
  moveHistory: any[];
}

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  private readonly STORAGE_KEY = 'pencil-chess-game-state';
  
  private gameStateSubject = new BehaviorSubject<GameState>({
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    currentPlayer: 'white',
    gameOver: false,
    moveHistory: []
  });

  gameState$: Observable<GameState> = this.gameStateSubject.asObservable();

  constructor() {
    this.loadGameState();
  }

  updateGameState(newState: Partial<GameState>): void {
    const currentState = this.gameStateSubject.value;
    const updatedState = { ...currentState, ...newState };
    this.gameStateSubject.next(updatedState);
    this.saveGameState(updatedState);
  }

  getCurrentGameState(): GameState {
    return this.gameStateSubject.value;
  }

  resetGame(): void {
    const initialState: GameState = {
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      currentPlayer: 'white',
      gameOver: false,
      moveHistory: []
    };
    this.gameStateSubject.next(initialState);
    this.saveGameState(initialState);
  }

  private saveGameState(state: GameState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  }

  private loadGameState(): void {
    try {
      const savedState = localStorage.getItem(this.STORAGE_KEY);
      if (savedState) {
        const state = JSON.parse(savedState);
        this.gameStateSubject.next(state);
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
    }
  }

  clearSavedState(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}