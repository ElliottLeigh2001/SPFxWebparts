import { Approver } from '../../Interfaces/TTLInterfaces';

export interface HeaderProps {
    view?: string;
    isHR?: boolean;
    isCEO?: boolean;
    allApprovers?: Approver[];
    loggedInUser?: any;
    onViewClick?: (view: string) => void;
}