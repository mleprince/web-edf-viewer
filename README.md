# web-edf-viewer
The aims of this project is to use and see limitations of :
* [File Api](https://developer.mozilla.org/en-US/docs/Web/API/File) to read a local EDF File
* ~~[Sound api](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) to apply filters and montages to the signals~~ => see below
* [AssemblyScript](https://github.com/AssemblyScript/assemblyscript) Apply filters and montages to the signals
* [VueJS](https://vuejs.org/) First time I will use this framework


## Why we cannot use WebAudio
It thought it will be possible to use WebAudio in the case of an ExG Viewer. This API provide all the components used by a viewer : IIR Filtering, Gain and combination of multiples signals ( montages ). However, this API is used for Audio files and Chromium has limitation about the sampling rate of the signal (between 3000Hz and 384000Hz) : 
```
signalTransormer.ts:10 Uncaught DOMException: Failed to execute 'createBuffer' on 'BaseAudioContext': The sample rate provided (100) is outside the range [3000, 384000].
```







