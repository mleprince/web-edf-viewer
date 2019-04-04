
const buffer = new ArrayBuffer(2*2);

let view = new DataView(buffer);

view.setInt16(0, 456,true);
view.setInt16(2, -4564,true);

console.log(new Uint8Array(buffer));