/**
 * Convention: a scene image at "/images/scenes/foo.png" has its optional
 * looping ambient video at "/videos/scenes/foo.mp4".
 */
export function getSceneVideoPath(imagePath: string): string {
  return imagePath.replace("/images/scenes/", "/videos/scenes/").replace(/\.(png|jpe?g|webp)$/i, ".mp4");
}

/**
 * Once you've generated a looping ambient video for a mood and dropped it at
 * its conventional path (see getSceneVideoPath above), add its image path
 * here. SceneMedia will then render the video (muted/looping) instead of the
 * static illustration — no other code changes needed.
 *
 * Empty on purpose. This site is stills plus CSS motion: generated video is by
 * far the most expensive asset in a build like this, and the ambient layer,
 * the slow scene drift and the grain carry the scene without it.
 *
 * We check this list instead of probing the network so a missing video never
 * produces a 404 in the console; it just quietly keeps using the image.
 */
export const SCENES_WITH_VIDEO: string[] = [];
