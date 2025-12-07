import { defineTable, column, NOW } from "astro:db";

export const Proposals = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text(),
    title: column.text(),                 // Internal name, e.g. "Website proposal for ACME"
    clientName: column.text({ optional: true }),
    projectName: column.text({ optional: true }),
    currency: column.text({ optional: true }), // "AED", "INR", "USD"
    estimatedValue: column.number({ optional: true }),
    status: column.text({ optional: true }),   // "draft", "sent", "accepted", "rejected"
    notes: column.text({ optional: true }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const ProposalSections = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    proposalId: column.text({
      references: () => Proposals.columns.id,
    }),
    type: column.text({ optional: true }),   // "intro", "scope", "timeline", "pricing", "terms", etc.
    orderIndex: column.number(),            // 1, 2, 3...
    heading: column.text({ optional: true }),
    content: column.text(),
    createdAt: column.date({ default: NOW }),
  },
});

export const tables = {
  Proposals,
  ProposalSections,
} as const;
