// ---------- HERO 3D SCENE ----------
const canvas = document.getElementById('hero-canvas');
const wrap = canvas.parentElement;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
camera.position.z = 7;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(wrap.clientWidth, wrap.clientHeight);

// Signature shape: wireframe icosahedron that "compiles" into place
const geo = new THREE.IcosahedronGeometry(2.1, 1);
const edges = new THREE.EdgesGeometry(geo);
const mat = new THREE.LineBasicMaterial({ color: 0xe0925a, transparent: true, opacity: 0.9 });
const wireframe = new THREE.LineSegments(edges, mat);
scene.add(wireframe);

// inner faint solid for depth
const solidMat = new THREE.MeshBasicMaterial({ color: 0x161f35, transparent: true, opacity: 0.35 });
const solid = new THREE.Mesh(geo, solidMat);
scene.add(solid);

// accent vertex points
const ptsMat = new THREE.PointsMaterial({ color: 0x3fb8ae, size: 0.06 });
const pts = new THREE.Points(geo, ptsMat);
scene.add(pts);

// ambient particle field (depth / atmosphere)
const starGeo = new THREE.BufferGeometry();
const starCount = 180;
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  starPos[i*3] = (Math.random()-0.5)*16;
  starPos[i*3+1] = (Math.random()-0.5)*16;
  starPos[i*3+2] = (Math.random()-0.5)*16 - 3;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({ color: 0x33415c, size: 0.035 });
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

// -------- assembly animation (fragments fly in) --------
const targetScale = 1;
wireframe.scale.setScalar(0.001);
solid.scale.setScalar(0.001);
pts.scale.setScalar(0.001);
wireframe.rotation.set(Math.random()*6, Math.random()*6, Math.random()*6);

let assembleProgress = 0;
const assembleDuration = 1400; // ms
let assembleStart = null;

// -------- interaction state --------
let dragging = false, lastX = 0, lastY = 0;
let rotVelX = 0.002, rotVelY = 0.0028;
let targetRotX = 0.3, targetRotY = 0;

canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener('pointerup', () => dragging = false);
window.addEventListener('pointermove', e => {
  if (!dragging) return;
  const dx = e.clientX - lastX, dy = e.clientY - lastY;
  targetRotY += dx * 0.005;
  targetRotX += dy * 0.005;
  lastX = e.clientX; lastY = e.clientY;
});

function easeOutBack(t){
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function animate(now){
  requestAnimationFrame(animate);
  if (assembleStart === null) assembleStart = now;
  const elapsed = now - assembleStart;
  if (assembleProgress < 1){
    assembleProgress = Math.min(elapsed / assembleDuration, 1);
    const eased = easeOutBack(assembleProgress);
    wireframe.scale.setScalar(Math.max(eased,0.001));
    solid.scale.setScalar(Math.max(eased,0.001));
    pts.scale.setScalar(Math.max(eased,0.001));
  }

  if (!dragging){
    targetRotY += rotVelY * (assembleProgress); // idle spin once assembled
    targetRotX += Math.sin(now*0.0002)*0.0003;
  }
  wireframe.rotation.y += (targetRotY - wireframe.rotation.y) * 0.08;
  wireframe.rotation.x += (targetRotX - wireframe.rotation.x) * 0.08;
  solid.rotation.copy(wireframe.rotation);
  pts.rotation.copy(wireframe.rotation);

  stars.rotation.y += 0.0003;

  renderer.render(scene, camera);
}
requestAnimationFrame(animate);

function onResize(){
  camera.aspect = wrap.clientWidth / wrap.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(wrap.clientWidth, wrap.clientHeight);
}
window.addEventListener('resize', onResize);

// ---------- SCROLL REVEAL ----------
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ---------- PROJECT CARD TILT ----------
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left)/r.width - 0.5;
    const y = (e.clientY - r.top)/r.height - 0.5;
    card.style.transform = `perspective(800px) rotateX(${-y*3}deg) rotateY(${x*3}deg) translateY(-2px)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});