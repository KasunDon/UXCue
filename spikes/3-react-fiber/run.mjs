// Spike runner: render a real React tree into jsdom, then extract component
// names from host DOM nodes; also prove graceful degradation on non-React nodes.
import { JSDOM } from "jsdom";
import { getReactComponent } from "./fiber.mjs";

const dom = new JSDOM(`<!doctype html><html><body><div id="root"></div></body></html>`, {
  url: "http://localhost/",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.IS_REACT_ACT_ENVIRONMENT = false;

const React = (await import("react")).default;
const { createRoot } = await import("react-dom/client");
const { flushSync } = await import("react-dom");
const h = React.createElement;

// Component tree:  App > Card > UpgradeButton > <button id="btn">
//                            \> <p class="muted"> (host child of Card)
function UpgradeButton() {
  return h("button", { id: "btn", "data-testid": "upgrade" }, "Upgrade");
}
function Card() {
  return h("section", { className: "card" }, h(UpgradeButton), h("p", { className: "muted" }, "hint"));
}
function App() {
  return h("main", null, h(Card));
}

const root = createRoot(document.getElementById("root"));
flushSync(() => root.render(h(App)));

const cases = [
  { sel: "#btn", expect: "UpgradeButton" },
  { sel: "p.muted", expect: "Card" },
  { sel: "section.card", expect: "Card" },
  { sel: "main", expect: "App" },
];

let pass = 0;
console.log("React version:", React.version);
for (const c of cases) {
  const el = document.querySelector(c.sel);
  const res = getReactComponent(el);
  const ok = res.framework === "react" && res.name === c.expect;
  pass += ok ? 1 : 0;
  console.log(
    `${ok ? "✅" : "❌"} ${c.sel} -> ${res.framework}:${res.name ?? "-"} ` +
      `(expect ${c.expect})  chain=[${(res.ownerChain || []).join(" < ")}]`,
  );
}

// Graceful degradation: a node React never rendered.
const plain = document.createElement("div");
const deg = getReactComponent(plain);
const degOk = deg.framework === "unknown";
pass += degOk ? 1 : 0;
console.log(`${degOk ? "✅" : "❌"} plain non-React <div> -> ${deg.framework} (expect unknown, no throw)`);

// Degradation: totally bogus input must not throw.
let noThrow = true;
try {
  getReactComponent({});
  getReactComponent(null);
} catch {
  noThrow = false;
}
console.log(`${noThrow ? "✅" : "❌"} bogus input never throws`);
pass += noThrow ? 1 : 0;

const total = cases.length + 2;
console.log(`\n${pass}/${total} — React fiber extraction ${pass === total ? "PROVEN ✅" : "NEEDS WORK ❌"}`);
