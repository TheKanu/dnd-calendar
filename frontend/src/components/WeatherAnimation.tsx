import React from 'react';
import './WeatherAnimation.css';

interface WeatherAnimationProps {
  weatherType: string;
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
}

const WeatherAnimation: React.FC<WeatherAnimationProps> = ({ weatherType, season = 'summer' }) => {
  const renderRaindrops = (count: number = 15) => {
    return Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        className="raindrop"
        style={{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 2}s`,
          animationDuration: `${0.5 + Math.random() * 0.5}s`
        }}
      />
    ));
  };

  const renderSnowflakes = (count: number = 20) => {
    return Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        className="snowflake"
        style={{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${2 + Math.random() * 2}s`,
          fontSize: `${8 + Math.random() * 6}px`
        }}
      >
        ❄
      </div>
    ));
  };

  const renderClouds = (count: number = 3) => {
    return Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        className="cloud"
        style={{
          left: `${10 + i * 30}%`,
          top: `${5 + i * 5}%`,
          animationDelay: `${i * 0.5}s`
        }}
      >
        ☁️
      </div>
    ));
  };

  const renderLightning = () => {
    return (
      <div className="lightning-container">
        <div className="lightning" />
        <div className="lightning lightning-2" />
      </div>
    );
  };

  const renderSunRays = () => {
    return (
      <div className="sun-rays">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="sun-ray"
            style={{ transform: `rotate(${i * 45}deg)` }}
          />
        ))}
      </div>
    );
  };

  const renderFogClouds = () => {
    return (
      <div className="fog-layers">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="fog-layer"
            style={{
              left: `${i * 15 - 10}%`,
              top: `${20 + i * 10}%`,
              animationDelay: `${i * 0.8}s`
            }}
          >
            🌫️
          </div>
        ))}
      </div>
    );
  };

  const renderWindElements = () => {
    return (
      <div className="wind-effects">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="wind-line"
            style={{
              top: `${10 + i * 10}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${1 + Math.random() * 0.5}s`
            }}
          />
        ))}
        <div className="wind-emoji">💨</div>
      </div>
    );
  };

  const renderSeasonalElements = () => {
    if (season === 'autumn' && weatherType !== 'thunderstorm' && weatherType !== 'fog') {
      return (
        <div className="falling-leaves">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="leaf"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            >
              🍂
            </div>
          ))}
        </div>
      );
    }

    if (season === 'spring' && (weatherType === 'sunny' || weatherType === 'partly_cloudy')) {
      return (
        <div className="spring-petals">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="petal"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${4 + Math.random() * 2}s`
              }}
            >
              🌸
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  const getWeatherAnimation = () => {
    switch (weatherType) {
      case 'thunderstorm':
        return (
          <div className="weather-animation thunderstorm">
            {renderClouds(4)}
            {renderRaindrops(25)}
            {renderLightning()}
          </div>
        );
        
      case 'rain':
        return (
          <div className="weather-animation rain">
            {renderClouds(3)}
            {renderRaindrops(20)}
          </div>
        );

      case 'snow':
        return (
          <div className="weather-animation snow">
            {renderClouds(4)}
            {renderSnowflakes(25)}
          </div>
        );
        
      case 'cloudy':
        return (
          <div className="weather-animation cloudy">
            {renderClouds(5)}
          </div>
        );
        
      case 'partly_cloudy':
        return (
          <div className="weather-animation partly-cloudy">
            {renderSunRays()}
            {renderClouds(2)}
            {renderSeasonalElements()}
          </div>
        );
        
      case 'sunny':
        return (
          <div className="weather-animation sunny">
            {renderSunRays()}
            {renderSeasonalElements()}
          </div>
        );

      case 'fog':
        return (
          <div className="weather-animation fog">
            {renderFogClouds()}
          </div>
        );

      case 'wind':
        return (
          <div className="weather-animation wind">
            {renderWindElements()}
            {renderSeasonalElements()}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="weather-overlay">
      {getWeatherAnimation()}
    </div>
  );
};

export default WeatherAnimation;