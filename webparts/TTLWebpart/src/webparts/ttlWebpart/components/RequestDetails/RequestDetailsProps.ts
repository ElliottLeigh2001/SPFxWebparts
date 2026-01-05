import { WebPartContext } from "@microsoft/sp-webpart-base";
import { UserRequestItem, UserRequest } from "../../Interfaces/TTLInterfaces";

export interface IRequestItemsListProps {
  items: UserRequestItem[];
  onEdit: (item: UserRequestItem) => void;
  onDelete: (item: UserRequestItem) => void;
  onAdd: () => void;
  showActions: boolean;
  request: UserRequest;
  view: "approvers" | "myView" | "HR" | "director" | "deliveryDirector";
  context?: WebPartContext;
  onDocumentUploaded?: () => void;
}

export interface IRequestDetailsProps {
  request: UserRequest;
  items: UserRequestItem[];
  view: 'myView' | 'approvers' | 'HR' | 'director' | 'deliveryDirector';
  HRTab?: string;
  onBack: () => void;
  onUpdate: () => void;
  error?: string | null;
  context: WebPartContext;
  isCEO?: boolean;
  isApprover?: boolean;
  isTeamCoach?: boolean;
}

export interface IEditRequestFormProps {
  context: WebPartContext;
  request: UserRequest;
  onSave: (updatedRequest: UserRequest) => void;
  onCancel: () => void;
}

export interface ICommentsSectionProps {
  requestId: number;
  context: WebPartContext;
}
