import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import Cookies from 'js-cookie';

const Verify: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  useEffect(() => {
    const verifyCode = async () => {
      try {
        const response = await fetch('/api/verify-login-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          throw new Error('Failed to verify login link');
        }

        // response contains a user id and a proposal id
        const { userId, proposalId } = await response.json();
        // Set authentication cookie
        Cookies.set('auth', userId, { expires: 7 });

        // Redirect to the original proposal page
   
        if (proposalId == -1) {
          router.push('/proposals');
        } else {
          router.push(`/proposal/${proposalId}`);
        }
      } catch (error) {
        console.error(error);
      }
    };

    if (code) {
      verifyCode();
    }
  }, [code, router]);

  return <div>Verifying...</div>;
};

export default Verify;