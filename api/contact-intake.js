/**
 * Proxy → fsf-dashboard /api/contact-intake?id=<ghlContactId>
 * --------------------------------------------------------------
 * Same pattern as api/contacts.js: same-origin browser call, secret injected
 * server-side, response forwarded. Returns the contact's Primary Goal +
 * Primary Limitation/Complaint (from GHL custom fields, or extracted from the
 * conversation) so the assessment form can prefill them instead of the coach
 * typing them by hand.
 *
 * Requires env var ASSESSMENT_PROXY_SECRET on this project, set to the SAME
 * value as ASSESSMENT_PROXY_SECRET on fsf-dashboard (the dashboard's scoped
 * bypass now allows /api/contact-intake alongside /api/leads + /api/contacts).
 */
import https from 'https';

export const config = { maxDuration: 30 };

const DASHBOARD_HOST = 'fsf-dashboard.vercel.app';

function dashboardGet(path, secret) {
  return new Promise((resolve, reject) => {
    const r = https.request(
      { hostname: DASHBOARD_HOST, path, method: 'GET', headers: { 'x-cron-secret': secret } },
      (resp) => {
        let body = '';
        resp.on('data', (c) => (body += c));
        resp.on('end', () => resolve({ status: resp.statusCode, body }));
      },
    );
    r.on('error', reject);
    r.end();
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const secret = process.env.ASSESSMENT_PROXY_SECRET;
  if (!secret) {
    return res.status(500).json({
      error: 'Proxy misconfigured: ASSESSMENT_PROXY_SECRET env var is not set on this project.',
    });
  }

  const id = req.query.id || req.query.contactId;
  if (!id) return res.status(400).json({ error: 'id (ghlContactId) is required' });

  try {
    const { status, body } = await dashboardGet(`/api/contact-intake?id=${encodeURIComponent(id)}`, secret);
    res.setHeader('Content-Type', 'application/json');
    return res.status(status).send(body);
  } catch (err) {
    return res.status(502).json({ error: 'Upstream request failed: ' + err.message });
  }
}
