// Spike runner: measure selector uniqueness across representative DOMs.
import { JSDOM } from "jsdom";
import { generateSelector, domPath, isGeneratedId } from "./selector.mjs";

// --- Sample DOMs -----------------------------------------------------------
// A: fixture-app-style pages (docs/07 defects). B: realistic app markup with
// data-testids, css-modules hashes, utility classes, generated ids, dupes.

const samples = {
  "fixture /settings/billing": `
    <main><section class="card billing">
      <h2 class="card__title">Billing</h2>
      <div class="row"><button data-testid="upgrade-plan-button" class="btn btn-primary">Upgrade plan</button>
      <button class="btn btn-secondary">Cancel</button></div>
    </section></main>`,
  "fixture /responsive": `
    <nav class="nav"><a class="nav__link" href="/a">A</a><a class="nav__link" href="/b">B</a>
    <a class="nav__link" href="/c">C</a></nav>
    <p class="muted low-contrast">Subtle helper text</p>`,
  "fixture /dashboard": `
    <div id="root"><header><h1 class="title">Dashboard</h1></header>
    <ul class="grid"><li class="grid__cell"><span class="metric">12</span></li>
    <li class="grid__cell"><span class="metric">34</span></li>
    <li class="grid__cell"><span class="metric">56</span></li></ul></div>`,
  "real: SaaS app (testids + hashes)": `
    <div id="app"><aside data-testid="sidebar"><a data-testid="nav-home" class="sc-a1b2c3">Home</a>
    <a data-testid="nav-settings" class="sc-a1b2c3">Settings</a></aside>
    <main><form data-testid="profile-form"><label class="Field_label__x9y8z">Name
    <input id=":r7:" class="Field_input__k2j3l" name="name"/></label>
    <button class="Button_root__p0q1r" id="a3f9c8e1b2d4">Save</button></form></main></div>`,
  "real: marketing (utility classes)": `
    <section class="py-16 bg-white"><h1 class="text-4xl font-bold">Ship faster</h1>
    <p class="mt-4 text-gray-600">Do the thing.</p>
    <div class="flex gap-4"><a class="btn" href="/x">Start</a><a class="btn" href="/y">Docs</a></div></section>`,
  "real: table rows (dupes)": `
    <table id="orders"><tbody><tr class="row"><td class="cell">A</td><td class="cell">1</td></tr>
    <tr class="row"><td class="cell">B</td><td class="cell">2</td></tr>
    <tr class="row"><td class="cell">C</td><td class="cell">3</td></tr></tbody></table>`,
};

// Pick "interesting" targets: leaf-ish interactive/content elements.
const TARGET_SEL = "button, a, input, span, td, h1, h2, p, li";

let total = 0;
let unique = 0;
const byStrategy = {};
const failures = [];

for (const [name, html] of Object.entries(samples)) {
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`);
  const doc = dom.window.document;
  const targets = Array.from(doc.querySelectorAll(TARGET_SEL));
  for (const el of targets) {
    total++;
    const res = generateSelector(el, doc);
    byStrategy[res.strategy] = (byStrategy[res.strategy] || 0) + 1;
    // Verify the generated selector actually resolves back to THIS element uniquely.
    const matches = Array.from(doc.querySelectorAll(res.selector));
    const ok = res.status === "unique" && matches.length === 1 && matches[0] === el;
    if (ok) unique++;
    else failures.push({ sample: name, tag: el.tagName, selector: res.selector, status: res.status });
  }
}

const pct = ((unique / total) * 100).toFixed(1);
console.log(`\nTargets: ${total}  Unique & correct: ${unique}  (${pct}%)`);
console.log("By strategy:", byStrategy);
console.log("Target ≥80%:", Number(pct) >= 80 ? "PASS ✅" : "FAIL ❌");
if (failures.length) {
  console.log("\nNon-unique targets:");
  for (const f of failures) console.log(`  [${f.status}] ${f.sample} <${f.tag}> -> ${f.selector}`);
}

// Sanity: generated-id detector
const idCases = {
  "upgrade-plan-button": false,
  ":r7:": true,
  a3f9c8e1b2d4: true,
  "Button_root__p0q1r": true,
  "main-nav": false,
  "user-1234567": true,
};
console.log("\nisGeneratedId checks:");
let idOk = 0;
for (const [id, expected] of Object.entries(idCases)) {
  const got = isGeneratedId(id);
  const pass = got === expected;
  idOk += pass ? 1 : 0;
  console.log(`  ${pass ? "✓" : "✗"} ${id} -> ${got} (expected ${expected})`);
}
console.log(`isGeneratedId: ${idOk}/${Object.keys(idCases).length}`);

// Show a couple of example selectors + dom paths
console.log("\nExamples:");
const ex = new JSDOM(`<!doctype html><body>${samples["real: SaaS app (testids + hashes)"]}</body>`);
for (const sel of ["[data-testid='profile-form'] input", "button"]) {
  const el = ex.window.document.querySelector(sel);
  if (el) console.log(`  <${el.tagName}> ->`, generateSelector(el, ex.window.document).selector, "| path:", domPath(el));
}
