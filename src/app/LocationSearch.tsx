import { useState } from 'react'
import axios from 'axios'
import { MapPinIcon } from '@heroicons/react/24/solid'

interface SearchResult {
  name: string;
  lat: number;
  lon: number;
}

interface Props {
  onLocationSelect: (location: SearchResult) => void;
}

export default function LocationSearch({ onLocationSelect }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const searchLocations = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/geo/1.0/direct?q=${searchQuery}&limit=5&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
      )
      const searchResults = response.data.map((item: any) => ({
        name: `${item.name}, ${item.country}`,
        lat: item.lat,
        lon: item.lon
      }))
      setResults(searchResults)
    } catch (error) {
      console.error('Error searching locations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          searchLocations(e.target.value)
        }}
        placeholder="Search for a city..."
        className="w-full p-2 bg-white/10 rounded-lg text-white placeholder-white/60"
      />
      {isLoading && <p className="text-sm mt-2">Searching...</p>}
      {results.length > 0 && (
        <div className="absolute w-full mt-2 bg-white/90 backdrop-blur-lg rounded-lg overflow-hidden shadow-lg z-50">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => {
                onLocationSelect(result)
                setQuery('')
                setResults([])
              }}
              className="w-full p-2 text-left hover:bg-white/10 flex items-center gap-2 text-gray-800"
            >
              <MapPinIcon className="h-4 w-4" />
              {result.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}