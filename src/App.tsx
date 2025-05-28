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
  const [isLoading, setIsLoading] = useState<boolean>(false);
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
        return 'bg-gradient-to-br from-blue-400 via-blue-300 to-yellow-200';
      case 'clouds':
        return 'bg-gradient-to-br from-gray-400 via-blue-200 to-gray-300';
      case 'rain':
        return 'bg-gradient-to-br from-gray-700 via-blue-500 to-gray-600';
      case 'snow':
        return 'bg-gradient-to-br from-blue-100 via-white to-blue-50';
      case 'thunderstorm':
        return 'bg-gradient-to-br from-gray-900 via-purple-600 to-gray-800';
      case 'drizzle':
        return 'bg-gradient-to-br from-gray-500 via-blue-400 to-gray-400';
      case 'mist':
        return 'bg-gradient-to-br from-gray-300 via-gray-200 to-gray-400';
      default:
        return 'bg-gradient-to-br from-purple-600 via-blue-500 to-purple-400';
    }
  };

  const getWeatherIcon = (weatherType: string) => {
    const iconMap: { [key: string]: string } = {
      clear: '☀️',
      clouds: '☁️',
      rain: '🌧️',
      snow: '❄️',
      thunderstorm: '⛈️',
      drizzle: '🌦️',
      mist: '🌫️'
    };
    return iconMap[weatherType?.toLowerCase()] || '🌡️';
  };

  const getClothingRecommendation = (temp: number, weather: string) => {
    if (temp < 0) return "❄️ Bundle up! Heavy winter coat, gloves, scarf, and warm boots essential";
    if (temp < 10) return "🧥 Warm coat, scarf, and layers recommended";
    if (temp < 20) return "🧥 Light jacket or sweater would be comfortable";
    if (temp < 25) return "👕 Pleasant temperature - light clothing suitable";
    return "👕 Light, breathable clothing recommended for warm weather";
  };

  const fetchWeather = async () => {
    if (!city.trim()) return;
    
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${weatherBackground} transition-all duration-1000`}>
      <div className="min-h-screen backdrop-blur-sm py-10 px-4">
        <div className="max-w-lg mx-auto">
          <div className="weather-card glass-effect rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
            <div className="p-8">
              <div className="flex gap-3 mb-8">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter City Name"
                  className="flex-1 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300"
                  onKeyPress={(e) => e.key === 'Enter' && fetchWeather()}
                />
                <button
                  onClick={fetchWeather}
                  disabled={isLoading}
                  className={`px-6 rounded-2xl bg-white/20 hover:bg-white/30 transition-all duration-300 text-white font-semibold backdrop-blur-md border border-white/30 ${
                    isLoading ? 'animate-pulse' : ''
                  }`}
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </div>

              {weatherData && (
                <div className="space-y-8">
                  <div className="text-center">
                    <div className="text-8xl mb-4">{getWeatherIcon(weatherData.weather[0].main)}</div>
                    <h1 className="text-7xl font-bold mb-2 gradient-text">{weatherData.main.temp}°C</h1>
                    <h2 className="text-3xl font-light text-white/90">{weatherData.name}</h2>
                    <p className="text-xl mt-2 text-white/80 capitalize">{weatherData.weather[0].description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl glass-effect">
                      <p className="text-white/70">Humidity</p>
                      <p className="text-2xl font-semibold text-white">
                        {weatherData.main.humidity}%
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl glass-effect">
                      <p className="text-white/70">Wind Speed</p>
                      <p className="text-2xl font-semibold text-white">
                        {weatherData.wind.speed} km/h
                      </p>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl glass-effect">
                    <h3 className="text-xl font-semibold mb-2 text-white">AI Recommendation</h3>
                    <p className="text-white/90">{recommendation}</p>
                  </div>

                  <div className="p-6 rounded-2xl glass-effect">
                    <h3 className="text-xl font-semibold mb-4 text-white">Temperature Forecast</h3>
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
    </div>
  );
};

export default App;