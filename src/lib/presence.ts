/** Shared between the heartbeat route and the header that renders the count. */

/** How often a listening tab checks in. */
export const HEARTBEAT_MS = 20_000;

/**
 * How long a check-in counts for. Comfortably more than two heartbeats, so a
 * single dropped request doesn't make someone flicker out of the count.
 */
export const PRESENCE_WINDOW_MS = 50_000;

/**
 * Below this, the count stays hidden and the LIVE dot stands alone. A radio
 * station announcing "2 listening" undersells itself, and an empty-looking room
 * makes people leave.
 */
export const MIN_VISIBLE_LISTENERS = 5;

/**
 * Namespaced by site. If this deployment ever shares an Upstash database with
 * another one of these radios, an unqualified key would have each site counting
 * the other's listeners as its own.
 */
export const PRESENCE_KEY = "presence:listeners:kudla";
