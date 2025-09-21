# app/models/base.py
from typing import Optional, Any
from pydantic import BaseModel, Field
from pydantic_core import core_schema
from bson import ObjectId
from datetime import datetime

class PyObjectId(ObjectId):
    """
    Custom ObjectId class for Pydantic V2 compatibility.
    Handles serialization and validation for MongoDB ObjectIds.
    """
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: Any, handler) -> core_schema.CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.is_instance_schema(cls),
            serialization=core_schema.plain_serializer_function_ser_schema(lambda x: str(x)),
        )

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return cls(v)

    @classmethod
    def __get_validators__(cls):
        yield cls.validate


class MongoModel(BaseModel):
    """
    A base model for MongoDB documents, handling serialization and
    deserialization of `_id` to `id`.
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

    @classmethod
    def from_mongo(cls, data: dict):
        if not data:
            return data
        id_val = data.pop('_id', None)
        return cls(**dict(data, id=id_val))

    def to_mongo(self, **kwargs):
        exclude_unset = kwargs.pop('exclude_unset', True)
        by_alias = kwargs.pop('by_alias', True)
        
        parsed = self.model_dump(
            exclude_unset=exclude_unset,
            by_alias=by_alias,
            **kwargs,
        )

        if '_id' not in parsed and 'id' in parsed:
            parsed['_id'] = parsed.pop('id')

        return parsed