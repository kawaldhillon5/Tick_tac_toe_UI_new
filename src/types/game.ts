
export type Player = {
    gamerId: string , 
    mark: 'X' | 'O'
};

export type Opponent = {
    gamerId: string | undefined,
    isActive: boolean 
}

export type Cell = 'X' | 'O' | null;

export type Board = Cell[][];

export interface GameRow {
    id: string;             
    board: Board;
    mark: "X"| "O"; 
    current_turn: string | null;
    status: string;
    winner: string | null;
    winningArray: {row:number, col: number}[] | null

}

export interface GameHistoryRow {
    id: string;
    player1: Player;       
    player2: Player;        
    status:  string;
    winner: Player;  
    created_at: number;
}

export interface Scores {
    myWins: number;
    opponentWins: number;
    draws: number;
}
