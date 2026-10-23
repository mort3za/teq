# Privacy policy

Last change: 2026-10-12

Teq is a free, open source Chrome extension that finds X (Twitter) accounts that match your rules, and blocks the accounts that you select. This page tells you which data the extension uses, where the data goes, and how to remove it.

## Summary

- Teq has **no server**. The developer does not get, see or keep your data.
- Teq has **no analytics, no tracking, no ads and no cookies** of its own.
- Your data stays **in your browser**. Teq sends only block requests, and only to X.
- Teq does **not sell** your data, and does not use it for a purpose other than the features on this page. The use of data follows the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), including the Limited Use requirements.

## Data in your browser

Teq keeps this data in the extension storage of Chrome (`chrome.storage`):

| Data                                                                                       | Where              | Kept for                        |
| ------------------------------------------------------------------------------------------ | ------------------ | ------------------------------- |
| Settings: your words, phrases, language, pacing and limits                                 | `chrome.storage.sync`  | Until you change them           |
| Collected accounts: @username, display name, matched rule, tweet language and tweet text  | `chrome.storage.local` | Until you block, remove or clear them |
| Ignored accounts: @username, display name and date                                         | `chrome.storage.local` | Until you remove or clear them  |
| Block log: @username, display name, matched rule and date                                  | `chrome.storage.local` | The last 500 blocks, or until you clear it |
| Status of the current block run and its queue                                              | `chrome.storage.local` | Until the run ends              |

The data in `chrome.storage.local` stays on your computer. The settings in `chrome.storage.sync` go to your other computers through Chrome sync, if you turned on Chrome sync. The [Google privacy policy](https://policies.google.com/privacy) applies to Chrome sync.

Teq reads only the accounts and tweets that X shows on your screen. It keeps only the accounts that match your rules.

When you export a list or your settings (as a CSV or JSON file), Teq writes a file on your computer. You decide what to do with this file.

When you remove the extension, Chrome deletes all of this data.

## Data sent to other services

### X (Twitter)

When you start a block run, Teq sends one block request for each account that you selected to `x.com`, from your open X tab. This is the same request that X sends when you click "Block" on a profile. The request includes your X cookies, like X's own website does. X gets the @username of the account to block.

The [X privacy policy](https://x.com/en/privacy) applies.

Teq sends nothing to any service other than X. The Vazirmatn font is inside the extension, so no page loads a font from the internet.

Teq does not send your name, e-mail, browser history or other pages to anyone.

## Permissions

| Permission            | Why                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `storage`             | Keep your settings, the collected list, the ignored list and the block log                  |
| `x.com`, `twitter.com` | Find matching accounts on the page, show the review screen, and send the blocks that you start |

## Remote code

Teq runs only the code in its package. It does not download or run code from the internet.

## Children

Teq is not made for children under 13. It does not knowingly collect data from children.

## Changes

Changes to this policy are in this file. See its history on [GitHub](https://github.com/mort3za/teq/commits/main/PRIVACY.md).

## Contact

Questions: open an issue on [GitHub](https://github.com/mort3za/teq/issues).
