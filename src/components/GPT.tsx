import '../styles/tailwind.css';
import { fetch$ } from '@tanstack/bling';

const runServer = fetch$(
	async function (message: string) {
		return { response: `you got response: ${message}` };
	},
	{
		method: 'GET',
	}
);

function speak(text: string) {
	var utterance = new SpeechSynthesisUtterance(text);
	window.speechSynthesis.speak(utterance);
}

export const GPT = () => {
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
								<Message self text="Hi" />
								<Message text="Hello" />
							</div>
							<form
								class="flex items-center"
								onSubmit={async (e) => {
									e.preventDefault();
									const form = new FormData(e.currentTarget);
									const message = form.get('message');
									if (message === null) return;
									const r = await runServer(message.toString());
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
					'py-2 px-4 rounded-lg inline-block ' +
					(props.self ? 'bg-gray-200 text-gray-900' : 'bg-gray-700')
				}
			>
				{props.text}
			</p>
		</div>
	);
};
