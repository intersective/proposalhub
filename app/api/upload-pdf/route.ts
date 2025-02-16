import { NextRequest, NextResponse } from 'next/server';
import { uploadProposalImages, createProposal } from '@/app/lib/database/proposalDatabase';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { v4 as uuid } from 'uuid';

export const config = {
    api: {
        bodyParser: false,
    },
};

const handlePDFUpload = async (req: NextRequest) => {
    const buffers: Uint8Array[] = [];
    
    if (req.body) {
        const reader = req.body.getReader();
        let done = false;

        while (!done) {
            const { value, done: readerDone } = await reader.read();
            if (value) {
                buffers.push(value);
            }
            done = readerDone;
        }
    } else {
        throw new Error('Request body is null');
    }
    
    const pdfBuffer = Buffer.concat(buffers);

    try {
        const pdfDoc = await PDFDocument.load(new Uint8Array(pdfBuffer));
        const pageCount = pdfDoc.getPageCount();

        // Generate a new proposal ID using UUID
        const proposalId = uuid();

        const imagePromises = [];
        for (let i = 0; i < pageCount; i++) {
            const pdfImageBuffer = await convertPDFPageToImageBuffer(pdfDoc, i);
            const fileName = `proposals/${proposalId}/page-${i + 1}.png`;
            const imageUrl = await uploadProposalImages(proposalId, fileName, pdfImageBuffer);
            imagePromises.push(imageUrl);
        }

        const imageUrls = await Promise.all(imagePromises);

        // Create the proposal document
        await createProposal(proposalId, {
            id: proposalId,
            images: imageUrls,
            createdAt: new Date(),
            status: 'draft'
        });

        return NextResponse.json({ 
            message: 'PDF uploaded and images extracted', 
            proposalId,
            imageUrls 
        });
    } catch (error) {
        console.error('Error processing PDF:', error);
        return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 });
    }
};

const convertPDFPageToImageBuffer = async (pdfDoc: PDFDocument, pageIndex: number) => {
    // Get the specific page and render it
    const page = pdfDoc.getPage(pageIndex);
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);
    const imageBuffer = await sharp(pdfBuffer, { density: 300 }) // High resolution
        .extract({
            left: 0,
            top: 0,
            width: Math.floor(page.getWidth()),
            height: Math.floor(page.getHeight())
        })
        .png()
        .toBuffer();
    return imageBuffer;
};

export { handlePDFUpload as POST };
