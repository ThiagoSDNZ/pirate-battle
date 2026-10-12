import axios from 'axios';
import type { MatchRecord, Page } from './types';
export const http = axios.create({ baseURL: '/api', timeout: 5000, headers: { 'Content-Type': 'application/json' } });
export const api = {
  ranking: async (page = 1) => (await http.get<Page<MatchRecord>>('/ranking', { params: { page } })).data,
  history: async (page = 1) => (await http.get<Page<MatchRecord>>('/history', { params: { page } })).data,
  submitMatch: async (record: MatchRecord) => (await http.post<MatchRecord>('/matches', record, { headers: { 'Idempotency-Key': record.id } })).data,
};
