'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState('');

  // Check session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push('/dashboard');
    });
  }, [router, supabase]);

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: 'testpassword',
    });
    if (error) alert(error.message);
    else router.push('/dashboard');
  }

  return (
    <main className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">Sign in to your AI Agent</h1>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="p-3 rounded text-black w-72"
      />
      <button
        onClick={signIn}
        className="mt-4 bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded"
      >
        Sign In
      </button>
    </main>
  );
}