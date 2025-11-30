import { BskyAgent, AtpSessionData } from "@atproto/api";
import { SketchRecord, SketchPane } from "./sketch-schema";

// Re-export types for convenience
export type { SketchRecord, SketchPane };
export type { SketchListItem } from "./sketch-schema";

export interface SessionData extends AtpSessionData {
  service: string;
}

export const DEFAULT_PDS_SERVICES = [
  "https://bsky.social",
  "https://tangled.social",
];

export const SKETCH_COLLECTION = "cc.hocket.sketch";

export interface SketchInput {
  name: string;
  description?: string;
  sessionName?: string; // Flok session name for persistence
  panes: SketchPane[];
  tags?: string[];
  visibility?: "public" | "private";
}

export async function createAgent(service: string): Promise<BskyAgent> {
  const agent = new BskyAgent({ service });
  return agent;
}

export async function loginWithAppPassword(
  service: string,
  identifier: string,
  password: string,
): Promise<SessionData> {
  const agent = await createAgent(service);
  const response = await agent.login({ identifier, password });

  return {
    did: response.data.did,
    handle: response.data.handle,
    accessJwt: response.data.accessJwt,
    refreshJwt: response.data.refreshJwt,
    active: response.data.active ?? true,
    service,
  };
}

export async function resumeSession(session: SessionData): Promise<BskyAgent> {
  const agent = await createAgent(session.service);
  await agent.resumeSession(session);
  return agent;
}

export async function listSketches(agent: BskyAgent, did: string) {
  const response = await agent.com.atproto.repo.listRecords({
    repo: did,
    collection: SKETCH_COLLECTION,
  });

  return response.data.records;
}

export async function getSketch(
  agent: BskyAgent,
  uri: string,
): Promise<{ uri: string; cid: string; value: SketchRecord }> {
  const response = await agent.com.atproto.repo.getRecord({
    repo: uri.split("/")[2],
    collection: SKETCH_COLLECTION,
    rkey: uri.split("/")[4],
  });

  return response.data as unknown as {
    uri: string;
    cid: string;
    value: SketchRecord;
  };
}

export async function createSketch(
  agent: BskyAgent,
  did: string,
  sketch: SketchInput,
) {
  const now = new Date().toISOString();
  const response = await agent.com.atproto.repo.createRecord({
    repo: did,
    collection: SKETCH_COLLECTION,
    record: {
      $type: SKETCH_COLLECTION,
      name: sketch.name,
      description: sketch.description,
      sessionName: sketch.sessionName,
      panes: sketch.panes.map((pane, index) => ({
        target: pane.target,
        content: pane.content,
        order: pane.order ?? index,
      })),
      tags: sketch.tags,
      visibility: sketch.visibility || "public",
      createdAt: now,
      updatedAt: now,
    },
  });

  return response.data;
}

export async function updateSketch(
  agent: BskyAgent,
  uri: string,
  sketch: SketchInput,
) {
  const parts = uri.split("/");
  const repo = parts[2];
  const rkey = parts[4];

  // Get existing record to preserve createdAt and sessionName
  const existing = await getSketch(agent, uri);

  const response = await agent.com.atproto.repo.putRecord({
    repo,
    collection: SKETCH_COLLECTION,
    rkey,
    record: {
      $type: SKETCH_COLLECTION,
      name: sketch.name,
      description: sketch.description,
      sessionName: sketch.sessionName || existing.value.sessionName,
      panes: sketch.panes.map((pane, index) => ({
        target: pane.target,
        content: pane.content,
        order: pane.order ?? index,
      })),
      tags: sketch.tags,
      visibility: sketch.visibility || "public",
      createdAt: existing.value.createdAt,
      updatedAt: new Date().toISOString(),
    },
  });

  return response.data;
}

export async function deleteSketch(agent: BskyAgent, uri: string) {
  const parts = uri.split("/");
  const repo = parts[2];
  const rkey = parts[4];

  await agent.com.atproto.repo.deleteRecord({
    repo,
    collection: SKETCH_COLLECTION,
    rkey,
  });
}
