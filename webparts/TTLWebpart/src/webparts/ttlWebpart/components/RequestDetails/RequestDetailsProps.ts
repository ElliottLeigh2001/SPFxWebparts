import { WebPartContext } from "@microsoft/sp-webpart-base";
import { UserRequestItem, UserRequest } from "../../Interfaces/TTLInterfaces";

export interface RequestItemsListProps {
  items: UserRequestItem[];
  onEdit: (item: UserRequestItem) => void;
  onDelete: (item: UserRequestItem) => void;
  onAdd: () => void;
  showActions: boolean;
  request: UserRequest;
  view: "approvers" | "myView" | "HR" | "director";
  context?: WebPartContext;
  onDocumentUploaded?: () => void;
}

export interface RequestDetailsProps {
  request: UserRequest;
  items: UserRequestItem[];
  view: 'myView' | 'approvers' | 'HR' | 'director';
  HRTab?: string;
  onBack: () => void;
  onUpdate: () => void;
  error?: string | null;
  context: WebPartContext;
  isCEO?: boolean;
}

export interface EditRequestFormProps {
  context: WebPartContext;
  request: UserRequest;
  onSave: (updatedRequest: UserRequest) => void;
  onCancel: () => void;
}

export interface CommentsSectionProps {
  requestId: number;
  context: WebPartContext;
}
