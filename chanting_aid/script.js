let fileNames = []

document.getElementById('select-folder').addEventListener('click', async () => {
  fileNames = []
  const dirHandle = await window.showDirectoryPicker()
  for await (const entry of dirHandle.values()) {
    fileNames.push(entry)
  }
  //show the list of filenames on the page.
  const fileListElement = document.getElementById('file-list')
  for (let i = 0; i < fileNames.length; i++) {
    const option = document.createElement('option')
    option.value = i
    option.text = fileNames[i].name
    fileListElement.appendChild(option)
  }
})

class RecorderClass {
  constructor() {
    this.recordedData = []
    this.checkbox = document.getElementById('enable-recording')
    const bottomTimeline = WaveSurfer.Timeline.create({
      height: 10,
      timeInterval: 0.1,
      primaryLabelInterval: 1,
      style: {
        fontSize: '10px',
        color: '#6A3274',
      },
    })
    this.recordedWaveSurfer = WaveSurfer.create({
      container: '#recorded-waveform',
      height: 'auto',
      backgroundColor: '#000000',
      cursorColor: '#333',
      progressColor: '#555',
      waveColor: '#00eeff',
      plugins: [bottomTimeline],
    })
    this.recordedWaveSurfer.setVolume(0.05)
  }

  async initMediaRecorder() {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channels: 2,
        autoGainControl: false,
        echoCancellation: false,
        noiseSuppression: false,
      },
    })
    this.mediaRecorder = new MediaRecorder(mediaStream)
  }

  async onAudioFinish() {
    if (this.checkbox.checked) {
      this.mediaRecorder.stop()
      this.mediaRecorder.ondataavailable = async (e) => {
        const blob = new Blob([e.data], { type: 'audio/wav' })
        const url = URL.createObjectURL(blob)
        // console.log(e.data, blob);
        this.recordedWaveSurfer.load(url)
        this.recordedData = blob
      }
    } else return
  }

  async playRecordedAudio() {
    const url = URL.createObjectURL(this.recordedData)
    await this.recordedWaveSurfer.load(url)
    await this.recordedWaveSurfer.play()
  }

  setVolume(volume) {
    this.recordedWaveSurfer.setVolume(volume)
  }
}

class AudioPlayer {
  constructor(recorder) {
    this.checkbox = document.getElementById('enable-recording')
    this.mediaRecorder = recorder
    // Create a timeline plugin instance with custom options
    const bottomTimeline = WaveSurfer.Timeline.create({
      height: 10,
      timeInterval: 0.1,
      primaryLabelInterval: 1,
      style: {
        fontSize: '10px',
        color: '#6A3274',
      },
    })
    this.waveSurfer = WaveSurfer.create({
      container: '#waveform-container',
      height: 'auto',
      backgroundColor: '#000000',
      cursorColor: '#333',
      progressColor: '#555',
      waveColor: '#00eeff',
      minPxPerSec: 100,
      plugins: [bottomTimeline],
    })
    this.waveSurfer.setVolume(0.05)

    this.wsRegions = this.waveSurfer.registerPlugin(WaveSurfer.Regions.create())
    this.waveSurfer.registerPlugin(
      WaveSurfer.Zoom.create({
        scale: 0.5,
        maxZoom: 100,
      })
    )
  }

  async updateAudioFile() {
    const fileIndex = document.getElementById('file-list').value
    const fileHandle = fileNames[fileIndex]
    if (fileHandle) {
      const file = await fileHandle.getFile()
      //   console.log(file);
      const url = URL.createObjectURL(file)
      document.getElementById(
        'current-file'
      ).value = `Loaded file: ${file.name}`
      //the 'await' below is super-important. without which it doesnt work.
      await this.waveSurfer.load(url)
      await this.waveSurfer.play()
      if (this.checkbox.checked) this.mediaRecorder.mediaRecorder.start()
    }
  }

  playAudioFile() {
    this.waveSurfer.play()
    if (this.checkbox.checked) this.mediaRecorder.mediaRecorder.start()
  }

  pauseAudioFile() {
    this.waveSurfer.pause()
    if (this.checkbox.checked) this.mediaRecorder.mediaRecorder.pause()
  }

  restartAudioFile() {
    this.waveSurfer.setTime(0)
    this.waveSurfer.play()
    if (this.checkbox.checked) {
      this.mediaRecorder.mediaRecorder.stop()
      this.mediaRecorder.mediaRecorder.start()
    }
  }

  setVolume(volume) {
    this.waveSurfer.setVolume(volume)
  }

  async playPrevFile() {
    const fileList = document.getElementById('file-list')
    fileList.selectedIndex =
      fileList.selectedIndex > 0 ? fileList.selectedIndex - 1 : 0
    await this.updateAudioFile()
  }

  async playNextFile() {
    const fileList = document.getElementById('file-list')
    fileList.selectedIndex =
      fileList.selectedIndex < fileNames.length - 1
        ? fileList.selectedIndex + 1
        : fileNames.length - 1
    await this.updateAudioFile()
  }
}

const recorder = new RecorderClass()
recorder.initMediaRecorder()
const audioPlayer = new AudioPlayer(recorder)
document
  .getElementById('play')
  .addEventListener('click', () => audioPlayer.playAudioFile())
document
  .getElementById('pause')
  .addEventListener('click', () => audioPlayer.pauseAudioFile())
document
  .getElementById('restart')
  .addEventListener('click', () => audioPlayer.restartAudioFile())
document.getElementById('load').addEventListener('click', async () => {
  await audioPlayer.updateAudioFile()
})
document.getElementById('prev-file').addEventListener('click', async () => {
  await audioPlayer.playPrevFile()
})
document.getElementById('next-file').addEventListener('click', async () => {
  await audioPlayer.playNextFile()
})
document.getElementById('vol-slider').addEventListener('input', (event) => {
  audioPlayer.setVolume(event.target.value)
  recorder.setVolume(event.target.value)
})
document
  .getElementById('play-recording')
  .addEventListener('click', async () => {
    await recorder.playRecordedAudio()
  })

audioPlayer.waveSurfer.on('finish', async () => await recorder.onAudioFinish())

// Create regions for each non-silent part of the audio
audioPlayer.waveSurfer.on('decode', async (duration) => {
  const decodedData = audioPlayer.waveSurfer.getDecodedData()
  if (decodedData) {
    console.log(decodedData)
    const regions = extractRegions(decodedData.getChannelData(0), duration)

    // Add regions to the waveform
    regions.forEach((region, index) => {
      audioPlayer.wsRegions.addRegion({
        start: region.start,
        end: region.end,
        content: index.toString(),
        drag: false,
        resize: false,
      })
    })

    const syllables = await smoothAndDetectSyllables(
      decodedData.getChannelData(0),
      decodedData.sampleRate
    )

    const blob = new Blob([syllables], { type: 'audio/wav' })
    console.log(blob)
    const url = URL.createObjectURL(blob)
    // console.log(e.data, blob);
    await recorder.recordedWaveSurfer.load(url)

    if (syllables.length < 30) {
      for (let syllable of syllables) {
        console.log(`Syllable: ${syllable}`)
      }
    } else console.log('syllables.length:', syllables.length)
  }
})

// Play a region on click
let activeRegion = null
audioPlayer.wsRegions.on('region-clicked', (region, e) => {
  e.stopPropagation()
  region.play()
  activeRegion = region
})
audioPlayer.waveSurfer.on('timeupdate', (currentTime) => {
  // When the end of the region is reached
  if (activeRegion && currentTime >= activeRegion.end) {
    // Stop playing
    audioPlayer.waveSurfer.pause()
    activeRegion = null
  }
})
