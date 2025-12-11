import { Approver } from '../../Interfaces/TTLInterfaces';

export interface HeaderProps {
    view?: string;
    isHR?: boolean;
    isCEO?: boolean;
    isDeliveryDirector?: boolean;
    allApprovers?: Approver[];
    loggedInUser?: any;
    onViewClick?: (view: string) => void;
}