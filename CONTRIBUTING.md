# Contributing

The list is data. `data/entries.json` is the source of truth; `README.md` and
`docs/entries.json` are rendered from it. Do not edit those two by hand.

## Add or change an entry

1. Add an object to `entries` in `data/entries.json`:

   ```json
   {
     "name": "repo-name",
     "repo": "owner/repo-name",
     "url": "https://github.com/owner/repo-name",
     "category": "agent-tooling",
     "what": "One plain sentence, 160 characters at most, saying what it concretely does",
     "added": "2026-09-18"
   }
   ```

   That is a complete listed-tier entry. Categories are listed in `scripts/categories.mjs`. `stars`, `pushedAt`,
   `license` and `language` are filled by `npm run refresh`.

2. Run `npm run validate && npm run render` and commit the result.
3. Open a pull request. Say in it that you read the README and ran the thing, or did not.

## The bar

- It does something concrete with Jev, and the README shows how to run it or shows it running.
- It is not a thin copy of the official SDKs or of a better entry already listed.
- Stars are not a criterion, in either direction.
- `what` says what it does. No "powerful", "blazing", "seamless"; the validator rejects them.
- Numbers from a README are reported as "README claims". We do not repeat them as fact.
- Your own project is welcome. Say so in the pull request.

## Tiers

- **Listed**: the fields above. Most entries.
- **Notable** (`"notable": true`): clearly above the rest. Measurements with a method, a demo shown
  working, tests, or an honest limits section. Say why in the pull request.
- **Editors' pick** (`"pick": true`): set by maintainers after reading the README in full. Needs
  `evidence` (why it is here) and, where there is one, `concern` (what to know first).

## Finding more

`GITHUB_TOKEN=... npm run discover` sweeps GitHub (repository, topic and code search) into the
untracked `.work/`; `python3 scripts/gate.py` applies the mechanical checks and rewrites
`data/candidates.json`. These list candidates only; nothing is added to the list without a review.

`media` is set by maintainers. Media is copied into
`docs/media/` only when the source repository's license allows it, with
`media.credit` and `media.source` recorded; otherwise it is linked via `demo`.

## Removing an entry

Open an issue or pull request if an entry is gone, archived, misdescribed, or yours
and you want it out. Authors who want their media removed: say so and it goes.
