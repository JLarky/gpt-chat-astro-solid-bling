import '../styles/tailwind.css';
import { fetch$ } from '@qgp-js/bling';
import { createSignal, For } from 'solid-js';
import robot from '../assets/robot.webp';
import { TTS } from './TTS';
import { getCollection, getEntryBySlug } from "astro:content";


type Message = { content: string; role: 'user' | 'system' | 'assistant' };

const runServer = fetch$(
	async function ({ override, messages }: { override?: { model?: string }; messages: Message[] }) {
		await new Promise((r) => setTimeout(r, 1000));

    const latest = messages!.pop()!.content;

    const entry = await getEntryBySlug("test", latest);

    const content = entry?.body || "No entry";

    // const string = testCollection[0].body;

    // console.log("testing", string);

		return {

			response: {
				role: 'assistant' as const,
        content
			},
		};
	},
	{
		method: 'POST',
	}
);

export const GPT = (props: { ru?: boolean; clean?: boolean }) => {
	let inputRef: HTMLInputElement | undefined;
	let textareaRef: HTMLTextAreaElement | undefined;
	const initialData = (): Message[] => {
		if (props.clean) {
			return [];
		}
		if (props.ru) {
			return [
				{
					role: 'user',
					content:
						'ты будешь помогать мне написать художественный расказ для детей, я буду давать тебе инструкции описывающие события которые должны произойти, а ты будешь продолжать рассказ (выводя по одному параграфу) включая эти инструкции. Первая инструкция: Шарик нашёл рычаг и дёрнул за него',
				},
				{
					role: 'assistant',
					content:
						'Собачка Шарик нашла рычаг и дёрнула за него. Вдруг она оказалась на улице и там увидела несколько дверей и динамик.',
				},
			];
		}
		return [
			{
				role: 'user',
				content: `I want you to act as a storyteller. You are going to write a story for children. I will give you instructions describing the events that should happen, and you will continue the story (outputting one paragraph at a time) including these instructions. The first instruction is: "a dog found a lever and pulled it"`,
			},
			{
				role: 'assistant',
				content:
					'The dog found a lever and pulled it. Suddenly she was outside and saw several doors has to chose which one to open.',
			},
		];
	};
	const [messages, setMessages] = createSignal<Message[]>(initialData());
	const [loading, setLoading] = createSignal(false);
	const [allowDelete, setAllowDelete] = createSignal(false);
	return (
		<div class="bg-gray-900 text-white pb-8">
			<div class="container mx-auto px-4 py-8 max-w-[800px]">
				<div class="bg-gray-800 rounded-lg p-4">
					<div class="flex items-center mb-4">
						<div class="h-12 w-12 bg-gray-700 rounded-full mr-2">
							<img src={robot} alt="robot" class="[image-rendering:pixelated] rounded-full" />
						</div>
						<h2 class="text-lg font-medium">Fairy tale GPT</h2>
						<button class="mr-2 ml-auto" onClick={() => setAllowDelete((x) => !x)}>
							{!allowDelete() ? 'Allow to delete' : 'Return back'}
						</button>
					</div>
					<div class="messages mb-4">
						<For each={messages()}>
							{(message) => (
								<Message
									onDelete={
										allowDelete()
											? () => {
													setMessages((x) => x.filter((m) => m !== message));
													setAllowDelete(messages().length !== 0);
											  }
											: undefined
									}
									self={message.role === 'user'}
									text={message.content}
									ru={props.ru ?? false}
								/>
							)}
						</For>
						{loading() && <Message ru={false} text="..." />}
					</div>
					<form
						class="flex items-center"
						onSubmit={async (e) => {
							e.preventDefault();
							const form = new FormData(e.currentTarget);
							const message = form.get('message');
							if (message === null) return;
							const trimmed = message.toString().trim();
							if (trimmed === '') return;
							const myMessage = { role: 'user' as const, content: trimmed };
							const newMessages = [...messages(), myMessage];
							setMessages(newMessages);
							setLoading(true);
							const ref = inputRef! || textareaRef!;
							ref.scrollIntoView();
							ref.value = '';
							const override = props.clean
								? {
										// model: 'gpt-4-32k',
										model: 'gpt-4',
								  }
								: undefined;
							const r = await runServer({ override, messages: newMessages }).catch((e) => {
								return { error: e.toString(), response: undefined };
							});
							setLoading(false);
							if (r.response) {
								setMessages((messages) => [...messages, r.response]);
							}
							ref.focus();
							ref.scrollIntoView();
						}}
					>
						{props.clean ? (
							<textarea
								disabled={loading()}
								ref={textareaRef}
								name="message"
								class="flex-1 bg-gray-700 text-white rounded-lg py-2 px-4 mr-4"
								placeholder="Type your message..."
							></textarea>
						) : (
							<input
								disabled={loading()}
								ref={inputRef}
								name="message"
								class="flex-1 bg-gray-700 text-white rounded-lg py-2 px-4 mr-4"
								placeholder="Type your message..."
								autocomplete="off"
							/>
						)}

						<button
							type="submit"
							class="bg-gray-600 text-white rounded-lg py-2 px-4 disabled:opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed"
							disabled={loading()}
						>
							Send
						</button>
					</form>
				</div>
			</div>
			<div class="fixed bottom-0 right-0 p-2 flex">
				<a
					href="https://github.com/JLarky/gpt-chat-astro-solid-bling"
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 bg-gray-700 text-white hover:bg-gray-600 focus:ring-offset-gray-900"
				>
					<span>Star on Github</span>
				</a>
				<a
					href="http://qgp.app/"
					target="_blank"
					rel="noopener noreferrer"
					class="ml-2 flex items-center py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 bg-gray-700 text-white hover:bg-gray-600 focus:ring-offset-gray-900"
				>
					<span>Built with QGP</span>
				</a>
			</div>
		</div>
	);
};

const Message = (props: { self?: boolean; onDelete?: () => void; text: string; ru: boolean }) => {
	return (
		<div class="message mb-2 relative">
			{props.onDelete ? (
				<Delete onDelete={props.onDelete} />
			) : (
				<TTS text={props.text} ru={props.ru} />
			)}
			<div class="mr-16">
				<p
					class={
						'whitespace-pre-wrap p-2 rounded-lg inline-block ' +
						(props.self ? 'ml-8 bg-gray-200 text-gray-900' : 'mr-8 bg-gray-700')
					}
				>
					{props.text}
				</p>
			</div>
		</div>
	);
};

export const Delete = (props: { onDelete: () => void }) => {
	return (
		<button
			class="absolute right-0 bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-2"
			onClick={props.onDelete}
		>
			Delete
		</button>
	);
};
