// import { useMemo } from 'react';
// import { C } from '../constants/theme';
// import s from './ReportsModule.module.css';

// export default function ReportsModule({ candidates }) {
//   const stats = useMemo(() => {
//     const total = candidates.length;
//     const byStatus = {};

//     candidates.forEach((c) => {
//       const key = String(c.Status_description || c.status || 'Unknown').trim() || 'Unknown';
//       byStatus[key] = (byStatus[key] || 0) + 1;
//     });

//     const normalized = Object.entries(byStatus).map(([label, count]) => ({ label, count }));
//     const pending = normalized.filter(s => s.label.toLowerCase().includes('pending')).reduce((a, b) => a + b.count, 0);
//     const confirmed = normalized.filter(s => s.label.toLowerCase().includes('interview confirmed')).reduce((a, b) => a + b.count, 0);
//     const completed = Math.max(total - pending - confirmed, 0);

//     const statusRows = normalized.sort((a, b) => b.count - a.count);

//     const statusColor = (label) => {
//       const k = label.toLowerCase();
//       if (k.includes('reject')) return '#ef4444';
//       if (k.includes('clear')) return C.green;
//       if (k.includes('hold')) return C.amber;
//       if (k.includes('pending')) return C.amber;
//       if (k.includes('interview confirmed')) return C.blue;
//       return C.accent;
//     };

//     const coloredRows = statusRows.map((row) => ({ ...row, color: statusColor(row.label) }));

//     return { total, pending, confirmed, completed, rows: coloredRows };
//   }, [candidates]);
  
//   return (
//     <div className={s.root}>
//       <h2 className={s.title}>Reports & Analytics</h2>
//       <div className={s.statsGrid}>
//         <div className={s.card}><p className={s.label}>Total</p><p className={s.value} style={{ color: C.accent }}>{stats.total}</p></div>
//         <div className={s.card}><p className={s.label}>Pending</p><p className={s.value} style={{ color: C.amber }}>{stats.pending}</p></div>
//         <div className={s.card}><p className={s.label}>Interview Confirmed</p><p className={s.value} style={{ color: C.blue }}>{stats.confirmed}</p></div>
//         <div className={s.card}><p className={s.label}>Completed</p><p className={s.value} style={{ color: C.green }}>{stats.completed}</p></div>
//       </div>
//       <div className={s.pipelineBox}>
//         <h3 className={s.pipelineTitle}>Pipeline Status</h3>
//         {stats.rows.map((row) => (
//           <div key={row.label} className={s.row}>
//             <div className={s.rowHead}><span className={s.rowLabel}>{row.label}</span><span className={s.rowValue} style={{ color: row.color }}>{row.count}</span></div>
//             <div className={s.barTrack}><div className={s.barFill} style={{ background: row.color, width: `${stats.total > 0 ? (row.count / stats.total) * 100 : 0}%` }} /></div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// p-New Updated  
import { useMemo, useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "./ReportsModule.module.css";

export default function ReportsModule({ candidates }) {
   const API_BASE = import.meta.env.VITE_API_URL;
  /* -------------------- ACTIVE TAB -------------------- */
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("activeTab") || "total";
  });
  /* -------------------- DOWNLOAD Report -------------------- */
    const [showDownload, setShowDownload] = useState(false);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  /* -------------------- SEARCH & FILTER STATES -------------------- */
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");

  /* -------------------- UNIQUE POSITIONS -------------------- */
  const positions = useMemo(() => {
    const unique = [...new Set(candidates.map(c => c.Candidate_position))];
    return unique.filter(Boolean);
  }, [candidates]);

  /* -------------------- STATISTICS -------------------- */
  const stats = useMemo(() => {
    const total = candidates.length;

    const pendingCandidates = candidates.filter((c) =>
      String(c.Status_description || "")
        .toLowerCase()
        .includes("pending")
    );

    const confirmedCandidates = candidates.filter((c) =>
      String(c.Status_description || "")
        .toLowerCase()
        .includes("interview confirmed")
    );

    const completedCandidates = candidates.filter(
      (c) =>
        !String(c.Status_description || "")
          .toLowerCase()
          .includes("pending") &&
        !String(c.Status_description || "")
          .toLowerCase()
          .includes("interview confirmed")
    );


    return {
      total,
      pending: pendingCandidates.length,
      confirmed: confirmedCandidates.length,
      completed: completedCandidates.length,
      pendingCandidates,
      confirmedCandidates,
      completedCandidates,
    };
  }, [candidates]);

  /* -------------------- FILTER FUNCTION -------------------- */
  const applyFilters = (data) => {
    return data.filter((c) => {

      const matchesSearch =
        String(c.Candidate_name || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        String(c.Candidate_phone || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        String(c.Candidate_position || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        String(c.Status_description) === statusFilter;

      const matchesPosition =
        positionFilter === "all" ||
        String(c.Candidate_position) === positionFilter;

      return matchesSearch && matchesStatus && matchesPosition;
    });
  };

  const downloadCurrentMonth = () => {
  window.open(
    `${API_BASE}api/reports/download.php?type=current`,
    "_blank"
  );
};

const downloadByDate = () => {
  if (!fromDate || !toDate) {
    alert("Please select both dates");
    return;
  }

  window.open(
    `${API_BASE}api/reports/download.php?type=custom&from=${fromDate}&to=${toDate}`,
    "_blank"
  );
};

  /* -------------------- TABLE RENDER -------------------- */
  const renderTable = (data) => {
    if (!data.length)
      return (
        <div className="text-center text-muted py-4">
          No Data Available
        </div>
      );

    return (
      <div className="table-responsive bg-white shadow-sm rounded-4 p-3">
        <table className={`table align-middle mb-0 ${styles.reportTable}`}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Position</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {data.map((c, index) => (
              <tr
                key={c.Candidate_id}
                style={{
                  background: index % 2 === 0 ? "#f8fafc" : "#ffffff",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                }}
              >
                <td className="border-0 ps-4 py-3 fw-semibold text-secondary">
                  {c.Candidate_id}
                </td>

                <td className="border-0 py-3 fw-bold text-dark">
                  {c.Candidate_name}
                </td>

                <td className="border-0 py-3 text-muted">
                  {c.Candidate_phone}
                </td>

                <td className="border-0 py-3">
                  <span className="badge bg-light text-dark px-3 py-2 rounded-pill">
                    {c.Candidate_position}
                  </span>
                </td>

                <td className="border-0 pe-4 py-3">
                  <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">
                    {c.Status_description || "N/A"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* REPORT DOWNLOAD POPUP */}
        
        {/* DOWNLOAD MODAL */}
        {showDownload && (
  <>
    {/* BACKDROP */}
    <div
      className="modal-backdrop fade show"
      onClick={() => setShowDownload(false)}
    ></div>

    {/* MODAL */}
    <div
      className="modal d-block"
      tabIndex="-1"
      style={{ background: "rgba(0,0,0,0.6)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content p-4 rounded-4 shadow-lg border-0">

          {/* HEADER */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0 text-primary">
              <i className="bi bi-download me-2"></i>
              Download Report
            </h5>

            {/* Close Icon */}
            <button
              className="btn btn-sm btn-light rounded-circle shadow-sm"
              onClick={() => setShowDownload(false)}
              style={{ width: "32px", height: "32px" }}
            >
              ✕
            </button>
          </div>

          {/* CURRENT MONTH BUTTON */}
          <button
            className="btn btn-primary mb-3 w-100 rounded-3"
            onClick={downloadCurrentMonth}
          >
            Download Current Month Report 
          </button>

          {/* <div className="text-center my-2 text-muted">OR</div> */}

          {/* DATE RANGE SECTION */}
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">From Date</label>
              <input
                type="date"
                className="form-control rounded-3"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">To Date</label>
              <input
                type="date"
                className="form-control rounded-3"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="d-flex gap-2 mt-4">
            <button
              className="btn btn-success w-100 rounded-3"
              onClick={downloadByDate}
            >
              ⬇ Download By Date
            </button>

            <button
              className="btn btn-outline-danger rounded-3"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
            >
              Reset
            </button>
          </div>

          {/* <button
            className="btn btn-light mt-3 w-100 rounded-3"
            onClick={() => setShowDownload(false)}
          >
            Close
          </button> */}

        </div>
      </div>
    </div>
  </>
)}
      </div>
    );
  };


  /* -------------------- STAT CARD -------------------- */
  const StatCard = ({ label, value, type }) => {
    const isActive = activeTab === type;

    return (
      <div className="col-md-3 col-sm-6 mb-3">
        <div
          onClick={() => setActiveTab(type)}
          className={`p-4 rounded-4 text-center ${
            isActive ? "shadow-lg" : "shadow-sm"
          }`}
          style={{
            background: isActive
              ? "linear-gradient(135deg, #2563eb, #1e3a8a)"
              : "#f8fafc",
            color: isActive ? "white" : "#1e293b",
            transition: "0.3s",
            cursor: "pointer",
          }}
        >
          <h2 className="fw-bold mb-1">{value}</h2>
          <p className="mb-0 small">{label}</p>
        </div>
      </div>
    );
  };

  /* -------------------- RETURN -------------------- */
  return (
    <div className="container py-4">
      <h4 className="fw-bold mb-4 text-dark">
        Reports & Analytics
      </h4>

      {/* Stat Cards */}
      <div className="row">
        <StatCard label="Total Candidates" value={stats.total} type="total" />
        <StatCard label="Pending" value={stats.pending} type="pending" />
        <StatCard label="Interview Confirmed" value={stats.confirmed} type="confirmed" />
        <StatCard label="Completed" value={stats.completed} type="completed" />
      </div>

      {/* Search & Filters */}
      <div className="row g-3 mt-3 mb-3">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control rounded-3"
            placeholder="Search by name, phone, position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="col-md-4">
          <select
            className="form-select rounded-3"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            {[...new Set(candidates.map(c => c.Status_description))]
              .filter(Boolean)
              .map((status, i) => (
                <option key={i} value={status}>
                  {status}
                </option>
              ))}
          </select>
        </div>

        <div className="col-md-4">
          <select
            className="form-select rounded-3"
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
          >
            <option value="all">All Positions</option>
            {positions.map((pos, i) => (
              <option key={i} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>
        {/* download  */}
        <div className="d-flex justify-content-end mb-3">
          <button
            className="btn btn-success"
            onClick={() => setShowDownload(true)}>Download Report</button>
        </div>
      </div>

      {/* Content Section */}
      <div className="mt-4">
        {activeTab === "total" &&
          renderTable(applyFilters(candidates))}

        {activeTab === "pending" &&
          renderTable(applyFilters(stats.pendingCandidates))}

        {activeTab === "confirmed" &&
          renderTable(applyFilters(stats.confirmedCandidates))}

        {activeTab === "completed" &&
          renderTable(applyFilters(stats.completedCandidates))}
      </div>
    </div>
  );
}