import { Approver } from '../../Interfaces/TTLInterfaces';

export interface IHeaderProps {
    view?: string;
    isHR?: boolean;
    isCEO?: boolean;
    isDeliveryDirector?: boolean;
    allApprovers?: Approver[];
    loggedInUser?: any;
    onViewClick?: (view: string) => void;
}