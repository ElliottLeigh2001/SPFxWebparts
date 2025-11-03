import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import TtlWebpart from './components/Dashboard/TtlDashboard';
import { ITtlWebpartProps } from './components/Dashboard/ITtlWebpartProps';

export interface ITtlWebpartWebPartProps {
  description: string;
}

export default class TtlWebpartWebPart extends BaseClientSideWebPart<ITtlWebpartWebPartProps> {
  public render(): void {
    const element: React.ReactElement<ITtlWebpartProps> = React.createElement(
      TtlWebpart,
      { context: this.context }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }
}
