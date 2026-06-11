import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
  const query = `
    CREATE OR REPLACE FUNCTION fn_attlog_to_attendance()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
      v_profile_id  UUID;
      v_punch_utc   TIMESTAMPTZ;
      v_date        DATE;
    BEGIN
      -- Device stores time in IST with no timezone marker → append +05:30 to get UTC
      v_punch_utc := (NEW."LogDateTime"::TEXT || '+05:30')::TIMESTAMPTZ;

      -- Compute the calendar date in IST (so midnight punches land on correct day)
      v_date := (v_punch_utc AT TIME ZONE 'Asia/Kolkata')::DATE;

      -- Match employee by biometric_id
      SELECT id
        INTO v_profile_id
        FROM profiles
       WHERE biometric_id = NEW."EmployeeCode"
       LIMIT 1;

      IF v_profile_id IS NULL THEN
        RAISE LOG '[AttLog] No profile for biometric_id: %', NEW."EmployeeCode";
        RETURN NEW;
      END IF;

      -- Atomic upsert: one record per employee per day
      -- Keeps EARLIEST clock_in and LATEST clock_out
      INSERT INTO attendance_logs (employee_id, date, status, clock_in, clock_out)
      VALUES (
        v_profile_id,
        v_date,
        'present',
        CASE WHEN NEW."Direction" IN ('in', '') THEN v_punch_utc ELSE NULL END,
        CASE WHEN NEW."Direction" = 'out'       THEN v_punch_utc ELSE NULL END
      )
      ON CONFLICT (employee_id, date) DO UPDATE SET
        status    = 'present',
        clock_in  = CASE
          WHEN NEW."Direction" IN ('in', '') THEN
            LEAST(COALESCE(attendance_logs.clock_in, v_punch_utc), v_punch_utc)
          ELSE
            attendance_logs.clock_in
        END,
        clock_out = CASE
          -- Explicit 'out' punch → keep latest
          WHEN NEW."Direction" = 'out' THEN
            GREATEST(COALESCE(attendance_logs.clock_out, v_punch_utc), v_punch_utc)
          -- Any punch 15+ min after clock_in → treat as clock_out
          WHEN attendance_logs.clock_in IS NOT NULL
           AND v_punch_utc > attendance_logs.clock_in + INTERVAL '15 minutes' THEN
            GREATEST(COALESCE(attendance_logs.clock_out, v_punch_utc), v_punch_utc)
          ELSE
            attendance_logs.clock_out
        END,
        updated_at = now();

      RETURN NEW;
    END;
    $$;
  `;

  // Use a hack to run raw SQL since RPC 'execute_sql' might not exist
  // We can create a temporary RPC to execute SQL if needed, but it's easier to just use the postgrest endpoint 
  // if we can. Actually, creating the RPC is best if we have service key.
  
  const { error: rpcCreateError } = await supabase.rpc('exec_sql', { sql_string: query });
  
  if (rpcCreateError && rpcCreateError.message.includes("Could not find the function")) {
     console.log("No exec_sql RPC available to run raw query directly. I will try to use Postgres client directly.");
  } else if (rpcCreateError) {
      console.log("Error:", rpcCreateError);
  } else {
      console.log("Success fixed trigger!");
  }
}
fix();
