const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { createSubscription } = require('./email_list');

const indexPath = path.join(__dirname, 'index.html');
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function sendJson(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(data));
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/') {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return fs.createReadStream(indexPath).pipe(response);
  }

  if (request.method !== 'POST' || request.url !== '/api/subscriptions') {
    return sendJson(response, 404, { error: 'Not found' });
  }

  let raw = '';
  for await (const chunk of request) raw += chunk;
  let emails;
  try {
    ({ emails } = JSON.parse(raw));
  } catch {
    return sendJson(response, 400, { error: 'Invalid JSON body.' });
  }
  if (!Array.isArray(emails) || !emails.length || !emails.every((email) => typeof email === 'string')) {
    return sendJson(response, 400, { error: 'Provide a non-empty emails array.' });
  }

  const results = [];
  for (const [index, email] of emails.entries()) {
    try {
      const result = await createSubscription(email);
      results.push({ email, ok: true, status: result.status });
    } catch (error) {
      results.push({ email, ok: false, error: error.message });
    }
    if (index < emails.length - 1) await delay(5_000);
  }
  sendJson(response, 200, { results });
});

server.listen(3000, () => console.log('Open http://localhost:3000'));
