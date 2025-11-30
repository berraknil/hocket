// Sketch pane matching the lexicon schema
export interface SketchPane {
  target: string;
  content: string;
  order?: number;
}

// User role in a sketch
export type SketchRole = "owner" | "editor";

// Sketch record matching the lexicon schema cc.hocket.sketch
export interface SketchRecord {
  $type?: string;
  name: string;
  description?: string;
  sessionName?: string; // Flok session name for persistence
  panes: SketchPane[];
  tags?: string[];
  visibility?: "public" | "private";

  // Ownership & permissions
  ownerDid: string; // DID of original creator (immutable)
  ownerHandle: string; // Handle at time of creation (for display)
  role: SketchRole; // This record holder's role (owner or fork)
  forkedFrom?: string; // URI of original sketch (if this is a fork)

  createdAt: string;
  updatedAt?: string;
}

export interface SketchWithUri extends SketchRecord {
  uri: string;
  cid: string;
}

// Response item from listRecords API
export interface SketchListItem {
  uri: string;
  cid: string;
  value: SketchRecord;
}
