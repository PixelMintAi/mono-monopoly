'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/game'); // Change to your actual route, e.g., /game/room123
  }, [router]);

  return null; // or a loading spinner while redirecting
}
