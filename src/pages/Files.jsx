import React, { useEffect, useRef, useState } from "react";
import PageHeader from "../components/PageHeader";
import Pagination, { usePagination } from "../components/Pagination";
import { apiGet, apiDelete, apiUpload, API_BASE_URL } from "../lib/api";

const FILE_ICONS = {
  pdf:  { icon: "📄", color: "#dc2626" },
  doc:  { icon: "📝", color: "#1d4ed8" },
  docx: { icon: "📝", color: "#1d4ed8" },
  xls:  { icon: "📊", color: "#15803d" },
  xlsx: { icon: "📊", color: "#15803d" },
  ppt:  { icon: "📊", color: "#ea580c" },
  pptx: { icon: "📊", color: "#ea580c" },
  jpg:  { icon: "🖼️", color: "#7e22ce" },
  jpeg: { icon: "🖼️", color: "#7e22ce" },
  png:  { icon: "🖼️", color: "#7e22ce" },
  gif:  { icon: "🖼️", color: "#7e22ce" },
  webp: { icon: "🖼️", color: "#7e22ce" },
  zip:  { icon: "🗜️", color: "#92400e" },
  csv:  { icon: "📋", color: "#0e7490" },
  txt:  { icon: "📃", color: "#64748b" },
  mp4:  { icon: "🎬", color: "#be185d" },
  mov:  { icon: "🎬", color: "#be185d" },
};

function getFileIcon(filename) {
  const ext = (filename || "").split(".").pop().toLowerCase();
  return FILE_ICONS[ext] || { icon: "📁", color: "#64748b" };
}

function formatSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fileUrl(f) {
  // Replace only the trailing /api — not any /api inside the subdomain (e.g. //api.domain.com)
  const base = API_BASE_URL.replace(/\/api$/, "");
  return `${base}/uploads/projects/${f.filename}`;
}

export default function Files({ user }) {
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState("all");
  const [filesByProject, setFilesByProject] = useState({});
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProjectId, setUploadProjectId] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const data = await apiGet("/projects");
      const list = Array.isArray(data) ? data : [];
      setProjects(list);
      // Load files for all projects in parallel
      await loadAllFiles(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProjects(false);
    }
  }

  async function loadAllFiles(projectList) {
    setLoadingFiles(true);
    try {
      const results = await Promise.all(
        projectList.map((p) =>
          apiGet(`/upload/projects/${p.id}`)
            .then((files) => ({ id: p.id, files: Array.isArray(files) ? files : [] }))
            .catch(() => ({ id: p.id, files: [] }))
        )
      );
      const map = {};
      results.forEach(({ id, files }) => { map[id] = files; });
      setFilesByProject(map);
    } finally {
      setLoadingFiles(false);
    }
  }

  async function refreshProject(projectId) {
    try {
      const files = await apiGet(`/upload/projects/${projectId}`);
      setFilesByProject((prev) => ({ ...prev, [projectId]: Array.isArray(files) ? files : [] }));
    } catch (e) {
      console.error(e);
    }
  }

  async function handleUpload() {
    setUploadError("");
    setUploadSuccess("");
    if (!uploadFile) { setUploadError("Please select a file."); return; }
    if (!uploadProjectId) { setUploadError("Please select a project."); return; }

    const formData = new FormData();
    formData.append("projectId", String(uploadProjectId));
    formData.append("file", uploadFile);

    try {
      setUploading(true);
      await apiUpload("/upload/projects", formData);
      setUploadSuccess("File uploaded successfully!");
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await refreshProject(Number(uploadProjectId));
    } catch (e) {
      setUploadError(e.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(file, projectId) {
    if (!confirm(`Delete "${file.originalName}"?`)) return;
    try {
      await apiDelete(`/upload/${file.id}`);
      await refreshProject(projectId);
    } catch (e) {
      alert(e.message || "Delete failed.");
    }
  }

  const isStaff = ["ADMIN", "STAFF"].includes(user?.role);

  // Build display list
  const displayFiles = selectedId === "all"
    ? projects.flatMap((p) =>
        (filesByProject[p.id] || []).map((f) => ({ ...f, projectTitle: p.title, projectId: p.id }))
      )
    : (filesByProject[Number(selectedId)] || []).map((f) => ({
        ...f,
        projectTitle: projects.find((p) => p.id === Number(selectedId))?.title,
        projectId: Number(selectedId),
      }));

  const totalFiles = Object.values(filesByProject).reduce((s, arr) => s + arr.length, 0);
  const filesPagination = usePagination(displayFiles, 12);

  return (
    <div>
      <PageHeader
        title="Files & Documents"
        description="Upload, view, and manage project files, artwork, and deliverables."
        actions={
          <button className="green-btn" onClick={() => setShowUpload((v) => !v)}>
            {showUpload ? "Close Upload" : "+ Upload File"}
          </button>
        }
      />

      {/* Upload panel */}
      {showUpload && (
        <section className="panel" style={{ marginBottom: "20px" }}>
          <h3 style={{ marginTop: 0 }}>Upload a File</h3>
          <p style={{ color: "#64748b", fontSize: "13px" }}>
            Supported: images, PDF, Word, Excel, PowerPoint, ZIP, CSV, MP4 (max 25 MB)
          </p>

          <div className="form-grid" style={{ marginTop: "12px" }}>
            <label className="form-label">
              Project *
              <select
                value={uploadProjectId}
                onChange={(e) => setUploadProjectId(e.target.value)}
                className="form-select"
              >
                <option value="">— Select a project —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </label>

            <label className="form-label">
              File *
              <input
                ref={fileInputRef}
                type="file"
                className="form-select"
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.mp4,.mov"
                onChange={(e) => { setUploadFile(e.target.files[0]); setUploadSuccess(""); setUploadError(""); }}
              />
            </label>
          </div>

          {uploadFile && (
            <p style={{ color: "#475569", fontSize: "13px", margin: "8px 0" }}>
              Selected: <strong>{uploadFile.name}</strong> — {formatSize(uploadFile.size)}
            </p>
          )}

          {uploadError && <p style={{ color: "#dc2626", fontSize: "13px" }}>{uploadError}</p>}
          {uploadSuccess && <p style={{ color: "#15803d", fontSize: "13px" }}>{uploadSuccess}</p>}

          <button
            className="green-btn"
            onClick={handleUpload}
            disabled={uploading || !uploadFile || !uploadProjectId}
            style={{ marginTop: "10px" }}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </section>
      )}

      {/* Project tabs */}
      {loadingProjects ? (
        <p style={{ color: "#64748b" }}>Loading projects...</p>
      ) : projects.length === 0 ? (
        <div className="panel" style={{ color: "#64748b", textAlign: "center" }}>
          No projects found. Files are attached to projects.
        </div>
      ) : (
        <>
          <div className="file-project-tabs">
            <button
              className={selectedId === "all" ? "file-tab active" : "file-tab"}
              onClick={() => setSelectedId("all")}
            >
              All Projects
              <span className="file-tab-count">{totalFiles}</span>
            </button>
            {projects.map((p) => (
              <button
                key={p.id}
                className={String(selectedId) === String(p.id) ? "file-tab active" : "file-tab"}
                onClick={() => setSelectedId(String(p.id))}
              >
                {p.title}
                <span className="file-tab-count">{(filesByProject[p.id] || []).length}</span>
              </button>
            ))}
          </div>

          <section className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0 }}>
                {selectedId === "all"
                  ? `All Files (${displayFiles.length})`
                  : `${projects.find((p) => String(p.id) === selectedId)?.title || "Project"} — ${displayFiles.length} file${displayFiles.length !== 1 ? "s" : ""}`}
              </h3>
            </div>

            {loadingFiles ? (
              <p style={{ color: "#64748b" }}>Loading files...</p>
            ) : displayFiles.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>📂</div>
                <p style={{ margin: 0 }}>No files uploaded yet for this project.</p>
              </div>
            ) : (
              <div className="files-list">
                {filesPagination.paged.map((f) => {
                  const { icon, color } = getFileIcon(f.originalName);
                  return (
                    <div key={f.id} className="file-row">
                      <div className="file-icon" style={{ color }}>{icon}</div>
                      <div className="file-info">
                        <strong className="file-name">{f.originalName}</strong>
                        <div className="file-meta">
                          {selectedId === "all" && f.projectTitle && (
                            <span className="file-project-tag">{f.projectTitle}</span>
                          )}
                          <span>{formatDate(f.createdAt)}</span>
                          {f.size && <span>{formatSize(f.size)}</span>}
                        </div>
                      </div>
                      <div className="file-actions">
                        <a
                          href={fileUrl(f)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="view-btn"
                        >
                          View
                        </a>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(f, f.projectId)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
                <Pagination {...filesPagination} onPageChange={filesPagination.setPage} />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
