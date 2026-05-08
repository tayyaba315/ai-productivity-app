import { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useAuth } from '../app/context/AuthContext';
import { apiUrl } from '../lib/api';

type GoogleStatus = {
  connected: boolean;
  email: string;
  updated_at: string | null;
};

const DEFAULT_STATUS: GoogleStatus = {
  connected: false,
  email: '',
  updated_at: null,
};

export default function GoogleIntegrationIndicator() {
  const { user } = useAuth();
  const [status, setStatus] = useState<GoogleStatus>(DEFAULT_STATUS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      setLoading(true);
      setError('');
      try {
        const emailQuery = user?.email ? `?email=${encodeURIComponent(user.email)}` : '';
        const res = await fetch(`${apiUrl('/integrations/status')}${emailQuery}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.detail || 'Failed to fetch Google integration status');
        setStatus(data?.google || DEFAULT_STATUS);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch Google integration status');
        setStatus(DEFAULT_STATUS);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [user?.email]);

  return (
    <div className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-[#EDEDED]">
        {status.connected ? (
          <Cloud className="w-4 h-4 text-[#8B5CF6]" />
        ) : (
          <CloudOff className="w-4 h-4 text-[#A3A3A3]" />
        )}
        <span>
          {status.connected
            ? `Google connected${status.email ? ` as ${status.email}` : ''}`
            : 'Google not connected'}
        </span>
      </div>
      <p className="mt-1 text-xs text-[#A3A3A3]">
        Last sync:{' '}
        {status.updated_at ? new Date(status.updated_at).toLocaleString() : 'Not available yet'}
      </p>
      {loading && (
        <p className="mt-1 text-xs text-[#A3A3A3] flex items-center gap-1">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Checking Google status...
        </p>
      )}
      {error && <p className="mt-1 text-xs text-[#F87171]">{error}</p>}
    </div>
  );
}
