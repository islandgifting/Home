exports.handler = async (event) => {
  try {
    const token = process.env.AIRTABLE_TOKEN;
    if (!token) return { statusCode: 500, body: JSON.stringify({ error: 'No token' }) };

    const url = `https://api.airtable.com/v0/appyNDNuwGFgR44sg/Ads?filterByFormula=${encodeURIComponent("{Status}='Active'")}&sort[0][field]=Created&sort[0][direction]=desc`;

    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();

    if (!res.ok) return { statusCode: 500, body: JSON.stringify({ error: 'Airtable error' }) };

    const banners = [], featured = [], sponsored = [];

    (data.records || []).forEach(r => {
      const f = r.fields;
      const item = {
        id: r.id,
        businessName: f.BusinessName || '',
        description: f.Description || '',
        phone: f.Phone || '',
        link: f.Link || '',
        image: f.Image ? f.Image[0]?.url : null,
        tagline: f.Tagline || '',
        color: f.Color || '#0a1c4b',
        category: f.Category || 'specialty'
      };
      if (f.AdType === 'Banner') banners.push(item);
      else if (f.AdType === 'FeaturedBusiness') featured.push(item);
      else if (f.AdType === 'Sponsored') sponsored.push(item);
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ banners, featured, sponsored })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
