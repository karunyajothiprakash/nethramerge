const { Client } = require('ssh2');

const conn = new Client();

const script = `
sed -i 's/return res.status(401).json({ error: "Invalid or expired token" });/console.error("Auth error:", error || err); return res.status(401).json({ error: "Invalid or expired token", details: error ? error.message : (err ? err.message : "Unknown") });/g' /var/www/adms-sync/middleware/auth.js
pm2 restart adms-sync
pm2 logs adms-sync --lines 20 --nostream
`;

conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error('Connection error:', err);
}).connect({
  host: '195.35.22.13',
  port: 22,
  username: 'root',
  password: 'SHASTIKARAM@2026',
  algorithms: {
    serverHostKey: ['ssh-ed25519', 'ssh-rsa', 'ecdsa-sha2-nistp256']
  }
});
