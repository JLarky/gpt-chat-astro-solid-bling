import { redis_token, redis_url } from '../config.server$';
import { Redis } from '@upstash/redis'; // for deno: see above

/**
The MIT License (MIT)

Copyright (c) 2021 Upstash, Inc.

https://github.com/upstash/ratelimit/blob/main/LICENSE
*/

export type RegionContext = { redis: Redis; cache?: EphemeralCache };
export type RatelimitResponse = {
	/**
	 * Whether the request may pass(true) or exceeded the limit(false)
	 */
	success: boolean;
	/**
	 * Maximum number of requests allowed within a window.
	 */
	limit: number;
	/**
	 * How many requests the user has left within the current window.
	 */
	remaining: number;
	/**
	 * Unix timestamp in milliseconds when the limits are reset.
	 */
	reset: number;

	/**
	 * For the MultiRegion setup we do some synchronizing in the background, after returning the current limit.
	 * In most case you can simply ignore this.
	 *
	 * On Vercel Edge or Cloudflare workers, you need to explicitely handle the pending Promise like this:
	 *
	 * **Vercel Edge:**
	 * https://nextjs.org/docs/api-reference/next/server#nextfetchevent
	 *
	 * ```ts
	 * const { pending } = await ratelimit.limit("id")
	 * event.waitUntil(pending)
	 * ```
	 *
	 * **Cloudflare Worker:**
	 * https://developers.cloudflare.com/workers/runtime-apis/fetch-event/#syntax-module-worker
	 *
	 * ```ts
	 * const { pending } = await ratelimit.limit("id")
	 * context.waitUntil(pending)
	 * ```
	 */
	pending: Promise<unknown>;
};

export type Algorithm<TContext> = (
	ctx: TContext,
	identifier: string,
	opts?: {
		cache?: EphemeralCache;
	}
) => Promise<RatelimitResponse>;

export interface EphemeralCache {
	isBlocked: (identifier: string) => { blocked: boolean; reset: number };
	blockUntil: (identifier: string, reset: number) => void;

	set: (key: string, value: number) => void;
	get: (key: string) => number | null;

	incr: (key: string) => number;
}

export class Cache implements EphemeralCache {
	/**
	 * Stores identifier -> reset (in milliseconds)
	 */
	private readonly cache: Map<string, number>;

	constructor(cache: Map<string, number>) {
		this.cache = cache;
	}

	public isBlocked(identifier: string): { blocked: boolean; reset: number } {
		if (!this.cache.has(identifier)) {
			return { blocked: false, reset: 0 };
		}
		const reset = this.cache.get(identifier)!;
		if (reset < Date.now()) {
			this.cache.delete(identifier);
			return { blocked: false, reset: 0 };
		}

		return { blocked: true, reset: reset };
	}

	public blockUntil(identifier: string, reset: number): void {
		this.cache.set(identifier, reset);
	}

	public set(key: string, value: number): void {
		this.cache.set(key, value);
	}
	public get(key: string): number | null {
		return this.cache.get(key) || null;
	}

	public incr(key: string): number {
		let value = this.cache.get(key) ?? 0;
		value += 1;
		this.cache.set(key, value);
		return value;
	}
}

/**
 * Combined approach of `slidingLogs` and `fixedWindow` with lower storage
 * costs than `slidingLogs` and improved boundary behavior by calcualting a
 * weighted score between two windows.
 *
 * **Pro:**
 *
 * Good performance allows this to scale to very high loads.
 *
 * **Con:**
 *
 * Nothing major.
 *
 * @param tokens - How many requests a user can make in each time window.
 * @param window - The duration in which the user can max X requests.
 */
export function slidingWindow(
	/**
	 * How many requests are allowed per window.
	 */
	tokens: number,
	/**
	 * The duration in which `tokens` requests are allowed.
	 */
	windowMs: number
): Algorithm<RegionContext> {
	const script = `
      local currentKey  = KEYS[1]           -- identifier including prefixes
      local previousKey = KEYS[2]           -- key of the previous bucket
      local tokens      = tonumber(ARGV[1]) -- tokens per window
      local now         = ARGV[2]           -- current timestamp in milliseconds
      local window      = ARGV[3]           -- interval in milliseconds
      local requestsInCurrentWindow = redis.call("GET", currentKey)
      if requestsInCurrentWindow == false then
        requestsInCurrentWindow = 0
      end
      local requestsInPreviousWindow = redis.call("GET", previousKey)
      if requestsInPreviousWindow == false then
        requestsInPreviousWindow = 0
      end
      local percentageInCurrent = ( now % window) / window
      if requestsInPreviousWindow * ( 1 - percentageInCurrent ) + requestsInCurrentWindow >= tokens then
        return 0
      end
      local newValue = redis.call("INCR", currentKey)
      if newValue == 1 then
        -- The first time this key is set, the value will be 1.
        -- So we only need the expire command once
        redis.call("PEXPIRE", currentKey, window * 2 + 1000) -- Enough time to overlap with a new window + 1 second
      end
      return tokens - newValue
      `;
	const windowSize = windowMs;
	return async function (ctx: RegionContext, identifier: string) {
		const now = Date.now();

		const currentWindow = Math.floor(now / windowSize);
		const currentKey = [identifier, currentWindow].join(':');
		const previousWindow = currentWindow - windowSize;
		const previousKey = [identifier, previousWindow].join(':');

		if (ctx.cache) {
			const { blocked, reset } = ctx.cache.isBlocked(identifier);
			if (blocked) {
				return {
					success: false,
					limit: tokens,
					remaining: 0,
					reset: reset,
					pending: Promise.resolve(),
				};
			}
		}

		const remaining = (await ctx.redis.eval(
			script,
			[currentKey, previousKey],
			[tokens, now, windowSize]
		)) as number;

		const success = remaining > 0;
		const reset = (currentWindow + 1) * windowSize;
		if (ctx.cache && !success) {
			ctx.cache.blockUntil(identifier, reset);
		}
		return {
			success,
			limit: tokens,
			remaining,
			reset,
			pending: Promise.resolve(),
		};
	};
}

const cache = new Cache(new Map());

const redis = new Redis({
	url: redis_url,
	token: redis_token,
});

export const rateLimit = (limiter: Algorithm<RegionContext>, identifier: string) => {
	return limiter({ redis, cache }, identifier);
};
