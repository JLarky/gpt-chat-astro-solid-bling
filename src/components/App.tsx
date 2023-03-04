import { Outlet, RouteDefinition, useRoutes } from '@solidjs/router';
import { GPT } from './GPT';

const routes = [
	{
		path: '/',
		component: () => <Layout />,
		children: [
			{
				path: '/',
				component: () => <GPT />,
			},
			{
				path: '/sharik',
				component: () => <GPT ru={true} />,
			},
		],
	},
	{
		path: '*',
		component: () => <>404</>,
	},
] satisfies RouteDefinition[];

export default function App() {
	const Routes = useRoutes(routes);

	return <Routes />;
}

function Layout() {
	return <Outlet />;
}
