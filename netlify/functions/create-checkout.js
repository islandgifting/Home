/* global require, exports, process */
'use strict';

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing STRIPE_SECRET_KEY env var' }) };
  }

  let plan = '';
  try {
    plan = (JSON.parse(event.body || '{}').plan || '').toLowerCase().replace(/\s/g, '');
  } catch(e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Bad request body' }) };
  }

  // Free/basic — no Stripe needed
  if (!plan || plan.includes('basic') || plan === 'free') {
    return { statusCode: 200, headers, body: JSON.stringify({ redirect: '/advertise.html#free-listing' }) };
  }

  // Map plan name to price ID
  const priceMap = {
    featuredbusiness: 'price_1TjqHpIDdMLYVh4ozAzwrUzX',
    featured:         'price_1TjqHpIDdMLYVh4ozAzwrUzX',
    premium:          'price_1TmQMLIDdMLYVh4oxV1yMnrF',
    bundle:           'price_1TmQMLIDdMLYVh4oxV1yMnrF',
    coupon:           'price_1Tksc2IDdMLYVh4o6WWoMaOa',
    banner:           'price_1TjqGzIDdMLYVh4olYMxSAun',
    sponsored:        'price_1TjqHWIDdMLYVh4o5SU8U9rG',
  };

  const successMap = {
    featuredbusiness: 'success.html?plan=Featured',
    featured:         'success.html?plan=Featured',
    premium:          'success.html?plan=Premium',
    bundle:           'success.html?plan=Premium',
    coupon:           'coupon-success.html',
    banner:           'success.html?plan=Premium',
    sponsored:        'success.html?plan=Featured',
  };

  let priceId = '';
  let successPage = 'success.html';
  for (const k of Object.keys(priceMap)) {
    if (plan.includes(k)) {
      priceId = priceMap[k];
      successPage = successMap[k];
      break;
    }
  }

  if (!priceId) {
    return { statusCode: 200, headers, body: JSON.stringify({ redirect: '/advertise.html#free-listing' }) };
  }

  try {
    const Stripe = require('stripe');
    const stripe = Stripe(key);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      subscription_data: { trial_period_days: 30 },
      success_url: 'https://shoplocalsi.com/' + successPage,
      cancel_url: 'https://shoplocalsi.com/advertise.html',
    });

    return { statusCode: 200, headers, body: JSON.stringify({ sessionId: session.id }) };

  } catch(err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: err.message,
        code: err.code || '',
        type: err.type || ''
      })
    };
  }
};
