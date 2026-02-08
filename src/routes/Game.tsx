// client/src/routes/Game.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useGameConext } from "../contexts/gameContext"; // Fix typo in your filename later ;)
import type { Board, GameRow, Opponent, Player } from "../types/game";

export const Game = () => {
    const { gameId } = useParams();
    const { socket, isConnected, gamerId } = useGameConext();
    
    //Game State
    const [gameobj, setGameObj] = useState<null | GameRow>(null);    
    const [opponent, setOpponent] = useState<null | Opponent>(null);
    // MOUNT: Re-Join / Sync Logic
    useEffect(() => {
        if (!socket || !isConnected || !gameId) return;

        // A. Ask to join/sync
        socket.emit("join_game", { gameId });

        // B. Listen for updates
        const handleUpdate = (data: { board: Board; currentTurn: string | null }) => {
            setGameObj(prev =>{
                if(!prev) return null;
                return {...prev, current_turn: data.currentTurn, board: data.board, status: prev.winner ? prev.status : (data.currentTurn === gamerId) ? "Your Turn" : "Opponent's Turn" }
            })
        };

        const handleGameState = (data: { 
            board: Board, 
            currentTurn: string | null, 
            opponent: Player | null,
            status: 'waiting' | 'ongoing' | 'won' | 'draw', 
            winner: string | null,
            winningArray: {row:number, col: number}[] | null
        }) => {
            console.log("Game_state fired");
            console.log(data);

            let gameStatus = "";

            if (data.status === 'won') {
                gameStatus = data.winner === gamerId ? "You Won!" : "You Lost";
            } else if(data.status = "ongoing"){
               gameStatus = data.currentTurn === gamerId ? "Your Turn" : "Opponent's Turn";
            } else {
                gameStatus = data.status
            }
            
            setGameObj({
                    id: gameId,
                    board: data.board,
                    mark: data.opponent?.mark == "X" ? "O" : "X"  ,
                    current_turn: data.currentTurn,
                    status: gameStatus,
                    winner: data.winner,
                    winningArray: data.winningArray,
                }
            );
            setOpponent({gamerId: data.opponent?.gamerId, isActive: true});
        };

        const handleGameOver = (data: { status: 'won' | 'draw', winnerId: string | null, winningArray: {row:number, col: number}[] | null }) => {
            console.log("Game-Over Fired");
            console.log(data.winningArray);
            let gameStatus = "";

            if (data.status === 'won') {
                gameStatus = data.winnerId === gamerId ? "You Won!" : "You Lost";
            } 
             else {
                gameStatus = data.status
            }

            setGameObj(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    status: gameStatus,
                    winner: data.winnerId,
                    winningArray: data.winningArray,
                }
            })
        };

        socket.on("game_update", handleUpdate);
        socket.on("game_state", handleGameState); 
        socket.on("game_over", handleGameOver);

        // Cleanup
        return () => {
            socket.off("game_update", handleUpdate);
            socket.off("game_state", handleUpdate);
            socket.off("game_over", handleGameOver);
        };
    }, [socket, isConnected, gameId, gamerId]);


    // 2. UI: Handle Clicks
    const handleCellClick = (rowIndex: number, colIndex: number) => {
        if (!socket || !gameId || !gamerId || !gameobj) return;
        
        if (gameobj.current_turn !== gamerId ) return;
        
        if (gameobj.winner) return;

        socket.emit("make_move", { 
            gameId, 
            row: rowIndex, 
            col: colIndex, 
            player: gamerId 
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <h1>Tic Tac Toe</h1>
            <h2>Gamer Id: {gamerId}</h2>
            <h2>Oppoenent: {opponent?.gamerId} <span>{opponent?.isActive ? "Online" : "Offline"}</span></h2>            
            <h2>{gameobj?.status}</h2>

            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 100px)', gap: '5px' }}>
                {gameobj?.board.map((row, rowIndex: number) => (
                    row.map((cell, colIndex) => (
                        <div 
                            key={`${rowIndex}-${colIndex}`}
                            onClick={() => handleCellClick(rowIndex, colIndex)}
                            style={{
                                width: '100px',
                                height: '100px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '40px',
                                border: '1px solid black',
                                cursor: gameobj.current_turn == gamerId && !cell ? 'pointer' : 'default',
                                backgroundColor: cell ? '#f0f0f0' : 'white'
                            }}
                        >
                            {cell}
                        </div>
                    ))
                ))}
            </div>
        </div>
    );
};