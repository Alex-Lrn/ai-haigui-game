import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom'
import Game from './pages/Game'
import Home from './pages/Home'
import Result from './pages/Result'
import NeonLayout from './components/NeonLayout'

function GameRoute() {
  const { id } = useParams()
  return <Game key={id} />
}

function ResultRoute() {
  const { id } = useParams()
  return <Result key={id} />
}

export default function App() {
  return (
    <BrowserRouter>
      <NeonLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/:id" element={<GameRoute />} />
          <Route path="/result/:id" element={<ResultRoute />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </NeonLayout>
    </BrowserRouter>
  )
}
