"use client";
// pages/manage/index.tsx
import { useEffect, useState } from 'react';
import { useRouter, redirect } from 'next/navigation';
import { auth } from '@/auth';
const AdminDashboard: React.FC = () => {
  interface Proposal {
    id: string;
    title: string;
    status: string;
  }
  
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    // get proposals from /api/proposals
    const fetchProposals = async () => {
      const session = await auth();
      if (!session?.user?.email) {
        redirect('/signin');
      }
      const res = await fetch('/api/proposals');
      const data = await res.json();
      setProposals(data);
    };

    fetchProposals();
  }, []);

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <button onClick={() => router.push('/manage/new-proposal')}>Create New Proposal</button>
      <ul>
        {proposals.map(proposal => (
          <li key={proposal.id}>
            {proposal.title} - {proposal.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminDashboard;