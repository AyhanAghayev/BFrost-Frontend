"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { MOCK_CLUBS } from "@/lib/mock/clubs";

const CATEGORY_COLORS: Record<string, number> = {
  Technology:   0x2e5bff,
  Arts:         0x8b5cf6,
  Business:     0xf59e0b,
  Academic:     0x6366f1,
  Volunteering: 0x10b981,
  Gaming:       0xef4444,
};

const CLUB_SPHERE_INDICES = [0, 20, 40, 60, 80, 100];

export default function NetworkGlobe() {
  const mountRef   = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount   = mountRef.current;
    const tooltip = tooltipRef.current;
    if (!mount || !tooltip) return;

    const w = mount.clientWidth;
    const h = mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.cursor = "grab";
    mount.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.z = 5;

    const N = 120;
    const RADIUS = 1.8;
    const gr = (1 + Math.sqrt(5)) / 2;
    const allPos: [number, number, number][] = [];

    for (let i = 0; i < N; i++) {
      const theta = 2 * Math.PI * i / gr;
      const cosP  = 1 - 2 * (i + 0.5) / N;
      const sinP  = Math.sqrt(Math.max(0, 1 - cosP * cosP));
      allPos.push([sinP * Math.cos(theta) * RADIUS, sinP * Math.sin(theta) * RADIUS, cosP * RADIUS]);
    }

    const clubPosArr   = new Float32Array(6 * 3);
    const clubColorArr = new Float32Array(6 * 3);

    CLUB_SPHERE_INDICES.forEach((sIdx, ci) => {
      const [x, y, z] = allPos[sIdx];
      clubPosArr[ci * 3]     = x;
      clubPosArr[ci * 3 + 1] = y;
      clubPosArr[ci * 3 + 2] = z;
      const col = new THREE.Color(CATEGORY_COLORS[MOCK_CLUBS[ci]?.category] ?? 0x2e5bff);
      clubColorArr[ci * 3]     = col.r;
      clubColorArr[ci * 3 + 1] = col.g;
      clubColorArr[ci * 3 + 2] = col.b;
    });

    const clubGeo = new THREE.BufferGeometry();
    clubGeo.setAttribute("position", new THREE.BufferAttribute(clubPosArr, 3));
    clubGeo.setAttribute("color",    new THREE.BufferAttribute(clubColorArr, 3));
    const clubMat = new THREE.PointsMaterial({
      size: 0.18, vertexColors: true, transparent: true, opacity: 1, sizeAttenuation: true,
    });
    const clubPoints = new THREE.Points(clubGeo, clubMat);

    const studentSet = new Set(CLUB_SPHERE_INDICES);
    const studentArr: number[] = [];
    allPos.forEach(([x, y, z], i) => { if (!studentSet.has(i)) studentArr.push(x, y, z); });

    const studentGeo = new THREE.BufferGeometry();
    studentGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(studentArr), 3));
    const studentMat = new THREE.PointsMaterial({
      size: 0.035, color: 0xffffff, transparent: true, opacity: 0.3, sizeAttenuation: true,
    });
    const studentPoints = new THREE.Points(studentGeo, studentMat);

    const edgeArr: number[] = [];
    const edgeSet = new Set<string>();
    for (let i = 0; i < N; i++) {
      const dists: { j: number; d2: number }[] = [];
      for (let j = 0; j < N; j++) {
        if (i === j) continue;
        const [x1,y1,z1] = allPos[i], [x2,y2,z2] = allPos[j];
        dists.push({ j, d2: (x1-x2)**2 + (y1-y2)**2 + (z1-z2)**2 });
      }
      dists.sort((a, b) => a.d2 - b.d2);
      for (let k = 0; k < 2; k++) {
        const { j } = dists[k];
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          const [x1,y1,z1] = allPos[i], [x2,y2,z2] = allPos[j];
          edgeArr.push(x1,y1,z1, x2,y2,z2);
        }
      }
    }

    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(edgeArr), 3));
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x2e5bff, transparent: true, opacity: 0.13 });
    const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);

    const clubNeighborPositions: [number, number, number][][] = [];
    const N_SPOKES = 6;
    CLUB_SPHERE_INDICES.forEach((sIdx) => {
      const [cx, cy, cz] = allPos[sIdx];
      const ranked = allPos
        .map(([x, y, z], i) => ({ pos: [x, y, z] as [number,number,number], d2: (cx-x)**2+(cy-y)**2+(cz-z)**2, i }))
        .filter(({ i }) => !studentSet.has(i) === false) // only student nodes as spokes
        .sort((a, b) => a.d2 - b.d2)
        .slice(0, N_SPOKES)
        .map(({ pos }) => pos);
      clubNeighborPositions.push(ranked);
    });

    const hlEdgeData = new Float32Array(N_SPOKES * 2 * 3);
    const hlEdgeGeo  = new THREE.BufferGeometry();
    hlEdgeGeo.setAttribute("position", new THREE.BufferAttribute(hlEdgeData, 3));
    const hlEdgeMat  = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
    const hlEdgeLines = new THREE.LineSegments(hlEdgeGeo, hlEdgeMat);

    const hlDotPos = new Float32Array([0, 0, 0]);
    const hlDotGeo = new THREE.BufferGeometry();
    hlDotGeo.setAttribute("position", new THREE.BufferAttribute(hlDotPos, 3));
    const hlDotMat = new THREE.PointsMaterial({ size: 0.32, color: 0xffffff, transparent: true, opacity: 0, sizeAttenuation: true });
    const hlDotPoints = new THREE.Points(hlDotGeo, hlDotMat);

    const group = new THREE.Group();
    group.add(edgeLines, studentPoints, clubPoints, hlEdgeLines, hlDotPoints);
    scene.add(group);

    const raycaster = new THREE.Raycaster();
    (raycaster.params as { Points?: { threshold: number } }).Points = { threshold: 0.18 };
    const mouse = new THREE.Vector2(-10, -10);
    let hoveredClubIdx = -1;

    let isDragging   = false;
    let prevMouse    = { x: 0, y: 0 };
    let velX         = 0;
    let velY         = 0;
    const AUTO_ROT   = 0.0025;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse  = { x: e.clientX, y: e.clientY };
      velX = 0; velY = 0;
      renderer.domElement.style.cursor = "grabbing";
    };
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - prevMouse.x;
        const dy = e.clientY - prevMouse.y;
        group.rotation.y += dx * 0.008;
        group.rotation.x += dy * 0.008;
        velY = dx * 0.008;
        velX = dy * 0.008;
        prevMouse = { x: e.clientX, y: e.clientY };
      } else {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width)  *  2 - 1;
        mouse.y = ((e.clientY - rect.top)  / rect.height) * -2 + 1;
      }
    };
    const onMouseUp = () => {
      isDragging = false;
      renderer.domElement.style.cursor = "grab";
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      isDragging = true;
      prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      velX = 0; velY = 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - prevMouse.x;
      const dy = e.touches[0].clientY - prevMouse.y;
      group.rotation.y += dx * 0.008;
      group.rotation.x += dy * 0.008;
      velY = dx * 0.008;
      velX = dy * 0.008;
      prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => { isDragging = false; };

    const onResize = () => {
      const nw = mount.clientWidth, nh = mount.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };

    renderer.domElement.addEventListener("mousedown",  onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: true });
    renderer.domElement.addEventListener("touchmove",  onTouchMove,  { passive: true });
    renderer.domElement.addEventListener("touchend",   onTouchEnd);
    window.addEventListener("resize",    onResize);

    let frame: number;

    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = Date.now();

      if (!isDragging) {
        group.rotation.y += velY + AUTO_ROT;
        group.rotation.x += velX;
        velX *= 0.92;
        velY *= 0.92;
      }

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(clubPoints);
      const newHovered = hits.length > 0 ? (hits[0].index ?? -1) : -1;

      if (newHovered !== hoveredClubIdx) {
        hoveredClubIdx = newHovered;
        renderer.domElement.style.cursor = (isDragging ? "grabbing" : newHovered >= 0 ? "pointer" : "grab");
      }

      if (hoveredClubIdx >= 0) {
        const [cx, cy, cz] = [
          clubPosArr[hoveredClubIdx * 3],
          clubPosArr[hoveredClubIdx * 3 + 1],
          clubPosArr[hoveredClubIdx * 3 + 2],
        ];
        hlDotPos[0] = cx; hlDotPos[1] = cy; hlDotPos[2] = cz;
        hlDotGeo.attributes.position.needsUpdate = true;
        hlDotMat.opacity = 0.35 + 0.25 * Math.sin(t * 0.005);

        const neighbors = clubNeighborPositions[hoveredClubIdx];
        neighbors.forEach((p, i) => {
          hlEdgeData[i * 6]     = cx;   hlEdgeData[i * 6 + 1] = cy;   hlEdgeData[i * 6 + 2] = cz;
          hlEdgeData[i * 6 + 3] = p[0]; hlEdgeData[i * 6 + 4] = p[1]; hlEdgeData[i * 6 + 5] = p[2];
        });
        hlEdgeGeo.attributes.position.needsUpdate = true;
        hlEdgeMat.opacity = 0.45;

        const localPos  = new THREE.Vector3(cx, cy, cz);
        const worldPos  = localPos.applyMatrix4(group.matrixWorld);
        const projected = worldPos.project(camera);
        const rect      = renderer.domElement.getBoundingClientRect();
        const sx = (projected.x *  0.5 + 0.5) * rect.width;
        const sy = (projected.y * -0.5 + 0.5) * rect.height;

        const club = MOCK_CLUBS[hoveredClubIdx];
        if (club && tooltip) {
          tooltip.style.transform   = `translate(${sx + 16}px, ${sy - 44}px)`;
          tooltip.style.opacity     = "1";
          tooltip.style.visibility  = "visible";
          tooltip.innerHTML = `
            <span style="font-weight:700;font-size:12px;color:#fff;display:block;margin-bottom:2px">${club.name}</span>
            <span style="font-size:11px;color:rgba(255,255,255,0.6)">${club.memberCount.toLocaleString()} members · ${club.category}</span>
          `;
        }
      } else {
        hlDotMat.opacity  = 0;
        hlEdgeMat.opacity = 0;
        if (tooltip) {
          tooltip.style.opacity    = "0";
          tooltip.style.visibility = "hidden";
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      renderer.domElement.removeEventListener("mousedown",  onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
      renderer.domElement.removeEventListener("touchstart", onTouchStart);
      renderer.domElement.removeEventListener("touchmove",  onTouchMove);
      renderer.domElement.removeEventListener("touchend",   onTouchEnd);
      window.removeEventListener("resize",    onResize);
      [clubGeo, studentGeo, edgeGeo, hlEdgeGeo, hlDotGeo].forEach(g => g.dispose());
      [clubMat, studentMat, edgeMat, hlEdgeMat, hlDotMat].forEach(m => m.dispose());
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div ref={mountRef} className="relative w-full h-full" style={{ userSelect: "none" }}>
      <div
        ref={tooltipRef}
        className="absolute top-0 left-0 pointer-events-none z-10 px-3 py-2 rounded-lg"
        style={{
          background: "rgba(0,10,30,0.75)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(10px)",
          opacity: 0,
          visibility: "hidden",
          transition: "opacity 0.15s ease",
          fontFamily: "var(--font-inter)",
          willChange: "transform",
          whiteSpace: "nowrap",
        }}
      />
    </div>
  );
}