import styles from "../components/Dashboard/TtlWebpart.module.scss";

export const validateCost = (cost: any): { isValid: boolean; value: number; error: string } => {
  let costValue: number;

  if (typeof cost === 'number') {
    costValue = cost;
  } else if (typeof cost === 'string') {
    const trimmedCost = cost.trim();

    // Only allow numbers and decimal points
    if (!/^[-]?\d+(\.\d+)?$/.test(trimmedCost)) {
      return { isValid: false, value: 0, error: 'Cost must contain only numbers and an optional decimal point' };
    }
    // Convert to float
    costValue = parseFloat(trimmedCost);
  } else {
    return { isValid: false, value: 0, error: 'Cost must be a number or a numeric string' };
  }

  // Error handling
  if (isNaN(costValue)) {
    return { isValid: false, value: 0, error: 'Cost must be a valid number' };
  }

  if (costValue < 0) {
    return { isValid: false, value: costValue, error: 'Cost cannot be negative' };
  }

  return { isValid: true, value: costValue, error: '' };
};

// Check if links are valid (start with https://www. etc.)
export const validateLink = (link: any): any => {
  const  linkRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
  return link.match(linkRegex)
}

// Format dates to something more sane than mm/dd/yyyy
export const formatDate = (dateString: string | Date): string => {
  if (!dateString) return "-";

  const dateObj = typeof dateString === "string" ? new Date(dateString) : dateString;

  if (isNaN(dateObj.getTime())) return "-";

  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();

  return `${day}-${month}-${year}`;
};

// For editing items, another format is required (year-month-day)
export const formatEditingDate = (dateString: string | undefined): string => {
  if (!dateString) return "-";

  const dateObj = typeof dateString === "string" ? new Date(dateString) : dateString;

  if (isNaN(dateObj.getTime())) return "-";

  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();

  return `${year}-${month}-${day}`;
};

// Show statuses as different colours
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

export const calculateSoftwareLicenseCost = (data: any) => {
  let cost;
  let usersCount = 0;
  const u = data.UsersLicense;

  if (Array.isArray(u)) {
    if (u.length === 1 && typeof u[0] === 'string' && u[0].includes(',')) {
      // old format: single string with commas
      usersCount = u[0].split(',').map(s => s.trim()).filter(Boolean).length;
    } else {
      // new format: array of individual names
      usersCount = u.length;
    }
  } else if (typeof u === 'string') {
    usersCount = u.split(',').map(s => s.trim()).filter(Boolean).length;
  } else if (u && typeof u === 'object' && Array.isArray(u.results)) {
    // SharePoint People Picker format
    usersCount = u.results.length;
  } else {
    usersCount = 0;
  }

  switch (`${data.LicenseType}_${data.Licensing}`) {
    case 'Group_Monthly':
      cost = data.Cost * 12;
      break;
    case 'Individual_Monthly':
      cost = usersCount * data.Cost * 12;
      break;
    case 'Group_Yearly':
      cost = data.Cost;
      break;
    case 'Individual_Yearly':
      cost = usersCount * data.Cost;
      break;
    case 'Group_One-time':
      cost = data.Cost;
      break;
    case 'Individual_One-time':
      cost = usersCount * data.Cost;
      break;
    default:
      cost = 0;
  }

  return cost;
}
