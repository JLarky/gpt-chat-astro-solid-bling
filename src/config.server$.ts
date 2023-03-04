// this file can't be imported from browser code

function required(key: string) {
	const value = process.env[key];
	if (!value) {
		throw new Error(`${key} is not set`);
	}
	return value;
}

export const redis_url = required('UPSTASH_REDIS_REST_URL');
export const redis_token = required('UPSTASH_REDIS_REST_TOKEN');
export const OPEN_AI_ORG = required('OPEN_AI_ORG');
export const OPEN_AI_KEY = process.env.OPEN_AI_KEY1 + process.env.OPEN_AI_KEY2!;

if (!OPEN_AI_KEY) {
	throw new Error('OPEN_AI_KEY1 is not set');
}
