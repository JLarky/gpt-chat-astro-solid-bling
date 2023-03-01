import { useRouteData } from '@solidjs/router';
import { createEffect, Resource } from 'solid-js';

export default function Index() {
	const user = useRouteData() as Resource<unknown>;
	createEffect(() => {
		console.log('effect', user());
	});

	return (
		<div>
			<h1>Index</h1>
			<p>user: {JSON.stringify(typeof user())}</p>
		</div>
	);
}
