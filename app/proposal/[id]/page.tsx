"use client";
// pages/proposal/[id].tsx
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface Proposal {
  images: string[];
}

const ProposalView: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [email, setEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);

  useEffect(() => {
    // call api to get proposal data
    const fetchProposal = async () => {
      const res = await fetch(`/api/proposal/${id}`);
      const data = await res.json();
      setProposal(data);
    };

    const authCookie = Cookies.get('auth');
    if (authCookie) {
      setIsAuthenticated(true);
      fetchProposal();
    }
  }, [id]);
  useEffect(() => {
    const authCookie = Cookies.get('auth');
    if (authCookie) {
      setIsAuthenticated(true);
    }
  }, []);

  const sendLoginLink = async () => {
    // make call to /api/send-login-link
    // with email and proposal id
    try {
      const response = await fetch('/api/send-login-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: 'login', email, id }),
      });

      if (!response.ok) {
        throw new Error('Failed to send login link');
      }

      alert('Login link sent successfully!');
    } catch (error) {
      console.error('Error sending login link:', error);
      alert('Error sending login link');
    }
  }


  if (!isAuthenticated) {
    return (
      <div>
        <h1>Verify Your Email</h1>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <button onClick={sendLoginLink}>Send Login Link</button>
      </div>
    );
  }

  if (!proposal) return <p>Loading...</p>;

  // Fetch and display the proposal using reveal.js
  // Implement the reveal.js rendering here
  return (
    <div>
      <h1>Proposal {id}</h1>
      <div className="grid grid-cols-1 gap-4">
        {proposal.images.map((imageUrl, index) => (
          <img key={index} src={imageUrl} alt={`Page ${index + 1}`} className="w-full h-auto" />
        ))}
      </div>
    </div>
  );

};

export default ProposalView;