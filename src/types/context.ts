import type { TypedSocket } from "./socket";

export interface GameContextType {
    socket : TypedSocket | null,
    isConnected: boolean,
    gamerId: string | null,
}