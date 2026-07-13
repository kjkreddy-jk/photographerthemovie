# Publishing the Photographer website

The live domain currently serves the `photographer-official-theme` WordPress theme. This repository has no automatic deployment workflow, so pushing to GitHub records the source but does not update the live WordPress installation.

## Prepare and build

1. Install the pinned build dependency with `npm ci`.
2. Update campaign data in `content/site-content.json`, run `npm run content:build`, and advance `VERSION` for a release. See `CONTENT-EDITOR-GUIDE.md`.
3. Keep the HTML `site-version`, generated content build version, `CHANGELOG.md`, and theme `style.css` version aligned.
4. Run the root verification and build the synchronized theme package:

   ```powershell
   npm test
   npm run images:test
   .\scripts\check-render.ps1
   .\scripts\check-lighthouse.ps1
   .\scripts\build-theme.ps1
   .\scripts\build-theme.ps1 -CheckOnly
   ```

5. Run `node .\scripts\build-images.mjs` to rebuild variants from the approved `assets/img` repository before the theme build. Review `git diff`, commit the complete release, and create a matching tag:

   ```powershell
   git add .github .gitignore VERSION CHANGELOG.md PROJECT-TODO.md PUBLISHING.md SITE-MAINTENANCE.md CONTENT-EDITOR-GUIDE.md NOTIFICATION-INTEGRATION.md package.json package-lock.json content assets index.html site.css site-content.js component-resources.js *.dc.html scripts wp-theme
   $version = (Get-Content -Raw .\VERSION).Trim()
   git commit -m "Release website v$version"
   git tag -a "v$version" -m "Website v$version"
   git push origin main
   git push origin "v$version"
   ```

Pushes and pull requests also run `.github/workflows/site-quality.yml`. This quality workflow validates the release but intentionally does not publish WordPress. GitHub documents `git push` as the operation that transfers local commits or tags to the configured remote: <https://docs.github.com/en/get-started/using-git/pushing-commits-to-a-remote-repository>.

## Publish to WordPress

1. Back up the active theme or test on staging first.
2. In WordPress Administration, open **Appearance → Themes → Add New → Upload Theme**.
3. Upload `wp-theme/photographer-official-theme.zip` and replace/update the existing theme when WordPress shows the matching installed theme.
4. Confirm that **Photographer Official Theme** remains active.
5. Purge the WordPress/hosting cache and CDN cache. The live response currently identifies an `hcdn` server, so an old cached HTML document may otherwise hide a successful theme update.

WordPress documents ZIP upload, activation, FTP and hosting-control-panel installation methods here: <https://wordpress.org/documentation/article/appearance-themes-screen/>.

## Verify the live deployment

The release version is intentionally exposed in three places: the footer, `<meta name="site-version">`, and the `X-Photographer-Site-Version` response header.

```powershell
$response = Invoke-WebRequest -Uri 'https://photographerthemovie.com/' -TimeoutSec 30
$response.StatusCode
$response.Headers.'X-Photographer-Site-Version'
([regex]::Match($response.Content, '<meta name="site-version" content="([^"]+)"')).Groups[1].Value
$version = (Get-Content -Raw .\VERSION).Trim()
$response.Content -match ('Site v' + [regex]::Escape($version))
$response.Content -match ('site-content\.js\?ver=' + [regex]::Escape($version))
```

Or run the equivalent automated check:

```powershell
.\scripts\check-live-version.ps1
```

All checks should report the value in `VERSION` after caches are purged. Also test navigation, trailer mute, video modal opening/closing, horizontal media lists, theme appearance, and notification feedback on desktop and mobile. Do not activate notification delivery until `NOTIFICATION-INTEGRATION.md` is complete.

## Rollback

Re-upload the previously backed-up theme ZIP, or check out the prior release tag, rebuild its theme ZIP, upload it, and purge caches again. Do not roll back only `index.html`; each release includes matching content, CSS, runtime and PHP loader files.
