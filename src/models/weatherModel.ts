import * as tf from '@tensorflow/tfjs';

export interface WeatherDataPoint {
  temperature: number;
  humidity: number;
  windSpeed: number;
}

export class WeatherPredictor {
  private model: tf.LayersModel;

  constructor() {
    this.model = this.createModel();
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential();
    
    // Input layer for temperature, humidity, and wind speed
    model.add(tf.layers.dense({
      inputShape: [3],
      units: 32,
      activation: 'relu'
    }));

    // Hidden layer
    model.add(tf.layers.dense({
      units: 16,
      activation: 'relu'
    }));

    // Output layer for predicting next 5 hours
    model.add(tf.layers.dense({
      units: 5,
      activation: 'linear'
    }));

    model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'meanSquaredError'
    });

    return model;
  }

  async trainModel(historicalData: WeatherDataPoint[]): Promise<void> {
    // Prepare training data
    const inputData = historicalData.map(point => [
      point.temperature,
      point.humidity,
      point.windSpeed
    ]);

    // Generate target data (simple pattern for demonstration)
    const targetData = historicalData.map(point => [
      point.temperature * 1.1,
      point.temperature * 1.05,
      point.temperature,
      point.temperature * 0.95,
      point.temperature * 0.9
    ]);

    const xs = tf.tensor2d(inputData);
    const ys = tf.tensor2d(targetData);

    await this.model.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      shuffle: true
    });

    xs.dispose();
    ys.dispose();
  }

  predict(currentData: WeatherDataPoint): number[] {
    const input = tf.tensor2d([[
      currentData.temperature,
      currentData.humidity,
      currentData.windSpeed
    ]]);

    const prediction = this.model.predict(input) as tf.Tensor;
    const result = prediction.dataSync();

    input.dispose();
    prediction.dispose();

    return Array.from(result);
  }
}