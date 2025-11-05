import * as React from "react"
import { useState, useMemo } from "react"
import styles from "./TtlWebpart.module.scss"
import { formatDate, getRequestStatusStyling } from "../../Helpers/HelperFunctions"

interface DashboardProps {
  onClick: (request: any, pushState: any) => void;
  requests: any[];
  view: "approvers" | "myView" | "HR" | "director";
}

const ITEMS_PER_PAGE = 10

const DashboardComponent: React.FC<DashboardProps> = ({ onClick, requests, view }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchFilter, setSearchfilter] = useState('');
  const [sortBy, setSortBy] = useState<null | 'totalCost' | 'submissionDate'>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // Filter, sort and paginate requests
  const filteredRequests = useMemo(() => {
    const q = (searchFilter || '').trim().toLowerCase()
    if (!q) return requests.slice()

    return requests.filter((r) => {
      const title = (r.Title || '').toString().toLowerCase()
      const project = (r.Project || '').toString().toLowerCase()
      const requester = (r.Author?.Title || '').toString().toLowerCase()
      const team = (r.TeamID?.Title || '').toString().toLowerCase()

      return (
        title.includes(q) ||
        project.includes(q) ||
        requester.includes(q) ||
        team.includes(q)
      )
    })
  }, [requests, searchFilter])

  const sortedRequests = useMemo(() => {
    const arr = filteredRequests.slice()
    if (!sortBy) return arr

    arr.sort((a: any, b: any) => {
      if (sortBy === 'totalCost') {
        const va = Number(a.TotalCost) || 0
        const vb = Number(b.TotalCost) || 0
        return sortDir === 'asc' ? va - vb : vb - va
      }

      if (sortBy === 'submissionDate') {
        const da = a.SubmissionDate ? new Date(a.SubmissionDate).getTime() : 0
        const db = b.SubmissionDate ? new Date(b.SubmissionDate).getTime() : 0
        return sortDir === 'asc' ? da - db : db - da
      }

      return 0
    })

    return arr
  }, [filteredRequests, sortBy, sortDir])

  // Compute total pages based on filtered list
  const totalPages = Math.ceil(sortedRequests.length / ITEMS_PER_PAGE) || 1

  // Slice filtered+sorted data for the current page
  const currentRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return sortedRequests.slice(start, start + ITEMS_PER_PAGE)
  }, [sortedRequests, currentPage])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const toggleSort = (column: 'totalCost' | 'submissionDate') => {
    if (sortBy === column) {
      if (sortDir === 'asc') {
        setSortDir('desc');
      } else if (sortDir === 'desc') {
        // remove sorting entirely
        setSortBy(null);
        setSortDir('asc');
      }
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  return (
    <div>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>
      <div className={styles.filterContainer}>
        <label style={{marginRight: '10px', fontSize: 'large'}}>Filter: </label>
          <input
            className={styles.filterInput}
            type="text"
            value={searchFilter}
            placeholder="Search by title, project, requester or team"
            onChange={(e) => {
              setSearchfilter(e.target.value)
              setCurrentPage(1)
            }}
          />
      </div>
      <div style={{ height: "572px" }}>
        <div className={styles.tableContainer}>
          <div className={styles.tableWrapper}>
            <table className={styles.requestsTable}>
              <thead>
                <tr>
                  <th>Title</th>
                  {view !== "myView" && <th>Requester</th>}
                  {view === "HR" && <th>Approver</th>}
                  <th
                    className={`${styles.colTotalCost} ${styles.sortable}`}
                    onClick={() => toggleSort('totalCost')}
                    role="button"
                    aria-label="Sort by total cost"
                  >
                    <span> Total Cost</span>
                      <i
                        className={`fa ${
                          sortBy === 'totalCost'
                            ? sortDir === 'asc'
                              ? 'fa-sort-up'
                              : 'fa-sort-down'
                            : 'fa-sort'
                        } ${styles.sortIcon}`}
                      />
                  </th>
                  <th>Project</th>
                  <th>Team</th>
                  <th
                    className={`${styles.colDate} ${styles.sortable}`}
                    onClick={() => toggleSort('submissionDate')}
                    role="button"
                    aria-label="Sort by submission date"
                  >
                    <span> Submission Date</span>
                      <i
                        className={`fa ${
                          sortBy === 'submissionDate'
                            ? sortDir === 'asc'
                              ? 'fa-sort-up'
                              : 'fa-sort-down'
                            : 'fa-sort'
                        } ${styles.sortIcon}`}
                      />

                  </th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentRequests.length > 0 ? (
                  currentRequests.map((request) => (
                    <tr
                      key={request.ID}
                      className={styles.requestRow}
                      onClick={() => onClick(request, true)}
                    >
                      <td>{request.Title}</td>
                      {view !== "myView" && <td>{request.Author?.Title || "/"}</td>}
                      {view === "HR" && <td>{request.ApproverID?.Title || "/"}</td>}
                      <td>€ {request.TotalCost || "0"}</td>
                      <td>{request.Project || "/"}</td>
                      <td>{request.TeamID?.Title || "No team found"}</td>
                      <td>{formatDate(request.SubmissionDate)}</td>
                      <td>
                        <span
                          className={`${styles.status} ${getRequestStatusStyling(
                            request.RequestStatus
                          )}`}
                        >
                          {request.RequestStatus || "Unknown"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={
                      // calculate columns count to set correct colspan
                      (1 /* Title */ + (view !== 'myView' ? 1 : 0) + (view === 'HR' ? 1 : 0) + 1 /* Total Cost */ + 1 /* Project */ + 1 /* Team */ + 1 /* Submission Date */ + 1 /* Status */)
                    } className={styles.noData}>
                      No requests to show.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageButton}
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => {
              return (
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1
              )
            })
            .reduce((acc: (number | string)[], page, index, filtered) => {
              if (index > 0 && page - (filtered[index - 1] as number) > 1) {
                acc.push('…')
              }
              acc.push(page)
              return acc
            }, [])
            .map((page, i) =>
              page === '…' ? (
                <span key={`ellipsis-${i}`}>
                  …
                </span>
              ) : (
                <button
                  key={page}
                  className={`${styles.pageNumber} ${
                    currentPage === page ? styles.activePage : ''
                  }`}
                  onClick={() => handlePageChange(page as number)}
                >
                  {page}
                </button>
              )
            )}

          <button
            className={styles.pageButton}
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}

    </div>
  )
}

export default DashboardComponent
