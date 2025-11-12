import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface ApproversDashboardProps {
  context: WebPartContext;
  onBack: () => void;
  loggedInUser: any;
  isApprover: boolean;
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
}

export interface ITtlWebpartProps {
  context: WebPartContext
}


