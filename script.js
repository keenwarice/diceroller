const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const text = document.getElementById("text");
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const loader = new THREE.TextureLoader();
const spaceTexture = loader.load('space.png', (texture) => {
    texture.encoding = THREE.sRGBEncoding;
    scene.background = texture;
});
const environmentLight = new THREE.HemisphereLight(0xffffff, 0x444444, 5.5);
scene.add(environmentLight);
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);
const diceTextures = [
    loader.load('face1.png'),loader.load('face2.png'),loader.load('face3.png'),loader.load('face4.png'),loader.load('face5.png'),loader.load('face6.png')
];
const materials = [
    new THREE.MeshStandardMaterial({ map: diceTextures[0], metalness: 0.8, roughness: 0.2 }),new THREE.MeshStandardMaterial({ map: diceTextures[1], metalness: 0.8, roughness: 0.2 }),new THREE.MeshStandardMaterial({ map: diceTextures[2], metalness: 0.8, roughness: 0.2 }),new THREE.MeshStandardMaterial({ map: diceTextures[3], metalness: 0.8, roughness: 0.2 }),new THREE.MeshStandardMaterial({ map: diceTextures[4], metalness: 0.8, roughness: 0.2 }),new THREE.MeshStandardMaterial({ map: diceTextures[5], metalness: 0.8, roughness: 0.2 }),
];
const diceGeometry = new THREE.RoundedBoxGeometry(1, 1, 1, 10, 0.2);
diceGeometry.groupsNeedUpdate = true;
diceGeometry.groups.forEach((group, index) => {
    group.materialIndex = index % 6;
});
const dice = new THREE.Mesh(diceGeometry, materials);
scene.add(dice);
const plateTexture = loader.load('burger.png', (texture) => {
    texture.encoding = THREE.sRGBEncoding;

});
const plateMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: plateTexture,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.3,
    metalness: 0.2,
    roughness: 0.5
});
const plateGeometry = new THREE.PlaneGeometry(10, 10);
const plate = new THREE.Mesh(plateGeometry, plateMaterial);
plate.rotation.x = -Math.PI / 2;
scene.add(plate);
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
const diceBody = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
});
diceBody.position.set(0, 2.5, 0);
world.addBody(diceBody);
const plateBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Plane(),
});
plateBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(plateBody);
camera.position.set(5, 5, 10);
camera.lookAt(0, 0, 0);
const clock = new THREE.Clock();
let isDiceRolling = false;
let isDiceStopped = false;
let floatOffset = 0;
function smoothMoveCamera(targetPosition, targetLookAt, duration) {
    const startPosition = camera.position.clone();
    const startLookAt = new THREE.Vector3();
    camera.getWorldDirection(startLookAt);
    startLookAt.add(camera.position);
    const startTime = performance.now();
    function update() {
        const elapsedTime = (performance.now() - startTime) / 1000;
        const t = Math.min(elapsedTime / duration, 1);
        camera.position.lerpVectors(startPosition, targetPosition, t);
        const currentLookAt = startLookAt.clone().lerp(targetLookAt, t);
        camera.lookAt(currentLookAt);
        if (t < 1) {
            requestAnimationFrame(update);
        }
    }
    
    update();
}
const animate = () => {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    world.step(1 / 60, delta);
    if (!isDiceRolling) {
        floatOffset += delta;
        dice.position.y = 2.5 + Math.sin(floatOffset * 2) * 0.1;
        dice.rotation.y += delta * 0.5;
        dice.rotation.x += delta * 0.3;
    } else {
        dice.position.copy(diceBody.position);
        dice.quaternion.copy(diceBody.quaternion);
        const velocity = diceBody.velocity.length();
        const angularVelocity = diceBody.angularVelocity.length();
        if (velocity < 0.05 && angularVelocity < 0.05) {
            if (!isDiceStopped) {
                isDiceStopped = true;
                setTimeout(() => {
                    smoothMoveCamera(
                        new THREE.Vector3(dice.position.x, dice.position.y + 2, dice.position.z + 2),
                        dice.position.clone(),
                        1
                    );
                }, 500);
            }
        }
    }
    renderer.render(scene, camera);
};
animate();
window.addEventListener('click', () => {
    if (!isDiceRolling) {
        isDiceRolling = true;
        text.style.display = 'none';
        diceBody.velocity.set(Math.random() * 10 - 5, Math.random() * 5 + 5, Math.random() * 10 - 5);
        diceBody.angularVelocity.set(Math.random() * 10, Math.random() * 10, Math.random() * 10);
    }
});