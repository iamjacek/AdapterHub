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

  const placeholder = stage.querySelector(
    ".adapter-configurator-3d-placeholder",
  );

  if (placeholder) {
    placeholder.remove();
  }
  /* =================================
       LIGHTING
    ================================= */

  /* ---------------------------------
   Soft ambient light
--------------------------------- */

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);

  scene.add(ambientLight);

  /* ---------------------------------
   Main key light
--------------------------------- */

  const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);

  keyLight.position.set(120, 180, 220);

  scene.add(keyLight);

  /* ---------------------------------
   Fill light
--------------------------------- */

  const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);

  fillLight.position.set(-180, 80, 120);

  scene.add(fillLight);

  /* ---------------------------------
   Rim light
--------------------------------- */

  const rimLight = new THREE.DirectionalLight(0xffffff, 2);

  rimLight.position.set(-100, 150, -180);

  scene.add(rimLight);

  /* =================================
       ADAPTER GROUP
    ================================= */

  const adapterGroup = new THREE.Group();

  scene.add(adapterGroup);

  /* =================================
       MATERIAL
    ================================= */

  const adapterMaterial = new THREE.MeshStandardMaterial({
    color: 0x18191b,
    roughness: 0.78,
    metalness: 0.0,
  });

  adapterMaterial.onBeforeCompile = function (shader) {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <roughnessmap_fragment>",
      `
            #include <roughnessmap_fragment>

            float noise =
            fract(
                sin(
                    dot(
                        vViewPosition.xy * 0.18,
                        vec2(12.9898, 78.233)
                    )
                ) * 43758.5453
            );

            roughnessFactor +=
                (noise - 0.5) * 0.055;

                    roughnessFactor =
                        clamp(
                            roughnessFactor,
                            0.65,
                            0.95
                        );
                    `,
    );
  };

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
  const defaultAdapterConfig = {
    shape: "round",
    width: 180,
    height: 180,
    thickness: 12,
    cutout: 145,
    holes: 4,
    holeSpacing: 160,
    offsetX: 0,
    offsetY: 0,
  };

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

    const offsetX = getValue(".adapter-configurator-offset-x-input", 0);

    const offsetY = getValue(".adapter-configurator-offset-y-input", 0);

    const hole = new THREE.Path();

    const radius = safeCutout / 2;

    hole.absarc(offsetX, offsetY, radius, 0, Math.PI * 2, false);

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

    let cutoutValid = true;

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

    if (
      offsetX - cutoutRadius < -halfWidth ||
      offsetX + cutoutRadius > halfWidth ||
      offsetY - cutoutRadius < -halfHeight ||
      offsetY + cutoutRadius > halfHeight
    ) {
      cutoutValid = false;
    }

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

      const distanceFromCutout = Math.sqrt(
        Math.pow(x - offsetX, 2) + Math.pow(y - offsetY, 2),
      );

      if (
        distanceFromCutout - mountingHoleRadius <=
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
        !cutoutValid || !mountingHolesValid,
      );
    }

    /* --------------------------------
   Create mounting holes
   only when valid
-------------------------------- */

    if (cutoutValid && mountingHolesValid) {
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
   RESET CONFIGURATION
================================= */

  const resetButton = document.querySelector(".adapter-configurator-reset");

  if (resetButton) {
    resetButton.addEventListener("click", function () {
      const shapeInput = document.querySelector(
        ".adapter-configurator-shape-select",
      );

      const widthInput = document.querySelector(
        ".adapter-configurator-width-input",
      );

      const heightInput = document.querySelector(
        ".adapter-configurator-height-input",
      );

      const thicknessInput = document.querySelector(
        ".adapter-configurator-thickness-input",
      );

      const cutoutInput = document.querySelector(
        ".adapter-configurator-cutout-input",
      );

      const holesInput = document.querySelector(
        ".adapter-configurator-holes-count-input",
      );

      const spacingInput = document.querySelector(
        ".adapter-configurator-hole-spacing-input",
      );

      const offsetXInput = document.querySelector(
        ".adapter-configurator-offset-x-input",
      );

      const offsetYInput = document.querySelector(
        ".adapter-configurator-offset-y-input",
      );

      if (shapeInput) {
        shapeInput.value = defaultAdapterConfig.shape;
      }

      if (widthInput) {
        widthInput.value = defaultAdapterConfig.width;
      }

      if (heightInput) {
        heightInput.value = defaultAdapterConfig.height;
      }

      if (thicknessInput) {
        thicknessInput.value = defaultAdapterConfig.thickness;
      }

      if (cutoutInput) {
        cutoutInput.value = defaultAdapterConfig.cutout;
      }

      if (holesInput) {
        holesInput.value = defaultAdapterConfig.holes;
      }

      if (spacingInput) {
        spacingInput.value = defaultAdapterConfig.holeSpacing;
      }

      if (offsetXInput) {
        offsetXInput.value = defaultAdapterConfig.offsetX;
      }

      if (offsetYInput) {
        offsetYInput.value = defaultAdapterConfig.offsetY;
      }

      /* Rebuild model */

      buildAdapter();

      /* Reset rotation */

      adapterGroup.rotation.x = -0.35;
      adapterGroup.rotation.y = 0.35;

      fitCameraToAdapter();
    });
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

    ".adapter-configurator-offset-x-input",

    ".adapter-configurator-offset-y-input",
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
   3D INTERACTION
================================= */

  let isDragging = false;

  let previousPointerX = 0;
  let previousPointerY = 0;

  /* ---------------------------------
   Pointer down
--------------------------------- */

  renderer.domElement.addEventListener("pointerdown", function (event) {
    isDragging = true;

    previousPointerX = event.clientX;
    previousPointerY = event.clientY;

    renderer.domElement.setPointerCapture(event.pointerId);
  });

  /* ---------------------------------
   Pointer move
--------------------------------- */

  renderer.domElement.addEventListener("pointermove", function (event) {
    if (!isDragging) {
      return;
    }

    const deltaX = event.clientX - previousPointerX;

    const deltaY = event.clientY - previousPointerY;

    adapterGroup.rotation.y += deltaX * 0.01;

    adapterGroup.rotation.x += deltaY * 0.01;

    /* Prevent flipping upside down */

    adapterGroup.rotation.x = THREE.MathUtils.clamp(
      adapterGroup.rotation.x,
      -1.3,
      1.3,
    );

    previousPointerX = event.clientX;

    previousPointerY = event.clientY;
  });

  /* ---------------------------------
   Pointer up
--------------------------------- */

  renderer.domElement.addEventListener("pointerup", function (event) {
    isDragging = false;

    renderer.domElement.releasePointerCapture(event.pointerId);
  });

  /* ---------------------------------
   Wheel zoom
--------------------------------- */

  renderer.domElement.addEventListener(
    "wheel",
    function (event) {
      event.preventDefault();

      const zoomSpeed = 0.0015;

      camera.position.z *= 1 + event.deltaY * zoomSpeed;

      camera.position.z = THREE.MathUtils.clamp(camera.position.z, 100, 1000);
    },
    {
      passive: false,
    },
  );

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

    renderer.render(scene, camera);
  }

  animate();
});
