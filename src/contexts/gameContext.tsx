import { createContext, useContext, useEffect, useState } from "react";
import type { GameContextType } from "../types/context";
import type { TypedSocket } from "../types/socket";
import socketService from "../services/socketService";


const GameContext = createContext<GameContextType>({} as GameContextType);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
    

    const [socket, setSocket] = useState<TypedSocket | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [gamerId, setGamerId] = useState<string | null>(null);

    useEffect(() => {

        setSocket(socketService.socket);
        const storedGamerId = localStorage.getItem('ticTacToeGamerId');
        socketService.connect(storedGamerId);
        setIsConnected(true);


        socketService.socket.on("session", (data)=>{
            localStorage.setItem('tticTacToeGamerId', data.gamerId);
            setGamerId(data.gamerId);
        })

        return () => {
            socketService.disconnect();
            setIsConnected(false);
        };
    }, []);

    return <GameContext.Provider value={{socket, isConnected, gamerId}}>{children}</GameContext.Provider>
}

export const useGameConext =() =>{
    return useContext(GameContext);
}