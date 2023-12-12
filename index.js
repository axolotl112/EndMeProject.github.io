(function (global) {


  var KEYPRESS_SPEED = 0.2;
  var IMAGES = [
    "images/w.png",
    "images/ice.png",
    "images/gra.jpg",
    "images/b.webp",
    "images/i.jpg",
    "images/m.png"
  ];

  var state = {
    gl: null,
    mode: 'render',
    ui: {
      dragging: false,
      mouse: {
        lastX: -1,
        lastY: -1,
      },
      pressedKeys: {},
    },
    animation: {},
    app: {
      blend: {
        dest: 7,
        equation: 0,
        on: false,
        src: 6,
      },
      animate: true,
      eye: {
        x: 0.,
        y: 0.,
        z: 4.,
        w: 0.,
      },
      fog: {
        color: new Float32Array([0.5, 0.5, 0.5]),
        dist: new Float32Array([60, 80]),
        on: false,
      },
      light: {
        ambient: [0.3, 0.3, 0.3],
        diffuse: [1.0, 1.0, 1.0],
        position: [0.0, 0.0, 0.0],
      },
      objects: [],
      textures: {},
    },
    eyeInArray: function () {
      return [this.app.eye.x, this.app.eye.y, this.app.eye.z, this.app.eye.w];
    },


    camera: {
      position: { x: 0, y: 0, z: 5 },
      rotation: { x: 0, y: 0, z: 0 }
    },
  };

  var rotationSpeed = 0.01;


  glUtils.SL.init({ callback: function () { main(); } });

  function main() {
    state.canvas = document.getElementById("glcanvas");
    state.gl = glUtils.checkWebGL(state.canvas, {
      preserveDrawingBuffer: true,
    });

    initShaders();
    initGL();
    initState();
    initCamera(state.gl)
    initTextures(function () {
      draw();
      if (state.app.animate) {
        animate();
      }
    });
  }

  function updateViewMatrix() {
    var cam = state.camera;
    var viewMatrix = myCamera.GetViewMatrix();

    mat4.lookAt(state.vm,
      vec3.fromValues(cam.position.x, cam.position.y, cam.position.z),
      vec3.fromValues(0, 0, 0),
      vec3.fromValues(0, 1, 0)
    );
    // Apply rotations if necessary
  }

  function moveCamera(dx, dy, dz) {
    state.camera.position.x += dx;
    state.camera.position.y += dy;
    state.camera.position.z += dz;
    updateViewMatrix();
  }

  // Event listener for camera control
  document.addEventListener('keydown', function (event) {
    switch (event.keyCode) {
      case 87: // W key
        moveCamera(0, 0, -0.1); // Move forward
        break;
      case 83: // S key
        moveCamera(0, 0, 0.1); // Move backward
        break;
      case 65: // A key
        moveCamera(-0.1, 0, 0); // Move left
        break;
      case 68: // D key
        moveCamera(0.1, 0, 0); // Move right
        break;
      // ... potentially other keys for up, down, or rotation ...
    }
  });
  function hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16) / 255;
    var g = parseInt(hex.slice(3, 5), 16) / 255;
    var b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
  }


  document.getElementById('light-intensity').addEventListener('input', function (event) {
    var intensity = parseFloat(event.target.value);
    updateLightIntensity(intensity);
  });


  document.getElementById('diffuse-color').addEventListener('input', function (event) {
    var color = hexToRgb(event.target.value);
    state.app.light.diffuse = color;
    updateLightSettings();
  });

  document.getElementById('ambient-color').addEventListener('input', function (event) {
    var color = hexToRgb(event.target.value);
    state.app.light.ambient = color;
    updateLightSettings();
  });

  document.getElementById('light-pos-x').addEventListener('input', function (event) {
    state.app.light.position[0] = parseFloat(event.target.value);
    updateLightSettings();
  });

  document.getElementById('light-pos-y').addEventListener('input', function (event) {
    state.app.light.position[1] = parseFloat(event.target.value);
    updateLightSettings();
  });

  document.getElementById('light-pos-z').addEventListener('input', function (event) {
    state.app.light.position[2] = parseFloat(event.target.value);
    updateLightSettings();
  });


  document.getElementById('rotation-speed').addEventListener('input', function (event) {
    rotationSpeed = parseFloat(event.target.value);
  });



  function updateLightIntensity(intensity) {

    state.app.light.ambient = state.app.light.ambient.map(value => value * intensity);
    state.app.light.diffuse = state.app.light.diffuse.map(value => value * intensity);

    // Update the light settings in WebGL
    state.gl.uniform3fv(state.uDiffuseLight, state.app.light.diffuse);
    state.gl.uniform3fv(state.uAmbientLight, state.app.light.ambient);

    // Redraw the scene with updated light settings
    draw();
  }

  function updateLightSettings() {
    state.gl.uniform3fv(state.uDiffuseLight, state.app.light.diffuse);
    state.gl.uniform3fv(state.uAmbientLight, state.app.light.ambient);
    state.gl.uniform3fv(state.uLightPosition, state.app.light.position);
    draw(); // Redraw the scene with updated light settings
  }
  // Create a cube
  function Cube(opts) {
    var opts = opts || {};
    this.opts = opts;
    // v0-v1-v2-v3 front
    // v0-v3-v4-v5 right
    // v0-v5-v6-v1 up
    // v1-v6-v7-v2 left
    // v7-v4-v3-v2 down
    // v4-v7-v6-v5 back
    this.attributes = {
      aColor: {
        size: 4,
        offset: 0,
        bufferData: new Float32Array([
          1, 0, 1, 0.4, 1, 0, 1, 0.4, 1, 0, 1, 0.4, 1, 0, 1, 0.4,
          1, 1, 0, 0.4, 1, 1, 0, 0.4, 1, 1, 0, 0.4, 1, 1, 0, 0.4,
          1, 0, 0, 0.4, 1, 0, 0, 0.4, 1, 0, 0, 0.4, 1, 0, 0, 0.4,
          0, 1, 0, 0.4, 0, 1, 0, 0.4, 0, 1, 0, 0.4, 0, 1, 0, 0.4,
          0, 1, 1, 0.4, 0, 1, 1, 0.4, 0, 1, 1, 0.4, 0, 1, 1, 0.4,
          0, 0, 1, 0.4, 0, 0, 1, 0.4, 0, 0, 1, 0.4, 0, 0, 1, 0.4
        ]),
      },
      aNormal: {
        size: 3,
        offset: 0,
        bufferData: new Float32Array([
          0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
          1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
          0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
          -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
          0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
          0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0
        ]),
      },
      aPosition: {
        size: 3,
        offset: 0,
        bufferData: new Float32Array([
          1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
          1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0,
          1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0,
          -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0,
          -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
          1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0
        ]),
      },
      aTexCoord: {
        size: 2,
        offset: 0,
        bufferData: new Float32Array([
          1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
          0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,
          1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,
          1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
          0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
          0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0
        ]),
      },
    };
    this.indices = new Uint8Array([
      0, 1, 2, 0, 2, 3,
      4, 5, 6, 4, 6, 7,
      8, 9, 10, 8, 10, 11,
      12, 13, 14, 12, 14, 15,
      16, 17, 18, 16, 18, 19,
      20, 21, 22, 20, 22, 23
    ]);
    this.state = {
      angle: opts.angle ? opts.angle : [0, 0, 0],
      mm: mat4.create(),
      nm: null,
    };
    this.selColor = opts.selColor ? opts.selColor : [0, 0, 0, 0];
    this.stride = opts.stride ? opts.stride : 0;

    // Functionality
    this.readState = function () {
      this.attributes.aColorBackup = this.attributes.aColor;
      this.attributes.aColor = this.attributes.aSelColor;
    };
    this.drawState = function () {
      this.attributes.aColor = this.attributes.aColorBackup;

    };

    this.texture = opts.texture;


    this.draw = function () {
      var uMVPMatrix = state.gl.getUniformLocation(state.programs[state.mode], 'uMVPMatrix');
      var uModelMatrix = state.gl.getUniformLocation(state.programs[state.mode], 'uModelMatrix');
      var uNormalMatrix = state.gl.getUniformLocation(state.programs[state.mode], 'uNormalMatrix');
      var uFogColor = state.gl.getUniformLocation(state.programs[state.mode], 'uFogColor');
      var uFogDist = state.gl.getUniformLocation(state.programs[state.mode], 'uFogDist');
      var uSampler0 = state.gl.getUniformLocation(state.programs[state.mode], 'uSampler0');
      var mvp = state.mvp;
      state.programs[state.mode].renderBuffers(this);
      var n = this.indices.length;
      var mm = mat4.create();
      if (this.opts.translate) {
        mat4.translate(mm, mm, this.opts.translate);
      }
      if (this.opts.scale) {
        mat4.scale(mm, mm, this.opts.scale);
      }
      if (this.state.angle[0] || this.state.angle[1] || this.state.angle[2]) {
        mat4.rotateX(mm, mm, this.state.angle[0]);
        mat4.rotateY(mm, mm, this.state.angle[1]);
        mat4.rotateZ(mm, mm, this.state.angle[2]);
      }
      state.gl.uniformMatrix4fv(uModelMatrix, false, mm);

      mat4.copy(mvp, state.pm);
      mat4.multiply(mvp, mvp, state.vm);
      mat4.multiply(mvp, mvp, mm);
      state.gl.uniformMatrix4fv(uMVPMatrix, false, mvp);

      // Fog
      if (state.app.fog.on) {
        state.gl.uniform3fv(uFogColor, state.app.fog.color);
        state.gl.uniform2fv(uFogDist, state.app.fog.dist);
      }

      // Lighting
      if (state.mode === 'render') {
        state.gl.uniform3f(state.uDiffuseLight, state.app.light.diffuse[0], state.app.light.diffuse[1], state.app.light.diffuse[2]);
        state.gl.uniform3f(state.uAmbientLight, state.app.light.ambient[0], state.app.light.ambient[1], state.app.light.ambient[2]);
        state.gl.uniform3f(state.uLightPosition, state.app.light.position[0], state.app.light.position[1], state.app.light.position[2]);

        // Normalized invert
        var nm = mat3.normalFromMat4(mat3.create(), mm);
        state.gl.uniformMatrix3fv(uNormalMatrix, false, nm);
      }

      // Textures
      state.gl.activeTexture(state.gl.TEXTURE0);
      state.gl.bindTexture(state.gl.TEXTURE_2D, state.app.textures[this.opts.texture]);
      state.gl.uniform1i(uSampler0, 0);
      state.gl.drawElements(state.gl.TRIANGLES, n, state.gl.UNSIGNED_BYTE, 0);

      updateViewMatrix();
    };

    // Initialization
    this.init = function (_this) {
      _this.selColor = _this.selColor.map(function (n) { return n / 255; });
      var arrays = [
        _this.selColor, _this.selColor, _this.selColor, _this.selColor,
        _this.selColor, _this.selColor, _this.selColor, _this.selColor,
        _this.selColor, _this.selColor, _this.selColor, _this.selColor,
        _this.selColor, _this.selColor, _this.selColor, _this.selColor,
        _this.selColor, _this.selColor, _this.selColor, _this.selColor,
        _this.selColor, _this.selColor, _this.selColor, _this.selColor,
      ];
      _this.attributes.aSelColor = {
        size: 4,
        offset: 0,
        bufferData: new Float32Array(
          [].concat.apply([], arrays)
        ),
        hasTexture: opts.texture ? true : false,

      };
    }(this);
  }

  /*
  * Initialization
  */


  function initShaders() {
    var vertexShader = glUtils.getShader(state.gl, state.gl.VERTEX_SHADER, glUtils.SL.Shaders.v1.vertex),
      fragmentShader = glUtils.getShader(state.gl, state.gl.FRAGMENT_SHADER, glUtils.SL.Shaders.v1.fragment),
      vertexShader2 = glUtils.getShader(state.gl, state.gl.VERTEX_SHADER, glUtils.SL.Shaders.v2.vertex),
      fragmentShader2 = glUtils.getShader(state.gl, state.gl.FRAGMENT_SHADER, glUtils.SL.Shaders.v2.fragment),
      vertexShader3 = glUtils.getShader(state.gl, state.gl.VERTEX_SHADER, glUtils.SL.Shaders.v3.vertex),
      fragmentShader3 = glUtils.getShader(state.gl, state.gl.FRAGMENT_SHADER, glUtils.SL.Shaders.v3.fragment);

    vertexShader4 = glUtils.getShader(state.gl, state.gl.VERTEX_SHADER, glUtils.SL.Shaders.v4.vertex),
      fragmentShader4 = glUtils.getShader(state.gl, state.gl.FRAGMENT_SHADER, glUtils.SL.Shaders.v4.fragment);

    state.programs = {
      render: glUtils.createProgram(state.gl, vertexShader3, fragmentShader3),
      read: glUtils.createProgram(state.gl, vertexShader2, fragmentShader2),
      newProgram: glUtils.createProgram(state.gl, vertexShader4, fragmentShader4) // New shader program

    };


  }

  function initGL() {


    state.gl.enable(state.gl.DEPTH_TEST);

    state.gl.useProgram(state.programs[state.mode]);
  }

  function initState() {
    const gl = state.gl;
    const currentProgram = state.programs[state.mode];

    // Setting up uniform locations for lighting in the shader program
    state.uAmbientLight = gl.getUniformLocation(currentProgram, 'uAmbientLight');
    state.uDiffuseLight = gl.getUniformLocation(currentProgram, 'uDiffuseLight');
    state.uLightPosition = gl.getUniformLocation(currentProgram, 'uLightPosition');

    // Initializing transformation matrices
    state.vm = mat4.create();
    state.pm = mat4.create();
    state.mvp = mat4.create();

    state.app.objects = createCubes();
  }

  function createCubes() {
    const cubeProperties = [
      { color: [0, 0, 0, 0], textureIndex: 1, position: [0, 1, -3] },
      { color: [0, 0, 0, 0], textureIndex: 2, position: [-4, 1, -3] },
      { color: [0, 0, 0, 0], textureIndex: 5, position: [-4, -2, -3] },
      { color: [0, 0, 0, 0], textureIndex: 3, position: [5, -2, -3] },
      { color: [0, 0, 0, 0], textureIndex: 0, position: [5, 1, -3] },
      { color: [0, 0, 0, 0], textureIndex: 4, position: [0, -2, -3] }
    ];

    return cubeProperties.map(props => new Cube({
      selColor: props.color,
      texture: IMAGES[props.textureIndex],
      translate: props.position
    }));
  }

  /*
  * STATE MANAGEMENT

  */

  function updateState() {
    if (state.ui.pressedKeys[37]) {
      // left
      state.app.eye.x += KEYPRESS_SPEED;
    } else if (state.ui.pressedKeys[39]) {
      // right
      state.app.eye.x -= KEYPRESS_SPEED;
    } else if (state.ui.pressedKeys[40]) {
      // down
      state.app.eye.y += KEYPRESS_SPEED;
    } else if (state.ui.pressedKeys[38]) {
      // up
      state.app.eye.y -= KEYPRESS_SPEED;
    }
  }

  /*
  * Rendering / Drawing / Animation

  */
  function animate() {
    state.animation.tick = function () {
      updateState();
      rotateCubes();
      draw();
      requestAnimationFrame(state.animation.tick);
    };
    state.animation.tick();
  }

  function rotateCubes() {
    state.app.objects.forEach(function (obj) {
      obj.state.angle[1] += rotationSpeed;
    });
  }

  function draw(args) {

    state.gl.clearDepth(1.0);                 // Clear everything
    state.gl.enable(state.gl.DEPTH_TEST);     // Enable depth testing
    state.gl.depthFunc(state.gl.LEQUAL);
    state.gl.clear(state.gl.COLOR_BUFFER_BIT | state.gl.DEPTH_BUFFER_BIT);

    mat4.perspective(state.pm,
      20, state.canvas.width / state.canvas.height, 1, 100
    );

    state.app.objects.forEach(function (obj) {
      if (false) {
        state.gl.useProgram(state.programs.newProgram);
      } else {
        state.gl.useProgram(state.programs[state.mode]);
      }
      obj.draw(); // Draw the object
    });
    updateViewMatrix();
    state.gl.useProgram(state.programs[state.mode]);


  }
  /*
  * TEXTURES
  
  */
  async function initTextures(callback, args) {
    try {
      for (const image_src of IMAGES) {
        await loadTextureAsync(image_src);
      }
      if (callback) {
        callback(args);
      }
    } catch (error) {
      console.error('Error loading images', error);
    }
  }

  function loadTextureAsync(imageSrc) {
    return new Promise((resolve, reject) => {
      const texture = state.gl.createTexture();
      if (!texture) {
        reject(new Error('Failed to create the texture object'));
      }
      texture.src = imageSrc;

      const image = new Image();
      image.onload = () => {
        state.app.textures[texture.src] = texture;
        loadTexture(image, texture);
        resolve();
      };
      image.onerror = () => {
        reject(new Error(`Failed to load image at ${imageSrc}`));
      };
      image.src = imageSrc;
    });
  }

  // Tex load
  function loadTexture(image, texture) {
    state.gl.pixelStorei(state.gl.UNPACK_FLIP_Y_WEBGL, 1);
    state.gl.bindTexture(state.gl.TEXTURE_2D, texture);
    state.gl.texParameteri(state.gl.TEXTURE_2D, state.gl.TEXTURE_MIN_FILTER, state.gl.LINEAR);
    state.gl.texParameteri(state.gl.TEXTURE_2D, state.gl.TEXTURE_WRAP_S, state.gl.CLAMP_TO_EDGE);
    state.gl.texParameteri(state.gl.TEXTURE_2D, state.gl.TEXTURE_WRAP_T, state.gl.CLAMP_TO_EDGE);
    state.gl.texImage2D(state.gl.TEXTURE_2D, 0, state.gl.RGBA, state.gl.RGBA, state.gl.UNSIGNED_BYTE, image);
    state.gl.bindTexture(state.gl.TEXTURE_2D, null);
  }

})(window || this);
