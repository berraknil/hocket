import React, { createContext, useState, useEffect } from 'react';
import { BskyAgent } from '@atproto/api';
import { SessionData, loginWithAppPassword, resumeSession, createAgent } from '../lib/atproto';

interface AuthContextType {
  isAuthenticated: boolean;
  session: SessionData | null;
  agent: BskyAgent | null;
  signIn: (service: string, identifier: string, password: string) => Promise<void>;
  signOut: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'hocket-session';
const PDS_SERVICE_KEY = 'hocket-pds-service';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [agent, setAgent] = useState<BskyAgent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
    if (storedSession) {
      try {
        const parsedSession: SessionData = JSON.parse(storedSession);
        resumeSession(parsedSession)
          .then((resumedAgent) => {
            setSession(parsedSession);
            setAgent(resumedAgent);
          })
          .catch(async () => {
            // If resume fails but we have session data, create agent without validation
            // This allows offline mode and graceful degradation
            try {
              const offlineAgent = await createAgent(parsedSession.service);
              setSession(parsedSession);
              setAgent(offlineAgent);
            } catch {
              localStorage.removeItem(SESSION_STORAGE_KEY);
            }
          })
          .finally(() => {
            setIsLoading(false);
          });
      } catch {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const signIn = async (service: string, identifier: string, password: string) => {
    const newSession = await loginWithAppPassword(service, identifier, password);
    const newAgent = await resumeSession(newSession);

    setSession(newSession);
    setAgent(newAgent);

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
    localStorage.setItem(PDS_SERVICE_KEY, service);
  };

  const signOut = () => {
    setSession(null);
    setAgent(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!session,
        session,
        agent,
        signIn,
        signOut,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
