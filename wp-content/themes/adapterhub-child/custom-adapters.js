import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

document.addEventListener("DOMContentLoaded", function () {
  /* =================================
       ADVANCED OPTIONS TOGGLE
    ================================= */
  function toggleAdapterAdvancedOptions() {
    const advancedElement = document.getElementsByClassName(
      "adapter-configurator-advanced",
    )[0];

    const toggle = document.getElementsByClassName(
      "adapter-configurator-advanced-toggle",
    )[0];
    console.log(advancedElement);
    if (advancedElement) {
      advancedElement.classList.toggle("adapter-configurator-advanced-show");
      console.log("toggled", advancedElement);
    }

    if (toggle) {
      toggle.classList.toggle("is-open");
    }
  }

  document.addEventListener("click", function (event) {
    const toggle = event.target.closest(
      ".adapter-configurator-advanced-toggle",
    );

    if (!toggle) {
      return;
    }

    toggleAdapterAdvancedOptions();
  });

  /* =================================
       3D PREVIEW
    ================================= */

  const stage = document.querySelector(".adapter-configurator-3d-stage");

  if (!stage) {
    return;
  }

  /* =================================
       SCENE
    ================================= */

  const scene = new THREE.Scene();

  /* =================================
       CAMERA
    ================================= */

  const camera = new THREE.PerspectiveCamera(
    35,
    stage.clientWidth / stage.clientHeight,
    0.1,
    2000,
  );

  camera.position.set(0, 0, 300);

  /* =================================
       RENDERER
    ================================= */

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  renderer.setSize(stage.clientWidth, stage.clientHeight);

  renderer.outputColorSpace = THREE.SRGBColorSpace;

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  stage.appendChild(renderer.domElement);

  /* =================================
       LIGHTING
    ================================= */

  const ambientLight = new THREE.AmbientLight(0xffffff, 2);

  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 3);

  keyLight.position.set(100, 150, 200);

  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 1.5);

  fillLight.position.set(-150, 50, 100);

  scene.add(fillLight);

  /* =================================
       ADAPTER GROUP
    ================================= */

  const adapterGroup = new THREE.Group();

  scene.add(adapterGroup);

  /* =================================
       MATERIAL
    ================================= */

  const adapterMaterial = new THREE.MeshStandardMaterial({
    color: 0x202020,
    roughness: 0.65,
    metalness: 0.05,
  });

  let adapter = null;

  /* =================================
       READ CONFIGURATION
    ================================= */

  function getValue(selector, fallback) {
    const element = document.querySelector(selector);

    if (!element) {
      return fallback;
    }

    const value = parseFloat(element.value);

    return Number.isFinite(value) ? value : fallback;
  }

  /* =================================
       BUILD ADAPTER
    ================================= */

  function buildAdapter() {
    const width = Math.max(
      20,
      getValue(".adapter-configurator-width-input", 180),
    );

    const height = Math.max(
      20,
      getValue(".adapter-configurator-height-input", 160),
    );

    const thickness = Math.max(
      2,
      getValue(".adapter-configurator-thickness-input", 12),
    );

    const cutout = Math.max(
      5,
      getValue(".adapter-configurator-cutout-input", 145),
    );

    /* -----------------------------
           Prevent invalid cutout
        ----------------------------- */

    const maxCutout = Math.min(width, height) - 8;

    const safeCutout = Math.min(cutout, maxCutout);

    /* -----------------------------
   Outer shape
----------------------------- */

    const shape = new THREE.Shape();

    const shapeSelect = document.querySelector(
      ".adapter-configurator-shape-select",
    );

    const shapeType = shapeSelect ? shapeSelect.value : "round";

    const halfWidth = width / 2;
    const halfHeight = height / 2;

    /* Rectangle */

    if (shapeType === "rectangle") {
      shape.moveTo(-halfWidth, -halfHeight);

      shape.lineTo(halfWidth, -halfHeight);

      shape.lineTo(halfWidth, halfHeight);

      shape.lineTo(-halfWidth, halfHeight);

      shape.closePath();
    } else if (shapeType === "round") {
      /* Round */
      const radius = Math.min(halfWidth, halfHeight);

      shape.absarc(0, 0, radius, 0, Math.PI * 2, false);

      shape.closePath();
    } else if (shapeType === "oval") {
      /* Oval */
      shape.absellipse(0, 0, halfWidth, halfHeight, 0, Math.PI * 2, false, 0);

      shape.closePath();
    }

    /* -----------------------------
           Speaker cutout
        ----------------------------- */

    const hole = new THREE.Path();

    const radius = safeCutout / 2;

    hole.absarc(0, 0, radius, 0, Math.PI * 2, false);

    shape.holes.push(hole);

    /* -----------------------------
   Mounting holes validation
----------------------------- */

    const holesCount = Math.max(
      2,
      Math.round(getValue(".adapter-configurator-holes-count-input", 4)),
    );

    const holeSpacing = Math.max(
      20,
      getValue(".adapter-configurator-hole-spacing-input", 155),
    );

    const mountingHoleRadius = 4;

    const warningElement = document.querySelector(
      ".adapter-configurator-holes-warning",
    );

    /* --------------------------------
   Validate every mounting hole
-------------------------------- */

    let mountingHolesValid = true;

    const mountingRadius = holeSpacing / 2;

    const cutoutRadius = safeCutout / 2;

    const edgeMargin = 1;

    /* --------------------------------
   Check each hole
-------------------------------- */

    for (let i = 0; i < holesCount; i++) {
      const angle = (i / holesCount) * Math.PI * 2 - Math.PI / 2;

      const x = Math.cos(angle) * mountingRadius;

      const y = Math.sin(angle) * mountingRadius;

      /* -----------------------------
       Check speaker cutout overlap
    ----------------------------- */

      const distanceFromCenter = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));

      if (
        distanceFromCenter - mountingHoleRadius <=
        cutoutRadius + edgeMargin
      ) {
        mountingHolesValid = false;
        break;
      }

      /* -----------------------------
       Check adapter boundaries
    ----------------------------- */

      const holeLeft = x - mountingHoleRadius;

      const holeRight = x + mountingHoleRadius;

      const holeBottom = y - mountingHoleRadius;

      const holeTop = y + mountingHoleRadius;

      if (
        holeLeft < -halfWidth + edgeMargin ||
        holeRight > halfWidth - edgeMargin ||
        holeBottom < -halfHeight + edgeMargin ||
        holeTop > halfHeight - edgeMargin
      ) {
        mountingHolesValid = false;
        break;
      }
    }

    /* --------------------------------
   Warning
-------------------------------- */

    if (warningElement) {
      warningElement.classList.toggle(
        "adapter-configurator-holes-warning-show",
        !mountingHolesValid,
      );
    }

    /* --------------------------------
   Create mounting holes
   only when valid
-------------------------------- */

    if (mountingHolesValid) {
      for (let i = 0; i < holesCount; i++) {
        const angle = (i / holesCount) * Math.PI * 2 - Math.PI / 2;

        const x = Math.cos(angle) * mountingRadius;

        const y = Math.sin(angle) * mountingRadius;

        const mountingHole = new THREE.Path();

        mountingHole.absarc(x, y, mountingHoleRadius, 0, Math.PI * 2, false);

        shape.holes.push(mountingHole);
      }
    }

    /* -----------------------------
           3D extrusion
        ----------------------------- */

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,

      bevelEnabled: true,

      bevelThickness: Math.min(1.5, thickness / 4),

      bevelSize: 1.5,

      bevelSegments: 3,

      curveSegments: 64,
    });

    geometry.center();

    /* -----------------------------
           Remove old model
        ----------------------------- */

    if (adapter) {
      adapterGroup.remove(adapter);

      adapter.geometry.dispose();
    }

    /* -----------------------------
           Create new model
        ----------------------------- */

    adapter = new THREE.Mesh(geometry, adapterMaterial);

    adapterGroup.add(adapter);

    /* -----------------------------
           Model rotation
        ----------------------------- */

    adapterGroup.rotation.x = -0.35;
    adapterGroup.rotation.y = 0.35;

    /* -----------------------------
           Fit camera
        ----------------------------- */

    fitCameraToAdapter();
  }

  /* =================================
       CAMERA FIT
    ================================= */

  function fitCameraToAdapter() {
    if (!adapter) {
      return;
    }

    const width = Math.max(
      20,
      getValue(".adapter-configurator-width-input", 180),
    );

    const height = Math.max(
      20,
      getValue(".adapter-configurator-height-input", 160),
    );

    // Calculate the diagonal of the front face.
    const diagonal = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));

    // Radius required to contain the whole face.
    const radius = diagonal / 2;

    const fov = THREE.MathUtils.degToRad(camera.fov);

    const distance = radius / Math.sin(fov / 2);

    // Small safety margin.
    camera.position.z = distance * 1.15;

    camera.lookAt(0, 0, 0);
  }

  /* =================================
       INPUT EVENTS
    ================================= */

  const inputs = [
    ".adapter-configurator-shape-select",

    ".adapter-configurator-width-input",

    ".adapter-configurator-height-input",

    ".adapter-configurator-thickness-input",

    ".adapter-configurator-cutout-input",

    ".adapter-configurator-holes-count-input",

    ".adapter-configurator-hole-spacing-input",
  ];

  inputs.forEach(function (selector) {
    const input = document.querySelector(selector);

    if (!input) {
      return;
    }

    input.addEventListener("input", function () {
      const shapeSelect = document.querySelector(
        ".adapter-configurator-shape-select",
      );

      const widthInput = document.querySelector(
        ".adapter-configurator-width-input",
      );

      const heightInput = document.querySelector(
        ".adapter-configurator-height-input",
      );

      /* -------------------------
               Round = equal dimensions
            ------------------------- */

      if (
        shapeSelect &&
        shapeSelect.value === "round" &&
        widthInput &&
        heightInput
      ) {
        if (input === widthInput) {
          heightInput.value = widthInput.value;
        }

        if (input === heightInput) {
          widthInput.value = heightInput.value;
        }
      }

      buildAdapter();
    });

    input.addEventListener("change", buildAdapter);
  });
  /* =================================
       RESIZE
    ================================= */

  function resize() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;

    camera.aspect = width / height;

    camera.updateProjectionMatrix();

    renderer.setSize(width, height);

    fitCameraToAdapter();
  }

  window.addEventListener("resize", resize);

  /* =================================
       INITIAL BUILD
    ================================= */

  buildAdapter();

  /* =================================
       ANIMATION
    ================================= */

  function animate() {
    requestAnimationFrame(animate);

    adapterGroup.rotation.z += 0.002;

    renderer.render(scene, camera);
  }

  animate();
});
