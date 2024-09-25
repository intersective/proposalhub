"use client";
// pages/admin/edit-proposal.tsx
import withAdminAuth from '../../../components/withAdminAuth';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { db } from '../../../lib/proposalDatabase';

const EditProposal: React.FC = () => {
  const router = useRouter();
  const { templateId } = router.query;
  const [template, setTemplate] = useState(null);
  const [content, setContent] = useState({});

  useEffect(() => {
    if (templateId) {
      const fetchTemplate = async () => {
        const docRef = doc(db, 'templates', templateId as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTemplate(docSnap.data());
        }
      };

      fetchTemplate();
    }
  }, [templateId]);

  const handleInputChange = (sectionId, value) => {
    setContent(prev => ({ ...prev, [sectionId]: value }));
  };

  const handleSave = async () => {
    const proposalRef = doc(collection(db, 'proposals'));
    await setDoc(proposalRef, {
      templateId,
      content,
      status: 'draft',
      createdAt: new Date(),
    });
    router.push('/admin');
  };

  const handlePublish = async () => {
    const uniqueUrl = generateUniqueUrl(); // Implement this function
    await setDoc(proposalRef, {
      ...proposalData,
      status: 'sent',
      uniqueUrl,
    });
  
    // Send emails to recipients
    await sendProposalEmails(recipientEmails, uniqueUrl, customMessage);
  
    router.push('/admin');
  };

  if (!template) return <p>Loading...</p>;

  return (
    <div>
      <h1>Edit Proposal</h1>
      {template.sections.map(section => (
        <div key={section.id}>
          <h2>{section.title}</h2>
          <input
            type="text"
            value={content[section.id] || ''}
            onChange={e => handleInputChange(section.id, e.target.value)}
          />
        </div>
      ))}
      <button onClick={handleSave}>Save Proposal</button>
    </div>
  );
};

export default withAdminAuth(EditProposal);