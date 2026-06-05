import { dbConn } from '../db';

export interface QueueOp { cardId: string; kind: 'put' | 'delete'; }

export async function enqueue(op: QueueOp) { await (await dbConn()).put('syncQueue', op); }
export async function listQueue(): Promise<QueueOp[]> { return (await (await dbConn()).getAll('syncQueue')) as QueueOp[]; }
export async function removeFromQueue(cardId: string) { await (await dbConn()).delete('syncQueue', cardId); }
export async function clearQueue() { await (await dbConn()).clear('syncQueue'); }
