import { test, expect, beforeAll, afterAll } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

// extract.ts walks real DOM nodes (Element, HTMLImageElement, Node.TEXT_NODE),
// so the test needs a DOM. Register happy-dom's globals for this file only.
beforeAll(() => GlobalRegistrator.register());
afterAll(() => GlobalRegistrator.unregister());

// Imported after the DOM globals exist.
const { extractUser, richText } = await import("./extract.ts");
const { matchReason } = await import("./matcher.ts");

/** Parse an HTML string and return its first [data-testid="User-Name"] cell. */
function cell(html: string): Element {
  document.body.innerHTML = html;
  const el = document.querySelector('[data-testid="User-Name"]');
  if (!el) throw new Error("no User-Name cell in fixture");
  return el;
}

/**
 * Build a User-Name cell the way x.com does: the display name is a run of text
 * spans and Twemoji <img alt="…"> tags, followed by the @handle and a relative
 * date. Deliberately uses X-style hashed, meaningless class names so the test
 * proves extraction never depends on them. `name` is an ordered list of plain
 * strings (text spans) and { emoji } objects (rendered as <img alt>).
 */
function buildCell(handle: string, name: Array<string | { emoji: string }>): Element {
  const parts = name
    .map((seg) =>
      typeof seg === "string"
        ? `<span class="css-1jxf684 r-poiln3">${seg}</span>`
        : `<img alt="${seg.emoji}" draggable="false" src="https://abs.twimg.com/emoji/v2/svg/x.svg" class="r-4qtqp9 r-dflpy8" />`,
    )
    .join("");
  return cell(`
    <div data-testid="User-Name" class="css-175oi2r r-1awozwy">
      <a href="/${handle}" role="link" class="r-1loqt21"><div class="r-dnmrzs">${parts}</div></a>
      <a href="/${handle}" role="link" tabindex="-1"><span class="r-poiln3">@${handle}</span></a>
      <span class="r-poiln3">·</span>
      <a href="/${handle}/status/2065523096447271174" aria-label="Jun 12" role="link">
        <time datetime="2026-06-12T19:54:16.000Z">Jun 12</time>
      </a>
    </div>`);
}

// An element shaped exactly like x.com's, with a random display name + emoji
// (Luna Park 🐙) standing in for the captured one.
const REAL_FIXTURE = `<div class="css-175oi2r r-1wbh5a2 r-dnmrzs r-1ny4l3l r-1awozwy r-18u37iz" id="id__nmze869snjp" data-testid="User-Name"><div class="css-175oi2r r-1awozwy r-18u37iz r-1wbh5a2 r-dnmrzs"><a href="/miss_m_17" role="link" class="css-175oi2r r-1wbh5a2 r-dnmrzs r-1ny4l3l r-1loqt21"><div class="css-175oi2r r-1awozwy r-18u37iz r-1wbh5a2 r-dnmrzs"><div dir="ltr" class="css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-37j5jr r-a023e6 r-rjixqe r-b88u0q r-1awozwy r-6koalj r-1udh08x r-3s2u2q" style="color: rgb(231, 233, 234);"><span class="css-1jxf684 r-dnmrzs r-1udh08x r-1udbk01 r-3s2u2q r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3"><span class="css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3">Luna Park </span><img alt="🐙" draggable="false" src="https://abs.twimg.com/emoji/v2/svg/1f419.svg" title="Octopus" class="r-4qtqp9 r-dflpy8 r-k4bwe5 r-1kpi4qh r-pp5qcn r-h9hxbl"></span></div><div dir="ltr" class="css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-37j5jr r-a023e6 r-rjixqe r-16dba41 r-xoduu5 r-18u37iz r-1q142lx" style="color: rgb(231, 233, 234);"><span class="css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3 r-1awozwy r-xoduu5"></span></div></div></a></div><div class="css-175oi2r r-18u37iz r-1wbh5a2 r-1ez5h0i"><div class="css-175oi2r r-1d09ksm r-18u37iz r-1wbh5a2"><a href="/miss_m_17" role="link" tabindex="-1" class="css-175oi2r r-1wbh5a2 r-dnmrzs r-1ny4l3l r-1loqt21"><div dir="ltr" class="css-146c3p1 r-dnmrzs r-1udh08x r-1udbk01 r-3s2u2q r-bcqeeo r-1ttztb7 r-qvutc0 r-37j5jr r-a023e6 r-rjixqe r-16dba41 r-18u37iz r-1wvb978" style="color: rgb(113, 118, 123);"><span class="css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3">@miss_m_17</span></div></a><div dir="ltr" aria-hidden="true" class="css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-37j5jr r-a023e6 r-rjixqe r-16dba41 r-1q142lx r-n7gxbd" style="color: rgb(113, 118, 123);"><span class="css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3">·</span></div><div class="css-175oi2r r-18u37iz r-1q142lx"><a href="/miss_m_17/status/2065523096447271174" dir="ltr" aria-label="Jun 12" role="link" class="css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-37j5jr r-a023e6 r-rjixqe r-16dba41 r-xoduu5 r-1q142lx r-1w6e6rj r-9aw3ui r-3s2u2q r-1loqt21" style="color: rgb(113, 118, 123);"><time datetime="2026-06-12T19:54:16.000Z">Jun 12</time></a></div></div></div></div>`;

test("real fixture: handle and emoji-bearing display name are extracted", () => {
  const user = extractUser(cell(REAL_FIXTURE));
  expect(user).not.toBeNull();
  expect(user!.handle).toBe("miss_m_17");
  // The 🐙 (from <img alt>) is preserved; the @handle and date that follow are
  // stripped off.
  expect(user!.name).toBe("Luna Park 🐙");
});

test("real fixture: name matches against the emoji and the name text", () => {
  const { name } = extractUser(cell(REAL_FIXTURE))!;
  expect(matchReason(name, { words: ["🐙"] })).toBe("🐙"); // the Twemoji emoji
  expect(matchReason(name, { words: ["luna"] })).toBe("luna"); // case-insensitive
  expect(matchReason(name, { words: ["Park"] })).toBe("Park"); // second word
  expect(matchReason(name, { words: ["🚀"] })).toBeNull(); // unrelated emoji
});

test("the @handle and date tokens never leak into the matched name", () => {
  const { name } = extractUser(cell(REAL_FIXTURE))!;
  // A rule on the handle/date must not match the display name.
  expect(matchReason(name, { words: ["miss_m_17"] })).toBeNull();
  expect(matchReason(name, { words: ["Jun"] })).toBeNull();
});

test("richText restores a Twemoji emoji that textContent would drop", () => {
  const el = cell(REAL_FIXTURE);
  expect(el.textContent).not.toContain("🐙"); // <img> alt is invisible to textContent
  expect(richText(el)).toContain("🐙"); // …but richText brings it back
});

test("emoji-only display name still matches the emoji rule", () => {
  const { name } = extractUser(buildCell("rocketguy", [{ emoji: "🚀" }]))!;
  expect(name).toBe("🚀");
  expect(matchReason(name, { words: ["🚀"] })).toBe("🚀");
});

test("multiple emoji interleaved with text are all preserved in order", () => {
  const { name } = extractUser(
    buildCell("multi", ["Crypto ", { emoji: "🚀" }, " to the ", { emoji: "🌙" }]),
  )!;
  expect(name).toBe("Crypto 🚀 to the 🌙");
  expect(matchReason(name, { words: ["🌙"] })).toBe("🌙");
  expect(matchReason(name, { words: ["crypto"] })).toBe("crypto"); // case-insensitive
});

test("a multi-codepoint (ZWJ) emoji survives extraction and matches", () => {
  const family = "👨‍👩‍👧"; // man+ZWJ+woman+ZWJ+girl
  const { name } = extractUser(buildCell("fam", ["Family ", { emoji: family }]))!;
  expect(name).toBe(`Family ${family}`);
  expect(matchReason(name, { words: [family] })).toBe(family);
});

test("returns null for a cell with no profile-link href", () => {
  const el = cell(`
    <div data-testid="User-Name">
      <a href="/i/status/123"><span>Promoted</span></a>
      <span>@nope</span>
    </div>`);
  expect(extractUser(el)).toBeNull();
});

test("handle comes from the profile link, not the status or date links", () => {
  // The status/date hrefs share the username prefix but are not bare "/handle",
  // so they must be ignored when locating the handle.
  const user = extractUser(buildCell("jane_doe", ["Jane Doe"]))!;
  expect(user.handle).toBe("jane_doe");
  expect(user.name).toBe("Jane Doe");
});
