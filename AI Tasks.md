  
[] Improve the current proposal UI
    [x] Move the organization search form to the organization section when there is no organization yet. When the results come back just fill in the section but now have the accept / replace buttons. Any changes to this section should update the organization in the database. Once accepted, there is an edit button that allows the user to change the organization details or replace it with a new organization via search.

    [x] Do the same for the contact section.

    [x] Allow sections to added, removed, collapsed, and reordered via dragging and dropping.

    [x] Add a "improve" button to the section that allows the user to ask the AI to improve the section.

Let's create placeholder pages for functionality that doesn't exist yet. These pages will explain the feature and what it will do. Once the feature is implemented, the placeholder explanation will be replaced with the actual feature and will become a "help" page, which will be used to explain the feature to users. This page will be updated to reflect the actual feature.

Features to create:

/manage/team - The purpose of this section is to show the contacts that are available to be assigned to proposals created by the organization. We can search contacts that are already associated with the organization and add them to the team. We can also create new contacts via the team section. Not all organization contacts will be in the team.

/manage/opportunities - The purpose of this section is to show the RFPs that have been received and requested by the organization. An RFP can be added by giving a URL to an RFP or uploading an RFP doc/pdf. The RFP will be parsed and the data will be used to populate an RFP entry. The RFP entry will be used to generate a proposal. It is also possible to reverse the process and use a proposal to create an RFP.

The tabs of the /manage/proposals section are:
- Analysis
- Requirements
- Delivery Team
- Content
- Layout
- Share

Analysis tab: This tab shows data about the proposal. While the proposal is in draft mode, it will show what has been done and what needs to be done. It will also contain the button to publish the proposal, which will send an email to the requesting organization's shared contacts with a link to view the proposal.

Requirements tab: This will be the first tab of the proposal page. It contains the requesting organization and lead contact info. It has the following sections:
  - Overview
  - Requirements
  - Timeline
  - Budget
  - Notes
  - Reference Documents (uploaded files)

The requirements section can be converted to an RFP, or generated from an RFP.

Delivery Team tab: This tab shows the team that is assigned to the proposal. You can add and remove team members from this tab.

Content tab: This tab shows the content of the proposal. This tab has been created.

Layout tab: This tab shows the layout of the proposal. This tab has been created.

Share tab: This tab shows who can access the proposal and what access they have been granted. This tab has been created.



Fix the chat - it's not working as expected. We need the intro message to show, the "AI is thinking" message is showing as an err message. It's not working interactively with the proposal

We need to improve the "improvements" - when the button is pulsing it means there's a waiting improvement for the section based on other conversations. But it's just pulsing all the time. We are storing improvements in the database, let's actually make this a full section version contorol system.

Add the organization and contact info to the top of the proposal. Allow for editing in a modal. Same modal used when in the org/contact section.

[] Uses AI to generate a proposal from notes, a meeting transcript, or a Q&A chat
    [] Threaded chat so we can have a conversation with the AI and then tell it to use the info to improve sections.
    [] Upload existing PDF proposals     
        [] Uses AI to extract content from PDF

[] Download proposal as pdf, markdown, and docx.

[] Start working on services section.


[] Create interactive proposals with a simple drag and drop interface


- Send links to proposals to contacts via email and/or SMS
  - Proposals are securely viewed online
  - Track proposal read stats including opens, view times per page, and time to first view
  - Contacts can add questions and comments for the proposal creator
  - Contacts can create a link to share with others
  - *V2* Contacts can "chat with the proposal" - ask an AI agent questions about the proposal
- *V2* Proposal creator can update the proposal in response to feedback
  - Changes will be highlighted in the proposal (dynamic proposals only)
  - Contacts will be notified of the changes
- *V2* Solicit and track feedback from contacts
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