import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 1. size-sensor lib/sensors/resizeObserver.js 패치
const resizeObserverPath = path.join(projectRoot, 'node_modules/size-sensor/lib/sensors/resizeObserver.js');
if (fs.existsSync(resizeObserverPath)) {
  let content = fs.readFileSync(resizeObserverPath, 'utf8');
  if (content.includes('sensor.disconnect();')) {
    content = content.replace('sensor.disconnect();', 'sensor && sensor.disconnect();');
    fs.writeFileSync(resizeObserverPath, content, 'utf8');
    console.log('Successfully patched size-sensor resizeObserver.js');
  }
}

// 2. size-sensor dist/size-sensor.min.js 패치
const minJsPath = path.join(projectRoot, 'node_modules/size-sensor/dist/size-sensor.min.js');
if (fs.existsSync(minJsPath)) {
  let content = fs.readFileSync(minJsPath, 'utf8');
  if (content.includes('i.disconnect()')) {
    content = content.replace('i.disconnect()', 'i&&i.disconnect()');
    fs.writeFileSync(minJsPath, content, 'utf8');
    console.log('Successfully patched size-sensor dist/size-sensor.min.js');
  }
}
