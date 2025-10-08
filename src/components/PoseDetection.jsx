import React, { useEffect, useRef, useState } from "react";

/*
PoseDetection_final.jsx
- Left: camera canvas with landmarks + angles + feedback
- Right: template video (URL passed via prop or use defaults)
- Compares shoulder/elbow/hip/knee angles between camera and template (±15°)
- Loads MediaPipe Pose, DrawingUtils, CameraUtils from CDN at runtime (no npm imports)
Notes:
- Template video must allow CORS for frame read (crossOrigin="anonymous") OR be hosted where CORS is allowed.
- If template video cannot be processed due to CORS, template analysis will be disabled but playback will work.
*/

const MEDIAPIPE_VERSION = "0.5.1675469404";
const JOINTS_DEF = {
  left_shoulder: [23, 11, 13],
  right_shoulder: [24, 12, 14],
  left_elbow: [11, 13, 15],
  right_elbow: [12, 14, 16],
  left_hip: [11, 23, 25],
  right_hip: [12, 24, 26],
  left_knee: [23, 25, 27],
  right_knee: [24, 26, 28],
};

const DISPLAY_JOINTS = [
  "left_shoulder", "right_shoulder",
  "left_elbow", "right_elbow",
  "left_hip", "right_hip",
  "left_knee", "right_knee"
];

function calcAngle(a, b, c) {
  if (!a || !b || !c) return null;
  const AB = { x: a.x - b.x, y: a.y - b.y };
  const CB = { x: c.x - b.x, y: c.y - b.y };
  const dot = AB.x * CB.x + AB.y * CB.y;
  const magA = Math.hypot(AB.x, AB.y);
  const magC = Math.hypot(CB.x, CB.y);
  if (magA === 0 || magC === 0) return null;
  const cos = Math.max(-1, Math.min(1, dot / (magA * magC)));
  return (Math.acos(cos) * 180) / Math.PI;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.body.appendChild(s);
  });
}

export default function PoseDetection({
  templateVideoUrl = "", // pass from App or leave blank
  compareThreshold = 15 // degrees
}) {
  const camVideoRef = useRef(null);
  const camCanvasRef = useRef(null);
  const tplVideoRef = useRef(null);
  const tplCanvasRef = useRef(null); // optional debug
  const poseCamRef = useRef(null);
  const poseTplRef = useRef(null);
  const camCameraUtilRef = useRef(null);
  const [mediapipeReady, setMediapipeReady] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [targetAngles, setTargetAngles] = useState(null);
  const [camAngles, setCamAngles] = useState(null);

  useEffect(() => {
    let running = true;
    let camCameraInstance = null;

    const init = async () => {
      try {
        await loadScript(`https://cdn.jsdelivr.net/npm/@mediapipe/pose@${MEDIAPIPE_VERSION}/pose.js`);
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
      } catch (e) {
        console.error("Failed to load MediaPipe scripts", e);
        return;
      }

      if (!window.Pose || !window.drawConnectors || !window.drawLandmarks || !window.Camera) {
        console.error("MediaPipe not available on window.");
        return;
      }

      setMediapipeReady(true);

      // Template pose instance
      const poseTpl = new window.Pose.Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${MEDIAPIPE_VERSION}/${file}`,
      });
      poseTpl.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      poseTpl.onResults(onResultsTemplate);
      poseTplRef.current = poseTpl;

      // Camera pose instance
      const poseCam = new window.Pose.Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${MEDIAPIPE_VERSION}/${file}`,
      });
      poseCam.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      poseCam.onResults(onResultsCamera);
      poseCamRef.current = poseCam;

      // start camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        camVideoRef.current.srcObject = stream;
        camCameraInstance = new window.Camera(camVideoRef.current, {
          onFrame: async () => {
            if (!running) return;
            try { await poseCam.send({ image: camVideoRef.current }); } catch(e) {}
          },
          width: 1280,
          height: 720,
        });
        camCameraInstance.start();
        camCameraUtilRef.current = camCameraInstance;
      } catch (err) {
        console.error("Camera error", err);
        setPermissionDenied(true);
      }

      // start analyzing template frames (if URL provided)
      if (templateVideoUrl && tplVideoRef.current) {
        tplVideoRef.current.crossOrigin = "anonymous";
        tplVideoRef.current.src = templateVideoUrl;
        tplVideoRef.current.muted = true;
        tplVideoRef.current.playsInline = true;
        try { await tplVideoRef.current.play(); } catch(e) {}
        const loop = async () => {
          if (!running) return;
          if (poseTplRef.current && tplVideoRef.current.readyState >= 2 && !tplVideoRef.current.paused) {
            try { await poseTplRef.current.send({ image: tplVideoRef.current }); } catch(e) { /* CORS may block */ }
          }
          requestAnimationFrame(loop);
        };
        loop();
      }
    };

    init();

    return () => {
      running = false;
      try { if (camCameraInstance && camCameraInstance.stop) camCameraInstance.stop(); } catch(e) {}
      try { if (poseCamRef.current && poseCamRef.current.close) poseCamRef.current.close(); } catch(e) {}
      try { if (poseTplRef.current && poseTplRef.current.close) poseTplRef.current.close(); } catch(e) {}
    };
  }, [templateVideoUrl]);

  function onResultsTemplate(results) {
    if (!results || !results.poseLandmarks) return;
    const lm = results.poseLandmarks;
    const angles = {};
    DISPLAY_JOINTS.forEach(jn => {
      const ids = JOINTS_DEF[jn];
      if (!ids) { angles[jn] = null; return; }
      angles[jn] = calcAngle(lm[ids[0]], lm[ids[1]], lm[ids[2]]);
    });
    setTargetAngles(angles);

    // optional debug draw to tplCanvasRef
    const canvas = tplCanvasRef.current;
    if (canvas && results.image) {
      const ctx = canvas.getContext("2d");
      canvas.width = results.image.width; canvas.height = results.image.height;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(results.image,0,0,canvas.width,canvas.height);
      const filtered = window.Pose.POSE_CONNECTIONS.filter(([a,b]) => a>10 && b>10);
      window.drawConnectors(ctx, results.poseLandmarks, filtered, { color: "#999", lineWidth: 2 });
      window.drawLandmarks(ctx, results.poseLandmarks, { color: "#fff", lineWidth: 1 });
    }
  }

  function onResultsCamera(results) {
    const canvas = camCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (!results || !results.poseLandmarks) {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      return;
    }

    const w = results.image.width || 640;
    const h = results.image.height || 480;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
    }

    ctx.save();
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(results.image,0,0,canvas.width,canvas.height);

    const lm = results.poseLandmarks;
    const filtered = window.Pose.POSE_CONNECTIONS.filter(([a,b]) => a>10 && b>10);
    window.drawConnectors(ctx, lm, filtered, { color: "#00FF00", lineWidth: 3 });

    // draw key landmarks as white
    const keyIdx = [11,12,13,14,15,16,23,24,25,26,27,28];
    ctx.fillStyle = "white";
    keyIdx.forEach(i => {
      const p = lm[i];
      if (!p) return;
      const x = p.x * canvas.width;
      const y = p.y * canvas.height;
      ctx.beginPath();
      ctx.arc(x,y,5,0,Math.PI*2);
      ctx.fill();
    });

    // compute and draw angles + feedback
    const camComputed = {};
    DISPLAY_JOINTS.forEach(jn => {
      const ids = JOINTS_DEF[jn];
      if (!ids) { camComputed[jn] = null; return; }
      const a = lm[ids[0]], b = lm[ids[1]], c = lm[ids[2]];
      const ang = calcAngle(a,b,c);
      camComputed[jn] = ang;

      if (b) {
        const px = b.x * canvas.width;
        const py = b.y * canvas.height;
        let color = "white";
        if (targetAngles && targetAngles[jn] != null && ang != null) {
          const diff = Math.abs(ang - targetAngles[jn]);
          color = diff <= compareThreshold ? "white" : "red";
        }
        ctx.fillStyle = color;
        ctx.font = "18px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(ang == null ? "--" : `${Math.round(ang)}°`, px, py - 12);
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI*2);
        ctx.fill();
      }
    });
    setCamAngles(camComputed);
    ctx.restore();
  }

  return (
    <div style={{display:"flex", gap:16, alignItems:"flex-start", width:"100%"}}>
      <div style={{flex:1, maxWidth:"65%", position:"relative"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
          <h3 style={{margin:0}}>Camera</h3>
          <div style={{fontSize:12, color: permissionDenied ? "red":"#333"}}>{permissionDenied ? "Camera access denied" : (mediapipeReady ? "Ready" : "Loading MediaPipe...")}</div>
        </div>
        <div style={{position:"relative", background:"#000", borderRadius:8, overflow:"hidden"}}>
          <video ref={camVideoRef} style={{display:"none"}} playsInline muted />
          <canvas ref={camCanvasRef} width={640} height={480} style={{width:"100%", height:"auto", display:"block"}}/>
        </div>
      </div>

      <div style={{width:"35%", minWidth:320}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
          <h3 style={{margin:0}}>Template</h3>
          <div style={{fontSize:12, color:"#333"}}>{templateVideoUrl ? "Analyzing" : "No template URL"}</div>
        </div>
        <div style={{background:"#eee", borderRadius:8, overflow:"hidden"}}>
          <video ref={tplVideoRef} width="100%" style={{display:"block"}} controls />
          <canvas ref={tplCanvasRef} style={{display:"none"}} />
        </div>

        <div style={{marginTop:12}}>
          <h4 style={{margin:"8px 0"}}>Comparison</h4>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
            <div style={{fontWeight:600}}>Joint</div>
            <div style={{fontWeight:600}}>Status</div>
            {DISPLAY_JOINTS.map(jn => {
              const cam = camAngles && camAngles[jn] != null ? Math.round(camAngles[jn]) : "--";
              const tpl = targetAngles && targetAngles[jn] != null ? Math.round(targetAngles[jn]) : "--";
              let status = "—";
              if (cam !== "--" && tpl !== "--" && cam !== null && tpl !== null) {
                status = Math.abs(cam - tpl) <= compareThreshold ? "OK" : "NG";
              }
              return (
                <React.Fragment key={jn}>
                  <div style={{padding:6, background:"#fafafa", borderRadius:6}}>{jn.replace("_"," ").toUpperCase()}</div>
                  <div style={{padding:6, borderRadius:6, background: status==="OK" ? "#fff" : "#ffecec", color: status==="OK" ? "#000":"#b00000"}}>
                    {status}
                    <div style={{fontSize:12, color:"#666"}}>{cam}° / {tpl}°</div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
