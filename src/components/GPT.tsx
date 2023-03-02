import '../styles/tailwind.css';
import { fetch$ } from '@tanstack/bling';
import { createSignal, For } from 'solid-js';

type Message = { content: string; role: 'user' | 'system' | 'assistant' };

const runServer = fetch$(
	async function (messages: Message[]) {
		const key = process.env.OPEN_AI_KEY1 + process.env.OPEN_AI_KEY2!;
		const org = process.env.OPEN_AI_ORG!;
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
		console.log(res);
		const data = (await res.json()) as {
			choices: { message: Message }[];
		};
		console.log(data);
		console.log(data.choices[0].message);
		return { response: data.choices[0].message };
	},
	{
		method: 'GET',
	}
);

function speak(text: string) {
	var utterance = new SpeechSynthesisUtterance(text);
	utterance.lang = 'ru-RU'; // set language to Russian
	utterance.rate = 0.9;
	window.speechSynthesis.speak(utterance);
}

export const GPT = () => {
	const [messages, setMessages] = createSignal<Message[]>([
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
	]);
	return (
		<div class="bg-gray-900 text-white min-h-screen">
			<div class="container mx-auto px-4 py-8">
				<div class="grid grid-cols-12 gap-4">
					<div class="col-span-12 lg:col-span-8">
						<div class="bg-gray-800 rounded-lg p-4">
							<div class="flex items-center mb-4">
								<div class="h-8 w-8 bg-gray-700 rounded-full mr-2"></div>
								<h2 class="text-lg font-medium">John Doe</h2>
							</div>
							<div class="messages mb-4">
								<For each={messages()}>
									{(message) => <Message self={message.role === 'user'} text={message.content} />}
								</For>
							</div>
							<form
								class="flex items-center"
								onSubmit={async (e) => {
									e.preventDefault();
									const form = new FormData(e.currentTarget);
									const message = form.get('message');
									if (message === null) return;
									const newMessages = [
										...messages(),
										{ role: 'user' as const, content: message.toString() },
									];
									setMessages(newMessages);
									const r = await runServer(newMessages);
									setMessages((messages) => [...messages, r.response]);
									console.log(r.response);
								}}
							>
								<input
									name="message"
									type="text"
									class="flex-1 bg-gray-700 text-white rounded-lg py-2 px-4 mr-4"
									placeholder="Type your message..."
								/>
								<button type="submit" class="bg-gray-600 text-white rounded-lg py-2 px-4">
									Send
								</button>
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

const Message = (props: { self?: boolean; text: string }) => {
	return (
		<div class="message mb-2 relative">
			<button
				class="absolute right-0 bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-2 px-4"
				onClick={() => speak(props.text)}
			>
				TTS
			</button>
			<p
				class={
					'p-2 mr-16 rounded-lg inline-block ' +
					(props.self ? 'bg-gray-200 text-gray-900' : 'bg-gray-700')
				}
			>
				{props.text}
			</p>
		</div>
	);
};
