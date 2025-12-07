import type { ActionAPIContext } from "astro:actions";
import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { db, eq, and, Proposals, ProposalSections } from "astro:db";

function requireUser(context: ActionAPIContext) {
  const locals = context.locals as App.Locals | undefined;
  const user = locals?.user;

  if (!user) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }

  return user;
}

export const server = {
  createProposal: defineAction({
    input: z.object({
      id: z.string().optional(),
      title: z.string().min(1, "Title is required"),
      clientName: z.string().optional(),
      projectName: z.string().optional(),
      currency: z.string().optional(),
      estimatedValue: z.number().optional(),
      status: z.string().optional(),
      notes: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [proposal] = await db
        .insert(Proposals)
        .values({
          id: input.id ?? crypto.randomUUID(),
          userId: user.id,
          title: input.title,
          clientName: input.clientName,
          projectName: input.projectName,
          currency: input.currency,
          estimatedValue: input.estimatedValue,
          status: input.status,
          notes: input.notes,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return { proposal };
    },
  }),

  updateProposal: defineAction({
    input: z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      clientName: z.string().optional(),
      projectName: z.string().optional(),
      currency: z.string().optional(),
      estimatedValue: z.number().optional(),
      status: z.string().optional(),
      notes: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const { id, ...rest } = input;

      const [existing] = await db
        .select()
        .from(Proposals)
        .where(and(eq(Proposals.id, id), eq(Proposals.userId, user.id)))
        .limit(1);

      if (!existing) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Proposal not found.",
        });
      }

      const updateData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rest)) {
        if (typeof value !== "undefined") {
          updateData[key] = value;
        }
      }

      if (Object.keys(updateData).length === 0) {
        return { proposal: existing };
      }

      const [proposal] = await db
        .update(Proposals)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(and(eq(Proposals.id, id), eq(Proposals.userId, user.id)))
        .returning();

      return { proposal };
    },
  }),

  listProposals: defineAction({
    input: z.object({}).optional(),
    handler: async (_, context) => {
      const user = requireUser(context);

      const proposals = await db.select().from(Proposals).where(eq(Proposals.userId, user.id));

      return { proposals };
    },
  }),

  deleteProposal: defineAction({
    input: z.object({
      id: z.string(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [deleted] = await db
        .delete(Proposals)
        .where(and(eq(Proposals.id, input.id), eq(Proposals.userId, user.id)))
        .returning();

      if (!deleted) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Proposal not found.",
        });
      }

      return { proposal: deleted };
    },
  }),

  saveSection: defineAction({
    input: z.object({
      id: z.string().optional(),
      proposalId: z.string(),
      type: z.string().optional(),
      orderIndex: z.number().int().positive(),
      heading: z.string().optional(),
      content: z.string().min(1, "Content is required"),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [proposal] = await db
        .select()
        .from(Proposals)
        .where(and(eq(Proposals.id, input.proposalId), eq(Proposals.userId, user.id)))
        .limit(1);

      if (!proposal) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Proposal not found.",
        });
      }

      const baseValues = {
        proposalId: input.proposalId,
        type: input.type,
        orderIndex: input.orderIndex,
        heading: input.heading,
        content: input.content,
        createdAt: new Date(),
      };

      if (input.id) {
        const [existing] = await db
          .select()
          .from(ProposalSections)
          .where(eq(ProposalSections.id, input.id))
          .limit(1);

        if (!existing || existing.proposalId !== input.proposalId) {
          throw new ActionError({
            code: "NOT_FOUND",
            message: "Section not found.",
          });
        }

        const [section] = await db
          .update(ProposalSections)
          .set(baseValues)
          .where(eq(ProposalSections.id, input.id))
          .returning();

        return { section };
      }

      const [section] = await db.insert(ProposalSections).values(baseValues).returning();
      return { section };
    },
  }),

  deleteSection: defineAction({
    input: z.object({
      id: z.string(),
      proposalId: z.string(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [proposal] = await db
        .select()
        .from(Proposals)
        .where(and(eq(Proposals.id, input.proposalId), eq(Proposals.userId, user.id)))
        .limit(1);

      if (!proposal) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Proposal not found.",
        });
      }

      const [deleted] = await db
        .delete(ProposalSections)
        .where(and(eq(ProposalSections.id, input.id), eq(ProposalSections.proposalId, input.proposalId)))
        .returning();

      if (!deleted) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Section not found.",
        });
      }

      return { section: deleted };
    },
  }),

  getProposalWithSections: defineAction({
    input: z.object({
      id: z.string(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [proposal] = await db
        .select()
        .from(Proposals)
        .where(and(eq(Proposals.id, input.id), eq(Proposals.userId, user.id)))
        .limit(1);

      if (!proposal) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Proposal not found.",
        });
      }

      const sections = await db
        .select()
        .from(ProposalSections)
        .where(eq(ProposalSections.proposalId, input.id));

      return { proposal, sections };
    },
  }),
};
