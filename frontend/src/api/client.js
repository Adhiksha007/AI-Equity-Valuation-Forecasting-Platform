import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  timeout: 180000, // 3 min — ML training can take time
})

export default client
