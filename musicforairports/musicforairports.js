
const SAMPLES_ROOT = 'Samples/';

const OCTAVE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const SAMPLE_LIBRARY = {
  'Grand Piano': [
    { note: 'A',  octave: 4, file: SAMPLES_ROOT + 'Grand\ Piano/piano-f-a4.wav' },
    { note: 'A',  octave: 5, file: SAMPLES_ROOT + 'Grand\ Piano/piano-f-a5.wav' },
    { note: 'A',  octave: 6, file: SAMPLES_ROOT + 'Grand\ Piano/piano-f-a6.wav' },
    { note: 'C',  octave: 4, file: SAMPLES_ROOT + 'Grand\ Piano/piano-f-c4.wav' },
    { note: 'C',  octave: 5, file: SAMPLES_ROOT + 'Grand\ Piano/piano-f-c5.wav' },
    { note: 'C',  octave: 6, file: SAMPLES_ROOT + 'Grand\ Piano/piano-f-c6.wav' },
    { note: 'D#',  octave: 4, file: SAMPLES_ROOT + 'Grand\ Piano/piano-f-d#4.wav' },
    { note: 'D#',  octave: 5, file: SAMPLES_ROOT + 'Grand\ Piano/piano-f-d#5.wav' },
    { note: 'D#',  octave: 6, file: SAMPLES_ROOT + 'Grand\ Piano/piano-f-d#6.wav' },
    { note: 'F#',  octave: 4, file: SAMPLES_ROOT + 'Grand\ Piano/piano-f-f#4.wav' },
    { note: 'F#',  octave: 5, file: SAMPLES_ROOT + 'Grand\ Piano/piano-f-f#5.wav' },
    { note: 'F#',  octave: 6, file: SAMPLES_ROOT + 'Grand\ Piano/piano-f-f#6.wav' }
  ]
};

let audioContext = new AudioContext();

/******************************
 * Utilities
 *****************************/

// Could be optimized by mapping from string to int
function noteValue(note, octave) {
  return octave * 12 + OCTAVE.indexOf(note);
}

function getNoteDistance(note1, octave1, note2, octave2) {
  return noteValue(note1, octave1) - noteValue(note2, octave2);
}

function flatToSharp(note) {
  switch (note) {
    case 'Bb': return 'A#';
    case 'Db': return 'C#';
    case 'Eb': return 'D#';
    case 'Gb': return 'F#';
    case 'Ab': return 'G#';
    default:   return note;
  }
}

function getNearestSample(sampleBank, note, octave) {
  let sortedBank = sampleBank.slice().sort((sampleA, sampleB) => {
    let distanceToA = 
      Math.abs(getNoteDistance(note, octave, sampleA.note, sampleA.octave));
    let distanceToB = 
      Math.abs(getNoteDistance(note, octave, sampleB.note, sampleB.octave));
    return distanceToA - distanceToB;
  });
  return sortedBank[0];
}

function fetchSample(path) {
  return fetch(encodeURIComponent(path))
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer));
}

function getSample(instrument, noteAndOctave) {
  let [, requestedNote, requestedOctave] = /^(\w[b#]?)(\d)$/.exec(noteAndOctave);
  requestedOctave = parseInt(requestedOctave, 10);
  requestedNote = flatToSharp(requestedNote);
  let sampleBank = SAMPLE_LIBRARY[instrument];
  let sample = getNearestSample(sampleBank, requestedNote, requestedOctave);
  let distance = 
    getNoteDistance(requestedNote, requestedOctave, sample.note, sample.octave);
  return fetchSample(sample.file).then(audioBuffer => ({
    audioBuffer: audioBuffer,
    distance: distance
  }));
}

function playSample(instrument, note, destination, delaySeconds=0) {
  getSample(instrument, note).then(({audioBuffer, distance}) => {
    let playbackRate = Math.pow(2, distance/12); // Should probably have a const pow(2, 1/12) and then multiply
    let bufferSource = audioContext.createBufferSource();
    bufferSource.buffer = audioBuffer;
    bufferSource.playbackRate.value = playbackRate;
    bufferSource.connect(destination);
    bufferSource.start(audioContext.currentTime + delaySeconds);
  });
}

// Do the stuff
function startLoop(instrument, note, destination, loopLengthSeconds, delaySeconds) {
  playSample(instrument, note, destination, delaySeconds);
  setInterval(() => playSample(instrument, note, destination, delaySeconds),
    loopLengthSeconds * 1000);
}

fetchSample('AirportTerminal.wav').then(convolverBuffer => {
  let convolver = audioContext.createConvolver();
  convolver.buffer = convolverBuffer;
  convolver.connect(audioContext.destination);

  startLoop('Grand Piano', 'C4',  convolver, 19.7, 4.0);
  startLoop('Grand Piano', 'D4', convolver, 17.8, 8.1);
  startLoop('Grand Piano', 'E4',  convolver, 21.3, 5.6);
  startLoop('Grand Piano', 'F4', convolver, 22.1, 12.6);
  startLoop('Grand Piano', 'G4', convolver, 18.4, 9.2);
  startLoop('Grand Piano', 'A4',  convolver, 20.0, 14.1);
  startLoop('Grand Piano', 'B4', convolver, 17.7, 3.1);
});
