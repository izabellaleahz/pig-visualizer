import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import SpeciesBrowser from './pages/SpeciesBrowser';
import SpeciesDetail from './pages/SpeciesDetail';
import ProteinDetail from './pages/ProteinDetail';
import Statistics from './pages/Statistics';
import Methods from './pages/Methods';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<SpeciesBrowser />} />
          <Route path="species/:speciesId" element={<SpeciesDetail />} />
          <Route path="protein/:proteinId" element={<ProteinDetail />} />
          <Route path="stats" element={<Statistics />} />
          <Route path="methods" element={<Methods />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
