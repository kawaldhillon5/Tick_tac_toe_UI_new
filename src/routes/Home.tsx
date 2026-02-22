import { useEffect, useState } from "react";
import { useGameConext } from "../contexts/gameContext"
import type { BtnState } from "../types/app";
import { Link, useNavigate } from "react-router-dom";
import type { GameHistoryRow } from "../types/game";
import "../styles/home.css";
import { CircleAlertIcon, LoaderCircleIcon } from "lucide-react";

export const Home = ()=>{

    const {gamerId, socket} =  useGameConext();
    const [btnState, setBtnState] =  useState<BtnState>("idle")

    const [previousGames, setPreviousGames] = useState< GameHistoryRow[] | null>(null);

    const navigate  = useNavigate();

    const handleFindMatch = ()=>{
        if (!socket) return;

        setBtnState("Loading");
        socket.emit("join_queue");
    }
    
    useEffect(()=>{
        if (!socket) return

        socket.on("game_start", data =>{
            navigate(`/game/${data.gameId}`);
        });

        
        return ()=>{
            socket.off('game_start');
        }
    },[socket]);

    useEffect(()=>{
        if(!gamerId || !socket) return;
        socket.emit("game_history",{gamerId: gamerId});

        socket.on("game_history",(data:{games: GameHistoryRow[]})=>{
            setPreviousGames(data.games);
        });

         return ()=>{
            socket.off("game_history");
        }

    },[socket, gamerId]);

    return (
        <div id="home-route">
            <button className={`find-match-btn ${btnState}`} onClick={handleFindMatch}>
                { btnState == "idle" && "Find Match"}
                { btnState == "Loading" && <LoaderCircleIcon/>}
                { btnState == "error" && <CircleAlertIcon /> }
                </button>

            <div className="previous-games-list">
                {
                    !previousGames ? <p>No Previous Games History</p> :
                    <>
                        <div className="previous-games-list-item previous-games-list-header">
                            <p className="previous-games-list-item-item">Opponent</p>
                            <p className="previous-games-list-item-item">Result</p>
                            <p className="previous-games-list-item-item">Winner</p>
                            <p className="previous-games-list-item-item">Time</p>
                        </div>
                        {
                            previousGames.map((game)=>(
                            <Link className="previous-games-list-item" key={game.id} to={`/game/${game.id}`}>
                                <>
                                    <p className="previous-games-list-item-item">{gamerId == game.player1.gamerId ? game.player2.gamerId : game.player1.gamerId}</p>
                                    <p className="previous-games-list-item-item">{game.status}</p>
                                    {game.winner ? <p className="previous-games-list-item-item"> {gamerId == game.winner.gamerId ? "You" : "Opponent"}</p> : <p>None</p>}
                                    <p className="previous-games-list-item-item">{new Date(game.created_at).toLocaleDateString()}</p>
                                </>
                            </Link>
                            ))
                        }
                    </> 
                }
            </div>
        </div>
    )
}