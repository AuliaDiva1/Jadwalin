'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { roleRoutes } from '@/utils/roleRoutes';

export default function AuthCallback() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const run = async () => {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const token = params.get('token');

      if (!token) {
        router.push('/login?error=google_login_failed');
        return;
      }

      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = res.data;
        if (data.status !== 'success' || !data.data) {
          router.push('/login?error=profile_fetch_failed');
          return;
        }

        const user = data.data;

        localStorage.setItem('TOKEN', token);
        localStorage.setItem('ROLE', user.role);
        localStorage.setItem('USER_NAME', user.full_name);
        localStorage.setItem('USER_EMAIL', user.email);
        localStorage.setItem('USER_ID', String(user.id));

        router.push(roleRoutes[user.role] || '/');
      } catch (err) {
        router.push('/login?error=profile_fetch_failed');
      }
    };

    run();
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Poppins, sans-serif', color: '#64748b', fontSize: 14,
    }}>
      Sedang memproses login...
    </div>
  );
}