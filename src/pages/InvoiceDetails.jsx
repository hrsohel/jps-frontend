import React, { useState } from "react";
import PageHeader from "../components/PageHeader";
import { apiPatch, apiPost } from "../lib/api";
import { CreditCard, CheckCircle2, Printer } from "lucide-react";

export default function InvoiceDetails({ selectedInvoice, user }) {
  const [serviceAmount, setServiceAmount] = useState(selectedInvoice?.serviceAmount || 0);
  const [domainAmount, setDomainAmount] = useState(selectedInvoice?.domainAmount || 0);
  const [hostingAmount, setHostingAmount] = useState(selectedInvoice?.hostingAmount || 0);
  const [shippingAmount, setShippingAmount] = useState(selectedInvoice?.shippingAmount || 0);
  const [installationAmount, setInstallationAmount] = useState(selectedInvoice?.installationAmount || 0);
  const [taxAmount, setTaxAmount] = useState(selectedInvoice?.taxAmount || 0);
  const [discountAmount, setDiscountAmount] = useState(selectedInvoice?.discountAmount || 0);
  const [dueDate, setDueDate] = useState(
    selectedInvoice?.dueDate ? new Date(selectedInvoice.dueDate).toISOString().split("T")[0] : ""
  );
  const [notes, setNotes] = useState(selectedInvoice?.notes || "");
  const [saving, setSaving] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [paying, setPaying] = useState(false);

  const isStaff = user?.role === "ADMIN" || user?.role === "STAFF";

  if (!selectedInvoice) {
    return (
      <div className="panel">
        <h2>No Invoice Selected</h2>
        <p>Please go back and select an invoice.</p>
      </div>
    );
  }

  const total = isStaff
    ? Number(serviceAmount) + Number(domainAmount) + Number(hostingAmount) +
      Number(shippingAmount) + Number(installationAmount) + Number(taxAmount) - Number(discountAmount)
    : Number(selectedInvoice.totalAmount);

  const isPaid = selectedInvoice.status === "PAID";

  async function saveInvoice() {
    try {
      setSaving(true);
      await apiPatch(`/invoices/${selectedInvoice.id}`, {
        serviceAmount, domainAmount, hostingAmount, shippingAmount,
        installationAmount, taxAmount, discountAmount,
        dueDate: dueDate || null, notes: notes || null,
      });
      alert("Invoice saved and client notified by email.");
    } catch (error) {
      alert(error.message || "Unable to save invoice");
    } finally {
      setSaving(false);
    }
  }

  async function emailInvoice() {
    try {
      setEmailing(true);
      await apiPost(`/invoices/${selectedInvoice.id}/email`, {});
      alert(`Invoice emailed to ${selectedInvoice.clientEmail}`);
    } catch (error) {
      alert(error.message || "Unable to send invoice email");
    } finally {
      setEmailing(false);
    }
  }

  async function handlePay() {
    try {
      setPaying(true);
      const data = await apiPost("/payments/checkout-session", { invoiceId: selectedInvoice.id });
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("Unable to start checkout. Please try again.");
      }
    } catch (error) {
      alert(error.message || "Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  // ── CLIENT VIEW ─────────────────────────────────────────────────────────
  if (!isStaff) {
    const rows = [
      { label: "Service", value: selectedInvoice.serviceAmount },
      { label: "Domain", value: selectedInvoice.domainAmount },
      { label: "Hosting", value: selectedInvoice.hostingAmount },
      { label: "Shipping", value: selectedInvoice.shippingAmount },
      { label: "Installation", value: selectedInvoice.installationAmount },
      { label: "Tax", value: selectedInvoice.taxAmount },
      { label: "Discount", value: selectedInvoice.discountAmount, deduct: true },
    ].filter((r) => Number(r.value) > 0);

    return (
      <div>
        <PageHeader title={selectedInvoice.invoiceNumber} description="Invoice from JPS Core" />

        <section className="panel" style={{ maxWidth: 600 }}>
          {/* Status banner */}
          {isPaid ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "14px 18px",
              background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, marginBottom: 20,
            }}>
              <CheckCircle2 size={22} color="#16a34a" />
              <div>
                <strong style={{ color: "#15803d" }}>Payment Received</strong>
                <p style={{ margin: 0, fontSize: 13, color: "#166534" }}>Thank you — this invoice has been paid.</p>
              </div>
            </div>
          ) : (
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "14px 18px",
              background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, marginBottom: 20,
            }}>
              <CreditCard size={22} color="#d97706" />
              <div>
                <strong style={{ color: "#92400e" }}>Payment Due</strong>
                <p style={{ margin: 0, fontSize: 13, color: "#78350f" }}>
                  {selectedInvoice.dueDate
                    ? `Due ${new Date(selectedInvoice.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
                    : "Please review and complete your payment."}
                </p>
              </div>
            </div>
          )}

          {/* Client info */}
          <div style={{ marginBottom: 20 }}>
            <div className="row"><span>Billed To</span><small>{selectedInvoice.clientName}</small></div>
            <div className="row"><span>Service</span><small>{selectedInvoice.serviceDescription}</small></div>
            <div className="row"><span>Invoice #</span><small>{selectedInvoice.invoiceNumber}</small></div>
            <div className="row"><span>Date Issued</span><small>{new Date(selectedInvoice.createdAt).toLocaleDateString()}</small></div>
          </div>

          {/* Line items */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
            <tbody>
              {rows.map(({ label, value, deduct }) => (
                <tr key={label} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "10px 0", color: "var(--muted)", fontSize: 13 }}>{label}</td>
                  <td style={{ padding: "10px 0", textAlign: "right", fontSize: 13, color: deduct ? "#ef4444" : "var(--ink)" }}>
                    {deduct ? `−$${Number(value).toFixed(2)}` : `$${Number(value).toFixed(2)}`}
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: "2px solid var(--deep)" }}>
                <td style={{ padding: "14px 0", fontWeight: 700, fontSize: 15 }}>Total Due</td>
                <td style={{ padding: "14px 0", textAlign: "right", fontWeight: 800, fontSize: 22, color: "var(--deep)" }}>
                  ${total.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          {selectedInvoice.notes && (
            <p style={{ fontSize: 13, color: "var(--muted)", borderTop: "1px solid var(--line)", paddingTop: 12 }}>
              Notes: {selectedInvoice.notes}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            {!isPaid && (
              <button
                onClick={handlePay}
                disabled={paying}
                style={{
                  flex: 1, minWidth: 140, padding: "14px 20px",
                  background: paying ? "#94a3b8" : "linear-gradient(135deg,#0749B3,#22A9E0)",
                  color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700,
                  cursor: paying ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: paying ? "none" : "0 4px 16px rgba(7,73,179,.35)",
                }}
              >
                <CreditCard size={18} />
                {paying ? "Redirecting…" : `Pay $${total.toFixed(2)}`}
              </button>
            )}
            <button
              onClick={() => window.print()}
              style={{
                padding: "14px 20px", background: "#f1f5f9", color: "var(--ink)",
                border: "1px solid var(--line)", borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <Printer size={16} /> Print
            </button>
          </div>
        </section>
      </div>
    );
  }

  // ── ADMIN / STAFF VIEW ──────────────────────────────────────────────────
  return (
    <div>
      <PageHeader title={selectedInvoice.invoiceNumber} description="Invoice Details" />

      <section className="panel">
        <h2>Client Information</h2>
        <div className="row"><span>Name</span><small>{selectedInvoice.clientName}</small></div>
        <div className="row"><span>Email</span><small>{selectedInvoice.clientEmail}</small></div>
        <div className="row"><span>Status</span>
          <small style={{ fontWeight: 700, color: isPaid ? "#16a34a" : selectedInvoice.status === "SENT" ? "#0749B3" : "#f59e0b" }}>
            {selectedInvoice.status}
          </small>
        </div>
        <div className="row"><span>Created</span><small>{new Date(selectedInvoice.createdAt).toLocaleDateString()}</small></div>
      </section>

      <section className="panel">
        <h2>Invoice Details</h2>
        <div className="row"><span>Service Description</span><small>{selectedInvoice.serviceDescription}</small></div>
      </section>

      <section className="panel">
        <h2>Invoice Amounts</h2>

        <div className="invoice-grid">
          <label>Service Amount<input type="number" value={serviceAmount} onChange={(e) => setServiceAmount(e.target.value)} /></label>
          <label>Domain Amount<input type="number" value={domainAmount} onChange={(e) => setDomainAmount(e.target.value)} /></label>
          <label>Hosting Amount<input type="number" value={hostingAmount} onChange={(e) => setHostingAmount(e.target.value)} /></label>
          <label>Shipping Amount<input type="number" value={shippingAmount} onChange={(e) => setShippingAmount(e.target.value)} /></label>
          <label>Installation Amount<input type="number" value={installationAmount} onChange={(e) => setInstallationAmount(e.target.value)} /></label>
          <label>Tax Amount<input type="number" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} /></label>
          <label>Discount Amount<input type="number" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} /></label>
          <label>Due Date<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label>
        </div>

        <label style={{ display: "block", marginTop: "12px" }}>
          Notes
          <textarea rows="3" value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes for this invoice..." style={{ width: "100%", marginTop: "6px" }} />
        </label>

        <div className="invoice-total" style={{ marginTop: "16px" }}>
          <div className="row"><strong>Total</strong><strong>${total.toFixed(2)}</strong></div>
        </div>

        <div className="invoice-actions" style={{ marginTop: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button className="green-btn" onClick={saveInvoice} disabled={saving}>
            {saving ? "Saving…" : "Save & Notify Client"}
          </button>
          <button className="view-btn" onClick={() => window.print()}>Print / Download PDF</button>
          <button className="outline" onClick={emailInvoice} disabled={emailing}>
            {emailing ? "Sending…" : "Email Invoice"}
          </button>
        </div>
      </section>
    </div>
  );
}
