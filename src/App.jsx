import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Layout from './components/Layouts/Layout'
import Home from './pages/unauthenticated/Home'

import SimpleHeartRateTest from './pages/authenticated/SimpleHeartRateTest'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="livemeasurment" element={<SimpleHeartRateTest/>}/>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
