export type ProposalDraft = {
  title: string;
  clientName: string;
  preparedBy: string;
  summary: string;
  scopeOfWork: string;
  deliverables: string;
  timeline: string;
  pricing: string;
  terms: string;
  showDeliverables: boolean;
  showTimeline: boolean;
  showPricing: boolean;
  showTerms: boolean;
};

export type ProposalSectionKey =
  | "summary"
  | "scopeOfWork"
  | "deliverables"
  | "timeline"
  | "pricing"
  | "terms";

export const PROPOSAL_STORAGE_KEY = "ansiversa:proposal-writer:v1:draft";

export const createDefaultProposalDraft = (): ProposalDraft => ({
  title: "",
  clientName: "",
  preparedBy: "",
  summary: "",
  scopeOfWork: "",
  deliverables: "",
  timeline: "",
  pricing: "",
  terms: "",
  showDeliverables: true,
  showTimeline: true,
  showPricing: true,
  showTerms: true,
});

export const proposalPreviewPlaceholders: Record<ProposalSectionKey, string> = {
  summary: "Summarize the project goals, the business need, and the value this proposal is designed to deliver.",
  scopeOfWork: "Outline the work included in this proposal so responsibilities and boundaries are clear.",
  deliverables: "List the concrete outputs the client can expect from this engagement.",
  timeline: "Explain the expected delivery window, milestones, or working cadence.",
  pricing: "Describe pricing, budget, or fee structure in a way that is easy to review and approve.",
  terms: "Add key terms, assumptions, or notes that should be clear before work begins.",
};

const SECTION_TITLES: Record<ProposalSectionKey, string> = {
  summary: "Executive Summary",
  scopeOfWork: "Scope of Work",
  deliverables: "Deliverables",
  timeline: "Timeline",
  pricing: "Pricing",
  terms: "Terms / Notes",
};

export const getProposalSectionTitle = (key: ProposalSectionKey) => SECTION_TITLES[key];

export const getProposalSectionContent = (
  draft: ProposalDraft,
  key: ProposalSectionKey,
) => {
  const value = draft[key];
  return value.trim() || proposalPreviewPlaceholders[key];
};

export const buildProposalSectionText = (
  draft: ProposalDraft,
  key: ProposalSectionKey,
) => {
  return `${SECTION_TITLES[key]}\n${getProposalSectionContent(draft, key)}`;
};

export const buildProposalText = (draft: ProposalDraft) => {
  const lines: string[] = [
    draft.title.trim() || "Untitled Proposal",
    "",
    `Prepared for: ${draft.clientName.trim() || "Client name to be added"}`,
    `Prepared by: ${draft.preparedBy.trim() || "Prepared by to be added"}`,
    "",
    buildProposalSectionText(draft, "summary"),
    "",
    buildProposalSectionText(draft, "scopeOfWork"),
  ];

  if (draft.showDeliverables) {
    lines.push("", buildProposalSectionText(draft, "deliverables"));
  }

  if (draft.showTimeline) {
    lines.push("", buildProposalSectionText(draft, "timeline"));
  }

  if (draft.showPricing) {
    lines.push("", buildProposalSectionText(draft, "pricing"));
  }

  if (draft.showTerms) {
    lines.push("", buildProposalSectionText(draft, "terms"));
  }

  return lines.join("\n").trim();
};
