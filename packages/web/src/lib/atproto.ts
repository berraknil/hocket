import { BskyAgent, AtpSessionData } from '@atproto/api';

export interface SessionData extends AtpSessionData {
  service: string;
}

export const DEFAULT_PDS_SERVICES = [
  'https://bsky.social',
  'https://tangled.social',
];

export const SKETCH_COLLECTION = 'cc.hocket.sketch';

export async function createAgent(service: string): Promise<BskyAgent> {
  const agent = new BskyAgent({ service });
  return agent;
}

export async function loginWithAppPassword(
  service: string,
  identifier: string,
  password: string
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

export async function getSketch(agent: BskyAgent, uri: string) {
  const response = await agent.com.atproto.repo.getRecord({
    repo: uri.split('/')[2],
    collection: SKETCH_COLLECTION,
    rkey: uri.split('/')[4],
  });

  return response.data;
}

export async function createSketch(
  agent: BskyAgent,
  did: string,
  sketch: {
    name: string;
    content: string;
    createdAt?: string;
  }
) {
  const response = await agent.com.atproto.repo.createRecord({
    repo: did,
    collection: SKETCH_COLLECTION,
    record: {
      name: sketch.name,
      content: sketch.content,
      createdAt: sketch.createdAt || new Date().toISOString(),
    },
  });

  return response.data;
}

export async function updateSketch(
  agent: BskyAgent,
  uri: string,
  sketch: {
    name: string;
    content: string;
    createdAt?: string;
  }
) {
  const parts = uri.split('/');
  const repo = parts[2];
  const rkey = parts[4];

  const response = await agent.com.atproto.repo.putRecord({
    repo,
    collection: SKETCH_COLLECTION,
    rkey,
    record: {
      name: sketch.name,
      content: sketch.content,
      createdAt: sketch.createdAt || new Date().toISOString(),
    },
  });

  return response.data;
}

export async function deleteSketch(agent: BskyAgent, uri: string) {
  const parts = uri.split('/');
  const repo = parts[2];
  const rkey = parts[4];

  await agent.com.atproto.repo.deleteRecord({
    repo,
    collection: SKETCH_COLLECTION,
    rkey,
  });
}
