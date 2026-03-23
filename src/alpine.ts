import type { Alpine } from "alpinejs";
import { registerAppDrawerStore } from "./modules/app/drawerStore";
import { registerProposalAppStore } from "./store/app";

export default function initAlpine(Alpine: Alpine) {
  registerAppDrawerStore(Alpine);
  registerProposalAppStore(Alpine);

  if (typeof window !== "undefined") {
    window.Alpine = Alpine;
  }
}
