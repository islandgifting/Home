exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  try {
    const { title, price, category, contact, description, hideContact } = JSON.parse(event.body || '{}');
    const token = process.env.AIRTABLE_TOKEN;
    if (!title || !category || !contact) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }
    const deleteCode = Math.floor(100000 + Math.random() * 900000).toString();
    const response = await fetch('https://api.airtable.com/v0/appyNDNuwGFgR44sg/tblBt9FfVcrMK1aOs', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          Title: title,
          Price: price || 'Contact for price',
          Category: category,
          Contact: contact,
          Description: description || '',
          Status: 'Pending',
          Submitted: new Date().toISOString().split('T')[0],
          DeleteCode: deleteCode,
          HideContact: hideContact ? 'yes' : 'no'
        }
      })
    });
    if (!response.ok) { const err = await response.json(); throw new Error(err.error?.message || 'Airtable error'); }
    const data = await response.json();
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, deleteCode, id: data.id })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
