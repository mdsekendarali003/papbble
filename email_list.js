/**
 * Create one subscription per email address, sequentially.
 *
 * Requires Node.js 18+ and an explicit confirmation:
 *   SUBSCRIPTION_CARD='your-card-token' CONFIRM_SEND=true node email_list.js
 */

const API_URL = 'https://payments.pabbly.com/api/subscription';
const CARD_TOKEN = "231d3677c777ac89333c6f3760af2078:2cbb6606931492be310cb53154715003046594300fc7f9e737e2b093ffe0c342dacc3b605890c7f6df95f697618d40b00f8fdd36da0e0f38fd547f55ca17636b181f57e0309fddabf698688fc1d9cda5";

// Add or remove recipient email addresses here.
const emailList = [

];

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function makePayload(email) {
  return {
    account_additional_number_require: false,
    account_additional_number_status: false,
    account_company_require: false,
    account_company_status: false,
    account_phone_require: false,
    account_phone_status: false,
    account_website_require: false,
    account_website_status: false,

    additional_number_dial_code: "+91",

    billing_city_require: false,
    billing_city_status: false,
    billing_country_required: false,
    billing_country_status: false,
    billing_state_required: false,
    billing_state_status: false,
    billing_street_require: false,
    billing_street_status: false,
    billing_zip_required: false,
    billing_zip_status: false,

    card: CARD_TOKEN,

    country: "IN",
    coupon_code: "",
    dial_code: "+91",
    email,
    first_name: "eqe",
    funnel: [],

    gateway_id: "6a8dc7e381882a66eed48832",
    gateway_type: "6a8dc7e381882a66eed48832",
    hostname: "https://payments.pabbly.com",

    last_name: "qeqe",
    plan_id: "6a8dc8ad4f5ad067036afa04",
    quantity: 1,

    select_additional_number_dial_code: "+91",
    select_dial_code: "+91",

    shiping_city_require: false,
    shiping_city_status: false,
    shiping_country_require: false,
    shiping_country_status: false,
    shiping_state_require: false,
    shiping_state_status: false,
    shiping_street_require: false,
    shiping_street_status: false,
    shiping_zip_require: false,
    shiping_zip_status: false,

    state: "Andaman and Nicobar Islands",
    state_code: "AN",
    _csrf: ""
  }

}

async function createSubscription(email) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(makePayload(email)),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${body}`);
  }

  return { status: response.status, body };
}

async function run() {
  for (const [index, email] of emailList.entries()) {
    console.log(`Creating subscription for ${email}...`);
    try {
      const result = await createSubscription(email);
      console.log(`Success for ${email} (HTTP ${result.status})`);
    } catch (error) {
      console.error(`Failed for ${email}: ${error.message}`);
    }

    if (index < emailList.length - 1) {
      console.log('Waiting 5 seconds before the next request...');
      await delay(5_000);
    }
  }
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { createSubscription };
