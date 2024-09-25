import { NextRequest, NextResponse } from 'next/server';
import { uploadProposalImages, createProposal } from '../../lib/proposalDatabase';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

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
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const pageCount = pdfDoc.getPageCount();

        const proposalId = doc(db, 'proposals').id; // Generate a new proposal ID

        const imagePromises = [];
        for (let i = 0; i < pageCount; i++) {
            // const page = pdfDoc.getPage(i);
            const pdfImageBuffer = await convertPDFPageToImageBuffer(pdfDoc, i);

            const fileName = `${proposalId}/page-${i + 1}.png`;
            const imageUrl = await uploadProposalImages(proposalId, fileName, pdfImageBuffer);

            imagePromises.push(imageUrl);
        }

        const imageUrls = await Promise.all(imagePromises);

        return NextResponse.json({ message: 'PDF uploaded and images extracted', imageUrls });
    } catch (error) {
        console.error('Error processing PDF:', error);
        return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 });
    }
};

const convertPDFPageToImageBuffer = async (pdfDoc: PDFDocument, pageIndex: number) => {
    const pdfPage = pdfDoc.getPage(pageIndex);
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);
    const imageBuffer = await sharp(pdfBuffer, { density: 300 }) // High resolution
        .png()
        .toBuffer();
    return imageBuffer;
};

export default handlePDFUpload;
