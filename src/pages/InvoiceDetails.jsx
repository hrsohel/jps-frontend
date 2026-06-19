import React, { useState } from "react";
import PageHeader from "../components/PageHeader";
import { apiPatch, apiPost } from "../lib/api";

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

  const isStaff = user?.role === "ADMIN" || user?.role === "STAFF";

  if (!selectedInvoice) {
    return (
      <div className="panel">
        <h2>No Invoice Selected</h2>
        <p>Please go back and select an invoice.</p>
      </div>
    );
  }

  const total =
    Number(serviceAmount) +
    Number(domainAmount) +
    Number(hostingAmount) +
    Number(shippingAmount) +
    Number(installationAmount) +
    Number(taxAmount) -
    Number(discountAmount);

  async function saveInvoice() {
    try {
      setSaving(true);
      await apiPatch(`/invoices/${selectedInvoice.id}`, {
        serviceAmount,
        domainAmount,
        hostingAmount,
        shippingAmount,
        installationAmount,
        taxAmount,
        discountAmount,
        dueDate: dueDate || null,
        notes: notes || null,
      });
      alert("Invoice updated successfully");
    } catch (error) {
      console.error(error);
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
      console.error(error);
      alert(error.message || "Unable to send invoice email");
    } finally {
      setEmailing(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={selectedInvoice.invoiceNumber}
        description="Invoice Details"
      />

      <section className="panel">
        <h2>Client Information</h2>

        <div className="row">
          <span>Name</span>
          <small>{selectedInvoice.clientName}</small>
        </div>
        <div className="row">
          <span>Email</span>
          <small>{selectedInvoice.clientEmail}</small>
        </div>
        <div className="row">
          <span>Status</span>
          <small>{selectedInvoice.status}</small>
        </div>
        <div className="row">
          <span>Created</span>
          <small>{new Date(selectedInvoice.createdAt).toLocaleDateString()}</small>
        </div>
      </section>

      <section className="panel">
        <h2>Invoice Details</h2>
        <div className="row">
          <span>Service Description</span>
          <small>{selectedInvoice.serviceDescription}</small>
        </div>
      </section>

      <section className="panel">
        <h2>Invoice Amounts</h2>

        <div className="invoice-grid">
          <label>
            Service Amount
            <input
              type="number"
              value={serviceAmount}
              onChange={(e) => setServiceAmount(e.target.value)}
              readOnly={!isStaff}
            />
          </label>

          <label>
            Domain Amount
            <input
              type="number"
              value={domainAmount}
              onChange={(e) => setDomainAmount(e.target.value)}
              readOnly={!isStaff}
            />
          </label>

          <label>
            Hosting Amount
            <input
              type="number"
              value={hostingAmount}
              onChange={(e) => setHostingAmount(e.target.value)}
              readOnly={!isStaff}
            />
          </label>

          <label>
            Shipping Amount
            <input
              type="number"
              value={shippingAmount}
              onChange={(e) => setShippingAmount(e.target.value)}
              readOnly={!isStaff}
            />
          </label>

          <label>
            Installation Amount
            <input
              type="number"
              value={installationAmount}
              onChange={(e) => setInstallationAmount(e.target.value)}
              readOnly={!isStaff}
            />
          </label>

          <label>
            Tax Amount
            <input
              type="number"
              value={taxAmount}
              onChange={(e) => setTaxAmount(e.target.value)}
              readOnly={!isStaff}
            />
          </label>

          <label>
            Discount Amount
            <input
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              readOnly={!isStaff}
            />
          </label>

          <label>
            Due Date
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              readOnly={!isStaff}
            />
          </label>
        </div>

        <label style={{ display: "block", marginTop: "12px" }}>
          Notes
          <textarea
            rows="3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes for this invoice..."
            readOnly={!isStaff}
            style={{ width: "100%", marginTop: "6px" }}
          />
        </label>

        <div className="invoice-total" style={{ marginTop: "16px" }}>
          <div className="row">
            <strong>Total</strong>
            <strong>${total.toFixed(2)}</strong>
          </div>
        </div>

        <div className="invoice-actions" style={{ marginTop: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {isStaff && (
            <button className="green-btn" onClick={saveInvoice} disabled={saving}>
              {saving ? "Saving..." : "Save Invoice"}
            </button>
          )}

          <button className="view-btn" onClick={() => window.print()}>
            Print / Download PDF
          </button>

          {isStaff && (
            <button className="outline" onClick={emailInvoice} disabled={emailing}>
              {emailing ? "Sending..." : "Email Invoice"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
