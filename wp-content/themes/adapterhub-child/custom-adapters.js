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

    if (advancedElement) {
      advancedElement.classList.toggle("adapter-configurator-advanced-show");
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
    roughness: 0.88,
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

    const value = element.value.trim();

    if (value === "") {
      return fallback;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : fallback;
  }

  function getLimitedValue(selector, fallback, min, max) {
    const element = document.querySelector(selector);

    if (!element) {
      return fallback;
    }

    const rawValue = element.value.trim();

    if (rawValue === "") {
      return fallback;
    }

    const value = Number(rawValue);

    if (!Number.isFinite(value)) {
      return fallback;
    }

    return THREE.MathUtils.clamp(value, min, max);
  }

  function setConfiguratorFieldError(selector, message) {
    const input = document.querySelector(selector);

    if (!input) return;

    const widget = input.closest(".elementor-widget-html");

    if (!widget) return;

    let error = widget.querySelector(".adapter-configurator-field-error");

    if (!error) {
      error = document.createElement("div");
      error.className = "adapter-configurator-field-error";
      widget.appendChild(error);
    }

    input.classList.toggle(
      "adapter-configurator-input-error",
      Boolean(message),
    );

    input.setAttribute("aria-invalid", message ? "true" : "false");

    error.textContent = message || "";
    error.hidden = !message;
  }

  function normalizeInput(selector, fallback, min, max, integer = false) {
    const element = document.querySelector(selector);

    if (!element) return;

    const rawValue = element.value.trim();

    if (rawValue === "") {
      element.value = fallback;
      return;
    }

    const value = Number(rawValue);

    if (!Number.isFinite(value)) {
      element.value = fallback;
      return;
    }

    const clampedValue = THREE.MathUtils.clamp(value, min, max);

    element.value = integer ? Math.round(clampedValue) : clampedValue;
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

  function updateConfiguratorSummary() {
    const getValue = (selector, fallback = "") => {
      const element = document.querySelector(selector);
      return element ? element.value : fallback;
    };

    const shape = getValue(".adapter-configurator-shape-select", "round");

    const values = {
      shape:
        {
          rectangle: "Rectangle",
          round: "Round",
          oval: "Oval",
        }[shape] || shape,

      width: getValue(".adapter-configurator-width-input", "180"),
      height: getValue(".adapter-configurator-height-input", "180"),
      thickness: getValue(".adapter-configurator-thickness-input", "12"),
      cutout: getValue(".adapter-configurator-cutout-input", "145"),
      "screw-size": getValue(".adapter-configurator-screw-size-select", "M5"),
      "holes-count": getValue(".adapter-configurator-holes-count-input", "4"),
      "hole-spacing": getValue(
        ".adapter-configurator-hole-spacing-input",
        "160",
      ),
      "offset-x": getValue(".adapter-configurator-offset-x-input", "0"),
      "offset-y": getValue(".adapter-configurator-offset-y-input", "0"),
    };

    Object.entries(values).forEach(([key, value]) => {
      const element = document.querySelector(`[data-summary="${key}"]`);

      if (element) {
        element.textContent = value;
      }
    });
  }

  function buildAdapter() {
    updateConfiguratorSummary();

    const width = getLimitedValue(
      ".adapter-configurator-width-input",
      180,
      60,
      300,
    );

    const height = getLimitedValue(
      ".adapter-configurator-height-input",
      180,
      60,
      300,
    );

    const thickness = getLimitedValue(
      ".adapter-configurator-thickness-input",
      12,
      3,
      30,
    );

    const cutout = getLimitedValue(
      ".adapter-configurator-cutout-input",
      145,
      30,
      250,
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

    const offsetX = getLimitedValue(
      ".adapter-configurator-offset-x-input",
      0,
      -100,
      100,
    );

    const offsetY = getLimitedValue(
      ".adapter-configurator-offset-y-input",
      0,
      -100,
      100,
    );

    const hole = new THREE.Path();

    const radius = safeCutout / 2;

    hole.absarc(offsetX, offsetY, radius, 0, Math.PI * 2, false);

    shape.holes.push(hole);

    /* -----------------------------
   Mounting holes validation
----------------------------- */

    const holesCount = Math.round(
      getLimitedValue(".adapter-configurator-holes-count-input", 4, 2, 6),
    );

    const holeSpacing = getLimitedValue(
      ".adapter-configurator-hole-spacing-input",
      160,
      40,
      260,
    );

    const screwSizeSelect = document.querySelector(
      ".adapter-configurator-screw-size-select",
    );

    const screwSize = screwSizeSelect ? screwSizeSelect.value : "M5";

    const screwDiameters = {
      M4: 4.5,
      M5: 5.5,
      M6: 6.5,
    };

    const mountingHoleRadius = (screwDiameters[screwSize] || 5.5) / 2;

    let cutoutValid = true;

    const warningElement = document.querySelector(
      ".adapter-configurator-holes-warning",
    );

    /* --------------------------------
   Validate every mounting hole
-------------------------------- */

    let mountingHolesValid = true;

    let holeOverlapInvalid = false;
    let holeWidthBoundaryInvalid = false;
    let holeHeightBoundaryInvalid = false;

    const mountingRadius = holeSpacing / 2;
    const cutoutRadius = safeCutout / 2;
    const edgeMargin = 1;
    const safetyRadius = mountingHoleRadius + edgeMargin;

    // Check the speaker cutout against the actual adapter shape.
    function cutoutFitsAt(ox, oy, radius) {
      if (shapeType === "rectangle") {
        return (
          ox - radius >= -halfWidth &&
          ox + radius <= halfWidth &&
          oy - radius >= -halfHeight &&
          oy + radius <= halfHeight
        );
      }

      if (shapeType === "round") {
        const outerRadius = Math.min(halfWidth, halfHeight);

        return Math.sqrt(ox * ox + oy * oy) + radius <= outerRadius;
      }

      if (shapeType === "oval") {
        for (let j = 0; j < 128; j++) {
          const angle = (j / 128) * Math.PI * 2;
          const x = ox + Math.cos(angle) * radius;
          const y = oy + Math.sin(angle) * radius;

          if (Math.pow(x / halfWidth, 2) + Math.pow(y / halfHeight, 2) > 1) {
            return false;
          }
        }

        return true;
      }

      return false;
    }

    cutoutValid =
      cutout <= maxCutout && cutoutFitsAt(offsetX, offsetY, cutout / 2);

    // Determine whether an offset is responsible for the cutout
    // extending beyond the adapter.
    const cutoutFitsWithoutX = cutoutFitsAt(0, offsetY, cutout / 2);
    const cutoutFitsWithoutY = cutoutFitsAt(offsetX, 0, cutout / 2);

    // Check every mounting hole. Do not stop at the first failure.
    for (let i = 0; i < holesCount; i++) {
      const angle = (i / holesCount) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * mountingRadius;
      const y = Math.sin(angle) * mountingRadius;

      const distanceFromCutout = Math.sqrt(
        Math.pow(x - offsetX, 2) + Math.pow(y - offsetY, 2),
      );

      if (
        distanceFromCutout <=
        cutoutRadius + mountingHoleRadius + edgeMargin
      ) {
        holeOverlapInvalid = true;
        mountingHolesValid = false;
      }

      if (shapeType === "rectangle") {
        if (x - safetyRadius < -halfWidth || x + safetyRadius > halfWidth) {
          holeWidthBoundaryInvalid = true;
          mountingHolesValid = false;
        }

        if (y - safetyRadius < -halfHeight || y + safetyRadius > halfHeight) {
          holeHeightBoundaryInvalid = true;
          mountingHolesValid = false;
        }
      } else if (shapeType === "round") {
        const outerRadius = Math.min(halfWidth, halfHeight);

        if (Math.sqrt(x * x + y * y) + safetyRadius > outerRadius) {
          mountingHolesValid = false;

          if (width < height) {
            holeWidthBoundaryInvalid = true;
          } else if (height < width) {
            holeHeightBoundaryInvalid = true;
          } else {
            holeWidthBoundaryInvalid = true;
            holeHeightBoundaryInvalid = true;
          }
        }
      } else if (shapeType === "oval") {
        for (let j = 0; j < 64; j++) {
          const sampleAngle = (j / 64) * Math.PI * 2;
          const edgeX = x + Math.cos(sampleAngle) * safetyRadius;
          const edgeY = y + Math.sin(sampleAngle) * safetyRadius;

          const widthContribution = Math.pow(edgeX / halfWidth, 2);
          const heightContribution = Math.pow(edgeY / halfHeight, 2);

          if (widthContribution + heightContribution > 1) {
            mountingHolesValid = false;

            if (widthContribution >= heightContribution) {
              holeWidthBoundaryInvalid = true;
            }

            if (heightContribution >= widthContribution) {
              holeHeightBoundaryInvalid = true;
            }
          }
        }
      }
    }

    /* --------------------------------
   Field validation messages
-------------------------------- */

    const fieldSelectors = [
      ".adapter-configurator-width-input",
      ".adapter-configurator-height-input",
      ".adapter-configurator-cutout-input",
      ".adapter-configurator-offset-x-input",
      ".adapter-configurator-offset-y-input",
      ".adapter-configurator-hole-spacing-input",
      ".adapter-configurator-holes-count-input",
    ];

    fieldSelectors.forEach(function (selector) {
      setConfiguratorFieldError(selector, "");
    });

    // Cutout is too large for the adapter dimensions.
    if (cutout > maxCutout) {
      setConfiguratorFieldError(
        ".adapter-configurator-cutout-input",
        "Cutout is too large for these adapter dimensions.",
      );
    }

    // Cutout extends beyond the actual adapter boundary.
    if (!cutoutFitsAt(offsetX, offsetY, cutout / 2)) {
      if (offsetX !== 0 && cutoutFitsWithoutX) {
        setConfiguratorFieldError(
          ".adapter-configurator-offset-x-input",
          "This offset moves the cutout outside the adapter.",
        );
      }

      if (offsetY !== 0 && cutoutFitsWithoutY) {
        setConfiguratorFieldError(
          ".adapter-configurator-offset-y-input",
          "This offset moves the cutout outside the adapter.",
        );
      }

      if (offsetX === 0 && offsetY === 0) {
        setConfiguratorFieldError(
          ".adapter-configurator-cutout-input",
          "Cutout does not fit inside the adapter.",
        );
      } else if (
        !cutoutFitsWithoutX &&
        !cutoutFitsWithoutY &&
        !cutoutFitsAt(0, 0, cutout / 2)
      ) {
        setConfiguratorFieldError(
          ".adapter-configurator-cutout-input",
          "Cutout is too large for this adapter shape.",
        );
      }
    }

    // Hole positions extend beyond the adapter.
    if (holeWidthBoundaryInvalid) {
      setConfiguratorFieldError(
        ".adapter-configurator-width-input",
        "Adapter width is too small for the mounting holes.",
      );
    }

    if (holeHeightBoundaryInvalid) {
      setConfiguratorFieldError(
        ".adapter-configurator-height-input",
        "Adapter height is too small for the mounting holes.",
      );
    }

    // Holes overlap the speaker cutout.
    if (holeOverlapInvalid) {
      const overlapWithoutOffset = !cutoutFitsAt(
        offsetX,
        offsetY,
        cutoutRadius,
      );

      if (offsetX !== 0 || offsetY !== 0) {
        setConfiguratorFieldError(
          ".adapter-configurator-offset-x-input",
          offsetX !== 0
            ? "Check this offset: it may cause a mounting hole collision."
            : "",
        );

        setConfiguratorFieldError(
          ".adapter-configurator-offset-y-input",
          offsetY !== 0
            ? "Check this offset: it may cause a mounting hole collision."
            : "",
        );
      }

      if (offsetX === 0 && offsetY === 0) {
        setConfiguratorFieldError(
          ".adapter-configurator-cutout-input",
          "Cutout overlaps the mounting holes.",
        );

        setConfiguratorFieldError(
          ".adapter-configurator-hole-spacing-input",
          "Adjust spacing to avoid the speaker cutout.",
        );
      }
    }

    // Keep the existing general warning in sync.
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

  const inputLimits = {
    ".adapter-configurator-width-input": [180, 60, 300],
    ".adapter-configurator-height-input": [180, 60, 300],
    ".adapter-configurator-thickness-input": [12, 3, 30],
    ".adapter-configurator-cutout-input": [145, 30, 250],
    ".adapter-configurator-holes-count-input": [4, 2, 6],
    ".adapter-configurator-hole-spacing-input": [160, 40, 260],
    ".adapter-configurator-offset-x-input": [0, -100, 100],
    ".adapter-configurator-offset-y-input": [0, -100, 100],
  };

  inputs.forEach(function (selector) {
    const input = document.querySelector(selector);

    if (!input) return;

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

      if (
        selector === ".adapter-configurator-shape-select" &&
        input.value === "round"
      ) {
        const widthInput = document.querySelector(
          ".adapter-configurator-width-input",
        );
        const heightInput = document.querySelector(
          ".adapter-configurator-height-input",
        );

        if (widthInput && heightInput) {
          heightInput.value = widthInput.value;
        }
      }

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

    input.addEventListener("change", function () {
      const limit = inputLimits[selector];

      if (limit) {
        normalizeInput(
          selector,
          limit[0],
          limit[1],
          limit[2],
          selector === ".adapter-configurator-holes-count-input",
        );
      }

      const shapeSelect = document.querySelector(
        ".adapter-configurator-shape-select",
      );
      const widthInput = document.querySelector(
        ".adapter-configurator-width-input",
      );
      const heightInput = document.querySelector(
        ".adapter-configurator-height-input",
      );

      if (
        shapeSelect &&
        shapeSelect.value === "round" &&
        widthInput &&
        heightInput &&
        (input === widthInput || input === heightInput)
      ) {
        widthInput.value = input.value;
        heightInput.value = input.value;
      }

      buildAdapter();
    });
  });

  const screwSizeSelectElement = document.querySelector(
    ".adapter-configurator-screw-size-select",
  );

  if (screwSizeSelectElement) {
    screwSizeSelectElement.addEventListener("change", function () {
      buildAdapter();
    });
  }

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

  // AUTO-ROTATION: interaction tracking
  let isInteracting = false;
  let lastInteractionTime = performance.now() - 3000;

  renderer.domElement.addEventListener("pointerdown", function () {
    isInteracting = true;
    lastInteractionTime = performance.now();
  });

  window.addEventListener("pointerup", function () {
    if (isInteracting) {
      isInteracting = false;
      lastInteractionTime = performance.now();
    }
  });

  renderer.domElement.addEventListener("pointermove", function () {
    if (isInteracting) {
      lastInteractionTime = performance.now();
    }
  });

  renderer.domElement.addEventListener(
    "wheel",
    function () {
      lastInteractionTime = performance.now();
    },
    { passive: true },
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

    const now = performance.now();

    if (!isInteracting && now - lastInteractionTime >= 3000) {
      adapterGroup.rotation.z += 0.0005;
    }

    renderer.render(scene, camera);
  }

  animate();
});
