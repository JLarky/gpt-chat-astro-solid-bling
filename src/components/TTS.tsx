import { createSignal, Show } from 'solid-js';

// global state of window.speechSynthesis.speaking
const [isSpeaking, setIsSpeaking] = createSignal(false);
// global state of window.speechSynthesis.paused
const [isPaused, setIsPaused] = createSignal(false);

// each component has its own id or undefined if no TTS is playing
const [currentTSS, setCurrentTSS] = createSignal<{}>();

export const TTS = (props: { text: string; ru: boolean }) => {
	const id = {}; // we only check the reference
	const isCurrent = () => currentTSS() === id;

	function onClick(text: string, ru: boolean) {
		if (isCurrent()) {
			if (isPaused()) {
				window.speechSynthesis.resume();
			} else {
				window.speechSynthesis.pause();
			}
			return;
		}
		// reset everything once we start a new TTS
		window.speechSynthesis.cancel();
		setCurrentTSS(id);
		var utterance = new SpeechSynthesisUtterance(text);
		if (ru) {
			utterance.lang = 'ru-RU'; // set language to Russian
			utterance.rate = 0.9;
		}
		window.speechSynthesis.speak(utterance);
		// make sure to read speaking only after we started
		function loop() {
			setIsSpeaking(window.speechSynthesis.speaking);
			setIsPaused(window.speechSynthesis.paused);
			const stopped = !isPaused() && !isSpeaking();
			if (stopped) {
				setCurrentTSS(undefined);
			}
			if (isCurrent()) {
				requestIdleCallback(loop);
			}
		}
		loop();
	}
	return (
		<button
			class="absolute right-0 bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-2"
			onClick={() => onClick(props.text, props.ru)}
		>
			<Show when={isCurrent()} fallback="TTS">
				{isPaused() ? 'Resume' : 'Pause'}
			</Show>
		</button>
	);
};
