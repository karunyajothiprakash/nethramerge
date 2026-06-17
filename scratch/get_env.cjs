const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec('cat /var/www/adms-sync/.env', (err, stream) => {
    if (err) throw err;
    let out = "";
    stream.on('close', (code, signal) => {
      console.log('SSH connection closed. Retaining .env content...');
      const targetPath = path.join(__dirname, '..', '.env');
      fs.writeFileSync(targetPath, out);
      console.log('✅ Successfully wrote .env to ' + targetPath);
      conn.end();
    }).on('data', (data) => {
      out += data.toString();
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
