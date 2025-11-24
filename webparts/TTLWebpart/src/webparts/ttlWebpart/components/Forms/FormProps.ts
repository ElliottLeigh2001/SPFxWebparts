import { WebPartContext } from "@microsoft/sp-webpart-base";
import { UserRequestItem } from "../../Interfaces/TTLInterfaces";

export interface FormProps {
  context: WebPartContext
  onSave: (item: UserRequestItem) => void;
  onCancel?: () => void;
  initialData?: UserRequestItem;
  view?: string;
  returning?: boolean;
  // Optional callbacks for chained flows (e.g., training -> travel -> accommodation)
  onRequestTravel?: (item: UserRequestItem) => void;
  onRequestNext?: (item: UserRequestItem, options?: any) => void;
}
