# app/utils/mongo_helpers.py
from typing import Any, Dict, List, Optional
from bson import ObjectId
from datetime import datetime, date  # FIXED: Added date import
from app.models.base import MongoModel

def transform_mongo_response(data: Any) -> Any:
    """
    Transform MongoDB response to match Pydantic models by converting _id to id.
    Handles nested documents and lists.
    """
    if isinstance(data, dict):
        data = data.copy()
        if '_id' in data:
            if isinstance(data['_id'], ObjectId):
                data['id'] = str(data['_id'])
            else:
                data['id'] = data['_id']
            del data['_id']
        # Recursively transform nested dictionaries and lists
        for key, value in data.items():
            data[key] = transform_mongo_response(value)
        return data
    elif isinstance(data, list):
        return [transform_mongo_response(item) for item in data]
    elif isinstance(data, ObjectId):
        return str(data)
    elif isinstance(data, (datetime, date)):  # FIXED: Now date is defined
        return data.isoformat()
    return data

def to_mongo_dict(model_instance: MongoModel, exclude_unset: bool = False) -> Dict[str, Any]:
    """
    Convert a model instance to a MongoDB dictionary, setting timestamps and removing immutable fields.
    """
    data = model_instance.to_dict(exclude_unset=exclude_unset)
    now_iso = datetime.utcnow().isoformat()
    
    # Remove immutable fields that shouldn't be included in MongoDB operations
    immutable_fields = ['_id', 'id']
    for field in immutable_fields:
        data.pop(field, None)
    
    if not exclude_unset:
        data["created_at"] = now_iso
    data["updated_at"] = now_iso
    return data

def to_mongo_update_dict(model_instance: MongoModel, exclude_unset: bool = True) -> Dict[str, Any]:
    """
    Convert a model instance to a MongoDB dictionary for updates, excluding immutable fields.
    """
    data = model_instance.to_dict(exclude_unset=exclude_unset)
    now_iso = datetime.utcnow().isoformat()
    
    # Remove immutable fields that shouldn't be updated
    immutable_fields = ['_id', 'id', 'created_at']
    for field in immutable_fields:
        data.pop(field, None)
    
    data["updated_at"] = now_iso
    return data

def prepare_response_data(data: Any) -> Any:
    """
    Prepare data for API response by transforming MongoDB format to API format.
    """
    return transform_mongo_response(data)