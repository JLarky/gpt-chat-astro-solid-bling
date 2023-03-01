import { Router, useRoutes, A, RouteDefinition } from '@solidjs/router';
import { createResource, createSignal, lazy } from 'solid-js';
import solidLogo from './assets/solid.svg';
import './App.css';

const routes = [
	// {
	// 	path: '/users',
	// 	component: lazy(() => import('/pages/users.js')),
	// },
	// {
	// 	path: '/users/:id',
	// 	component: lazy(() => import('/pages/users/[id].js')),
	// 	children: [
	// 		{ path: '/', component: lazy(() => import('/pages/users/[id]/index.js')) },
	// 		{ path: '/settings', component: lazy(() => import('/pages/users/[id]/settings.js')) },
	// 		{ path: '/*all', component: lazy(() => import('/pages/users/[id]/[...all].js')) },
	// 	],
	// },
	{
		path: '/',
		component: () => <Counter />,
	},
	{
		component: lazy(() => import('./routes/index')),
		data: ({ params }) => {
			console.log('loader params', params, import.meta.env.SSR);

			const generator = () => 'hello';

			if (0 && import.meta.env.SSR) {
				return generator;
			}

			const [user] = createResource(
				() => params.slug,
				(slug) => {
					return generator();
				}
			);

			console.log('loader user', user);
			return user;
		},
		path: '/*slug',
	},
] satisfies RouteDefinition[];

function App() {
	const Routes = useRoutes(routes);

	return <Routes />;
}

function Counter() {
	const [count, setCount] = createSignal(0);

	return (
		<div class="App">
			<div>
				<a href="https://vitejs.dev" target="_blank">
					<img src="/vite.svg" class="logo" alt="Vite logo" />
				</a>
				<a href="https://www.solidjs.com" target="_blank">
					<img src={solidLogo} class="logo solid" alt="Solid logo" />
				</a>
			</div>
			<h1>Vite + Solid</h1>
			<div class="card">
				<button onClick={() => setCount((count) => count + 1)}>count is {count()}</button>
				<p>
					Edit <code>src/App.tsx</code> and save to test HMR
				</p>
			</div>
			<p class="read-the-docs">Click on the Vite and Solid logos to learn more</p>
		</div>
	);
}

export default App;
