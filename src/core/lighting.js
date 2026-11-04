import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/** Soft sun filtering down through the canopy, a green bounce from the leaves, a golden point light for the mould. */
export function createLighting(renderer, scene) {
  const hemi = new THREE.HemisphereLight(0xdfffe0, 0x4a5a30, 0.55); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0c8, 2.5); sun.position.set(-16, 26, 14); sun.target.position.set(0, 2, 0);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -24; sc.right = 24; sc.top = 24; sc.bottom = -24; sc.near = 4; sc.far = 100; sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.03; sc.updateProjectionMatrix();
  scene.add(sun); scene.add(sun.target);
  const fill = new THREE.DirectionalLight(0x9fd8a8, 0.5); fill.position.set(14, 10, -12); fill.target.position.set(0, 2, 0); scene.add(fill); scene.add(fill.target);
  const glow = new THREE.PointLight(0xffd34a, 0, 9, 1.6); scene.add(glow);                         // the mould's light on the sloth
  const pmrem = new THREE.PMREMGenerator(renderer), envScene = new RoomEnvironment(); scene.environment = pmrem.fromScene(envScene, 0.035).texture; scene.environmentIntensity = 0.25; pmrem.dispose(); envScene.dispose?.();
  return { hemi, sun, fill, lamps: [], glow };
}
