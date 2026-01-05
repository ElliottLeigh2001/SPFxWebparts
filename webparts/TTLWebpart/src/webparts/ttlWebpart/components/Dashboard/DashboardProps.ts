import { WebPartContext } from "@microsoft/sp-webpart-base";
import { IApprover } from "../../Interfaces/TTLInterfaces";

export interface IApproversDashboardProps {
  context: WebPartContext;
  onBack: () => void;
  loggedInUser: any;
  isApprover: boolean;
  isTeamCoach: boolean;
}

export interface IDashboardComponentProps {
  onClick: (request: any, pushState: any) => void;
  requests: any[];
  view: "approvers" | "myView" | "HR" | "director" | "deliveryDirector";
  context: WebPartContext;
}

export interface IDirectorDashboardProps {
  context: WebPartContext;
  onBack: () => void;
  loggedInUser: any;
  isCEO: boolean;
}

export interface IDeliveryDirectorDashboardProps {
  context: WebPartContext;
  onBack: () => void;
  isDeliveryDirector: boolean;
}

export interface IHRDashboardProps {
  context: WebPartContext;
  onBack: () => void;
  isHR: boolean;
  isCEO: boolean;
  allApprovers?: IApprover[];
  onViewClick?: (view: string) => void;
}

export interface ITtlWebpartProps {
  context: WebPartContext
}


