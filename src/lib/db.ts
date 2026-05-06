import Dexie, { type Table } from 'dexie';

export interface MindMap {
  id?: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MindMapNode {
  id: string;
  mapId: number;
  parentId: string | null;
  text: string;
  x: number;
  y: number;
  color: string;
  collapsed?: boolean;
  image?: string; // base64 data URL
}

class MindMapDB extends Dexie {
  maps!: Table<MindMap, number>;
  nodes!: Table<MindMapNode, string>;

  constructor() {
    super('MindMapDB');
    this.version(1).stores({
      maps: '++id, title, createdAt, updatedAt',
      nodes: 'id, mapId, parentId',
    });
  }
}

export const db = new MindMapDB();

export async function getOrCreateDefaultMap(): Promise<{ map: MindMap; nodes: MindMapNode[] }> {
  const maps = await db.maps.orderBy('updatedAt').reverse().toArray();
  if (maps.length > 0) {
    const map = maps[0];
    const nodes = await db.nodes.where('mapId').equals(map.id!).toArray();
    return { map, nodes };
  }

  const rootId = crypto.randomUUID();
  const mapId = await db.maps.add({
    title: 'My First Mind Map',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const rootNode: MindMapNode = {
    id: rootId,
    mapId: mapId as number,
    parentId: null,
    text: 'Central Idea',
    x: 0,
    y: 0,
    color: 'hsl(217, 91%, 60%)',
  };

  await db.nodes.add(rootNode);
  const map = await db.maps.get(mapId as number);
  return { map: map!, nodes: [rootNode] };
}

export async function saveNodes(mapId: number, nodes: MindMapNode[]) {
  await db.transaction('rw', db.nodes, db.maps, async () => {
    await db.nodes.where('mapId').equals(mapId).delete();
    await db.nodes.bulkAdd(nodes);
    await db.maps.update(mapId, { updatedAt: new Date() });
  });
}

export async function updateMapTitle(mapId: number, title: string) {
  await db.maps.update(mapId, { title, updatedAt: new Date() });
}
