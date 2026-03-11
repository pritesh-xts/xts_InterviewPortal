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
import { useAlert } from '../hooks/useAlert';
import { AlertModal } from './ui/AlertModal';
import styles from "./ReportsModule.module.css";

export default function ReportsModule({ candidates }) {
  const { alert, showAlert, closeAlert } = useAlert();
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

  /* -------------------- FILTERED STATUS OPTIONS BASED ON ACTIVE TAB -------------------- */
  const filteredStatusOptions = useMemo(() => {
    if (activeTab === 'pending') {
      return candidates
        .filter(c => String(c.Status_description || '').toLowerCase().includes('pending'))
        .map(c => c.Status_description)
        .filter((v, i, a) => v && a.indexOf(v) === i);
    }
    if (activeTab === 'confirmed') {
      return candidates
        .filter(c => String(c.Status_description || '').toLowerCase().includes('interview confirmed'))
        .map(c => c.Status_description)
        .filter((v, i, a) => v && a.indexOf(v) === i);
    }
    if (activeTab === 'completed') {
      return candidates
        .filter(c => {
          const status = String(c.Status_description || '').toLowerCase();
          return status.includes('offer rolled out') || status.includes('offer on hold');
        })
        .map(c => c.Status_description)
        .filter((v, i, a) => v && a.indexOf(v) === i);
    }
    return [...new Set(candidates.map(c => c.Status_description))].filter(Boolean);
  }, [candidates, activeTab]);

  /* -------------------- RESET STATUS FILTER ON TAB CHANGE -------------------- */
  useEffect(() => {
    setStatusFilter('all');
  }, [activeTab]);

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

    const completedCandidates = candidates.filter((c) => {
      const status = String(c.Status_description || "").toLowerCase();
      return status.includes("offer rolled out") || status.includes("offer on hold");
    });


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

  /* -------------------- FILTERED STATISTICS -------------------- */
  const filteredStats = useMemo(() => {
    const filtered = applyFilters(candidates);
    const pending = filtered.filter(c => String(c.Status_description || "").toLowerCase().includes("pending")).length;
    const confirmed = filtered.filter(c => String(c.Status_description || "").toLowerCase().includes("interview confirmed")).length;
    const completed = filtered.filter(c => {
      const status = String(c.Status_description || "").toLowerCase();
      return status.includes("offer rolled out") || status.includes("offer on hold");
    }).length;
    return { total: filtered.length, pending, confirmed, completed };
  }, [candidates, search, statusFilter, positionFilter]);

  const downloadCurrentMonth = () => {
    window.open(
      `${API_BASE}api/reports/download.php?type=current`,
      "_blank"
    );
  };

  const downloadByDate = () => {
    if (!fromDate || !toDate) {
      showAlert("Please select both dates", 'warning');
      return;
    }

    window.open(
      `${API_BASE}api/reports/download.php?type=custom&from=${fromDate}&to=${toDate}`,
      "_blank"
    );
  };

  /* -------------------- TABLE RENDER -------------------- */
  // const renderTable = (data) => {
  //   if (!data.length)
  //     return (
  //       <div className="text-center text-muted py-4">
  //         No Data Available
  //       </div>
  //     );

  //   return (
  //     <div className="table-responsive bg-white shadow-sm rounded-4 p-3">
  //       <table className={`table align-middle mb-0 ${styles.reportTable}`}>
  //         <thead>
  //           <tr>
  //             <th>ID</th>
  //             <th>Name</th>
  //             <th>Phone</th>
  //             <th>Position</th>
  //             <th>Status</th>
  //           </tr>
  //         </thead>

  //         <tbody>
  //           {data.map((c, index) => (
  //             <tr
  //               key={c.Candidate_id}
  //               style={{
  //                 background: index % 2 === 0 ? "#f8fafc" : "#ffffff",
  //                 boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  //               }}
  //             >
  //               <td className="border-0 ps-4 py-3 fw-semibold text-secondary">
  //                 {c.Candidate_id}
  //               </td>

  //               <td className="border-0 py-3 fw-bold text-dark">
  //                 {c.Candidate_name}
  //               </td>

  //               <td className="border-0 py-3 text-muted">
  //                 {c.Candidate_phone}
  //               </td>

  //               <td className="border-0 py-3">
  //                 <span className="badge bg-light text-dark px-3 py-2 rounded-pill">
  //                   {c.Candidate_position}
  //                 </span>
  //               </td>

  //               <td className="border-0 pe-4 py-3">
  //                 <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">
  //                   {c.Status_description || "N/A"}
  //                 </span>
  //               </td>
  //             </tr>
  //           ))}
  //         </tbody>
  //       </table>

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
              {/* <th>L1 Feedback</th>
            <th>L2 Feedback</th> */}
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

                <td className="border-0 py-3">
                  <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">
                    {c.Status_description || "N/A"}
                  </span>
                </td>

                {/* L1 Feedback Column */}
                {/* <td className="border-0 py-3 text-muted">
                {c.L1_feedback ? (
                  <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill">
                    {c.L1_feedback}
                  </span>
                ) : (
                  "N/A"
                )}
              </td> */}

                {/* L2 Feedback Column */}
                {/* <td className="border-0 pe-4 py-3 text-muted">
                {c.L2_feedback ? (
                  <span className="badge bg-info bg-opacity-10 text-info px-3 py-2 rounded-pill">
                    {c.L2_feedback}
                  </span>
                ) : (
                  "N/A"
                )}
              </td> */}
              </tr>
            ))}
          </tbody>
        </table>

        {/* DOWNLOAD MODAL remains same below */}

        {/* REPORT DOWNLOAD POPUP */}

        {/* DOWNLOAD MODAL */}
        {showDownload && (
          <>
            {/* BACKDROP */}
            <div
              className="modal-backdrop fade show"
              onClick={() => setShowDownload(false)}
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            ></div>

            {/* MODAL */}
            <div
              className="modal d-block"
              tabIndex="-1"
              style={{ zIndex: 1055 }}
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>

                  {/* HEADER */}
                  <div className="p-4 border-bottom">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h4 className="fw-bold mb-1 text-dark">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#39bdf1" className="me-2" viewBox="0 0 16 16" style={{ verticalAlign: 'middle' }}>
                            <path d="M8.5 6.5a.5.5 0 0 0-1 0v3.793L6.354 9.146a.5.5 0 1 0-.708.708l2 2a.5.5 0 0 0 .708 0l2-2a.5.5 0 0 0-.708-.708L8.5 10.293z" />
                            <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2M9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z" />
                          </svg>
                          Download Report
                        </h4>
                        <p className="mb-0 small text-muted">Export candidate data to Excel</p>
                      </div>
                      <button
                        className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center"
                        onClick={() => setShowDownload(false)}
                        style={{ width: '36px', height: '36px', padding: 0 }}
                      >
                        <span style={{ fontSize: '20px', lineHeight: 1 }}>×</span>
                      </button>
                    </div>
                  </div>

                  {/* BODY */}
                  <div className="p-4">
                    {/* CURRENT MONTH OPTION */}
                    <div className="mb-4">
                      <div className="d-flex align-items-center mb-3">
                        <div className="rounded-circle d-flex align-items-center justify-content-center me-3" style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: '#39bdf1',
                          color: 'white'
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M2.56 11.332 3.1 9.73h1.984l.54 1.602h.718L4.444 6h-.696L1.85 11.332zm1.544-4.527L4.9 9.18H3.284l.8-2.375z" />
                            <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z" />
                          </svg>
                        </div>
                        <div>
                          <h6 className="mb-0 fw-bold">Current Month Report</h6>
                          <small className="text-muted">Download {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} data</small>
                        </div>
                      </div>
                      <button
                        className="btn w-100 py-3 fw-semibold"
                        onClick={downloadCurrentMonth}
                        style={{
                          backgroundColor: '#39bdf1',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#2da8d8';
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 4px 12px rgba(57, 189, 241, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#39bdf1';
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="me-2" viewBox="0 0 16 16" style={{ verticalAlign: 'middle' }}>
                          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
                          <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z" />
                        </svg>
                        Download Now
                      </button>
                    </div>

                    {/* DIVIDER */}
                    <div className="position-relative my-4">
                      <hr style={{ borderColor: '#e5e7eb' }} />
                      <span className="position-absolute top-50 start-50 translate-middle px-3 bg-white text-muted small fw-semibold">OR</span>
                    </div>

                    {/* CUSTOM DATE RANGE */}
                    <div>
                      <div className="d-flex align-items-center mb-3">
                        <div className="rounded-circle d-flex align-items-center justify-content-center me-3" style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: '#39bdf1',
                          color: 'white'
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M9 7a1 1 0 0 1 1-1h5v2h-5a1 1 0 0 1-1-1M1 9h4a1 1 0 0 1 0 2H1z" />
                            <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z" />
                          </svg>
                        </div>
                        <div>
                          <h6 className="mb-0 fw-bold">Custom Date Range</h6>
                          <small className="text-muted">Select specific date range</small>
                        </div>
                      </div>

                      <div className="row g-3 mb-3">
                        <div className="col-6">
                          <label className="form-label small fw-semibold text-muted mb-2">From Date</label>
                          <input
                            type="date"
                            className="form-control py-2"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            style={{ borderRadius: '10px', border: '2px solid #e5e7eb' }}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label small fw-semibold text-muted mb-2">To Date</label>
                          <input
                            type="date"
                            className="form-control py-2"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            style={{ borderRadius: '10px', border: '2px solid #e5e7eb' }}
                          />
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <button
                          className="btn flex-grow-1 py-2 fw-semibold"
                          onClick={downloadByDate}
                          style={{
                            backgroundColor: '#39bdf1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16" style={{ verticalAlign: 'middle' }}>
                            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
                            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z" />
                          </svg>
                          Download
                        </button>
                        <button
                          className="btn btn-outline-secondary py-2"
                          onClick={() => {
                            setFromDate("");
                            setToDate("");
                          }}
                          style={{ borderRadius: '10px', minWidth: '80px' }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ verticalAlign: 'middle' }}>
                            <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z" />
                            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

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
          className={`p-4 rounded-4 text-center ${isActive ? "shadow-lg" : "shadow-sm"
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
    <>
      {alert && <AlertModal message={alert.message} type={alert.type} onClose={closeAlert} />}
      <div className="container py-4">
        <h4 className="fw-bold mb-4 text-dark">
          Reports & Analytics
        </h4>

        {/* Stat Cards */}
        <div className="row">
          <StatCard label="Total Candidates" value={filteredStats.total} type="total" />
          <StatCard label="Pending" value={filteredStats.pending} type="pending" />
          <StatCard label="Interview Confirmed" value={filteredStats.confirmed} type="confirmed" />
          <StatCard label="Completed" value={filteredStats.completed} type="completed" />
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
              {filteredStatusOptions.map((status, i) => (
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
    </>
  );
}