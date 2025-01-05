import SwiftUI

struct WeatherView: View {
    let weatherData: WeatherData
    
    var body: some View {
        VStack(spacing: 20) {
            // Location Header
            LocationHeaderView(location: weatherData.location)
            
            // Current Temperature
            TemperatureView(temperature: weatherData.temperature)
            
            // Weather Conditions
            WeatherConditionsView(condition: weatherData.condition)
            
            // Hourly Forecast
            HourlyForecastView(forecast: weatherData.hourlyForecast)
        }
        .padding()
    }
}

struct LocationHeaderView: View {
    let location: String
    
    var body: some View {
        Text(location)
            .font(.title)
            .foregroundColor(.white)
    }
}

struct TemperatureView: View {
    let temperature: Double
    
    var body: some View {
        Text("\(Int(temperature))°C")
            .font(.system(size: 96))
            .foregroundColor(.white)
    }
}

struct HourlyForecastView: View {
    let forecast: [HourlyForecast]
    
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 20) {
                ForEach(forecast) { hour in
                    VStack {
                        Text(formatHour(hour.time))
                        Text("\(Int(hour.temperature))°")
                    }
                    .foregroundColor(.white)
                }
            }
        }
    }
    
    private func formatHour(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter.string(from: date)
    }
} 