"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    THREE?: any;
  }
}

const PODIUM_DATA = [
  { name: "Marcus Webb",  avatar: "MW", flyers: 710, color: "#c0c0c0", height: 1.4, rank: 2, pos: -1.8 },
  { name: "Priya Kapoor", avatar: "PK", flyers: 820, color: "#f5c842", height: 1.9, rank: 1, pos:  0   },
  { name: "Sofia Reyes",  avatar: "SR", flyers: 640, color: "#cd7f32", height: 1.1, rank: 3, pos:  1.8 },
];

const THREE_SRC = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

function loadThreeJs() {
  if (window.THREE) {
    return Promise.resolve(window.THREE);
  }

  return new Promise<any>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${THREE_SRC}"]`) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => resolve(window.THREE), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Three.js")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = THREE_SRC;
    script.async = true;
    script.onload = () => resolve(window.THREE);
    script.onerror = () => reject(new Error("Failed to load Three.js"));
    document.head.appendChild(script);
  });
}

export default function PodiumCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    let animId: number;
    let cancelled = false;
    let renderer: any;
    let onResize: (() => void) | undefined;

    void loadThreeJs()
      .then((THREE) => {
        if (!THREE || cancelled) return;

        const W = el.clientWidth;
        const H = el.clientHeight || 360;

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
        camera.position.set(0, 3.2, 9);
        camera.lookAt(0, 0.5, 0);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        el.appendChild(renderer.domElement);

        const ambient = new THREE.AmbientLight(0xfff8e0, 0.7);
        scene.add(ambient);

        const dirLight = new THREE.DirectionalLight(0xfff4c2, 1.4);
        dirLight.position.set(5, 10, 6);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.set(1024, 1024);
        scene.add(dirLight);

        const fillLight = new THREE.DirectionalLight(0xffeaa0, 0.4);
        fillLight.position.set(-5, 3, -4);
        scene.add(fillLight);

        const floorGeo = new THREE.PlaneGeometry(14, 8);
        const floorMat = new THREE.MeshLambertMaterial({ color: 0xfdf8e8, transparent: true, opacity: 0 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.01;
        floor.receiveShadow = true;
        scene.add(floor);

        const starGeo = new THREE.BufferGeometry();
        const starCount = 120;
        const starPos = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount * 3; i++) {
          starPos[i] = (Math.random() - 0.5) * 20;
        }
        starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
        const starMat = new THREE.PointsMaterial({ color: 0xf5c842, size: 0.06, transparent: true, opacity: 0.5 });
        scene.add(new THREE.Points(starGeo, starMat));

        const avatarMeshes: any[] = [];
        const crownMeshes: any[] = [];

        PODIUM_DATA.forEach((p) => {
          const col = new THREE.Color(p.color);
          const w = 1.5;
          const d = 1.5;

          const geo = new THREE.BoxGeometry(w, p.height, d);
          const mat = new THREE.MeshLambertMaterial({ color: col });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(p.pos, p.height / 2, 0);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          scene.add(mesh);

          const capGeo = new THREE.BoxGeometry(w + 0.08, 0.07, d + 0.08);
          const capMat = new THREE.MeshLambertMaterial({ color: col.clone().multiplyScalar(1.15) });
          const cap = new THREE.Mesh(capGeo, capMat);
          cap.position.set(p.pos, p.height + 0.035, 0);
          scene.add(cap);

          const avatarGeo = new THREE.SphereGeometry(0.42, 32, 32);
          const avatarMat = new THREE.MeshLambertMaterial({ color: col.clone().multiplyScalar(0.95) });
          const avatar = new THREE.Mesh(avatarGeo, avatarMat);
          avatar.position.set(p.pos, p.height + 0.54, 0);
          avatar.castShadow = true;
          scene.add(avatar);
          avatarMeshes.push(avatar);

          if (p.rank === 1) {
            const crownGeo = new THREE.ConeGeometry(0.18, 0.32, 5);
            const crownMat = new THREE.MeshLambertMaterial({ color: 0xf5c842 });
            const crown = new THREE.Mesh(crownGeo, crownMat);
            crown.position.set(p.pos, p.height + 1.18, 0);
            scene.add(crown);
            crownMeshes.push(crown);
          }

          const ringGeo = new THREE.TorusGeometry(0.24, 0.04, 8, 32);
          const ringMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.position.set(p.pos, p.height / 2, d / 2 + 0.01);
          ring.rotation.x = Math.PI / 2;
          scene.add(ring);
        });

        const confettiColors = [0xf5c842, 0xff6b6b, 0x4ecdc4, 0xa8e6cf, 0xffd93d];
        const confettiGroup = new THREE.Group();
        for (let i = 0; i < 40; i++) {
          const size = 0.06 + Math.random() * 0.08;
          const geo = new THREE.BoxGeometry(size, size * 0.3, size * 0.1);
          const mat = new THREE.MeshLambertMaterial({ color: confettiColors[Math.floor(Math.random() * confettiColors.length)] });
          const c = new THREE.Mesh(geo, mat);
          c.position.set((Math.random() - 0.5) * 7, 0.5 + Math.random() * 4, (Math.random() - 0.5) * 3);
          c.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
          (c as any).speed = 0.005 + Math.random() * 0.01;
          (c as any).rotSpeed = (Math.random() - 0.5) * 0.04;
          confettiGroup.add(c);
        }
        scene.add(confettiGroup);

        let t = 0;
        const topRank = PODIUM_DATA.find((p) => p.rank === 1);

        function animate() {
          if (cancelled) return;
          animId = requestAnimationFrame(animate);
          t += 0.016;

          avatarMeshes.forEach((a, i) => {
            a.position.y = PODIUM_DATA[i].height + 0.54 + Math.sin(t * 1.2 + i * 1.4) * 0.08;
            a.rotation.y += 0.008;
          });

          crownMeshes.forEach((c) => {
            c.position.y = (topRank?.height ?? 1.9) + 1.18 + Math.sin(t * 1.2) * 0.08;
            c.rotation.y += 0.02;
          });

          confettiGroup.children.forEach((child: any) => {
            child.position.y -= child.speed;
            child.rotation.x += child.rotSpeed;
            child.rotation.z += child.rotSpeed * 0.7;
            if (child.position.y < -0.5) child.position.y = 4.5;
          });

          camera.position.x = Math.sin(t * 0.12) * 1.2;
          camera.lookAt(0, 1, 0);
          renderer.render(scene, camera);
        }
        animate();

        onResize = () => {
          const w = el.clientWidth;
          const h = el.clientHeight || 360;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener("resize", onResize);
      })
      .catch(() => {
        if (!cancelled) {
          el.setAttribute("data-three-error", "true");
        }
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(animId);
      if (onResize) {
        window.removeEventListener("resize", onResize);
      }
      if (renderer) {
        renderer.dispose();
        if (el.contains(renderer.domElement)) {
          el.removeChild(renderer.domElement);
        }
      }
    };
  }, []);

  return (
    <div ref={mountRef} style={{ width: "100%", height: "100%", minHeight: 360, borderRadius: 16 }} />
  );
}
