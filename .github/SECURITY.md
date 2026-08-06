# Security Policy

## Supported Versions

We aim to support the latest minor release line. Please upgrade to the most recent release to receive fixes.

- Actively supported: Latest release (vX.Y.Z)
- Security fixes backported: At maintainers' discretion when feasible

## Reporting a Vulnerability

Please report security vulnerabilities privately. Do not open a public issue.

- Use GitHub Security Advisories: Go to the repository "Security" tab → "Advisories" → "Report a vulnerability" and follow the guided flow.
- Alternatively, you may reach the maintainers via a private channel listed on the repository profile.

We will acknowledge receipt within 72 hours and work with you on a fix timeline. Once a fix is available, we will coordinate disclosure and publish a patched release.

## Scope

This policy covers vulnerabilities in:
- Backend (`backend/`)
- Frontend (`frontend/`)
- Release/update workflow files under `.github/`

## Automated Security Scanning

PteroDash utilizes a strict zero-vulnerability CI/CD pipeline. Every pull request and push to the `main` branch is automatically scanned using:
- **CodeQL**: Static Application Security Testing (SAST).
- **NPM Audit**: Fails the build on any detected package vulnerability.

Contributors are required to resolve all security alerts and maintain the zero-vulnerability baseline before a PR can be merged.

## Safe Harbor

We will not pursue legal action for good-faith, non-destructive research that:
- Respects privacy and does not exfiltrate data
- Does not degrade, disrupt, or damage our services or users
- Follows the reporting process above and allows reasonable time for remediation

Thank you for helping keep this project secure.

