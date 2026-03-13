let voicesLoaded = false;

function ensureVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined') return Promise.resolve([]);

  const voices = speechSynthesis.getVoices();
  if (voices.length > 0 || voicesLoaded) return Promise.resolve(voices);

  return new Promise((resolve) => {
    speechSynthesis.addEventListener('voiceschanged', () => {
      voicesLoaded = true;
      resolve(speechSynthesis.getVoices());
    }, { once: true });

    // Fallback if voiceschanged never fires
    setTimeout(() => resolve(speechSynthesis.getVoices()), 1000);
  });
}

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  return (
    voices.find(v => v.name.includes('Google UK English Female')) ||
    voices.find(v => v.name === 'Samantha') ||
    voices.find(v => v.lang.startsWith('en-GB')) ||
    voices.find(v => v.lang.startsWith('en'))
  );
}

export async function speakPhrase(text: string, onEnd: () => void): Promise<void> {
  if (typeof window === 'undefined') return;

  speechSynthesis.cancel();

  const voices = await ensureVoices();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(voices);
  if (voice) utterance.voice = voice;
  utterance.rate = 0.85;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;

  speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined') return;
  speechSynthesis.cancel();
}
