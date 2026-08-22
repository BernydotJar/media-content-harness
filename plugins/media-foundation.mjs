export const name = 'media-foundation'

/**
 * Initial Media Content Harness foundation plugin.
 *
 * The plugin intentionally owns configuration only in the first foundation
 * commit. Durable media services are added as separate capability plugins so
 * the DeepSeek agent loop remains untouched.
 *
 * @param {object} _ctx DeepSeek Harness / Cordis context.
 * @param {{projectRoot:string,releaseDirectory:string,failClosed:boolean}} config deployment configuration.
 */
export function apply(_ctx, config) {
  if (!config || typeof config.projectRoot !== 'string' || config.projectRoot.length === 0) {
    throw new Error('media-foundation requires a non-empty projectRoot')
  }
  if (typeof config.releaseDirectory !== 'string' || config.releaseDirectory.length === 0) {
    throw new Error('media-foundation requires a non-empty releaseDirectory')
  }
  if (config.failClosed !== true) {
    throw new Error('media-foundation requires failClosed=true')
  }
}
