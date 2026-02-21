import { createContext, useContext, useEffect, useState } from "react";
import type { GameContextType } from "../types/context";
import socketService from "../services/socketService";


const GameContext = createContext<GameContextType>({} as GameContextType);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
    

    const socket = socketService.socket
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [gamerId, setGamerId] = useState<string | null>(null);

    useEffect(() => {

        const storedGamerId = localStorage.getItem('ticTacToeGamerId');
        socketService.connect(storedGamerId);
        

        socket.on("session", (data)=>{
            localStorage.setItem('ticTacToeGamerId', data.gamerId);
            setGamerId(data.gamerId);
        })

        socket.on('connect',(()=>{
            setIsConnected(true);
        }));

        socket.on("disconnect",(()=>{
            setIsConnected(false);
        }));


        return () => {
            socketService.disconnect();
            setIsConnected(false);
            socket.off("session");
            socket.off('connect');
            socket.off("disconnect")
        };
    }, []);

    return <GameContext.Provider value={{socket, isConnected, gamerId}}>{children}</GameContext.Provider>
}

export const useGameConext =() =>{
    return useContext(GameContext);
}