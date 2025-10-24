# add_domain.py
import asyncio
import sys
import os
from datetime import datetime

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.database import get_collection
except ImportError:
    print("❌ Could not import database module. Trying alternative import...")
    try:
        from database import get_collection
    except ImportError:
        print("❌ Could not import database module. Make sure you're running from the correct directory.")
        sys.exit(1)

async def add_domains_for_existing_tenants():
    """Add domain entries for all existing tenants without modifying other data"""
    
    print("🔍 Starting domain creation for existing tenants...")
    
    # Get collections
    tenants_collection = get_collection("tenants")
    domains_collection = get_collection("domains")
    
    # Get all existing tenants - using the correct async pattern for your database
    try:
        # Try the pattern that works with your LoggedCollection
        tenants = await tenants_collection.find()
    except Exception as e:
        print(f"❌ Error fetching tenants: {e}")
        return
    
    if not tenants:
        print("❌ No tenants found in the database")
        return
    
    print(f"📝 Found {len(tenants)} tenants to process")
    
    domains_created = 0
    
    for tenant in tenants:
        tenant_id = str(tenant["_id"])
        tenant_name = tenant.get("name", "Unknown Tenant")
        
        # Create domain name by replacing spaces with underscores and making lowercase
        domain_name = tenant_name.replace(" ", "_").lower()
        
        # Check if domain already exists for this tenant
        try:
            existing_domain = await domains_collection.find_one({
                "tenant_id": tenant_id,
                "domain": domain_name
            })
        except Exception as e:
            print(f"❌ Error checking existing domain: {e}")
            continue
        
        if existing_domain:
            print(f"⏭️  Domain '{domain_name}' already exists for tenant '{tenant_name}'")
            continue
        
        # Check if this tenant already has any domains
        try:
            existing_domains = await domains_collection.find({"tenant_id": tenant_id})
            existing_domains_count = len(existing_domains) if existing_domains else 0
        except Exception as e:
            print(f"❌ Error counting existing domains: {e}")
            existing_domains_count = 0
        
        # Create domain entry
        domain_data = {
            "tenant_id": tenant_id,
            "domain": domain_name,
            "is_primary": existing_domains_count == 0,  # Set as primary if first domain
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Insert domain
        try:
            result = await domains_collection.insert_one(domain_data)
            domains_created += 1
            
            primary_status = " (primary)" if domain_data["is_primary"] else ""
            print(f"✅ Created domain '{domain_name}' for tenant '{tenant_name}'{primary_status}")
        except Exception as e:
            print(f"❌ Error creating domain for '{tenant_name}': {e}")
    
    print(f"\n🎉 Domain creation completed!")
    print(f"📊 Created {domains_created} new domain entries")
    print(f"🏠 Total tenants processed: {len(tenants)}")

async def verify_domains():
    """Verify that domains were created correctly"""
    
    print("\n🔍 Verifying domain creation...")
    
    tenants_collection = get_collection("tenants")
    domains_collection = get_collection("domains")
    
    # Get all tenants and their domains
    try:
        tenants = await tenants_collection.find()
    except Exception as e:
        print(f"❌ Error fetching tenants for verification: {e}")
        return
    
    for tenant in tenants:
        tenant_id = str(tenant["_id"])
        tenant_name = tenant.get("name", "Unknown Tenant")
        
        try:
            domains = await domains_collection.find({"tenant_id": tenant_id})
        except Exception as e:
            print(f"❌ Error fetching domains for tenant '{tenant_name}': {e}")
            continue
        
        if domains:
            domain_names = [d["domain"] for d in domains]
            primary_domains = [d["domain"] for d in domains if d.get("is_primary")]
            
            print(f"🏢 Tenant: {tenant_name}")
            print(f"   📧 Domains: {', '.join(domain_names)}")
            if primary_domains:
                print(f"   ⭐ Primary: {primary_domains[0]}")
            print()
        else:
            print(f"❌ No domains found for tenant: {tenant_name}")

if __name__ == "__main__":
    print("🚀 Starting domain creation script...")
    
    async def main():
        # First, create domains for all tenants
        await add_domains_for_existing_tenants()
        
        # Then verify the results
        await verify_domains()
        
        print("\n✅ Script completed successfully!")
    
    asyncio.run(main())