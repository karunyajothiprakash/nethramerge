const { Client } = require('ssh2');

const conn = new Client();

const script = `
echo "=== UFW STATUS ==="
sudo ufw status

echo "=== NETSTAT POSTGRES ==="
sudo netstat -tlnp | grep 5432

echo "=== POSTGRESQL.CONF ==="
grep listen_addresses /etc/postgresql/16/main/postgresql.conf
`;

conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    let out = "";
    stream.on('close', (code, signal) => {
      console.log(out);
      conn.end();
    }).on('data', (data) => {
      out += data.toString();
    }).stderr.on('data', (data) => {
      out += data.toString();
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
