import '../styles/tailwind.css';
import { fetch$ } from '@qgp-js/bling';
import { createSignal, For } from 'solid-js';
import { checkLimit } from './rate_limit';
import robot from '../assets/robot.webp';
import { OPEN_AI_KEY, OPEN_AI_ORG } from '../config.server$';

type Message = { content: string; role: 'user' | 'system' | 'assistant' };

const runServer = fetch$(
	async function (messages: Message[]) {
		const { success } = await checkLimit();
		if (!success) {
			return {
				error: 'Too many requests',
			};
		}
		const key = OPEN_AI_KEY;
		const org = OPEN_AI_ORG;
		if (!1) {
			return {
				response: {
					role: 'assistant' as const,
					content: 'Шарик нашёл рычаг и дёрнул за него и открылась дверька',
				},
			};
		}

		const res = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${key}`,
				'OpenAI-Organization': org,
			},
			body: JSON.stringify({
				model: 'gpt-3.5-turbo',
				messages,
				max_tokens: 1000,
				temperature: 0.5,
				top_p: 1,
				frequency_penalty: 0,
				presence_penalty: 0,
			}),
		});
		const data = (await res.json()) as {
			choices?: { message: Message }[];
		};
		if (!data.choices) {
			console.error('GPT error:', data);
			return {
				error: 'Failed to get response from ChatGPT',
			};
		}
		return { response: data.choices[0].message };
	},
	{
		method: 'POST',
	}
);

function speak(text: string, ru: boolean) {
	var utterance = new SpeechSynthesisUtterance(text);
	if (ru) {
		utterance.lang = 'ru-RU'; // set language to Russian
		utterance.rate = 0.9;
	}
	window.speechSynthesis.speak(utterance);
}

export const GPT = (props: { ru?: boolean }) => {
	let inputRef: HTMLInputElement | undefined;
	const initialData = (): Message[] => {
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
	return (
		<div class="bg-gray-900 text-white pb-8">
			<div class="container mx-auto px-4 py-8 max-w-[800px]">
				<div class="bg-gray-800 rounded-lg p-4">
					<div class="flex items-center mb-4">
						<div class="h-12 w-12 bg-gray-700 rounded-full mr-2">
							<img src={robot} alt="robot" class="[image-rendering:pixelated] rounded-full" />
						</div>
						<h2 class="text-lg font-medium">Fairy tale GPT</h2>
					</div>
					<div class="messages mb-4">
						<For each={messages()}>
							{(message) => (
								<Message
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
							const ref = inputRef!;
							ref.scrollIntoView();
							ref.value = '';
							const r = await runServer(newMessages).catch((e) => {
								return { error: e.toString(), response: undefined };
							});
							setLoading(false);
							if (r.error) {
								alert(r.error);
								setMessages((x) => x.filter((y) => y !== myMessage));
								ref.value = trimmed;
								return;
							} else if (r.response) {
								setMessages((messages) => [...messages, r.response]);
							}
							ref.focus();
							ref.scrollIntoView();
						}}
					>
						<input
							disabled={loading()}
							ref={inputRef}
							name="message"
							type="text"
							class="flex-1 bg-gray-700 text-white rounded-lg py-2 px-4 mr-4"
							placeholder="Type your message..."
						/>
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

const Message = (props: { self?: boolean; text: string; ru: boolean }) => {
	return (
		<div class="message mb-2 relative">
			<button
				class="absolute right-0 bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-2"
				onClick={() => speak(props.text, props.ru)}
			>
				TTS
			</button>
			<div class="mr-16">
				<p
					class={
						'p-2 rounded-lg inline-block ' +
						(props.self ? 'ml-8 bg-gray-200 text-gray-900' : 'mr-8 bg-gray-700')
					}
				>
					{props.text}
				</p>
			</div>
		</div>
	);
};
