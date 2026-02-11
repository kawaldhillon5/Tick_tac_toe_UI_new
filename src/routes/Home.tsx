import { useEffect, useState } from "react";
import { useGameConext } from "../contexts/gameContext"
import type { BtnState } from "../types/app";
import { Link, useNavigate } from "react-router-dom";
import type { GameHistoryRow } from "../types/game";

export const Home = ()=>{

    const {gamerId, socket, isConnected} =  useGameConext();
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
        <>
            <p>{gamerId}</p>
            <p>{isConnected ? 'Connected': "Not Connected"}</p>
            <button onClick={handleFindMatch}>
                { btnState == "idle" && "Find Match"}
                { btnState == "Loading" && "Loading" }
                { btnState == "error" && "Error" }
                </button>

            <div>
                {
                    !previousGames ? <p>No Previous Games History</p> :
                    <div>
                    {
                        previousGames.map((game)=>(
                        <Link key={game.id} to={`/game/${game.id}`}>
                            <div>
                                <p>Opponent: {gamerId == game.player1.gamerId ? game.player2.gamerId : game.player1.gamerId}</p>
                                <p>Game Result: {game.status}</p>
                                <p>Played At: { game.created_at}</p>
                                {game.winner && <p>Winner: {gamerId == game.winner.gamerId ? "You" : "Opponent"}</p>}
                            </div>
                        </Link>
                        ))
                    }
                    </div> 
                }
            </div>
        </>
    )
}