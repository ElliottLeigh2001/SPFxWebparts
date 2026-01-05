import * as React from "react"
import { useState, useMemo, useEffect } from "react"
import styles from "./TtlWebpart.module.scss"
import { formatDate, getRequestStatusStyling } from "../../Helpers/HelperFunctions"
import { IDashboardComponentProps } from "./DashboardProps"
import { getApprovers } from '../../service/TTLService'

const ITEMS_PER_PAGE = 10

const DashboardComponent: React.FC<IDashboardComponentProps> = ({ onClick, requests, view, context }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchFilter, setSearchfilter] = useState('');
  const [sortBy, setSortBy] = useState<null | 'totalCost' | 'submissionDate'>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [teamCoachesMap, setTeamCoachesMap] = useState<Record<string, string>>({});

  const placeholder = view === 'myView' ? 'Search by title, project or team' : 'Search by title, project, requester or team'

  // Filter, sort and paginate requests
  const filteredRequests = useMemo(() => {
    const q = (searchFilter || '').trim().toLowerCase()
    if (!q) return requests.slice()

    // Filter requests based on search query
    return requests.filter((r) => {
      const title = (r.Title || '').toString().toLowerCase()
      const project = (r.Project || '').toString().toLowerCase()
      const requester = (r.Author?.Title || '').toString().toLowerCase()
      const team = (r.Team || '').toString().toLowerCase()

      // Check if any field includes the search query
      return (
        title.includes(q) ||
        project.includes(q) ||
        requester.includes(q) ||
        team.includes(q)
      )
    })
  }, [requests, searchFilter])

  // Sort filtered requests
  const sortedRequests = useMemo(() => {
    // Create a copy to avoid mutating original array
    const arr = filteredRequests.slice()
    if (!sortBy) return arr

    // Sort based on selected column and direction
    arr.sort((a: any, b: any) => {
      if (sortBy === 'totalCost') {
        const va = Number(a.TotalCost) || 0
        const vb = Number(b.TotalCost) || 0
        return sortDir === 'asc' ? va - vb : vb - va
      }

      // Sort by submission date
      if (sortBy === 'submissionDate') {
        const da = a.SubmissionDate ? new Date(a.SubmissionDate).getTime() : 0
        const db = b.SubmissionDate ? new Date(b.SubmissionDate).getTime() : 0
        return sortDir === 'asc' ? da - db : db - da
      }

      // Fallback (should not reach here)
      return 0
    })

    return arr
  }, [filteredRequests, sortBy, sortDir])

  // Load approvers and map approver id -> team coach title for display
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const approvers = await getApprovers(context);
        if (!mounted) return;
        const map: Record<string, string> = {};
        approvers.forEach(a => {
          if (a && a.Id != null) {
            map[String(a.Id)] = a.TeamCoach?.Title || '';
          }
        });
        setTeamCoachesMap(map);
      } catch (e) {
        console.error('Error loading approvers for team coaches', e);
      }
    }

    if (context) {
      load();
    }

    return () => { mounted = false }
  }, [context, requests])

  // Compute total pages based on filtered list
  const totalPages = Math.ceil(sortedRequests.length / ITEMS_PER_PAGE) || 1

  // Slice filtered+sorted data for the current page
  const currentRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return sortedRequests.slice(start, start + ITEMS_PER_PAGE)
  }, [sortedRequests, currentPage])

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // Handle sorting toggles
  const toggleSort = (column: 'totalCost' | 'submissionDate') => {
    // Toggle sorting direction or set new sort column
    if (sortBy === column) {
      // Cycle through asc -> desc -> no sort
      if (sortDir === 'asc') {
        setSortDir('desc');
      } else if (sortDir === 'desc') {
        // If direction is desc, the cycle repeats
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
    <div style={{width: '96%', justifySelf: 'center'}}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>
      <div className={`${styles.filterContainer} ${view === 'HR' ? styles.searchHR : ''}`}>
        <label style={{marginRight: '10px', fontSize: 'large'}}>Search: </label>
          <input
            className={styles.filterInput}
            type="text"
            value={searchFilter}
            placeholder={placeholder}
            onChange={(e) => {
              setSearchfilter(e.target.value)
              setCurrentPage(1)
            }}
          />
      </div>
      <div style={{height: "572px" }}>
        <div className={styles.tableContainer}>
          <div className={styles.tableWrapper}>
            <table className={styles.requestsTable}>
              <thead>
                <tr>
                  <th>Title</th>
                  {view !== "myView" && <th>Requester</th>}
                  {view === "HR" && <th>Approver</th>}
                  {view !== 'myView' && <th>Team Coach</th>}
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
                  {view !== 'HR' && (
                    <th>Team</th>
                  )}
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
                  {view === 'HR' && (
                    <th>Deadline Date</th>
                  )}
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
                      {view !== "myView" && <td>{request.Author?.Title || "-"}</td>}
                      {view === "HR" && <td>{request.ApproverID?.Title || "-"}</td>}
                      {view !== "myView" && <td>{request.ApproverID?.Id ? (teamCoachesMap[String(request.ApproverID.Id)] || "-") : "-"}</td>}
                      <td>€ {request.TotalCost || "-"}</td>
                      <td>{request.Project || "-"}</td>
                      {view !== 'HR' && (
                        <td>{request.Team || "-"}</td>
                      )}
                      <td>{formatDate(request.SubmissionDate)}</td>
                      {view === 'HR' && (
                        <td>{formatDate(request.DeadlineDate) || "-"}</td>
                      )}
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
                      (6 + (view !== 'myView' ? 1 : 0) + (view === 'HR' ? 1 : 0))
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
