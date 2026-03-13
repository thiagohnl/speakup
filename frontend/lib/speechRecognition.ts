export function isSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function listenForPhrase(
  onResult: (transcript: string) => void,
  onError: (err: string) => void
): () => void {
  if (typeof window === 'undefined') {
    onError('Not in browser');
    return () => {};
  }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    onError('Speech recognition not supported');
    return () => {};
  }

  const recognition = new SR();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;

  let settled = false;

  const timeout = setTimeout(() => {
    if (!settled) {
      settled = true;
      recognition.abort();
      onError('No speech detected (timeout)');
    }
  }, 10000);

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);

    const last = event.results[event.results.length - 1];
    const transcript = last[0].transcript.trim();
    onResult(transcript);
  };

  recognition.onerror = () => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    onError('Speech recognition error');
  };

  recognition.onend = () => {
    if (!settled) {
      settled = true;
      clearTimeout(timeout);
      onError('No speech detected');
    }
  };

  recognition.start();

  return () => {
    if (!settled) {
      settled = true;
      clearTimeout(timeout);
      recognition.abort();
    }
  };
}
