import { Component, h, State } from '@stencil/core';
import 'camera-component';
import * as tf from '@tensorflow/tfjs';

@Component({
  tag: 'app-root',
  styleUrl: 'app-root.css',
  shadow: true,
})
export class AppRoot {
  @State() cam;
  @State() player;
  @State() video;
  @State() picture;
  @State() picture_width;
  @State() picture_height;
  @State() result;
  @State() _model;

  @State() canvas;

  @State() labels = ['daisy', 'dandelion', 'roses', 'sunflowers', 'tulips'];

  componentWillLoad() {
    // @ts-ignore
    // this._model = tf.loadLayersModel('assets/model.json');
    tf.loadLayersModel('assets/model.json').then(model => {
      this._model = model;
      console.log('model loaded');
    });
    // this._model = tf.sequential();
    // this._model.add(tf.layers.dense({ units: 1, inputShape: [1] }));

    // this._model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });

    // // Generate some synthetic data for training.
    // const xs = tf.tensor2d([1, 2, 3, 4], [4, 1]);
    // const ys = tf.tensor2d([1, 3, 5, 7], [4, 1]);

    // // Train the this._model using the data.
    // this._model.fit(xs, ys, { epochs: 10 }).then(() => {
    //   // Use the model to do inference on a data point the model hasn't seen before:
    //   // Open the browser devtools to see the output
    // });
  }

  async componentDidLoad() {
    // If the permission to use the webcam is approved, the webcam streaming video is designated as the source object of the "player".
    // var handleSuccess = stream => {
    //   //@ts-ignore
    //   this.player.srcObject = stream;
    // };

    // navigator.mediaDevices
    //   .getUserMedia({
    //     audio: false,
    //     video: {
    //       facingMode: 'environment',
    //     },
    //   })
    //   .then(handleSuccess);

    this.video = await tf.data.webcam(this.player, {
      resizeWidth: 180,
      resizeHeight: 180,
      facingMode: 'environment',
    });

    if (this.cam != undefined) {
      this.cam.addEventListener('picture', e => {
        this.picture = e.detail;
        console.log('Picture in base 64:', e.detail);
        var i = new Image();

        i.onload = () => {
          this.picture_height = i.width;
          this.picture_width = i.height;
          console.log(this.picture_height, this.picture_width);

          var test = tf.browser.fromPixels(i).resizeBilinear([180, 180]);
          const offset = tf.scalar(255.0);
          const normalized = tf.expandDims(test.div(offset), 0);

          var score = tf.softmax(tf.tensor(this._model.predict(normalized).arraySync()[0]));
          var confidence = tf.max(score).dataSync()[0];
          this.result = this.labels[tf.argMax(score).dataSync()[0]] + ' with ' + confidence;
        };

        i.src = e.detail;
        i.crossOrigin = 'anonymous';
        // i.src = 'https://storage.googleapis.com/download.tensorflow.org/example_images/592px-Red_sunflower.jpg';

        this.cam.stop();
      });
      this.cam.addEventListener('backButton', () => console.log('backButton'));
      this.cam.addEventListener('webcamStop', () => {
        // this.cam.stop();
        console.log('webcamStop');
      });
    }
  }

  async takePicture() {
    // Capture an image from the webcam using the Tensorflow.js data API
    //and store it as a tensor (resize to 224 x 224 size for mobilenet delivery).

    const img = await this.video.capture();
    // video.stop();
    // tf.browser.toPixels(img, this.canvas).then(data => {
    //   // this.canvas
    // });

    var test = img;
    const offset = tf.scalar(255.0);
    const normalized = tf.expandDims(test.div(offset), 0);

    var score = tf.softmax(tf.tensor(this._model.predict(normalized).arraySync()[0]));
    var confidence = tf.max(score).dataSync()[0];
    this.result = this.labels[tf.argMax(score).dataSync()[0]] + ' with ' + confidence;

    img.dispose();
    console.log('takePicture');
  }
  render() {
    return (
      <div>
        <header>
          <h1>Stencil App Starter</h1>
        </header>

        <main>
          {/* <button
            onClick={() => {
              this.cam.start(1);
              this.picture = undefined;
            }}
          >
            Start Camera
          </button> */}

          <button
            onClick={() => {
              this.takePicture();
              this.picture = undefined;
            }}
          >
            Take Picture
          </button>
          <div>
            Detectable Labels:
            <ul>
              {this.labels.map(label => (
                <li>{label}</li>
              ))}
            </ul>
          </div>
          <video ref={el => (this.player = el)} width="320" height="240" autoplay playsinline muted></video>
          <div id="camera-wrapper">
            <camera-component ref={el => (this.cam = el)} showPreview="true" allowGallery="true" />
          </div>
          {this.picture == undefined ? null : (
            <div>
              <p>Analyzing...</p>
              <img src={this.picture} width={this.picture_width} height={this.picture_height} />
            </div>
          )}
          <canvas ref={el => (this.canvas = el)} width="320" height="240"></canvas>
          {this.result != undefined ? <p>Result: {this.result}</p> : null}
          {/* <camera-controller ref={el => (this.controller = el)}></camera-controller> */}
          {/* <button onClick={() => this.cam.flipCam()}>Flip</button>
          <button onClick={() => this.cam.takePicture()}>Take picture</button>
          <button onClick={() => this.cam.stopWebcam()}>Stop cam</button> */}
          {/* <stencil-router>
            <stencil-route-switch scrollTopOffset={0}>
              <stencil-route url="/" component="app-home" exact={true} />
              <stencil-route url="/profile/:name" component="app-profile" />
            </stencil-route-switch>
          </stencil-router> */}
        </main>
      </div>
    );
  }
}
