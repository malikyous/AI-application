from datetime import datetime, timezone
from pymongo import MongoClient
from bson.objectid import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()

class MongoDB:
    def __init__(self):
        self.client = None
        self.db = None
        self.connect()
    
    def connect(self):
        mongo_uri = os.getenv("MONGODB_URI", "mongodb+srv://Muhmmad1404:Muhmmadyousaf1404@cluster0.f3nzphr.mongodb.net/ai_chat?appName=Cluster0")
        self.client = MongoClient(mongo_uri)
        self.db = self.client.get_database()
        # Test connection
        try:
            self.client.admin.command('ping')
            print("✓ MongoDB connected successfully")
        except Exception as e:
            print(f"✗ MongoDB connection error: {e}")
    
    def get_collection(self, name):
        return self.db[name]

db = MongoDB()


class ChatSession:
    def __init__(self, title="New Chat", _id=None):
        self.id = _id
        self.title = title
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)
    
    def save(self):
        collection = db.get_collection("chat_sessions")
        data = {
            "title": self.title,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
        if self.id:
            collection.update_one({"_id": ObjectId(self.id)}, {"$set": data})
        else:
            result = collection.insert_one(data)
            self.id = str(result.inserted_id)
        return self
    
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "message_count": Message.count_by_session(self.id) if self.id else 0,
        }
    
    @staticmethod
    def get_all():
        collection = db.get_collection("chat_sessions")
        sessions = list(collection.find().sort("updated_at", -1))
        return [ChatSession._from_doc(doc) for doc in sessions]
    
    @staticmethod
    def get_by_id(session_id):
        collection = db.get_collection("chat_sessions")
        doc = collection.find_one({"_id": ObjectId(session_id)})
        return ChatSession._from_doc(doc) if doc else None
    
    @staticmethod
    def _from_doc(doc):
        session = ChatSession(
            title=doc.get("title", "New Chat"),
            _id=str(doc["_id"])
        )
        session.created_at = doc.get("created_at", datetime.now(timezone.utc))
        session.updated_at = doc.get("updated_at", datetime.now(timezone.utc))
        return session
    
    @staticmethod
    def delete(session_id):
        collection = db.get_collection("chat_sessions")
        collection.delete_one({"_id": ObjectId(session_id)})
        Message.delete_by_session(session_id)


class Message:
    def __init__(self, session_id, role, content, file_name=None, file_path=None, _id=None):
        self.id = _id
        self.session_id = session_id
        self.role = role
        self.content = content
        self.file_name = file_name
        self.file_path = file_path
        self.created_at = datetime.now(timezone.utc)
    
    def save(self):
        collection = db.get_collection("messages")
        data = {
            "session_id": self.session_id,
            "role": self.role,
            "content": self.content,
            "file_name": self.file_name,
            "file_path": self.file_path,
            "created_at": self.created_at
        }
        if self.id:
            collection.update_one({"_id": ObjectId(self.id)}, {"$set": data})
        else:
            result = collection.insert_one(data)
            self.id = str(result.inserted_id)
        return self
    
    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "role": self.role,
            "content": self.content,
            "file_name": self.file_name,
            "file_path": self.file_path,
            "created_at": self.created_at.isoformat(),
        }
    
    @staticmethod
    def get_by_session(session_id):
        collection = db.get_collection("messages")
        messages = list(collection.find({"session_id": session_id}).sort("created_at", 1))
        return [Message._from_doc(doc) for doc in messages]
    
    @staticmethod
    def count_by_session(session_id):
        collection = db.get_collection("messages")
        return collection.count_documents({"session_id": session_id})
    
    @staticmethod
    def delete_by_session(session_id):
        collection = db.get_collection("messages")
        collection.delete_many({"session_id": session_id})
    
    @staticmethod
    def search(query):
        collection = db.get_collection("messages")
        messages = list(collection.find({"content": {"$regex": query, "$options": "i"}}).sort("created_at", -1).limit(50))
        return [Message._from_doc(doc) for doc in messages]
    
    @staticmethod
    def _from_doc(doc):
        return Message(
            session_id=doc.get("session_id"),
            role=doc.get("role"),
            content=doc.get("content"),
            file_name=doc.get("file_name"),
            file_path=doc.get("file_path"),
            _id=str(doc["_id"])
        )


class Template:
    def __init__(self, name, content, category="general", _id=None):
        self.id = _id
        self.name = name
        self.content = content
        self.category = category
        self.created_at = datetime.now(timezone.utc)
    
    def save(self):
        collection = db.get_collection("templates")
        data = {
            "name": self.name,
            "content": self.content,
            "category": self.category,
            "created_at": self.created_at
        }
        if self.id:
            collection.update_one({"_id": ObjectId(self.id)}, {"$set": data})
        else:
            result = collection.insert_one(data)
            self.id = str(result.inserted_id)
        return self
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "content": self.content,
            "category": self.category,
            "created_at": self.created_at.isoformat(),
        }
    
    @staticmethod
    def get_all():
        collection = db.get_collection("templates")
        templates = list(collection.find().sort("created_at", -1))
        return [Template._from_doc(doc) for doc in templates]
    
    @staticmethod
    def get_by_id(template_id):
        collection = db.get_collection("templates")
        doc = collection.find_one({"_id": ObjectId(template_id)})
        return Template._from_doc(doc) if doc else None
    
    @staticmethod
    def delete(template_id):
        collection = db.get_collection("templates")
        collection.delete_one({"_id": ObjectId(template_id)})
    
    @staticmethod
    def _from_doc(doc):
        return Template(
            name=doc.get("name"),
            content=doc.get("content"),
            category=doc.get("category", "general"),
            _id=str(doc["_id"])
        )
