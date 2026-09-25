'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** What to render if a descendant throws. Defaults to nothing. */
  fallback?: ReactNode
  /** Short name used in the console report, e.g. "volkswagen-showcase". */
  name?: string
}

/**
 * Local error boundary for optional enhancements (3D, WebGL) — if one fails on
 * a visitor's device, it disappears on its own instead of taking the page down
 * to the route-level error screen.
 */
export default class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.name ?? 'ErrorBoundary'}]`, error, info.componentStack)
  }

  render() {
    return this.state.failed ? this.props.fallback ?? null : this.props.children
  }
}
