import React, { useRef, useEffect } from 'react';

interface Gizmo3DProps {
  rotation: { x: number; y: number; z: number };
  size?: number;
}

// Minimal matrix / vector helpers (column-major for WebGL)
function degToRad(d: number) { return d * Math.PI / 180; }
function identity() { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] as number[]; }
function multiply(a: number[], b: number[]) {
  const out = new Array(16).fill(0);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[k * 4 + r] * b[c * 4 + k];
      }
      out[c * 4 + r] = sum;
    }
  }
  return out;
}
function translation(tx: number, ty: number, tz: number) { const m = identity(); m[12] = tx; m[13] = ty; m[14] = tz; return m; }
function scale(sx: number, sy: number, sz: number) { const m = identity(); m[0] = sx; m[5] = sy; m[10] = sz; return m; }
function rotateX(r: number) { const c = Math.cos(r), s = Math.sin(r); const m = identity(); m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m; }
function rotateY(r: number) { const c = Math.cos(r), s = Math.sin(r); const m = identity(); m[0] = c; m[2] = -s; m[8] = s; m[10] = c; return m; }
function rotateZ(r: number) { const c = Math.cos(r), s = Math.sin(r); const m = identity(); m[0] = c; m[1] = s; m[4] = -s; m[5] = c; return m; }
function perspective(fovy: number, aspect: number, near: number, far: number) {
  const f = 1.0 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  const out = new Array(16).fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = (2 * far * near) * nf;
  return out;
}
function lookAt(eye: number[], center: number[], up: number[]) {
  let z0 = eye[0] - center[0], z1 = eye[1] - center[1], z2 = eye[2] - center[2];
  let len = Math.hypot(z0, z1, z2); if (len === 0) { z2 = 1; len = 1; } const zx = z0 / len, zy = z1 / len, zz = z2 / len;
  let x0 = up[1] * zz - up[2] * zy, x1 = up[2] * zx - up[0] * zz, x2 = up[0] * zy - up[1] * zx;
  let xl = Math.hypot(x0, x1, x2); if (xl === 0) { x0 = 1; xl = 1; } const xx = x0 / xl, xy = x1 / xl, xz = x2 / xl;
  const y0 = zy * xz - zz * xy, y1 = zz * xx - zx * xz, y2 = zx * xy - zy * xx;
  const out = identity();
  out[0] = xx; out[1] = y0; out[2] = zx; out[4] = xy; out[5] = y1; out[6] = zy; out[8] = xz; out[9] = y2; out[10] = zz;
  out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
  out[13] = -(y0 * eye[0] + y1 * eye[1] + y2 * eye[2]);
  out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
  return out;
}

// Create an arrow mesh pointing along +Z, base at z=0, tip at z=totalLength
function createArrowMesh(segments: number, shaftRadius: number, shaftLen: number, tipRadius: number, tipLen: number) {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  const totalLen = shaftLen + tipLen;

  // shaft: ring at z=0 .. z=shaftLen
  for (let s = 0; s < segments; s++) {
    const theta = (s / segments) * Math.PI * 2;
    const x = Math.cos(theta) * shaftRadius; const y = Math.sin(theta) * shaftRadius;
    positions.push(x, y, 0); normals.push(x, y, 0);
    positions.push(x, y, shaftLen); normals.push(x, y, 0);
  }
  // shaft side indices
  for (let s = 0; s < segments; s++) {
    const i0 = s * 2; const i1 = s * 2 + 1; const ni0 = ((s + 1) % segments) * 2; const ni1 = ((s + 1) % segments) * 2 + 1;
    indices.push(i0, i1, ni0); indices.push(ni0, i1, ni1);
  }

  // tip: ring at z=shaftLen .. cone to apex at totalLen
  const tipRingStart = positions.length / 3;
  for (let s = 0; s < segments; s++) {
    const theta = (s / segments) * Math.PI * 2;
    const x = Math.cos(theta) * tipRadius; const y = Math.sin(theta) * tipRadius;
    const z = shaftLen;
    // normal for cone approx: compute vector from cone surface
    const vx = x; const vy = y; const vz = tipLen;
    const nl = Math.hypot(vx, vy, vz) || 1;
    const nx = vx / nl, ny = vy / nl, nz = vz / nl;
    positions.push(x, y, z); normals.push(nx, ny, nz);
  }
  const apexIndex = positions.length / 3; positions.push(0, 0, totalLen); normals.push(0, 0, 1);
  // tip indices
  for (let s = 0; s < segments; s++) {
    const i = tipRingStart + s; const ni = tipRingStart + ((s + 1) % segments);
    indices.push(i, ni, apexIndex);
  }

  return { positions, normals, indices, totalLen };
}

export const Gizmo3D: React.FC<Gizmo3DProps> = ({ rotation, size = 80 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const labelXRef = useRef<HTMLSpanElement | null>(null);
  const labelYRef = useRef<HTMLSpanElement | null>(null);
  const labelZRef = useRef<HTMLSpanElement | null>(null);
  const rotationRef = useRef<{ x: number, y: number, z: number }>({ x: 0, y: 0, z: 0 });
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const buffersRef = useRef<any>(null);

  useEffect(() => { rotationRef.current = rotation; }, [rotation]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const rawGl = canvas.getContext('webgl', { antialias: true });
    if (!rawGl) { console.warn('[Gizmo3D] WebGL not available'); return; }
    const gl = rawGl as WebGLRenderingContext;
    glRef.current = gl;

    const vs = `attribute vec3 aPos; attribute vec3 aNormal; uniform mat4 uMVP; uniform mat4 uModel; varying vec3 vNormal; void main(){ vNormal = mat3(uModel) * aNormal; gl_Position = uMVP * vec4(aPos,1.0); }`;
    const fs = `precision mediump float; varying vec3 vNormal; uniform vec3 uColor; void main(){ vec3 N = normalize(vNormal); vec3 L = normalize(vec3(0.5,0.7,1.0)); float diff = max(dot(N,L), 0.12); vec3 base = uColor * diff; vec3 ambient = uColor * 0.18; gl_FragColor = vec4(base + ambient, 1.0); }`;

    function compile(src: string, type: number) { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; }
    const vsh = compile(vs, gl.VERTEX_SHADER), fsh = compile(fs, gl.FRAGMENT_SHADER);
    const prog = gl.createProgram()!; gl.attachShader(prog, vsh); gl.attachShader(prog, fsh); gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(prog));

    // build arrow mesh
    const { positions, normals, indices, totalLen } = createArrowMesh(24, 0.04, 0.48, 0.09, 0.18);

    const posBuf = gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    const normBuf = gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER, normBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    const idxBuf = gl.createBuffer()!; gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    buffersRef.current = { posBuf, normBuf, idxBuf, count: indices.length };

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    let ra = 0;
    const render = () => {
      ra = requestAnimationFrame(render);
      resizeCanvasToDisplaySize(canvas, gl);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(prog);

      const uMVP = gl.getUniformLocation(prog, 'uMVP')!;
      const uModel = gl.getUniformLocation(prog, 'uModel')!;
      const uColor = gl.getUniformLocation(prog, 'uColor')!;
      const aPos = gl.getAttribLocation(prog, 'aPos');
      const aNormal = gl.getAttribLocation(prog, 'aNormal');

      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, normBuf); gl.enableVertexAttribArray(aNormal); gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);

      const aspect = canvas.width / canvas.height;
      const proj = perspective(degToRad(45), aspect, 0.1, 10.0);

      // Construct View Matrix: T(0,0,-dist) * R(cam)
      // This mimics the camera looking at the gizmo (at origin) from a distance, 
      // but rotating WITH the main camera to show world alignment.
      const dist = 3.5;
      const camRot = rotationRef.current || { x: 0, y: 0, z: 0 };
      const rx = degToRad(-camRot.x || 0);
      const ry = degToRad(-camRot.y || 0);
      const rz = degToRad(-camRot.z || 0);

      let rotMat = identity();
      rotMat = multiply(rotMat, rotateX(rx));
      rotMat = multiply(rotMat, rotateY(ry));
      rotMat = multiply(rotMat, rotateZ(rz));

      const view = multiply(translation(0, 0, -dist), rotMat);

      // Model matrix is just identity for the base frame (arrows are rotated locally)
      const model = identity();

      const projView = multiply(proj, view);

      function mulMatVec(mat: number[], v: number[]) { const out = [0, 0, 0, 0]; for (let r = 0; r < 4; r++) { let s = 0; for (let c = 0; c < 4; c++) s += mat[c * 4 + r] * v[c]; out[r] = s; } return out; }

      // helper to draw an axis arrow with color and axis rotation
      const drawAxis = (axisRot: number[], axisColor: [number, number, number]) => {
        // translate arrow so its base is at origin of gizmo and centered along half-length
        const axisTrans = translation(0, 0, totalLen * 0.5);
        const axisLocal = multiply(axisTrans, multiply(axisRot, identity()));
        const m = multiply(model, axisLocal);
        gl.uniformMatrix4fv(uModel, false, new Float32Array(m));
        const mvp = multiply(projView, m);
        gl.uniformMatrix4fv(uMVP, false, new Float32Array(mvp));
        gl.uniform3f(uColor, axisColor[0], axisColor[1], axisColor[2]);
        gl.drawElements(gl.TRIANGLES, buffersRef.current.count, gl.UNSIGNED_SHORT, 0);
        return mvp;
      };

      // Z axis (identity rotation) points roughly +Z (Blue)
      const mvpZ = drawAxis(identity(), [0.23, 0.51, 0.96]);
      // X axis: rotate +Z -> +X : rotateY(90deg) (Red)
      const mvpX = drawAxis(rotateY(degToRad(90)), [0.94, 0.27, 0.27]);
      // Y axis: rotate +Z -> +Y : rotateX(-90deg) (Green)
      const mvpY = drawAxis(rotateX(degToRad(-90)), [0.13, 0.78, 0.37]);

      // labels: project tip point for each axis and position DOM spans
      try {
        const tipObj = [0, 0, totalLen, 1];
        const clipX = mulMatVec(mvpX, tipObj);
        const clipY = mulMatVec(mvpY, tipObj);
        const clipZ = mulMatVec(mvpZ, tipObj);
        function ndcToScreen(clip: any) { const w = clip[3] || 1; const nx = clip[0] / w; const ny = clip[1] / w; const cssW = canvas.clientWidth; const cssH = canvas.clientHeight; const px = (nx * 0.5 + 0.5) * cssW; const py = (1 - (ny * 0.5 + 0.5)) * cssH; return [px, py]; }
        const posX = ndcToScreen(clipX); const posY = ndcToScreen(clipY); const posZ = ndcToScreen(clipZ);
        if (labelXRef.current) { labelXRef.current.style.left = `${posX[0]}px`; labelXRef.current.style.top = `${posX[1]}px`; }
        if (labelYRef.current) { labelYRef.current.style.left = `${posY[0]}px`; labelYRef.current.style.top = `${posY[1]}px`; }
        if (labelZRef.current) { labelZRef.current.style.left = `${posZ[0]}px`; labelZRef.current.style.top = `${posZ[1]}px`; }
      } catch (e) { /* ignore */ }
    };

    const resizeCanvasToDisplaySize = (canvas: HTMLCanvasElement, gl: WebGLRenderingContext) => {
      const ratio = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    };

    render();

    return () => { cancelAnimationFrame(ra); try { if (posBuf) gl.deleteBuffer(posBuf); if (normBuf) gl.deleteBuffer(normBuf); if (idxBuf) gl.deleteBuffer(idxBuf); } catch (e) { } };
  }, []);

  const wrapperStyle: React.CSSProperties = { position: 'relative', width: size + 'px', height: size + 'px', pointerEvents: 'none' };
  const canvasStyle: React.CSSProperties = { width: '100%', height: '100%', display: 'block' };
  const labelBase: React.CSSProperties = { position: 'absolute', fontSize: 12, fontWeight: 700, pointerEvents: 'none', transform: 'translate(-50%,-50%)', textShadow: '0 1px 1px rgba(0,0,0,0.6)' };

  return (
    <div style={wrapperStyle}>
      <canvas ref={canvasRef} style={canvasStyle} />
      <span ref={labelXRef} style={{ ...labelBase, color: '#f04c4c' }}>X</span>
      <span ref={labelYRef} style={{ ...labelBase, color: '#27c65f' }}>Y</span>
      <span ref={labelZRef} style={{ ...labelBase, color: '#3b82f6' }}>Z</span>
    </div>
  );
};

export default Gizmo3D;
