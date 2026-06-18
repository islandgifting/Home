exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  try {
    const { listingId, buyerName, buyerMessage } = JSON.parse(event.body || '{}');
    const token = process.env.AIRTABLE_TOKEN;
    if (!listingId || !buyerName || !buyerMessage) return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) };
    const fetchRes = await fetch(`https://api.airtable.com/v0/appyNDNuwGFgR44sg/tblBt9FfVcrMK1aOs/${listingId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!fetchRes.ok) return { statusCode: 404, body: JSON.stringify({ error: 'Listing not found' }) };
    const record = await fetchRes.json();
    const existing = record.fields.Messages || '';
    const newMessage = `[${new Date().toLocaleDateString()}] From: ${buyerName} — "${buyerMessage}"`;
    await fetch(`https://api.airtable.com/v0/appyNDNuwGFgR44sg/tblBt9FfVcrMK1aOs/${listingId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { Messages: existing ? existing + '\n\n' + newMessage : newMessage } })
    });
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
