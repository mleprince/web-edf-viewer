wasm-pack build --release --target=web

rm -rf ../app/public/assembly
mkdir ../app/public/assembly
cp -a  ./pkg/edf_viewer_worker_bg.wasm ../app/public/assembly/