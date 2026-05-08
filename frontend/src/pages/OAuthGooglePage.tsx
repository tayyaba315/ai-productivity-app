import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../app/context/AuthContext';

export default function OAuthGooglePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeOAuth } = useAuth();
  const [error, setError] = useState('');

  const payload = useMemo(() => {
    const token = String(searchParams.get('token') || '');
    const email = String(searchParams.get('email') || '');
    const name = String(searchParams.get('name') || '');
    const next = String(searchParams.get('next') || '/dashboard');
    return { token, email, name, next };
  }, [searchParams]);

  useEffect(() => {
    if (!payload.token || !payload.email) {
      setError('Google sign-in failed. Please try again.');
      return;
    }
    completeOAuth({ token: payload.token, email: payload.email, name: payload.name || payload.email.split('@')[0] });
    navigate(payload.next || '/dashboard', { replace: true });
  }, [completeOAuth, navigate, payload.email, payload.name, payload.next, payload.token]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-6">
      <div className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] p-6 text-center w-full max-w-md">
        {!error ? (
          <>
            <p className="text-[#EDEDED] font-semibold">Finishing Google sign-in…</p>
            <p className="text-sm text-[#A3A3A3] mt-2">You’ll be redirected automatically.</p>
          </>
        ) : (
          <>
            <p className="text-[#F87171] font-semibold">{error}</p>
            <button
              className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

