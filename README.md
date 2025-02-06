Proposal Hub

A platform for creating and managing proposals.

Proposal Hub is a platform for creating and managing proposals. It is a web application that allows users to create proposals, send them to clients, and track their progress.

Key Features:
- Store all proposals in one place
  - Create interactive proposals with a simple drag and drop interface
    - Uses AI to generate a proposal from notes, a meeting transcript, or a Q&A chat
  - Upload existing PDF proposals  
    - Uses AI to extract content from PDF
- Send links to proposals to clients via email and/or SMS
  - Proposals are securely viewed online
  - Track proposal read stats including opens, view times per page, and time to first view
  - Clients can add questions and comments for the proposal creator
  - Clients can create a link to share with others
  - *V2* Clients can "chat with the proposal" - ask an AI agent questions about the proposal
- *V2* Proposal creator can update the proposal in response to feedback
  - Changes will be highlighted in the proposal (dynamic proposals only)
  - Clients will be notified of the changes
- *V2* Solicit and track feedback from clients
  - Feedback requests sent via email / SMS
  - Can respond via email / SMS or click on web link
  - Track feedback responses
  - Aggregate feedback responses by proposal into admin dashboard
- Admin dashboard
  - View all proposals
  - View proposal feedback
  - Download proposal feedback
  - Track proposal progress
  - Download proposal
  - Download proposal feedback
  - Download proposal changes

--- 

and proposal displayer.

We want to support two types of proposals - an HTML "single web page" style and a "powerpoint" style using reveal.js

To start, let's focus on the single HTML page approach. We have an example of an HTML proposal in the examples folder.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
