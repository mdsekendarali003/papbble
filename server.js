const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { createSubscription } = require('./email_list');

const indexPath = path.join(__dirname, 'index.html');
function delay(milliseconds, signal) {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve();
    const timer = setTimeout(resolve, milliseconds);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
  });
}

function sendJson(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(data));
}

function sendLogEvent(response, event) {
  response.write(`${JSON.stringify(event)}\n`);
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
  response.writeHead(200, {
    'Content-Type': 'application/x-ndjson; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });
  response.flushHeaders?.();
  const controller = new AbortController();
  response.on('close', () => controller.abort());

  for (const [index, email] of emails.entries()) {
    if (controller.signal.aborted) break;
    try {
      const result = await createSubscription(email, controller.signal);
      if (controller.signal.aborted) break;
      sendLogEvent(response, { type: 'result', email, ok: true, status: result.status });
    } catch (error) {
      if (controller.signal.aborted) break;
      sendLogEvent(response, { type: 'result', email, ok: false, error: error.message });
    }
    if (index < emails.length - 1) {
      sendLogEvent(response, { type: 'wait', message: 'Waiting 5 seconds before the next request...' });
      await delay(5_000, controller.signal);
    }
  }
  if (controller.signal.aborted) return;
  sendLogEvent(response, { type: 'complete' });
  response.end();
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, '0.0.0.0', () => console.log(`Open http://localhost:${port}`));
