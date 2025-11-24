import { WebPartContext } from "@microsoft/sp-webpart-base";
import { UserRequestItem } from "../../Interfaces/TTLInterfaces";

export interface FormProps {
  context: WebPartContext
  onSave: (item: UserRequestItem) => void;
  onCancel?: () => void;
  initialData?: UserRequestItem;
  view?: string;
  returning?: boolean;
  travelRequest?: boolean;
  showCheckbox?: boolean;
}
