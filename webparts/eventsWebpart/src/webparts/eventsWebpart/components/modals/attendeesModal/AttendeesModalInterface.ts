import { EventItem } from "../../../EventsInterfaces";

export interface AttendeesModalProps {
    attendees: any[],
    onClose: () => void;
    event: EventItem;
}