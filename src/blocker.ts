// Wraps X's own block endpoint — the same call the website makes when you click
// "Block". Runs from the content script on the x.com origin, so it's a
// same-origin authenticated request: cookies ride along via credentials:"include"
// and we echo the ct0 cookie as the CSRF token, exactly like the web app.

// Public web-app bearer token (shipped in x.com's JS, not a secret).
const BEARER =
  "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";

const BLOCK_URL = "https://x.com/i/api/1.1/blocks/create.json";

export class BlockError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "BlockError";
  }
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

/** Block a user by @handle. Throws BlockError on a non-OK response. */
export async function blockUser(handle: string): Promise<void> {
  const csrf = getCookie("ct0");
  if (!csrf) throw new BlockError("No ct0 cookie — are you logged in?", 0);

  const res = await fetch(BLOCK_URL, {
    method: "POST",
    credentials: "include",
    headers: {
      authorization: `Bearer ${BEARER}`,
      "x-csrf-token": csrf,
      "x-twitter-auth-type": "OAuth2Session",
      "x-twitter-active-user": "yes",
      "content-type": "application/x-www-form-urlencoded",
    },
    body: `screen_name=${encodeURIComponent(handle)}`,
  });

  if (!res.ok) {
    throw new BlockError(`Block ${handle} failed (HTTP ${res.status})`, res.status);
  }
}
