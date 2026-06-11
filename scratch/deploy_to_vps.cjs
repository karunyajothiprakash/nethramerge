const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();

const crmCode = fs.readFileSync('d:/ERP/ERP/adms-sync/routes/crm.js', 'utf8');
const dbCode = fs.readFileSync('d:/ERP/ERP/adms-sync/db.js', 'utf8');

const script = `
cat << 'EOF' > /var/www/adms-sync/routes/crm.js
${crmCode.replace(/\$/g, '\\$')}
EOF

cat << 'EOF' > /var/www/adms-sync/db.js
${dbCode.replace(/\$/g, '\\$')}
EOF

pm2 restart adms-sync
`;

conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
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
