import { WebPartContext } from "@microsoft/sp-webpart-base";
import styles from "../components/Dashboard/TtlWebpart.module.scss";
import { IApprover } from "../Interfaces/TTLInterfaces";
import { getManager, loadUserProfile } from "../service/TTLService";

// Function to validate the cost of a request item
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

// Format dates to something more sane than mm/dd/yyyy (dd-mm-yyyy)
export const formatDate = (dateString: string | Date | undefined): string => {
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
      'Draft': styles.default,
      'Submitted': styles.default,
      'Resubmitted': styles.default,
      'Rejected': styles.rejected,
      'HR Processing': styles.default,
      'Approved': styles.approved,
      'Completed': styles.approved,
    };

    return statusMap[status] || styles.default;
};

// Function to calculate the yearly cost of a software license
export const calculateSoftwareLicenseCost = (data: any) => {
  let cost;
  let usersCount = 0;
  const u = data.UsersLicense;

  if (Array.isArray(u)) {
    if (u.length === 1 && typeof u[0] === 'string' && u[0].includes(',')) {
      // Single string with commas
      usersCount = u[0].split(',').map(s => s.trim()).filter(Boolean).length;
    } else {
      // Array of individual names
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

  // Different calculations for each combination of license type and amount of users in the license
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

// Attach URL handlers for dashboards: listens for popstate and checks URL on attach
export const attachUrlHandlers = (args: {
  viewName: string;
  requests: any[];
  selectedRequest: any;
  onRequestClick: (request: any, pushState?: boolean) => void;
  onBackClick?: (pushState?: boolean) => void;
}) => {
  const { viewName, requests, selectedRequest, onRequestClick, onBackClick } = args;

  const handleUrlChange = () => {
    const params = new URLSearchParams(window.location.search);
    const requestId = params.get("requestId");
    const view = params.get("view");

    // Sync UI state with URL
    if (view === viewName && requestId && requests.length > 0) {
      const request = requests.find((req: any) => req.ID === parseInt(requestId));
      if (request && (!selectedRequest || selectedRequest.ID !== request.ID)) {
        onRequestClick(request, false); // don't push state when reacting to a URL change
      }
    } else if (view === viewName && !requestId && selectedRequest) {
      // URL changed to have no requestId, but a request is selected locally
      if (onBackClick) onBackClick(false);
    }
  };

  // Run once immediately to sync UI with URL
  handleUrlChange();

  // Listen for back/forward navigation
  window.addEventListener("popstate", handleUrlChange);

  // Return cleanup function so callers can use this in a useEffect
  return () => window.removeEventListener("popstate", handleUrlChange);
};

// Centralized loader for request details so dashboards don't duplicate logic
export const loadRequestDetails = async (args: {
  context: any;
  request: any;
  getRequestItemsByRequestId: (context: any, id: number) => Promise<any[]>;
  setIsLoading: (v: boolean) => void;
  setError: (e: any) => void;
  setRequestItems: (items: any[]) => void;
  setSelectedRequest: (r: any) => void;
  pushState?: boolean;
  viewName?: string;
}) => {
  const { context, request, getRequestItemsByRequestId, setIsLoading, setError, setRequestItems, setSelectedRequest, pushState = true, viewName = 'requests' } = args;

  try {
    setIsLoading(true);
    setError(null);

    // Load items for the selected request
    const items = await getRequestItemsByRequestId(context, request.ID);
    setRequestItems(items);
    setSelectedRequest(request);

    // Update URL to match selection
    if (pushState) {
      window.history.pushState({}, "", `?view=${viewName}&requestId=${request.ID}`);
    }

  } catch (error: any) {
    console.error('Error loading request details:', error);
    if (error && (error as any).status === 404) {
      setError('This request no longer exists');
    } else {
      setError('Failed to load request details');
    }
    setRequestItems([]);
  } finally {
    setIsLoading(false);
  }
};

// Centralized back handler for dashboards
export const goBack = (args: {
  setSelectedRequest: (r: any) => void;
  setRequestItems: (items: any[]) => void;
  setError: (e: any) => void;
  pushState?: boolean;
  viewName?: string;
}) => {
  const { setSelectedRequest, setRequestItems, setError, pushState = true, viewName = 'requests' } = args;

  // Clear selection and items
  setSelectedRequest(null);
  setRequestItems([]);
  setError(null);

  // Update URL to reflect no selection
  if (pushState) {
    // Use replaceState so we don't add an extra history entry when closing details
    window.history.replaceState({}, "", `?view=${viewName}`);
  }
};

// Get user's team coach
export const getUserAndManager = async (approversList: IApprover[], context: WebPartContext) => {
  try {
    const user = await loadUserProfile(context);
    const manager = await getManager(context, user.managerAccount);
    
    // Find the manager in the approvers list
    const teamCoachRow = approversList.find(app => 
      app.TeamCoach?.Title === manager.name
    );
  
    // Set the team coach
    const teamCoach = ({
      id: teamCoachRow!.Id,
      title: teamCoachRow?.TeamCoach.Title!
    });
    
    // Filter teams and approvers for this team coach
    const teamsForCoach = approversList.filter(a => 
      a.TeamCoach?.Title === manager.name
    );
    
    // If there's only one team for this coach, auto-select it
    const singleTeam = teamsForCoach[0];
    const team = singleTeam.Team0;
    const approver = singleTeam.Id;

    return {teamCoach, team, approver}

  } catch (err) {
    console.error("Error getting user and manager:", err);
  }
};