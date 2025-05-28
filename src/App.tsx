import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { WeatherPredictor, WeatherDataPoint } from './models/weatherModel';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface WeatherData {
  name: string;
  main: {
    temp: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
}

const App: React.FC = () => {
  const [city, setCity] = useState<string>('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [recommendation, setRecommendation] = useState<string>('');
  const [prediction, setPrediction] = useState<number[]>([]);
  const [historicalData, setHistoricalData] = useState<WeatherDataPoint[]>([]);
  const weatherPredictor = useRef<WeatherPredictor>(new WeatherPredictor());

  const apiKey = "c595615a29198a33ff51ff32b5ec4919";
  const apiUrl = "https://api.openweathermap.org/data/2.5/weather?&units=metric&q=";

  useEffect(() => {
    // Simulate historical data for training
    const generateHistoricalData = () => {
      const data: WeatherDataPoint[] = [];
      for (let i = 0; i < 100; i++) {
        data.push({
          temperature: 20 + Math.random() * 10,
          humidity: 50 + Math.random() * 30,
          windSpeed: 5 + Math.random() * 10
        });
      }
      return data;
    };

    const initializeModel = async () => {
      const historicalData = generateHistoricalData();
      setHistoricalData(historicalData);
      await weatherPredictor.current.trainModel(historicalData);
    };

    initializeModel();
  }, []);

  const getClothingRecommendation = (temp: number, weather: string) => {
    if (temp < 10) return "Heavy coat, scarf, and warm layers recommended";
    if (temp < 20) return "Light jacket or sweater would be comfortable";
    return "Light clothing suitable for warm weather";
  };

  const fetchWeather = async () => {
    try {
      const response = await axios.get(`${apiUrl}${city}&appid=${apiKey}`);
      setWeatherData(response.data);
      
      // Generate clothing recommendation
      const recommendation = getClothingRecommendation(
        response.data.main.temp,
        response.data.weather[0].main
      );
      setRecommendation(recommendation);

      // Get ML predictions
      const currentData: WeatherDataPoint = {
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed
      };

      const predictions = weatherPredictor.current.predict(currentData);
      setPrediction(predictions);

    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-500 py-10">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden p-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter City Name"
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={fetchWeather}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Search
          </button>
        </div>

        {weatherData && (
          <div className="mt-6">
            <h1 className="text-4xl font-bold text-center">{weatherData.main.temp}°C</h1>
            <h2 className="text-2xl text-center mt-2">{weatherData.name}</h2>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center">
                <p className="text-gray-600">Humidity</p>
                <p className="text-xl">{weatherData.main.humidity}%</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600">Wind Speed</p>
                <p className="text-xl">{weatherData.wind.speed} km/h</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold">AI Recommendation:</h3>
              <p className="text-gray-700">{recommendation}</p>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold">ML Temperature Prediction:</h3>
              <Line
                data={{
                  labels: ['1h', '2h', '3h', '4h', '5h'],
                  datasets: [{
                    label: 'Predicted Temperature (°C)',
                    data: prediction,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                  }]
                }}
                options={{
                  responsive: true,
                  scales: {
                    y: {
                      beginAtZero: false
                    }
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;