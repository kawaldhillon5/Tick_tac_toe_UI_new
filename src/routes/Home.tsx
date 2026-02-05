import { useEffect, useState } from "react";
import { useGameConext } from "../contexts/gameContext"
import type { BtnState } from "../types/app";
import { useNavigate } from "react-router-dom";

export const Home = ()=>{

    const {gamerId, socket, isConnected} =  useGameConext();
    const [btnState, setBtnState] =  useState<BtnState>("idle")

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
        })

        return ()=>{
        }
    },[socket]);

    return (
        <>
            <p>{gamerId}</p>
            <p>{isConnected ? 'Connected': "Not Connected"}</p>
            <button onClick={handleFindMatch}>
                { btnState == "idle" && "Find Match"}
                { btnState == "Loading" && "Loading" }
                { btnState == "error" && "Error" }
                </button>
        </>
    )
}