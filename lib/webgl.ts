let _webglAvailable: boolean | null = null

export function isWebGLAvailable(): boolean {
  if (_webglAvailable !== null) return _webglAvailable
  const probe = document.createElement('canvas')
  _webglAvailable = !!(probe.getContext('webgl') || probe.getContext('experimental-webgl'))
  return _webglAvailable
}
