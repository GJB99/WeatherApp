import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = WeatherViewModel()
    @StateObject private var locationManager = LocationManager()
    
    var body: some View {
        ZStack {
            // Background color based on weather
            viewModel.weatherData?.condition.backgroundColor
                .ignoresSafeArea()
            
            if let weatherData = viewModel.weatherData {
                WeatherView(weatherData: weatherData)
            } else {
                ProgressView()
            }
        }
        .task {
            if let location = locationManager.location {
                await viewModel.fetchWeather(for: location)
            }
        }
        .onAppear {
            locationManager.requestLocation()
        }
    }
} 