# app/database.py - FIXED FOR VERCEL
from motor.motor_asyncio import AsyncIOMotorClient
import os
from app.utils.db_logger import log_find, log_insert, log_update, log_delete, log_error
from app.logging_config import get_logger

logger = get_logger("api.database")

# REMOVE THIS LINE - Vercel doesn't use .env files
# load_dotenv()

MONGO_DETAILS = os.getenv("MONGODB_URL")

if not MONGO_DETAILS:
    # Just log the error instead of raising an exception during import
    logger.error("MONGODB_URL environment variable is not set")
    # Don't raise here - let it fail gracefully during runtime
    client = None
    database = None
else:
    try:
        client = AsyncIOMotorClient(MONGO_DETAILS)
        database = client.pos_system
        logger.info("MongoDB client initialized")
    except Exception as e:
        logger.error(f"Failed to initialize MongoDB client: {e}")
        client = None
        database = None

# Collection references - with error handling
def get_collection(collection_name):
    if database is None:
        raise Exception("Database not initialized - check MONGODB_URL environment variable")
    return LoggedCollection(database[collection_name], collection_name)

# Helper to convert MongoDB documents
def document_helper(document) -> dict:
    if document:
        document["id"] = str(document["_id"])
        del document["_id"]
    return document

# Wrapper class for logged collection operations - FIXED VERSION
class LoggedCollection:
    def __init__(self, collection, collection_name):
        self.collection = collection
        self.collection_name = collection_name
    
    async def find(self, query=None, **kwargs):
        try:
            cursor = self.collection.find(query or {}, **kwargs)
            results = await cursor.to_list(length=None)
            log_find(self.collection_name, query, len(results))
            return results
        except Exception as e:
            log_error(self.collection_name, "find", str(e), query)
            raise
    
    async def find_one(self, query=None, **kwargs):
        try:
            result = await self.collection.find_one(query or {}, **kwargs)
            log_find(self.collection_name, query, 1 if result else 0)
            return result
        except Exception as e:
            log_error(self.collection_name, "find_one", str(e), query)
            raise
    
    async def insert_one(self, document, **kwargs):
        try:
            result = await self.collection.insert_one(document, **kwargs)
            log_insert(self.collection_name, document, result)
            return result
        except Exception as e:
            log_error(self.collection_name, "insert_one", str(e))
            raise
    
    async def insert_many(self, documents, **kwargs):
        try:
            result = await self.collection.insert_many(documents, **kwargs)
            log_insert(self.collection_name, documents, result)
            return result
        except Exception as e:
            log_error(self.collection_name, "insert_many", str(e))
            raise
    
    async def update_one(self, filter, update, **kwargs):
        try:
            result = await self.collection.update_one(filter, update, **kwargs)
            log_update(self.collection_name, filter, update, result)
            return result
        except Exception as e:
            log_error(self.collection_name, "update_one", str(e), filter)
            raise
    
    async def update_many(self, filter, update, **kwargs):
        try:
            result = await self.collection.update_many(filter, update, **kwargs)
            log_update(self.collection_name, filter, update, result)
            return result
        except Exception as e:
            log_error(self.collection_name, "update_many", str(e), filter)
            raise
    
    async def delete_one(self, filter, **kwargs):
        try:
            result = await self.collection.delete_one(filter, **kwargs)
            log_delete(self.collection_name, filter, result)
            return result
        except Exception as e:
            log_error(self.collection_name, "delete_one", str(e), filter)
            raise
    
    async def delete_many(self, filter, **kwargs):
        try:
            result = await self.collection.delete_many(filter, **kwargs)
            log_delete(self.collection_name, filter, result)
            return result
        except Exception as e:
            log_error(self.collection_name, "delete_many", str(e), filter)
            raise
    
    def __getattr__(self, name):
        """Forward any other attributes to the underlying collection"""
        return getattr(self.collection, name)