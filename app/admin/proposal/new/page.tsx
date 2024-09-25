'use client'
// pages/admin/new-proposal.tsx
import { useState } from 'react';

const NewProposal: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    // Send to API to handle image extraction
    const response = await fetch('/api/upload-pdf', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      console.log('PDF uploaded successfully');
    } else {
      console.error('Error uploading PDF');
    }
  };

  return (
    <div>
      <h1>Upload PDF Proposal</h1>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload Proposal</button>
    </div>
  );
};

export default NewProposal;