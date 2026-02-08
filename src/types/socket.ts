import { Socket } from "socket.io-client";
import type { Board, Player } from "./game";

// 1. Events the CLIENT sends to the SERVER
export interface ClientToServerEvents {
  join_queue: () => void;
  leave_queue: () => void;
  join_game : (data:{gameId: string}) => void,
  make_move: (data: { gameId: string; row: number, col: number, player: string }) => void;
}

// 2. Events the SERVER sends to the CLIENT
export interface ServerToClientEvents {
  session: (data: { gamerId: string; }) => void;
  game_start: (data: { gameId: string;}) => void;
  game_state: (data: { 
    gameId: string;
    board: Board;
    currentTurn: string | null;
    opponent: Player | null;
    status: 'waiting' | 'ongoing' | 'won' | 'draw';
    winner: string | null;
    winningArray: {row:number, col: number}[] | null
  }) => void;
  game_update: (data: { board: Board; currentTurn: string | null }) => void;
  game_over: (data: {board: Board, status: 'won' | 'draw',  winnerId: string | null; winningArray: {row:number, col: number}[] | null }) => void;
  error: (data: { message: string;}) => void;
}

export interface SocketData {
  gamerId: string;
}

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;