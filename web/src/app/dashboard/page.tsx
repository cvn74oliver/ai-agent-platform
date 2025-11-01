'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

export default function Dashboard() {
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  if (!email)
    return (
      <div className="p-10 text-center text-white bg-gray-900 h-screen">
        Loading or not signed in… <a href="/login">Login</a>
      </div>
    );

  return (
    <main className="p-10 bg-gray-900 text-white h-screen">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-4">
        Signed in as <b>{email}</b>
      </p>
    </main>
  );
}