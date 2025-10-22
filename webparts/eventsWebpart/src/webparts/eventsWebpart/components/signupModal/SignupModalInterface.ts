import { EventItem } from "../../EventsInterfaces";

export interface SignupModalProps {
  event: EventItem;
  onSubmit: (formData: any) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}