declare module 'react-plotly.js' {
  import { Component } from 'react';

  export interface PlotProps {
    data: any[];
    layout?: any;
    config?: any;
    style?: React.CSSProperties;
    className?: string;
    [key: string]: any;
  }

  export default class Plot extends Component<PlotProps> {}
}