'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState('');

  // If already signed in, go straight to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push('/dashboard');
    });
  }, [router, supabase]);

  async function signIn() {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          'https://ai-agent-platform-eta.vercel.app/auth/callback', // replace with your exact Vercel domain
      },
    });
    if (error) alert(error.message);
    else alert('Check your email for the magic link!');
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
        Send Magic Link
      </button>
    </main>
  );
}