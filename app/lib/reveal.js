// lib/generateRevealMarkdown.ts
import { ProposalTemplate, ProposalContent } from '../types';

export const generateRevealMarkdown = (
  template: ProposalTemplate,
  content: ProposalContent
): string => {
  let markdown = '';

  // Title Page
  markdown += `
# ${content.titlePage.title}
_${content.titlePage.subtitle}_

![](${content.titlePage.backgroundImage})

---

`;

  // Continue building the markdown using template sections
  // ...

  return markdown;
};