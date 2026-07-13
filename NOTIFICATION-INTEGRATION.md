# Notification provider integration

The browser client is deliberately disabled until the production service and privacy language are reviewed. In this state, submitting the form displays an inline message and sends no email address.

## Provider contract

The configured HTTPS endpoint must accept a `POST` request with JSON:

```json
{
  "email": "viewer@example.com",
  "consent": true,
  "source": "website-footer"
}
```

It must return a 2xx status for acceptance. The provider or server-side adapter owns email validation, abuse protection, rate limiting, storage, deletion requests, audit records and double opt-in. Never place provider secrets in this repository or browser code.

## Activation checklist

1. Deploy and test the server-side endpoint on HTTPS.
2. Publish the reviewed privacy page and final consent language.
3. Set `notifications.endpoint`, `notifications.privacyUrl` and `notifications.consentText` in `content/site-content.json`.
4. Set `notifications.enabled` to `true`, then run `npm run content:build` and `npm test`.
5. Test success, rejection, timeout, duplicate signup, double opt-in and deletion flows on staging using a controlled test address.
6. Complete a privacy/security review before production publication.

The browser request times out after ten seconds and exposes only generic failure text. Cross-origin endpoints must explicitly allow the production site origin.
