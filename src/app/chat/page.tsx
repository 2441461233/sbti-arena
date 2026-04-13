'use client';

import { Suspense } from 'react';
import ChatArena from './ChatArena';

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-black text-white">Loading...</div>}>
      <ChatArena />
    </Suspense>
  );
}
