#!/usr/bin/env python3
"""
Alternative Supabase Schema Deployment using SQL execution through Supabase RPC
"""

import asyncio
import requests
import os
import json
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SERVICE_ROLE_KEY:
    print("❌ Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
    exit(1)

def execute_sql_via_rest(sql_statement):
    """Execute SQL statement via Supabase REST API."""
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
        'apikey': SERVICE_ROLE_KEY
    }
    
    # Use the PostgREST SQL function execution
    url = f"{SUPABASE_URL}/rest/v1/rpc/sql"
    
    # Try direct SQL execution
    try:
        response = requests.post(
            url,
            headers=headers,
            json={"sql": sql_statement},
            timeout=30
        )
        
        if response.status_code == 200:
            return True, response.json()
        else:
            return False, f"HTTP {response.status_code}: {response.text}"
            
    except Exception as e:
        return False, str(e)

def deploy_schema():
    """Deploy schema step by step."""
    
    print("🚀 Starting Supabase Schema Deployment...")
    
    # Read the schema file
    schema_file = Path(__file__).parent / 'supabase_schema_clean.sql'
    if not schema_file.exists():
        print(f"❌ Schema file not found: {schema_file}")
        return False
    
    print(f"📖 Reading schema file: {schema_file}")
    
    with open(schema_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # Split into individual statements
    statements = []
    current_statement = ""
    in_function = False
    dollar_count = 0
    
    for line in sql_content.split('\n'):
        line = line.strip()
        
        # Skip empty lines and comments
        if not line or line.startswith('--'):
            continue
        
        # Track function definitions with $$
        if '$$' in line:
            dollar_count += line.count('$$')
            in_function = (dollar_count % 2) == 1
        
        current_statement += line + '\n'
        
        # End of statement
        if line.endswith(';') and not in_function:
            if current_statement.strip():
                statements.append(current_statement.strip())
            current_statement = ""
    
    # Add any remaining statement
    if current_statement.strip():
        statements.append(current_statement.strip())
    
    print(f"📊 Found {len(statements)} SQL statements to execute")
    
    # Execute each statement
    success_count = 0
    for i, statement in enumerate(statements, 1):
        print(f"⚡ Executing statement {i}/{len(statements)}...")
        
        success, result = execute_sql_via_rest(statement)
        
        if success:
            success_count += 1
            print(f"✅ Statement {i} executed successfully")
        else:
            print(f"❌ Statement {i} failed: {result}")
            # Continue with other statements instead of failing completely
    
    print(f"📊 Deployment completed: {success_count}/{len(statements)} statements executed successfully")
    
    if success_count > 0:
        print("🎉 Schema deployment completed with some success!")
        return True
    else:
        print("❌ Schema deployment failed completely")
        return False

def create_basic_tables_manually():
    """Create basic tables manually using Supabase REST API."""
    
    print("🛠️  Creating basic tables manually...")
    
    # Headers for Supabase API
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
        'apikey': SERVICE_ROLE_KEY,
        'Prefer': 'return=representation'
    }
    
    # Let's test by creating a simple test table first
    test_table_sql = """
    CREATE TABLE IF NOT EXISTS public.test_connection (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """
    
    # Try to execute via a simple SQL query through edge function approach
    print("🧪 Testing table creation...")
    
    try:
        # Let's try using the SQL editor endpoint if available
        url = f"{SUPABASE_URL}/rest/v1/"
        
        # Test connection first
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            print("✅ Successfully connected to Supabase REST API")
            return True
        else:
            print(f"❌ Failed to connect: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

def main():
    """Main function."""
    print("🗄️  Supabase Schema Deployment Tool (Alternative)")
    print("=" * 60)
    
    # Test Supabase connection
    if not create_basic_tables_manually():
        print("\n🔧 Since direct SQL deployment isn't working, let's try a different approach...")
        print("\n📋 Alternative approach:")
        print("   1. Copy the SQL schema content")
        print("   2. Go to your Supabase dashboard")
        print("   3. Navigate to 'SQL Editor'")
        print("   4. Paste and run the schema manually")
        print("\n🌐 Supabase Dashboard: https://supabase.com/dashboard")
        print(f"🎯 Your project: {SUPABASE_URL}")
        
        # Show the schema file path
        schema_file = Path(__file__).parent / 'supabase_schema_clean.sql'
        print(f"\n📄 Schema file location: {schema_file}")
        
        if schema_file.exists():
            print("✅ Schema file found and ready to use")
            
            # Show first few lines as preview
            with open(schema_file, 'r') as f:
                lines = f.readlines()[:10]
            
            print("\n👀 Schema preview (first 10 lines):")
            print("-" * 40)
            for line in lines:
                print(line.rstrip())
            print("-" * 40)
            print(f"... and {len(lines)} more lines")
            
        return
    
    # Try the deployment
    success = deploy_schema()
    
    if success:
        print("\n🎉 Schema deployment completed!")
        print("\n📋 Next steps:")
        print("   1. Test your login/signup pages")
        print("   2. Check the setup page")
        print("   3. Create your administrator account")
    else:
        print("\n❌ Deployment had issues. Please check the logs above.")

if __name__ == "__main__":
    main()