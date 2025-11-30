// Sketch pane matching the lexicon schema
export interface SketchPane {
  target: string;
  content: string;
  order?: number;
}

// Sketch record matching the lexicon schema cc.hocket.sketch
export interface SketchRecord {
  $type?: string;
  name: string;
  description?: string;
  panes: SketchPane[];
  tags?: string[];
  visibility?: "public" | "private";
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
