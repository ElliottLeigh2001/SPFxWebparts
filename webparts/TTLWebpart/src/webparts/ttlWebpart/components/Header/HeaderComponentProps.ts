import { IApprover } from '../../Interfaces/TTLInterfaces';

export interface IHeaderProps {
    view?: string;
    isHR?: boolean;
    isCEO?: boolean;
    isDeliveryDirector?: boolean;
    allApprovers?: IApprover[];
    loggedInUser?: any;
    onViewClick?: (view: string) => void;
}