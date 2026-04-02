import axios from 'axios'

const rawBase = import.meta.env.VITE_API_URL || ''
const baseURL = rawBase ? `${rawBase.replace(/\/$/, '')}/api` : '/api'

const client = axios.create({
  baseURL,
  timeout: 180000, // 3 min — ML training can take time
})

export default client
