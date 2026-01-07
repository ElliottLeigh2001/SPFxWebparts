import { WebPartContext } from "@microsoft/sp-webpart-base";
import { IBudget, IUserRequest } from "../../Interfaces/TTLInterfaces";

export interface IBudgetProps {
  context: WebPartContext;
  budget: IBudget;
  onClose: () => void;
}

export interface IRequestsByRequester {
  requester: string;
  totalCost: number;
  requests: IUserRequest[];
}

export interface IDonutChartProps { 
  total: number; 
  available: number; 
  size?: number; 
  strokeWidth?: number; 
  label?: string; 
} 

export interface IBudgetSharingModalProps {
  context: WebPartContext;
  isOpen: boolean;
  totalCost?: number;
  onSelectBudget: (budget: IBudget) => void;
  onCancel: () => void;
}
