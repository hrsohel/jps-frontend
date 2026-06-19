import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { apiGet, apiPost, apiPatch, apiDelete, apiUpload, API_BASE_URL } from "../lib/api";

export default function ProjectDetails({ selectedProject, user }) {
  const [project, setProject] = useState(selectedProject || null);
  const [status, setStatus] = useState(selectedProject?.status || "IN_PROGRESS");
  const [progressValue, setProgressValue] = useState(selectedProject?.progress || 0);
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [activities, setActivities] = useState([]);

  const isStaff = user?.role === "ADMIN" || user?.role === "STAFF";
  const activeProject = project || selectedProject;
  const projectId = activeProject?.id;

  useEffect(() => {
    if (!projectId) return;
    setProject(selectedProject);
    setStatus(selectedProject?.status || "IN_PROGRESS");
    setProgressValue(selectedProject?.progress || 0);
    loadFiles(projectId);
    loadMessages(projectId);
    loadActivities(projectId);
  }, [selectedProject]);

  async function loadFiles(id) {
    if (!id) return;
    try {
      const data = await apiGet(`/upload/projects/${id}`);
      setFiles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadMessages(id) {
    if (!id) return;
    try {
      const data = await apiGet(`/project-messages/${id}`);
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadActivities(id) {
    if (!id) return;
    try {
      const data = await apiGet(`/project-activities/${id}`);
      setActivities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleUpload() {
    if (!file) {
      alert("Please choose a file first");
      return;
    }
    if (!projectId) {
      alert("Project ID is missing.");
      return;
    }

    const formData = new FormData();
    formData.append("projectId", String(projectId));
    formData.append("file", file);

    try {
      await apiUpload("/upload/projects", formData);
      alert("File uploaded successfully");
      setFile(null);
      loadFiles(projectId);
    } catch (error) {
      alert(error.message || "Upload failed");
    }
  }

  async function handleDelete(fileId) {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      await apiDelete(`/upload/${fileId}`);
      loadFiles(projectId);
    } catch (error) {
      alert(error.message || "Delete failed");
    }
  }

  async function sendMessage() {
    if (!newMessage.trim()) {
      alert("Please type a message first");
      return;
    }

    try {
      await apiPost("/project-messages", {
        projectId,
        sender: isStaff ? "JPS Support" : (user?.fullName || activeProject?.clientName || "Client"),
        message: newMessage,
      });
      setNewMessage("");
      loadMessages(projectId);
    } catch (error) {
      alert(error.message || "Unable to send message");
    }
  }

  async function generateInvoice() {
    if (!activeProject?.id) {
      alert("Project is missing");
      return;
    }
    if (!invoiceAmount) {
      alert("Enter invoice amount first");
      return;
    }

    try {
      await apiPost("/invoices", {
        projectId: activeProject.id,
        clientName: activeProject.clientName,
        clientEmail: activeProject.clientEmail,
        serviceDescription: activeProject.title,
        serviceAmount: invoiceAmount,
      });
      alert("Invoice created successfully");
      setInvoiceAmount("");
    } catch (error) {
      alert(error.message || "Unable to create invoice");
    }
  }

  async function updateProject() {
    try {
      const data = await apiPatch(`/projects/${projectId}`, {
        status,
        progress: progressValue,
      });
      alert("Project updated successfully");
      setProject(data);
    } catch (error) {
      alert(error.message || "Unable to update project");
    }
  }

  if (!activeProject) {
    return (
      <div className="panel">
        <h2>No Project Selected</h2>
        <p>Please go back to Projects and select a project.</p>
      </div>
    );
  }

  const progress = activeProject?.progress || 0;

  return (
    <div>
      <PageHeader
        title={activeProject?.title || "Project Details"}
        description={activeProject?.description || "View project status, progress, files, messages, and recent updates."}
      />

      <section className="panel">
        <h2>Project Overview</h2>

        <div className="row">
          <span>Client</span>
          <small>{activeProject?.clientName}</small>
        </div>
        <div className="row">
          <span>Email</span>
          <small>{activeProject?.clientEmail}</small>
        </div>
        <div className="row">
          <span>Service</span>
          <small>{activeProject?.serviceGroup}</small>
        </div>
        <div className="row">
          <span>Status</span>
          <small>{activeProject?.status}</small>
        </div>
        <div className="row">
          <span>Progress</span>
          <small>{progress}% Complete</small>
        </div>

        <div className="progress-bar">
          <div style={{ width: `${progress}%` }}></div>
        </div>
      </section>

      {isStaff && (
        <section className="panel">
          <h2>Project Management</h2>

          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="PLANNING">Planning</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_ON_CLIENT">Waiting On Client</option>
              <option value="REVIEW">Review</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </label>

          <label>
            Progress %
            <input
              type="number"
              min="0"
              max="100"
              value={progressValue}
              onChange={(e) => setProgressValue(e.target.value)}
            />
          </label>

          <div className="card-actions">
            <button className="green-btn" onClick={updateProject}>
              Save Project
            </button>
          </div>
        </section>
      )}

      {isStaff && (
        <section className="panel">
          <h2>Generate Invoice</h2>

          <div className="form-group">
            <label>Service Amount</label>
            <input
              value={invoiceAmount}
              onChange={(e) => setInvoiceAmount(e.target.value)}
              placeholder="300"
            />
          </div>

          <button className="green-btn" onClick={generateInvoice}>
            Generate Invoice
          </button>
        </section>
      )}

      <section className="panel">
        <h2>Files & Documents</h2>
        <p>Upload and manage files connected to this project.</p>

        <div className="file-list">
          {files.length === 0 ? (
            <p style={{ color: "#64748b" }}>No files uploaded yet.</p>
          ) : (
            files.map((uploadedFile) => (
              <div key={uploadedFile.id} className="row">
                <div>
                  <strong>{uploadedFile.originalName}</strong>
                  <br />
                  <small>{new Date(uploadedFile.createdAt).toLocaleDateString()}</small>
                </div>
                <div className="file-actions">
                  <a
                    href={`${API_BASE_URL.replace("/api", "")}/${uploadedFile.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-btn"
                  >
                    View
                  </a>
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => handleDelete(uploadedFile.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: "12px" }}>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <div className="card-actions" style={{ marginTop: "8px" }}>
            <button className="view-btn" onClick={handleUpload}>
              Upload File
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Project Messages</h2>
        <p>Communicate with the JPS team about this project.</p>

        <div className="message-list">
          {messages.length === 0 ? (
            <p style={{ color: "#64748b" }}>No messages yet.</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={
                  msg.sender === "JPS Support"
                    ? "message-item staff-message"
                    : "message-item client-message"
                }
              >
                <strong>{msg.sender}</strong>
                <p>{msg.message}</p>
                <small>{new Date(msg.createdAt).toLocaleString()}</small>
              </div>
            ))
          )}
        </div>

        <textarea
          className="message-input"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message here..."
        />

        <div className="message-actions">
          <button className="view-btn" onClick={sendMessage}>
            Send Message
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Project Timeline</h2>
        <p>Track important project updates and activity.</p>

        <div className="timeline-list">
          <div className="timeline-entry">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <strong>Project Created</strong>
              <p>Project was created and added to the portal.</p>
              <small>
                {activeProject?.createdAt
                  ? new Date(activeProject.createdAt).toLocaleString()
                  : "Date unavailable"}
              </small>
            </div>
          </div>

          {activities.length === 0 ? (
            <p className="muted-text" style={{ color: "#64748b", marginLeft: "24px" }}>
              No additional activity recorded yet.
            </p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="timeline-entry">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <strong>{activity.action}</strong>
                  <p>{activity.details}</p>
                  <small>{new Date(activity.createdAt).toLocaleString()}</small>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
