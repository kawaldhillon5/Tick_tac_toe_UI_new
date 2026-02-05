import { Socket } from "socket.io-client";

// 1. Events the CLIENT sends to the SERVER
export interface ClientToServerEvents {
  join_queue: () => void;
  leave_queue: () => void;
  make_move: (data: { gameId: string; index: number }) => void;
}

// 2. Events the SERVER sends to the CLIENT
export interface ServerToClientEvents {
  session: (data: { gamerId: string; }) => void;
  queue_joined: (data: {gameId:string;})=>void;
  game_start: (data: { gameId: string;}) => void;
  game_update: (data: { board: string[]; currentTurn: string; }) => void;
  game_over: (data: { winnerId: string | null; winningLine: number[] | null; }) => void;
  error: (data: { message: string;}) => void;
}

export interface SocketData {
  gamerId: string;
}

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;