import { WebPartContext } from "@microsoft/sp-webpart-base";
import { IApprover } from "../../Interfaces/TTLInterfaces";

export interface INewRequestProps {
  context: WebPartContext;
  onSave: () => void;
  onCancel: () => void;
  approvers: IApprover[];
  loggedInUser: any;
}