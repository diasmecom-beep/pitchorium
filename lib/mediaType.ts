const VIDEO_EXTENSIONS = ['mp4', 'mov', 'm4v', 'webm', 'avi'];

export function isVideoUrl(url: string): boolean {
  const clean = url.split('?')[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => clean.endsWith(`.${ext}`));
}
