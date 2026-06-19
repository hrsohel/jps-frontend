import React, { useEffect, useRef, useState } from "react";
import { apiGet, apiPost } from "../lib/api";
import { Send } from "lucide-react";

export default function Messages({ user }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const isStaff = ["ADMIN", "STAFF"].includes(user?.role);

  useEffect(() => {
    loadProjects();
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    clearInterval(pollRef.current);
    if (selectedProject) {
      loadMessages(selectedProject.id);
      // Poll for new messages every 8 seconds
      pollRef.current = setInterval(() => loadMessages(selectedProject.id, true), 8000);
    }
    return () => clearInterval(pollRef.current);
  }, [selectedProject?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadProjects() {
    try {
      const data = await apiGet("/projects");
      const list = Array.isArray(data) ? data : [];
      setProjects(list);
      if (list.length > 0) setSelectedProject(list[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProjects(false);
    }
  }

  async function loadMessages(projectId, silent = false) {
    if (!silent) setLoadingMessages(true);
    try {
      const data = await apiGet(`/project-messages/${projectId}`);
      setMessages(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }

  async function send() {
    if (!text.trim() || !selectedProject) return;
    setSending(true);
    try {
      await apiPost("/project-messages", {
        projectId: selectedProject.id,
        sender: isStaff ? "JPS Support" : (user?.fullName || "Client"),
        message: text.trim(),
      });
      setText("");
      await loadMessages(selectedProject.id, true);
    } catch (e) {
      alert(e.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function formatTime(iso) {
    const d = new Date(iso);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " " +
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  function isMine(msg) {
    return isStaff ? msg.senderRole === "STAFF" : msg.senderRole === "CLIENT";
  }

  return (
    <div className="messages-layout">
      {/* Project list sidebar */}
      <div className="messages-projects">
        <div className="messages-projects-header">
          <strong>Projects</strong>
        </div>

        {loadingProjects ? (
          <p style={{ padding: "16px", color: "#94a3b8", fontSize: "13px" }}>Loading...</p>
        ) : projects.length === 0 ? (
          <p style={{ padding: "16px", color: "#94a3b8", fontSize: "13px" }}>No projects yet.</p>
        ) : (
          projects.map((p) => (
            <button
              key={p.id}
              className={`messages-project-item ${selectedProject?.id === p.id ? "active" : ""}`}
              onClick={() => setSelectedProject(p)}
            >
              <div className="messages-project-name">{p.title}</div>
              <div className="messages-project-meta">{p.clientName} · {p.serviceGroup}</div>
            </button>
          ))
        )}
      </div>

      {/* Chat area */}
      <div className="messages-chat">
        {!selectedProject ? (
          <div className="messages-empty">
            <div style={{ fontSize: "48px" }}>💬</div>
            <p>Select a project to start messaging.</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="messages-chat-header">
              <div>
                <strong>{selectedProject.title}</strong>
                <span className="messages-chat-sub">
                  {isStaff ? `Client: ${selectedProject.clientName}` : "JPS Support Team"}
                </span>
              </div>
            </div>

            {/* Messages thread */}
            <div className="messages-thread">
              {loadingMessages ? (
                <p style={{ textAlign: "center", color: "#94a3b8", padding: "40px 0" }}>Loading messages...</p>
              ) : messages.length === 0 ? (
                <div className="messages-thread-empty">
                  <div style={{ fontSize: "36px", marginBottom: "8px" }}>👋</div>
                  <p>No messages yet. Start the conversation below.</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const mine = isMine(msg);
                  const showSender = i === 0 || messages[i - 1].senderRole !== msg.senderRole;
                  return (
                    <div key={msg.id} className={`msg-row ${mine ? "mine" : "theirs"}`}>
                      {showSender && (
                        <div className={`msg-sender ${mine ? "mine" : ""}`}>
                          {msg.sender}
                        </div>
                      )}
                      <div className={`msg-bubble ${mine ? "mine" : "theirs"}`}>
                        <span>{msg.message}</span>
                        <span className="msg-time">{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="messages-input-row">
              <textarea
                className="messages-input"
                placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                disabled={sending}
              />
              <button
                className="messages-send-btn"
                onClick={send}
                disabled={sending || !text.trim()}
                title="Send"
              >
                <Send size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
