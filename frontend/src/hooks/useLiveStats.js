import { useEffect, useRef, useState } from "react";
import apiClient from "../services/api";

const socketURL = process.env.REACT_APP_SOCKET_URL || "wss://api.loyaloop.dev/ws";

export const useLiveStats = () => {
    const [stats, setStats] = useState({ usersOnline: 0, activeTransactions: 0, promotionsLive: 0 });
    const socketRef = useRef(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchInitial() {
            try {
                const data = await apiClient.get('/stats/summary');
                if (isMounted) setStats(data);
            } catch (err) {
                console.error('Failed to load stats', err);
            }
        }
        fetchInitial();

        socketRef.current = new WebSocket(socketURL);
        socketRef.current.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.type === 'stats:update') {
                    setStats((prev) => ({ ...prev, ...payload.data }));
                }
            } catch (err) {
                console.error('Bad socket payload', err);
            }
        };

        socketRef.current.onclose = () => {
            socketRef.current = null;
        };

        return () => {
            isMounted = false;
            socketRef.current?.close();
        };
    }, []);

    return stats;
};

