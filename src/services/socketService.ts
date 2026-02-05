import { io } from 'socket.io-client';
import type { TypedSocket } from '../types/socket';

const URL = import.meta.env.VITE_WS_URL || "http://localhost:3000";

class SocketService {

    public socket: TypedSocket;

    constructor(){
        this.socket = io(URL, {
            autoConnect: false,
            transports: ["websocket"],
        }); 
    }

    public connect(gamerId: string | null): void {
        if (this.socket.connected) return;

        if (gamerId) {
            this.socket.auth = { gamerId };
        }

        this.socket.connect();
    }

    public disconnect(): void {
        if (this.socket.connected) {
            this.socket.disconnect();
        }
    }

}

const socketService = new SocketService();
export default socketService;