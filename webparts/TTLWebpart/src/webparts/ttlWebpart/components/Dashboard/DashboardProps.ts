import { WebPartContext } from "@microsoft/sp-webpart-base";
import { Approver } from "../../Interfaces/TTLInterfaces";

export interface ApproversDashboardProps {
  context: WebPartContext;
  onBack: () => void;
  loggedInUser: any;
  isApprover: boolean;
  isTeamCoach: boolean;
}

export interface DashboardComponentProps {
  onClick: (request: any, pushState: any) => void;
  requests: any[];
  view: "approvers" | "myView" | "HR" | "director";
}

export interface DirectorDashboardProps {
  context: WebPartContext;
  onBack: () => void;
  loggedInUser: any;
  isCEO: boolean;
}

export interface HRDashboardProps {
  context: WebPartContext;
  onBack: () => void;
  isHR: boolean;
  isCEO: boolean;
  allApprovers?: Approver[];
  loggedInUser?: any;
  onViewClick?: (view: string) => void;
}

export interface ITtlWebpartProps {
  context: WebPartContext
}


