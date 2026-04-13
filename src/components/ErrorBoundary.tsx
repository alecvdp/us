"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

type Props = {
  children: ReactNode;
  widgetName: string;
};

type State = {
  hasError: boolean;
};

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(`[${this.props.widgetName}] Error:`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", padding: "1rem" }}>
          <AlertTriangle size={18} />
          <span>{this.props.widgetName} failed to load.</span>
        </div>
      );
    }

    return this.props.children;
  }
}
