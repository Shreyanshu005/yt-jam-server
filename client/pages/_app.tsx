import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useState, useEffect, useCallback } from 'react'
import ServerWakeUp from '@/components/ServerWakeUp'

const SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

export default function App({ Component, pageProps }: AppProps) {
  // null = checking, true = server awake, false = server sleeping
  const [serverStatus, setServerStatus] = useState<null | boolean>(null);

  // Quick initial check — if server responds fast, skip the wake-up screen entirely
  useEffect(() => {
    let cancelled = false;

    const quickCheck = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${SERVER_URL}/health`, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok && !cancelled) {
          setServerStatus(true);
          return;
        }
      } catch {
        // Server didn't respond in 2s — it's probably sleeping
      }
      if (!cancelled) {
        setServerStatus(false);
      }
    };

    quickCheck();
    return () => { cancelled = true; };
  }, []);

  const handleServerReady = useCallback(() => {
    setServerStatus(true);
  }, []);

  return (
    <>
      <Head>
        <title>YT Jam - Listen Together</title>
        <meta name="description" content="Listen to YouTube Music together in perfect sync" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {serverStatus === null && (
        // Brief blank screen while we do the initial 2s check
        <div className="min-h-screen bg-black" />
      )}
      {serverStatus === false && (
        <ServerWakeUp onServerReady={handleServerReady} />
      )}
      {serverStatus === true && (
        <Component {...pageProps} />
      )}
    </>
  )
}
