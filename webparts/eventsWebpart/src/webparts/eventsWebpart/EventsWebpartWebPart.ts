import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import EventsWebpart from './components/EventsWebpart';
import { IEventsWebpartProps } from './EventsInterfaces';

export interface IEventsWebpartWebPartProps {
  description: string;
}


export default class EventsWebpartWebPart extends BaseClientSideWebPart<{}> {
  public render(): void {
    const element: React.ReactElement<IEventsWebpartProps> = React.createElement(
      EventsWebpart,
      { context: this.context }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }
}
