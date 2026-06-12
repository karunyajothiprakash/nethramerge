const { Client } = require('ssh2');

const conn = new Client();

const script = `
# 1. Allow PostgreSQL to listen on all interfaces
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" /etc/postgresql/16/main/postgresql.conf
sudo sed -i "s/listen_addresses = 'localhost'/listen_addresses = '*'/g" /etc/postgresql/16/main/postgresql.conf

# 2. Allow all IPs to connect using password authentication
if ! grep -q "host    all             all             0.0.0.0/0               md5" /etc/postgresql/16/main/pg_hba.conf; then
  echo "host    all             all             0.0.0.0/0               md5" | sudo tee -a /etc/postgresql/16/main/pg_hba.conf
fi

if ! grep -q "host    all             all             0.0.0.0/0               scram-sha-256" /etc/postgresql/16/main/pg_hba.conf; then
  echo "host    all             all             0.0.0.0/0               scram-sha-256" | sudo tee -a /etc/postgresql/16/main/pg_hba.conf
fi

# 3. Open port 5432 on the firewall
sudo ufw allow 5432/tcp

# 4. Restart PostgreSQL to apply changes
sudo systemctl restart postgresql
echo "PostgreSQL has been configured and restarted successfully!"
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
