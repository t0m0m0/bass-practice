import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { TunerPage } from "./pages/TunerPage";
import { TabPracticePage } from "./pages/TabPracticePage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tuner" element={<TunerPage />} />
        <Route path="/practice/tab/:presetId" element={<TabPracticePage />} />
      </Route>
    </Routes>
  );
}

export default App;
