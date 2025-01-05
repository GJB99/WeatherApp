enum WeatherError: Error {
    case invalidURL
    case invalidResponse
    case invalidData
    case networkError(Error)
    
    var message: String {
        switch self {
            case .invalidURL: return "Invalid URL"
            case .invalidResponse: return "Invalid response from server"
            case .invalidData: return "Invalid data received"
            case .networkError(let error): return error.localizedDescription
        }
    }
} 