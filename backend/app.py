import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import google.generativeai as genai
from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader

from models import ChatSession, Message, Template, db

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")
app.config["UPLOAD_FOLDER"] = os.path.join(os.path.dirname(__file__), "uploads")
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB

ALLOWED_EXTENSIONS = {"txt", "pdf", "png", "jpg", "jpeg", "gif", "doc", "docx", "csv", "json", "md"}

os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

genai_client = None
api_key = os.getenv("GOOGLE_AI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    try:
        genai_client = genai.GenerativeModel('gemini-1.5-flash')
        print("✓ Google AI configured successfully")
    except Exception as e:
        print(f"Error configuring model: {e}")
        genai_client = None


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def get_ai_response(messages):
    if not genai_client:
        return (
            "AI assistant is not configured. Please set your GOOGLE_AI_API_KEY in the "
            "backend/.env file and restart the server."
        )

    try:
        # Convert OpenAI format messages to Google AI format
        prompt = ""
        for msg in messages:
            if msg["role"] == "user":
                prompt += f"User: {msg['content']}\n"
            elif msg["role"] == "assistant":
                prompt += f"Assistant: {msg['content']}\n"
        
        response = genai_client.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Sorry, I encountered an error: {str(e)}"


def read_text_file(filepath):
    try:
        # Handle PDF files
        if filepath.lower().endswith('.pdf'):
            reader = PdfReader(filepath)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text[:8000]  # Larger limit for PDFs
        # Handle text files
        else:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()[:4000]
    except Exception as e:
        print(f"Error reading file: {e}")
        return None


# ── REST API ──────────────────────────────────────────────────────────────

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "ai_configured": genai_client is not None})


@app.route("/api/sessions", methods=["GET"])
def get_sessions():
    if not db.connected:
        return jsonify({"error": "Database not connected"}), 503
    sessions = ChatSession.get_all()
    return jsonify([s.to_dict() for s in sessions])


@app.route("/api/sessions", methods=["POST"])
def create_session():
    if not db.connected:
        return jsonify({"error": "Database not connected"}), 503
    session = ChatSession()
    session.save()
    return jsonify(session.to_dict()), 201


@app.route("/api/sessions/<session_id>", methods=["GET"])
def get_session(session_id):
    if not db.connected:
        return jsonify({"error": "Database not connected"}), 503
    session = ChatSession.get_by_id(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    messages = Message.get_by_session(session_id)
    return jsonify({
        "session": session.to_dict(),
        "messages": [m.to_dict() for m in messages],
    })


@app.route("/api/sessions/<session_id>", methods=["DELETE"])
def delete_session(session_id):
    if not db.connected:
        return jsonify({"error": "Database not connected"}), 503
    session = ChatSession.get_by_id(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    messages = Message.get_by_session(session_id)
    for msg in messages:
        if msg.file_path and os.path.exists(msg.file_path):
            os.remove(msg.file_path)
    ChatSession.delete(session_id)
    return jsonify({"message": "Session deleted"})


@app.route("/api/sessions/<session_id>/messages", methods=["POST"])
def send_message(session_id):
    if not db.connected:
        return jsonify({"error": "Database not connected"}), 503
    session = ChatSession.get_by_id(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    data = request.get_json()
    content = data.get("content", "").strip()
    if not content:
        return jsonify({"error": "Message content is required"}), 400

    user_msg = Message(session_id=session_id, role="user", content=content)
    user_msg.save()

    if session.title == "New Chat":
        session.title = content[:50] + ("..." if len(content) > 50 else "")

    session.updated_at = datetime.now(timezone.utc)
    session.save()

    history = Message.get_by_session(session_id)
    ai_messages = [{"role": m.role, "content": m.content} for m in history]
    ai_messages.append({"role": "user", "content": content})

    ai_content = get_ai_response(ai_messages)
    ai_msg = Message(session_id=session_id, role="assistant", content=ai_content)
    ai_msg.save()

    return jsonify({
        "user_message": user_msg.to_dict(),
        "ai_message": ai_msg.to_dict(),
    })


@app.route("/api/upload", methods=["POST"])
def upload_file():
    if not db.connected:
        return jsonify({"error": "Database not connected"}), 503
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    session_id = request.form.get("session_id")

    if not file.filename:
        return jsonify({"error": "No file selected"}), 400
    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed"}), 400
    if not session_id:
        return jsonify({"error": "session_id is required"}), 400

    session = ChatSession.get_by_id(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    filename = secure_filename(file.filename)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    unique_name = f"{timestamp}_{filename}"
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], unique_name)
    file.save(filepath)

    file_content = read_text_file(filepath)
    if file_content:
        content = f"[Uploaded file: {filename}]\n\n{file_content}"
    else:
        content = f"[Uploaded file: {filename}] (binary file - content not readable as text)"

    user_msg = Message(
        session_id=session_id,
        role="user",
        content=content,
        file_name=filename,
        file_path=filepath,
    )
    user_msg.save()

    if session.title == "New Chat":
        session.title = f"File: {filename[:40]}"

    session.updated_at = datetime.now(timezone.utc)
    session.save()

    ai_messages = [
        {"role": m.role, "content": m.content}
        for m in Message.get_by_session(session_id)
    ]
    ai_messages.append({"role": "user", "content": content})

    ai_content = get_ai_response(ai_messages)
    ai_msg = Message(session_id=session_id, role="assistant", content=ai_content)
    ai_msg.save()

    return jsonify({
        "user_message": user_msg.to_dict(),
        "ai_message": ai_msg.to_dict(),
    })


# ── Templates API ───────────────────────────────────────────────────────────

@app.route("/api/templates", methods=["GET"])
def get_templates():
    if not db.connected:
        return jsonify({"error": "Database not connected"}), 503
    templates = Template.get_all()
    return jsonify([t.to_dict() for t in templates])


@app.route("/api/templates", methods=["POST"])
def create_template():
    if not db.connected:
        return jsonify({"error": "Database not connected"}), 503
    data = request.get_json()
    name = data.get("name", "").strip()
    content = data.get("content", "").strip()
    category = data.get("category", "general")
    
    if not name or not content:
        return jsonify({"error": "Name and content are required"}), 400
    
    template = Template(name=name, content=content, category=category)
    template.save()
    return jsonify(template.to_dict()), 201


@app.route("/api/templates/<template_id>", methods=["DELETE"])
def delete_template(template_id):
    if not db.connected:
        return jsonify({"error": "Database not connected"}), 503
    Template.delete(template_id)
    return jsonify({"message": "Template deleted"})


# ── Export Chat API ─────────────────────────────────────────────────────────

@app.route("/api/sessions/<session_id>/export", methods=["GET"])
def export_session(session_id):
    if not db.connected:
        return jsonify({"error": "Database not connected"}), 503
    session = ChatSession.get_by_id(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    messages = Message.get_by_session(session_id)
    
    export_text = f"Chat Export: {session.title}\n"
    export_text += f"Exported: {datetime.now(timezone.utc).isoformat()}\n"
    export_text += "=" * 50 + "\n\n"
    
    for msg in messages:
        role = "You" if msg.role == "user" else "AI"
        timestamp = msg.created_at.strftime("%Y-%m-%d %H:%M:%S")
        export_text += f"[{timestamp}] {role}:\n{msg.content}\n\n"
    
    from flask import Response
    return Response(
        export_text,
        mimetype="text/plain",
        headers={"Content-Disposition": f"attachment;filename=chat_export_{session_id}.txt"}
    )


# ── Search API ─────────────────────────────────────────────────────────────

@app.route("/api/search", methods=["GET"])
def search_messages():
    if not db.connected:
        return jsonify({"error": "Database not connected"}), 503
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify([])
    
    messages = Message.search(query)
    
    return jsonify([m.to_dict() for m in messages])


# ── WebSocket (Real-time) ─────────────────────────────────────────────────

@socketio.on("connect")
def handle_connect():
    emit("connected", {"message": "Connected to chat server"})


@socketio.on("join_session")
def handle_join_session(data):
    session_id = data.get("session_id")
    if session_id:
        join_room(f"session_{session_id}")
        emit("joined", {"session_id": session_id})


@socketio.on("leave_session")
def handle_leave_session(data):
    session_id = data.get("session_id")
    if session_id:
        leave_room(f"session_{session_id}")


@socketio.on("send_message")
def handle_send_message(data):
    session_id = data.get("session_id")
    content = data.get("content", "").strip()

    if not session_id or not content:
        emit("error", {"message": "session_id and content are required"})
        return

    session = ChatSession.get_by_id(session_id)
    if not session:
        emit("error", {"message": "Session not found"})
        return

    user_msg = Message(session_id=session_id, role="user", content=content)
    user_msg.save()

    if session.title == "New Chat":
        session.title = content[:50] + ("..." if len(content) > 50 else "")

    session.updated_at = datetime.now(timezone.utc)
    session.save()

    emit("new_message", user_msg.to_dict(), room=f"session_{session_id}")
    emit("ai_typing", {"session_id": session_id}, room=f"session_{session_id}")

    history = Message.get_by_session(session_id)
    ai_messages = [{"role": m.role, "content": m.content} for m in history]
    ai_content = get_ai_response(ai_messages)

    ai_msg = Message(session_id=session_id, role="assistant", content=ai_content)
    ai_msg.save()

    emit("new_message", ai_msg.to_dict(), room=f"session_{session_id}")
    emit("ai_done", {"session_id": session_id}, room=f"session_{session_id}")


# ── Init ──────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port, debug=False)
