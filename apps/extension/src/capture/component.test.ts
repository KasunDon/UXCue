// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { getReactComponent } from "./component";

const h = React.createElement;

describe("getReactComponent", () => {
  it("reads the nearest component name and owner chain from a mounted tree", () => {
    function UpgradeButton() {
      return h("button", { id: "btn" }, "Upgrade");
    }
    function Card() {
      return h("section", { className: "card" }, h(UpgradeButton));
    }
    function App() {
      return h("main", null, h(Card));
    }

    const container = document.createElement("div");
    document.body.appendChild(container);
    flushSync(() => createRoot(container).render(h(App)));

    const btn = document.getElementById("btn")!;
    const res = getReactComponent(btn);
    expect(res.framework).toBe("react");
    expect(res.name).toBe("UpgradeButton");
    expect(res.ownerChain).toEqual(["UpgradeButton", "Card", "App"]);
  });

  it("degrades to unknown for non-React nodes and never throws", () => {
    const plain = document.createElement("div");
    expect(getReactComponent(plain)).toEqual({ framework: "unknown" });
    // @ts-expect-error — bogus input must not throw
    expect(getReactComponent({}).framework).toBe("unknown");
  });
});
