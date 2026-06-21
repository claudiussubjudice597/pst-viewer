// One-off: capture 1920x1080 showcase screenshots into ./screenshots.
//
// Prerequisites:
//   npm i -D playwright && npx playwright install chromium chromium-headless-shell
//   npm run dev            # dev server must be running on http://localhost:5173
//   node scripts/screenshots.mjs
//
// Every view uses curated synthetic data (no real personal info); window.__app
// is exposed only in the dev build, which is why the dev server is required.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'screenshots')
mkdirSync(out, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
const shot = (name) => page.screenshot({ path: join(out, name) })

await page.goto('http://localhost:5173/', { waitUntil: 'load' })
await page.waitForFunction(() => window.__app)

// 1) Landing screen
await page.evaluate(() => window.__app.getState().clearSources())
await page.waitForTimeout(400)
await shot('landing.png')

// 2) Reading view (synthetic "Acme Corp" mailbox).
// The folder set spans mail, calendar and contacts so the nav shows the
// type-specific icons, the Outlook folder order and the selection rail.
await page.evaluate(() => {
  const t = (s) => new Date(s).getTime()
  const src = {
    id: 'demo', fileName: 'AcmeCorp.pst', size: 0, label: 'Acme Corp (jordan.reed)',
    status: 'ready', indexed: true,
    index: {
      totalMessages: 64, suggestedLabel: 'Acme Corp', ownerName: 'Acme Corp',
      rootFolder: {
        id: 'root', name: '', containerClass: '', messageCount: 0, children: [
          { id: 'inbox', name: 'Inbox', containerClass: 'IPF.Note', messageCount: 8, children: [] },
          { id: 'sent', name: 'Sent Items', containerClass: 'IPF.Note', messageCount: 5, children: [] },
          { id: 'projects', name: 'Projects', containerClass: 'IPF.Note', messageCount: 12, children: [
            { id: 'phoenix', name: 'Project Phoenix', containerClass: 'IPF.Note', messageCount: 6, children: [] },
          ] },
          { id: 'archive', name: 'Archive', containerClass: 'IPF.Note', messageCount: 34, children: [] },
          { id: 'calendar', name: 'Calendar', containerClass: 'IPF.Appointment', messageCount: 18, children: [] },
          { id: 'contacts', name: 'Contacts', containerClass: 'IPF.Contact', messageCount: 23, children: [] },
        ],
      },
    },
  }
  const mk = (id, subject, fromName, fromEmail, dateStr, hasAttachments, isRead) => ({
    id, folderId: 'inbox', subject, fromName, fromEmail, to: 'jordan.reed@acme.example',
    date: t(dateStr), hasAttachments, isRead, messageClass: 'IPM.Note', size: 14000,
  })
  const messages = [
    mk('m3', 'Project Phoenix kickoff notes', 'Sam Lee', 'sam.lee@acme.example', '2026-06-15T09:30', true, false),
    mk('m2', 'Q3 report draft for review', 'Priya Nair', 'priya.nair@acme.example', '2026-06-14T16:05', true, true),
    mk('m4', 'Lunch on Friday?', 'Alex Morgan', 'alex.morgan@acme.example', '2026-06-13T11:20', false, true),
    mk('m5', 'Invoice #1042', 'Billing', 'billing@acme.example', '2026-06-12T08:00', true, true),
    mk('m6', 'Re: Office move logistics', 'Facilities', 'facilities@acme.example', '2026-06-11T14:42', false, true),
    mk('m7', 'Weekly newsletter', 'Acme Comms', 'comms@acme.example', '2026-06-10T07:30', false, true),
    mk('m8', 'Holiday schedule 2026', 'People Team', 'people@acme.example', '2026-06-09T10:15', false, true),
    mk('m1', 'Welcome to Acme Corp', 'People Team', 'people@acme.example', '2026-06-02T09:00', false, true),
  ]
  const html =
    '<html><head><style>' +
    'body{font-family:-apple-system,Segoe UI,Arial,sans-serif;color:#1f2937;line-height:1.55}' +
    'h2{color:#1d4ed8;margin:0 0 12px}' +
    '.pill{display:inline-block;background:#eff6ff;color:#1d4ed8;border-radius:999px;padding:2px 10px;font-size:12px}' +
    'ul{padding-left:18px}</style></head><body>' +
    '<h2>Project Phoenix kickoff</h2>' +
    '<p>Hi Jordan,</p>' +
    '<p>Thanks for joining the kickoff. Here is a quick summary and the next steps.</p>' +
    '<p><span class="pill">On track</span></p>' +
    '<ul><li>Design review: <b>Tuesday 2pm</b></li>' +
    '<li>Draft budget attached (see <i>budget.xlsx</i>)</li>' +
    '<li>Beta target: end of July</li></ul>' +
    '<p>Full plan is in the attached PDF. Shout if anything looks off.</p>' +
    '<p>Best,<br>Sam</p></body></html>'
  const content = {
    itemKind: 'email',
    subject: 'Project Phoenix kickoff notes', fromName: 'Sam Lee', fromEmail: 'sam.lee@acme.example',
    to: [{ name: 'Jordan Reed', email: 'jordan.reed@acme.example' }],
    cc: [{ name: 'Priya Nair', email: 'priya.nair@acme.example' }], bcc: [],
    date: t('2026-06-15T09:30'), html, text: null, inlineImages: [],
    attachments: [
      { index: 0, name: 'Phoenix-plan.pdf', size: 284000, mime: 'application/pdf', isInline: false, isEmbeddedMessage: false },
      { index: 1, name: 'budget.xlsx', size: 18000, mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', isInline: false, isEmbeddedMessage: false },
    ],
    headers: '', categories: [], importance: null, sensitivity: null, followUp: null,
  }
  window.__app.setState({
    sources: [src],
    expanded: { 'demo:root': true, 'demo:projects': true },
    selection: { sourceId: 'demo', folderId: 'inbox', messageId: 'm3' },
    messages, messagesLoading: false, messageContent: content, contentLoading: false,
    searchQuery: '', searchResults: [],
  })
})
await page.waitForTimeout(900)
await shot('mailbox.png')

// 3) Search across mailboxes (synthetic results).
// Set the query first and let the live (debounced) search run and clear, THEN
// inject synthetic results without changing the query (so it isn't overwritten).
await page.evaluate(() => window.__app.setState({ searchQuery: 'budget' }))
await page.waitForTimeout(800)
await page.evaluate(() => {
  const t = (s) => new Date(s).getTime()
  const hit = (messageId, folderId, subject, from, dateStr, hasAttachments) => ({
    sourceId: 'demo', messageId, folderId, subject, from, date: t(dateStr), hasAttachments, score: 5,
  })
  const searchResults = [
    hit('m2', 'inbox', 'Q3 report draft for review', 'Priya Nair', '2026-06-14T16:05', true),
    hit('r1', 'archive', 'Annual budget planning 2026', 'Finance Team', '2026-05-28T13:10', false),
    hit('m3', 'phoenix', 'Project Phoenix kickoff notes', 'Sam Lee', '2026-06-15T09:30', true),
    hit('r2', 'archive', 'Re: Marketing budget approval', 'Dana Cole', '2026-05-19T09:48', false),
    hit('r3', 'sent', 'Budget questions for finance', 'Jordan Reed', '2026-05-12T17:22', false),
  ]
  const content = {
    itemKind: 'email',
    subject: 'Q3 report draft for review', fromName: 'Priya Nair', fromEmail: 'priya.nair@acme.example',
    to: [{ name: 'Jordan Reed', email: 'jordan.reed@acme.example' }], cc: [], bcc: [],
    date: t('2026-06-14T16:05'),
    html: '<html><body style="font-family:-apple-system,Segoe UI,Arial,sans-serif;color:#1f2937;line-height:1.55">' +
      '<p>Hi Jordan,</p><p>Draft of the <b>Q3 report</b> is ready for your review. The revised <b>budget</b> ' +
      'figures are in section 3. Let me know if the numbers look right before I circulate.</p>' +
      '<p>Thanks,<br>Priya</p></body></html>',
    text: null, inlineImages: [],
    attachments: [{ index: 0, name: 'Q3-report.pdf', size: 512000, mime: 'application/pdf', isInline: false, isEmbeddedMessage: false }],
    headers: '', categories: [], importance: null, sensitivity: null, followUp: null,
  }
  window.__app.setState({
    searchQuery: 'budget', searchResults,
    selection: { sourceId: 'demo', folderId: 'inbox', messageId: 'm2' },
    messageContent: content, contentLoading: false,
  })
})
await page.waitForTimeout(700)
await shot('search.png')

// 4) Contacts view (synthetic) — shows that non-email Outlook items (contacts,
// calendar, tasks, ...) render as their own cards, not just mail.
await page.evaluate(() => {
  const t = (s) => new Date(s).getTime()
  const c = (id, name, title, email) => ({
    id, folderId: 'contacts', subject: `${title}, Acme Corp`, fromName: name, fromEmail: email,
    to: '', date: null, hasAttachments: false, isRead: true, messageClass: 'IPM.Contact', size: 0,
  })
  const messages = [
    c('c1', 'Priya Nair', 'Finance Director', 'priya.nair@acme.example'),
    c('c2', 'Sam Lee', 'Product Designer', 'sam.lee@acme.example'),
    c('c3', 'Alex Morgan', 'Account Manager', 'alex.morgan@acme.example'),
    c('c4', 'Dana Cole', 'Marketing Lead', 'dana.cole@acme.example'),
    c('c5', 'Riley Quinn', 'IT Support', 'riley.quinn@acme.example'),
    c('c6', 'Morgan Patel', 'People Team', 'morgan.patel@acme.example'),
    c('c7', 'Chris Doyle', 'Sales Executive', 'chris.doyle@acme.example'),
  ]
  const content = {
    itemKind: 'contact',
    subject: 'Priya Nair', fromName: '', fromEmail: '', to: [], cc: [], bcc: [],
    date: null, html: null,
    text: 'Primary contact for Q3 budget planning. Prefers email over phone.',
    inlineImages: [], attachments: [], headers: '',
    categories: [], importance: null, sensitivity: null, followUp: null,
    contact: {
      fullName: 'Priya Nair',
      emails: [
        { label: 'Email', address: 'priya.nair@acme.example' },
        { label: 'Email 2', address: 'priya.nair@outlook.example' },
      ],
      phones: [
        { label: 'Business', value: '+1 (415) 555-0142' },
        { label: 'Mobile', value: '+1 (415) 555-0199' },
      ],
      company: 'Acme Corp',
      jobTitle: 'Finance Director',
      department: 'Finance',
      addresses: [
        { label: 'Work', value: '500 Market Street, Suite 400\nSan Francisco, CA 94105' },
      ],
      website: 'www.acme.example',
      im: 'priya.nair',
      birthday: t('1986-03-12T00:00'),
    },
  }
  window.__app.setState({
    searchQuery: '', searchResults: [],
    expanded: { 'demo:root': true, 'demo:projects': true },
    selection: { sourceId: 'demo', folderId: 'contacts', messageId: 'c1' },
    messages, messagesLoading: false, messageContent: content, contentLoading: false,
  })
})
await page.waitForTimeout(700)
await shot('contacts.png')

await browser.close()
console.log('Wrote screenshots to ./screenshots')
