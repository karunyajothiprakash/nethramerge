const { Client } = require('ssh2');

const conn = new Client();

const sqlQuery = `
CREATE OR REPLACE FUNCTION fn_attlog_to_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $BODY$
DECLARE
  v_profile_id  UUID;
  v_punch_utc   TIMESTAMPTZ;
  v_date        DATE;
BEGIN
  v_punch_utc := (NEW."LogDateTime"::TEXT || '+05:30')::TIMESTAMPTZ;
  v_date := (v_punch_utc AT TIME ZONE 'Asia/Kolkata')::DATE;

  SELECT id INTO v_profile_id FROM profiles WHERE biometric_id = NEW."EmployeeCode" LIMIT 1;

  IF v_profile_id IS NULL THEN
    RAISE LOG '[AttLog] No profile for biometric_id: %', NEW."EmployeeCode";
    RETURN NEW;
  END IF;

  INSERT INTO attendance_logs (employee_id, date, status, clock_in, clock_out)
  VALUES (
    v_profile_id, v_date, 'present',
    CASE WHEN NEW."Direction" IN ('in', '') THEN v_punch_utc ELSE NULL END,
    CASE WHEN NEW."Direction" = 'out'       THEN v_punch_utc ELSE NULL END
  )
  ON CONFLICT (employee_id, date) DO UPDATE SET
    status    = 'present',
    clock_in  = CASE WHEN NEW."Direction" IN ('in', '') THEN LEAST(COALESCE(attendance_logs.clock_in, v_punch_utc), v_punch_utc) ELSE attendance_logs.clock_in END,
    clock_out = CASE WHEN NEW."Direction" = 'out' THEN GREATEST(COALESCE(attendance_logs.clock_out, v_punch_utc), v_punch_utc) WHEN attendance_logs.clock_in IS NOT NULL AND v_punch_utc > attendance_logs.clock_in + INTERVAL '15 minutes' THEN GREATEST(COALESCE(attendance_logs.clock_out, v_punch_utc), v_punch_utc) ELSE attendance_logs.clock_out END,
    updated_at = now();

  RETURN NEW;
END;
$BODY$;
`;

conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec(`
    cat << 'EOF' > /tmp/fix_trigger.sql
${sqlQuery}
EOF
    sudo -u postgres psql -d shastika_erp -f /tmp/fix_trigger.sql
  `, (err, stream) => {
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
