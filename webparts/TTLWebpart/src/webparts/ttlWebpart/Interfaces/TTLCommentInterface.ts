export interface TTLComment {
    ID?: number;
    Title: string;
    Body: string;
    Author?: {
        Id?: number;
        Title?: string;
        EMail?: string;
    };
    Created?: string;
    RequestID?: {
        Id: number;
    }
}