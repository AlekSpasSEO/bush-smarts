# Bush Smarts

Plainspoken product research for the home and yard.

**[Live website](https://alekspasseo.github.io/bush-smarts/)**

## Catalog

- Four categories: leaf blowers, robot mowers, DIY sheds, roofing products.
- Five product labels per category, twenty in total.
- Fifteen distinct research reviews per category, sixty in total.
- Four buying guides per category, sixteen in total. Every listed product links to its complete review.
- Search, category filters, product label hubs, comparison tables, source links, and responsive navigation.

## Development

Requires Node.js 22 or later. The site itself has no package dependencies.

```sh
npm run build
npm run check
npm run preview
```

Open http://127.0.0.1:4320/bush-smarts/. scripts/build.mjs creates dist/ from the four research/*.json files and shared CSS, JavaScript, and assets. Generated output is ignored by Git. Original guide URLs redirect to their expanded replacements.

## Amazon US integration

**Paused at the owner's request (October 17, 2026).** Do not call the Amazon API or re-enable it until the owner explicitly asks to resume. content/integrations.json disables client creation before credential reads or network requests. Publishing makes no Amazon calls and emits an empty retail snapshot, even when a previous local snapshot exists. Credentials remain stored for a possible future resumption.

The Amazon Creators API supplies exact-matched product listings, linked image URLs, availability, and offers. content/amazon-matches.json contains editorial ASIN mappings with brand and model checks. Similar accessories, conflicting brands, and uncertain variants are rejected. Unmatched reviews keep their manufacturer links.

Use environment variables AMAZON_CREATORS_CREDENTIAL_ID, AMAZON_CREATORS_CREDENTIAL_SECRET, and AMAZON_CREATORS_CREDENTIAL_VERSION, or a local credential CSV:

```sh
node scripts/refresh-amazon.mjs --credentials /absolute/path/to/credentials.csv
npm run build
```

The existing US associate tag is coffeedant03-20; override it with AMAZON_ASSOCIATE_TAG. Credentials and transient API responses are never committed. Images are linked directly from Amazon rather than downloaded. The browser hides retail content when its snapshot reaches twenty-four hours old, including while a page remains open. A missing API price or rating is not invented.

The API response tested for this account did not supply customer review text or star ratings. Research reviews therefore summarize attributed community discussions with their limitations; they do not claim an analysis of unavailable Amazon customer reviews. Amazon rating fields are requested and shown only if genuinely returned.

## Publishing

.github/workflows/publish.yml builds and validates the editorial site, then deploys the dist/ artifact to GitHub Pages. It runs on pushes to main and manual dispatch. Scheduled refreshes and the Amazon fetch step are removed while API access is paused. Set Pages publishing source to GitHub Actions.

## Editorial approach

Reviews distinguish manufacturer specifications from anecdotal owner feedback and editorial judgment. Sources are linked on every review. We do not claim physical testing, invent ratings, or equate a handful of owner comments with a measured failure rate. Original generated category illustrations are identified as editorial illustrations; exact product pictures come from Amazon. Affiliate disclosures appear in the footer and editorial policy.
