export interface UserRequest {
    ID: number;
    Title: string;
    TotalCost: string;
    RequestItemID: {
        Id: number;
    }[];
    Goal: string;
    Project: string;
    Status: string;
    TeamID: {
        Id: number;
    }
    Author: {
        Id: number;
    };
}

export interface UserRequestItem {
    ID: number;
    Title: string;
    Provider: string;
    Location: string;
    Link: string;
    StartDate: string;
    EndDate: string;
    RequestType: string;
    Cost: string;
    Licensing: string;
    LicenseType: string;
    UsersLicense: string;
    Processed: string;
    ChangedByHR: boolean;
}