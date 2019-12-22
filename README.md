# EDF Viewer

**!!! Work in progress !!!**

This application display in the browser [EDF files](https://www.edfplus.info/). Basic features are included : filters, gain, montages, zoom

**[Open the App](https://mleprince.github.io/web-edf-viewer/)**

The aims of this project is to use and see limitations of :
* [WebAssembly With Rust](https://rustwasm.github.io/) with crates Wasm_bindgen, web_sys and js_sys :
    * Parse EDF File
    * Apply filters and montages to the signals
    * generate the matrix of pixels of the chart
* [File Api](https://developer.mozilla.org/en-US/docs/Web/API/File) to read a local EDF File. The API is called through WebAssembly using [Rust Crate web_sys](https://rustwasm.github.io/wasm-bindgen/api/web_sys/)
* ~~[Sound api](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) to apply filters and montages to the signals~~ => see below
* [VueJS](https://vuejs.org/) (with VueX and Typescript) First time I will use this framework

# How to build 

```shell script

# compile webAssembly project
./worker/build.sh

# run application
cd ./app
npm run serve
```


# FAQ

## Why we cannot use WebAudio ?
I thought it will be possible to use WebAudio in the case of an ExG Viewer. This API provide all the components used by a viewer : IIR Filtering, Gain and combination of multiples signals ( montages ). However, this API is used for Audio files and Chromium has limitation about the sampling rate of the signal (between 3000Hz and 384000Hz) : 
```
signalTransormer.ts:10 Uncaught DOMException: Failed to execute 'createBuffer' on 'BaseAudioContext': The sample rate provided (100) is outside the range [3000, 384000].
```

### Why using Rust and not [AssemblyScript](https://github.com/AssemblyScript/assemblyscript) as WebAssembly language ?
AssemblyScript was a good candidate because we can use the same language for JS frontend and WASM backend. However the library is yound and lacks of some important features : 
* We cannot call Wasm functions from JS ( and JS function from Wasm) with arguments other than primitive types.The rust crate  Wasm Bindgen has already [this feature](https://rustwasm.github.io/wasm-bindgen/reference/arbitrary-data-with-serde.html).
* There is no builtin fonctions to call Web APIs and DOM API.Wasm Bindgen. The rust crate [web_sys](https://rustwasm.github.io/wasm-bindgen/api/web_sys/) implements bindings for all of these APIs.








