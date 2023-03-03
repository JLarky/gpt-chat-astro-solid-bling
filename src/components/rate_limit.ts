import { rateLimit, slidingWindow } from './upstash';

const limiter = slidingWindow(2, 5000);
const limit = (key: string) => rateLimit(limiter, key);

export const checkLimit = () => {
	return limit('api');
};
