'use strict';

exports.handler = async function(event) {
  var headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  var key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { statusCode: 500, headers, body: JSON.stringify({ error: 'STRIPE_SECRET_KEY not set' }) };

  var body = {};
  try { body = JSON.parse(event.body || '{}'); } catch(e) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Bad request' }) }; }

  var plan = (body.plan || '').toLowerCase().replace(/\s/g, '');
  var customPriceId = body.priceId || '';
  var customSuccess = body.successUrl || '';

  // Price ID map — directory ads
  var PRICES = {
    featuredbusiness: 'price_1TjqHpIDdMLYVh4ozAzwrUzX',
    featured:         'price_1TjqHpIDdMLYVh4ozAzwrUzX',
    bundle:           'price_1TmQMLIDdMLYVh4oxV1yMnrF',
    premium:          'price_1TmQMLIDdMLYVh4oxV1yMnrF',
    coupon:           'price_1Tksc2IDdMLYVh4o6WWoMaOa',
    // Realty plans
    'realty-rentals': 'price_1Tmdz7IDdMLYVh4oTGoUAwnN',
    'realty-featured':'price_1Tmdt5IDdMLYVh4opztOr2i6',
    'realty-premium': 'price_1TmduZIDdMLYVh4oug2vPj8Q',
    'realty-agency':  'price_1TmdvCIDdMLYVh4oSvJOoUNb',
  };

  var SUCCESS = {
    featuredbusiness: 'success.html?plan=Featured',
    featured:         'success.html?plan=Featured',
    bundle:           'success.html?plan=Premium',
    premium:          'success.html?plan=Premium',
    coupon:           'coupon-success.html',
    'realty-rentals': 'realty-success.html?plan=rentals',
    'realty-featured':'realty-success.html?plan=featured',
    'realty-premium': 'realty-success.html?plan=premium',
    'realty-agency':  'realty-success.html?plan=agency',
  };

  // Free/basic
  if (!plan || plan.includes('basic') || plan === 'free') {
    return { statusCode: 200, headers, body: JSON.stringify({ redirect: '/advertise.html#free-listing' }) };
  }

  var priceId = customPriceId || PRICES[plan] || '';
  var successPage = customSuccess || ('https://shoplocalsi.com/' + (SUCCESS[plan] || 'success.html'));

  if (!priceId) {
    return { statusCode: 200, headers, body: JSON.stringify({ redirect: '/advertise.html#free-listing' }) };
  }

  try {
    var Stripe = require('stripe');
    var stripe = Stripe(key);

    var session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      subscription_data: { trial_period_days: 30 },
      success_url: successPage,
      cancel_url: plan.includes('realty') ? 'https://shoplocalsi.com/realty.html' : 'https://shoplocalsi.com/advertise.html',
    });

    return { statusCode: 200, headers, body: JSON.stringify({ sessionId: session.id }) };

  } catch(err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message, code: err.code || '' }) };
  }
};
