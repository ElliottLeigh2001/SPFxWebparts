import * as React from "react"
import { useState, useMemo } from "react"
import styles from "./TtlWebpart.module.scss"
import { formatDate, getRequestStatusStyling } from "../../Helpers/HelperFunctions"

interface DashboardProps {
  onClick: (request: any, pushState: any) => void
  requests: any[]
  view: "approvers" | "myView" | "HR"
}

const ITEMS_PER_PAGE = 10

const DashboardComponent: React.FC<DashboardProps> = ({
  onClick,
  requests,
  view,
}) => {
  const [currentPage, setCurrentPage] = useState(1)

  // Compute total pages
  const totalPages = Math.ceil(requests.length / ITEMS_PER_PAGE)

  // Slice data for the current page
  const currentRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return requests.slice(start, start + ITEMS_PER_PAGE)
  }, [requests, currentPage])

  // Change page handler
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <div>

    <div className={styles.tableContainer}>
      <table className={styles.requestsTable}>
        <thead>
          <tr>
            <th>Title</th>
            {view !== "myView" && <th>Requester</th>}
            {view === 'HR' && <th>Approver</th>}
            <th>Total Cost</th>
            <th>Project</th>
            <th>Team</th>
            <th>Submission Date</th>
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
                {view !== "myView" && (
                  <td>{request.Author?.Title || "/"}</td>
                )}
                {view === 'HR' && (
                  <td>{request.ApproverID?.Title || '/'}</td>
                )}
                <td>€ {request.TotalCost || "0"}</td>
                <td>{request.Project || "/"}</td>
                <td>{request.TeamID?.Title || "No team found"}</td>
                <td>{formatDate(request.SubmissionDate)}</td>
                <td>
                  <span
                    className={`${styles.status} ${getRequestStatusStyling(request.RequestStatus)}`}
                  >
                    {request.RequestStatus || "Unknown"}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className={styles.noData}>
                No requests to approve. Check back later.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageButton}
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`${styles.pageNumber} ${
                currentPage === i + 1 ? styles.activePage : ""
              }`}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}

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
