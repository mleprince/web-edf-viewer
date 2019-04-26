wasm-pack build --release --target=web

rm -rf ../edf-viewer-app/public/assembly
mkdir ../edf-viewer-app/public/assembly
cp -a  ./pkg/edf_viewer_worker_bg.wasm ../edf-viewer-app/public/assembly/