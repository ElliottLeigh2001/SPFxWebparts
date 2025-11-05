import styles from "../components/Dashboard/TtlWebpart.module.scss";

export const validateCost = (cost: any): { isValid: boolean; value: number; error: string } => {
  let costValue: number;

  if (typeof cost === 'number') {
    costValue = cost;
  } else if (typeof cost === 'string') {
    const trimmedCost = cost.trim();

    if (!/^[-]?\d+(\.\d+)?$/.test(trimmedCost)) {
      return { isValid: false, value: 0, error: 'Cost must contain only numbers and an optional decimal point' };
    }

    costValue = parseFloat(trimmedCost);
  } else {
    return { isValid: false, value: 0, error: 'Cost must be a number or a numeric string' };
  }

  if (isNaN(costValue)) {
    return { isValid: false, value: 0, error: 'Cost must be a valid number' };
  }

  if (costValue < 0) {
    return { isValid: false, value: costValue, error: 'Cost cannot be negative' };
  }

  return { isValid: true, value: costValue, error: '' };
};


export const validateLink = (link: any): any => {
  const  linkRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
  return link.match(linkRegex)
}

export const formatDate = (dateString: string | Date): string => {
  if (!dateString) return "-";

  const dateObj = typeof dateString === "string" ? new Date(dateString) : dateString;

  if (isNaN(dateObj.getTime())) return "-";

  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();

  return `${day}-${month}-${year}`;
};

export const formatEditingDate = (dateString: string | undefined): string => {
  if (!dateString) return "-";

  const dateObj = typeof dateString === "string" ? new Date(dateString) : dateString;

  if (isNaN(dateObj.getTime())) return "-";

  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();

  return `${year}-${month}-${day}`;
};

export const getRequestStatusStyling = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'Saved': styles.saved,
      'Unsaved': styles.saved,
      'Sent for approval': styles.sentForApproval,
      'In Process By HR': styles.inProcessByHR,
      'Needs reapproval': styles.needsReapproval,
      'Processed by HR': styles.approved,
      'Declined': styles.declined,
      'Booking': styles.booking,
      'Approved': styles.approved,
      'Completed': styles.approved,
    };

    return statusMap[status] || styles.inProcessByHR;
};