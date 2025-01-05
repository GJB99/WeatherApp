import SwiftUI

struct WeatherData: Codable {
    let temperature: Double
    let condition: WeatherCondition
    let location: String
    let hourlyForecast: [HourlyForecast]
}

struct HourlyForecast: Codable, Identifiable {
    let id = UUID()
    let time: Date
    let temperature: Double
    let condition: WeatherCondition
}

enum WeatherCondition: String, Codable {
    case sunny
    case rainy
    case icy
    case overcast
    case windy
    
    var backgroundColor: Color {
        switch self {
            case .sunny: return Color(hex: "#FF7E45")
            case .rainy: return Color(hex: "#4B95E9")
            case .icy: return Color(hex: "#E8F1F2")
            case .overcast: return Color(hex: "#808080")
            case .windy: return Color(hex: "#D3D3D3")
        }
    }
}

struct AirQualityData: Codable {
    let aqi: Int
    let category: String
    let uvIndex: Int
} 