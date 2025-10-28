import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface IEventsWebpartProps {
  context: WebPartContext;
}

export interface EventItem {
  Id: number | undefined;
  Title: string;
  Image0: string;
  StartTime: string;
  EndTime: string;
  FoodEvent: boolean;
  Beschrijving: string;
  Location: string;
  SignupDeadline: string;
  PlusOne: boolean;
  EventTypes: string;
  Signinlink?: string;
  Carpooling: boolean;
  DepartureFrom: string;
}