import { WebPartContext } from "@microsoft/sp-webpart-base";
import { Approver } from "../../Interfaces/TTLInterfaces";

export interface NewRequestProps {
  context: WebPartContext;
  onSave: () => void;
  onCancel: () => void;
  approvers: Approver[];
  loggedInUser: any;
}