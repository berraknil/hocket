export interface SketchRecord {
  name: string;
  content: string;
  createdAt: string;
}

export interface SketchWithUri extends SketchRecord {
  uri: string;
  cid: string;
}

export interface SketchListItem {
  uri: string;
  cid: string;
  value: SketchRecord;
}
