// client/src/routes/Game.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGameConext } from "../contexts/gameContext"; // Fix typo in your filename later ;)
import type { Board, GameRow, Opponent, Player, Scores } from "../types/game";

import "../styles/game.css";
import type { BtnState } from "../types/app";
import { CircleAlertIcon, LoaderCircleIcon } from "lucide-react";

export const Game = () => {
    const { gameId } = useParams();
    const { socket, isConnected, gamerId } = useGameConext();
    
    //Game State
    const [gameobj, setGameObj] = useState<null | GameRow>(null);    
    const [opponent, setOpponent] = useState<null | Opponent>(null);

    const [deadline, setDeadline] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    // MOUNT: Re-Join / Sync Logic
    const [restartBtnStatus, setRestartBtnStatus] = useState<BtnState | "Awaiting" | null>(null);
    const [scores, setScores] = useState<Scores | null>(null);

    const navigate = useNavigate();

    useEffect(()=>{
        if(!socket || !opponent?.gamerId) return;
        socket.emit("get_score",{opponentId : opponent?.gamerId});
    },[opponent, gameobj?.winner ])

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
            });
            setRestartBtnStatus("idle");
        };

        

        socket.on("game_update", handleUpdate);
        socket.on("game_state", handleGameState); 
        socket.on("game_over", handleGameOver);
        socket.on("score_data", (data) => {console.log("Got Scores");setScores(data);});
        socket.on("opponent_status", (data) => {
            setOpponent((prev) => prev ? { ...prev, isActive: data.isActive } : prev);
        });
        socket.on("re_match_req_sent", ()=>{setRestartBtnStatus("Awaiting")});
        socket.on("game_start", data =>{
            setRestartBtnStatus(null);
            navigate(`/game/${data.gameId}`);
        });

        // Cleanup
        return () => {
            socket.off("game_update", handleUpdate);
            socket.off("game_state", handleGameState);
            socket.off("game_over", handleGameOver);
            socket.off("score_data");
            socket.off("opponent_status");
            socket.off("game_start");
            socket.off("re_match_req_sent");
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
                clsName = "cell-highlighted"
            } 
        });
        return clsName;
    }

    const handleRequestReMatch = ()=>{
        if (!socket || !(restartBtnStatus == "idle") || !gameId || !opponent?.gamerId) return;

        setRestartBtnStatus("Loading");
        socket.emit("re_match_request", {gameId: gameId, opponentId:  opponent.gamerId});
    }


    useEffect(() => {
        if (!deadline) {
            setTimeLeft(0);
            return;
        }

        if(gameobj?.winner || gameobj?.status == "draw" || gameobj?.status == "won"){
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
    }, [deadline, gameobj?.winner, gameobj?.status]);

    return (
        <div id="game-route">
            <div className="game-opponent-div">
                <h2>Opponent</h2>
                <div className="opponent-info">{opponent?.gamerId} <div className={`opponent-status ${opponent?.isActive ? "Online" : null}`}></div></div> 
            </div>          
            <div className="scores-div">
                <div>{`Games Won: ${scores?.myWins}`}</div>
                <div>{`Games Lost: ${scores?.opponentWins}`}</div>
                <div>{`Draws: ${scores?.draws}`}</div>
            </div> 
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
            {restartBtnStatus && <button className={`re-match-btn ${restartBtnStatus}`} onClick={handleRequestReMatch}>
                { restartBtnStatus == "idle" && "Request Re-Match"}
                { restartBtnStatus == "Awaiting" && "Awaiting"}
                { restartBtnStatus == "Loading" && <LoaderCircleIcon/>}
                { restartBtnStatus == "error" && <CircleAlertIcon /> }
            </button>}
        </div>
    );
};