// Function to apply low-pass filter
function lowPassFilter(audioData, cutoff, fs) {
  const context = new (window.AudioContext || window.webkitAudioContext)()
  const buffer = context.createBuffer(1, audioData.length, fs)
  buffer.getChannelData(0).set(audioData)

  const source = context.createBufferSource()
  source.buffer = buffer

  const biquadFilter = context.createBiquadFilter()
  biquadFilter.type = 'lowpass'
  biquadFilter.frequency.value = cutoff

  source.connect(biquadFilter)
  biquadFilter.connect(context.destination)

  const offlineContext = new OfflineAudioContext(1, buffer.length, fs)
  const offlineSource = offlineContext.createBufferSource()
  offlineSource.buffer = buffer

  const offlineFilter = offlineContext.createBiquadFilter()
  offlineFilter.type = 'lowpass'
  offlineFilter.frequency.value = cutoff

  offlineSource.connect(offlineFilter)
  offlineFilter.connect(offlineContext.destination)

  offlineSource.start(0)
  return offlineContext.startRendering().then((filteredBuffer) => {
    return filteredBuffer.getChannelData(0)
  })
}

// Function to compute envelope
function envelope(audioData) {
  const analyticSignal = new Float32Array(audioData.length)
  const amplitudeEnvelope = new Float32Array(audioData.length)
  for (let i = 0; i < audioData.length; i++) {
    analyticSignal[i] = Math.abs(audioData[i])
    amplitudeEnvelope[i] = Math.sqrt(analyticSignal[i] ** 2 + audioData[i] ** 2)
  }
  return amplitudeEnvelope
}

// Function to smooth and detect syllables
async function smoothAndDetectSyllables(
  audioData,
  fs,
  cutoff = 4000,
  threshold = 0.2,
  minSilenceDuration = 0.01
) {
  // Step 1: Apply low-pass filter
  const filteredData = await lowPassFilter(audioData, cutoff, fs)

  // Step 2: Compute envelope
  const amplitudeEnvelope = envelope(filteredData)

  // Step 3: Detect peaks and valleys
  const syllableIndices = []
  for (let i = 0; i < amplitudeEnvelope.length; i++) {
    if (amplitudeEnvelope[i] > threshold) {
      syllableIndices.push(i)
    }
  }
  console.log('syllableIndices.length:', syllableIndices.length)

  // Step 4: Group indices to identify syllables
  const syllables = []
  let lastEnd = 0
  for (let i = 0; i < syllableIndices.length; i++) {
    if (syllableIndices[i] - lastEnd > fs * minSilenceDuration) {
      syllables.push(syllableIndices.slice(lastEnd, i))
      lastEnd = i
    }
  }
  return syllables
}
