import { WebPartContext } from "@microsoft/sp-webpart-base";
import { IUserRequestItem } from "../../Interfaces/TTLInterfaces";

export interface IFormProps {
  context: WebPartContext
  onSave: (item: IUserRequestItem) => void;
  onCancel?: () => void;
  initialData?: IUserRequestItem;
  view?: string;
  returning?: boolean;
  travelRequest?: boolean;
  showCheckbox?: boolean;
}
