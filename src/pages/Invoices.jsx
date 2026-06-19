import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import Pagination, { usePagination } from "../components/Pagination";
import { apiGet, apiPatch } from "../lib/api";

export default function Invoices({ setPage, setSelectedInvoice, user }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const isStaff = user?.role === "ADMIN" || user?.role === "STAFF";
  const invoicesPagination = usePagination(invoices, 8);

  function statusBadge(status) {
    const colors = { DRAFT: "#64748b", SENT: "#0749B3", PAID: "#0E9F6E" };
    return (
      <span
        style={{
          background: colors[status] || "#64748b",
          color: "#fff",
          padding: "2px 10px",
          borderRadius: "12px",
          fontSize: "12px",
        }}
      >
        {status}
      </span>
    );
  }

  return (
    <div>
      <PageHeader
        title="Invoices & Billing"
        description="View invoices, balances, and payment status."
      />

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
