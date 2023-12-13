import React, { useRef } from 'react'

const video = document.createElement("video")
video.style.position = 'absolute'
video.style.top = 0
video.style.right = 0
// video.style.visibility = 'hidden'
video.autoplay = true
video.muted = true
video.playsInline = true
video.width = 500
video.height = 300

export default function ScreenShot() {


  const handleStart = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      preferCurrentTab: true,
      video: { frameRate: 50 },
    })

    video.srcObject = stream
  }


  const handleStop = () => {
    video.srcObject.getTracks().forEach((t) => t.stop());
    video.srcObject = null
  }

  return (
    <div className='fixed top-0 right-0 p-3 flex gap-3'>
      <Button onClick={handleStart}>Start</Button>
      <Button onClick={handleStop}>Stop</Button>
    </div>
  )
}

const Button = ({ children, onClick }) => {
  return <button onClick={onClick} className="bg-[#111] py-1 px-2 text-lg opacity-80 hover:opacity-100 cursor-pointer">{children}</button>
}