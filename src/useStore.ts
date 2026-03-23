import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { BabyEvent, TwinProfile } from './types';

export function useStore() {
  const [events, setEvents] = useState<BabyEvent[]>([]);
  const [profiles, setProfiles] = useState<TwinProfile[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to the WebSocket server
    const socket = io(import.meta.env.VITE_APP_URL || window.location.origin);
    socketRef.current = socket;

    socket.on('init', (data: { profiles: TwinProfile[], events: BabyEvent[] }) => {
      setProfiles(data.profiles);
      setEvents(data.events);
      setIsLoaded(true);
    });

    socket.on('event_added', (event: BabyEvent) => {
      setEvents((prev) => {
        if (prev.some(e => e.id === event.id)) return prev;
        return [...prev, event].sort((a, b) => b.timestamp - a.timestamp);
      });
    });

    socket.on('event_deleted', (id: string) => {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    });

    socket.on('profile_updated', ({ id, name }: { id: string, name: string }) => {
      setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const addEvent = (event: BabyEvent) => {
    // Optimistic update
    setEvents((prev) => [...prev, event].sort((a, b) => b.timestamp - a.timestamp));
    socketRef.current?.emit('add_event', event);
  };

  const deleteEvent = (id: string) => {
    // Optimistic update
    setEvents((prev) => prev.filter((e) => e.id !== id));
    socketRef.current?.emit('delete_event', id);
  };

  const updateProfile = (id: string, name: string) => {
    // Optimistic update
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
    socketRef.current?.emit('update_profile', { id, name });
  };

  return { events, profiles, addEvent, deleteEvent, updateProfile, isLoaded };
}
