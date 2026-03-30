import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import SpeciesBrowser from './pages/SpeciesBrowser';
import SpeciesDetail from './pages/SpeciesDetail';
import ProteinDetail from './pages/ProteinDetail';
import Statistics from './pages/Statistics';
import Methods from './pages/Methods';
import MhcBrowser from './pages/MhcBrowser';
import MhcLocusDetail from './pages/MhcLocusDetail';
import MhcAlleleDetail from './pages/MhcAlleleDetail';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<SpeciesBrowser />} />
          <Route path="species/:speciesId" element={<SpeciesDetail />} />
          <Route path="protein/:proteinId" element={<ProteinDetail />} />
          <Route path="mhc" element={<MhcBrowser />} />
          <Route path="mhc/:locusId" element={<MhcLocusDetail />} />
          <Route path="mhc/:locusId/:alleleId" element={<MhcAlleleDetail />} />
          <Route path="stats" element={<Statistics />} />
          <Route path="methods" element={<Methods />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
