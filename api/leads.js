/**
 * Proxy → fsf-dashboard /api/leads
 * --------------------------------------------------------------
 * The assessment app is a static browser app, so it can't hold the
 * dashboard's shared secret. This serverless function runs on the
 * assessment project's own backend, injects CRON_SECRET (the dashboard's
 * machine-bypass credential) server-side, and forwards the response.
 *
 * The browser calls same-origin "/api/leads" (no secret in client JS);
 * this function authenticates to the gated dashboard endpoint.
 *
 * Requires env var ASSESSMENT_PROXY_SECRET on this project, set to the
 * SAME value as ASSESSMENT_PROXY_SECRET on fsf-dashboard (a dedicated
 * secret scoped to /api/leads + /api/contacts only — not CRON_SECRET).
 */
import https from 'https';

export const config = { maxDuration: 30 };

const DASHBOARD_HOST = 'fsf-dashboard.vercel.app';

function dashboardGet(path, secret) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: DASHBOARD_HOST,
      path,
      method: 'GET',
      headers: { 'x-cron-secret': secret },
    };
    const r = https.request(options, (resp) => {
      let body = '';
      resp.on('data', (c) => (body += c));
      resp.on('end', () => resolve({ status: resp.statusCode, body }));
    });
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

  try {
    const { status, body } = await dashboardGet('/api/leads', secret);
    res.setHeader('Content-Type', 'application/json');
    return res.status(status).send(body);
  } catch (err) {
    return res.status(502).json({ error: 'Upstream request failed: ' + err.message });
  }
}
