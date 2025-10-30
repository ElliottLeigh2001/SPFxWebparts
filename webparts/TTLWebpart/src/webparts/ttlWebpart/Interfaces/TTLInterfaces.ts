export interface UserRequest {
    ID: number;
    Title: string;
    TotalCost: string;
    OData__Comments: string;
    RequestItemID: {
        Id: number;
    }[];
    Goal: string;
    Project: string;
    RequestStatus: string;
    TeamID?: {
        Id?: number;
        Title?: string;
    }
    ApproverID?: {
        Id?: number;
        Title?: string;
        EMail?: string;
    }
    Author?: {
        Id?: number;
        Title?: string;
        EMail?: string;
    };
}

export interface UserRequestItem {
    ID?: number;
    Title?: string;
    Provider?: string;
    Location?: string;
    Link?: string;
    StartDate?: string;
    OData__EndDate?: string;
    RequestType?: string;
    Cost?: string;
    Licensing?: string;
    LicenseType?: string;
    UsersLicense?: any[];
    Attachments?: any
    Processed?: boolean;
    ChangedByHR?: boolean;
}

export interface Approver {
    Id: number;
    TeamMember: {
        Id?: number;
        Title?: string;
        EMail?: string;
    }
    BackUp: {
        Id?: number;
        Title?: string;
        EMail: string;
    }
}

export interface Team {
    Id: number
    Title: string;
    Coach: {
        Id: number;
        Title: string;
    }
}
