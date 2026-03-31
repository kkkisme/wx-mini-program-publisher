# AGENTS.md

## Cursor Cloud specific instructions

This is a single-file Node.js CLI tool (`bin/publish.js`) for publishing WeChat Mini Programs in CI/CD pipelines. There is no build step, no test framework, no linter, and no dev server.

### Key commands

| Action | Command |
|---|---|
| Install dependencies | `npm install` |
| Show CLI help | `node bin/publish.js --help` or `npm run publish:help` |
| Dry-run (no actual publish) | `WX_APPID=<appid> WX_PRIVATE_KEY=<key> node bin/publish.js --dry-run` |

### Important notes

- The only runtime dependency is `miniprogram-ci`. There are no devDependencies, no tests, no lint config.
- Actual publishing requires valid WeChat credentials (`WX_APPID` + private key env vars) and will connect to WeChat servers. Use `--dry-run` to validate configuration without publishing.
- The `punycode` deprecation warning from Node.js v22 is harmless and comes from a transitive dependency — it can be ignored.
- Version numbers are auto-generated in `YY.MMDD.xxx` format based on current date and `BUILD_NUMBER` env var.
