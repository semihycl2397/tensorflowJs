'use client';

import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

export default function Home() {
  const [model, setModel] = useState(null);
  const [imageURL, setImageURL] = useState(null);
  const inputRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const loadModel = async () => {
      await tf.setBackend('webgl');
      const model = await blazeface.load();
      setModel(model);
    };
    loadModel();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      const url = URL.createObjectURL(file);
      setImageURL(url);
    }
  };

  const detectFace = async () => {
    if (!model || !imageURL) return;

    const img = new Image();
    img.src = imageURL;
    img.onload = async () => {
      const predictions = await model.estimateFaces(img, false);
      console.log(predictions); // Tespit edilen yüzlerin koordinatlarını konsola logla
      if (predictions.length > 0) {
        drawPredictions(predictions, img);
      } else {
        console.log('No faces detected');
      }
    };
  };

  const drawPredictions = (predictions, img) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);

    predictions.forEach((prediction) => {
      const [startX, startY] = prediction.topLeft;
      const [endX, endY] = prediction.bottomRight;
      const width = endX - startX;
      const height = endY - startY;

      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, startY, width, height);

      const landmarks = prediction.landmarks;
      ctx.fillStyle = 'blue';
      landmarks.forEach((landmark) => {
        ctx.beginPath();
        ctx.arc(landmark[0], landmark[1], 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    });
  };

  return (
    <div>
      <h1>Face Recognition with TensorFlow.js</h1>
      <input type="file" accept="image/*" onChange={handleImageUpload} ref={inputRef} />
      <button onClick={detectFace}>Detect Face in Image</button>
      <div>
        {imageURL && (
          <div>
            <img src={imageURL} alt="Uploaded" style={{ display: 'none' }} />
            <canvas ref={canvasRef} />
          </div>
        )}
      </div>
    </div>
  );
}
