const { Client } = require('ssh2');

const conn = new Client();

const script = `
echo "Starting deployment..."
pm2 stop erp-frontend || true
pm2 delete erp-frontend || true

rm -rf /var/www/erp
git clone https://github.com/shastikaglobal/ERP.git /var/www/erp
cd /var/www/erp

cat << 'EOF' > .env
VITE_SUPABASE_PROJECT_ID="sxebygxpjzntogzpjnga"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_B9foFzE0D0b479GnPRvhXw_Dbua7D-H"
VITE_SUPABASE_URL="https://sxebygxpjzntogzpjnga.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4ZWJ5Z3hwanpudG9nenBqbmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMjc5MzksImV4cCI6MjA5MjkwMzkzOX0.rtClmtuPuNicVQvBkITzY6PfFsh8yOYq3ykWoL9Ab_4"
EOF

npm install
npm run build

pm2 serve dist/ 80 --spa --name "erp-frontend"
pm2 save
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
