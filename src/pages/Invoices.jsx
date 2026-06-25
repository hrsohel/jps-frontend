import React, { useEffect, useState } from "react";
import { AlertCircle, Plus, X } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Pagination, { usePagination } from "../components/Pagination";
import { apiGet, apiPatch, apiPost } from "../lib/api";

const BLANK_INV = {
  clientEmail: "", clientName: "", serviceDescription: "", projectId: "",
  serviceAmount: "", domainAmount: "", hostingAmount: "", shippingAmount: "",
  installationAmount: "", taxAmount: "", discountAmount: "", dueDate: "", notes: "",
};

export default function Invoices({ setPage, setSelectedInvoice, user }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(BLANK_INV);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    try {
      const data = await apiGet("/invoices");
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, action) {
    try {
      await apiPatch(`/invoices/${id}/${action}`, {});
      loadInvoices();
    } catch (error) {
      alert(error.message || "Unable to update invoice");
    }
  }

  async function createInvoice(e) {
    e.preventDefault();
    if (!form.clientEmail || !form.clientName || !form.serviceDescription) {
      alert("Client email, name, and service description are required.");
      return;
    }
    try {
      setCreating(true);
      await apiPost("/invoices", {
        ...form,
        projectId: form.projectId ? Number(form.projectId) : undefined,
        serviceAmount: Number(form.serviceAmount || 0),
        domainAmount: Number(form.domainAmount || 0),
        hostingAmount: Number(form.hostingAmount || 0),
        shippingAmount: Number(form.shippingAmount || 0),
        installationAmount: Number(form.installationAmount || 0),
        taxAmount: Number(form.taxAmount || 0),
        discountAmount: Number(form.discountAmount || 0),
        dueDate: form.dueDate || null,
        notes: form.notes || null,
      });
      setForm(BLANK_INV);
      setShowCreate(false);
      await loadInvoices();
    } catch (error) {
      alert(error.message || "Unable to create invoice");
    } finally {
      setCreating(false);
    }
  }

  const isStaff = user?.role === "ADMIN" || user?.role === "STAFF";
  const invoicesPagination = usePagination(invoices, 8);

  const unpaidInvoices = invoices.filter((i) => i.status !== "PAID");
  const totalDue = unpaidInvoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0);

  function statusBadge(status) {
    const colors = { DRAFT: "#64748b", SENT: "#0749B3", PAID: "#0E9F6E" };
    return (
      <span style={{
        background: colors[status] || "#64748b", color: "#fff",
        padding: "2px 10px", borderRadius: "12px", fontSize: "12px",
      }}>
        {status}
      </span>
    );
  }

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  return (
    <div>
      <PageHeader
        title="Invoices & Billing"
        description="View invoices, balances, and payment status."
        actions={isStaff && (
          <button className="green-btn" onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? <><X size={15} style={{ verticalAlign: "middle" }} /> Cancel</> : <><Plus size={15} style={{ verticalAlign: "middle" }} /> Create Invoice</>}
          </button>
        )}
      />

      {/* Total dues banner for clients */}
      {!isStaff && totalDue > 0 && (
        <div style={{
          background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
          border: "1px solid #bfdbfe", borderRadius: 14, padding: "20px 24px",
          marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <AlertCircle size={22} color="#1d4ed8" />
            <div>
              <strong style={{ fontSize: 16, color: "#1e3a8a" }}>Outstanding Balance</strong>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#3b82f6" }}>
                {unpaidInvoices.length} unpaid invoice{unpaidInvoices.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1e3a8a" }}>
            ${totalDue.toFixed(2)}
          </div>
        </div>
      )}

      {/* Admin: Create Invoice form */}
      {isStaff && showCreate && (
        <section className="panel" style={{ marginBottom: 20 }}>
          <h2 style={{ marginTop: 0 }}>Create New Invoice</h2>
          <form onSubmit={createInvoice}>
            <div className="invoice-grid">
              <label>
                Client Email *
                <input type="email" value={form.clientEmail} onChange={(e) => set("clientEmail", e.target.value)} required placeholder="client@email.com" />
              </label>
              <label>
                Client Name *
                <input value={form.clientName} onChange={(e) => set("clientName", e.target.value)} required placeholder="Full Name" />
              </label>
              <label style={{ gridColumn: "1/-1" }}>
                Service Description *
                <input value={form.serviceDescription} onChange={(e) => set("serviceDescription", e.target.value)} required placeholder="Website Design, etc." />
              </label>
              <label>
                Project ID (optional)
                <input type="number" value={form.projectId} onChange={(e) => set("projectId", e.target.value)} placeholder="Leave blank if not linked" />
              </label>
              <label>
                Due Date
                <input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
              </label>
              <label>
                Service Amount ($)
                <input type="number" min="0" step="0.01" value={form.serviceAmount} onChange={(e) => set("serviceAmount", e.target.value)} placeholder="0.00" />
              </label>
              <label>
                Domain Amount ($)
                <input type="number" min="0" step="0.01" value={form.domainAmount} onChange={(e) => set("domainAmount", e.target.value)} placeholder="0.00" />
              </label>
              <label>
                Hosting Amount ($)
                <input type="number" min="0" step="0.01" value={form.hostingAmount} onChange={(e) => set("hostingAmount", e.target.value)} placeholder="0.00" />
              </label>
              <label>
                Tax Amount ($)
                <input type="number" min="0" step="0.01" value={form.taxAmount} onChange={(e) => set("taxAmount", e.target.value)} placeholder="0.00" />
              </label>
              <label>
                Discount Amount ($)
                <input type="number" min="0" step="0.01" value={form.discountAmount} onChange={(e) => set("discountAmount", e.target.value)} placeholder="0.00" />
              </label>
              <label style={{ gridColumn: "1/-1" }}>
                Notes
                <textarea rows="2" value={form.notes} onChange={(e) => set("notes", e.target.value)} style={{ width: "100%", marginTop: 4 }} />
              </label>
            </div>
            <div style={{ marginTop: 12 }}>
              <strong>Total: $
                {(
                  Number(form.serviceAmount || 0) +
                  Number(form.domainAmount || 0) +
                  Number(form.hostingAmount || 0) +
                  Number(form.taxAmount || 0) -
                  Number(form.discountAmount || 0)
                ).toFixed(2)}
              </strong>
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button className="green-btn" type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create Invoice"}
              </button>
              <button className="view-btn" type="button" onClick={() => { setShowCreate(false); setForm(BLANK_INV); }}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        <h2>Invoices</h2>

        {loading ? (
          <p style={{ color: "#64748b" }}>Loading invoices...</p>
        ) : invoices.length === 0 ? (
          <p style={{ color: "#64748b" }}>No invoices found.</p>
        ) : (
          <>
          {invoicesPagination.paged.map((invoice) => (
            <div key={invoice.id} className="row">
              <div>
                <button
                  className="link-btn"
                  onClick={() => {
                    setSelectedInvoice(invoice);
                    setPage("Invoice Details");
                  }}
                >
                  {invoice.invoiceNumber}
                </button>
                <br />
                <small>{invoice.clientName}</small>
                <br />
                <small>{invoice.serviceDescription}</small>
              </div>

              <div>
                <strong>${Number(invoice.totalAmount).toFixed(2)}</strong>
                <br />
                {statusBadge(invoice.status)}
                {invoice.dueDate && (
                  <>
                    <br />
                    <small style={{ color: "#64748b" }}>
                      Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </small>
                  </>
                )}

                {isStaff && (
                  <div className="card-actions" style={{ marginTop: "8px" }}>
                    {invoice.status === "DRAFT" && (
                      <button
                        className="view-btn"
                        onClick={() => updateStatus(invoice.id, "sent")}
                      >
                        Mark Sent
                      </button>
                    )}
                    {invoice.status !== "PAID" && (
                      <button
                        className="green-btn"
                        onClick={() => updateStatus(invoice.id, "paid")}
                      >
                        Mark Paid
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <Pagination {...invoicesPagination} onPageChange={invoicesPagination.setPage} />
          </>
        )}
      </section>
    </div>
  );
}
