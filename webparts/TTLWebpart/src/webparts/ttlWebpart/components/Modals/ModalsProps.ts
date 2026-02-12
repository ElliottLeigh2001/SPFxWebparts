import { WebPartContext } from "@microsoft/sp-webpart-base";
import { IUserRequestItem } from "../../Interfaces/TTLInterfaces";

export interface IAddItemModalProps {
  context: WebPartContext;
  isOpen: boolean;
  onSave: (item: IUserRequestItem) => Promise<void>;
  onCancel: () => void;
}

export type ActionType = 'save' | 'send' | 'discard' | 'approve' | 'reapprove' | 'deny' | 'completed' | 'confirmSharing' | 'denySharing' | 'teamCoachApprove' | 'teamCoachDeny';

export const titles: Record<ActionType, string> = {
  save: 'Confirm Save',
  send: 'Confirm Send',
  discard: 'Confirm Discard',
  approve: 'Confirm Approval',
  reapprove: 'Confirm Reapprove',
  deny: 'Confirm Denial',
  completed: 'Confirm HR Processing',
  confirmSharing: 'Confirm Budget Sharing',
  denySharing: 'Deny Budget Sharing',
  teamCoachApprove: 'Confirm Approval',
  teamCoachDeny: 'Confirm Denial',
};

export const messages: Record<ActionType, string> = {
  save: 'Are you sure you want to save this request as a draft? You still can edit it later but it will not be sent for approval.',
  send: 'Are you sure you want to send this request for approval? This will notify approvers and you will not be able to edit this request.',
  discard: 'Are you sure you want to discard this request? This cannot be undone.',
  approve: 'Are you sure you want to approve this request?',
  reapprove: 'Are you sure you want to send this request for reapproval?',
  deny: 'Are you sure you want to deny this request?',
  completed: 'Are you sure you want to mark this request as completed?',
  confirmSharing: 'Are you sure you want to confirm this budget sharing request?',
  denySharing: 'Are you sure you want to deny this budget sharing request?',
  teamCoachApprove: 'Are you sure you want to approve this request? The practice lead will be informed of your decision.',
  teamCoachDeny: 'Are you sure you want to deny this request? The practice lead will be informed, but can still overrule your decision.',
};

export interface IConfirmActionModalProps {
  isOpen: boolean;
  action: ActionType | null;
  isProcessing?: boolean;
  onCancel: () => void;
  onConfirm: (comment?: string) => void;
}

export interface IConfirmDeleteModalProps {
  isOpen: boolean;
  isDeleting: boolean;
  itemName?: string | null;
  onCancel: () => void;
  onConfirmItemDelete: () => void;
  onConfirmRequestDelete: () => void;
}

export interface IEditItemModalProps {
  context: WebPartContext;
  activeForm: 'software'|'training'|'travel'|'accommodation'|null;
  activeFormName: 'software'|'training'|'travel'|'accommodation'|null;
  editingItem?: IUserRequestItem | undefined;
  isUpdating: boolean;
  view: string;
  onSave: (item: IUserRequestItem) => Promise<void>;
  onCancel: () => void;
}


