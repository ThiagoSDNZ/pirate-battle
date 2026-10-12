import { http, HttpResponse, delay } from 'msw';
import type { MatchRecord, NetworkScenario, Page } from '../api/types';
const STORE = 'pirate-battle-records-v1';
const SCENARIO = 'pirate-battle-network-scenario';
const playerId = 'captain-local';
const fixtures: MatchRecord[] = [];
const historyFixtures: MatchRecord[] = [];
function scenario(): NetworkScenario { return (localStorage.getItem(SCENARIO) as NetworkScenario) || 'normal'; }
function records(): MatchRecord[] { try { return JSON.parse(localStorage.getItem(STORE) || '[]') as MatchRecord[]; } catch { return []; } }
function save(items: MatchRecord[]) { localStorage.setItem(STORE, JSON.stringify(items)); }
async function simulate() { const mode = scenario(); if (mode === 'slow') await delay(1800); if (mode === 'offline') return HttpResponse.error(); if (mode === 'server-error') return HttpResponse.json({ message: 'Simulated server failure' }, { status: 503 }); return null; }
function paginated(items: MatchRecord[], page: number): Page<MatchRecord> { const pageSize = 5; return { items: items.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: items.length }; }
export const handlers = [
  http.get('/api/ranking', async ({ request }) => { const fail = await simulate(); if (fail) return fail; if (scenario() === 'empty') return HttpResponse.json(paginated([], Number(new URL(request.url).searchParams.get('page') || 1))); const list = [...fixtures, ...records()].filter((r, i, all) => all.findIndex(x => x.id === r.id) === i).sort((a, b) => b.score - a.score || b.date.localeCompare(a.date)); return HttpResponse.json(paginated(list, Number(new URL(request.url).searchParams.get('page') || 1))); }),
  http.get('/api/history', async ({ request }) => { const fail = await simulate(); if (fail) return fail; const list = scenario() === 'empty' ? [] : [...historyFixtures, ...records().filter(r => r.playerId === playerId)].filter((r, i, all) => all.findIndex(x => x.id === r.id) === i).sort((a, b) => b.date.localeCompare(a.date)); return HttpResponse.json(paginated(list, Number(new URL(request.url).searchParams.get('page') || 1))); }),
  http.post('/api/matches', async ({ request }) => { const fail = await simulate(); if (fail) return fail; const incoming = await request.json() as MatchRecord; const list = records(); const existing = list.find(r => r.id === incoming.id); if (existing) return HttpResponse.json(existing); const saved = { ...incoming, playerId, playerName: 'You', shipName: (incoming.shipName || 'The Sea Rover').trim().slice(0, 24) || 'The Sea Rover' }; save([saved, ...list]); return HttpResponse.json(saved, { status: 201 }); }),
];
export { STORE as MATCH_STORE_KEY, SCENARIO as SCENARIO_KEY };
