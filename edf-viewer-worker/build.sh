wasm-pack build --release --target=web
rm -rf ../edf-viewer-app/public/assembly
cp -a  ./pkg/. ../edf-viewer-app/public/assembly/