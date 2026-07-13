# Campaign content editing

`content/site-content.json` is the single editable source for campaign data. Its `$schema` entry connects compatible editors to `content/site-content.schema.json` for field descriptions, validation and completion.

## Safe update workflow

1. Edit only the required fields in `content/site-content.json`.
2. Generate the browser asset:

   ```powershell
   npm run content:build
   ```

3. Review both the JSON change and generated `site-content.js` change.
4. Run the complete source checks:

   ```powershell
   npm test
   ```

Do not hand-edit `site-content.js`; the generator replaces it deterministically. Validation rejects invalid dates, navigation anchors, insecure outbound links and incomplete enabled-notification settings.

The static Open Graph, Twitter and JSON-LD metadata in `index.html` does not read the JSON at crawler time. Update that metadata separately when release dates, canonical links, trailer artwork or share artwork changes.
