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
  const [weatherBackground, setWeatherBackground] = useState<string>('');
  const weatherPredictor = useRef<WeatherPredictor>(new WeatherPredictor());

  const apiKey = "c595615a29198a33ff51ff32b5ec4919";
  const apiUrl = "https://api.openweathermap.org/data/2.5/weather?&units=metric&q=";

  useEffect(() => {
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

  const getWeatherBackground = (weatherType: string) => {
    switch (weatherType?.toLowerCase()) {
      case 'clear':
        return 'bg-gradient-to-br from-blue-400 to-yellow-200';
      case 'clouds':
        return 'bg-gradient-to-br from-gray-400 to-blue-300';
      case 'rain':
        return 'bg-gradient-to-br from-gray-700 to-blue-600';
      case 'snow':
        return 'bg-gradient-to-br from-blue-100 to-gray-200';
      case 'thunderstorm':
        return 'bg-gradient-to-br from-gray-900 to-purple-700';
      default:
        return 'bg-gradient-to-br from-purple-600 to-blue-500';
    }
  };

  const getClothingRecommendation = (temp: number, weather: string) => {
    if (temp < 10) return "Heavy coat, scarf, and warm layers recommended";
    if (temp < 20) return "Light jacket or sweater would be comfortable";
    return "Light clothing suitable for warm weather";
  };

  const fetchWeather = async () => {
    try {
      const response = await axios.get(`${apiUrl}${city}&appid=${apiKey}`);
      setWeatherData(response.data);
      setWeatherBackground(getWeatherBackground(response.data.weather[0].main));
      
      const recommendation = getClothingRecommendation(
        response.data.main.temp,
        response.data.weather[0].main
      );
      setRecommendation(recommendation);

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
    <div className={`min-h-screen ${weatherBackground} transition-all duration-1000 py-10 px-4`}>
      <div className="max-w-lg mx-auto backdrop-blur-lg bg-white/30 rounded-3xl shadow-2xl overflow-hidden">
        <div className="relative overflow-hidden p-8">
          <div className="absolute inset-0 backdrop-blur-sm bg-white/10"></div>
          <div className="relative z-10">
            <div className="flex gap-3">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter City Name"
                className="flex-1 p-4 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                onKeyPress={(e) => e.key === 'Enter' && fetchWeather()}
              />
              <button
                onClick={fetchWeather}
                className="px-6 py-4 rounded-2xl bg-white/20 hover:bg-white/30 transition-all duration-300 text-white font-semibold backdrop-blur-md border border-white/30"
              >
                Search
              </button>
            </div>

            {weatherData && (
              <div className="mt-8 text-white">
                <div className="text-center mb-8">
                  <h1 className="text-7xl font-bold mb-2">{weatherData.main.temp}°C</h1>
                  <h2 className="text-3xl font-light">{weatherData.name}</h2>
                  <p className="text-xl mt-2 text-white/80">{weatherData.weather[0].main}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-md">
                    <p className="text-white/70">Humidity</p>
                    <p className="text-2xl font-semibold">{weatherData.main.humidity}%</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-md">
                    <p className="text-white/70">Wind Speed</p>
                    <p className="text-2xl font-semibold">{weatherData.wind.speed} km/h</p>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white/20 backdrop-blur-md mb-8">
                  <h3 className="text-xl font-semibold mb-2">AI Recommendation</h3>
                  <p className="text-white/90">{recommendation}</p>
                </div>

                <div className="p-6 rounded-2xl bg-white/20 backdrop-blur-md">
                  <h3 className="text-xl font-semibold mb-4">Temperature Forecast</h3>
                  <Line
                    data={{
                      labels: ['1h', '2h', '3h', '4h', '5h'],
                      datasets: [{
                        label: 'Predicted Temperature (°C)',
                        data: prediction,
                        borderColor: 'rgba(255, 255, 255, 0.8)',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        tension: 0.4,
                        fill: true
                      }]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          labels: {
                            color: 'white'
                          }
                        }
                      },
                      scales: {
                        y: {
                          grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                          },
                          ticks: {
                            color: 'white'
                          }
                        },
                        x: {
                          grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                          },
                          ticks: {
                            color: 'white'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;