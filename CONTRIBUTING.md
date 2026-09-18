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
     "evidence": "What in the README shows it is real: how to run it, a demo, a method behind a number",
     "concern": "Optional. The main weakness a user should know first",
     "added": "2026-09-18"
   }
   ```

   Categories are listed in `scripts/categories.mjs`. `stars`, `pushedAt`,
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

`"pick": true` and `media` are set by maintainers. Media is copied into
`docs/media/` only when the source repository's license allows it, with
`media.credit` and `media.source` recorded; otherwise it is linked via `demo`.

## Removing an entry

Open an issue or pull request if an entry is gone, archived, misdescribed, or yours
and you want it out. Authors who want their media removed: say so and it goes.
