// Vercel serverless function — saves founder-pass signups to Brevo.
// Needs ONE env var on Vercel: BREVO_API_KEY (use a fresh key — rotate in Brevo dashboard first).
// It auto-creates a "CampusCode Launch List" in Brevo on first run. Zero other config.

const BREVO = 'https://api.brevo.com/v3';
const LIST_NAME = 'CampusCode Launch List';
let listId = null;

async function brevo(path, method = 'GET', body) {
  const r = await fetch(BREVO + path, {
    method,
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}
  if (!r.ok) throw new Error('Brevo ' + r.status + ': ' + text.slice(0, 200));
  return json;
}

async function ensureList() {
  if (listId) return listId;
  const lists = await brevo('/contacts/lists?limit=50');
  const found = (lists.lists || []).find((l) => l.name === LIST_NAME);
  if (found) { listId = found.id; return listId; }
  const folders = await brevo('/contacts/folders?limit=10');
  const folderId = (folders.folders && folders.folders[0] && folders.folders[0].id) || 1;
  const created = await brevo('/contacts/lists', 'POST', { name: LIST_NAME, folderId });
  listId = created.id;
  return listId;
}

export default async function handler(req, res) {
  try {
    if (!process.env.BREVO_API_KEY) {
      return res.status(500).json({ ok: false, error: 'missing_key' });
    }
    const id = await ensureList();

    if (req.method === 'GET') {
      const info = await brevo('/contacts/lists/' + id);
      return res.status(200).json({ ok: true, count: info.totalSubscribers || 0 });
    }

    if (req.method === 'POST') {
      const { email, passNumber } = req.body || {};
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return res.status(400).json({ ok: false, error: 'bad_email' });
      }
      await brevo('/contacts', 'POST', {
        email,
        listIds: [id],
        updateEnabled: true,
        attributes: {
          PASS_NUMBER: String(passNumber || ''),
          SOURCE: 'coming-soon-founder-pass',
        },
      });

      // Best-effort: notify the founder about every claim.
      // Sent DIRECTLY to his Gmail — the hello@ address forwards there anyway,
      // and skipping the ImprovMX hop avoids its soft-bounce deferrals of
      // shared-IP senders. From stays hello@campuscode.co.in (authenticated).
      // Wrapped so a mail failure NEVER breaks a visitor's claim.
      let mailStatus = 'sent';
      try {
        await brevo('/smtp/email', 'POST', {
          sender: { name: 'CampusCode', email: 'hello@campuscode.co.in' },
          to: [{ email: 'koushikthatipelli@gmail.com', name: 'Koushik' }],
          subject: 'New Founder Pass claimed — #' + String(passNumber || '?').padStart(4, '0'),
          textContent:
            'A new Founder Pass was just claimed on campuscode.co.in\n\n' +
            'Claimer email: ' + email + '\n' +
            'Pass number: #' + String(passNumber || '?') + '\n' +
            'Time: ' + new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST\n\n' +
            'The contact is also saved in Brevo → "CampusCode Launch List".',
        });
      } catch (mailErr) {
        mailStatus = mailErr.message;
        console.error('notify mail failed:', mailErr.message);
      }

      const info = await brevo('/contacts/lists/' + id);
      return res.status(200).json({ ok: true, count: info.totalSubscribers || 0, mail: mailStatus });
    }

    return res.status(405).json({ ok: false });
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ ok: false, error: 'server' });
  }
}
