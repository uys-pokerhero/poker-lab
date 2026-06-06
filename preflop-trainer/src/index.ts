import { createRoot } from "react-dom/client";
import { createElement } from "react";
import { App } from "./ui/App";

function mount() {
  const container = document.getElementById("pvh-preflop-trainer");
  if (!container) {
    console.warn("[poker-preflop-trainer] No #pvh-preflop-trainer element found.");
    return;
  }
  createRoot(container).render(createElement(App));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
