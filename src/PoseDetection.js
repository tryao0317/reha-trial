import * as tf from '@tensorflow/tfjs'
import * as posedetection from '@tensorflow-models/pose-detection'

export async function initPoseDetection(videoRef, canvasRef) {
  await tf.setBackend('webgl')
  await tf.ready()
  const detector = await posedetection.createDetector(
    posedetection.SupportedModels.MoveNet,
    { modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
  )

  const ctx = canvasRef.current.getContext('2d')

  async function render() {
    const poses = await detector.estimatePoses(videoRef.current)
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    if (poses.length > 0) {
      for (const keypoint of poses[0].keypoints) {
        if (keypoint.score > 0.4) {
          ctx.beginPath()
          ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI)
          ctx.fillStyle = 'red'
          ctx.fill()
        }
      }
    }
    requestAnimationFrame(render)
  }
  render()
}
