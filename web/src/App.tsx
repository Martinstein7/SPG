import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import './App.css';

function App() {
  return (
    <div className="flex h-screen bg-dark-base font-sans overflow-hidden">
      <Sidebar />
      <MainContent />
    </div>
  );
}

export default App;
