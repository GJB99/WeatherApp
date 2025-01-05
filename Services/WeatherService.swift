import Foundation

class WeatherService {
    private let apiKey = APIConfig.googleAPIKey
    private let session = URLSession.shared
    
    func fetchWeatherData(latitude: Double, longitude: Double) async throws -> WeatherData {
        guard let url = URL(string: "\(APIConfig.baseURL)/weather?lat=\(latitude)&lon=\(longitude)&key=\(apiKey)") else {
            throw WeatherError.invalidURL
        }
        
        do {
            let (data, response) = try await session.data(from: url)
            
            guard let httpResponse = response as? HTTPURLResponse,
                  (200...299).contains(httpResponse.statusCode) else {
                throw WeatherError.invalidResponse
            }
            
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            
            return try decoder.decode(WeatherData.self, from: data)
        } catch let error as DecodingError {
            throw WeatherError.invalidData
        } catch {
            throw WeatherError.networkError(error)
        }
    }
    
    func fetchAirQuality(latitude: Double, longitude: Double) async throws -> AirQualityData {
        guard let url = URL(string: "\(APIConfig.baseURL)/currentConditions:lookup?key=\(apiKey)") else {
            throw WeatherError.invalidURL
        }
        
        let body = [
            "location": [
                "latitude": latitude,
                "longitude": longitude
            ]
        ]
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse,
                  (200...299).contains(httpResponse.statusCode) else {
                throw WeatherError.invalidResponse
            }
            
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            
            return try decoder.decode(AirQualityData.self, from: data)
        } catch let error as DecodingError {
            throw WeatherError.invalidData
        } catch {
            throw WeatherError.networkError(error)
        }
    }
} 