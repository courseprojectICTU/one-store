'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCcw, Play, Pause, RefreshCw } from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { COLORS } from '@/constants';

interface Sneaker3DViewerProps {
  modelUrl?: string;
  className?: string;
  height?: string | number;
}

export default function Sneaker3DViewer({
  modelUrl = '/models/nike_air_jordan_1.glb',
  className = '',
  height = 520,
}: Sneaker3DViewerProps) {
  const { dict } = useShop();
  const v3d = dict.common.viewer_3d;
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const initialCameraPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 5));

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  // Toggle Auto Rotation
  const toggleAutoRotate = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !controlsRef.current.autoRotate;
      setIsAutoRotating(controlsRef.current.autoRotate);
    }
  }, []);

  // Reset Camera View
  const resetView = useCallback(() => {
    if (controlsRef.current && cameraRef.current) {
      cameraRef.current.position.copy(initialCameraPos.current);
      controlsRef.current.target.set(0, -0.15, 0);
      controlsRef.current.update();
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup - higher angle to look down slightly and center the sneaker
    const width = container.clientWidth || 600;
    const heightPx = container.clientHeight || 520;
    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 100);
    camera.position.set(3.0, 2.2, 4.2);
    cameraRef.current = camera;
    initialCameraPos.current.copy(camera.position);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls (Interactive Orbit, Zoom, Pan)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 1.5;
    controls.maxDistance = 8.0;
    controls.enablePan = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.3;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't flip below ground
    controls.target.set(0, -0.15, 0);
    controlsRef.current = controls;

    // 5. Studio Lighting for Sneaker Showcase
    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    // Key Light (Front top right)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    // Fill Light (Front top left)
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.4);
    fillLight.position.set(-5, 4, 3);
    scene.add(fillLight);

    // Rim Light (Back light for edge contrast)
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.8);
    rimLight.position.set(0, 5, -6);
    scene.add(rimLight);

    // Red Accent Spot/Point Light (Black & Red Sneaker Aesthetics)
    const redAccent = new THREE.PointLight(0xe11d48, 3.5, 12);
    redAccent.position.set(-2, -1, 3);
    scene.add(redAccent);

    const redAccentBack = new THREE.PointLight(0xff3355, 2.8, 12);
    redAccentBack.position.set(2, 2, -3);
    scene.add(redAccentBack);

    // 6. GLTF Loader
    const loader = new GLTFLoader();
    let currentModel: THREE.Group | null = null;

    setLoading(true);
    setProgress(0);
    setError(null);

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        currentModel = model;

        // Auto center and scale model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Center the geometry and adjust vertical focal center
        model.position.x = -center.x;
        model.position.y = -center.y - (size.y * 0.08);
        model.position.z = -center.z;

        // Auto scale to fit comfortably and centered in view
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const scale = 1.95 / maxDim;
          model.scale.setScalar(scale);
        }

        // Slight aesthetic tilt for sneaker dynamic display
        model.rotation.y = THREE.MathUtils.degToRad(-25);

        // Enhance material properties
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.roughness = Math.max(mat.roughness, 0.35);
              mat.metalness = Math.min(mat.metalness, 0.4);
              mat.needsUpdate = true;
            }
          }
        });

        scene.add(model);
        setLoading(false);
      },
      (xhr) => {
        if (xhr.total > 0) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100);
          setProgress(pct);
        } else if (xhr.loaded > 0) {
          // Fallback if content-length is missing
          const approxTotal = 70921024; // 70.9MB
          const pct = Math.min(99, Math.round((xhr.loaded / approxTotal) * 100));
          setProgress(pct);
        }
      },
      (err) => {
        console.error('Failed to load 3D GLB model:', err);
        setError(v3d.load_error);
        setLoading(false);
      },
    );

    // 7. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 8. Handle Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      if (currentModel) scene.remove(currentModel);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl]);

  return (
    <div
      className={`sneaker-3d-wrapper ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: '24px',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 50%, rgba(225, 29, 72, 0.16) 0%, rgba(10, 10, 14, 0.98) 75%), #0a0a0d',
        border: '1px solid rgba(225, 29, 72, 0.35)',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(225, 29, 72, 0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Three.js Canvas Container */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
          cursor: loading ? 'wait' : 'grab',
        }}
        onMouseDown={(e) => {
          if (e.currentTarget) e.currentTarget.style.cursor = 'grabbing';
        }}
        onMouseUp={(e) => {
          if (e.currentTarget) e.currentTarget.style.cursor = 'grab';
        }}
      />

      {/* Interactive Controls Bar (Bottom) */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          right: '16px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(10, 10, 14, 0.82)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '14px',
          padding: '8px 14px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={toggleAutoRotate}
            aria-label={v3d.toggle_autorotate_aria}
            title={v3d.toggle_autorotate_title}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: isAutoRotating ? 'rgba(225, 29, 72, 0.25)' : 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${isAutoRotating ? COLORS.red.primary : 'rgba(255, 255, 255, 0.15)'}`,
              color: '#ffffff',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {isAutoRotating ? <Pause size={12} /> : <Play size={12} />}
            <span>{isAutoRotating ? v3d.stop_rotate : v3d.start_rotate}</span>
          </button>

          <button
            type="button"
            onClick={resetView}
            aria-label={v3d.reset_view_aria}
            title={v3d.reset_view_title}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#d4d4d8',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <RefreshCw size={12} />
            <span>{v3d.default_angle}</span>
          </button>
        </div>

        <span
          style={{
            fontSize: '11px',
            color: '#a1a1aa',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>{v3d.instructions}</span>
        </span>
      </div>

      {/* Loading Overlay with Progress Bar */}
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(10, 10, 14, 0.94)',
            backdropFilter: 'blur(10px)',
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '24px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '3px solid rgba(225, 29, 72, 0.2)',
              borderTopColor: COLORS.red.primary,
              animation: 'spin 1s linear infinite',
            }}
          />

          <div style={{ textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
              {v3d.loading_title}
            </h4>
            <span style={{ fontSize: '12px', color: '#ff8097', fontWeight: 600 }}>
              {progress > 0 ? `${progress}%` : v3d.loading_pbr}
            </span>
          </div>

          {/* Progress Bar Track */}
          <div
            style={{
              width: '220px',
              height: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '9999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.max(5, progress)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #e11d48, #ff4d6d)',
                borderRadius: '9999px',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(10, 10, 14, 0.95)',
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            color: '#ff4d6d',
          }}
        >
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>{error}</p>
        </div>
      )}
    </div>
  );
}
