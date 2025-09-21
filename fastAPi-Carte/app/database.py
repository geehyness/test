import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_DETAILS = os.getenv("MONGODB_URL", "mongodb+srv://carte-test:13XbNEclGmOht55U@cluster0.zh2bega.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")

client = AsyncIOMotorClient(MONGO_DETAILS)
database = client.pos_system

# Collection references
def get_collection(collection_name):
    return database[collection_name]

# Helper to convert MongoDB documents
def document_helper(document) -> dict:
    if document:
        document["id"] = str(document["_id"])
        del document["_id"]
    return document