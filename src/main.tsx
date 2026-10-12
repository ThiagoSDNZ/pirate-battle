import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './styles.css';
import { worker } from './mocks/browser';

const startApp = async () => {
  try { await worker.start({ onUnhandledRequest: 'bypass' }); } catch (error) { console.warn('MSW worker could not start. Generate its service worker with `npx msw init assets --save` before deployment.', error); }
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 10_000, retry: 1, refetchOnWindowFocus: true }, mutations: { retry: 0 } } });
  createRoot(document.getElementById('root')!).render(<React.StrictMode><QueryClientProvider client={queryClient}><App /></QueryClientProvider></React.StrictMode>);
};
void startApp();
