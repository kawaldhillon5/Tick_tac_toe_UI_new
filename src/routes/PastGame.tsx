// client/src/routes/PastGame.tsx
import { useEffect, useState } from "react";
import {  useParams } from "react-router-dom";
import { useGameConext } from "../contexts/gameContext"; // Fix typo in your filename later ;)
import type { Board, GameRow, Player } from "../types/game";

import "../styles/game.css";

export const PastGame = () => {
    const { gameId } = useParams();
    const { socket, isConnected, gamerId} = useGameConext();
    
    const [gameobj, setGameObj] = useState<null | GameRow>(null);    
    const [opponent, setOpponent] = useState<null | string>(null);


    useEffect(() => {
        if (!socket || !isConnected || !gameId) return;

        socket.emit("join_game", {gameId: gameId});

        const handleGameState = (data: { 
            board: Board, 
            currentTurn: string | null, 
            opponent: Player | null,
            status: 'waiting' | 'ongoing' | 'won' | 'draw', 
            winner: string | null,
            winningArray: {row:number, col: number}[] | null,
            turnDeadline: number | null,
        }) => {

            let gameStatus = "";

            if (data.status === 'won') {
                gameStatus = data.winner === gamerId ? "You Won!" : "You Lost";
            } else if(data.status == "ongoing"){
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
            if(!data.opponent?.gamerId) return;
            setOpponent(data.opponent?.gamerId);
        };

        
        socket.on("game_state", handleGameState); 

        return () => {
            socket.off("game_state", handleGameState);
        };
    }, [socket, isConnected, gameId, gamerId]);

    const generateClassName = (colIndex: number, rowIndex: number)=>{
            let clsName = ""
            gameobj?.winningArray?.forEach(data => {
            if(data.col === colIndex && data.row === rowIndex){
                clsName = "cell-highlighted"
            } 
        });
        return clsName;
    }

    return (
        <div id="game-route">
            <div className="game-opponent-div">
                <h2>Opponent</h2>
                <div className="opponent-info">{opponent}</div> 
            </div>          
            <h2>{gameobj?.status}</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 100px)', gap: '5px' }}>
                {gameobj?.board.map((row, rowIndex: number) => (
                    row.map((cell, colIndex) => (
                        <div 
                            key={`${rowIndex}-${colIndex}`}
                            className={`game-cell ${generateClassName(colIndex, rowIndex)} ${cell ? 'full' : 'empty'}`}
                            style={{
                                cursor: gameobj.current_turn == gamerId && !cell && !gameobj.winner ? 'pointer' : 'default',
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