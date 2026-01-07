import { WebPartContext } from "@microsoft/sp-webpart-base";
import { IUserRequestItem, IUserRequest } from "../../Interfaces/TTLInterfaces";

export interface IRequestItemsListProps {
  items: IUserRequestItem[];
  onEdit: (item: IUserRequestItem) => void;
  onDelete: (item: IUserRequestItem) => void;
  onAdd: () => void;
  showActions: boolean;
  request: IUserRequest;
  view: "approvers" | "myView" | "HR" | "director" | "deliveryDirector";
  context?: WebPartContext;
  onDocumentUploaded?: () => void;
}

export interface IRequestDetailsProps {
  request: IUserRequest;
  items: IUserRequestItem[];
  view: 'myView' | 'approvers' | 'HR' | 'director' | 'deliveryDirector';
  HRTab?: string;
  onBack: () => void;
  onUpdate: () => void;
  error?: string | null;
  context: WebPartContext;
  isCEO?: boolean;
  isApprover?: boolean;
  isTeamCoach?: boolean;
  totalBudget?: number;
  isFromBudgetSharing?: boolean;
}

export interface IEditRequestFormProps {
  context: WebPartContext;
  request: IUserRequest;
  onSave: (updatedRequest: IUserRequest) => void;
  onCancel: () => void;
}

export interface ICommentsSectionProps {
  requestId: number;
  context: WebPartContext;
}
