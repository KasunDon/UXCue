// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { generateSelector, domPath, xpath, isGeneratedId, verifySelector } from "./selector";

function mount(html: string): Document {
  document.body.innerHTML = html;
  return document;
}

describe("generateSelector", () => {
  it("prefers a test attribute", () => {
    const doc = mount(`<button data-testid="upgrade" class="btn">Go</button>`);
    const el = doc.querySelector("button")!;
    const res = generateSelector(el, doc);
    expect(res.strategy).toBe("test-attr");
    expect(res.selector).toBe(`[data-testid="upgrade"]`);
    expect(res.status).toBe("unique");
  });

  it("uses a stable id but not a generated-looking one", () => {
    const stable = mount(`<div id="main-nav"><a>x</a></div>`).querySelector("div")!;
    expect(generateSelector(stable).strategy).toBe("id");

    const gen = mount(`<section><div id="ember-a3f9c8e1b2d4">x</div></section>`).querySelector(
      "div",
    )!;
    const res = generateSelector(gen);
    expect(res.strategy).not.toBe("id"); // generated-looking id skipped
    expect(res.status).toBe("unique");
  });

  it("falls back to nth-of-type among duplicate classes", () => {
    const doc = mount(
      `<ul><li class="row">A</li><li class="row">B</li><li class="row">C</li></ul>`,
    );
    const second = doc.querySelectorAll("li")[1]!;
    const res = generateSelector(second, doc);
    expect(res.status).toBe("unique");
    expect(doc.querySelectorAll(res.selector)).toHaveLength(1);
    expect(doc.querySelector(res.selector)).toBe(second);
  });

  it("resolves every target back to itself uniquely across a mixed DOM", () => {
    const doc = mount(`
      <main><section class="card"><button data-testid="b1" class="sc-xx1">1</button>
      <input id=":r7:" class="Field_input__k2j3" /></section>
      <table><tr class="r"><td class="c">a</td></tr><tr class="r"><td class="c">b</td></tr></table></main>`);
    const targets = Array.from(doc.querySelectorAll("button, input, td"));
    for (const el of targets) {
      const { selector } = generateSelector(el, doc);
      const found = doc.querySelectorAll(selector);
      expect(found).toHaveLength(1);
      expect(found[0]).toBe(el);
    }
  });
});

describe("isGeneratedId", () => {
  it.each([
    ["upgrade-plan-button", false],
    ["main-nav", false],
    [":r7:", true],
    ["a3f9c8e1b2d4", true],
    ["Button_root__p0q1r", true],
    ["user-1234567", true],
  ])("%s -> %s", (id, expected) => {
    expect(isGeneratedId(id)).toBe(expected);
  });
});

describe("domPath / xpath / verifySelector", () => {
  it("builds a path and an xpath", () => {
    const doc = mount(`<div id="root"><main><button>x</button></main></div>`);
    const el = doc.querySelector("button")!;
    expect(domPath(el)).toContain("div#root > main > button");
    expect(xpath(el)).toBe("/html[1]/body[1]/div[1]/main[1]/button[1]");
  });

  it("verifies selector uniqueness/status", () => {
    const doc = mount(`<a class="x"></a><a class="x"></a>`);
    expect(verifySelector(".x", doc)).toBe("multiple");
    expect(verifySelector("a.x:nth-of-type(1)", doc)).toBe("unique");
    expect(verifySelector(".nope", doc)).toBe("not-found");
  });
});
