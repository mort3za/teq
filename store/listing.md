# Chrome Web Store listing

Text and images for the **Store listing** page of the Chrome Web Store developer dashboard.

## Product details

**Title** and **Summary** come from `manifest.json` (`name`, `description`).

### Description

Copy all of [`description.md`](description.md). The store shows plain text (no Markdown), and it keeps the line breaks.

### Category

Social Networking

### Language

English

## Graphic assets

| Field              | File                         | Size     |
| ------------------ | ---------------------------- | -------- |
| Store icon         | `icon-128.png`               | 128×128  |
| Screenshot 1       | `screenshot-1.png`           | 1280×800 |
| Screenshot 2       | `screenshot-2.png`           | 1280×800 |
| Screenshot 3       | `screenshot-3.png`           | 1280×800 |
| Screenshot 4       | `screenshot-4.png`           | 1280×800 |
| Screenshot 5       | `screenshot-5.png`           | 1280×800 |
| Small promo tile   | `promo-small-440x280.png`    | 440×280  |
| Marquee promo tile | `promo-marquee-1400x560.png` | 1400×560 |

The store icon has 96×96 art and 16 px of transparent space on each side, as the image guidelines ask. Screenshots and promo tiles are 24-bit PNG (no alpha).

The accounts in the screenshots are demo data. The X page behind the review screen and the popup is a simple mock-up, not a real X page.

To make new screenshots and promo tiles, see [`screenshots.md`](screenshots.md).

Screenshots, in upload order:

1. Review screen on X: collected accounts, language filter, Block button.
2. Popup: word and phrase rules, block progress, collected list.
3. Collected page: matched rule and tweet language for each account.
4. Options page: seconds between blocks, hourly and daily limits.
5. Block log page: search, export as CSV.

Global promo video: none.

## Additional fields

| Field          | Value                                  |
| -------------- | -------------------------------------- |
| Official URL   | None                                   |
| Homepage URL   | https://github.com/mort3za/teq         |
| Support URL    | https://github.com/mort3za/teq/issues  |
| Mature content | Off                                    |

## Privacy practices

Text for the **Privacy practices** page of the developer dashboard.

### Single purpose

Teq finds X (Twitter) accounts whose display name, @username or tweet text matches the user's own rules, shows them in a list for review, and blocks the accounts that the user selects.

### Permission justification

| Permission                  | Justification                                                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                   | Keeps the user's rules and settings, the collected list, the ignored list and the block log in the browser.                                   |
| Host `x.com`, `twitter.com` | The content script reads the accounts on the page to find matches, shows the review screen, and sends the block requests that the user starts. |

### Remote code

No. All code is in the package.

### Data usage

Teq keeps the display names, @usernames and tweet text of matched accounts (website content) in `chrome.storage` on the user's computer. It does not send this data to the developer or to other services. It sends only block requests to X. Privacy policy URL: https://github.com/mort3za/teq/blob/main/PRIVACY.md

## Distribution

| Field      | Value                 |
| ---------- | --------------------- |
| Payments   | Free of charge        |
| Visibility | Public                |
| Regions    | All regions           |

## Test instructions

Text for the **Test instructions** page. The reviewer needs an X account, because Teq works only on x.com when the user is logged in.

---

Teq works on x.com. You need to log in to an X account.

1. Open the Teq popup from the toolbar. In "Words / emoji to match", type a word that is in display names on your timeline (for example "news"). Keep "Auto-collect" on.
2. Open https://x.com/home and scroll for a few seconds. The popup shows the matching accounts under "collected".
3. On the X tab, open the popup and click "Review and block". The review screen opens on the X page. Nothing is blocked until you click "Block N selected".
4. To test blocking, keep only one test account selected and click Block. Teq waits about 30 seconds between blocks. The Blocked page (sidebar of the Options page) shows the log.
5. To undo, unblock the account on X (its profile page, or Settings → Privacy and safety → Mute and block → Blocked accounts).

Teq sends no data to the developer or to other servers. It only sends block requests to X, from the open X tab.

---
