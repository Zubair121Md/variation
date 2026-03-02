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
        # SQLite doesn't need migration - it's more flexible with VARCHAR
        return
    
    try:
        engine = create_engine(DATABASE_URL)
        
        # Check if table exists first
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'prms_master_mapping'
                )
            """))
            table_exists = result.scalar()
            
            if not table_exists:
                # Table doesn't exist yet, will be created with correct schema
                return
        
        migrations = [
            # PostgreSQL requires USING clause when changing VARCHAR size
            ("ALTER TABLE prms_master_mapping ALTER COLUMN rep_names TYPE VARCHAR(200) USING rep_names::VARCHAR(200)", "rep_names"),
            ("ALTER TABLE prms_master_mapping ALTER COLUMN doctor_names TYPE VARCHAR(200) USING doctor_names::VARCHAR(200)", "doctor_names"),
            ("ALTER TABLE prms_master_mapping ALTER COLUMN doctor_id TYPE VARCHAR(100) USING doctor_id::VARCHAR(100)", "doctor_id"),
            ("ALTER TABLE prms_master_mapping ALTER COLUMN pharmacy_names TYPE VARCHAR(500) USING pharmacy_names::VARCHAR(500)", "pharmacy_names"),
            ("ALTER TABLE prms_master_mapping ALTER COLUMN pharmacy_id TYPE VARCHAR(100) USING pharmacy_id::VARCHAR(100)", "pharmacy_id"),
            ("ALTER TABLE prms_master_mapping ALTER COLUMN product_names TYPE VARCHAR(300) USING product_names::VARCHAR(300)", "product_names"),
            ("ALTER TABLE prms_master_mapping ALTER COLUMN product_id TYPE VARCHAR(100) USING product_id::VARCHAR(100)", "product_id"),
            ("ALTER TABLE prms_master_mapping ALTER COLUMN hq TYPE VARCHAR(100) USING hq::VARCHAR(100)", "hq"),
            ("ALTER TABLE prms_master_mapping ALTER COLUMN area TYPE VARCHAR(200) USING area::VARCHAR(200)", "area"),
            # Set defaults for hq and area
            ("ALTER TABLE prms_master_mapping ALTER COLUMN hq SET DEFAULT ''", "hq_default"),
            ("ALTER TABLE prms_master_mapping ALTER COLUMN area SET DEFAULT ''", "area_default"),
        ]
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info("Starting database schema migration for master_mapping table...")
        
        # Use autocommit for DDL statements (ALTER TABLE)
        with engine.connect() as conn:
            # Start a transaction
            trans = conn.begin()
            success_count = 0
            error_count = 0
            try:
                for migration_sql, column_name in migrations:
                    try:
                        # Execute DDL statement
                        conn.execute(text(migration_sql))
                        conn.commit()  # Commit each statement individually for DDL
                        logger.info(f"✅ Migration successful: {column_name}")
                        success_count += 1
                    except Exception as e:
                        # Ignore errors like "column already has this type" or "column does not exist"
                        error_str = str(e).lower()
                        if "already" in error_str or "does not exist" in error_str or "cannot alter" in error_str or "no change" in error_str or "is not distinct" in error_str:
                            # Column might already be correct or doesn't exist - that's okay
                            logger.debug(f"⏭️  Migration skipped for {column_name}: {str(e)}")
                            success_count += 1  # Count as success since it's already correct
                        else:
                            # Log other errors but continue
                            logger.error(f"❌ Migration error for {column_name}: {str(e)}")
                            error_count += 1
                        try:
                            conn.rollback()
                        except:
                            pass
                
                logger.info(f"Migration completed: {success_count} successful, {error_count} errors")
            except Exception as e:
                try:
                    trans.rollback()
                except:
                    pass
                logger.error(f"Migration transaction error: {str(e)}", exc_info=True)
    except Exception as e:
        # Don't fail startup if migration fails
        import logging
        logging.getLogger(__name__).warning(f"Schema migration error: {str(e)}")

if __name__ == "__main__":
    migrate_master_mapping_columns()
