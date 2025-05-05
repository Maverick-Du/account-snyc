import ReactDOM from "react-dom";

const { EcisRenderer, init } = ecissdk;
// React模板 初始化
const renderer = new EcisRenderer({ type: "React17", library: ReactDOM });

const sdk = init({ renderer });

export default sdk;
