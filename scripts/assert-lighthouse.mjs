import fs from 'node:fs';

const reportPath = process.argv[2];
if (!reportPath) throw new Error('A Lighthouse JSON report path is required.');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const score = category => Math.round((report.categories?.[category]?.score ?? 0) * 100);
const scores = {
  accessibility: score('accessibility'),
  bestPractices: score('best-practices'),
  seo: score('seo')
};

console.log(`Lighthouse scores: accessibility=${scores.accessibility}, best-practices=${scores.bestPractices}, seo=${scores.seo}`);
if (scores.bestPractices < 90) console.warn('Lighthouse warning: best-practices score is below 90.');
if (scores.seo < 90) console.warn('Lighthouse warning: SEO score is below 90.');
if (scores.accessibility < 95) throw new Error('Lighthouse accessibility score must be at least 95.');

console.log('Lighthouse accessibility gate passed.');
