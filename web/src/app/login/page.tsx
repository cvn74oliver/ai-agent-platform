'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // If already signed in, go to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard');
    });
  }, [router, supabase]);

  // 🔐 Password Login
  async function signInWithPassword() {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) alert(error.message);
    else router.replace('/dashboard');
  }

  // ✉️ Magic Link Login
  async function signInWithMagicLink() {
    setLoading(true);

    const redirect = new URL('/auth/callback', window.location.origin).toString();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirect },
    });

    setLoading(false);

    if (error) alert(error.message);
    else alert('Check your email for the magic link!');
  }

  return (
    <main className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">Sign in to Automata</h1>

      {/* Email */}
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="p-3 rounded text-black w-72"
      />

      {/* Password */}
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="p-3 rounded text-black w-72 mt-3"
      />

      {/* Password Login Button */}
      <button
        onClick={signInWithPassword}
        disabled={loading}
        className="mt-4 bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded w-72"
      >
        {loading ? 'Signing in...' : 'Sign In with Password'}
      </button>

      {/* Divider */}
      <div className="my-4 text-gray-400 text-sm">or</div>

      {/* Magic Link Button */}
      <button
        onClick={signInWithMagicLink}
        disabled={loading}
        className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded w-72"
      >
        Send Magic Link
      </button>
    </main>
  );
}