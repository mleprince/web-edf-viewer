cargo build --target wasm32-unknown-unknown --release
wasm-pack build --release --target=web
rm -rf ../edf-viewer-app/public/assembly
cp -a  ./pkg/. ../edf-viewer-app/public/assembly/