// client/src/routes/Game.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useGameConext } from "../contexts/gameContext"; // Fix typo in your filename later ;)
import type { Board, GameRow, Opponent, Player } from "../types/game";

import "../styles/game.css";

export const Game = () => {
    const { gameId } = useParams();
    const { socket, isConnected, gamerId } = useGameConext();
    
    //Game State
    const [gameobj, setGameObj] = useState<null | GameRow>(null);    
    const [opponent, setOpponent] = useState<null | Opponent>(null);

    const [deadline, setDeadline] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    // MOUNT: Re-Join / Sync Logic
    useEffect(() => {
        if (!socket || !isConnected || !gameId) return;

        // A. Ask to join/sync
        socket.emit("join_game", { gameId });

        // B. Listen for updates
        const handleUpdate = (data: {turnDeadline:number, board: Board; currentTurn: string | null }) => {
            setDeadline(data.turnDeadline);
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
            winningArray: {row:number, col: number}[] | null,
            turnDeadline: number | null,
        }) => {
            console.log("Game_state fired");
            console.log(data);

            let gameStatus = "";

            if (data.status === 'won') {
                gameStatus = data.winner === gamerId ? "You Won!" : "You Lost";
            } else if(data.status == "ongoing"){
               gameStatus = data.currentTurn === gamerId ? "Your Turn" : "Opponent's Turn";
            } else {
                gameStatus = data.status
            }
            if (data.turnDeadline) setDeadline(data.turnDeadline);
            
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

        const handleGameOver = (data: {board: Board ,status: 'won' | 'draw', winnerId: string | null, winningArray: {row:number, col: number}[] | null }) => {
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
                    board: data.board,
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
            socket.off("game_state", handleGameState);
            socket.off("game_over", handleGameOver);
        };
    }, [socket, isConnected, gameId, gamerId]);


    // 2. UI: Handle Clicks
    const handleCellClick = ( e: React.MouseEvent<HTMLDivElement> ,rowIndex: number, colIndex: number) => {
        if (!socket || !gameId || !gamerId || !gameobj) return;
        
        if (gameobj.current_turn !== gamerId ) return;
        
        if (gameobj.winner) return;

        e.currentTarget.classList.remove("mark-on-hover")

        socket.emit("make_move", { 
            gameId, 
            row: rowIndex, 
            col: colIndex, 
            player: gamerId 
        });
    };

    const handleMouseOver = (e: React.MouseEvent<HTMLDivElement>) =>{

        const mark = opponent?.gamerId == gameobj?.current_turn ? "" : gameobj?.mark
        if(!mark || e.currentTarget.innerText) return;       
        e.currentTarget.innerText = mark;
        e.currentTarget.classList.add("mark-on-hover"); 
    }

    const handleMouseOut = (e: React.MouseEvent<HTMLDivElement>) =>{
        if(e.currentTarget.classList.contains("mark-on-hover")){
            e.currentTarget.innerText = ""
            e.currentTarget.classList.remove("mark-on-hover")
        }       
    }

    const generateClassName = (colIndex: number, rowIndex: number)=>{
            let clsName = ""
            gameobj?.winningArray?.forEach(data => {
            if(data.col === colIndex && data.row === rowIndex){
                console.log(data.col === colIndex && data.row === rowIndex)
                clsName = "cell-highlighted"
            } 
        });
        return clsName;
    }


    useEffect(() => {
        if (!deadline) {
            setTimeLeft(0);
            return;
        }

        if(gameobj?.winner){
            setDeadline(null);
            setTimeLeft(0);
            return;
        }

        console.log("Dealine",deadline);

        const interval = setInterval(() => {
            const delta = deadline - Date.now();
            const seconds = Math.ceil(delta / 1000);
            
            if (seconds <= 0) {
                setTimeLeft(0);
                clearInterval(interval);
            } else {
                setTimeLeft(seconds);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [deadline, gameobj?.winner]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <h1>Tic Tac Toe</h1>
            <h2>Gamer Id: {gamerId}</h2>
            <h2>Oppoenent: {opponent?.gamerId} <span>{opponent?.isActive ? "Online" : "Offline"}</span></h2>            
            <h2>{gameobj?.status}</h2>
            {deadline && <h2>Time Left: {timeLeft}s</h2>}
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 100px)', gap: '5px' }}>
                {gameobj?.board.map((row, rowIndex: number) => (
                    row.map((cell, colIndex) => (
                        <div 
                            key={`${rowIndex}-${colIndex}`}
                            onClick={(e: React.MouseEvent<HTMLDivElement>) => handleCellClick(e, rowIndex, colIndex)}
                            onMouseOver={handleMouseOver}
                            onMouseOut={handleMouseOut}
                            className={`game-cell ${generateClassName(colIndex, rowIndex)}`}
                            style={{
                                cursor: gameobj.current_turn == gamerId && !cell && !gameobj.winner ? 'pointer' : 'default',
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