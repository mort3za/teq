# Chrome Web Store listing

Text and images for the **Store listing** page of the Chrome Web Store developer dashboard.

## Product details

**Title** and **Summary** come from `manifest.json` (`name`, `description`).

### Description

Copy the text between the lines. The store shows plain text (no Markdown), and it keeps the line breaks.

---

Find spam accounts on X (Twitter) by their name, then block them safely. 🚫

You write some rules: words, emoji or phrases. While you scroll X, Teq finds the accounts that match and puts them in a list. You review the list, and Teq blocks the accounts that you select, one at a time, slowly.

📝 YOUR RULES
• Words and emoji: Teq looks for them in the display name of each account. The match is not case-sensitive.
• Phrases: Teq looks for them in the text of tweets, and collects the author.
• Optional: match your words against the @username too.
• Optional: Persian/Arabic matching treats Arabic ي/ك and Persian ی/ک (and their digits) as the same letters.

🔍 COLLECT AS YOU SCROLL
• Auto-collect scans the page every few seconds. You do not have to click.
• Each account keeps the rule that matched, the language of its tweet, and the tweet text.

✅ REVIEW BEFORE YOU BLOCK
• Nothing is blocked automatically. You always see the list first.
• The review screen opens on X. Filter by language, search by name, and clear the accounts that you want to keep.
• Click ✕ to ignore an account. Teq does not collect it again.
• Click ℹ to open the tweet that the account was collected from.

🐢 SLOW AND SAFE BLOCKING
X can flag fast blocking as automation. Teq goes slowly to lower this risk:
• About 30 seconds between blocks, plus a small random delay.
• Limits of 40 blocks per hour and 250 blocks per day (you can change them).
• When a limit is reached, the run waits and continues by itself.
• When X answers with an error (401, 403 or 429), the run pauses and keeps the rest of the list.
• The run continues after a page reload or a browser restart.
• A dot on the toolbar icon shows the status: green = blocking, yellow = paused.
Teq never blocks your own account.

📋 LISTS AND BACKUP
• Pages for the collected list, the block log and the ignored accounts: search, page through and clear them.
• Import and export the collected list as CSV, and the block log as CSV.
• Export and import your settings as JSON.

🌍 LANGUAGES
The interface is in English and Persian (فارسی). Right-to-left text shows correctly.

🔒 PRIVACY
• No account, no server, no analytics, no ads.
• Your rules and lists stay in your browser.
• Blocks go only to X, from your open X tab, like a click on "Block".
Privacy policy: https://github.com/mort3za/teq/blob/main/PRIVACY.md

❤️ FREE AND OPEN SOURCE
Teq is free and open source (MIT license).
Source code: https://github.com/mort3za/teq

Teq is not affiliated with X Corp.

---

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

Screenshots, in upload order:

1. Review screen on X: collected accounts, language filter, Block button.
2. Popup: word and phrase rules, block progress, collected list.
3. Collected page: matched rule and tweet language for each account.
4. Options page: seconds between blocks, hourly and daily limits.
5. Block log page.

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
