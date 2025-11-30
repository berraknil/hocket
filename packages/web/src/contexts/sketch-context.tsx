import React, { createContext, useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import {
  listSketches,
  createSketch,
  updateSketch,
  deleteSketch,
  SketchPane,
} from "../lib/atproto";
import { SketchListItem } from "../lib/sketch-schema";

interface SketchContextType {
  sketches: SketchListItem[];
  isLoading: boolean;
  refreshSketches: () => Promise<void>;
  saveSketch: (name: string, panes: SketchPane[]) => Promise<void>;
  updateExistingSketch: (
    uri: string,
    name: string,
    panes: SketchPane[],
  ) => Promise<void>;
  removeSketch: (uri: string) => Promise<void>;
}

export const SketchContext = createContext<SketchContextType | undefined>(
  undefined,
);

export function SketchProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, agent, session } = useAuth();
  const [sketches, setSketches] = useState<SketchListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshSketches = async () => {
    if (!isAuthenticated || !agent || !session) {
      setSketches([]);
      return;
    }

    setIsLoading(true);
    try {
      const records = await listSketches(agent, session.did);
      setSketches(records as unknown as SketchListItem[]);
    } catch (error) {
      console.error("Failed to load sketches:", error);
      setSketches([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshSketches();
    } else {
      setSketches([]);
    }
  }, [isAuthenticated]);

  const saveSketch = async (name: string, panes: SketchPane[]) => {
    if (!agent || !session) {
      throw new Error("Not authenticated");
    }

    await createSketch(agent, session.did, {
      name,
      panes,
      visibility: "public",
    });

    await refreshSketches();
  };

  const updateExistingSketch = async (
    uri: string,
    name: string,
    panes: SketchPane[],
  ) => {
    if (!agent) {
      throw new Error("Not authenticated");
    }

    await updateSketch(agent, uri, {
      name,
      panes,
      visibility: "public",
    });

    await refreshSketches();
  };

  const removeSketch = async (uri: string) => {
    if (!agent) {
      throw new Error("Not authenticated");
    }

    await deleteSketch(agent, uri);
    await refreshSketches();
  };

  return (
    <SketchContext.Provider
      value={{
        sketches,
        isLoading,
        refreshSketches,
        saveSketch,
        updateExistingSketch,
        removeSketch,
      }}
    >
      {children}
    </SketchContext.Provider>
  );
}
