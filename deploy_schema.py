#!/usr/bin/env python3
"""
Simple Supabase Schema Deployment Script
Deploys the schema to your Supabase database with the provided credentials.
"""

import asyncio
import asyncpg
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
DB_HOST = os.getenv('DB_HOST', 'db.dfzspjqgvdzosrddqcje.supabase.co')
DB_PORT = int(os.getenv('DB_PORT', '5432'))
DB_NAME = os.getenv('DB_NAME', 'postgres')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_SCHEMA_PASSWORD')

if not DB_PASSWORD:
    print("❌ Error: DB_SCHEMA_PASSWORD environment variable is required")
    exit(1)

async def deploy_schema():
    """Deploy the schema to Supabase database."""
    
    print("🚀 Starting Supabase Schema Deployment...")
    print(f"📡 Connecting to: {DB_HOST}:{DB_PORT}/{DB_NAME}")
    
    try:
        # Create database connection
        conn = await asyncpg.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            # Disable prepared statements for Supabase compatibility
            statement_cache_size=0,
            command_timeout=60
        )
        
        print("✅ Database connection established!")
        
        # Read the schema file
        schema_file = Path(__file__).parent / 'supabase_schema_clean.sql'
        if not schema_file.exists():
            print(f"❌ Schema file not found: {schema_file}")
            return False
        
        print(f"📖 Reading schema file: {schema_file}")
        
        with open(schema_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Execute the entire schema as one transaction
        print("⚡ Executing schema deployment...")
        
        async with conn.transaction():
            await conn.execute(sql_content)
        
        print("🎉 Schema deployment completed successfully!")
        
        # Verify deployment by checking for key tables
        print("🔍 Verifying deployment...")
        
        tables_query = """
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename
        """
        
        tables = await conn.fetch(tables_query)
        table_names = [row['tablename'] for row in tables]
        
        expected_tables = ['users', 'companies', 'user_settings', 'ai_generations', 'templates']
        created_tables = [t for t in expected_tables if t in table_names]
        
        print(f"📋 Created tables: {', '.join(created_tables)}")
        
        if len(created_tables) == len(expected_tables):
            print("✅ All expected tables created successfully!")
        else:
            missing = [t for t in expected_tables if t not in table_names]
            print(f"⚠️  Missing tables: {', '.join(missing)}")
        
        # Check functions
        functions_query = """
        SELECT p.proname as function_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        ORDER BY p.proname
        """
        
        functions = await conn.fetch(functions_query)
        function_names = [row['function_name'] for row in functions]
        
        expected_functions = ['can_user_generate', 'increment_user_usage', 'reset_daily_usage', 'reset_monthly_usage']
        created_functions = [f for f in expected_functions if f in function_names]
        
        print(f"⚙️  Created functions: {', '.join(created_functions)}")
        
        return True
        
    except asyncpg.PostgresError as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False
    finally:
        if 'conn' in locals():
            await conn.close()
            print("🔌 Database connection closed")

async def test_supabase_integration():
    """Test if Supabase is properly configured in the application."""
    
    print("\n🧪 Testing Supabase Integration...")
    
    supabase_url = os.getenv('VITE_SUPABASE_URL')
    supabase_anon_key = os.getenv('VITE_SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_anon_key:
        print("❌ Supabase environment variables not found")
        return False
    
    # Check if they contain placeholder values
    if 'demo-supabase-url' in supabase_url or 'your-project-id' in supabase_url:
        print("❌ Supabase URL contains placeholder values")
        return False
    
    if 'demo-anon-key' in supabase_anon_key or 'your-supabase-anon-key' in supabase_anon_key:
        print("❌ Supabase anon key contains placeholder values")
        return False
    
    print("✅ Supabase configuration looks good!")
    print(f"📡 URL: {supabase_url}")
    print(f"🔑 Anon Key: {supabase_anon_key[:20]}...")
    
    return True

def main():
    """Main function."""
    print("🗄️  Supabase Schema Deployment Tool")
    print("=" * 50)
    
    # Test Supabase integration first
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        supabase_ok = loop.run_until_complete(test_supabase_integration())
        if not supabase_ok:
            print("❌ Supabase integration test failed")
            return
        
        # Deploy schema
        success = loop.run_until_complete(deploy_schema())
        
        if success:
            print("\n🎉 All done! Your Supabase database is ready.")
            print("\n📋 Next steps:")
            print("   1. Your login/signup pages should now work properly")
            print("   2. The setup page should detect the configured database")
            print("   3. You can create your first administrator account")
            print("\n🌐 Try accessing your application now!")
        else:
            print("\n❌ Schema deployment failed. Please check the errors above.")
            
    except KeyboardInterrupt:
        print("\n⏹️  Deployment cancelled by user")
    finally:
        loop.close()

if __name__ == "__main__":
    main()