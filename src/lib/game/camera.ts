/**
 * Some browsers and embedded webviews never settle the getUserMedia promise
 * when capture is blocked by policy rather than refused by the user. Without
 * a deadline the UI would sit on "starting" forever, so treat silence as a no.
 */
export const CAMERA_TIMEOUT_MS = 6000

export function requestCameraStream(
  constraints: MediaStreamConstraints = { video: true, audio: false },
  timeoutMs = CAMERA_TIMEOUT_MS,
): Promise<MediaStream> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return Promise.reject(new Error('no_camera_api'))
  }
  return Promise.race([
    navigator.mediaDevices.getUserMedia(constraints),
    new Promise<MediaStream>((_, reject) =>
      setTimeout(() => reject(new Error('camera_timeout')), timeoutMs),
    ),
  ])
}
