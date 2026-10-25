import { test, expect, beforeAll, afterAll } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

// extract.ts walks real DOM nodes (Element, HTMLImageElement, Node.TEXT_NODE),
// so the test needs a DOM. Register happy-dom's globals for this file only.
beforeAll(() => GlobalRegistrator.register());
afterAll(() => GlobalRegistrator.unregister());

// Imported after the DOM globals exist.
const { extractUser, richText, tweetTextEl, userCells } = await import("./extract.ts");
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

/**
 * Build a timeline article: a User-Name cell followed by the tweet body, the
 * way x.com nests them. `tweetHtml` may contain Twemoji <img alt> tags.
 */
function buildArticle(handle: string, tweetHtml: string, lang = "en"): Element {
  document.body.innerHTML = `
    <article class="css-175oi2r r-18u37iz" data-testid="tweet">
      <div data-testid="User-Name" class="r-1wbh5a2">
        <a href="/${handle}" role="link"><span>Jane Doe</span></a>
        <a href="/${handle}" role="link" tabindex="-1"><span>@${handle}</span></a>
      </div>
      <div data-testid="tweetText" lang="${lang}" dir="auto">${tweetHtml}</div>
    </article>`;
  const el = document.querySelector('[data-testid="User-Name"]');
  if (!el) throw new Error("no User-Name cell in fixture");
  return el;
}

test("the tweet body of the cell's own article is found, emoji included", () => {
  const el = buildArticle(
    "jane_doe",
    '<span>Free crypto </span><img alt="🚀" src="https://abs.twimg.com/emoji/v2/svg/1f680.svg" />',
  );
  const text = richText(tweetTextEl(el)!).trim();
  expect(text).toBe("Free crypto 🚀");
  // A phrase rule matches the tweet text the same way a word rule matches a name.
  expect(matchReason(text, { words: ["free crypto"] })).toBe("free crypto");
  expect(matchReason(text, { words: ["🚀"] })).toBe("🚀");
  expect(matchReason(text, { words: ["airdrop"] })).toBeNull();
});

test("a cell with no tweet body (e.g. Who to follow) has no tweet text", () => {
  expect(tweetTextEl(buildCell("jane_doe", ["Jane Doe"]))).toBeNull();
});

test("a neighbouring article's tweet text is never picked up", () => {
  document.body.innerHTML = `
    <article data-testid="tweet">
      <div data-testid="User-Name"><a href="/first"><span>First</span></a></div>
      <div data-testid="tweetText" lang="en">first tweet</div>
    </article>
    <article data-testid="tweet">
      <div data-testid="User-Name" id="second"><a href="/second"><span>Second</span></a></div>
      <div data-testid="tweetText" lang="en">second tweet</div>
    </article>`;
  const el = document.getElementById("second")!;
  expect(richText(tweetTextEl(el)!).trim()).toBe("second tweet");
});

/**
 * A followers / following list row the way x.com draws it: avatar link, name
 * link, @handle link, "Follows you", a Follow button and the bio — no
 * "User-Name" container. Hashed class names on purpose, as in buildCell().
 */
function buildUserCell(handle: string, nameHtml: string, bio: string): string {
  return `
    <div data-testid="cellInnerDiv">
      <button data-testid="UserCell" role="button" class="css-175oi2r r-1mmae3n">
        <div data-testid="UserAvatar-Container-${handle}">
          <a href="/${handle}" aria-hidden="true" role="link" tabindex="-1"><img alt="" src="https://pbs.twimg.com/profile_images/1/a.jpg" /></a>
        </div>
        <a href="/${handle}" role="link" class="r-1loqt21"><div dir="ltr"><span class="css-1jxf684">${nameHtml}</span></div></a>
        <a href="/${handle}" role="link" tabindex="-1"><span class="r-poiln3">@${handle}</span></a>
        <div data-testid="userFollowIndicator"><span>Follows you</span></div>
        <button data-testid="1234-follow" role="button"><span>Follow</span></button>
        <div dir="auto"><span>${bio}</span></div>
      </button>
    </div>`;
}

test("followers list: UserCell rows are scanned and their name extracted", () => {
  document.body.innerHTML =
    buildUserCell("luna_p", '<span>Luna Park </span><img alt="🐙" src="https://abs.twimg.com/emoji/v2/svg/1f419.svg" />', "I love @someone and crypto") +
    buildUserCell("jane_doe", "<span>Jane Doe</span>", "");
  const users = userCells(document).map(extractUser);
  expect(users).toEqual([
    { handle: "luna_p", name: "Luna Park 🐙" },
    { handle: "jane_doe", name: "Jane Doe" },
  ]);
  // Not part of a tweet, so no tweet text is picked up.
  expect(tweetTextEl(userCells(document)[0]!)).toBeNull();
});

test("a UserCell that holds a User-Name container is scanned once", () => {
  document.body.innerHTML = `
    <div data-testid="UserCell">
      <div data-testid="User-Name"><a href="/jane_doe"><span>Jane Doe</span></a><a href="/jane_doe"><span>@jane_doe</span></a></div>
    </div>
    <article><div data-testid="User-Name"><a href="/tweeter"><span>Tweeter</span></a></div></article>`;
  const cells = userCells(document);
  expect(cells.map((el) => el.getAttribute("data-testid"))).toEqual(["User-Name", "User-Name"]);
  expect(cells.map((el) => extractUser(el)!.handle)).toEqual(["jane_doe", "tweeter"]);
});
