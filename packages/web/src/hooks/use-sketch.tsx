import { useContext } from "react";
import { SketchContext } from "../contexts/sketch-context";

export function useSketch() {
  const context = useContext(SketchContext);
  if (context === undefined) {
    throw new Error("useSketch must be used within a SketchProvider");
  }
  return context;
}
