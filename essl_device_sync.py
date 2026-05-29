import time
import datetime
from zk import ZK, const
import pymssql

# 1. Configuration
DEVICE_IP = '192.168.1.201'
DEVICE_PORT = 4370
DEVICE_TIMEOUT = 5

SQL_SERVER = 'localhost' # or 'MD\\SQLEXPRESS'
SQL_USER = 'sa'
SQL_PASSWORD = 'essl@123'
SQL_DATABASE = 'etimetracklite1'
SQL_INSTANCE = 'SQLEXPRESS'

POLL_INTERVAL_SECONDS = 120 # 2 minutes

def get_db_connection():
    """Establishes connection to the SQL Server database."""
    # Connecting to local SQL Express instance using pymssql
    # We can specify server as 'host\\instance' or use port 1433
    server_string = f"{SQL_SERVER}\\{SQL_INSTANCE}" if SQL_INSTANCE else SQL_SERVER
    return pymssql.connect(
        server=server_string,
        user=SQL_USER,
        password=SQL_PASSWORD,
        database=SQL_DATABASE,
        timeout=10
    )

def sync_logs():
    print(f"\n⏳ Starting biometric device sync check at {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}...")
    
    zk = ZK(DEVICE_IP, port=DEVICE_PORT, timeout=DEVICE_TIMEOUT, force_udp=False)
    conn_device = None
    conn_sql = None
    
    try:
        # 1. Connect to SQL Server
        conn_sql = get_db_connection()
        cursor = conn_sql.cursor()
        print("🔌 Connected to local SQL Server successfully.")

        # 2. Connect to Biometric Device
        print(f"📡 Connecting to eSSL Device at {DEVICE_IP}:{DEVICE_PORT}...")
        conn_device = zk.connect()
        print("✅ Connected to Biometric Device successfully.")
        
        # 3. Disable device temporarily during read for reliable transfer
        conn_device.disable_device()
        
        print("📥 Fetching attendance records from device...")
        attendance = conn_device.get_attendance()
        print(f"📦 Retrieved {len(attendance)} total punches from device.")

        new_records_count = 0
        
        for record in attendance:
            if not record:
                continue
                
            emp_code = str(record.user_id).strip()
            log_time = record.timestamp # already a datetime object
            
            # Map device punch status to standard 'in' / 'out'
            # Typically: status 0 is Check-in, 1 is Check-out
            direction = 'in'
            if record.status == 1:
                direction = 'out'
            elif record.status == 0:
                direction = 'in'
            else:
                direction = 'in' # Default fallback
                
            # Device ID as recorded
            device_id = '14' # Default DeviceId matched from etimetracklite config

            # 4. Check for duplicates in SQL Server Attlogs
            # We check if a punch already exists for the same EmployeeCode and LogDateTime
            cursor.execute(
                "SELECT COUNT(*) FROM Attlogs WHERE EmployeeCode = %s AND LogDateTime = %s",
                (emp_code, log_time)
            )
            exists = cursor.fetchone()[0] > 0
            
            if not exists:
                download_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                
                # Insert new punch
                cursor.execute(
                    """
                    INSERT INTO Attlogs (EmployeeCode, LogDateTime, DownloadDateTime, Direction, DeviceId)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (emp_code, log_time, download_time, direction, device_id)
                )
                new_records_count += 1

        # 5. Commit all inserts
        if new_records_count > 0:
            conn_sql.commit()
            print(f"🎉 Sync completed successfully! Inserted {new_records_count} new punches into SQL Server.")
        else:
            print("😴 No new punches to insert (all duplicates skipped).")

        # 6. Re-enable device cleanly
        conn_device.enable_device()

    except Exception as e:
        print(f"❌ Error during sync: {e}")
        if conn_sql:
            try:
                conn_sql.rollback()
            except Exception:
                pass
    finally:
        # Cleanly close all connections
        if conn_device:
            try:
                conn_device.disconnect()
                print("🔌 Disconnected from eSSL device.")
            except Exception as e:
                print(f"⚠️ Warning during device disconnect: {e}")
                
        if conn_sql:
            try:
                conn_sql.close()
                print("🔌 Closed SQL Server connection.")
            except Exception as e:
                print(f"⚠️ Warning during SQL Server close: {e}")

if __name__ == '__main__':
    print("🚀 Shastika Global Direct Biometric IP Sync Service started!")
    print(f"🎛️ Configured device: {DEVICE_IP}:{DEVICE_PORT}")
    print(f"🕒 Polling interval: every {POLL_INTERVAL_SECONDS / 60} minutes")
    
    while True:
        try:
            sync_logs()
        except KeyboardInterrupt:
            print("\n👋 Sync service stopped by user.")
            break
        except Exception as e:
            print(f"💥 Fatal error in main loop: {e}")
            
        time.sleep(POLL_INTERVAL_SECONDS)
