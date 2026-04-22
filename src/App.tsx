import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { TunerPage } from "./pages/TunerPage";
import { TabPracticePage } from "./pages/TabPracticePage";
import { EditorPage } from "./pages/EditorPage";
import { ScalePracticePage } from "./pages/ScalePracticePage";
import { RhythmPracticePage } from "./pages/RhythmPracticePage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tuner" element={<TunerPage />} />
        <Route path="/practice/tab/:presetId" element={<TabPracticePage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/editor/:id" element={<EditorPage />} />
        <Route path="/practice/scale" element={<ScalePracticePage />} />
        <Route path="/practice/rhythm" element={<RhythmPracticePage />} />
      </Route>
    </Routes>
  );
}

export default App;
