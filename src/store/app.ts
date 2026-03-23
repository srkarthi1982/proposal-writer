import type { Alpine } from "alpinejs";
import { AvBaseStore } from "@ansiversa/components/alpine";
import {
  PROPOSAL_STORAGE_KEY,
  buildProposalSectionText,
  buildProposalText,
  createDefaultProposalDraft,
  getProposalSectionContent,
  getProposalSectionTitle,
  type ProposalDraft,
  type ProposalSectionKey,
} from "../lib/proposal";

type ToggleField = "showDeliverables" | "showTimeline" | "showPricing" | "showTerms";

const cloneDefaultDraft = () => createDefaultProposalDraft();

const copyText = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

export class ProposalAppStore extends AvBaseStore {
  draft: ProposalDraft = cloneDefaultDraft();
  initialized = false;
  copyMessage = "";
  copyError = "";
  showResetConfirmation = false;

  init() {
    if (this.initialized || typeof window === "undefined") return;

    this.initialized = true;

    try {
      const saved = window.localStorage.getItem(PROPOSAL_STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved) as Partial<ProposalDraft>;
      this.draft = {
        ...cloneDefaultDraft(),
        ...parsed,
      };
    } catch (error) {
      console.error(error);
    }
  }

  updateField(field: keyof ProposalDraft, value: string) {
    this.draft = {
      ...this.draft,
      [field]: value,
    };
    this.clearTransientState();
    this.persist();
  }

  updateToggle(field: ToggleField, checked: boolean) {
    this.draft = {
      ...this.draft,
      [field]: checked,
    };
    this.clearTransientState();
    this.persist();
  }

  getPreviewValue(key: ProposalSectionKey) {
    return getProposalSectionContent(this.draft, key);
  }

  getSectionTitle(key: ProposalSectionKey) {
    return getProposalSectionTitle(key);
  }

  async copyFullProposal() {
    await this.copy(buildProposalText(this.draft), "Full proposal copied");
  }

  async copySection(key: ProposalSectionKey) {
    await this.copy(buildProposalSectionText(this.draft, key), `${getProposalSectionTitle(key)} copied`);
  }

  requestReset() {
    this.showResetConfirmation = true;
    this.copyMessage = "";
    this.copyError = "";
  }

  cancelReset() {
    this.showResetConfirmation = false;
  }

  confirmReset() {
    this.draft = cloneDefaultDraft();
    this.showResetConfirmation = false;
    this.copyMessage = "Draft cleared";
    this.copyError = "";

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(PROPOSAL_STORAGE_KEY);
    }
  }

  private persist() {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PROPOSAL_STORAGE_KEY, JSON.stringify(this.draft));
  }

  private clearTransientState() {
    this.copyMessage = "";
    this.copyError = "";
    this.showResetConfirmation = false;
  }

  private async copy(text: string, successMessage: string) {
    try {
      await copyText(text);
      this.copyMessage = successMessage;
      this.copyError = "";
    } catch (error) {
      console.error(error);
      this.copyMessage = "";
      this.copyError = "Copy failed. Please try again.";
    }
  }
}

export const registerProposalAppStore = (Alpine: Alpine) => {
  Alpine.store("proposalApp", new ProposalAppStore());
};
