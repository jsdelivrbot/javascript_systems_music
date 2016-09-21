
const SAMPLES_ROOT = '/Users/sbellar/Music/Project\ Stuffs/Samples/Sonatina_Symphonic_Orchestra/';

const OCTAVE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const SAMPLE_LIBRARY = {
  'Grand Piano': [
    { note: 'A',  octave: 4, file: SAMPLES_ROOT + '/piano-f-a4.wav' },
    { note: 'A',  octave: 5, file: SAMPLES_ROOT + '/piano-f-a5.wav' },
    { note: 'A',  octave: 6, file: SAMPLES_ROOT + '/piano-f-a6.wav' },
    { note: 'C',  octave: 4, file: SAMPLES_ROOT + '/piano-f-c4.wav' },
    { note: 'C',  octave: 5, file: SAMPLES_ROOT + '/piano-f-c5.wav' },
    { note: 'C',  octave: 6, file: SAMPLES_ROOT + '/piano-f-c6.wav' },
    { note: 'D#',  octave: 4, file: SAMPLES_ROOT + '/piano-f-d#4.wav' },
    { note: 'D#',  octave: 5, file: SAMPLES_ROOT + '/piano-f-d#5.wav' },
    { note: 'D#',  octave: 6, file: SAMPLES_ROOT + '/piano-f-d#6.wav' },
    { note: 'F#',  octave: 4, file: SAMPLES_ROOT + '/piano-f-f#4.wav' },
    { note: 'F#',  octave: 5, file: SAMPLES_ROOT + '/piano-f-f#5.wav' },
    { note: 'F#',  octave: 6, file: SAMPLES_ROOT + '/piano-f-f#6.wav' }
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
      Math.abs(getNoteDistance(note,octace, sampleA.note, sampleA.octave));
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
  let [, requestedNote, requestedOctace] = /^(\w[b#]?)(\d)$/.exec(noteAndOctave);
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
