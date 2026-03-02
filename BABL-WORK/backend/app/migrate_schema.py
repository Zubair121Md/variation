"""
Migration script to update database column sizes for master data
Run this once to update existing PostgreSQL tables
"""
import os
from sqlalchemy import create_engine, text
from app.database import DATABASE_URL

def migrate_master_mapping_columns():
    """Update column sizes in prms_master_mapping table"""
    if DATABASE_URL.startswith("sqlite"):
        print("SQLite database - no migration needed (columns auto-adjust)")
        return
    
    engine = create_engine(DATABASE_URL)
    
    migrations = [
        "ALTER TABLE prms_master_mapping ALTER COLUMN rep_names TYPE VARCHAR(200)",
        "ALTER TABLE prms_master_mapping ALTER COLUMN doctor_names TYPE VARCHAR(200)",
        "ALTER TABLE prms_master_mapping ALTER COLUMN doctor_id TYPE VARCHAR(100)",
        "ALTER TABLE prms_master_mapping ALTER COLUMN pharmacy_names TYPE VARCHAR(500)",
        "ALTER TABLE prms_master_mapping ALTER COLUMN pharmacy_id TYPE VARCHAR(100)",
        "ALTER TABLE prms_master_mapping ALTER COLUMN product_names TYPE VARCHAR(300)",
        "ALTER TABLE prms_master_mapping ALTER COLUMN product_id TYPE VARCHAR(100)",
        "ALTER TABLE prms_master_mapping ALTER COLUMN hq TYPE VARCHAR(100)",
        "ALTER TABLE prms_master_mapping ALTER COLUMN area TYPE VARCHAR(200)",
        # Set defaults for hq and area
        "ALTER TABLE prms_master_mapping ALTER COLUMN hq SET DEFAULT ''",
        "ALTER TABLE prms_master_mapping ALTER COLUMN area SET DEFAULT ''",
    ]
    
    with engine.connect() as conn:
        for migration in migrations:
            try:
                conn.execute(text(migration))
                conn.commit()
                print(f"✅ {migration}")
            except Exception as e:
                print(f"⚠️  {migration} - {str(e)}")
                conn.rollback()

if __name__ == "__main__":
    migrate_master_mapping_columns()
