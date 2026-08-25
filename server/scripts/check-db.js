// server/scripts/check-db.js
//
// Validates MONGO_URI and proves the database is actually reachable and
// writable, without printing the credentials it contains.
//
//   npm run check:db
require('dotenv').config();

const mongoose = require('mongoose');

const ok = (msg) => console.log(`  OK    ${msg}`);
const bad = (msg) => console.log(`  FAIL  ${msg}`);
const hint = (msg) => console.log(`        -> ${msg}`);

const uri = process.env.MONGO_URI;

const parse = (value) => {
  const match = value.match(/^(mongodb(?:\+srv)?:\/\/)(?:([^:]*):([^@]*)@)?([^/?]+)\/?([^?]*)(\?.*)?$/);

  if (!match) return null;

  return {
    scheme: match[1],
    username: match[2] || '',
    password: match[3] || '',
    host: match[4],
    database: match[5] || '',
    query: match[6] || '',
  };
};

const run = async () => {
  console.log('\nChecking MONGO_URI\n');

  if (!uri) {
    bad('MONGO_URI is not set in server/.env');
    hint('Copy it from Atlas: Database -> Connect -> Drivers');
    process.exit(1);
  }

  const parts = parse(uri);

  if (!parts) {
    bad('MONGO_URI is not a valid MongoDB connection string');
    hint('It should start with mongodb+srv:// or mongodb://');
    process.exit(1);
  }

  ok(`scheme  ${parts.scheme}`);
  // Mask the host so the output can be shared without exposing the cluster.
  ok(`host    ${parts.host.replace(/^[^.]+/, '***')}`);
  ok(`user    ${parts.username ? `${parts.username.slice(0, 2)}***` : '(none)'}`);

  let fatal = false;

  // The single most common mistake: pasting Atlas's template verbatim.
  if (/<|>/.test(uri)) {
    bad('The URI still contains a <placeholder>');
    hint('Replace <db_password> (angle brackets included) with the real password');
    fatal = true;
  }

  if (!parts.password && parts.username) {
    bad('A username is present but no password');
    fatal = true;
  }

  // Atlas passwords are user-chosen, so special characters are common and
  // must be percent-encoded or they terminate the URI early.
  if (parts.password && /[@/:?#[\]]/.test(decodeURIComponent(parts.password))) {
    const encoded = encodeURIComponent(decodeURIComponent(parts.password));
    if (encoded !== parts.password) {
      bad('The password contains characters that must be URL-encoded');
      hint('Encode it with: node -e "console.log(encodeURIComponent(\'YOUR_PASSWORD\'))"');
      fatal = true;
    }
  }

  // Without an explicit name, the driver silently uses "test".
  if (!parts.database) {
    bad('No database name in the URI — the app would write to "test"');
    hint('Add it before the "?", e.g.  ...mongodb.net/travelbuddy?retryWrites=true...');
    fatal = true;
  } else {
    ok(`db      ${parts.database}`);
  }

  if (fatal) {
    console.log('\nFix the above, then run this again.\n');
    process.exit(1);
  }

  console.log('\nConnecting...\n');

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 });
    ok(`connected to ${mongoose.connection.name}`);

    const admin = mongoose.connection.db.admin();
    const info = await admin.serverStatus().catch(() => null);

    if (info?.version) ok(`MongoDB ${info.version}`);

    const hello = await admin.command({ hello: 1 }).catch(() => null);
    ok(hello?.setName ? `replica set "${hello.setName}"` : 'standalone server');

    // Prove real write access, then leave nothing behind.
    const probe = mongoose.connection.db.collection('__connection_check');
    await probe.insertOne({ at: new Date() });
    await probe.deleteMany({});
    await probe.drop().catch(() => {});
    ok('read/write access confirmed');

    const names = (await mongoose.connection.db.listCollections().toArray()).map((c) => c.name);
    ok(names.length ? `existing collections: ${names.join(', ')}` : 'database is empty (expected for a new cluster)');

    console.log('\nMONGO_URI is good. You can start the server.\n');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    const message = error.message || String(error);
    bad(message.split('\n')[0]);

    // Translate the three failures that account for almost every case.
    if (/querySrv ENOTFOUND|getaddrinfo ENOTFOUND/i.test(message)) {
      hint('That cluster hostname does not resolve — it was deleted, or the host is mistyped.');
      hint('Check it against Atlas -> Database -> Connect.');
    } else if (/bad auth|Authentication failed/i.test(message)) {
      hint('Wrong username or password.');
      hint('In Atlas: Database Access -> Edit user -> Edit Password.');
      hint('Note this is the DATABASE user, not your Atlas login.');
    } else if (/IP that isn.t whitelisted|not allowed to access|ETIMEDOUT|ECONNREFUSED/i.test(message)) {
      hint('Your IP is not allowed, or the cluster is paused.');
      hint('In Atlas: Network Access -> Add IP Address -> Allow access from anywhere (0.0.0.0/0).');
      hint('Render needs 0.0.0.0/0 because its outbound IPs are not fixed on the free plan.');
    }

    await mongoose.connection.close().catch(() => {});
    console.log('');
    process.exit(1);
  }
};

run();
