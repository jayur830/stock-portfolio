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

  // sensor.disconnect() 안전 가드
  content = content.replaceAll('sensor.disconnect();', 'if (sensor && typeof sensor.disconnect === "function") { try { sensor.disconnect(); } catch (e) {} }');
  content = content.replaceAll('sensor && sensor.disconnect();', 'if (sensor && typeof sensor.disconnect === "function") { try { sensor.disconnect(); } catch (e) {} }');

  // destroy 함수 내 sensor 초기화 안전 가드
  const safeDestroy = `var destroy = function destroy() {
    if (sensor && typeof sensor.disconnect === "function") {
      try {
        sensor.disconnect();
      } catch (e) {}
    }
    listeners = [];
    sensor = undefined;
    if (element && typeof element.removeAttribute === "function") {
      try {
        element.removeAttribute(_constant.SizeSensorId);
      } catch (e) {}
    }
    whenDestroy && whenDestroy();
  };`;

  if (content.includes('var destroy = function destroy() {')) {
    const destroyRegex = /var destroy = function destroy\(\) \{[\s\S]*?whenDestroy && whenDestroy\(\);\s*\};/;
    if (destroyRegex.test(content)) {
      content = content.replace(destroyRegex, safeDestroy);
    }
  }

  fs.writeFileSync(resizeObserverPath, content, 'utf8');
  console.log('Successfully patched size-sensor resizeObserver.js');
}

// 2. size-sensor dist/size-sensor.min.js 패치
const minJsPath = path.join(projectRoot, 'node_modules/size-sensor/dist/size-sensor.min.js');
if (fs.existsSync(minJsPath)) {
  let content = fs.readFileSync(minJsPath, 'utf8');
  content = content.replaceAll('i.disconnect()', 'i&&i.disconnect&&i.disconnect()');
  content = content.replaceAll('i&&i.disconnect()', 'i&&i.disconnect&&i.disconnect()');
  fs.writeFileSync(minJsPath, content, 'utf8');
  console.log('Successfully patched size-sensor dist/size-sensor.min.js');
}

// 3. size-sensor lib/sensorPool.js 패치 (removeSensor 안전 호출)
const poolPath = path.join(projectRoot, 'node_modules/size-sensor/lib/sensorPool.js');
if (fs.existsSync(poolPath)) {
  let content = fs.readFileSync(poolPath, 'utf8');
  if (content.includes('sensor.destroy();')) {
    content = content.replaceAll('sensor.destroy();', 'if (sensor && typeof sensor.destroy === "function") { try { sensor.destroy(); } catch (e) {} }');
    fs.writeFileSync(poolPath, content, 'utf8');
    console.log('Successfully patched size-sensor sensorPool.js');
  }
}

// 4. size-sensor lib/index.js 패치 (clear 안전 호출)
const indexPath = path.join(projectRoot, 'node_modules/size-sensor/lib/index.js');
if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf8');
  const safeClear = `var clear = function clear(element) {
  try {
    if (!element) return;
    var sensor = (0, _sensorPool.getSensor)(element);
    if (sensor) {
      (0, _sensorPool.removeSensor)(sensor);
    }
  } catch (e) {}
};`;
  if (content.includes('var clear = function clear(element) {')) {
    const clearRegex = /var clear = function clear\(element\) \{[\s\S]*?\(0, _sensorPool\.removeSensor\)\(sensor\);\s*\};/;
    if (clearRegex.test(content)) {
      content = content.replace(clearRegex, safeClear);
      fs.writeFileSync(indexPath, content, 'utf8');
      console.log('Successfully patched size-sensor index.js');
    }
  }
}
