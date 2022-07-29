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
  @State() picture;
  @State() picture_width;
  @State() picture_height;
  @State() result;
  @State() _model;

  @State() labels = ['daisy', 'dandelion', 'roses', 'sunflowers', 'tulips']

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

  componentDidLoad() {
    if (this.cam != undefined) {
      this.cam.start(1);
      this.cam.addEventListener('picture', e => {
        this.picture = e.detail;
        console.log('Picture in base 64:', e.detail);
        var i = new Image();

        i.onload = () => {
            this.picture_height = i.width;
            this.picture_width = i.height;
            console.log(this.picture_height, this.picture_width);
    
            var test = tf.browser.fromPixels(i).resizeBilinear([180, 180]);
            console.log(test.shape);
            const offset = tf.scalar(255.0);
            const normalized = tf.expandDims(test.div(offset), 0);

            var score = tf.softmax(tf.tensor(this._model.predict(normalized).arraySync()[0]));
            var confidence = tf.max(score).dataSync()[0];
            this.result = this.labels[tf.argMax(score).dataSync()[0]] + " with " + confidence;
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
  render() {
    return (
      <div>
        <header>
          <h1>Stencil App Starter</h1>
        </header>

        <main>
          {this.picture == undefined ? (
            <div id="camera-wrapper">
              <camera-component ref={el => (this.cam = el)} showPreview="true" allowGallery="true" />
            </div>
          ) : (
            <div>
              <p>Analyzing...</p>
              <img src={this.picture} width={this.picture_width} height={this.picture_height} />
              {this.result != undefined ? <p>Result: {this.result}</p> : null}
            </div>
          )}
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
