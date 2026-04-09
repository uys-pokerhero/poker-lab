import { createRoot } from "react-dom/client";
import { createElement } from "react";
import { App } from "./ui/App";

function mount() {
  const container = document.getElementById("pvh-hero-map");
  if (!container) {
    console.warn("[poker-hero-map] No #pvh-hero-map element found.");
    return;
  }
  createRoot(container).render(createElement(App));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
