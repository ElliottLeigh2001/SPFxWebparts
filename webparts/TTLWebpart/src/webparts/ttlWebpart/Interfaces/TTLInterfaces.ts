export interface UserRequest {
    ID: number;
    Title: string;
    TotalCost: string;
    SubmissionDate?: Date;
    ApprovedByCEO?: boolean;
    DeadlineDate?: Date;
    TeamCoachApproval?: string;
    RequestItemID: {
        Id: number;
    }[];
    Goal: string;
    Project: string;
    RequestStatus: string;
    CommentID?: {
        Id?: number;
        Title?: string;
        Body?: string;
        Author?: {
            Id?: number;
            Title?: string;
            EMail?: string;
        };
        Created?: string;
    }[];
    Team: string;
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
    DocumentID?: {
        Id?: number;
        url?: string;
    }
}

export interface TTLDocument {
    ID?: number;
    Title?: string;
    FileUrl?: string;
}

export interface Approver {
    Id: number;
    TeamCoach: {
        Id?: number;
        Title?: string;
        EMail?: string;
    }
    PracticeLead: {
        Id?: number;
        Title?: string;
        EMail?: string;
    }
    DeliveryDirector: {
        Id?: number;
        Title?: string;
        EMail?: string;
    }
    CEO: {
        Id?: number;
        Title?: string;
        EMail?: string;
    }
    Team0?: string;
}

export interface Budget {
    ID: number;
    Title: string;
    TeamCoach: {
        Id?: number;
        Title?: string;
        EMail?: string;
    }
    Team: string;
    Budget: number;
    Availablebudget: number;
    Year: string;
}
