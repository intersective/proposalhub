import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Cookies from 'js-cookie';

interface Proposal {
    id: string;
    title: string;
}

const ProposalsPage = () => {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    useEffect(() => {
        const verifyCookie = async () => {
            // read the auth cookie, the value is the userId, set it to the state
            const userId = Cookies.get('auth') || null;
            if (!userId) {
                router.push('/login');
                return;
            }
            setUserId(userId);
            fetchProposals();
        };

        const fetchProposals = async () => {
            try {
                const response = await fetch('/api/proposals', {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId }),
                });
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setProposals(data);
            } catch (err) {
                setError('Failed to fetch proposals.');
            } finally {
                setLoading(false);
            }
        };
        verifyCookie();
    }, [router]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div>
            <h1>Proposals</h1>
            <ul>
                {proposals.map((proposal) => (
                    <li key={proposal.id}>
                        <Link href={`/proposal/${proposal.id}`}>
                            <a>{proposal.title}</a>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ProposalsPage;