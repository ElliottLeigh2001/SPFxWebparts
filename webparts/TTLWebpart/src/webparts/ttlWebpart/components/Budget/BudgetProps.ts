import { WebPartContext } from "@microsoft/sp-webpart-base";
import { Budget, UserRequest } from "../../Interfaces/TTLInterfaces";

export interface IBudgetProps {
  context: WebPartContext;
  budget: Budget;
  onClose: () => void;
}

export interface IRequestsByRequester {
  requester: string;
  totalCost: number;
  requests: UserRequest[];
}


export interface IDonutChartProps { 
  total: number; 
  available: number; 
  size?: number; 
  strokeWidth?: number; 
  label?: string; 
} 

