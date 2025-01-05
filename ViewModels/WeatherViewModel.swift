import SwiftUI
import CoreLocation

@MainActor
class WeatherViewModel: ObservableObject {
    @Published var weatherData: WeatherData?
    @Published var airQuality: AirQualityData?
    @Published var isLoading = false
    @Published var error: Error?
    
    private let weatherService = WeatherService()
    private let locationManager = LocationManager()
    
    func fetchWeather(for location: CLLocation) async {
        isLoading = true
        do {
            async let weather = weatherService.fetchWeatherData(
                latitude: location.coordinate.latitude,
                longitude: location.coordinate.longitude
            )
            async let airQuality = weatherService.fetchAirQuality(
                latitude: location.coordinate.latitude,
                longitude: location.coordinate.longitude
            )
            
            self.weatherData = try await weather
            self.airQuality = try await airQuality
        } catch {
            self.error = error
        }
        isLoading = false
    }
} 