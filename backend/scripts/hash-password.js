// Usage: npm run hash-password
// Prompts for a password (hidden) and prints the ADMIN_PASSWORD_HASH + a fresh JWT_SECRET.
import readline from 'node:readline';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
let muted = false;
rl._writeToOutput = (s) => { rl.output.write(muted ? '' : s); };

const ask = (q) => new Promise((resolve) => {
  rl.question(q, (a) => { muted = false; rl.output.write('\n'); resolve(a); });
  muted = true;
});

const pw = await ask('New admin password (min 12 chars): ');
const again = await ask('Repeat password: ');
rl.close();

if (pw !== again) { console.error('Passwords do not match.'); process.exit(1); }
if (pw.length < 12) { console.error('Use at least 12 characters.'); process.exit(1); }

const hash = await bcrypt.hash(pw, 12);
console.log('\nPut these in your .env / Vercel environment variables:\n');
console.log(`ADMIN_PASSWORD_HASH='${hash}'   (in Vercel dashboard: paste WITHOUT the quotes)`);
console.log(`JWT_SECRET=${crypto.randomBytes(48).toString('base64url')}`);
