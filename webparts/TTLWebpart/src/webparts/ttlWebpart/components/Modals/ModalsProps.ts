import { WebPartContext } from "@microsoft/sp-webpart-base";
import { UserRequestItem } from "../../Interfaces/TTLInterfaces";

export interface AddItemModalProps {
  context: WebPartContext;
  isOpen: boolean;
  isUpdating: boolean;
  onSave: (item: UserRequestItem) => Promise<void>;
  onCancel: () => void;
}

export type ActionType = 'save' | 'send' | 'discard' | 'approve' | 'reapprove' | 'deny' | 'completed';

export const titles: Record<ActionType, string> = {
  save: 'Confirm Save',
  send: 'Confirm Send',
  discard: 'Confirm Discard',
  approve: 'Confirm Approval',
  reapprove: 'Confirm Reapprove',
  deny: 'Confirm Denial',
  completed: 'Confirm HR Processing'
};

export const messages: Record<ActionType, string> = {
  save: 'Are you sure you want to save this request? You still can edit it later but it will not be Submitted.',
  send: 'Are you sure you want to send this request for approval? This will notify approvers and you will not be able to edit this request.',
  discard: 'Are you sure you want to discard this request? This cannot be undone.',
  approve: 'Are you sure you want to approve this request?',
  reapprove: 'Are you sure you want to send this request for reapproval?',
  deny: 'Are you sure you want to deny this request?',
  completed: 'Are you sure you want to mark this request as booked?'
};

export interface ConfirmActionDialogProps {
  isOpen: boolean;
  action: ActionType | null;
  isProcessing?: boolean;
  onCancel: () => void;
  onConfirm: (comment?: string) => void;
}

export interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  isDeleting: boolean;
  itemName?: string | null;
  onCancel: () => void;
  onConfirmItemDelete: () => void;
  onConfirmRequestDelete: () => void;
}

export interface EditItemModalProps {
  context: WebPartContext;
  activeForm: 'software'|'training'|'travel'|'accommodation'|null;
  activeFormName: 'software'|'training'|'travel'|'accommodation'|null;
  editingItem?: UserRequestItem | undefined;
  isUpdating: boolean;
  view: string;
  onSave: (item: UserRequestItem) => Promise<void>;
  onCancel: () => void;
}

