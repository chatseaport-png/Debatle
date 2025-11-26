"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket] = useState<Socket | null>(() => {
    if (typeof window === "undefined") return null;
    const serverUrl = `${window.location.protocol}//${window.location.host}`;
    return io(serverUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  });
  const [isConnected, setIsConnected] = useState(socket?.connected ?? false);

  useEffect(() => {
    if (!socket) return;

    const serverUrl = `${window.location.protocol}//${window.location.host}`;

    const handleConnect = () => {
      console.log("Connected to server:", serverUrl);
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    };

    const handleConnectError = (error: Error) => {
      console.error("Connection error:", error);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.disconnect();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
